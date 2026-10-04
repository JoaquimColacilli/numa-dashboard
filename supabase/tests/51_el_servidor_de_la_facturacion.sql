-- El servidor de la facturación (ADR 0085): las funciones de service_role que usa la función de borde, la
-- toma y la invariante de un número en vuelo por secuencia, cada paso de facturacion_anotar, los tickets del
-- WSAA, los certificados de producción y la conexión, el acceso, las alertas del control, los intercambios y
-- las tres funciones sin grants de db:facturacion (traba 2). Y que una escritura de service_role pasa por
-- mantener_metadatos y avisar_los_cambios como cualquier otra de la réplica. Todo termina en rollback: un
-- taller del fixture en producción no manda nada (pg_net no sale sin confirmar).

select plan(92);

grant usage on schema tests to service_role;

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));
select tests.guardar('c', tests.crear_usuario('c@maun.test'));
select tests.guardar('household_c', private.crear_household('Taller C', tests.id('c')));
select tests.guardar('m', tests.crear_usuario('m@maun.test'));
insert into public.household_members (household_id, user_id, rol) values (tests.id('household_a'), tests.id('m'), 'miembro');

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía Gómez');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'en_curso', 90000000);
insert into public.pagos (id, proyecto_id, fecha, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-20', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-21', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-22', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000014', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-23', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000015', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-24', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000016', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-25', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000017', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-26', 10000000);

select tests.entrar_como(tests.id('b'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Rubén');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'Mesa', 'en_curso', 30000000);
insert into public.pagos (id, proyecto_id, fecha, monto_centavos) values
  ('bbbbbbbb-0000-7000-8000-000000000011', 'bbbbbbbb-0000-7000-8000-000000000010', '2026-09-20', 10000000),
  ('bbbbbbbb-0000-7000-8000-000000000012', 'bbbbbbbb-0000-7000-8000-000000000010', '2026-09-21', 10000000),
  ('bbbbbbbb-0000-7000-8000-000000000013', 'bbbbbbbb-0000-7000-8000-000000000010', '2026-09-22', 10000000);

select tests.entrar_como(tests.id('c'));
insert into public.clientes (id, nombre) values ('dddddddd-0000-7000-8000-000000000001', 'Marta');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('dddddddd-0000-7000-8000-000000000010', 'dddddddd-0000-7000-8000-000000000001', 'Rack', 'en_curso', 30000000);
insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
  values ('dddddddd-0000-7000-8000-000000000011', 'dddddddd-0000-7000-8000-000000000010', '2026-09-20', 10000000);

-- A factura en homologación y B en producción; C no está conectado.
select tests.salir();
update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-11111111-2',
  facturacion_punto_de_venta = 1, facturacion_desde = '2026-09-01'
where household_id = tests.id('household_a');
update public.ajustes set facturacion_ambiente = 'produccion', facturacion_cuit = '20-30123456-3',
  facturacion_punto_de_venta = 3, facturacion_desde = '2026-09-01'
where household_id = tests.id('household_b');

create function tests.de_a(p_fila jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'household_id', tests.id('household_a'), 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010'
  ) || p_fila
$$;

create function tests.de_b(p_fila jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'household_id', tests.id('household_b'), 'proyecto_id', 'bbbbbbbb-0000-7000-8000-000000000010',
    'ambiente', 'produccion', 'cuit_emisor', '20-30123456-3', 'punto_de_venta', 3
  ) || p_fila
$$;

create function tests.autorizada(p_numero integer)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'estado', 'autorizada', 'numero', p_numero, 'fecha', '2026-10-01', 'cae', '76398765432109',
    'cae_vence', '2026-10-11', 'autorizada_at', now()
  )
$$;

-- Los comprobantes de las pruebas empiezan con cccccccc: así lo pendiente de la base real no se mezcla.
create function tests.de_las_pruebas(p_ids uuid[])
returns uuid[]
language sql
as $$
  select coalesce(array_agg(t.id order by t.n), array[]::uuid[])
  from unnest(p_ids) with ordinality as t (id, n)
  where t.id::text like 'cccccccc-%'
$$;

create function tests.pedido_pem()
returns text
language sql
immutable
as $$
  select E'-----BEGIN CERTIFICATE REQUEST-----\nMIIBpedido\n-----END CERTIFICATE REQUEST-----\n'
$$;

create function tests.certificado_pem()
returns text
language sql
immutable
as $$
  select E'-----BEGIN CERTIFICATE-----\nMIIBcertificado\n-----END CERTIFICATE-----\n'
$$;

-- De A: una factura autorizada con su nota pedida, dos facturas pedidas, una a revisar, otra a revisar
-- más y una de baja con el número más alto.
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000000', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000011'
) || tests.autorizada(5)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000001', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000012',
  'pedida_at', '2026-10-03 10:00:00+00'
)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000002', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000013',
  'pedida_at', '2026-10-03 10:01:00+00'
)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000003', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000011',
  'tipo', 'nota_de_credito_c', 'asociado_id', 'cccccccc-0000-7000-8000-000000000000',
  'detalle', 'Anula la factura C 00001-00000005', 'pedida_at', '2026-10-03 10:02:00+00'
)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000e1', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000014',
  'estado', 'a_revisar', 'numero', 44, 'fecha', '2026-10-02', 'rechazo', '{"motivo": "datos distintos"}'::jsonb
)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000e2', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000015',
  'estado', 'a_revisar', 'numero', 45, 'fecha', '2026-10-02', 'rechazo', '{"motivo": "número ocupado"}'::jsonb
)));
select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000d1', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000016',
  'deleted_at', now()
) || tests.autorizada(50)));

