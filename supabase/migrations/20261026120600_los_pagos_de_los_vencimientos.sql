-- El día de pago de un compromiso que se paga solo, la base hace el pago (los tipos de tesoro de
-- Eliseo): lo que falta pagar es el tope menos lo pagado para ese vencimiento; el saldo es el de lo
-- fechado antes del día; si no alcanza, Maun pone la diferencia como deuda interna; si sobra, vuelve a
-- Maun, y el tesoro queda en cero. Todo con la fecha del vencimiento, una sola vez por tesoro y
-- vencimiento, aunque se escriba después. Cada gasto desde un compromiso cuenta para un vencimiento:
-- el que se registró para ese, o el del ciclo de su fecha; uno que llega para un vencimiento ya pagado
-- cuenta para el siguiente, así nada se paga dos veces.

create table public.pagos_de_vencimientos (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null references public.households (id) on delete cascade,
  tesoro_id uuid not null,
  vencimiento date not null,
  dia integer not null,
  tope_centavos bigint not null,
  pagado_antes_centavos bigint not null,
  saldo_centavos bigint not null,
  a_pagar_centavos bigint not null,
  puso_maun_centavos bigint not null,
  vuelve_a_maun_centavos bigint not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint pagos_de_vencimientos_tesoro_fk foreign key (household_id, tesoro_id)
    references public.tesoros (household_id, id),
  -- Una vez por tesoro y vencimiento, contando los borrados: uno que se deshizo no se vuelve a pagar.
  constraint pagos_de_vencimientos_uno_por_vencimiento unique (household_id, tesoro_id, vencimiento),
  constraint pagos_de_vencimientos_dia_valido check (dia between 1 and 31),
  constraint pagos_de_vencimientos_montos_validos check (
    tope_centavos >= 0 and pagado_antes_centavos >= 0 and a_pagar_centavos >= 0
    and puso_maun_centavos >= 0 and vuelve_a_maun_centavos >= 0
  ),
  -- La cuenta de cuentaDelVencimiento: el tesoro termina en cero.
  constraint pagos_de_vencimientos_cuenta check (
    a_pagar_centavos = greatest(0, tope_centavos - pagado_antes_centavos)
    and puso_maun_centavos = greatest(0, a_pagar_centavos - saldo_centavos)
    and vuelve_a_maun_centavos = greatest(0, saldo_centavos - a_pagar_centavos)
  )
);

comment on table public.pagos_de_vencimientos is 'El pago de un vencimiento de un compromiso que se paga solo, el día de pago, uno por tesoro y vencimiento: la foto de la cuenta (el tope, lo pagado antes para ese vencimiento, el saldo de lo fechado antes del día) y lo que movió (lo que se pagó, lo que puso Maun como deuda interna y lo que volvió a Maun). libro_mayor lo cuenta como hasta tres líneas fechadas el vencimiento. Lo escribe solo private.pagar_los_vencimientos_del_taller(); el dueño lo lee y solo puede borrarlo (los tipos de tesoro).';
comment on column public.pagos_de_vencimientos.household_id is 'Sin default: la fila la escribe el trabajo de cada hora, que no tiene sesión.';
comment on column public.pagos_de_vencimientos.vencimiento is 'El día de pago que se pagó: la fecha de las tres líneas del libro.';
comment on column public.pagos_de_vencimientos.dia is 'El día de pago del compromiso cuando se pagó (del 1 al 31; si el mes no lo tiene, el último).';
comment on column public.pagos_de_vencimientos.pagado_antes_centavos is 'Lo que ya se había pagado para este vencimiento: los gastos desde el tesoro que cuentan para él (un adelanto, o el pago registrado a mano).';
comment on column public.pagos_de_vencimientos.saldo_centavos is 'El saldo del tesoro con lo fechado antes del vencimiento, sin lo que ya estaba en la apertura. Puede ser negativo.';
comment on column public.pagos_de_vencimientos.a_pagar_centavos is 'Lo que se pagó ese día: el tope menos lo pagado antes, nunca menos de cero. Sale del tesoro como un gasto.';
comment on column public.pagos_de_vencimientos.puso_maun_centavos is 'Lo que Maun puso porque el saldo no alcanzaba: la deuda interna. Maun puede quedar en negativo.';
comment on column public.pagos_de_vencimientos.vuelve_a_maun_centavos is 'Lo que sobró del saldo después del pago y volvió a Maun.';
comment on column public.pagos_de_vencimientos.deleted_at is 'Borrado lógico: deshace el pago en el libro. El vencimiento no se vuelve a pagar solo.';

