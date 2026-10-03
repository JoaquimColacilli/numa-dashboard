-- Pedir la factura de un pago y la nota de crédito que la anula (ADR 0085): las gemelas del dominio con las
-- que la base congela cada comprobante, lo que congela, el reenvío de la cola, los rechazos (MN040, MN041 y
-- MN042) y descartar la alerta de una factura que NUMA no hizo. Que el ambiente, el CUIT y el punto de venta
-- salen del taller y no de la app es la traba 3 de la regla de los dos ambientes.

select plan(50);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

-- El taller A, monotributista y con todo lo que sale en la factura, y sus clientes: Lucía, consumidora
-- final, y una SRL responsable inscripta.
select tests.entrar_como(tests.id('a'));
update public.ajustes set
  taller_condicion_fiscal = 'monotributo', taller_titular = ' RIVAS MARTIN ', taller_domicilio = 'Pasaje Los Robles 450',
  facturacion_ingresos_brutos = '20-11111111-2', facturacion_inicio_de_actividades = '2019-03-01';

insert into public.clientes (id, nombre, direccion)
  values ('aaaaaaaa-0000-7000-8000-000000000001', ' Lucía Gómez ', ' Av. Siempreviva 742 ');
insert into public.clientes (id, nombre, condicion_fiscal, cuit, razon_social, domicilio_fiscal, direccion)
  values ('aaaaaaaa-0000-7000-8000-000000000002', 'Pérez', 'responsable_inscripto', '30-71234567-1',
    'Carpintería Pérez SRL', 'Calle Falsa 123', 'Otra calle 1');

-- Un placard de $ 900.000, una cocina de $ 15.000.000 (pasa el umbral de la RG 5866), un rack en dólares y una
-- mesa para la SRL.
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'en_curso', 90000000),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Cocina', 'en_curso', 1500000000),
  ('aaaaaaaa-0000-7000-8000-000000000040', 'aaaaaaaa-0000-7000-8000-000000000002', 'Mesa', 'en_curso', 50000000);
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos, moneda)
  values ('aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'en_curso', 100000, 'USD');

insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-20', 'Seña', 45000000),
  ('aaaaaaaa-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-25', 'Pago 2', 20000000),
  ('aaaaaaaa-0000-7000-8000-000000000021', 'aaaaaaaa-0000-7000-8000-000000000020', '2026-09-20', 'Seña', 100000000),
  ('aaaaaaaa-0000-7000-8000-000000000041', 'aaaaaaaa-0000-7000-8000-000000000040', '2026-09-20', 'Seña', 25000000);
insert into public.movimientos (fecha, tipo, tesoro_destino, monto_centavos, categoria, descripcion)
  values ('2026-09-14', 'ajuste', 'maun', 100000000, 'Apertura', 'Apertura');
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos, ya_en_la_apertura)
  values ('aaaaaaaa-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-01', 'De antes', 5000000, true);
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos, cotizacion_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000031', 'aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 'Seña', 50000000, 100000);

-- El taller B, con lo mismo cargado y sin la facturación conectada.
select tests.entrar_como(tests.id('b'));
update public.ajustes set
  taller_condicion_fiscal = 'monotributo', taller_titular = 'GOMEZ RUBEN', taller_domicilio = 'Calle 1',
  facturacion_ingresos_brutos = '1', facturacion_inicio_de_actividades = '2020-01-01';
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Rubén');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'Mesa', 'en_curso', 1000000);
insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000011', 'bbbbbbbb-0000-7000-8000-000000000010', '2026-09-20', 1000000);

-- La conexión de A, en homologación: la escribe el dueño de la base, como db:facturacion.
select tests.salir();
update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-11111111-2',
  facturacion_punto_de_venta = 1, facturacion_desde = '2026-09-01'
where household_id = tests.id('household_a');


-- Las gemelas del dominio ------------------------------------------------------------------------------------