-- De B, en producción: una autorizada con el número 7 y una pedida.
select tests.un_comprobante(tests.de_b(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000b1', 'pago_id', 'bbbbbbbb-0000-7000-8000-000000000011'
) || tests.autorizada(7)));
select tests.un_comprobante(tests.de_b(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000b2', 'pago_id', 'bbbbbbbb-0000-7000-8000-000000000012'
)));

-- De C, uno de prueba pedido de antes, que traba su conexión.
select tests.un_comprobante(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000c1', 'household_id', tests.id('household_c'),
  'proyecto_id', 'dddddddd-0000-7000-8000-000000000010', 'pago_id', 'dddddddd-0000-7000-8000-000000000011'
));

-- El espía del aviso de cambios, como en 31_el_aviso_de_cambios.sql.
create table tests.avisos (orden bigint generated always as identity, household uuid);

create or replace function private.mandar_el_aviso_de_cambios(p_household uuid)
returns void
language sql
set search_path = ''
as $$
  insert into tests.avisos (household) values (p_household)
$$;


-- Quién llama a qué ----------------------------------------------------------------------------------------------

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
      and p.proname like 'facturacion\_%'
      and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE'))
  $$,
  'ni el dueño ni anon ejecutan las funciones del servidor de la facturación'
);

select is(
  (
    select count(*)::int
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname like 'facturacion\_%'
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
      and not p.prosecdef
  ),
  14,
  'service_role ejecuta las catorce de public, que no corren elevadas: elevan las de private'
);