create index pagos_de_vencimientos_household_actualizado on public.pagos_de_vencimientos (household_id, updated_at);

CREATE OR REPLACE FUNCTION public.bootstrap()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
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
    'cambios_de_estado', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_estado t
      where t.deleted_at is null
        and exists (
          select 1 from public.proyectos p
          where p.household_id = t.household_id and p.id = t.proyecto_id and p.deleted_at is null
        )
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.deleted_at is null
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.deleted_at is null
    ),
    'comprobantes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.comprobantes t where t.deleted_at is null
    ),
    'respuestas_al_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_al_presupuesto t where t.deleted_at is null
    ),
    'pagos_de_vencimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos_de_vencimientos t where t.deleted_at is null
    )
  )
$function$;

CREATE OR REPLACE FUNCTION public.delta(p_desde timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
    'cambios_de_estado', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_estado t where t.updated_at >= v_desde
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.updated_at >= v_desde
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.updated_at >= v_desde
    ),
    'comprobantes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.comprobantes t where t.updated_at >= v_desde
    ),
    'respuestas_al_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_al_presupuesto t where t.updated_at >= v_desde
    ),
    'pagos_de_vencimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos_de_vencimientos t where t.updated_at >= v_desde
    )
  );
end;
$function$;

create trigger metadatos
  before insert or update on public.pagos_de_vencimientos
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or update or delete on public.pagos_de_vencimientos
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.pagos_de_vencimientos enable row level security;

revoke all on table public.pagos_de_vencimientos from anon, authenticated;

grant select on table public.pagos_de_vencimientos to authenticated;
grant update (deleted_at) on table public.pagos_de_vencimientos to authenticated;

create policy pagos_de_vencimientos_lectura on public.pagos_de_vencimientos
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));

create policy pagos_de_vencimientos_edicion on public.pagos_de_vencimientos
  for update to authenticated
  using (household_id = any (array(select private.user_household_ids())))
  with check (household_id = any (array(select private.user_household_ids())));

alter table public.movimientos
  add column vencimiento date,
  add constraint movimientos_vencimiento_de_un_gasto check (vencimiento is null or tipo = 'gasto'::public.tipo_movimiento);

comment on column public.movimientos.vencimiento is 'En un gasto desde un compromiso por mes, el vencimiento para el que cuenta: el que se registró desde un vencimiento («Registrar el pago»), aunque sea de otro día. En null, el del ciclo de su fecha. Si el que le toca ya se pagó, la base lo corre al siguiente sin pagar (private.fijar_el_vencimiento): un gasto que llega tarde no hace pagar dos veces (los tipos de tesoro).';

grant insert (vencimiento), update (vencimiento) on public.movimientos to authenticated;

create function private.dia_de_pago_del_tesoro(p_household_id uuid, p_tesoro_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select private.entero_de_json(p.valor -> 'dia')::integer
  from public.ajustes a
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(a.fila -> 'pasos') = 'array' then a.fila -> 'pasos' else '[]'::jsonb end
  ) as p (valor)
  where a.household_id = p_household_id
    and p.valor ->> 'tesoro' = p_tesoro_id::text
    and p.valor ->> 'clase' in ('sueldo', 'fijos')
    and coalesce(p.valor ->> 'modo', 'mes') = 'mes'
  limit 1
$$;

revoke all on function private.dia_de_pago_del_tesoro(uuid, uuid) from public, anon, authenticated;

