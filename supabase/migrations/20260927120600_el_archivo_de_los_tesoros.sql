-- Archivar un tesoro (ADR 0078): no se archiva uno que la plata todavía necesita.
--
-- Una función y un trigger nuevos sobre public.tesoros. No cambia ninguna fila.

create function private.cuidar_el_archivo_del_tesoro()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fila jsonb;
  v_saldo bigint;
begin
  -- Solo mira lo que archiva: desarchivar, o tocar otra cosa de uno archivado, pasa.
  if new.archivado_at is null or old.archivado_at is not null then
    return new;
  end if;

  -- Toma los ajustes antes de mirar, como toda guarda que lee otra fila para decidir: una liquidación
  -- o un guardado de la fila del mismo taller que corre en paralelo termina antes o espera.
  select a.fila into v_fila
  from public.ajustes a
  where a.household_id = new.household_id
  for no key update;

  if exists (
      select 1
      from jsonb_array_elements(coalesce(v_fila -> 'pasos', '[]'::jsonb) || coalesce(v_fila -> 'reparto', '[]'::jsonb)) as e (valor)
      where e.valor ->> 'tesoro' = new.id::text
    )
    -- Volver a cobrar un reabierto reparte con su foto: si el tesoro no estuviera, le pagaría a uno
    -- archivado.
    or exists (
      select 1
      from public.proyectos p
      cross join lateral jsonb_array_elements(
        coalesce(p.reapertura_fila -> 'fila' -> 'pasos', '[]'::jsonb)
        || coalesce(p.reapertura_fila -> 'fila' -> 'reparto', '[]'::jsonb)
      ) as e (valor)
      where p.household_id = new.household_id
        and p.deleted_at is null
        and p.reapertura_fila is not null
        and e.valor ->> 'tesoro' = new.id::text
    )
  then
    raise exception 'Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.'
      using errcode = 'MN024',
            detail = 'en la fila';
  end if;

  select coalesce(sum(l.monto_centavos), 0) into v_saldo
  from public.libro_mayor l
  where l.household_id = new.household_id
    and l.tesoro_id = new.id
    and not l.ya_en_la_apertura;

  if v_saldo <> 0 then
    raise exception 'Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.'
      using errcode = 'MN024',
            detail = format('saldo %s', v_saldo);
  end if;

  return new;
end;
$$;

comment on function private.cuidar_el_archivo_del_tesoro() is
  'Guarda de archivar un tesoro: no deja archivar uno que está en la fila guardada, en la foto de un cobro reabierto de un proyecto vivo (volver a cobrarlo le pagaría) o que tiene saldo distinto de cero en el libro mayor. Toma los ajustes antes de mirar. Rechaza con MN024; la app lo avisa antes con lo que ve en la réplica (ADR 0078).';

revoke all on function private.cuidar_el_archivo_del_tesoro() from public, anon, authenticated;

create trigger cuidar_el_archivo
  before update of archivado_at on public.tesoros
  for each row execute function private.cuidar_el_archivo_del_tesoro();
