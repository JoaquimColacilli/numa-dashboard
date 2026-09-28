-- Los movimientos nombran sus tesoros por id (ADR 0078), así la plata puede ir y venir entre los
-- tesoros del dueño, que no tienen clave en el enum.
--
-- Tres columnas nuevas en public.movimientos, vacías; un trigger que completa el id desde el enum y el
-- enum desde el id; el relleno de los ids de las filas que existen, desde el enum; y el cambio de los
-- dos checks que miraban el enum por dos que miran los ids.
--
-- Lo que se autorizó aunque la regla de packages/db/CLAUDE.md lo cuente como destructivo, porque no
-- borra ni cambia un dato que exista: el relleno, que solo completa las columnas nuevas donde están en
-- null (sube la versión de cada fila y el próximo delta se las lleva a la app), y el reemplazo de
-- movimientos_lados_distintos y movimientos_forma_segun_tipo, que se agregan not valid con nombre
-- propio, se validan después del relleno, y recién ahí se sacan los viejos y se renombran los nuevos.
--
-- Un bundle de antes sigue andando: manda el enum, y el trigger completa el id. Al editar, manda solo
-- la clave que cambió, y el trigger sigue a ese lado.


-- Las columnas ------------------------------------------------------------------------------------------

alter table public.movimientos
  add column desde_id uuid,
  add column hacia_id uuid,
  add column cubre_el_mes date,
  add constraint movimientos_desde_fk foreign key (household_id, desde_id)
    references public.tesoros (household_id, id),
  add constraint movimientos_hacia_fk foreign key (household_id, hacia_id)
    references public.tesoros (household_id, id),
  -- Cubrir el faltante de un mes es pasar plata de un tesoro a otro, anotada con el primer día del
  -- mes que cubre. No se cubre con el diezmo: esa plata no es del taller.
  add constraint movimientos_cubre_el_mes_valido check (
    cubre_el_mes is null
    or (
      tipo = 'transferencia'
      and cubre_el_mes = date_trunc('month', cubre_el_mes)::date
      and tesoro_origen is distinct from 'diezmo'
    )
  );

comment on column public.movimientos.desde_id is
  'El tesoro de donde sale la plata, por id. Null: viene de afuera (un ingreso). Lo completa private.completar_los_tesoros() desde tesoro_origen cuando lo manda una app sin actualizar; en un tesoro del dueño, tesoro_origen queda en null (ADR 0078).';
comment on column public.movimientos.hacia_id is
  'El tesoro adonde va la plata, por id. Null: se va afuera (un gasto). Lo completa private.completar_los_tesoros() desde tesoro_destino; en un tesoro del dueño, tesoro_destino queda en null (ADR 0078).';
comment on column public.movimientos.cubre_el_mes is
  'En una transferencia que cubre el faltante de un paso de la fila, el primer día del mes que cubre; si no, null. Esa plata cuenta para el tope de ese mes del tesoro que la recibe: el próximo cobro no la vuelve a llenar (ADR 0078). No sale del diezmo.';
comment on column public.movimientos.tesoro_origen is
  'De dónde sale la plata, por su clave. Null: viene de afuera (un ingreso), o sale de un tesoro del dueño, que no tiene clave: ahí manda desde_id.';
comment on column public.movimientos.tesoro_destino is
  'A dónde va la plata, por su clave. Null: se va afuera (un gasto), o va a un tesoro del dueño, que no tiene clave: ahí manda hacia_id.';

-- Foreign keys compuestas hacia tesoros.
create index movimientos_household_desde on public.movimientos (household_id, desde_id);
create index movimientos_household_hacia on public.movimientos (household_id, hacia_id);

grant insert (desde_id, hacia_id, cubre_el_mes) on table public.movimientos to authenticated;
grant update (desde_id, hacia_id, cubre_el_mes) on table public.movimientos to authenticated;


-- El id y la clave dicen lo mismo -------------------------------------------------------------------------

