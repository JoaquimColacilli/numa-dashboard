-- Los dos importes del cambio (ADR 0081): una compra o una venta de dólares es una sola fila de
-- movimientos, como un pase, con lo que sale en monto_centavos (en la moneda del tesoro de origen) y lo
-- que entra en monto_destino_centavos (en la del destino). La cotización sale de los dos y no se guarda.
--
-- Aditiva: la columna nueva es nula y ningún movimiento de hoy la usa. El check de forma pasa a su
-- versión nueva con el rito del ADR 0078 (el nuevo not valid con nombre propio, validate, drop del
-- viejo y rename): las filas de hoy la cumplen sin relleno, porque ninguna es un cambio y todas tienen
-- monto_destino_centavos en null. La regla de las monedas va en el trigger que completa los lados,
-- porque un check no puede leer tesoros; la moneda de un tesoro es inmutable (MN034), así que leerla
-- no necesita ningún candado más. El libro mayor abre el destino de un cambio con su importe.

alter table public.movimientos
  add column monto_destino_centavos bigint;

comment on column public.movimientos.monto_destino_centavos is 'Solo en un cambio: lo que entra al tesoro de destino, en centavos de su moneda y siempre positivo. En todo otro tipo, null: lo que entra es monto_centavos. La cotización de un cambio sale de los dos importes y no se guarda (ADR 0081).';
comment on column public.movimientos.monto_centavos is 'Importe en centavos, siempre positivo: el sentido lo dan origen y destino. Va en la moneda de sus tesoros; en un cambio es lo que sale, en la moneda del tesoro de origen, y lo que entra va en monto_destino_centavos (ADR 0081).';

grant insert (monto_destino_centavos) on table public.movimientos to authenticated;
grant update (monto_destino_centavos) on table public.movimientos to authenticated;


-- La forma de un cambio ------------------------------------------------------------------------------

alter table public.movimientos
  add constraint movimientos_forma_segun_tipo_con_cambio check (
    coalesce(
      case tipo
        when 'ingreso' then desde_id is null and hacia_id is not null and monto_destino_centavos is null
        when 'gasto' then desde_id is not null and hacia_id is null and monto_destino_centavos is null
        when 'transferencia' then
          desde_id is not null and hacia_id is not null and monto_destino_centavos is null
        when 'pago_diezmo' then
          desde_id is not null and tesoro_origen = 'diezmo' and hacia_id is null
          and monto_destino_centavos is null
        when 'aporte_cocos' then
          desde_id is not null and hacia_id is not null and tesoro_destino = 'cocos'
          and monto_destino_centavos is null
        when 'ajuste' then num_nonnulls(desde_id, hacia_id) = 1 and monto_destino_centavos is null
        when 'cambio' then desde_id is not null and hacia_id is not null and monto_destino_centavos > 0
      end,
      false
    )
  ) not valid;

alter table public.movimientos validate constraint movimientos_forma_segun_tipo_con_cambio;

alter table public.movimientos drop constraint movimientos_forma_segun_tipo;

alter table public.movimientos
  rename constraint movimientos_forma_segun_tipo_con_cambio to movimientos_forma_segun_tipo;

comment on type public.tipo_movimiento is 'Tipo de un movimiento cargado a mano. Cada tipo fija qué lados (desde_id, hacia_id) lleva: ver el check movimientos_forma_segun_tipo. Una transferencia va entre dos tesoros cualesquiera de la misma moneda, también los del dueño; el pago del diezmo sale del diezmo y el aporte va a Cocos; un cambio (una compra o una venta de dólares) va entre un tesoro en pesos y uno en dólares, con sus dos importes (ADR 0018, 0078 y 0081).';


-- La regla de las monedas ----------------------------------------------------------------------------

create or replace function private.completar_los_tesoros()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_clave public.tesoro;
  v_id uuid;
  v_moneda_desde text;
  v_moneda_hacia text;