select ok(
  not has_table_privilege('service_role', 'private.arca_certificados', 'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('service_role', 'private.arca_tickets', 'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('service_role', 'private.arca_intercambios', 'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('authenticated', 'private.arca_certificados', 'SELECT')
    and not has_table_privilege('authenticated', 'private.arca_tickets', 'SELECT')
    and not has_table_privilege('authenticated', 'private.arca_intercambios', 'SELECT'),
  'los certificados, los tickets y los intercambios no tienen grants para nadie: los tocan solo las funciones'
);

select ok(
  not has_function_privilege('service_role', 'private.conectar_la_facturacion(uuid,text,text,integer,date)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.conectar_la_facturacion(uuid,text,text,integer,date)', 'EXECUTE')
    and not has_function_privilege('service_role', 'private.desconectar_la_facturacion(uuid,boolean)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.desconectar_la_facturacion(uuid,boolean)', 'EXECUTE')
    and not has_function_privilege('service_role', 'private.resolver_el_comprobante(uuid,jsonb)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.resolver_el_comprobante(uuid,jsonb)', 'EXECUTE'),
  'conectar, desconectar y resolver no tienen grant: solo el dueño de la base, con db:facturacion (traba 2)'
);

select tests.entrar_como(tests.id('a'));

select throws_ok(
  $$ select public.facturacion_tomar('cccccccc-0000-7000-8000-000000000001', 120) $$,
  '42501', null,
  'el dueño no toma un comprobante'
);

select throws_ok(
  $$ select public.facturacion_conectar(tests.id('household_a'), 'cccccccc-0000-7000-8000-000000000001', 1) $$,
  '42501', null,
  'ni conecta su taller en producción por su cuenta'
);


-- La toma, y la escritura de service_role que pasa por los triggers de siempre -----------------------------------

select tests.salir();
select set_config('maun.cambios_avisados', '', true);
select set_config('role', 'service_role', true);

select throws_ok(
  $$ select private.conectar_la_facturacion(tests.id('household_c'), 'produccion', '20-30123456-3', 4, '2026-10-03') $$,
  '42501', null,
  'la clave del servidor tampoco conecta un taller por abajo'
);

select is(
  tests.de_las_pruebas(public.facturacion_pendientes(array['homologacion'])),
  array[
    'cccccccc-0000-7000-8000-000000000001', 'cccccccc-0000-7000-8000-000000000002',
    'cccccccc-0000-7000-8000-000000000003', 'cccccccc-0000-7000-8000-0000000000c1'
  ]::uuid[],
  'lo pendiente de homologación, por cuándo se pidió: nada a revisar, autorizado ni dado de baja'
);

select is(
  tests.de_las_pruebas(public.facturacion_pendientes(array['produccion'])),
  array['cccccccc-0000-7000-8000-0000000000b2']::uuid[],
  'y lo de producción, solo si la función lo pide'
);

select is(
  (
    select array[t ->> 'intentos', ((t ->> 'emitiendo_hasta')::timestamptz = now() + interval '120 seconds')::text]
    from public.facturacion_tomar('cccccccc-0000-7000-8000-000000000001', 120) as t
  ),
  array['1', 'true'],
  'la toma le pone su vencimiento y le suma un intento'
);

select tests.salir();

select is(
  (select array_agg(household order by orden) from tests.avisos),
  array[tests.id('household_a')],
  'la escritura de service_role avisa al taller, como toda escritura de la réplica'
);

select is(
  (select array[version::text, (updated_at > created_at)::text] from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'),
  array['2', 'true'],
  'y mantener_metadatos le sube la versión y la marca del delta'
);

select set_config('role', 'service_role', true);

select is(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000001', 120),
  null,
  'una fila tomada no se vuelve a tomar'
);

select is(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000002', 120),
  null,
  'ni otra pedida de su secuencia: un número en vuelo por secuencia, también entre dos pedidas'
);

select isnt(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000003', 120),
  null,
  'la nota de crédito numera aparte y se toma'
);

select is(
  tests.de_las_pruebas(public.facturacion_pendientes(array['homologacion'])),
  array['cccccccc-0000-7000-8000-000000000002', 'cccccccc-0000-7000-8000-0000000000c1']::uuid[],
  'lo tomado sale de lo pendiente'
);


-- Cada paso ----------------------------------------------------------------------------------------------------------

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000001', '{"paso": "reservar", "intento": 1, "numero": 42, "fecha": "2026-10-03"}') $$,
  '22023', 'La fecha del comprobante es la de hoy en el taller',
  'el número se reserva con la fecha de hoy en el taller y no con otra'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000001', '{"paso": "reservar", "intento": 7, "numero": 42, "fecha": "2099-12-31"}') $$,
  '55000', null,
  'un paso de otra vuelta no vale'
);

select is(
  (
    select array[
      r ->> 'hecho', r -> 'comprobante' ->> 'estado', r -> 'comprobante' ->> 'numero', r -> 'comprobante' ->> 'fecha',
      ((r -> 'comprobante' ->> 'emitiendo_hasta')::timestamptz = now() + interval '300 seconds')::text
    ]
    from public.facturacion_anotar(
      'cccccccc-0000-7000-8000-000000000001',
      '{"paso": "reservar", "intento": 1, "numero": 42, "fecha": "2099-12-31", "segundos": 300}'
    ) as r
  ),
  array['true', 'emitiendo', '42', '2099-12-31', 'true'],
  'reservar deja el número y la fecha de hoy, y extiende la toma'
);

select is(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000002', 120),
  null,
  'con uno emitiendo en la secuencia, el siguiente espera'
);

select is(
  (
    select r ->> 'hecho'
    from public.facturacion_anotar('cccccccc-0000-7000-8000-000000000001', '{"paso": "reservar", "intento": 1, "numero": 42, "fecha": "2099-12-31"}') as r
  ),
  'true',
  'uno emitiendo vuelve a reservar su número, cuando ARCA dice que no lo tiene'
);

select is(
  (
    select array[
      r -> 'comprobante' ->> 'estado',
      ((r -> 'comprobante' ->> 'emitiendo_hasta')::timestamptz = now() + interval '5 minutes')::text,
      r -> 'comprobante' ->> 'ultimo_error'
    ]
    from public.facturacion_anotar('cccccccc-0000-7000-8000-000000000001', '{"paso": "soltar", "intento": 1, "error": "ARCA no contestó"}') as r
  ),
  array['emitiendo', 'true', 'ARCA no contestó'],
  'soltar uno emitiendo sin respuesta lo deja cinco minutos más, para que ARCA termine'
);

select is(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000001', 120),
  null,
  'y en esos cinco minutos nadie lo toma'
);

select tests.salir();
update public.comprobantes set emitiendo_hasta = now() - interval '1 second'
where id = 'cccccccc-0000-7000-8000-000000000001';
select set_config('role', 'service_role', true);

select is(
  tests.de_las_pruebas(public.facturacion_pendientes(array['homologacion'])),
  array[
    'cccccccc-0000-7000-8000-000000000001', 'cccccccc-0000-7000-8000-000000000002',
    'cccccccc-0000-7000-8000-0000000000c1'
  ]::uuid[],
  'vencida la toma, el emitiendo va primero: se consulta antes de pedir otro'
);

select is(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000001', 120) ->> 'intentos',
  '2',
  'se retoma con otro intento'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000001', '{"paso": "autorizada", "intento": 1, "cae": "76398765432109", "caeVence": "2100-01-10", "fecha": "2099-12-30"}') $$,
  '55000', null,
  'y la vuelta de antes ya no anota nada'
);

select is(
  (
    select array[
      r -> 'comprobante' ->> 'estado', r -> 'comprobante' ->> 'fecha', r -> 'comprobante' ->> 'cae',
      coalesce(r -> 'comprobante' ->> 'emitiendo_hasta', 'libre')
    ]
    from public.facturacion_anotar(
      'cccccccc-0000-7000-8000-000000000001',
      '{"paso": "autorizada", "intento": 2, "cae": "76398765432109", "caeVence": "2100-01-10", "fecha": "2099-12-30"}'
    ) as r
  ),
  array['autorizada', '2099-12-30', '76398765432109', 'libre'],
  'autorizada con el CAE y la fecha que dice ARCA, y la toma liberada'
);

select isnt(
  public.facturacion_tomar('cccccccc-0000-7000-8000-000000000002', 120),
  null,
  'libre la secuencia, el siguiente se toma'
);

select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000002', '{"paso": "reservar", "intento": 1, "numero": 43, "fecha": "2099-12-31"}');

select is(
  (
    select array[
      r -> 'comprobante' ->> 'estado', coalesce(r -> 'comprobante' ->> 'numero', 'sin número'),
      coalesce(r -> 'comprobante' ->> 'emitiendo_hasta', 'libre'), r -> 'comprobante' ->> 'ultimo_error'
    ]
    from public.facturacion_anotar('cccccccc-0000-7000-8000-000000000002', '{"paso": "pedida", "intento": 1, "error": "ARCA dijo 10016"}') as r
  ),
  array['pedida', 'sin número', 'libre', 'ARCA dijo 10016'],
  'con el 10016 vuelve a pedida sin número, y la vuelta siguiente pide el número de nuevo'
);

select public.facturacion_tomar('cccccccc-0000-7000-8000-000000000002', 120);
select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000002', '{"paso": "reservar", "intento": 2, "numero": 43, "fecha": "2099-12-31"}');

select is(
  (
    select array[
      r -> 'comprobante' ->> 'estado', coalesce(r -> 'comprobante' ->> 'numero', 'sin número'),
      r -> 'comprobante' -> 'rechazo' -> 'errores' -> 0 ->> 'codigo'
    ]
    from public.facturacion_anotar(
      'cccccccc-0000-7000-8000-000000000002',
      '{"paso": "rechazada", "intento": 2, "rechazo": {"errores": [{"codigo": 10015, "mensaje": "El documento no es válido"}], "observaciones": []}}'
    ) as r
  ),
  array['rechazada', 'sin número', '10015'],
  'rechazada, sin número y con lo que contestó ARCA'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000002', '{"paso": "soltar", "intento": 2}') $$,
  '55000', null,
  'uno rechazado ya no da ningún paso'
);

select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000003', '{"paso": "reservar", "intento": 1, "numero": 1, "fecha": "2099-12-31"}');

select is(
  (
    select array[r -> 'comprobante' ->> 'estado', r -> 'comprobante' ->> 'numero', r -> 'comprobante' -> 'rechazo' ->> 'motivo']
    from public.facturacion_anotar(
      'cccccccc-0000-7000-8000-000000000003',
      '{"paso": "a_revisar", "intento": 1, "motivo": "ARCA tiene ese número con otro importe"}'
    ) as r
  ),
  array['a_revisar', '1', 'ARCA tiene ese número con otro importe'],
  'a revisar, con su número y el motivo'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000003', '{"paso": "rechazada", "rechazo": {}}') $$,
  '55000', null,
  'el servidor no rechaza uno a revisar: eso es a mano, con db:facturacion'
);

select is(
  (
    select r -> 'comprobante' ->> 'estado'
    from public.facturacion_anotar(
      'cccccccc-0000-7000-8000-000000000003',
      '{"paso": "autorizada", "cae": "76398765432110", "caeVence": "2100-01-10", "fecha": "2099-12-31"}'
    ) as r
  ),
  'autorizada',
  'uno a revisar queda autorizado sin tomarlo, cuando el control lo encuentra en ARCA'
);

select is(
  (select estado from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000000'),
  'anulada',
  'y la nota autorizada anula su factura en la misma transacción'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-0000000000c1', '{"paso": "soltar", "intento": 0}') $$,
  '55000', null,
  'un pedido sin tomar no da pasos'
);

select throws_ok(
  $$ select public.facturacion_anotar('cccccccc-0000-7000-8000-000000000002', '{"paso": "facturar"}') $$,
  '22023', 'Ese paso no existe',
  'y un paso que no existe, tampoco'
);


-- En producción, el número es uno solo -------------------------------------------------------------------------------

select public.facturacion_tomar('cccccccc-0000-7000-8000-0000000000b2', 120);

select is(
  (
    select array[r ->> 'hecho', r -> 'comprobante' ->> 'estado', coalesce(r -> 'comprobante' ->> 'emitiendo_hasta', 'libre')]
    from public.facturacion_anotar('cccccccc-0000-7000-8000-0000000000b2', '{"paso": "reservar", "intento": 1, "numero": 7, "fecha": "2099-12-31"}') as r
  ),
  array['false', 'pedida', 'libre'],
  'un número de producción que ya es de otro no se reserva: contesta como soltar, nunca con un 23505'
);

select public.facturacion_tomar('cccccccc-0000-7000-8000-0000000000b2', 120);

select tests.salir();
select tests.un_comprobante(tests.de_b(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000b3', 'pago_id', 'bbbbbbbb-0000-7000-8000-000000000013',
  'estado', 'emitiendo', 'numero', 8, 'fecha', '2099-12-31'
)));
select set_config('role', 'service_role', true);

select is(
  (
    select r ->> 'hecho'
    from public.facturacion_anotar('cccccccc-0000-7000-8000-0000000000b2', '{"paso": "reservar", "intento": 2, "numero": 9, "fecha": "2099-12-31"}') as r
  ),
  'false',
  'y si otro de la secuencia quedó en vuelo, reservar lo vuelve a mirar con los mismos candados y suelta'
);


-- El certificado de C y su conexión en producción ------------------------------------------------------------------

select tests.guardar('pedido_1', (
  public.facturacion_guardar_el_pedido(tests.id('household_c'), '20-30123456-3', tests.pedido_pem(), 'Y2xhdmUx', 'aXYx') ->> 'id'
)::uuid);

select is(
  (
    select array[r ->> 'estado', r ->> 'cuit', coalesce(r ->> 'vence', 'sin vencimiento'), (r ? 'claveCifrada')::text]
    from public.facturacion_guardar_el_pedido(tests.id('household_c'), '20-30123456-3', tests.pedido_pem(), 'Y2xhdmUy', 'aXYy') as r
  ),
  array['pedido', '20-30123456-3', 'sin vencimiento', 'false'],
  'el pedido nuevo nace sin certificado, y lo que vuelve no trae la clave'
);

select tests.guardar('pedido_2', (public.facturacion_certificados(tests.id('household_c')) -> 'pendiente' ->> 'id')::uuid);

select isnt(
  tests.id('pedido_2'),
  tests.id('pedido_1'),
  'y reemplaza al pendiente anterior: hay uno solo'
);

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_2'), 4) $$),
  'certificado-sin-subir',
  'con el pedido sin su certificado no se conecta'
);

select is(
  public.facturacion_guardar_el_certificado(tests.id('pedido_2'), tests.certificado_pem(), repeat('1', 64), '2028-10-02') ->> 'estado',
  'subido',
  'el certificado que firmó ARCA pasa el pedido a subido'
);

select is(
  tests.hint_de($$ select public.facturacion_guardar_el_certificado(tests.id('pedido_2'), tests.certificado_pem(), repeat('1', 64), '2028-10-02') $$),
  'sin-pedido',
  'y solo desde un pedido'
);

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_b'), tests.id('pedido_2'), 3) $$),
  'certificado-ajeno',
  'el certificado de otro taller no conecta'
);

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_2'), 4) $$),
  'comprobantes-en-vuelo',
  'con comprobantes en camino, no se conecta'
);

