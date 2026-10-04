-- Los comprobantes (ADR 0085): la tabla, sus checks y sus únicos, quién la lee y quién no la escribe, lo
-- congelado que no cambia ni como dueño de la base (traba 3 de la regla de los dos ambientes), las flechas
-- de los estados, lo de producción que no se borra y lo de prueba que se va con su trabajo.

select plan(82);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía Gómez');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000002', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'en_curso', 90000000);
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000003', 'aaaaaaaa-0000-7000-8000-000000000002', '2026-09-01', 'Seña', 45000000),
  ('aaaaaaaa-0000-7000-8000-000000000004', 'aaaaaaaa-0000-7000-8000-000000000002', '2026-09-15', 'Pago 2', 20000000),
  ('aaaaaaaa-0000-7000-8000-000000000005', 'aaaaaaaa-0000-7000-8000-000000000002', '2026-09-20', 'Pago 3', 25000000),
  ('aaaaaaaa-0000-7000-8000-000000000008', 'aaaaaaaa-0000-7000-8000-000000000002', '2026-09-25', 'Pago 4', 10000000);
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000006', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'en_curso', 30000000);
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000007', 'aaaaaaaa-0000-7000-8000-000000000006', '2026-09-01', 'Seña', 15000000);

select tests.entrar_como(tests.id('b'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Rubén');
insert into public.proyectos (id, cliente_id, titulo, estado)
  values ('bbbbbbbb-0000-7000-8000-000000000002', 'bbbbbbbb-0000-7000-8000-000000000001', 'Mesa', 'en_curso');
insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000003', 'bbbbbbbb-0000-7000-8000-000000000002', '2026-09-01', 100000);

select tests.salir();

-- Las filas de A que usa el resto del archivo: del Placard, y por defecto de su seña.
create function tests.de_a(p_fila jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'household_id', tests.id('household_a'),
    'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000002',
    'pago_id', 'aaaaaaaa-0000-7000-8000-000000000003'
  ) || p_fila
$$;

create function tests.autorizada(p_fila jsonb)
returns jsonb
language sql
as $$
  select tests.de_a(jsonb_build_object(
    'estado', 'autorizada', 'numero', 42, 'fecha', '2026-10-03', 'cae', '76398765432109',
    'cae_vence', '2026-10-13', 'autorizada_at', now()
  ) || p_fila)
$$;

-- Para volver de service_role con tests.salir().
grant usage on schema tests to service_role;


-- La tabla ---------------------------------------------------------------------------------------------------

select has_table('public', 'comprobantes', 'la tabla de los comprobantes existe');

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'pagos_household_id_key' and conrelid = 'public.pagos'::regclass and contype = 'u'
  ),
  'pagos tiene su clave única (household_id, id) para la foreign key compuesta'
);

select lives_ok(
  $$ select tests.un_comprobante(tests.de_a('{"id": "cccccccc-0000-7000-8000-000000000001"}')) $$,
  'una factura de prueba pedida se guarda'
);

select is(
  (
    select array[estado, ambiente, tipo, moneda, coalesce(numero::text, 'sin número'), version::text]
    from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'
  ),
  array['pedida', 'homologacion', 'factura_c', 'ARS', 'sin número', '1'],
  'nace pedida, sin número y en su primera versión'
);