create function private.completar_los_tesoros()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_clave public.tesoro;
  v_id uuid;
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

  -- La plata que cubre un mes cuenta para el tope de ese mes. Toma los ajustes, como una liquidación,
  -- para que una liquidación del mismo taller la vea entera o no la vea: nunca a medias.
  if new.cubre_el_mes is not null then
    perform 1 from public.ajustes a where a.household_id = new.household_id for no key update;
  end if;

  return new;
end;
$$;

comment on function private.completar_los_tesoros() is
  'Trigger de movimientos: completa desde_id y hacia_id desde tesoro_origen y tesoro_destino, o al revés, siguiendo el lado que cambió, y rechaza con 23514 si los dos cambian y no dicen lo mismo. Así una app de antes, que manda el enum, y una nueva, que manda el id, escriben la misma fila. Con cubre_el_mes toma los ajustes antes de escribir, como una liquidación (ADR 0078).';

revoke all on function private.completar_los_tesoros() from public, anon, authenticated;

-- Antes que metadatos: los triggers del mismo momento corren en orden alfabético, y así la versión
-- sube también cuando lo único que cambió es un id completado.
create trigger completar_los_tesoros
  before insert or update on public.movimientos
  for each row execute function private.completar_los_tesoros();


-- Los checks por id --------------------------------------------------------------------------------------

-- Los nuevos, not valid y con nombre propio mientras conviven con los viejos. pago_diezmo y
-- aporte_cocos siguen mirando además la clave: un check no puede leer tesoros, y el trigger de arriba
-- garantiza que el id y la clave dicen lo mismo.
alter table public.movimientos
  add constraint movimientos_lados_distintos_por_id check (
    num_nonnulls(desde_id, hacia_id) >= 1 and desde_id is distinct from hacia_id
  ) not valid,
  add constraint movimientos_forma_segun_tipo_por_id check (
    coalesce(
      case tipo
        when 'ingreso' then desde_id is null and hacia_id is not null
        when 'gasto' then desde_id is not null and hacia_id is null
        when 'transferencia' then desde_id is not null and hacia_id is not null
        when 'pago_diezmo' then desde_id is not null and tesoro_origen = 'diezmo' and hacia_id is null
        when 'aporte_cocos' then desde_id is not null and hacia_id is not null and tesoro_destino = 'cocos'
        when 'ajuste' then num_nonnulls(desde_id, hacia_id) = 1
      end,
      false
    )
  ) not valid;

-- El relleno: solo las columnas nuevas, solo donde están en null, y los dos lados en la misma
-- sentencia, porque los checks nuevos ya miran cada fila que se escribe y una transferencia con un
-- solo id no los pasa. El trigger ve cambiar el id y vuelve a leer la clave, que es la misma.
update public.movimientos m
set
  desde_id = coalesce(
    m.desde_id,
    (
      select t.id from public.tesoros t
      where t.household_id = m.household_id and t.clave = m.tesoro_origen
    )
  ),
  hacia_id = coalesce(
    m.hacia_id,
    (
      select t.id from public.tesoros t
      where t.household_id = m.household_id and t.clave = m.tesoro_destino
    )
  )
where (m.desde_id is null and m.tesoro_origen is not null)
  or (m.hacia_id is null and m.tesoro_destino is not null);

alter table public.movimientos validate constraint movimientos_lados_distintos_por_id;
alter table public.movimientos validate constraint movimientos_forma_segun_tipo_por_id;

alter table public.movimientos drop constraint movimientos_lados_distintos;
alter table public.movimientos drop constraint movimientos_forma_segun_tipo;

alter table public.movimientos
  rename constraint movimientos_lados_distintos_por_id to movimientos_lados_distintos;
alter table public.movimientos
  rename constraint movimientos_forma_segun_tipo_por_id to movimientos_forma_segun_tipo;

comment on type public.tipo_movimiento is
  'Tipo de un movimiento cargado a mano. Cada tipo fija qué lados (desde_id, hacia_id) lleva: ver el check movimientos_forma_segun_tipo. Una transferencia va entre dos tesoros cualesquiera, también los del dueño; el pago del diezmo sale del diezmo y el aporte va a Cocos (ADR 0018 y 0078).';