select tests.salir();
update public.comprobantes set estado = 'emitiendo', numero = 1, fecha = '2099-12-31' where id = 'cccccccc-0000-7000-8000-0000000000c1';
update public.comprobantes set estado = 'rechazada', numero = null, fecha = null, rechazo = '{"errores": []}' where id = 'cccccccc-0000-7000-8000-0000000000c1';
select set_config('role', 'service_role', true);

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_2'), 3) $$),
  'punto-de-venta-de-otro-taller',
  'con el punto de venta que otro taller usa con ese CUIT, tampoco'
);

select tests.guardar('de_a', (
  public.facturacion_guardar_el_pedido(tests.id('household_a'), '20-11111111-2', tests.pedido_pem(), 'Y2xhdmVh', 'aXZh') ->> 'id'
)::uuid);
select public.facturacion_guardar_el_certificado(tests.id('de_a'), tests.certificado_pem(), repeat('2', 64), '2028-10-02');

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_a'), tests.id('de_a'), 1) $$),
  'en-prueba',
  'un taller que factura en prueba no pasa a producción así'
);

select is(
  (
    select array[
      r ->> 'ambiente', r ->> 'cuit', r ->> 'puntoDeVenta', r ->> 'desde',
      r -> 'certificados' -> 'activo' ->> 'id', coalesce(r -> 'certificados' ->> 'pendiente', 'sin pendiente')
    ]
    from public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_2'), 4) as r
  ),
  array['produccion', '20-30123456-3', '4', '2099-12-31', tests.id('pedido_2')::text, 'sin pendiente'],
  'con el certificado subido, conecta en producción con su CUIT, ese punto de venta y hoy'
);

