-- Los datos para facturar con ARCA (ADR 0085): las columnas nuevas de ajustes y de clientes, sus checks,
-- el único de la conexión y quién escribe qué. La conexión con ARCA (el ambiente, el CUIT, el punto de
-- venta y desde cuándo) y las alertas no se escriben desde una pantalla: es la traba 2 de la regla de los
-- dos ambientes, y este archivo la prueba del lado de los grants.

select plan(38);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));


-- Cómo nacen ---------------------------------------------------------------------------------------------

select is(
  (
    select jsonb_build_object(
      'ambiente', facturacion_ambiente, 'cuit', facturacion_cuit, 'punto', facturacion_punto_de_venta,
      'desde', facturacion_desde, 'concepto', facturacion_concepto, 'categoria', facturacion_categoria,
      'iibb', facturacion_ingresos_brutos, 'inicio', facturacion_inicio_de_actividades,
      'alertas', facturacion_alertas
    )
    from public.ajustes where household_id = tests.id('household_a')
  ),
  '{"ambiente": null, "cuit": "", "punto": null, "desde": null, "concepto": 1, "categoria": null, "iibb": "", "inicio": null, "alertas": []}'::jsonb,
  'un taller nace sin la facturación conectada, facturando productos y sin sus datos de facturación'
);

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía Gómez');

select is(
  (select dni from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  '',
  'un cliente nace sin DNI'
);


-- Lo que escribe el dueño y lo que no (traba 2) ------------------------------------------------------------

select lives_ok(
  $$ update public.ajustes set facturacion_concepto = 2, facturacion_categoria = 'D',
       facturacion_ingresos_brutos = '20-30123456-3', facturacion_inicio_de_actividades = '2019-03-01' $$,
  'el dueño escribe el concepto, su categoría, Ingresos Brutos y el inicio de actividades'
);

select is(
  (
    select array[facturacion_concepto::text, facturacion_categoria, facturacion_ingresos_brutos,
                 facturacion_inicio_de_actividades::text]
    from public.ajustes
  ),
  array['2', 'D', '20-30123456-3', '2019-03-01'],
  'y quedan guardados'
);

select throws_ok(
  $$ update public.ajustes set facturacion_ambiente = 'produccion' $$,
  '42501', null,
  'el dueño no pone su taller en producción desde una pantalla: el ambiente no tiene grant'
);

select throws_ok(
  $$ update public.ajustes set facturacion_ambiente = 'homologacion' $$,
  '42501', null,
  'ni en prueba'
);

select throws_ok(
  $$ update public.ajustes set facturacion_cuit = '20-11111111-2' $$,
  '42501', null,
  'no escribe el CUIT con el que se factura'
);

select throws_ok(
  $$ update public.ajustes set facturacion_punto_de_venta = 3 $$,
  '42501', null,
  'ni el punto de venta'
);

select throws_ok(
  $$ update public.ajustes set facturacion_desde = '2026-10-01' $$,
  '42501', null,
  'ni desde cuándo factura'
);

select throws_ok(
  $$ update public.ajustes set facturacion_alertas = '[]'::jsonb $$,
  '42501', null,
  'ni las alertas: las pone el servidor y se descartan con su función'
);

select ok(
  not has_column_privilege('authenticated', 'public.ajustes', 'facturacion_ambiente', 'INSERT')
    and not has_column_privilege('authenticated', 'public.ajustes', 'facturacion_cuit', 'INSERT'),
  'tampoco las inserta: los ajustes nacen con el taller'
);

select lives_ok(
  $$ update public.clientes set dni = '28456789' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  'el dueño le carga el DNI a un cliente'
);

select lives_ok(
  $$ insert into public.clientes (id, nombre, condicion_fiscal, dni)
     values ('aaaaaaaa-0000-7000-8000-000000000002', 'Rubén Ocampo', 'consumidor_final', '2845678') $$,
  'y da de alta uno con su DNI de siete dígitos'
);


-- Los checks de ajustes ---------------------------------------------------------------------------------------

select tests.salir();

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'testing' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_ambiente_valido"',
  'el ambiente es homologacion o produccion'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20111111112',
       facturacion_punto_de_venta = 1, facturacion_desde = '2026-10-01' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_cuit_formato"',
  'el CUIT va con guiones, como en el resto de la base'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-11111111-2',
       facturacion_punto_de_venta = 99999, facturacion_desde = '2026-10-01' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_punto_de_venta_valido"',
  'el punto de venta va de 1 a 99998'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-11111111-2',
       facturacion_punto_de_venta = 0, facturacion_desde = '2026-10-01' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_punto_de_venta_valido"',
  'y el cero no es un punto de venta'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_completa"',
  'un ambiente sin CUIT, punto de venta ni fecha no es una conexión'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_cuit = '20-11111111-2' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_completa"',
  'y un CUIT sin ambiente tampoco'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'produccion', facturacion_cuit = '20-11111111-2',
       facturacion_punto_de_venta = 3 where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_completa"',
  'ni una conexión sin desde cuándo'
);