-- Los checks -------------------------------------------------------------------------------------------------

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "tipo": "factura_b"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_tipo_valido"',
  'el tipo es una Factura C o una Nota de Crédito C'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "ambiente": "testing"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_ambiente_valido"',
  'el ambiente es homologacion o produccion'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "estado": "emitida"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_estado_valido"',
  'el estado es uno de los seis'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "moneda": "USD"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_moneda_pesos"',
  'no se factura en dólares'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "cuit_emisor": "20111111112"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_cuit_emisor_formato"',
  'el CUIT del emisor va con guiones'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "punto_de_venta": 0}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_punto_de_venta_valido"',
  'el punto de venta va de 1 a 99998'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "concepto": 4}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_concepto_valido"',
  'el concepto es 1, 2 o 3'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "importe_centavos": 0}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_importe_positivo"',
  'el importe es mayor que cero'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "doc_tipo": 86, "doc_nro": "20111111112"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_doc_tipo_valido"',
  'el documento es CUIT, DNI o sin identificar'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "condicion_iva_receptor": 2}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_condicion_iva_valida"',
  'la condición frente al IVA es 1, 4, 5 o 6'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a(jsonb_build_object(
       'pago_id', 'aaaaaaaa-0000-7000-8000-000000000004',
       'emisor', '{"razonSocial": "RIVAS MARTIN", "domicilio": "x", "cuit": "20-11111111-2", "ingresosBrutos": "1", "inicioDeActividades": "2019-03-01"}'::jsonb))) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_emisor_bien_formado"',
  'el emisor lleva sus seis datos'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "detalle": "  "}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_detalle_valido"',
  'el detalle no va en blanco'
);

select throws_ok(
  format($$ select tests.un_comprobante(tests.de_a(jsonb_build_object('pago_id', 'aaaaaaaa-0000-7000-8000-000000000004', 'detalle', %L))) $$, repeat('a', 201)),
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_detalle_valido"',
  'ni pasa de 200 caracteres'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "cae": "7639876543210"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_cae_formato"',
  'el CAE tiene catorce dígitos'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "tipo": "nota_de_credito_c"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_nota_con_su_factura"',
  'una nota de crédito lleva su factura'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "asociado_id": "cccccccc-0000-7000-8000-000000000001"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_nota_con_su_factura"',
  'y una factura no lleva ninguna'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "cae": null}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_autorizada_completa"',
  'una autorizada lleva su número, su fecha y su CAE con su vencimiento'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "estado": "emitiendo"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_con_numero"',
  'una que se está emitiendo tiene su número reservado'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "numero": 3, "fecha": "2026-10-03"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_con_numero"',
  'y una pedida no tiene número'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "doc_tipo": 80, "doc_nro": "28456789"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_documento_coherente"',
  'un CUIT tiene once dígitos'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "doc_tipo": 99, "doc_nro": "28456789"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_documento_coherente"',
  'y sin identificar va con 0'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "ambiente": "produccion", "deleted_at": "2026-10-03T12:00:00Z"}')) $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_produccion_no_se_borra"',
  'uno de producción no nace borrado'
);


-- Una factura viva por pago, una nota viva por factura y un número por secuencia de producción ---------------

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{}')) $$,
  '23505', null,
  'un pago no tiene dos facturas vivas'
);

select lives_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "estado": "rechazada", "rechazo": {"errores": [{"codigo": 10015, "mensaje": "x"}]}}'));
     select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004"}')) $$,
  'una rechazada no cuenta: el pago se vuelve a pedir'
);

select lives_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"id": "cccccccc-0000-7000-8000-000000000010", "pago_id": "aaaaaaaa-0000-7000-8000-000000000005"}'));
     select tests.un_comprobante(tests.autorizada('{"id": "cccccccc-0000-7000-8000-000000000011", "pago_id": "aaaaaaaa-0000-7000-8000-000000000005", "tipo": "nota_de_credito_c", "asociado_id": "cccccccc-0000-7000-8000-000000000010", "numero": 3, "detalle": "Anula la factura C 00001-00000042"}')) $$,
  'una factura autorizada tiene su nota de crédito'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.de_a('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000005", "tipo": "nota_de_credito_c", "asociado_id": "cccccccc-0000-7000-8000-000000000010", "detalle": "Anula la factura C 00001-00000042"}')) $$,
  '23505', null,
  'y no dos'
);

select lives_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"id": "cccccccc-0000-7000-8000-000000000012", "pago_id": "aaaaaaaa-0000-7000-8000-000000000008", "ambiente": "produccion", "cuit_emisor": "20-30123456-3", "punto_de_venta": 3, "numero": 7}')) $$,
  'una factura de producción autorizada con su número'
);