select ok(
  public.facturacion_certificados(tests.id('household_c')) -> 'activo' ? 'claveCifrada'
    and position('clave' in public.facturacion_del_usuario(tests.id('c'))::text) = 0,
  'la clave cifrada va solo a la función, que firma con ella; lo del usuario no la trae'
);


-- Los tickets del WSAA ----------------------------------------------------------------------------------------------

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60),
  '{"pedir": true}'::jsonb,
  'sin ticket, el permiso de pedir uno'
);

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60) ? 'esperar',
  true,
  'y a la llamada siguiente, esperar: un solo login por vez'
);

select public.facturacion_guardar_el_ticket(repeat('1', 64), '{"soltar": true}');

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60),
  '{"pedir": true}'::jsonb,
  'el login que no consiguió nada suelta el permiso'
);

select public.facturacion_guardar_el_ticket(
  repeat('1', 64), jsonb_build_object('token', 'el-token', 'firma', 'la-firma', 'vence', now() + interval '12 hours')
);

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60) -> 'ticket' ->> 'token',
  'el-token',
  'el ticket guardado se reusa mientras le queden más de diez minutos'
);

select tests.salir();
update private.arca_tickets set vence = now() + interval '5 minutes' where certificado = repeat('1', 64);
select set_config('role', 'service_role', true);

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60),
  '{"pedir": true}'::jsonb,
  'con menos de diez minutos, se pide otro'
);