select lives_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-11111111-2',
       facturacion_punto_de_venta = 1, facturacion_desde = '2026-10-01' where household_id = %L $$, tests.id('household_a')),
  'una conexión completa se guarda'
);

select lives_ok(
  format($$ update public.ajustes set facturacion_ambiente = null, facturacion_cuit = '',
       facturacion_punto_de_venta = null, facturacion_desde = null where household_id = %L $$, tests.id('household_a')),
  'y desconectar la deja vacía entera'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_concepto = 4 where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_concepto_valido"',
  'el concepto es 1, 2 o 3'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_categoria = 'L' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_categoria_valida"',
  'la categoría va de la A a la K'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_categoria = 'd' where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_categoria_valida"',
  'en mayúscula'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_ingresos_brutos = repeat('1', 41) where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_ingresos_brutos_largo"',
  'Ingresos Brutos tiene hasta 40 caracteres'
);

select throws_ok(
  format($$ update public.ajustes set facturacion_alertas = '{}'::jsonb where household_id = %L $$, tests.id('household_a')),
  '23514',
  'new row for relation "ajustes" violates check constraint "ajustes_facturacion_alertas_es_un_arreglo"',
  'las alertas son un arreglo'
);


-- Dos talleres no comparten numeración --------------------------------------------------------------------

update public.ajustes set facturacion_ambiente = 'produccion', facturacion_cuit = '20-30123456-3',
  facturacion_punto_de_venta = 3, facturacion_desde = '2026-10-01'
where household_id = tests.id('household_a');

select throws_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'produccion', facturacion_cuit = '20-30123456-3',
       facturacion_punto_de_venta = 3, facturacion_desde = '2026-10-02' where household_id = %L $$, tests.id('household_b')),
  '23505', null,
  'otro taller no se conecta al mismo CUIT y punto de venta en el mismo ambiente'
);

select lives_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'produccion', facturacion_cuit = '20-30123456-3',
       facturacion_punto_de_venta = 4, facturacion_desde = '2026-10-02' where household_id = %L $$, tests.id('household_b')),
  'con otro punto de venta, sí'
);

select lives_ok(
  format($$ update public.ajustes set facturacion_ambiente = 'homologacion', facturacion_cuit = '20-30123456-3',
       facturacion_punto_de_venta = 3, facturacion_desde = '2026-10-02' where household_id = %L $$, tests.id('household_b')),
  'y el mismo número en el otro ambiente es otra numeración'
);


-- El DNI ------------------------------------------------------------------------------------------------------

select throws_ok(
  $$ update public.clientes set dni = '284567' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  '23514',
  'new row for relation "clientes" violates check constraint "clientes_dni_formato"',
  'un DNI de seis dígitos no es un DNI'
);

select throws_ok(
  $$ update public.clientes set dni = '284567891' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  '23514',
  'new row for relation "clientes" violates check constraint "clientes_dni_formato"',
  'ni uno de nueve'
);

select throws_ok(
  $$ update public.clientes set dni = '28.456.789' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  '23514',
  'new row for relation "clientes" violates check constraint "clientes_dni_formato"',
  'se guarda sin puntos: los saca la app'
);

select lives_ok(
  $$ update public.clientes set dni = '' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  'y vacío vuelve a no tener DNI'
);


-- Lo que no viaja ni cambia el reparto -------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_attribute a
    where a.attrelid = 'public.ajustes'::regclass and a.attname like 'facturacion_%' and not a.attisdropped
  ),
  9,
  'ajustes suma nueve columnas de facturación'
);

select ok(
  pg_get_functiondef('private.contar_la_revision_de_la_fila()'::regprocedure) not like '%facturacion%',
  'ninguna cambia el reparto: no suman una revisión de la fila'
);

select tests.entrar_como(tests.id('a'));

select is(
  (select array_agg(facturacion_punto_de_venta) from public.ajustes),
  array[3],
  'el dueño ve la conexión de su taller y no la del otro'
);

select is(
  (
    select (jsonb_array_elements(public.bootstrap() -> 'ajustes') ->> 'facturacion_ambiente')
  ),
  'produccion',
  'las columnas nuevas viajan en la réplica del dueño como las demás de ajustes'
);

select * from finish();
