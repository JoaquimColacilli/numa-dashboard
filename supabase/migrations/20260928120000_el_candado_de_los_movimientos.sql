-- Todo movimiento toma los ajustes del taller antes de escribir (ADR 0078, los tipos de tesoro).
--
-- Hasta ahora solo lo hacía una transferencia que cubre un mes. Con los compromisos que se renuevan
-- al pagar y los ahorros que se reponen al usarlos, la liquidación mira el saldo de esos tesoros: un
-- gasto desde uno de ellos cambia lo que el cobro le da. Con el candado, una liquidación del mismo
-- taller ve cada movimiento entero o no lo ve, como ya pasaba con la plata que cubre un mes.
--
-- Si el movimiento trae proyecto_id, toma primero ese proyecto for key share y después los ajustes.
-- Es el orden de la liquidación y de la reversión (el proyecto, después los ajustes). Sin eso, la
-- foreign key del proyecto pediría su lock después del de los ajustes, y un cobro de ese proyecto
-- que ya lo tiene y espera los ajustes quedaría trabado con este movimiento.
--
-- create or replace de la función del trigger, con la misma firma: lo demás no cambia. No cambia
-- ninguna fila.

create or replace function private.completar_los_tesoros()
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
$$;

comment on function private.completar_los_tesoros() is
  'Trigger de movimientos: completa desde_id y hacia_id desde tesoro_origen y tesoro_destino, o al revés, siguiendo el lado que cambió, y rechaza con 23514 si los dos cambian y no dicen lo mismo. Así una app de antes, que manda el enum, y una nueva, que manda el id, escriben la misma fila. Antes de escribir toma los ajustes del taller for no key update, como una liquidación, porque todo movimiento cambia un saldo que la liquidación puede mirar (un compromiso que se renueva al pagar, un ahorro que se repone al usarlo, una meta, lo que cubre un mes); si trae proyecto_id, toma primero ese proyecto for key share, en el orden de la liquidación y de la reversión (ADR 0078).';
