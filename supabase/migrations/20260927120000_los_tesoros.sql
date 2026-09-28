-- Los tesoros configurables (ADR 0078): una tabla con los tesoros del taller, los cuatro de siempre y
-- los que arme el dueño.
--
-- Aditiva. Una tabla nueva, una función privada nueva, el reemplazo de private.crear_household() (misma
-- firma) y de bootstrap() y delta(), que suman una clave. Inserta las cuatro filas del sistema de cada
-- taller que existe, borrados incluidos: los movimientos de todos los talleres van a apuntar a ellas
-- por id. Ninguna fila existente cambia.
--
-- Un bundle de antes sigue andando contra esta base: lee de bootstrap() y de delta() solo las tablas
-- que conoce, y la nueva la ignora. Sigue nombrando los tesoros por el enum public.tesoro, que no
-- cambia.


-- Los tesoros ------------------------------------------------------------------------------------------

create table public.tesoros (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  clave public.tesoro,
  nombre text not null,
  descripcion text not null default '',
  tinta text not null,
  icono text not null,
  meta_centavos bigint,
  rinde_anual_bp integer,
  orden integer not null default 0,
  archivado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  -- Las foreign keys compuestas de los movimientos y de los repartos apuntan acá: un movimiento no
  -- puede mover plata a un tesoro de otro taller.
  constraint tesoros_household_id_key unique (household_id, id),
  constraint tesoros_nombre_valido check (char_length(btrim(nombre)) between 1 and 24),
  constraint tesoros_descripcion_largo check (char_length(descripcion) <= 80),
  constraint tesoros_tinta_valida check (
    tinta in ('hogar', 'maun', 'diezmo', 'cocos', 'grana', 'mostaza', 'petroleo', 'ciruela')
  ),
  constraint tesoros_icono_valido check (icono ~ '^[a-z0-9-]{1,40}$'),
  constraint tesoros_meta_no_negativa check (meta_centavos is null or meta_centavos >= 0),
  constraint tesoros_rinde_valido check (rinde_anual_bp is null or rinde_anual_bp between 0 and 100000),
  -- La meta y el rinde de Cocos siguen en ajustes: el mismo dato en dos lugares se separa.
  constraint tesoros_meta_solo_de_los_propios check (
    clave is null or (meta_centavos is null and rinde_anual_bp is null)
  ),
  -- Los cuatro de siempre no se archivan: el hogar, la caja, el diezmo y el ahorro son el taller.
  constraint tesoros_los_de_siempre_no_se_archivan check (archivado_at is null or clave is null)
);

comment on table public.tesoros is
  'Los tesoros del taller: los cuatro de siempre (con su clave del enum public.tesoro) y los que arma el dueño (sin clave). Cada cobro reparte su ganancia entre ellos según la fila de ajustes.fila (ADR 0078). Un tesoro no se borra: se archiva, y sigue apareciendo con su nombre en los repartos que ya hizo.';
comment on column public.tesoros.id is 'UUIDv7 que genera la app al crearlo; en los cuatro del sistema, private.uuidv7() al sembrarlos.';
comment on column public.tesoros.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.tesoros.clave is 'hogar, maun, diezmo o cocos en los cuatro del sistema; null en los del dueño. Es el puente con las columnas de siempre (movimientos.tesoro_origen y tesoro_destino, los dist_* de proyectos) y con las apps sin actualizar. No tiene grant: la escribe private.sembrar_los_tesoros().';
comment on column public.tesoros.nombre is 'Cómo lo llama el dueño, de 1 a 24 caracteres sin contar los blancos de los bordes.';
comment on column public.tesoros.descripcion is 'Para qué es, hasta 80 caracteres. Opcional.';
comment on column public.tesoros.tinta is 'Una de las ocho tintas de tesoro de @maun/ui. Dos tesoros pueden compartirla: se distinguen por el nombre y el ícono.';
comment on column public.tesoros.icono is 'El nombre de un ícono de lucide. La app cae a vault si no lo conoce.';
comment on column public.tesoros.meta_centavos is 'La meta de ahorro de un tesoro del dueño, o null. En los cuatro del sistema es null: la meta de Cocos sigue en ajustes.meta_cocos_centavos, que es donde la leen las apps sin actualizar.';
comment on column public.tesoros.rinde_anual_bp is 'El rinde anual estimado de un tesoro del dueño, en puntos básicos, o null. En los cuatro del sistema es null: el de Cocos sigue en ajustes.tasa_cocos_anual_bp.';
comment on column public.tesoros.orden is 'El orden en que se muestran los tesoros del dueño, después de los cuatro de siempre. No es el orden de la fila: ese vive en ajustes.fila.';
comment on column public.tesoros.archivado_at is 'Cuándo se archivó, o null. Un tesoro archivado no entra en la fila, no se elige para mover plata y sigue en los repartos que ya hizo. Los cuatro del sistema no se archivan.';