select is(
  array[
    private.condicion_iva_del_receptor('consumidor_final'), private.condicion_iva_del_receptor('monotributo'),
    private.condicion_iva_del_receptor('responsable_inscripto'), private.condicion_iva_del_receptor('exento')
  ],
  array[5, 6, 1, 4]::smallint[],
  'la condición frente al IVA del receptor es la de ARCA'
);

select is(
  array[
    private.cuit_valido('20-11111111-2'), private.cuit_valido('20111111112'), private.cuit_valido('20-11111111-3'),
    private.cuit_valido('21-11111111-2'), private.cuit_valido('20-1111111-2'), private.cuit_valido(''),
    private.cuit_valido('20-00000001-0')
  ],
  array[true, true, false, false, false, false, false],
  'un CUIT válido tiene once dígitos, un prefijo de persona o de empresa y su dígito verificador; con resto 10 no hay ninguno'
);

select is(
  jsonb_build_array(
    private.documento_del_receptor('consumidor_final', '', '', 999999999),
    private.documento_del_receptor('consumidor_final', '20-11111111-2', '', 0),
    private.documento_del_receptor('consumidor_final', '', '28456789', 1000000000)
  ),
  '[{"docTipo": 99, "docNro": "0"}, {"docTipo": 80, "docNro": "20111111112"}, {"docTipo": 96, "docNro": "28456789"}]'::jsonb,
  'el consumidor final va sin identificar debajo del umbral, con su CUIT si lo dio, y con su DNI desde el umbral'
);

select is(
  jsonb_build_array(
    private.documento_del_receptor('consumidor_final', '20-11111111-3', '', 0),
    private.documento_del_receptor('responsable_inscripto', '', '', 0),
    private.documento_del_receptor('consumidor_final', '', '', 1000000000)
  ),
  '[{"falta": "cuit-invalido"}, {"falta": "cuit"}, {"falta": "dni"}]'::jsonb,
  'y si no, lo que le falta: el CUIT bien, el CUIT del que no es consumidor final o el DNI'
);

select is(
  private.lo_que_falta_para_facturar(
    '{"taller": {"condicion": "monotributo", "razonSocial": "RIVAS MARTIN", "domicilio": "Pasaje Los Robles 450",
       "ingresosBrutos": "1", "inicioDeActividades": "2019-03-01"},
      "trabajo": {"moneda": "ARS", "borrado": false, "precio": 90000000, "cobrado": 45000000},
      "pago": {"moneda": "ARS", "borrado": false, "yaEnLaApertura": false},
      "cliente": {"condicion": "consumidor_final", "cuit": "", "dni": "", "domicilioFiscal": "", "direccion": ""}}'
  ),
  array[]::text[],
  'con todo cargado no falta nada'
);

select is(
  private.lo_que_falta_para_facturar(
    '{"taller": {"condicion": null, "razonSocial": " ", "domicilio": "", "ingresosBrutos": "\t", "inicioDeActividades": null},
      "trabajo": {"moneda": "USD", "borrado": true, "precio": null, "cobrado": 0},
      "pago": {"moneda": "ARS", "borrado": false, "yaEnLaApertura": true},
      "cliente": {"condicion": "exento", "cuit": "", "dni": "", "domicilioFiscal": " ", "direccion": ""}}'
  ),
  array[
    'taller-no-monotributo', 'taller-sin-razon-social', 'taller-sin-domicilio', 'taller-sin-ingresos-brutos',
    'taller-sin-inicio-de-actividades', 'pago-borrado', 'en-dolares', 'de-la-apertura', 'cliente-sin-cuit',
    'cliente-sin-domicilio'
  ],
  'sin nada, falta todo, en el orden de la lista'
);

