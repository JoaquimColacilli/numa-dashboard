-- Lo que conviene preguntar en una consulta para un estimativo prudente: la lista del taller en
-- ajustes y lo contestado de cada trabajo en el trabajo. Las dos se escriben con un update de su
-- columna sola, como las notas, y cada una tiene su check de forma, gemelo de @maun/domain.

create function private.problema_de_las_preguntas(p_preguntas jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_pregunta jsonb;
  v_id text;
  v_vistas text[] := array[]::text[];
begin
  if p_preguntas is null or jsonb_typeof(p_preguntas) is distinct from 'array' then
    return 'forma-invalida';
  end if;

  for v_pregunta in select e.valor from jsonb_array_elements(p_preguntas) as e (valor) loop
    if jsonb_typeof(v_pregunta) is distinct from 'object'
      or (select array_agg(k order by k) from jsonb_object_keys(v_pregunta) as k)
        is distinct from array['ayuda', 'id', 'rotulo']
      or jsonb_typeof(v_pregunta -> 'id') is distinct from 'string'
      or jsonb_typeof(v_pregunta -> 'rotulo') is distinct from 'string'
      or jsonb_typeof(v_pregunta -> 'ayuda') is distinct from 'string' then
      return 'forma-invalida';
    end if;
  end loop;

  if jsonb_array_length(p_preguntas) > 12 then
    return 'demasiadas-preguntas';
  end if;

  if p_preguntas -> 0 ->> 'id' is distinct from 'domicilio' then
    return 'sin-domicilio';
  end if;

  for v_pregunta in
    select e.valor from jsonb_array_elements(p_preguntas) with ordinality as e (valor, orden) order by e.orden
  loop
    v_id := v_pregunta ->> 'id';
    if char_length(v_id) > 40 or v_id !~ '^[a-z0-9][a-z0-9-]*$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistas) then
      return 'pregunta-repetida';
    end if;
    v_vistas := v_vistas || v_id;
    if btrim(v_pregunta ->> 'rotulo') = '' or char_length(v_pregunta ->> 'rotulo') > 60 then
      return 'rotulo-invalido';
    end if;
    if char_length(v_pregunta ->> 'ayuda') > 120 then
      return 'ayuda-invalida';
    end if;
  end loop;

  return null;
end;
$$;

create function private.problema_de_las_respuestas(p_respuestas jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_respuesta jsonb;
  v_id text;
  v_vistas text[] := array[]::text[];
begin
  if p_respuestas is null or jsonb_typeof(p_respuestas) is distinct from 'array' then
    return 'forma-invalida';
  end if;

  for v_respuesta in select e.valor from jsonb_array_elements(p_respuestas) as e (valor) loop
    if jsonb_typeof(v_respuesta) is distinct from 'object'
      or (select array_agg(k order by k) from jsonb_object_keys(v_respuesta) as k)
        is distinct from array['id', 'pregunta', 'respuesta']
      or jsonb_typeof(v_respuesta -> 'id') is distinct from 'string'
      or jsonb_typeof(v_respuesta -> 'pregunta') is distinct from 'string'
      or jsonb_typeof(v_respuesta -> 'respuesta') is distinct from 'string' then
      return 'forma-invalida';
    end if;
  end loop;

  if jsonb_array_length(p_respuestas) > 24 then
    return 'demasiadas-respuestas';
  end if;

  for v_respuesta in
    select e.valor from jsonb_array_elements(p_respuestas) with ordinality as e (valor, orden) order by e.orden
  loop
    v_id := v_respuesta ->> 'id';
    if char_length(v_id) > 40 or v_id !~ '^[a-z0-9][a-z0-9-]*$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistas) then
      return 'respuesta-repetida';
    end if;
    v_vistas := v_vistas || v_id;
    if v_id = 'domicilio' then
      return 'respuesta-del-domicilio';
    end if;
    if btrim(v_respuesta ->> 'pregunta') = '' or char_length(v_respuesta ->> 'pregunta') > 60 then
      return 'pregunta-invalida';
    end if;
    if btrim(v_respuesta ->> 'respuesta') = '' or char_length(v_respuesta ->> 'respuesta') > 500 then
      return 'respuesta-invalida';
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function private.problema_de_las_preguntas(jsonb) from public, anon, authenticated;
revoke all on function private.problema_de_las_respuestas(jsonb) from public, anon, authenticated;
grant execute on function private.problema_de_las_preguntas(jsonb) to authenticated;
grant execute on function private.problema_de_las_respuestas(jsonb) to authenticated;

comment on function private.problema_de_las_preguntas(jsonb) is 'La forma de las preguntas de una consulta, o null si está bien: una lista de hasta 12 objetos {id, rotulo, ayuda} de texto, con el domicilio primero, ids en minúscula de hasta 40 sin repetir, el rótulo con algo y hasta 60 caracteres y la ayuda hasta 120. Gemela de problemaDeLasPreguntas de @maun/domain; la usa el check de ajustes.preguntas_de_la_consulta, así que la ejecuta el dueño que edita sus ajustes.';
comment on function private.problema_de_las_respuestas(jsonb) is 'La forma de lo contestado en una consulta, o null si está bien: una lista de hasta 24 objetos {id, pregunta, respuesta} de texto, con ids de pregunta sin repetir y nunca el del domicilio (que es la dirección del trabajo), la pregunta como estaba, con algo y hasta 60 caracteres, y la respuesta con algo y hasta 500. Gemela de problemaDeLasRespuestas de @maun/domain; la usa el check de proyectos.respuestas_de_la_consulta.';

alter table public.ajustes
  add column preguntas_de_la_consulta jsonb,
  add constraint ajustes_preguntas_de_la_consulta_validas
    check (preguntas_de_la_consulta is null or private.problema_de_las_preguntas(preguntas_de_la_consulta) is null);

comment on column public.ajustes.preguntas_de_la_consulta is 'Lo que el taller pregunta en una consulta para el estimativo, en su orden: {id, rotulo, ayuda}, con el domicilio primero (es la dirección del trabajo). Null es las de siempre, que la app arma en el idioma del dueño: el domicilio, el acceso al lugar y la urgencia. La escribe el dueño desde Ajustes con un update de esta columna sola.';

grant update (preguntas_de_la_consulta) on public.ajustes to authenticated;

alter table public.proyectos
  add column respuestas_de_la_consulta jsonb not null default '[]'::jsonb,
  add constraint proyectos_respuestas_de_la_consulta_validas
    check (private.problema_de_las_respuestas(respuestas_de_la_consulta) is null);

comment on column public.proyectos.respuestas_de_la_consulta is 'Lo contestado de las preguntas de la consulta, por id de pregunta y con la pregunta como estaba al contestarla: cambiar o borrar una pregunta en Ajustes no pierde lo contestado. El domicilio no va acá: es direccion_entrega. Se guarda con un update de esta columna sola, como las notas, y no viaja a la página del cliente.';

grant update (respuestas_de_la_consulta) on public.proyectos to authenticated;
