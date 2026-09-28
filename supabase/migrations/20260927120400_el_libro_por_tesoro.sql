-- El libro mayor lleva la cuenta por id de tesoro (ADR 0078): así llegan al libro los movimientos entre
-- los tesoros del dueño, que no tienen clave, y los repartos de cada cobro por la fila.
--
-- create or replace view con dos columnas nuevas al final, tesoro_id y contrapartida_id; tesoro y
-- contrapartida siguen con la clave (null para los tesoros del dueño). Los dos bloques de movimientos
-- filtran por hacia_id y desde_id y no por la clave: si no, un movimiento entre tesoros del dueño no
-- llega al libro y su saldo sale mal. Un bloque nuevo para los repartos. Con los datos de hoy da las
-- mismas filas y los mismos saldos por clave: todo movimiento con clave ya tiene su id, y todavía no
-- hay repartos.
--
-- El or replace borra las opciones de la vista: security_invoker va escrito otra vez.

create or replace view public.libro_mayor with (security_invoker = true) as
  select
    m.household_id,
    'manual'::text as origen,
    m.id as asiento_id,
    m.fecha,
    m.tesoro_destino as tesoro,
    m.tesoro_origen as contrapartida,
    m.monto_centavos,
    m.tipo::text as concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false as ya_en_la_apertura,
    m.hacia_id as tesoro_id,
    m.desde_id as contrapartida_id
  from public.movimientos m
  where m.deleted_at is null and m.hacia_id is not null
union all
  select
    m.household_id,
    'manual'::text as origen,
    m.id as asiento_id,
    m.fecha,
    m.tesoro_origen as tesoro,
    m.tesoro_destino as contrapartida,
    - m.monto_centavos as monto_centavos,
    m.tipo::text as concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false as ya_en_la_apertura,
    m.desde_id as tesoro_id,
    m.hacia_id as contrapartida_id
  from public.movimientos m
  where m.deleted_at is null and m.desde_id is not null
union all
  select
    pg.household_id,
    'pago'::text as origen,
    pg.id as asiento_id,
    pg.fecha,
    'maun'::public.tesoro as tesoro,
    null::public.tesoro as contrapartida,
    pg.monto_centavos,
    'cobro'::text as concepto,
    'Cobro'::text as categoria,
    pg.concepto as descripcion,
    pg.proyecto_id,
    pg.ya_en_la_apertura,
    tm.id as tesoro_id,
    null::uuid as contrapartida_id
  from public.pagos pg
  join public.proyectos p on p.household_id = pg.household_id and p.id = pg.proyecto_id
  left join public.tesoros tm on tm.household_id = pg.household_id and tm.clave = 'maun'
  where pg.deleted_at is null and p.deleted_at is null
union all
  select
    g.household_id,
    'gasto_proyecto'::text as origen,
    g.id as asiento_id,
    g.fecha,
    'maun'::public.tesoro as tesoro,
    null::public.tesoro as contrapartida,
    - g.monto_centavos as monto_centavos,
    'gasto'::text as concepto,
    'Materiales'::text as categoria,
    g.descripcion,
    g.proyecto_id,
    false as ya_en_la_apertura,
    tm.id as tesoro_id,
    null::uuid as contrapartida_id
  from public.gastos g
  join public.proyectos p on p.household_id = g.household_id and p.id = g.proyecto_id
  left join public.tesoros tm on tm.household_id = g.household_id and tm.clave = 'maun'
  where g.deleted_at is null and p.deleted_at is null
union all
  -- La distribución de las columnas de siempre: el diezmo y el sueldo pasan de Maun a su tesoro. En
  -- un cobro por la fila el sueldo va en cero y lo que va a cada tesoro está en el bloque de abajo.
  select
    p.household_id,
    'distribucion'::text as origen,
    p.id as asiento_id,
    p.fecha_cobro as fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    d.concepto,
    'Distribución'::text as categoria,
    p.titulo as descripcion,
    p.id as proyecto_id,
    p.reparto_ya_en_la_apertura as ya_en_la_apertura,
    t.id as tesoro_id,
    c.id as contrapartida_id
  from public.proyectos p
  cross join lateral (
    values
      ('diezmo'::public.tesoro, 'maun'::public.tesoro, p.dist_diezmo_centavos, 'diezmo'::text),
      ('maun'::public.tesoro, 'diezmo'::public.tesoro, - p.dist_diezmo_centavos, 'diezmo'::text),
      ('hogar'::public.tesoro, 'maun'::public.tesoro, p.dist_sueldo_centavos, 'sueldo'::text),
      ('maun'::public.tesoro, 'hogar'::public.tesoro, - p.dist_sueldo_centavos, 'sueldo'::text)
  ) as d (tesoro, contrapartida, monto_centavos, concepto)
  left join public.tesoros t on t.household_id = p.household_id and t.clave = d.tesoro
  left join public.tesoros c on c.household_id = p.household_id and c.clave = d.contrapartida
  where p.estado in ('cobrado', 'perdido') and p.deleted_at is null and d.monto_centavos <> 0
union all
  -- Los repartos de un cobro por la fila: cada paso y cada parte pasa de Maun a su tesoro, con la
  -- fecha y la marca de la apertura del reparto. Lo que va a Maun (un paso de gastos fijos de la fila
  -- de siempre) no se mueve a sí mismo.
  select
    r.household_id,
    'reparto'::text as origen,
    r.id as asiento_id,
    r.fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    coalesce(r.clase, 'reparto') as concepto,
    'Distribución'::text as categoria,
    p.titulo as descripcion,
    p.id as proyecto_id,
    r.ya_en_la_apertura,
    d.tesoro_id,
    d.contrapartida_id
  from public.repartos r
  join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
  join public.tesoros t on t.household_id = r.household_id and t.id = r.tesoro_id
  join public.tesoros tm on tm.household_id = r.household_id and tm.clave = 'maun'
  cross join lateral (
    values
      (t.clave, 'maun'::public.tesoro, r.monto_centavos, t.id, tm.id),
      ('maun'::public.tesoro, t.clave, - r.monto_centavos, tm.id, t.id)
  ) as d (tesoro, contrapartida, monto_centavos, tesoro_id, contrapartida_id)
  where r.deleted_at is null
    and p.deleted_at is null
    and p.estado in ('cobrado', 'perdido')
    and r.tesoro_id <> tm.id
    and r.monto_centavos <> 0;

comment on view public.libro_mayor is
  'Libro mayor por tesoro: una fila por tesoro afectado, importe con signo. tesoro_id y contrapartida_id son los tesoros por id; tesoro y contrapartida, su clave (null para los tesoros del dueño). El saldo de un tesoro es sum(monto_centavos) where tesoro_id = X and not ya_en_la_apertura: una fila ya_en_la_apertura es plata de antes de la apertura que ya estaba en los saldos con los que arrancó la app, y queda en el libro con su fecha sin mover los tesoros (ADR 0063). Los repartos de un cobro por la fila salen de public.repartos (ADR 0078).';