select public.facturacion_guardar_el_ticket(repeat('1', 64), jsonb_build_object('bloqueadoHasta', now() + interval '11 minutes'));

select is(
  public.facturacion_tomar_el_login(repeat('1', 64), 60) -> 'ticket' ->> 'token',
  'el-token',
  'si ARCA no da otro todavía, el guardado sirve mientras valga'
);

select tests.salir();
update private.arca_tickets set vence = now() + interval '30 seconds' where certificado = repeat('1', 64);
select set_config('role', 'service_role', true);

select is(
  (public.facturacion_tomar_el_login(repeat('1', 64), 60) ->> 'esperar')::timestamptz,
  now() + interval '11 minutes',
  'y cuando ya no vale, hasta cuándo esperar'
);

select throws_ok(
  $$ select public.facturacion_tomar_el_login(repeat('f', 64), 60) $$,
  '22023', 'Ese certificado no existe',
  'un ticket es de homologación o de un certificado que existe'
);

select throws_ok(
  $$ select public.facturacion_guardar_el_ticket(repeat('1', 64), '{}') $$,
  '22023', null,
  'guardar sin decir qué no hace nada'
);


-- Renovar el certificado, desconectar y volver a conectar ---------------------------------------------------------

select tests.guardar('pedido_3', (
  public.facturacion_guardar_el_pedido(tests.id('household_c'), '20-30123456-3', tests.pedido_pem(), 'Y2xhdmUz', 'aXYz') ->> 'id'
)::uuid);

select is(
  public.facturacion_certificados(tests.id('household_c')) -> 'activo' ->> 'id',
  tests.id('pedido_2')::text,
  'un pedido nuevo nunca borra el certificado activo'
);

select public.facturacion_guardar_el_certificado(tests.id('pedido_3'), tests.certificado_pem(), repeat('3', 64), '2029-10-02');

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_3'), 5) $$),
  'otro-punto-de-venta',
  'al renovar, el punto de venta es el mismo'
);

select tests.guardar('pedido_4', (
  public.facturacion_guardar_el_pedido(tests.id('household_c'), '20-11111111-2', tests.pedido_pem(), 'Y2xhdmU0', 'aXY0') ->> 'id'
)::uuid);
select public.facturacion_guardar_el_certificado(tests.id('pedido_4'), tests.certificado_pem(), repeat('4', 64), '2029-10-02');

