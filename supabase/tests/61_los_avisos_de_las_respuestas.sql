-- Los avisos de lo nuevo (los detalles a mejorar): la séptima clave de las preferencias, respuestas,
-- prendida; el aviso en el momento de lo que aprueba un cliente, que la base le pide a la función de
-- avisos por pg_net con los secretos de siempre; y lo que suma el aviso de la mañana.
--
-- Hoy en el taller es el lunes 26 de octubre de 2026. Lucía aprueba la opción B del estimativo del
-- placard y propone el jueves 29 a la mañana para medir.

select plan(19);

select set_config('maun.hoy_en_el_taller', '2026-10-26', true);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.registrar(p_endpoint text)
returns jsonb
language sql
as $$
  select public.registrar_suscripcion(p_endpoint, 'B' || repeat('x', 86), repeat('y', 22), 'America/Argentina/Buenos_Aires')
$$;

create function tests.aviso_de(p_ahora timestamptz)
returns jsonb
language sql
as $$
  select e from jsonb_array_elements(public.avisos_por_mandar(p_ahora)) as e
  where e ->> 'endpoint' = 'https://push.example/ana'
$$;

create function tests.pedidos_de_respuesta()
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer from net.http_request_queue where url like '%/respuesta'
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- La séptima clave -------------------------------------------------------------------------------------

select ok(
  private.avisos_bien_formados('{"entregas": {"activo": true, "anticipacion": 2}, "visitas": {"activo": true, "anticipacion": 1}, "presupuestos": {"activo": true, "anticipacion": 1}, "seguimientos": {"activo": true, "anticipacion": 0}, "vencimientos": {"activo": true, "anticipacion": 0}, "anotaciones": {"activo": false, "anticipacion": 0}, "respuestas": {"activo": false, "anticipacion": 0}}'),
  'las preferencias con las respuestas de los clientes tienen la forma esperada'
);

select ok(
  private.avisos_bien_formados('{"entregas": {"activo": true, "anticipacion": 2}, "visitas": {"activo": true, "anticipacion": 1}, "presupuestos": {"activo": true, "anticipacion": 1}, "seguimientos": {"activo": true, "anticipacion": 0}, "vencimientos": {"activo": true, "anticipacion": 0}, "anotaciones": {"activo": false, "anticipacion": 0}}'),
  'y las de seis claves de un bundle viejo siguen sirviendo'
);

select ok(
  not private.avisos_bien_formados('{"entregas": {"activo": true, "anticipacion": 2}, "visitas": {"activo": true, "anticipacion": 1}, "presupuestos": {"activo": true, "anticipacion": 1}, "anotaciones": {"activo": false, "anticipacion": 0}, "respuestas": {"activo": true, "anticipacion": 0}}'),
  'las respuestas sin los seguimientos ni los vencimientos no son ninguna de las formas'
);

select is(
  private.avisos_completos('{}') -> 'respuestas',
  '{"activo": true, "anticipacion": 0}'::jsonb,
  'a lo guardado antes se le completan las respuestas prendidas'
);

select tests.entrar_como(tests.id('ana'));
select tests.registrar('https://push.example/ana');

select is(
  public.estado_de_mis_avisos(null) -> 'preferencias' -> 'avisos' -> 'respuestas',
  '{"activo": true, "anticipacion": 0}'::jsonb,
  'las preferencias nuevas nacen con las respuestas prendidas: las trae el default de la columna'
);


-- El estimativo de Lucía -------------------------------------------------------------------------------

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía García');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto');
insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000201', 'aaaaaaaa-0000-7000-8000-000000000010', 'En melamina', 128000000),
  ('aaaaaaaa-0000-7000-8000-000000000202', 'aaaaaaaa-0000-7000-8000-000000000010', 'Laqueado', 160000000);

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');
select public.mandar_el_presupuesto(
  'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
  (select b.borrador_version from public.presupuestos b where b.id = 'aaaaaaaa-0000-7000-8000-000000000110'),
  tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"estimativo": true, "pideFecha": true}',
  null, '2026-10-26', '2026-11-10'
);

insert into public.enlaces_publicos (proyecto_id, token_hash, token)
values (
  'aaaaaaaa-0000-7000-8000-000000000010',
  encode(sha256(convert_to('el-token-del-placard-de-lucia', 'UTF8')), 'hex'),
  'el-token-del-placard-de-lucia'
);

select tests.salir();
select set_config('tests.antes', tests.pedidos_de_respuesta()::text, true);

select tests.entrar_como_anon();
select public.responder_el_presupuesto('el-token-del-placard-de-lucia', jsonb_build_object(
  'id', '0199c000-0000-7000-8000-000000000001', 'revision_id', 'aaaaaaaa-0000-7000-8000-000000001101',
  'opcion_id', 'aaaaaaaa-0000-7000-8000-000000000202', 'dia', '2026-10-29', 'franja', 'manana',
  'nota', 'El portero abre hasta las 12.'
));
select tests.salir();


-- El aviso en el momento --------------------------------------------------------------------------------

