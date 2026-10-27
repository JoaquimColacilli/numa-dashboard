-- Cambiar el día del próximo contacto no es registrar un contacto: la fecha del pendiente cambia en
-- su lugar, sin cerrarlo ni sumar historia, con la versión que vio la app y solo a hoy o a un día que
-- viene. El índice de un solo pendiente por trabajo sigue valiendo.

select plan(14);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));
select set_config('maun.hoy_en_el_taller', '2026-10-26', true);

select tests.entrar_como(tests.id('a'));

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'presupuesto_enviado', 90000000);

select public.guardar_proyecto(
  jsonb_build_object(
    'id', 'aaaaaaaa-0000-7000-8000-000000000010',
    'version', (select version from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'),
    'cliente_id', 'aaaaaaaa-0000-7000-8000-000000000001',
    'titulo', 'Placard',
    'estado', 'en_seguimiento',
    'comprobante', 'sin_comprobante',
    'presupuesto_centavos', 90000000
  ),
  '[]', '[]', null, null,
  '[{"id": "aaaaaaaa-0000-7000-8000-000000000101", "fecha": "2026-11-02", "nota": "Después del aguinaldo", "etapa_previa": "presupuesto_enviado"}]'
);

select set_config('tests.version', (select version::text from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000101'), true);

select lives_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', current_setting('tests.version')::integer, '2026-11-09') $$,
  'el día del pendiente se cambia con la versión que vio la app'
);

select is(
  (select array[fecha::text, nota, coalesce(hecho_el::text, 'pendiente')] from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000101'),
  array['2026-11-09', 'Después del aguinaldo', 'pendiente'],
  'la misma fila, con su nota y todavía pendiente'
);

select is(
  (select count(*)::integer from public.proximos_contactos where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  1,
  'no aparece otra fila en la historia'
);

select is(
  (select estado::text from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  'en_seguimiento',
  'el trabajo sigue en seguimiento'
);

select lives_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', current_setting('tests.version')::integer, '2026-11-09') $$,
  'el reenvío de la cola, con la misma fecha y la versión de antes, pasa sin cambiar nada'
);

select is(
  (select version from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000101'),
  current_setting('tests.version')::integer + 1,
  'el reenvío no sube la versión otra vez'
);

select throws_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', current_setting('tests.version')::integer, '2026-11-16') $$,
  'MN006', null, 'con una versión vieja y otra fecha, cambió desde que lo vio'
);

select lives_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', current_setting('tests.version')::integer + 1, '2026-10-26') $$,
  'a hoy se puede'
);

select throws_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', current_setting('tests.version')::integer + 2, '2026-10-25') $$,
  'MN049', null, 'a un día que ya pasó en el taller, no'
);

select throws_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', 1, null) $$,
  '22004', null, 'sin día no hay nada que cambiar'
);

select lives_ok(
  $$ set constraints all immediate; set constraints all deferred $$,
  'el trabajo sigue en seguimiento con su pendiente: la guarda del commit pasa'
);

update public.proximos_contactos
set hecho_el = '2026-10-26', resultado = 'otra_fecha'
where id = 'aaaaaaaa-0000-7000-8000-000000000101';

select throws_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', (select version from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000101'), '2026-12-01') $$,
  'MN048', null, 'un contacto ya registrado no cambia de fecha: es historia'
);

select tests.entrar_como(tests.id('b'));

select throws_ok(
  $$ select public.cambiar_la_fecha_del_contacto('aaaaaaaa-0000-7000-8000-000000000101', 1, '2026-12-01') $$,
  '42501', null, 'el contacto de otro taller no existe para mí'
);

select tests.salir();

select ok(
  not has_function_privilege('anon', 'public.cambiar_la_fecha_del_contacto(uuid, integer, date)', 'EXECUTE'),
  'anon no la ejecuta'
);

select * from finish();