comment on function private.dia_de_pago_del_tesoro(uuid, uuid) is 'El día de pago del tesoro en la fila guardada del taller, si es un compromiso por mes con día; si no, null.';

create function private.fijar_el_vencimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dia integer;
  v_antes date;
  v_vence date;
begin
  if new.tipo is distinct from 'gasto' or new.desde_id is null or new.deleted_at is not null then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.fecha is not distinct from old.fecha
    and new.desde_id is not distinct from old.desde_id
    and new.tipo is not distinct from old.tipo
    and new.vencimiento is not distinct from old.vencimiento
    and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;

  v_dia := private.dia_de_pago_del_tesoro(new.household_id, new.desde_id);
  if v_dia is null then
    return new;
  end if;

  -- Un gasto que ya contó para un vencimiento pagado sigue contando para ese.
  if tg_op = 'UPDATE' and old.tipo = 'gasto' and old.desde_id = new.desde_id and old.deleted_at is null then
    v_antes := coalesce(old.vencimiento, (private.ciclo_de_la_fecha(old.fecha, v_dia)).hasta);
    if exists (
      select 1 from public.pagos_de_vencimientos v
      where v.household_id = new.household_id and v.tesoro_id = new.desde_id and v.vencimiento = v_antes
    ) then
      new.vencimiento := v_antes;
      return new;
    end if;
  end if;

  -- El vencimiento que le toca; si ya se pagó, el siguiente que no. Corre con los ajustes del taller
  -- tomados (private.completar_los_tesoros, antes que este), como el pago: los dos se esperan.
  v_vence := coalesce(new.vencimiento, (private.ciclo_de_la_fecha(new.fecha, v_dia)).hasta);
  while exists (
    select 1 from public.pagos_de_vencimientos v
    where v.household_id = new.household_id and v.tesoro_id = new.desde_id and v.vencimiento = v_vence
  ) loop
    v_vence := (private.ciclo_de_la_fecha(v_vence, v_dia)).hasta;
  end loop;

  if v_vence is distinct from coalesce(new.vencimiento, (private.ciclo_de_la_fecha(new.fecha, v_dia)).hasta) then
    new.vencimiento := v_vence;
  end if;
  return new;
end;
$$;

revoke all on function private.fijar_el_vencimiento() from public, anon, authenticated;

comment on function private.fijar_el_vencimiento() is 'Trigger de movimientos, después de completar_los_tesoros (que toma los ajustes del taller): un gasto desde un compromiso por mes con día cuenta para el vencimiento que se registró o para el del ciclo de su fecha; si ese ya se pagó, lo corre al siguiente que no, así un gasto que llega tarde (la cola sin señal) no hace pagar dos veces. En una edición, uno que ya contó para un vencimiento pagado sigue contando para ese. Es security definer porque lee los pagos, que el dueño no escribe.';

create trigger fijar_el_vencimiento
  before insert or update on public.movimientos
  for each row execute function private.fijar_el_vencimiento();

create or replace view public.libro_mayor with (security_invoker = true) as
 SELECT m.household_id,
    'manual'::text AS origen,
    m.id AS asiento_id,
    m.fecha,
    m.tesoro_destino AS tesoro,
    m.tesoro_origen AS contrapartida,
    COALESCE(m.monto_destino_centavos, m.monto_centavos) AS monto_centavos,
    m.tipo::text AS concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false AS ya_en_la_apertura,
    m.hacia_id AS tesoro_id,
    m.desde_id AS contrapartida_id
   FROM movimientos m
  WHERE m.deleted_at IS NULL AND m.hacia_id IS NOT NULL
UNION ALL
 SELECT m.household_id,
    'manual'::text AS origen,
    m.id AS asiento_id,
    m.fecha,
    m.tesoro_origen AS tesoro,
    m.tesoro_destino AS contrapartida,
    - m.monto_centavos AS monto_centavos,
    m.tipo::text AS concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false AS ya_en_la_apertura,
    m.desde_id AS tesoro_id,
    m.hacia_id AS contrapartida_id
   FROM movimientos m
  WHERE m.deleted_at IS NULL AND m.desde_id IS NOT NULL