select is(
  tests.hint_de($$ select public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_4'), 4) $$),
  'otro-cuit',
  'y el CUIT, también'
);

select tests.guardar('pedido_5', (
  public.facturacion_guardar_el_pedido(tests.id('household_c'), '20-30123456-3', tests.pedido_pem(), 'Y2xhdmU1', 'aXY1') ->> 'id'
)::uuid);
select public.facturacion_guardar_el_certificado(tests.id('pedido_5'), tests.certificado_pem(), repeat('5', 64), '2029-10-02');

select is(
  public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_5'), 4) -> 'certificados' -> 'activo' ->> 'id',
  tests.id('pedido_5')::text,
  'renovar cambia solo el certificado'
);

select tests.salir();

select is(
  (select array[count(*) filter (where c.id = tests.id('pedido_2')), count(*)]::int[] from private.arca_certificados c where c.household_id = tests.id('household_c')),
  array[0, 1],
  'el activo anterior se borra'
);

select is_empty(
  $$ select 1 from private.arca_tickets where certificado = repeat('1', 64) $$,
  'y su ticket con él'
);

select private.desconectar_la_facturacion(tests.id('household_c'), false);

select is(
  (select estado from private.arca_certificados where id = tests.id('pedido_5')),
  'activo',
  'desconectar deja el certificado'
);

select set_config('role', 'service_role', true);

select is(
  public.facturacion_conectar(tests.id('household_c'), tests.id('pedido_5'), 4) ->> 'ambiente',
  'produccion',
  'y con el activo, el taller vuelve a conectar'
);

select is(
  (
    select array[
      public.facturacion_del_usuario(tests.id('c')) ->> 'householdId',
      coalesce(public.facturacion_del_usuario(tests.id('m'))::text, 'nada'),
      coalesce(public.facturacion_del_usuario('00000000-0000-7000-8000-000000000000')::text, 'nada')
    ]
  ),
  array[tests.id('household_c')::text, 'nada', 'nada'],
  'la facturación de un taller es solo de su titular: a un miembro, o a nadie, no le devuelve nada'
);


-- El acceso y las alertas -------------------------------------------------------------------------------------------

select public.facturacion_anotar_el_acceso('homologacion', false, null);

select is(
  (
    select array[
      exists (select 1 from jsonb_array_elements(a.facturacion_alertas) as e where e ->> 'codigo' = 'sin-acceso'),
      exists (select 1 from jsonb_array_elements(b.facturacion_alertas) as e where e ->> 'codigo' = 'sin-acceso')
    ]
    from public.ajustes a, public.ajustes b
    where a.household_id = tests.id('household_a') and b.household_id = tests.id('household_b')
  ),
  array[true, false],
  'sin acceso en homologación, la alerta va a todos los talleres conectados ahí y a ninguno de producción'
);

select is(
  public.facturacion_anotar_el_acceso('homologacion', false, tests.id('household_a')),
  0,
  'una que ya está no se repite'
);

select public.facturacion_anotar_el_acceso('homologacion', true, null);

select is_empty(
  format(
    $$ select 1 from public.ajustes a, jsonb_array_elements(a.facturacion_alertas) as e where a.household_id = %L and e ->> 'codigo' = 'sin-acceso' $$,
    tests.id('household_a')
  ),
  'el login que anda la saca'
);

select throws_ok(
  $$ select public.facturacion_anotar_el_acceso('produccion', false, null) $$,
  '22023', 'En producción el acceso es de un taller',
  'en producción, sin taller se niega: cada taller entra con su certificado'
);

select is(
  public.facturacion_anotar_el_acceso('produccion', false, tests.id('household_b')),
  1,
  'con el taller, solo en ese'
);

select tests.salir();
update public.ajustes set facturacion_alertas = '[
  {"codigo": "sin-acceso", "desde": "2026-10-03T09:00:00Z"},
  {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 45, "numeroNuma": 44, "descartada": true}
]'
where household_id = tests.id('household_a');
select set_config('role', 'service_role', true);

select is(
  public.facturacion_anotar_las_alertas(tests.id('household_a'), '[
    {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 45, "numeroNuma": 44},
    {"codigo": "certificado-por-vencer", "vence": "2026-10-25"}
  ]'),
  '[
    {"codigo": "sin-acceso", "desde": "2026-10-03T09:00:00Z"},
    {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 45, "numeroNuma": 44, "descartada": true},
    {"codigo": "certificado-por-vencer", "vence": "2026-10-25"}
  ]'::jsonb,
  'el control reemplaza sus alertas, deja la del login y la que el dueño descartó con el mismo número sigue descartada'
);

select is(
  public.facturacion_anotar_las_alertas(tests.id('household_a'), '[
    {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 46, "numeroNuma": 44}
  ]'),
  '[
    {"codigo": "sin-acceso", "desde": "2026-10-03T09:00:00Z"},
    {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 46, "numeroNuma": 44, "descartada": false}
  ]'::jsonb,
  'con un número nuevo, vuelve; y la que se resolvió se va sola'
);

select throws_ok(
  $$ select public.facturacion_anotar_las_alertas(tests.id('household_a'), '[{"codigo": "sin-acceso"}]') $$,
  '22023', null,
  'sin-acceso no es del control'
);


-- Lo que mira el control y lo que anota ----------------------------------------------------------------------------

select is(
  (
    select e -> 'ultimos'
    from jsonb_array_elements(public.facturacion_para_controlar(array['homologacion'])) as e
    where e ->> 'householdId' = tests.id('household_a')::text
  ),
  '{"factura_c": 50, "nota_de_credito_c": 1}'::jsonb,
  'el último número de cada secuencia en NUMA cuenta las filas dadas de baja'
);