select is(
  private.lo_que_falta_para_facturar(
      '{"taller": {"condicion": "monotributo", "razonSocial": "R", "domicilio": "D", "ingresosBrutos": "1", "inicioDeActividades": "2019-03-01"},
        "trabajo": {"moneda": "ARS", "borrado": false, "precio": 90000000, "cobrado": 0},
        "pago": {"moneda": "ARS", "borrado": false, "yaEnLaApertura": false},
        "cliente": {"condicion": "monotributo", "cuit": "20-11111111-3", "dni": "", "domicilioFiscal": "", "direccion": "Calle 1"}}'
    )
    || private.lo_que_falta_para_facturar(
      '{"taller": {"condicion": "monotributo", "razonSocial": "R", "domicilio": "D", "ingresosBrutos": "1", "inicioDeActividades": "2019-03-01"},
        "trabajo": {"moneda": "ARS", "borrado": false, "precio": 900000000, "cobrado": 1000000000},
        "pago": {"moneda": "ARS", "borrado": false, "yaEnLaApertura": false},
        "cliente": {"condicion": "consumidor_final", "cuit": "", "dni": "", "domicilioFiscal": "", "direccion": ""}}'
    ),
  array['cliente-cuit-invalido', 'cliente-sin-dni'],
  'el CUIT mal cargado, y el DNI desde el umbral contando lo cobrado si pasa el precio'
);


-- Pedir la factura: lo que se congela ------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

select is(
  (
    select array[
      household_id::text, proyecto_id::text, pago_id::text, tipo, estado, ambiente, cuit_emisor,
      punto_de_venta::text, concepto::text, importe_centavos::text, moneda, doc_tipo::text, doc_nro,
      condicion_iva_receptor::text, receptor_condicion::text, receptor_nombre, receptor_domicilio, detalle,
      coalesce(numero::text, 'sin número')
    ]
    from public.pedir_la_factura(
      'cccccccc-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000000011', '  Seña — Placard  '
    )
  ),
  array[
    tests.id('household_a')::text, 'aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000011',
    'factura_c', 'pedida', 'homologacion', '20-11111111-2', '1', '1', '45000000', 'ARS', '99', '0', '5',
    'consumidor_final', 'Lucía Gómez', 'Av. Siempreviva 742', 'Seña — Placard', 'sin número'
  ],
  'la factura nace pedida, con el importe del pago, el ambiente, el CUIT y el punto de venta del taller y el receptor del cliente'
);

select is(
  (select emisor from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'),
  jsonb_build_object(
    'razonSocial', 'RIVAS MARTIN', 'nombreDelTaller', 'Taller A', 'domicilio', 'Pasaje Los Robles 450',
    'cuit', '20-11111111-2', 'ingresosBrutos', '20-11111111-2', 'inicioDeActividades', '2019-03-01'
  ),
  'el emisor sale de los ajustes y del nombre del taller, no de lo que manda la app'
);

select is(
  (
    select array[detalle, version::text]
    from public.pedir_la_factura(
      'cccccccc-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000000011', 'Otro detalle'
    )
  ),
  array['Seña — Placard', '1'],
  'el reenvío de la cola devuelve la misma factura tal cual, sin pedir otra'
);

select is(
  (select count(*)::int from public.comprobantes where pago_id = 'aaaaaaaa-0000-7000-8000-000000000011'),
  1,
  'y el pago sigue con una sola'
);

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000000012', 'Pago 2') $$,
  '22023', null,
  'el id de una factura no sirve para pedir la de otro pago'
);

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000002', 'aaaaaaaa-0000-7000-8000-000000000011', 'Seña') $$,
  'MN042', 'Ese pago ya tiene su factura',
  'un pago con su factura viva no tiene otra'
);

select is(
  (
    select array[doc_tipo::text, doc_nro, condicion_iva_receptor::text, receptor_condicion::text, receptor_nombre, receptor_domicilio]
    from public.pedir_la_factura('cccccccc-0000-7000-8000-000000000041', 'aaaaaaaa-0000-7000-8000-000000000041', 'Seña — Mesa')
  ),
  array['80', '30712345671', '1', 'responsable_inscripto', 'Carpintería Pérez SRL', 'Calle Falsa 123'],
  'a un responsable inscripto se le factura con su CUIT, su razón social y su domicilio fiscal'
);