UNION ALL
 SELECT pg.household_id,
    'pago'::text AS origen,
    pg.id AS asiento_id,
    pg.fecha,
        CASE
            WHEN pg.tesoro_id IS NULL THEN 'maun'::tesoro
            ELSE NULL::tesoro
        END AS tesoro,
    NULL::tesoro AS contrapartida,
    pg.monto_centavos,
    'cobro'::text AS concepto,
    'Cobro'::text AS categoria,
    pg.concepto AS descripcion,
    pg.proyecto_id,
    pg.ya_en_la_apertura,
    COALESCE(pg.tesoro_id, tm.id) AS tesoro_id,
    NULL::uuid AS contrapartida_id
   FROM pagos pg
     JOIN proyectos p ON p.household_id = pg.household_id AND p.id = pg.proyecto_id
     LEFT JOIN tesoros tm ON tm.household_id = pg.household_id AND tm.clave = 'maun'::tesoro
  WHERE pg.deleted_at IS NULL AND p.deleted_at IS NULL
UNION ALL
 SELECT g.household_id,
    'gasto_proyecto'::text AS origen,
    g.id AS asiento_id,
    g.fecha,
    'maun'::tesoro AS tesoro,
    NULL::tesoro AS contrapartida,
    - g.monto_centavos AS monto_centavos,
    'gasto'::text AS concepto,
    'Materiales'::text AS categoria,
    g.descripcion,
    g.proyecto_id,
    false AS ya_en_la_apertura,
    tm.id AS tesoro_id,
    NULL::uuid AS contrapartida_id
   FROM gastos g
     JOIN proyectos p ON p.household_id = g.household_id AND p.id = g.proyecto_id
     LEFT JOIN tesoros tm ON tm.household_id = g.household_id AND tm.clave = 'maun'::tesoro
  WHERE g.deleted_at IS NULL AND p.deleted_at IS NULL
