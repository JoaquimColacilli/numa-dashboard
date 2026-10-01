-- El día en que se aceptó el presupuesto (ADR 0080): lo anota la base y nadie más, con el mismo trigger
-- que anota cada cambio de etapa en cambios_de_estado. Así la ficha y la página del cliente leen la
-- misma fecha, y la réplica no necesita cambios_de_estado, que no viaja.
--
-- create or replace de private.anotar_el_cambio_de_estado(), la misma firma: sigue security definer y
-- sin grants, y el trigger no cambia. Suma un update de presupuestos.aceptado_el cuando el trabajo pasa
-- de una consulta a en curso (el día del taller, el mismo de cambios_de_estado), y lo vuelve a null
-- cuando vuelve a una consulta. No toca el contenido del borrador ni su revisión. Ninguna fila existente
-- cambia: hoy ningún trabajo tiene presupuesto.

create or replace function private.anotar_el_cambio_de_estado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return null;
  end if;

  insert into public.cambios_de_estado (household_id, proyecto_id, desde, hacia, ocurrio_el)
  values (
    new.household_id,
    new.id,
    case when tg_op = 'UPDATE' then old.estado end,
    new.estado,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  );

  -- El día en que el cliente aceptó el presupuesto: cuando pasa de una consulta a en curso. Si vuelve
  -- a una consulta («Volvió a presupuesto», o un perdido que se reactiva), deja de estar aceptado.
  if tg_op = 'UPDATE' then
    if new.estado = 'en_curso'
      and old.estado not in ('en_curso', 'entregado', 'cobrado', 'perdido')
    then
      update public.presupuestos b
      set aceptado_el = (now() at time zone 'America/Argentina/Buenos_Aires')::date
      where b.household_id = new.household_id
        and b.proyecto_id = new.id
        and b.deleted_at is null
        and b.aceptado_el is distinct from (now() at time zone 'America/Argentina/Buenos_Aires')::date;
    elsif new.estado not in ('en_curso', 'entregado', 'cobrado', 'perdido') then
      update public.presupuestos b
      set aceptado_el = null
      where b.household_id = new.household_id
        and b.proyecto_id = new.id
        and b.deleted_at is null
        and b.aceptado_el is not null;
    end if;
  end if;

  return null;
end;
$$;

comment on function private.anotar_el_cambio_de_estado() is
  'Anota en public.cambios_de_estado cada vez que un trabajo cambia de etapa, venga de donde venga (el agregado, el cobro, la reapertura, el envío del presupuesto), y le pone a su presupuesto el día en que se aceptó (aceptado_el) cuando pasa de una consulta a en curso, o se lo saca cuando vuelve a una consulta (ADR 0080). Es security definer porque la app no tiene grant de insert sobre cambios_de_estado ni de update sobre presupuestos: la historia y la aceptación no las escribe el cliente.';