select is(
  (
    select char_length(detalle)
    from public.pedir_la_factura('cccccccc-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000012', repeat('a', 250))
  ),
  200,
  'el detalle se recorta a 200'
);


-- Lo que falta (MN041) ----------------------------------------------------------------------------------------

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000021', 'Seña — Cocina') $$,
  'MN041', 'Le falta algo para facturar',
  'una cocina de $ 15.000.000 a un consumidor final sin DNI no se factura'
);

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000021', 'Seña — Cocina') $$),
  'cliente-sin-dni',
  'y el hint dice qué falta'
);

update public.clientes set dni = '28456789' where id = 'aaaaaaaa-0000-7000-8000-000000000001';

select is(
  (
    select array[doc_tipo::text, doc_nro]
    from public.pedir_la_factura('cccccccc-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000021', 'Seña — Cocina')
  ),
  array['96', '28456789'],
  'con su DNI sí, aunque el pago no llegue al umbral: mira el trabajo'
);

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000031', 'aaaaaaaa-0000-7000-8000-000000000031', 'Seña — Rack') $$),
  'en-dolares',
  'un pago de un trabajo en dólares no se factura'
);

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000013', 'De antes') $$),
  'de-la-apertura',
  'ni uno que ya estaba en los saldos de la apertura'
);

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000099', 'bbbbbbbb-0000-7000-8000-000000000011', 'Ajeno') $$),
  'pago-borrado',
  'el pago de otro taller es, para A, un pago que no existe'
);

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000099', 'aaaaaaaa-0000-7000-8000-0000000000ff', 'Nada') $$),
  'pago-borrado',
  'y uno que no existe, también'
);

update public.ajustes set facturacion_ingresos_brutos = ' ', facturacion_inicio_de_actividades = null;

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000098', 'aaaaaaaa-0000-7000-8000-000000000041', 'Otra') $$),
  'taller-sin-ingresos-brutos, taller-sin-inicio-de-actividades',
  'si falta más de una cosa, van todas, separadas por coma'
);

update public.ajustes set facturacion_ingresos_brutos = '20-11111111-2', facturacion_inicio_de_actividades = '2019-03-01';

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000097', 'aaaaaaaa-0000-7000-8000-000000000041', ' ') $$,
  'MN042', null,
  'el pago ya facturado rebota antes de mirar el detalle'
);

update public.pagos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000013';

select is(
  tests.hint_de($$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000013', 'De antes') $$),
  'pago-borrado, de-la-apertura',
  'un pago dado de baja no se factura'
);


-- El detalle, el taller sin conexión y el comprobante de otro taller -------------------------------------------

select tests.salir();
update public.comprobantes set estado = 'emitiendo', numero = 7, fecha = '2026-10-03'
where id = 'cccccccc-0000-7000-8000-000000000012';
update public.comprobantes set estado = 'rechazada', numero = null, fecha = null,
  rechazo = '{"errores": [{"codigo": 10015, "mensaje": "El documento no es válido"}]}'
where id = 'cccccccc-0000-7000-8000-000000000012';
select tests.entrar_como(tests.id('a'));

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000014', 'aaaaaaaa-0000-7000-8000-000000000012', ' 	 ') $$,
  '22023', 'La factura necesita su detalle',
  'el detalle no va en blanco'
);

select is(
  (
    select estado
    from public.pedir_la_factura('cccccccc-0000-7000-8000-000000000014', 'aaaaaaaa-0000-7000-8000-000000000012', 'Pago 2 — Placard')
  ),
  'pedida',
  'con la factura rechazada, el pago se vuelve a pedir con otra'
);

