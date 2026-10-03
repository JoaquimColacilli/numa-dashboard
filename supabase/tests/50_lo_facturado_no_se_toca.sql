-- Lo facturado de verdad no se toca por abajo (ADR 0085): un pago con una factura de producción viva no
-- cambia lo que la factura dice de él, y un trabajo con comprobantes de producción no se borra (MN043), ni
-- como dueño de la base. Lo de homologación, lo anulado y lo rechazado no traban.

select plan(24);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));

-- Un placard con una factura de producción autorizada, una pedida, una a revisar y un pago sin facturar;
-- un rack con una de producción rechazada y una de prueba; y una mesa con su factura anulada.
select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía Gómez');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'en_curso', 90000000),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'en_curso', 30000000),
  ('aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000001', 'Mesa', 'en_curso', 20000000);
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-20', 'Seña', 45000000),
  ('aaaaaaaa-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-21', 'Pago 2', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-22', 'Pago 3', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000014', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-23', 'Pago 4', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000021', 'aaaaaaaa-0000-7000-8000-000000000020', '2026-09-20', 'Seña', 15000000),
  ('aaaaaaaa-0000-7000-8000-000000000022', 'aaaaaaaa-0000-7000-8000-000000000020', '2026-09-21', 'Pago 2', 5000000),
  ('aaaaaaaa-0000-7000-8000-000000000031', 'aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 'Seña', 10000000);
select tests.salir();

create function tests.de_produccion(p_fila jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'household_id', tests.id('household_a'), 'ambiente', 'produccion', 'cuit_emisor', '20-30123456-3',
    'punto_de_venta', 3
  ) || p_fila
$$;

create function tests.autorizada_el(p_numero integer)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'estado', 'autorizada', 'numero', p_numero, 'fecha', '2026-10-01', 'cae', '76398765432109',
    'cae_vence', '2026-10-11', 'autorizada_at', now()
  )
$$;

select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000011', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000011'
) || tests.autorizada_el(1)));
select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000012', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000012'
)));
select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000013', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000013', 'estado', 'a_revisar', 'numero', 2, 'fecha', '2026-10-02',
  'rechazo', '{"motivo": "datos distintos"}'::jsonb
)));
select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000021', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000020',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000021', 'estado', 'rechazada',
  'rechazo', '{"errores": [{"codigo": 10015, "mensaje": "El documento no es válido"}]}'::jsonb
)));
select tests.un_comprobante(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000022', 'household_id', tests.id('household_a'),
  'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000020', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000022'
) || tests.autorizada_el(1));
select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000031', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000030',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000031'
) || tests.autorizada_el(3) || '{"estado": "anulada"}'::jsonb));
select tests.un_comprobante(tests.de_produccion(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000032', 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000030',
  'pago_id', 'aaaaaaaa-0000-7000-8000-000000000031', 'tipo', 'nota_de_credito_c',
  'asociado_id', 'cccccccc-0000-7000-8000-000000000031', 'detalle', 'Anula la factura C 00003-00000003'
) || tests.autorizada_el(1)));


-- El pago facturado de verdad --------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

select throws_ok(
  $$ update public.pagos set monto_centavos = 40000000 where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', 'Tiene una factura de ARCA: para cambiarlo, anulala primero',
  'el importe de un pago facturado no cambia'
);

select is(
  tests.hint_de($$ update public.pagos set monto_centavos = 40000000 where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$),
  'Anulá la factura con una nota de crédito y después cambiá el pago.',
  'y el rechazo dice cómo seguir'
);

select throws_ok(
  $$ update public.pagos set fecha = '2026-09-19' where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', null,
  'ni su fecha'
);

select throws_ok(
  $$ update public.pagos set cotizacion_centavos = 100000 where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', null,
  'ni su cotización'
);

select throws_ok(
  $$ update public.pagos set proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000030' where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', null,
  'ni pasa a otro trabajo'
);

