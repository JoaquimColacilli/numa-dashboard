-- Los repartos de cada cobro por la fila (ADR 0078): una fila por paso y por parte de cada liquidación,
-- congelada como el resto de la distribución (ADR 0003), y la fila con la que se liquidó cada proyecto.
--
-- Aditiva. Una tabla nueva, solo de lectura para la app: la escriben private.liquidar() y
-- private.revertir_liquidacion(). Cuatro columnas nuevas en public.proyectos, en null, así el alter no
-- reescribe ninguna fila, con dos checks que miran solo las columnas nuevas. El reemplazo de
-- bootstrap() y delta(), que suman una clave. Ninguna fila existente cambia.


-- Los repartos -------------------------------------------------------------------------------------------

create table public.repartos (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  proyecto_id uuid not null,
  posicion smallint not null,
  tesoro_id uuid not null,
  nombre text not null,
  tipo text not null,
  clase text,
  objetivo_centavos bigint,
  previo_centavos bigint,
  tope_centavos bigint,
  por_mes boolean,
  porcentaje_bp integer,
  monto_centavos bigint not null,
  fecha date not null,
  ya_en_la_apertura boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  -- Compuestas: el reparto es de un proyecto y va a un tesoro del mismo taller.
  constraint repartos_proyecto_fk foreign key (household_id, proyecto_id)
    references public.proyectos (household_id, id),
  constraint repartos_tesoro_fk foreign key (household_id, tesoro_id)
    references public.tesoros (household_id, id),
  constraint repartos_posicion_valida check (posicion >= 1),
  constraint repartos_nombre_valido check (char_length(nombre) between 1 and 200),
  constraint repartos_monto_no_negativo check (monto_centavos >= 0),
  -- Un paso lleva su clase, su objetivo del mes, lo que el tesoro ya llevaba, el tope que quedaba y
  -- si va por mes, y no recibe más que el tope. Una parte lleva solo su porcentaje.
  constraint repartos_forma_segun_tipo check (
    coalesce(
      case tipo
        when 'paso' then
          clase in ('sueldo', 'fijos', 'prioridad')
          and objetivo_centavos >= 0
          and previo_centavos >= 0
          and tope_centavos >= 0
          and por_mes is not null
          and porcentaje_bp is null
          and monto_centavos <= tope_centavos
        when 'parte' then
          porcentaje_bp between 1 and 10000
          and clase is null
          and objetivo_centavos is null
          and previo_centavos is null
          and tope_centavos is null
          and por_mes is null
      end,
      false
    )
  )
);

comment on table public.repartos is
  'Lo que cada paso y cada parte de la fila recibió en una liquidación por la fila: una fila por paso y por parte, pasos primero, con los ids que manda la app. Es parte de la distribución congelada (ADR 0003): reabrir el cobro las borra lógicamente y volver a cobrar escribe otras. La escriben private.liquidar() y private.revertir_liquidacion(); la app solo lee (ADR 0078).';
comment on column public.repartos.id is 'El UUIDv7 que manda la app en el pedido, así la fila optimista y la de la base son la misma.';
comment on column public.repartos.household_id is 'Default: el household del usuario de la sesión.';
comment on column public.repartos.posicion is 'El lugar en la liquidación, desde 1: los pasos en el orden de la fila, después las partes del reparto.';
comment on column public.repartos.tesoro_id is 'El tesoro que recibió.';
comment on column public.repartos.nombre is 'El nombre del tesoro al liquidar: el reparto lo sigue mostrando aunque después se renombre o se archive.';
comment on column public.repartos.tipo is 'paso (se llena hasta su tope del mes) o parte (un porcentaje de lo que sobró).';
comment on column public.repartos.clase is 'En un paso, sueldo, fijos o prioridad; en una parte, null.';
comment on column public.repartos.objetivo_centavos is 'En un paso, su tope del mes según la fila (cero para el sueldo de un perdido sin sueldo).';
comment on column public.repartos.previo_centavos is 'En un paso, lo que el tesoro ya llevaba del mes según la base, sin esta liquidación.';
comment on column public.repartos.tope_centavos is 'En un paso, lo que le faltaba del mes (el objetivo entero si no va por mes).';
comment on column public.repartos.por_mes is 'En un paso, si su tope es del mes. Solo el sueldo de la fila de siempre de un taller que paga por trabajo va en false.';
comment on column public.repartos.porcentaje_bp is 'En una parte, su porcentaje de lo que sobró, en puntos básicos.';
comment on column public.repartos.monto_centavos is 'Lo que pasó de Maun a este tesoro. En Maun (un paso de gastos fijos) queda donde estaba.';
comment on column public.repartos.fecha is 'La fecha de la liquidación, la del cobro o la del cierre: define el mes de los topes.';
comment on column public.repartos.ya_en_la_apertura is 'El reparto ya estaba en los saldos con los que arrancó la app: queda en el libro y no mueve los tesoros (ADR 0063).';