select tests.entrar_como(tests.id('b'));

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-0000000000b1', 'bbbbbbbb-0000-7000-8000-000000000011', 'Mesa') $$,
  'MN040', 'La facturación con ARCA no está conectada',
  'sin la conexión no se pide ninguna factura'
);

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000001', 'bbbbbbbb-0000-7000-8000-000000000011', 'Mesa') $$,
  '42501', null,
  'el id de un comprobante de otro taller no se reusa ni se lee'
);

select is_empty(
  $$ select 1 from public.comprobantes $$,
  'y B no ve ningún comprobante de A'
);


-- La nota de crédito ------------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

select throws_ok(
  $$ select public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000101', 'cccccccc-0000-7000-8000-000000000001') $$,
  'MN042', 'Esa factura ya está anulada o todavía no está autorizada',
  'una factura pedida no se anula todavía'
);

select tests.salir();
update public.comprobantes set estado = 'emitiendo', numero = 42, fecha = '2026-10-03'
where id in ('cccccccc-0000-7000-8000-000000000001', 'cccccccc-0000-7000-8000-000000000041');
update public.comprobantes set estado = 'autorizada', cae = '76398765432109', cae_vence = '2026-10-13', autorizada_at = now()
where id in ('cccccccc-0000-7000-8000-000000000001', 'cccccccc-0000-7000-8000-000000000041');
select tests.entrar_como(tests.id('a'));

select is(
  (
    select array[
      tipo, estado, asociado_id::text, pago_id::text, proyecto_id::text, ambiente, cuit_emisor, punto_de_venta::text,
      importe_centavos::text, doc_tipo::text, doc_nro, receptor_nombre, detalle, coalesce(numero::text, 'sin número')
    ]
    from public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000101', 'cccccccc-0000-7000-8000-000000000001')
  ),
  array[
    'nota_de_credito_c', 'pedida', 'cccccccc-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000000011',
    'aaaaaaaa-0000-7000-8000-000000000010', 'homologacion', '20-11111111-2', '1', '45000000', '99', '0', 'Lucía Gómez',
    'Anula la factura C 00001-00000042', 'sin número'
  ],
  'la nota de crédito copia la factura entera y dice cuál anula'
);

select is(
  (select emisor from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000101'),
  (select emisor from public.comprobantes where id = 'cccccccc-0000-7000-8000-000000000001'),
  'con el mismo emisor'
);

select is(
  (select version from public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000101', 'cccccccc-0000-7000-8000-000000000001')),
  1,
  'el reenvío devuelve la misma nota'
);

select throws_ok(
  $$ select public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000102', 'cccccccc-0000-7000-8000-000000000001') $$,
  'MN042', null,
  'una factura no tiene dos notas vivas'
);

select throws_ok(
  $$ select public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000102', 'cccccccc-0000-7000-8000-000000000101') $$,
  'MN042', null,
  'una nota no se anula'
);

select throws_ok(
  $$ select public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000041', 'cccccccc-0000-7000-8000-000000000041') $$,
  '22023', null,
  'el id de una factura no sirve para su nota'
);

-- Desconectado, igual se anula: una factura se anula aunque el taller ya no facture con NUMA.
select tests.salir();
update public.ajustes set facturacion_ambiente = null, facturacion_cuit = '', facturacion_punto_de_venta = null,
  facturacion_desde = null
where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));