create unique index tesoros_una_clave_por_taller
  on public.tesoros (household_id, clave)
  where clave is not null;

create index tesoros_household_actualizado on public.tesoros (household_id, updated_at);

create trigger metadatos
  before insert or update on public.tesoros
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.tesoros
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.tesoros enable row level security;

-- Una tabla nueva de public nace con todos los privilegios para anon y authenticated.
revoke all on table public.tesoros from anon, authenticated;

grant select on table public.tesoros to authenticated;
-- El alta es un upsert, así que todo lo que manda entra también en el update. Sin household_id, que
-- lo pone el default; sin clave, que es del sistema; sin grant de delete: se archiva.
grant insert (id, nombre, descripcion, tinta, icono, meta_centavos, rinde_anual_bp, orden, archivado_at)
  on table public.tesoros to authenticated;
grant update (id, nombre, descripcion, tinta, icono, meta_centavos, rinde_anual_bp, orden, archivado_at)
  on table public.tesoros to authenticated;

create policy tesoros_lectura on public.tesoros
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));

create policy tesoros_alta on public.tesoros
  for insert to authenticated
  with check (household_id = any (array(select private.user_household_ids())));

create policy tesoros_edicion on public.tesoros
  for update to authenticated
  using (household_id = any (array(select private.user_household_ids())))
  with check (household_id = any (array(select private.user_household_ids())));


-- Los cuatro de siempre ---------------------------------------------------------------------------------

create function private.sembrar_los_tesoros(p_household_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- Los nombres, las descripciones, las tintas y los íconos son los de shared/lib/tesoros.ts de la
  -- app. La meta y el rinde de Cocos no van acá: siguen en ajustes.
  insert into public.tesoros (id, household_id, clave, nombre, descripcion, tinta, icono, orden)
  select private.uuidv7(), p_household_id, t.clave, t.nombre, t.descripcion, t.clave::text, t.icono, t.orden
  from (
    values
      ('hogar'::public.tesoro, 'Hogar', 'La plata de la familia', 'house', 0),
      ('maun'::public.tesoro, 'Maun', 'La caja del taller', 'hammer', 1),
      ('diezmo'::public.tesoro, 'Diezmo', 'Lo apartado de cada ganancia', 'church', 2),
      ('cocos'::public.tesoro, 'Cocos', 'Ahorro para la casa propia', 'piggy-bank', 3)
  ) as t (clave, nombre, descripcion, icono, orden)
  where not exists (
    select 1 from public.tesoros e
    where e.household_id = p_household_id and e.clave = t.clave
  );
end;
$$;

comment on function private.sembrar_los_tesoros(uuid) is
  'Le escribe al taller sus cuatro tesoros de siempre (hogar, maun, diezmo y cocos) con los nombres, las tintas y los íconos de la app, si no los tiene. Idempotente. La llaman private.crear_household() con cada taller nuevo, la migración que creó la tabla y el seed. Solo la ejecuta el dueño de la base (ADR 0078).';

revoke all on function private.sembrar_los_tesoros(uuid) from public, anon, authenticated;

-- Mismo nombre y misma firma: or replace conserva que nadie de la API la puede ejecutar. Lo único
-- nuevo es la última llamada. Un error acá rompe todos los registros, no uno, y por eso lo que
-- escribe son constantes (ADR 0012).
create or replace function private.crear_household(p_nombre text, p_user_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_household uuid;
begin
  insert into public.households (nombre) values (p_nombre) returning id into v_household;

  if p_user_id is not null then
    insert into public.household_members (household_id, user_id, rol)
    values (v_household, p_user_id, 'titular');
  end if;

  insert into public.ajustes (household_id) values (v_household);

  perform private.sembrar_la_encuesta(v_household);

  perform private.sembrar_los_tesoros(v_household);

  return v_household;
end;
$$;

comment on function private.crear_household(text, uuid) is
  'Crea un household con sus ajustes, su encuesta base y sus cuatro tesoros de siempre y, si se pasa un usuario, lo suma como titular. Solo la ejecuta el dueño de la base.';

-- Todos los talleres que existen, también los borrados: sus movimientos van a apuntar a estas filas
-- por id, y el check que lo exige mira todas las filas. Son filas nuevas de una tabla nueva.
select private.sembrar_los_tesoros(h.id)
from public.households h;


-- La réplica trae los tesoros ----------------------------------------------------------------------------

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