create unique index repartos_un_lugar_por_proyecto
  on public.repartos (proyecto_id, posicion)
  where deleted_at is null;

create index repartos_household_actualizado on public.repartos (household_id, updated_at);
-- Lo del mes: la liquidación suma los repartos vivos del mes.
create index repartos_household_fecha on public.repartos (household_id, fecha) where deleted_at is null;
-- Foreign keys compuestas.
create index repartos_household_proyecto on public.repartos (household_id, proyecto_id);
create index repartos_household_tesoro on public.repartos (household_id, tesoro_id);

create trigger metadatos
  before insert or update on public.repartos
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.repartos
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.repartos enable row level security;

revoke all on table public.repartos from anon, authenticated;

grant select on table public.repartos to authenticated;

create policy repartos_lectura on public.repartos
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));


-- La fila con la que se liquidó --------------------------------------------------------------------------

-- Las cuatro en null: una liquidación por el camino de antes no las usa. Los checks miran solo las
-- columnas nuevas.
alter table public.proyectos
  add column dist_fila_version integer,
  add column dist_fila jsonb,
  add column dist_previo jsonb,
  add column reapertura_fila jsonb,
  add constraint proyectos_fila_completa check (
    num_nulls(dist_fila_version, dist_fila, dist_previo) in (0, 3)
  ),
  add constraint proyectos_reapertura_fila_valida check (
    reapertura_fila is null or jsonb_typeof(reapertura_fila) = 'object'
  );

comment on column public.proyectos.dist_fila_version is
  'Congelado al liquidar por la fila: la revisión de la fila con la que se repartió (0 para la fila de siempre armada con la foto de una reapertura de antes). Null en una liquidación por el camino de antes (ADR 0078).';
comment on column public.proyectos.dist_fila is
  'Congelado al liquidar por la fila: la fila con la que se repartió, la guardada o la de siempre armada en ese momento. Reabrir el cobro la pasa a reapertura_fila, y volver a cobrarlo reparte con ella.';
comment on column public.proyectos.dist_previo is
  'Congelado al liquidar por la fila: lo que cada tesoro de un paso llevaba del mes según la base, {tesoro_id: centavos}. Si no es lo que mandó la app, la liquidación salió ajustada: la app lo ve comparando esto con lo que mandó.';
comment on column public.proyectos.reapertura_fila is
  'La fila del cobro por la fila que se reabrió, {version, fila}. Volver a cobrarlo reparte con ella y no con la fila de hoy (ADR 0003); una app sin actualizar no puede volver a cobrarlo (MN025). La limpia la liquidación siguiente.';


-- La réplica trae los repartos ------------------------------------------------------------------------------

-- Una clave más en el mismo JSON. Un bundle viejo lee solo las tablas que conoce y la ignora.
create or replace function public.bootstrap()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.deleted_at is null
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.deleted_at is null
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.deleted_at is null
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.deleted_at is null
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.deleted_at is null
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.deleted_at is null
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.deleted_at is null
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.deleted_at is null
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.deleted_at is null
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.deleted_at is null
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.deleted_at is null
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.deleted_at is null
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.deleted_at is null
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.deleted_at is null
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.deleted_at is null
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.deleted_at is null
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.deleted_at is null
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.deleted_at is null
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.deleted_at is null
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.deleted_at is null
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.deleted_at is null
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.deleted_at is null
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.deleted_at is null
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
    )
  )
$$;

create or replace function public.delta(p_desde timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_desde timestamptz;
begin
  if p_desde is null then
    raise exception 'delta() necesita un cursor: sin cursor corresponde bootstrap()'
      using errcode = '22004';
  end if;

  v_desde := p_desde - interval '5 minutes';

  return jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.updated_at >= v_desde
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.updated_at >= v_desde
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.updated_at >= v_desde
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.updated_at >= v_desde
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.updated_at >= v_desde
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.updated_at >= v_desde
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.updated_at >= v_desde
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.updated_at >= v_desde
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.updated_at >= v_desde
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.updated_at >= v_desde
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.updated_at >= v_desde
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.updated_at >= v_desde
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.updated_at >= v_desde
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.updated_at >= v_desde
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.updated_at >= v_desde
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.updated_at >= v_desde
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.updated_at >= v_desde
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.updated_at >= v_desde
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.updated_at >= v_desde
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.updated_at >= v_desde
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.updated_at >= v_desde
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    )
  );
end;
$$;