UNION ALL
 SELECT p.household_id,
    'distribucion'::text AS origen,
    p.id AS asiento_id,
    p.fecha_cobro AS fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    d.concepto,
    'Distribución'::text AS categoria,
    p.titulo AS descripcion,
    p.id AS proyecto_id,
    p.reparto_ya_en_la_apertura AS ya_en_la_apertura,
    t.id AS tesoro_id,
    c.id AS contrapartida_id
   FROM proyectos p
     CROSS JOIN LATERAL ( VALUES ('diezmo'::tesoro,'maun'::tesoro,p.dist_diezmo_centavos,'diezmo'::text), ('maun'::tesoro,'diezmo'::tesoro,- p.dist_diezmo_centavos,'diezmo'::text), ('hogar'::tesoro,'maun'::tesoro,p.dist_sueldo_centavos,'sueldo'::text), ('maun'::tesoro,'hogar'::tesoro,- p.dist_sueldo_centavos,'sueldo'::text)) d(tesoro, contrapartida, monto_centavos, concepto)
     LEFT JOIN tesoros t ON t.household_id = p.household_id AND t.clave = d.tesoro
     LEFT JOIN tesoros c ON c.household_id = p.household_id AND c.clave = d.contrapartida
  WHERE (p.estado = ANY (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) AND p.deleted_at IS NULL AND d.monto_centavos <> 0
UNION ALL
 SELECT r.household_id,
    'reparto'::text AS origen,
    r.id AS asiento_id,
    r.fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    COALESCE(r.clase, 'reparto'::text) AS concepto,
    'Distribución'::text AS categoria,
    p.titulo AS descripcion,
    p.id AS proyecto_id,
    r.ya_en_la_apertura,
    d.tesoro_id,
    d.contrapartida_id
   FROM repartos r
     JOIN proyectos p ON p.household_id = r.household_id AND p.id = r.proyecto_id
     JOIN tesoros t ON t.household_id = r.household_id AND t.id = r.tesoro_id
     JOIN tesoros tm ON tm.household_id = r.household_id AND tm.clave = 'maun'::tesoro
     CROSS JOIN LATERAL ( VALUES (t.clave,'maun'::tesoro,r.monto_centavos,t.id,tm.id), ('maun'::tesoro,t.clave,- r.monto_centavos,tm.id,t.id)) d(tesoro, contrapartida, monto_centavos, tesoro_id, contrapartida_id)
  WHERE r.deleted_at IS NULL AND p.deleted_at IS NULL AND (p.estado = ANY (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) AND r.tesoro_id <> tm.id AND r.monto_centavos <> 0
UNION ALL
 SELECT v.household_id,
    'vencimiento'::text AS origen,
    v.id AS asiento_id,
    v.vencimiento AS fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    d.concepto,
    d.categoria,
    ''::text AS descripcion,
    NULL::uuid AS proyecto_id,
    false AS ya_en_la_apertura,
    d.tesoro_id,
    d.contrapartida_id
   FROM pagos_de_vencimientos v
     JOIN tesoros t ON t.household_id = v.household_id AND t.id = v.tesoro_id
     JOIN tesoros tm ON tm.household_id = v.household_id AND tm.clave = 'maun'::tesoro
     CROSS JOIN LATERAL ( VALUES (t.clave,tm.clave,v.puso_maun_centavos,'deuda_interna'::text,'Deuda interna'::text,t.id,tm.id), (tm.clave,t.clave,- v.puso_maun_centavos,'deuda_interna'::text,'Deuda interna'::text,tm.id,t.id), (t.clave,NULL::tesoro,- v.a_pagar_centavos,'vencimiento'::text,'Vencimiento'::text,t.id,NULL::uuid), (tm.clave,t.clave,v.vuelve_a_maun_centavos,'sobrante'::text,'Sobrante'::text,tm.id,t.id), (t.clave,tm.clave,- v.vuelve_a_maun_centavos,'sobrante'::text,'Sobrante'::text,t.id,tm.id)) d(tesoro, contrapartida, monto_centavos, concepto, categoria, tesoro_id, contrapartida_id)
  WHERE v.deleted_at IS NULL AND d.monto_centavos <> 0;

comment on view public.libro_mayor is 'Libro mayor por tesoro: una fila por tesoro afectado, importe con signo y en la moneda de su tesoro. tesoro_id y contrapartida_id son los tesoros por id; tesoro y contrapartida, su clave (null para los tesoros del dueño). El saldo de un tesoro es sum(monto_centavos) where tesoro_id = X and not ya_en_la_apertura, y nunca se suma con el de un tesoro de otra moneda: un cambio sale de su origen con monto_centavos y entra a su destino con monto_destino_centavos, y un pago en dólares entra a su tesoro en dólares con su importe en dólares, mientras uno en pesos entra a Maun, como siempre (ADR 0081). Una fila ya_en_la_apertura es plata de antes de la apertura que ya estaba en los saldos con los que arrancó la app, y queda en el libro con su fecha sin mover los tesoros (ADR 0063). Los repartos de un cobro por la fila salen de public.repartos (ADR 0078). El pago de un vencimiento que se paga solo (origen vencimiento, de public.pagos_de_vencimientos) son hasta tres líneas fechadas el día del vencimiento: lo que pone Maun como deuda interna, el pago, que sale del tesoro, y lo que sobra, que vuelve a Maun (los tipos de tesoro).';

create function private.pago_del_vencimiento(
  p_household_id uuid, p_tesoro_id uuid, p_dia integer, p_tope bigint, p_vencimiento date,
  out pagado_antes bigint, out saldo bigint, out a_pagar bigint, out puso_maun bigint, out vuelve_a_maun bigint
)
returns record
language plpgsql
stable
set search_path = ''
as $$
begin
  -- Lo pagado para el vencimiento: los gastos vivos desde el tesoro que cuentan para él.
  select coalesce(sum(m.monto_centavos), 0)::bigint into pagado_antes
  from public.movimientos m
  where m.household_id = p_household_id
    and m.desde_id = p_tesoro_id
    and m.tipo = 'gasto'
    and m.deleted_at is null
    and coalesce(m.vencimiento, (private.ciclo_de_la_fecha(m.fecha, p_dia)).hasta) = p_vencimiento;

  -- El saldo de lo fechado antes del vencimiento, como lo cuenta el libro.
  select coalesce(sum(l.monto_centavos), 0)::bigint into saldo
  from public.libro_mayor l
  where l.household_id = p_household_id
    and l.tesoro_id = p_tesoro_id
    and l.fecha < p_vencimiento
    and not l.ya_en_la_apertura;

  a_pagar := greatest(0, p_tope - pagado_antes);
  puso_maun := greatest(0, a_pagar - saldo);
  vuelve_a_maun := greatest(0, saldo - a_pagar);
end;
$$;

revoke all on function private.pago_del_vencimiento(uuid, uuid, integer, bigint, date) from public, anon, authenticated;

comment on function private.pago_del_vencimiento(uuid, uuid, integer, bigint, date) is 'La cuenta del pago de un vencimiento con lo que hay en la base: lo pagado para él, el saldo de lo fechado antes del día y, con el tope, lo que se paga, lo que pone Maun y lo que vuelve a Maun. Gemela de pagoDelVencimiento de @maun/domain.';

create function private.pagar_los_vencimientos_del_taller(p_household_id uuid, p_hoy date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fila jsonb;
  v_maun uuid;
  v_paso jsonb;
  v_tesoro uuid;
  v_dia integer;
  v_desde date;
  v_vence date;
  v_cuenta record;
  v_pagados integer := 0;
begin
  -- El mismo candado que una liquidación y que todo movimiento: un cobro o un adelanto del mismo taller
  -- espera a que esto termine, o esto espera a que ellos terminen y los cuenta.
  select a.fila into v_fila
  from public.ajustes a
  where a.household_id = p_household_id
  for no key update;

  if not found or jsonb_typeof(v_fila -> 'pasos') is distinct from 'array' then
    return 0;
  end if;

  select t.id into v_maun
  from public.tesoros t
  where t.household_id = p_household_id and t.clave = 'maun';

  for v_paso in
    select e.valor from jsonb_array_elements(v_fila -> 'pasos') with ordinality as e (valor, n) order by e.n
  loop
    -- Se paga solo un compromiso por mes, con día, «se paga sola», desde cuándo, y que no sea Maun:
    -- seVencenSolos.
    continue when not (
      v_paso -> 'pagaSola' = 'true'::jsonb
      and v_paso ->> 'clase' in ('sueldo', 'fijos')
      and coalesce(v_paso ->> 'modo', 'mes') = 'mes'
      and private.entero_de_json(v_paso -> 'dia') is not null
      and jsonb_typeof(v_paso -> 'pagaSolaDesde') = 'string'
      and private.es_fecha_que_existe(v_paso ->> 'pagaSolaDesde')
      and (v_paso ->> 'tesoro') is distinct from v_maun::text
    );
    v_tesoro := (v_paso ->> 'tesoro')::uuid;
    v_dia := private.entero_de_json(v_paso -> 'dia')::integer;
    v_desde := (v_paso ->> 'pagaSolaDesde')::date;

    -- Cada vencimiento después del día en que se guardó y hasta hoy, en orden: también los que se
    -- perdieron si un día no corrió. El saldo de cada uno ya cuenta el pago del anterior.
    v_vence := (private.ciclo_de_la_fecha(v_desde, v_dia)).hasta;
    while v_vence <= p_hoy loop
      if not exists (
        select 1 from public.pagos_de_vencimientos v
        where v.household_id = p_household_id and v.tesoro_id = v_tesoro and v.vencimiento = v_vence
      ) then
        select * into v_cuenta
        from private.pago_del_vencimiento(
          p_household_id, v_tesoro, v_dia, private.entero_de_json(v_paso -> 'tope'), v_vence
        );
        insert into public.pagos_de_vencimientos (
          household_id, tesoro_id, vencimiento, dia, tope_centavos, pagado_antes_centavos, saldo_centavos,
          a_pagar_centavos, puso_maun_centavos, vuelve_a_maun_centavos
        ) values (
          p_household_id, v_tesoro, v_vence, v_dia, private.entero_de_json(v_paso -> 'tope'),
          v_cuenta.pagado_antes, v_cuenta.saldo, v_cuenta.a_pagar, v_cuenta.puso_maun, v_cuenta.vuelve_a_maun
        );
        v_pagados := v_pagados + 1;
      end if;
      v_vence := (private.ciclo_de_la_fecha(v_vence, v_dia)).hasta;
    end loop;
  end loop;

  return v_pagados;
end;
$$;

revoke all on function private.pagar_los_vencimientos_del_taller(uuid, date) from public, anon, authenticated;

comment on function private.pagar_los_vencimientos_del_taller(uuid, date) is 'Paga los vencimientos que ya llegaron de los compromisos que se pagan solos de un taller: cada compromiso por mes con día, «se paga sola» y desde cuándo, que no sea Maun; cada vencimiento después de ese día y hasta p_hoy que no esté pagado, en orden, con private.pago_del_vencimiento. Toma los ajustes del taller for no key update, como una liquidación y todo movimiento. Idempotente: corrida dos veces el mismo día, la segunda no hace nada. Devuelve cuántos pagó. Gemela de pagosQueCorresponden de @maun/domain.';

create function private.hoy_del_taller(p_household_id uuid)
returns date
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('maun.hoy_en_el_taller', true), '')::date,
    (
      select (now() at time zone p.zona)::date
      from public.household_members m
      join private.preferencias_de_avisos p on p.user_id = m.user_id
      where m.household_id = p_household_id and m.deleted_at is null
      order by m.created_at
      limit 1
    ),
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  )
$$;

revoke all on function private.hoy_del_taller(uuid) from public, anon, authenticated;

comment on function private.hoy_del_taller(uuid) is 'El día de hoy de un taller, con la zona horaria que usan sus avisos: la de las preferencias de su primer miembro, como private.avisos_por_mandar elige su taller; sin preferencias, Argentina. Los tests lo fijan con el setting maun.hoy_en_el_taller, como private.hoy_en_el_taller. Lo usa el pago de los vencimientos (los tipos de tesoro).';

create function private.pagar_los_vencimientos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_pagados integer := 0;
begin
  for v_household in
    select a.household_id
    from public.ajustes a
    where a.deleted_at is null
      and jsonb_typeof(a.fila -> 'pasos') = 'array'
      and exists (
        select 1 from jsonb_array_elements(a.fila -> 'pasos') as p (valor)
        where p.valor -> 'pagaSola' = 'true'::jsonb
      )
  loop
    -- Cada taller en su propio bloque: si el pago de uno falla, los demás se pagan igual, y el que
    -- falló lo vuelve a intentar la corrida de la hora siguiente.
    begin
      v_pagados := v_pagados + private.pagar_los_vencimientos_del_taller(v_household, private.hoy_del_taller(v_household));
    exception when others then
      raise warning 'no se pudieron pagar los vencimientos del taller %: % (%)', v_household, sqlerrm, sqlstate;
    end;
  end loop;
  return v_pagados;
end;
$$;

revoke all on function private.pagar_los_vencimientos() from public, anon, authenticated;

comment on function private.pagar_los_vencimientos() is 'Lo que corre el trabajo pagar-los-vencimientos de pg_cron cada hora: paga los vencimientos de cada taller que tiene algún compromiso que se paga solo, con el día del taller (private.hoy_del_taller). Cada taller en su bloque: el que falla queda anotado como warning y no frena a los demás; lo reintenta la corrida siguiente.';

select cron.unschedule(jobid) from cron.job where jobname = 'pagar-los-vencimientos';

select cron.schedule('pagar-los-vencimientos', '7 * * * *', $$select private.pagar_los_vencimientos()$$);