select ok(
  (select count(*) from vault.secrets where name in ('avisos_url', 'avisos_secreto')) < 2
    or tests.pedidos_de_respuesta() = current_setting('tests.antes')::integer + 1,
  'la respuesta le pide a la función de avisos que la avise en el momento (si Vault tiene sus secretos)'
);

select is(
  public.aviso_de_la_respuesta('0199c000-0000-7000-8000-000000000001') -> 0 -> 'respuesta',
  jsonb_build_object(
    'id', '0199c000-0000-7000-8000-000000000001', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010',
    'cliente', 'Lucía García', 'estimativo', true, 'letra', 'B', 'dia', '2026-10-29', 'franja', 'manana',
    'respondida_el', '2026-10-26'
  ),
  'el aviso trae lo que hace falta para «Lucía García aprobó el estimativo y propone el jueves 29 a la mañana para medir.», sin la nota'
);

select is(
  (select array_agg(e ->> 'endpoint') from jsonb_array_elements(public.aviso_de_la_respuesta('0199c000-0000-7000-8000-000000000001')) as e),
  array['https://push.example/ana'],
  'a los dispositivos de los miembros del taller'
);

select is(
  public.aviso_de_la_respuesta('0199c000-0000-7000-8000-000000000001') -> 0 ->> 'idioma',
  'es',
  'con el idioma de cada cuenta'
);

select is(
  public.aviso_de_la_respuesta(gen_random_uuid()),
  '[]'::jsonb,
  'una respuesta que no existe no avisa a nadie'
);


-- El aviso de la mañana ---------------------------------------------------------------------------------

select is(
  (
    select array_agg(r ->> 'cliente')
    from jsonb_array_elements(tests.aviso_de('2026-10-27 10:40:00+00') -> 'respuestas') as r
  ),
  array['Lucía García'],
  'el aviso de la mañana siguiente la repite, por si la del momento no llegó'
);

select is(
  jsonb_array_length(tests.aviso_de('2026-10-29 10:40:00+00') -> 'respuestas'),
  0,
  'dos días después ya no: queda en la ficha y en Consultas'
);

select is(
  jsonb_typeof(tests.aviso_de('2026-10-27 10:40:00+00') -> 'filas' -> 'pagos_de_vencimientos'),
  'array',
  'el aviso de la mañana trae los pagos de los vencimientos, para decir cuánto se pagó y cuánto puso Maun'
);


-- Lo que lo apaga --------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));
select public.guardar_preferencias_de_avisos('America/Argentina/Buenos_Aires', '07:30',
  '{"entregas": {"activo": true, "anticipacion": 2}, "visitas": {"activo": true, "anticipacion": 1}, "presupuestos": {"activo": true, "anticipacion": 1}, "seguimientos": {"activo": true, "anticipacion": 0}, "vencimientos": {"activo": true, "anticipacion": 0}, "anotaciones": {"activo": false, "anticipacion": 0}, "respuestas": {"activo": false, "anticipacion": 0}}');
select tests.salir();

select is(
  public.aviso_de_la_respuesta('0199c000-0000-7000-8000-000000000001'),
  '[]'::jsonb,
  'con las respuestas apagadas en Avisos, no avisa en el momento'
);

select tests.entrar_como(tests.id('ana'));
select public.guardar_preferencias_de_avisos('America/Argentina/Buenos_Aires', '07:30',
  '{"entregas": {"activo": true, "anticipacion": 2}, "visitas": {"activo": true, "anticipacion": 1}, "presupuestos": {"activo": true, "anticipacion": 1}, "seguimientos": {"activo": true, "anticipacion": 0}, "vencimientos": {"activo": true, "anticipacion": 0}, "anotaciones": {"activo": false, "anticipacion": 0}}');
update public.respuestas_al_presupuesto set atendida_at = now() where id = '0199c000-0000-7000-8000-000000000001';
select tests.salir();

select is(
  public.aviso_de_la_respuesta('0199c000-0000-7000-8000-000000000001'),
  '[]'::jsonb,
  'atendida, tampoco: ni en el momento'
);

select is(
  jsonb_array_length(tests.aviso_de('2026-10-27 10:40:00+00') -> 'respuestas'),
  0,
  'ni a la mañana'
);


-- Quién puede ------------------------------------------------------------------------------------------

select ok(
  not has_function_privilege('anon', 'public.aviso_de_la_respuesta(uuid)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.aviso_de_la_respuesta(uuid)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.aviso_de_la_respuesta(uuid)', 'EXECUTE'),
  'ni el cliente ni el dueño leen los dispositivos: solo la función de avisos'
);

select ok(
  has_function_privilege('service_role', 'public.aviso_de_la_respuesta(uuid)', 'EXECUTE'),
  'la función de avisos sí'
);

select ok(
  not has_function_privilege('authenticated', 'private.pedir_el_aviso_de_la_respuesta()', 'EXECUTE')
    and not has_function_privilege('anon', 'private.respuesta_para_el_aviso(uuid)', 'EXECUTE'),
  'y nadie de afuera pide el aviso ni arma la respuesta'
);

select * from finish();