select is(
  (select estado from public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-000000000141', 'cccccccc-0000-7000-8000-000000000041')),
  'pedida',
  'una factura se anula aunque el taller ya no esté conectado'
);

select throws_ok(
  $$ select public.pedir_la_factura('cccccccc-0000-7000-8000-000000000096', 'aaaaaaaa-0000-7000-8000-000000000012', 'Pago 2') $$,
  'MN040', null,
  'pero no se pide una factura nueva'
);

select is(
  (
    select estado
    from public.pedir_la_factura('cccccccc-0000-7000-8000-000000000014', 'aaaaaaaa-0000-7000-8000-000000000012', 'Pago 2')
  ),
  'pedida',
  'y el reenvío de una ya pedida sigue devolviéndola'
);

select tests.entrar_como(tests.id('b'));

select throws_ok(
  $$ select public.pedir_la_nota_de_credito('cccccccc-0000-7000-8000-0000000000b2', 'cccccccc-0000-7000-8000-000000000001') $$,
  '42501', 'La factura no existe o no es tuya',
  'B no anula una factura de A'
);


-- La alerta de una factura que NUMA no hizo ------------------------------------------------------------------

select tests.salir();
update public.ajustes set facturacion_alertas = '[
  {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 45, "numeroNuma": 44, "descartada": false},
  {"codigo": "sin-acceso", "desde": "2026-10-03T09:15:00Z"}
]'
where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));

select is(
  (select facturacion_alertas -> 0 ->> 'descartada' from public.descartar_la_alerta_de_facturacion('fuera-de-numa', 44)),
  'false',
  'con otro número de ARCA, la alerta sigue: llegó una nueva después de la que vio el dueño'
);

select is(
  (select facturacion_alertas from public.descartar_la_alerta_de_facturacion('fuera-de-numa', 45)),
  '[
    {"codigo": "fuera-de-numa", "tipo": "factura_c", "puntoDeVenta": 1, "numeroArca": 45, "numeroNuma": 44, "descartada": true},
    {"codigo": "sin-acceso", "desde": "2026-10-03T09:15:00Z"}
  ]'::jsonb,
  'con el número que vio, queda descartada y las demás no se tocan'
);

select is(
  (select version from public.descartar_la_alerta_de_facturacion('fuera-de-numa', 45)),
  (select version from public.ajustes),
  'el reenvío no cambia nada'
);

select throws_ok(
  $$ select public.descartar_la_alerta_de_facturacion('sin-acceso', 45) $$,
  '22023', 'Esa alerta se va sola cuando se resuelve',
  'las otras alertas no se descartan'
);


-- Quién llama a qué ----------------------------------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.pedir_la_factura(uuid,uuid,text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.pedir_la_nota_de_credito(uuid,uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.descartar_la_alerta_de_facturacion(text,bigint)', 'EXECUTE'),
  'el dueño llama a las tres de la app'
);

select ok(
  not has_function_privilege('anon', 'public.pedir_la_factura(uuid,uuid,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.pedir_la_nota_de_credito(uuid,uuid)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.descartar_la_alerta_de_facturacion(text,bigint)', 'EXECUTE'),
  'y anon a ninguna'
);

select ok(
  not has_function_privilege('authenticated', 'private.condicion_iva_del_receptor(public.condicion_fiscal)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.cuit_valido(text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.documento_del_receptor(public.condicion_fiscal,text,text,bigint)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.lo_que_falta_para_facturar(jsonb)', 'EXECUTE'),
  'las gemelas no las llama nadie más que las funciones de la base'
);

select ok(
  (select p.prosecdef from pg_proc p where p.oid = 'private.pedir_la_factura(uuid,uuid,text)'::regprocedure)
    and (select p.prosecdef from pg_proc p where p.oid = 'private.pedir_la_nota_de_credito(uuid,uuid)'::regprocedure)
    and (select p.prosecdef from pg_proc p where p.oid = 'private.descartar_la_alerta_de_facturacion(text,bigint)'::regprocedure)
    and not (select p.prosecdef from pg_proc p where p.oid = 'public.pedir_la_factura(uuid,uuid,text)'::regprocedure),
  'las de private corren elevadas, porque la app no escribe comprobantes ni alertas; las de public, no'
);

select is(
  (select count(*)::int from public.comprobantes where household_id = tests.id('household_a')),
  7,
  'A pidió siete comprobantes: cinco facturas, una rechazada entre ellas, y dos notas'
);

select * from finish();