select throws_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"ambiente": "produccion", "cuit_emisor": "20-30123456-3", "punto_de_venta": 3, "numero": 7, "pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "estado": "anulada"}')) $$,
  '23505', null,
  'en producción, el mismo número en el mismo punto de venta del mismo CUIT es uno solo'
);

select lives_ok(
  $$ select tests.un_comprobante(tests.autorizada('{"pago_id": "aaaaaaaa-0000-7000-8000-000000000004", "estado": "anulada", "numero": 42}')) $$,
  'en homologación no: ARCA reinicia sus datos de prueba y vuelve a numerar'
);


-- Quién la lee y quién no la escribe -------------------------------------------------------------------------

select tests.un_comprobante(jsonb_build_object(
  'id', 'bbbbbbbb-0000-7000-8000-0000000000c1', 'household_id', tests.id('household_b'),
  'proyecto_id', 'bbbbbbbb-0000-7000-8000-000000000002', 'pago_id', 'bbbbbbbb-0000-7000-8000-000000000003',
  'importe_centavos', 100000
));

select tests.entrar_como(tests.id('a'));

select is(
  (select count(*)::int from public.comprobantes),
  (select count(*)::int from public.comprobantes where household_id = tests.id('household_a')),
  'el dueño ve solo los comprobantes de su taller'
);

select is_empty(
  $$ select 1 from public.comprobantes where id = 'bbbbbbbb-0000-7000-8000-0000000000c1' $$,
  'y no ve los del otro'
);

select throws_ok(
  $$ insert into public.comprobantes (proyecto_id, pago_id, tipo, ambiente, cuit_emisor, punto_de_venta, concepto,
       importe_centavos, doc_tipo, doc_nro, condicion_iva_receptor, receptor_condicion, receptor_nombre, emisor, detalle)
     values ('aaaaaaaa-0000-7000-8000-000000000002', 'aaaaaaaa-0000-7000-8000-000000000003', 'factura_c', 'produccion',
       '20-30123456-3', 3, 1, 1, 99, '0', 5, 'consumidor_final', 'X', '{}', 'x') $$,
  '42501', null,
  'el dueño no inserta un comprobante: lo pide con su función'
);

select throws_ok(
  $$ update public.comprobantes set detalle = 'Otro' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  '42501', null,
  'ni lo edita'
);

select tests.salir();
select set_config('role', 'service_role', true);

select throws_ok(
  $$ insert into public.comprobantes (household_id, proyecto_id, pago_id, tipo, ambiente, cuit_emisor, punto_de_venta, concepto,
       importe_centavos, doc_tipo, doc_nro, condicion_iva_receptor, receptor_condicion, receptor_nombre, emisor, detalle)
     select household_id, proyecto_id, 'aaaaaaaa-0000-7000-8000-000000000007', tipo, ambiente, cuit_emisor, punto_de_venta,
       concepto, importe_centavos, doc_tipo, doc_nro, condicion_iva_receptor, receptor_condicion, receptor_nombre, emisor, detalle
     from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  '42501', null,
  'la clave del servidor no inserta directo'
);

select throws_ok(
  $$ update public.comprobantes set ultimo_error = 'x' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  '42501', null,
  'ni actualiza'
);

select throws_ok(
  $$ delete from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  '42501', null,
  'ni borra'
);

select throws_ok(
  $$ truncate public.comprobantes $$,
  '42501', null,
  'ni trunca'
);