select throws_ok(
  $$ update public.pagos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', null,
  'ni se da de baja'
);

select lives_ok(
  $$ update public.pagos set concepto = 'Seña del placard' where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'el concepto sí cambia: la factura ya congeló su detalle'
);

select lives_ok(
  $$ update public.pagos set monto_centavos = 45000000, fecha = '2026-09-20' where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'y el reenvío idéntico de la cola pasa'
);

select throws_ok(
  $$ update public.pagos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000012' $$,
  'MN043', null,
  'una factura pedida también traba su pago: puede quedar autorizada'
);

select throws_ok(
  $$ update public.pagos set monto_centavos = 1 where id = 'aaaaaaaa-0000-7000-8000-000000000013' $$,
  'MN043', null,
  'y una a revisar, que puede estar autorizada'
);

select lives_ok(
  $$ update public.pagos set monto_centavos = 16000000 where id = 'aaaaaaaa-0000-7000-8000-000000000021' $$,
  'una factura rechazada no traba su pago'
);

select lives_ok(
  $$ update public.pagos set monto_centavos = 6000000 where id = 'aaaaaaaa-0000-7000-8000-000000000022' $$,
  'una de prueba tampoco'
);

select lives_ok(
  $$ update public.pagos set monto_centavos = 11000000 where id = 'aaaaaaaa-0000-7000-8000-000000000031' $$,
  'ni una anulada: su pago se puede corregir y volver a facturar'
);

select lives_ok(
  $$ update public.pagos set monto_centavos = 11000000 where id = 'aaaaaaaa-0000-7000-8000-000000000014' $$,
  'y un pago sin factura sigue como siempre'
);


-- El trabajo facturado de verdad -----------------------------------------------------------------------------

select throws_ok(
  $$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'MN043', 'Este trabajo tiene facturas de ARCA y no se puede borrar',
  'un trabajo con facturas de producción no se borra'
);

select is(
  tests.hint_de($$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$),
  'Si no sigue, dalo por perdido.',
  'y el rechazo dice qué hacer'
);

select throws_ok(
  $$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  'MN043', 'Este trabajo tiene facturas de ARCA y no se puede borrar',
  'aunque su factura esté anulada: la factura y su nota quedan en ARCA'
);

select lives_ok(
  $$ update public.proyectos set deleted_at = '2026-10-03 15:00:00+00' where id = 'aaaaaaaa-0000-7000-8000-000000000020' $$,
  'uno con una de producción rechazada y una de prueba sí se borra'
);

select is(
  (
    select array_agg(coalesce(to_char(deleted_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI'), 'viva') order by id)
    from public.comprobantes
    where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000020'
  ),
  array['viva', '2026-10-03 15:00'],
  'y se lleva la de prueba, mientras la rechazada de producción queda como estaba'
);

select is(
  (
    select count(*)::int
    from public.pagos
    where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000020' and deleted_at is not null
  ),
  2,
  'con sus pagos'
);

select lives_ok(
  $$ update public.proyectos set titulo = 'Placard de pino' where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'el trabajo facturado se sigue editando'
);


-- Ni como dueño de la base -----------------------------------------------------------------------------------

select tests.salir();

select throws_ok(
  $$ update public.pagos set monto_centavos = 1 where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN043', null,
  'el dueño de la base tampoco le cambia el importe a un pago facturado'
);

select throws_ok(
  $$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'MN043', 'Este trabajo tiene facturas de ARCA y no se puede borrar',
  'ni borra un trabajo facturado'
);

select ok(
  exists (
    select 1 from pg_trigger t
    where t.tgrelid = 'public.pagos'::regclass
      and t.tgname = 'cuidar_los_pagos_facturados'
      and t.tgfoid = 'private.cuidar_los_pagos_facturados()'::regprocedure
  ),
  'la guarda del pago es un trigger de la tabla: vale para cualquier camino'
);

select * from finish();