begin
  -- Cada lado por separado. En un alta manda el que vino: una app de antes manda la clave y una nueva
  -- manda el id. En una edición manda el que cambió, porque una app de antes edita mandando solo la
  -- clave y sin esto el id viejo quedaría apuntando a otro tesoro.
  if tg_op = 'INSERT' or new.desde_id is distinct from old.desde_id
    or new.tesoro_origen is distinct from old.tesoro_origen
  then
    if new.desde_id is not null
      and (tg_op = 'INSERT' or new.desde_id is distinct from old.desde_id)
    then
      select t.clave into v_clave
      from public.tesoros t
      where t.household_id = new.household_id and t.id = new.desde_id;
      if tg_op = 'UPDATE' and new.tesoro_origen is distinct from old.tesoro_origen
        and new.tesoro_origen is distinct from v_clave
      then
        raise exception 'El tesoro de origen no coincide con su clave'
          using errcode = '23514';
      end if;
      if tg_op = 'INSERT' and new.tesoro_origen is not null
        and new.tesoro_origen is distinct from v_clave
      then
        raise exception 'El tesoro de origen no coincide con su clave'
          using errcode = '23514';
      end if;
      new.tesoro_origen := v_clave;
    elsif tg_op = 'UPDATE' and new.tesoro_origen is not distinct from old.tesoro_origen then
      -- Cambió solo el id, y a null: la clave lo sigue.
      new.tesoro_origen := null;
    elsif tg_op = 'UPDATE' and new.desde_id is distinct from old.desde_id
      and new.tesoro_origen is not null
    then
      -- El id pasó a null y la clave a otro tesoro: no dicen lo mismo.
      raise exception 'El tesoro de origen no coincide con su clave'
        using errcode = '23514';
    elsif new.tesoro_origen is not null then
      select t.id into v_id
      from public.tesoros t
      where t.household_id = new.household_id and t.clave = new.tesoro_origen;
      new.desde_id := v_id;
    else
      new.desde_id := null;
    end if;
  end if;

  if tg_op = 'INSERT' or new.hacia_id is distinct from old.hacia_id
    or new.tesoro_destino is distinct from old.tesoro_destino
  then
    if new.hacia_id is not null
      and (tg_op = 'INSERT' or new.hacia_id is distinct from old.hacia_id)
    then
      select t.clave into v_clave
      from public.tesoros t
      where t.household_id = new.household_id and t.id = new.hacia_id;
      if tg_op = 'UPDATE' and new.tesoro_destino is distinct from old.tesoro_destino
        and new.tesoro_destino is distinct from v_clave
      then
        raise exception 'El tesoro de destino no coincide con su clave'
          using errcode = '23514';
      end if;
      if tg_op = 'INSERT' and new.tesoro_destino is not null
        and new.tesoro_destino is distinct from v_clave
      then
        raise exception 'El tesoro de destino no coincide con su clave'
          using errcode = '23514';
      end if;
      new.tesoro_destino := v_clave;
    elsif tg_op = 'UPDATE' and new.tesoro_destino is not distinct from old.tesoro_destino then
      -- Cambió solo el id, y a null: la clave lo sigue.
      new.tesoro_destino := null;
    elsif tg_op = 'UPDATE' and new.hacia_id is distinct from old.hacia_id
      and new.tesoro_destino is not null
    then
      -- El id pasó a null y la clave a otro tesoro: no dicen lo mismo.
      raise exception 'El tesoro de destino no coincide con su clave'
        using errcode = '23514';
    elsif new.tesoro_destino is not null then
      select t.id into v_id
      from public.tesoros t
      where t.household_id = new.household_id and t.clave = new.tesoro_destino;
      new.hacia_id := v_id;
    else
      new.hacia_id := null;
    end if;
  end if;

  -- Las monedas, con los dos lados ya completos: un movimiento con los dos lados va entre tesoros de
  -- la misma moneda, salvo un cambio, que va entre monedas distintas. Se mira en toda alta y en toda
  -- edición que toque el tipo, un lado o el segundo importe, leyendo la moneda de los dos tesoros
  -- aunque no hayan cambiado: si no, un pase en pesos editado a cambio crearía o borraría plata en el
  -- libro. Un tesoro que no existe no tiene moneda: lo rechaza su foreign key.
  if (
      tg_op = 'INSERT'
      or new.tipo is distinct from old.tipo
      or new.desde_id is distinct from old.desde_id
      or new.hacia_id is distinct from old.hacia_id
      or new.tesoro_origen is distinct from old.tesoro_origen
      or new.tesoro_destino is distinct from old.tesoro_destino
      or new.monto_destino_centavos is distinct from old.monto_destino_centavos
    )
    and new.desde_id is not null and new.hacia_id is not null
  then
    select t.moneda into v_moneda_desde
    from public.tesoros t
    where t.household_id = new.household_id and t.id = new.desde_id;
    select t.moneda into v_moneda_hacia
    from public.tesoros t
    where t.household_id = new.household_id and t.id = new.hacia_id;

    if v_moneda_desde is not null and v_moneda_hacia is not null then
      if new.tipo <> 'cambio' and v_moneda_desde <> v_moneda_hacia then
        raise exception 'Entre pesos y dólares es una compra o una venta'
          using errcode = 'MN035',
                detail = format('%s de %s a %s', new.tipo, v_moneda_desde, v_moneda_hacia),
                hint = 'Actualizá la app y cargalo como compra o venta de dólares.';
      end if;
      if new.tipo = 'cambio' and v_moneda_desde = v_moneda_hacia then
        raise exception 'Una compra o una venta va entre un tesoro en pesos y uno en dólares'
          using errcode = 'MN035',
                detail = format('%s de %s a %s', new.tipo, v_moneda_desde, v_moneda_hacia),
                hint = 'Entre dos tesoros de la misma moneda, cargalo como un pase entre tesoros.';
      end if;
    end if;
  end if;

  -- Todo movimiento cambia algún saldo que la liquidación puede mirar: el de un compromiso que se
  -- renueva al pagar, el de un ahorro que se repone al usarlo o el de un tesoro con meta, y la plata
  -- que cubre un mes cuenta para su tope. Toma los ajustes, como una liquidación, para que una
  -- liquidación del mismo taller lo vea entero o no lo vea: nunca a medias. Con un proyecto, primero
  -- el proyecto, en el orden de la liquidación y de la reversión, así la foreign key no pide su lock
  -- con los ajustes ya tomados.
  if new.proyecto_id is not null then
    perform 1
    from public.proyectos p
    where p.household_id = new.household_id and p.id = new.proyecto_id
    for key share;
  end if;

  perform 1 from public.ajustes a where a.household_id = new.household_id for no key update;

  return new;