select is(
  (
    select array_agg(r ->> 'id' order by r ->> 'id')
    from jsonb_array_elements(public.facturacion_para_controlar(array['homologacion'])) as e,
         jsonb_array_elements(e -> 'aRevisar') as r
    where e ->> 'householdId' = tests.id('household_a')::text
  ),
  array['cccccccc-0000-7000-8000-0000000000e1', 'cccccccc-0000-7000-8000-0000000000e2'],
  'y trae lo que está a revisar'
);

select isnt(
  public.facturacion_anotar_el_intercambio(jsonb_build_object(
    'householdId', tests.id('household_a'), 'comprobanteId', 'cccccccc-0000-7000-8000-000000000001',
    'ambiente', 'homologacion', 'metodo', 'FECAESolicitar', 'httpEstado', 200, 'duracionMs', 51,
    'pedido', '<soap:Envelope><soap:Body><ar:FECAESolicitar><ar:FeCAEReq/></ar:FECAESolicitar></soap:Body></soap:Envelope>',
    'respuesta', repeat('a', 200000)
  )),
  null,
  'cada llamada a ARCA se anota'
);

select throws_ok(
  $$ select public.facturacion_anotar_el_intercambio('{"ambiente": "homologacion", "metodo": "FECAESolicitar", "pedido": "<ar:Auth><ar:Token>x</ar:Token></ar:Auth>"}') $$,
  '23514', null,
  'sin el bloque Auth: el token y la firma no se guardan'
);

select throws_ok(
  $$ select public.facturacion_anotar_el_intercambio('{"ambiente": "homologacion", "metodo": "FECompConsultar", "respuesta": "<ResultGet><Cuit>20111111112</Cuit></ResultGet>"}') $$,
  '23514', null,
  'ni ningún elemento Cuit'
);

select tests.salir();

select is(
  (select char_length(respuesta) from private.arca_intercambios where comprobante_id = 'cccccccc-0000-7000-8000-000000000001'),
  102400,
  'la respuesta se recorta a 100 KB'
);


-- Resolver a mano, conectar y desconectar: el dueño de la base, con db:facturacion -------------------------------

select is(
  tests.hint_de($$ select private.resolver_el_comprobante('cccccccc-0000-7000-8000-000000000001', '{"como": "rechazada"}') $$),
  'no-esta-a-revisar',
  'solo se resuelve a mano uno a revisar'
);

select is(
  (
    select array[estado, cae]
    from private.resolver_el_comprobante(
      'cccccccc-0000-7000-8000-0000000000e1',
      '{"como": "autorizada", "cae": "76398765432111", "vence": "2026-10-12", "fecha": "2026-10-02"}'
    )
  ),
  array['autorizada', '76398765432111'],
  'resuelto como autorizado, con el CAE que se vio en ARCA'
);

select is(
  (
    select array[estado, coalesce(numero::text, 'sin número'), rechazo ->> 'resuelta']
    from private.resolver_el_comprobante('cccccccc-0000-7000-8000-0000000000e2', '{"como": "rechazada"}')
  ),
  array['rechazada', 'sin número', 'a mano'],
  'o como rechazado, sin número'
);

select is(
  (select count(*)::int from private.arca_intercambios where metodo = 'resolver' and household_id = tests.id('household_a')),
  2,
  'y cada resolución queda anotada'
);

select is(
  tests.hint_de($$ select private.conectar_la_facturacion(tests.id('household_a'), 'homologacion', '20-11111111-3', 2, '2026-10-03') $$),
  'cuit-invalido',
  'conectar exige el CUIT con su dígito verificador'
);

select is(
  tests.hint_de($$ select private.conectar_la_facturacion(tests.id('household_a'), 'homologacion', '20-11111111-2', 2, '2026-10-03') $$),
  'ya-conectada',
  'y un taller sin conectar'
);

select tests.un_comprobante(tests.de_a(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-0000000000e3', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000017',
  'estado', 'a_revisar', 'numero', 51, 'fecha', '2026-10-02', 'rechazo', '{"motivo": "datos distintos"}'::jsonb
)));

select is(
  tests.hint_de($$ select private.desconectar_la_facturacion(tests.id('household_a'), false) $$),
  'comprobantes-en-vuelo',
  'con algo a revisar no se desconecta'
);

select is(
  (
    select array[coalesce(facturacion_ambiente, 'sin conexión'), facturacion_cuit, facturacion_alertas::text]
    from private.desconectar_la_facturacion(tests.id('household_a'), true)
  ),
  array['sin conexión', '', '[]'],
  'salvo forzando: la conexión y las alertas quedan vacías'
);

select is(
  (select count(*)::int from private.arca_certificados where household_id = tests.id('household_a')),
  1,
  'y el certificado del taller queda'
);

select private.desconectar_la_facturacion(tests.id('household_c'), false);

select is(
  tests.hint_de($$ select private.conectar_la_facturacion(tests.id('household_c'), 'produccion', '20-30123456-3', 3, '2026-10-03') $$),
  'punto-de-venta-de-otro-taller',
  'dos talleres no comparten numeración'
);

select * from finish();