select ok(
  exists (select 1 from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'),
  'pero lee, como toda la base'
);

select tests.salir();


-- Lo congelado no cambia, ni como dueño de la base (traba 3) ----------------------------------------------

select throws_ok(
  format('update public.comprobantes set %s where id = %L', t.cambio, 'cccccccc-0000-7000-8000-000000000010'),
  'MN043', null,
  format('%s no cambia', t.columna)
)
from (values
  ('el ambiente', 'ambiente = ''produccion'''),
  ('el CUIT del emisor', 'cuit_emisor = ''20-30123456-3'''),
  ('el punto de venta', 'punto_de_venta = 9'),
  ('el importe', 'importe_centavos = 1'),
  ('el tipo', 'tipo = ''nota_de_credito_c'', asociado_id = ''cccccccc-0000-7000-8000-000000000001'''),
  ('el pago', 'pago_id = ''aaaaaaaa-0000-7000-8000-000000000004'''),
  ('el concepto', 'concepto = 2'),
  ('el documento', 'doc_tipo = 96, doc_nro = ''28456789'''),
  ('la condición del receptor', 'condicion_iva_receptor = 1, receptor_condicion = ''responsable_inscripto'''),
  ('el nombre del receptor', 'receptor_nombre = ''Otra persona'''),
  ('el domicilio del receptor', 'receptor_domicilio = ''Otra calle 1'''),
  ('el emisor', 'emisor = jsonb_set(emisor, ''{cuit}'', ''"20-30123456-3"'')'),
  ('el detalle', 'detalle = ''Otro detalle'''),
  ('cuándo se pidió', 'pedida_at = now() - interval ''1 day''')
) as t (columna, cambio);


-- Las flechas de los estados ---------------------------------------------------------------------------------

select throws_ok(
  $$ update public.comprobantes set estado = 'autorizada', numero = 1, fecha = '2026-10-03', cae = '76398765432109',
       cae_vence = '2026-10-13', autorizada_at = now()
     where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'una pedida no queda autorizada sin pasar por la emisión'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'emitiendo', numero = 41, fecha = '2026-10-03', emitiendo_hasta = now() + interval '2 minutes'
     where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'una pedida pasa a emitiendo con su número reservado'
);

select is(
  (select version from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'),
  2,
  'y la base le sube la versión, como a toda fila de la réplica'
);

select lives_ok(
  $$ update public.comprobantes set numero = 42 where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'emitiendo se puede volver a reservar el número'
);

select throws_ok(
  $$ update public.comprobantes set cae = '76398765432109' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'el CAE no se escribe antes de autorizarse'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'autorizada', fecha = '2026-10-02', cae = '76398765432109',
       cae_vence = '2026-10-12', autorizada_at = now(), emitiendo_hasta = null
     where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'emitiendo pasa a autorizada con su CAE y la fecha que dice ARCA'
);

select throws_ok(
  $$ update public.comprobantes set numero = 43 where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'autorizada, el número no cambia'
);

select throws_ok(
  $$ update public.comprobantes set fecha = '2026-10-01' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'ni la fecha'
);

select throws_ok(
  $$ update public.comprobantes set cae = '11111111111111' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'ni el CAE'
);

select throws_ok(
  $$ update public.comprobantes set estado = 'pedida', numero = null, fecha = null, cae = null, cae_vence = null,
       autorizada_at = null where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'una autorizada no vuelve a pedida'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'anulada' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'una factura autorizada queda anulada'
);

select throws_ok(
  $$ update public.comprobantes set estado = 'autorizada' where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'MN043', null,
  'y anulada no vuelve atrás'
);

select throws_ok(
  $$ update public.comprobantes set estado = 'autorizada', numero = 3, fecha = '2026-10-03', cae = '76398765432109',
       cae_vence = '2026-10-13', autorizada_at = now()
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'rechazada' $$,
  'MN043', null,
  'una rechazada queda rechazada: el pago se vuelve a pedir con otra'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'emitiendo', numero = 50, fecha = '2026-10-03'
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'pedida';
     update public.comprobantes set estado = 'pedida', numero = null, fecha = null
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'emitiendo' $$,
  'emitiendo vuelve a pedida sin número, cuando ARCA dice que el número no era el que seguía'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'emitiendo', numero = 51, fecha = '2026-10-03'
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'pedida';
     update public.comprobantes set estado = 'a_revisar', rechazo = '{"motivo": "datos distintos"}'
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'emitiendo' $$,
  'emitiendo pasa a revisar, con su número'
);

select lives_ok(
  $$ update public.comprobantes set estado = 'autorizada', cae = '76398765432109', cae_vence = '2026-10-13',
       autorizada_at = now()
     where pago_id = 'aaaaaaaa-0000-7000-8000-000000000004' and estado = 'a_revisar' $$,
  'y de revisar a autorizada, cuando el control la encuentra en ARCA'
);

select throws_ok(
  $$ update public.comprobantes set estado = 'anulada' where id = 'cccccccc-0000-7000-8000-000000000011' $$,
  '23514', 'new row for relation "comprobantes" violates check constraint "comprobantes_anulada_es_factura"',
  'una nota de crédito no se anula'
);


-- Lo de producción no se borra -------------------------------------------------------------------------------

select throws_ok(
  $$ update public.comprobantes set deleted_at = now() where id = 'cccccccc-0000-7000-8000-000000000012' $$,
  'MN043', null,
  'uno de producción no se da de baja'
);

select throws_ok(
  $$ delete from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000012' $$,
  'MN043', null,
  'ni se borra, ni como dueño de la base'
);

select throws_ok(
  $$ truncate public.comprobantes $$,
  'MN043', null,
  'y la tabla no se trunca'
);

select lives_ok(
  $$ update public.comprobantes set deleted_at = now() where id = 'cccccccc-0000-7000-8000-000000000001' $$,
  'uno de prueba sí se da de baja'
);

select lives_ok(
  $$ delete from public.comprobantes where id = 'bbbbbbbb-0000-7000-8000-0000000000c1' $$,
  'y como dueño de la base se borra'
);


-- Lo de prueba se va con su trabajo --------------------------------------------------------------------------

select tests.un_comprobante(tests.autorizada(
  '{"id": "cccccccc-0000-7000-8000-000000000030", "proyecto_id": "aaaaaaaa-0000-7000-8000-000000000006", "pago_id": "aaaaaaaa-0000-7000-8000-000000000007", "numero": 5}'
));
select tests.un_comprobante(tests.de_a(
  '{"id": "cccccccc-0000-7000-8000-000000000031", "proyecto_id": "aaaaaaaa-0000-7000-8000-000000000006", "pago_id": "aaaaaaaa-0000-7000-8000-000000000007", "estado": "rechazada", "ambiente": "produccion", "cuit_emisor": "20-30123456-3", "punto_de_venta": 3, "rechazo": {"errores": [{"codigo": 10015, "mensaje": "x"}]}}'
));

select private.borrar_los_comprobantes_de_prueba(tests.id('household_a'), 'aaaaaaaa-0000-7000-8000-000000000006', now());

select is(
  (select deleted_at from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000030'),
  null,
  'la baja de los de prueba no hace nada mientras el trabajo está vivo'
);

select tests.entrar_como(tests.id('a'));
update public.proyectos set deleted_at = '2026-10-03 15:00:00+00' where id = 'aaaaaaaa-0000-7000-8000-000000000006';
select tests.salir();

select is(
  (select deleted_at from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000030'),
  '2026-10-03 15:00:00+00'::timestamptz,
  'borrar el trabajo da de baja su factura de prueba, con la marca del trabajo'
);

select is(
  (select deleted_at from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000031'),
  null,
  'y la de producción rechazada, que no traba la baja, queda como estaba: no se borra nunca'
);

select ok(
  has_function_privilege('authenticated', 'private.borrar_los_comprobantes_de_prueba(uuid,uuid,timestamptz)', 'EXECUTE')
    and not has_function_privilege('anon', 'private.borrar_los_comprobantes_de_prueba(uuid,uuid,timestamptz)', 'EXECUTE'),
  'la baja de los de prueba la puede llamar el dueño, que es quien borra el trabajo, y no anon'
);

select * from finish();
