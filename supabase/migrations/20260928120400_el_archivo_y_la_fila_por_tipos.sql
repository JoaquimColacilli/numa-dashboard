-- Archivar y guardar la fila con los tipos de tesoro (ADR 0078, los tipos de tesoro).
--
-- private.cuidar_el_archivo_del_tesoro(), la guarda de MN024, mira también las obligaciones y el
-- superávit de la fila guardada y de la reapertura_fila de cada proyecto vivo: volver a cobrar un
-- reabierto le pagaría a un tesoro archivado con la foto, y lo mismo el próximo cobro con la fila de
-- hoy. private.guardar_la_fila() le pasa a private.problema_de_la_fila() la meta de cada tesoro (la de
-- Cocos, de ajustes), porque un ahorro que va hasta la meta necesita que su tesoro la tenga.
--
-- create or replace de las dos, con la misma firma: la función del trigger es de las que autorizó el
-- dueño, y guardar_la_fila no cambia sus grants ni lo que devuelve. No cambia ninguna fila.

create or replace function private.cuidar_el_archivo_del_tesoro()
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

  -- En la fila guardada: una obligación, un paso, una parte o el superávit. Una fila guardada antes de
  -- los tipos de tesoro no tiene obligaciones ni superávit: los de siempre son el diezmo y Maun, que
  -- no se archivan.
  if exists (
      select 1
      from jsonb_array_elements(
        coalesce(v_fila -> 'obligaciones', '[]'::jsonb)
        || coalesce(v_fila -> 'pasos', '[]'::jsonb)
        || coalesce(v_fila -> 'reparto', '[]'::jsonb)
      ) as e (valor)
      where e.valor ->> 'tesoro' = new.id::text
    )
    or v_fila ->> 'superavit' = new.id::text
    -- Volver a cobrar un reabierto reparte con su foto: si el tesoro no estuviera, le pagaría a uno
    -- archivado.
    or exists (
      select 1
      from public.proyectos p
      cross join lateral jsonb_array_elements(
        coalesce(p.reapertura_fila -> 'fila' -> 'obligaciones', '[]'::jsonb)
        || coalesce(p.reapertura_fila -> 'fila' -> 'pasos', '[]'::jsonb)
        || coalesce(p.reapertura_fila -> 'fila' -> 'reparto', '[]'::jsonb)
      ) as e (valor)
      where p.household_id = new.household_id
        and p.deleted_at is null
        and p.reapertura_fila is not null
        and e.valor ->> 'tesoro' = new.id::text
    )
    or exists (
      select 1
      from public.proyectos p
      where p.household_id = new.household_id
        and p.deleted_at is null
        and p.reapertura_fila -> 'fila' ->> 'superavit' = new.id::text
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
  'Guarda de archivar un tesoro: no deja archivar uno que está en la fila guardada (como obligación, paso, parte o superávit), en la foto de un cobro reabierto de un proyecto vivo (volver a cobrarlo le pagaría) o que tiene saldo distinto de cero en el libro mayor. Toma los ajustes antes de mirar. Rechaza con MN024; la app lo avisa antes con lo que ve en la réplica (ADR 0078).';

create or replace function private.guardar_la_fila(p_version integer, p_fila jsonb)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
  v_tesoros jsonb;
  v_problema text;
begin
  if p_version is null then
    raise exception 'Guardar la fila necesita la revisión que viste' using errcode = '22004';
  end if;

  -- El mismo candado que una liquidación: un cobro del taller ve la fila de antes o la de después,
  -- nunca una a medias, y dos guardados a la vez se esperan.
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = private.household_actual()
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  -- El reenvío de la cola: esta misma fila ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.fila_version = p_version + 1 and v_ajustes.fila is not distinct from p_fila then
    return v_ajustes;
  end if;

  if v_ajustes.fila_version <> p_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_ajustes.fila_version);
  end if;

  -- Null vuelve a la fila de siempre. La pantalla no lo ofrece: lo usan los e2e para dejar sin fila
  -- el taller de prueba.
  if p_fila is not null then
    -- Los tesoros del taller con su meta: la de Cocos sigue en ajustes, la de los demás en tesoros.
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'clave', t.clave,
          'archivado', t.archivado_at is not null,
          'meta', case when t.clave = 'cocos' then v_ajustes.meta_cocos_centavos else t.meta_centavos end
        )
      ),
      '[]'::jsonb
    )
    into v_tesoros
    from public.tesoros t
    where t.household_id = v_ajustes.household_id
      and t.deleted_at is null;

    -- El código del problema va en el detail, para el registro. La app no lo lee: la pantalla ya
    -- frena antes con problemasDeLaFila, que es la misma cuenta.
    v_problema := private.problema_de_la_fila(p_fila, v_tesoros);
    if v_problema is not null then
      raise exception 'La fila no se pudo guardar.'
        using errcode = 'MN023',
              detail = v_problema,
              hint = 'Revisala y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    fila = p_fila,
    fila_version = fila_version + 1,
    fila_guardada_at = clock_timestamp()
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$$;

comment on function private.guardar_la_fila(integer, jsonb) is
  'Guarda la fila del taller: bloquea los ajustes, compara la revisión que vio la app (MN006), valida la fila con private.problema_de_la_fila() contra los tesoros del taller y sus metas (la de Cocos, de ajustes) (MN023, con el código del problema en el detail), la guarda, suma una revisión y anota la fecha. Con la fila en null vuelve a la fila de siempre. Reconoce el reenvío idéntico: la misma fila con la revisión siguiente. Los cambios valen desde el próximo cobro: no toca ninguna liquidación hecha (ADR 0003 y 0078).';
