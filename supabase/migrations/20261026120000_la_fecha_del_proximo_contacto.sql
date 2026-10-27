-- Cambiar el día del próximo contacto no es registrar un contacto: la fecha del pendiente cambia en su
-- lugar, sin cerrarlo y sin sumar historia, que es de los contactos que pasaron. Sigue habiendo uno
-- solo pendiente por trabajo, como lo garantiza el índice proximos_contactos_un_pendiente.

create function public.cambiar_la_fecha_del_contacto(p_id uuid, p_version integer, p_fecha date)
returns public.proximos_contactos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_contacto public.proximos_contactos;
begin
  if num_nulls(p_id, p_version, p_fecha) > 0 then
    raise exception 'Cambiar la fecha necesita el contacto, la versión que viste y el día'
      using errcode = '22004';
  end if;

  select c.* into v_contacto
  from public.proximos_contactos c
  where c.id = p_id;

  if not found then
    raise exception 'El contacto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El trabajo primero y después el contacto, en el orden de guardar_proyecto, que registra el
  -- contacto con el trabajo tomado: así los dos no se traban.
  perform 1
  from public.proyectos p
  where p.household_id = v_contacto.household_id and p.id = v_contacto.proyecto_id
  for share;

  select c.* into v_contacto
  from public.proximos_contactos c
  where c.id = p_id
  for update;

  -- El reenvío de la cola: ya tiene ese día y la versión es la que dejó el primer envío.
  if v_contacto.fecha = p_fecha and v_contacto.version in (p_version, p_version + 1)
    and v_contacto.hecho_el is null and v_contacto.deleted_at is null then
    return v_contacto;
  end if;

  if v_contacto.deleted_at is not null then
    raise exception 'El contacto está borrado' using errcode = 'MN002';
  end if;

  if v_contacto.hecho_el is not null then
    raise exception 'Ese contacto ya se registró: su fecha no se cambia'
      using errcode = 'MN048',
            hint = 'Si hay que volver a escribirle, poné una fecha nueva desde la ficha.';
  end if;

  if v_contacto.version <> p_version then
    raise exception 'El contacto cambió desde que lo viste'
      using errcode = 'MN006',
            detail = format('versión vista %s, versión actual %s', p_version, v_contacto.version);
  end if;

  if p_fecha < private.hoy_en_el_taller() then
    raise exception 'El próximo contacto va hoy o un día que viene'
      using errcode = 'MN049',
            detail = format('fecha %s, hoy %s', p_fecha, private.hoy_en_el_taller()),
            hint = 'Elegí hoy o un día que viene.';
  end if;

  update public.proximos_contactos
  set fecha = p_fecha
  where id = v_contacto.id
  returning * into v_contacto;

  return v_contacto;
end;
$$;

revoke all on function public.cambiar_la_fecha_del_contacto(uuid, integer, date) from public, anon, authenticated;
grant execute on function public.cambiar_la_fecha_del_contacto(uuid, integer, date) to authenticated;

comment on function public.cambiar_la_fecha_del_contacto(uuid, integer, date) is 'Cambia el día del contacto pendiente de un trabajo en seguimiento sin registrarlo: la misma fila, sin historia nueva. Toma el trabajo for share y después el contacto for update. Reconoce el reenvío de la cola (ya tiene ese día); rechaza un contacto borrado (MN002), uno ya registrado (MN048), una versión que no es la que vio la app (MN006) y un día que ya pasó en el taller (MN049). Corre como el usuario: la RLS y el grant de update de fecha deciden.';