end;
$function$;

comment on function private.completar_los_tesoros() is 'Trigger de movimientos: completa desde_id y hacia_id desde tesoro_origen y tesoro_destino, o al revés, siguiendo el lado que cambió, y rechaza con 23514 si los dos cambian y no dicen lo mismo. Así una app de antes, que manda el enum, y una nueva, que manda el id, escriben la misma fila. Con los dos lados completos, rechaza con MN035 un movimiento entre tesoros de monedas distintas que no sea un cambio, y un cambio entre tesoros de la misma moneda; lo mira en toda alta y en toda edición que toque el tipo, un lado o monto_destino_centavos, leyendo la moneda de los dos tesoros, que es inmutable (ADR 0081). Antes de escribir toma los ajustes del taller for no key update, como una liquidación, porque todo movimiento cambia un saldo que la liquidación puede mirar (un compromiso que se renueva al pagar, un ahorro que se repone al usarlo, una meta, lo que cubre un mes); si trae proyecto_id, toma primero ese proyecto for key share, en el orden de la liquidación y de la reversión (ADR 0078).';


-- El libro mayor ---------------------------------------------------------------------------------------

-- Solo cambia el destino de un movimiento: un cambio entra con su segundo importe. Las columnas son las
-- mismas; la moneda de cada asiento es la de su tesoro. El or replace borra las opciones de la vista:
-- security_invoker va escrito otra vez.
create or replace view public.libro_mayor with (security_invoker = true) as
  select
    m.household_id,
    'manual'::text as origen,
    m.id as asiento_id,
    m.fecha,
    m.tesoro_destino as tesoro,
    m.tesoro_origen as contrapartida,
    coalesce(m.monto_destino_centavos, m.monto_centavos) as monto_centavos,
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
  'Libro mayor por tesoro: una fila por tesoro afectado, importe con signo y en la moneda de su tesoro. tesoro_id y contrapartida_id son los tesoros por id; tesoro y contrapartida, su clave (null para los tesoros del dueño). El saldo de un tesoro es sum(monto_centavos) where tesoro_id = X and not ya_en_la_apertura, y nunca se suma con el de un tesoro de otra moneda: un cambio sale de su origen con monto_centavos y entra a su destino con monto_destino_centavos (ADR 0081). Una fila ya_en_la_apertura es plata de antes de la apertura que ya estaba en los saldos con los que arrancó la app, y queda en el libro con su fecha sin mover los tesoros (ADR 0063). Los repartos de un cobro por la fila salen de public.repartos (ADR 0078).';
