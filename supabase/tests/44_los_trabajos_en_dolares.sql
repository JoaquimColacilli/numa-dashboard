-- Los trabajos en dólares (ADR 0081): la moneda de cada trabajo y en qué le paga el cliente, los pagos
-- en dos monedas con su dólar y su tesoro, el cobro en pesos, el presupuesto en dólares y la página
-- del cliente. Lo que una app sin actualizar puede romper rebota con MN038 o MN039.
--
-- Taller A sin sueldo ni fijos, para que el cobro sea solo el diezmo: un trabajo en dólares de
-- US$ 2.000 con la visita de $ 120.000 pagada en pesos a $ 1.450 (descuenta US$ 82,76 y falta de
-- seña US$ 917,24, que son $ 1.329.998), uno en pesos que se cobra con $ 400.000 y US$ 400 a $ 1.500
-- ($ 1.000.000 en pesos), y los tesoros Dólares y Reserva en dólares y Viajes en pesos. Taller B con
-- lo suyo. Los montos van en centavos de la moneda de cada uno.

select plan(63);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

update public.ajustes
set sueldo_mensual_centavos = 0, costos_fijos_centavos = 0, sueldo_tope_mensual = false
where household_id in (tests.id('household_a'), tests.id('household_b'));

select tests.guardar('maun', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('dolares', 'aaaaaaaa-0000-7000-8000-000000000501');
select tests.guardar('reserva', 'aaaaaaaa-0000-7000-8000-000000000502');
select tests.guardar('viajes', 'aaaaaaaa-0000-7000-8000-000000000503');
select tests.guardar('dolares_b', 'bbbbbbbb-0000-7000-8000-000000000501');
select tests.guardar('cliente', 'aaaaaaaa-0000-7000-8000-000000000001');
select tests.guardar('en_dolares', 'aaaaaaaa-0000-7000-8000-000000000010');
select tests.guardar('en_curso', 'aaaaaaaa-0000-7000-8000-000000000020');
select tests.guardar('consulta', 'aaaaaaaa-0000-7000-8000-000000000030');
select tests.guardar('a_cobrar', 'aaaaaaaa-0000-7000-8000-000000000040');
select tests.guardar('en_pesos', 'aaaaaaaa-0000-7000-8000-000000000050');

-- El código, el detalle y el mensaje de un rechazo.
create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_codigo text;
  v_detalle text;
  v_mensaje text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics
      v_codigo = returned_sqlstate,
      v_detalle = pg_exception_detail,
      v_mensaje = message_text;
    return v_codigo || ' ' || coalesce(nullif(v_detalle, ''), '-') || ': ' || v_mensaje;
end;
$$;

-- El trabajo como lo manda la app. Sin moneda, como lo manda una app sin actualizar.
create function tests.trabajo(
  p_id uuid,
  p_version integer,
  p_estado text,
  p_presupuesto bigint,
  p_moneda text default null
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id, 'version', p_version, 'cliente_id', tests.id('cliente'),
    'titulo', 'Placard', 'descripcion', '', 'estado', p_estado,
    'presupuesto_centavos', p_presupuesto, 'forma_pago', 'transferencia', 'comprobante', 'remito',
    'direccion_entrega', '', 'notas', ''
  ) || case when p_moneda is null then '{}'::jsonb else jsonb_build_object('moneda', p_moneda) end
$$;

-- Un pago como lo manda la app nueva, con su moneda, su dólar y su tesoro.
create function tests.pago_en(
  p_id uuid,
  p_monto bigint,
  p_moneda text,
  p_cotizacion bigint,
  p_tesoro uuid default null
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id, 'fecha', '2026-09-20', 'concepto', 'Seña', 'monto_centavos', p_monto,
    'moneda', p_moneda, 'cotizacion_centavos', p_cotizacion, 'tesoro_id', p_tesoro
  )
$$;

-- Y como lo manda una app sin actualizar: sin ninguna de las tres claves.
create function tests.pago_viejo(p_id uuid, p_monto bigint)
returns jsonb
language sql
as $$
  select jsonb_build_object('id', p_id, 'fecha', '2026-09-20', 'concepto', 'Seña', 'monto_centavos', p_monto)
$$;

create function tests.version(p_id uuid)
returns integer
language sql
stable
as $$
  select version from public.proyectos where id = p_id
$$;

-- Mandar un documento armado a partir del de siempre, con lo que se le cambie.
create function tests.mandar(p_presupuesto uuid, p_revision uuid, p_proyecto uuid, p_cambios jsonb)
returns jsonb
language plpgsql
as $$
begin
  return public.mandar_el_presupuesto(
    p_presupuesto, p_revision,
    (select b.borrador_version from public.presupuestos b where b.id = p_presupuesto),
    tests.documento_del_presupuesto(p_proyecto) || p_cambios,
    'Cambió la moneda', '2026-09-20', null
  );
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

select tests.entrar_como(tests.id('b'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Cliente de B');
insert into public.proyectos (id, cliente_id, titulo, estado)
  values ('bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'De B', 'en_curso');
insert into public.tesoros (id, nombre, tinta, icono, moneda)
  values (tests.id('dolares_b'), 'Dólares de B', 'ciruela', 'banknote', 'USD');

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values (tests.id('cliente'), 'Marcela Duarte');
insert into public.tesoros (id, nombre, tinta, icono, moneda) values
  (tests.id('dolares'), 'Dólares', 'petroleo', 'banknote', 'USD'),
  (tests.id('reserva'), 'Reserva', 'mostaza', 'vault', 'USD');
insert into public.tesoros (id, nombre, tinta, icono) values (tests.id('viajes'), 'Viajes', 'grana', 'plane');


-- Las columnas nuevas, sus checks y sus grants -------------------------------------------------------------

insert into public.proyectos (id, cliente_id, titulo, estado) values
  (tests.id('en_curso'), tests.id('cliente'), 'Vanitory', 'en_curso'),
  (tests.id('consulta'), tests.id('cliente'), 'Mesa', 'contacto');

select is(
  (select array[moneda, coalesce(array_to_string(cobra_en, ','), 'null'), coalesce(costos_cotizacion_centavos::text, 'null')]
   from public.proyectos where id = tests.id('en_curso')),
  array['ARS', 'null', 'null'],
  'un trabajo nace en pesos, cobra en la moneda del taller y sin dólar para los costos'
);

select throws_ok(
  $$ insert into public.proyectos (cliente_id, titulo, estado, moneda) values ('aaaaaaaa-0000-7000-8000-000000000001', 'En euros', 'contacto', 'EUR') $$,
  '23514', 'new row for relation "proyectos" violates check constraint "proyectos_moneda_valida"',
  'la moneda de un trabajo es pesos o dólares'
);

select throws_ok(
  $$ update public.proyectos set cobra_en = '{USD,ARS}' where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  '23514', 'new row for relation "proyectos" violates check constraint "proyectos_cobra_en_valido"',
  'en qué le paga es una de las tres listas, en su orden'
);

select lives_ok(
  $$ update public.proyectos set cobra_en = '{ARS,USD}' where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  'pesos o dólares se guarda con su update, como las formas de cobro'
);

select throws_ok(
  $$ update public.proyectos set costos_cotizacion_centavos = 99 where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  '23514', 'new row for relation "proyectos" violates check constraint "proyectos_costos_cotizacion_en_rango"',
  'el dólar de los costos va de $ 1 a $ 100.000'
);

select ok(
  has_column_privilege('authenticated', 'public.proyectos', 'moneda', 'INSERT')
    and has_column_privilege('authenticated', 'public.proyectos', 'moneda', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.proyectos', 'cobra_en', 'INSERT')
    and has_column_privilege('authenticated', 'public.proyectos', 'cobra_en', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.proyectos', 'costos_cotizacion_centavos', 'INSERT')
    and has_column_privilege('authenticated', 'public.proyectos', 'costos_cotizacion_centavos', 'UPDATE'),
  'la moneda la escribe guardar_proyecto, y en qué le paga y el dólar de los costos van por su update'
);

select throws_ok(
  format($$ update public.ajustes set dolar_del_dia_centavos = 145000 where household_id = %L $$, tests.id('household_a')),
  '23514', 'new row for relation "ajustes" violates check constraint "ajustes_dolar_del_dia_con_su_fecha"',
  'el dólar del día va con su fecha'
);

select throws_ok(
  format($$ update public.ajustes set dolar_del_dia_centavos = 99, dolar_del_dia_el = '2026-09-20' where household_id = %L $$, tests.id('household_a')),
  '23514', 'new row for relation "ajustes" violates check constraint "ajustes_dolar_del_dia_en_rango"',
  'y en el rango de una cotización'
);

select throws_ok(
  format($$ update public.ajustes set cobro_dolares_cbu = '123' where household_id = %L $$, tests.id('household_a')),
  '23514', 'new row for relation "ajustes" violates check constraint "ajustes_cobro_dolares_cbu_formato"',
  'el CBU de la cuenta en dólares tiene la forma del de pesos'
);

select ok(
  has_column_privilege('authenticated', 'public.ajustes', 'dolar_del_dia_centavos', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'dolar_del_dia_el', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'cobro_dolares_cbu', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'cobro_dolares_alias', 'UPDATE'),
  'el dólar del día y la cuenta en dólares se guardan con un update, como el resto de los ajustes'
);


-- La moneda de un trabajo se elige mientras es una consulta (MN036) ------------------------------------------

select is(
  tests.rechazo($$ update public.proyectos set moneda = 'USD' where id = 'aaaaaaaa-0000-7000-8000-000000000020' $$),
  'MN036 estado en_curso, moneda ARS, pedida USD: La moneda de un trabajo se elige mientras es una consulta',
  'aprobado, la moneda ya no cambia'
);

select lives_ok(
  $$ update public.proyectos set moneda = 'ARS', notas = 'reenvío' where id = 'aaaaaaaa-0000-7000-8000-000000000020' $$,
  'el reenvío con la misma moneda pasa'
);

select lives_ok(
  $$ update public.proyectos set moneda = 'USD' where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  'en consulta se cambia'
);

update public.proyectos set moneda = 'ARS', cobra_en = null where id = tests.id('consulta');


-- Los pagos: su moneda, su dólar y su tesoro --------------------------------------------------------------

insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000301', tests.id('consulta'), '2026-09-20', 10000000);

select is(
  (select array[moneda, coalesce(cotizacion_centavos::text, 'null'), coalesce(tesoro_id::text, 'null')]
   from public.pagos where id = 'aaaaaaaa-0000-7000-8000-000000000301'),
  array['ARS', 'null', 'null'],
  'un pago nace en pesos, sin dólar y sin tesoro: entra a Maun'
);

select throws_ok(
  $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', 145000) $$,
  '23514', 'new row for relation "pagos" violates check constraint "pagos_tesoro_segun_moneda"',
  'un pago en dólares va a un tesoro'
);

select throws_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, %L) $$,
    tests.id('dolares')
  ),
  '23514', 'new row for relation "pagos" violates check constraint "pagos_tesoro_segun_moneda"',
  'y uno en pesos no: entra a Maun'
);

select throws_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', %L) $$,
    tests.id('dolares')
  ),
  '23514', 'new row for relation "pagos" violates check constraint "pagos_cotizacion_de_otra_moneda"',
  'un pago en dólares lleva a cuánto se tomó el dólar'
);

select throws_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', 99, %L) $$,
    tests.id('dolares')
  ),
  '23514', 'new row for relation "pagos" violates check constraint "pagos_cotizacion_en_rango"',
  'con una cotización de $ 1 a $ 100.000'
);

select ok(
  has_column_privilege('authenticated', 'public.pagos', 'moneda', 'INSERT')
    and has_column_privilege('authenticated', 'public.pagos', 'cotizacion_centavos', 'INSERT')
    and has_column_privilege('authenticated', 'public.pagos', 'tesoro_id', 'INSERT')
    and has_column_privilege('authenticated', 'public.pagos', 'moneda', 'UPDATE')
    and has_column_privilege('authenticated', 'public.pagos', 'cotizacion_centavos', 'UPDATE')
    and has_column_privilege('authenticated', 'public.pagos', 'tesoro_id', 'UPDATE'),
  'las tres se escriben con el pago'
);

select is(
  tests.rechazo(format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', 145000, %L) $$,
    tests.id('viajes')
  )),
  'MN037 tesoro en ARS, pago en USD: Ese tesoro no puede recibir este pago',
  'un pago en dólares no entra a un tesoro en pesos: MN037'
);

insert into public.pagos (id, proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id)
  values ('aaaaaaaa-0000-7000-8000-000000000302', tests.id('consulta'), '2026-09-20', 30000, 'USD', 145000, tests.id('reserva'));
update public.pagos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000302';
update public.tesoros set archivado_at = now() where id = tests.id('reserva');

select is(
  tests.rechazo(format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', 145000, %L) $$,
    tests.id('reserva')
  )),
  'MN037 tesoro en USD, archivado, pago en USD: Ese tesoro no puede recibir este pago',
  'ni a uno archivado'
);

select lives_ok(
  format(
    $$ insert into public.pagos (id, proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id)
       values ('aaaaaaaa-0000-7000-8000-000000000302', 'aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 30000, 'USD', 145000, %L)
       on conflict (id) do update set fecha = excluded.fecha $$,
    tests.id('reserva')
  ),
  'el reenvío de un pago que entró a un tesoro que se archivó después pasa'
);

select throws_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 50000, 'USD', 145000, %L) $$,
    tests.id('dolares_b')
  ),
  '23503', null,
  'un pago no entra a un tesoro de otro taller: la foreign key lo frena'
);


-- El dólar de un pago en pesos de un trabajo en dólares (MN039, diferido) --------------------------------------

select is(
  tests.rechazo($$
    do $prueba$
    begin
      update public.proyectos set moneda = 'USD' where id = 'aaaaaaaa-0000-7000-8000-000000000030';
      execute 'set constraints all immediate';
    end
    $prueba$
  $$),
  'MN039 -: A un pago en pesos de este trabajo en dólares le falta su dólar',
  'un trabajo con un pago en pesos sin su dólar no pasa a dólares'
);

select lives_ok(
  $$
    update public.proyectos set moneda = 'USD' where id = 'aaaaaaaa-0000-7000-8000-000000000030';
    update public.pagos set cotizacion_centavos = 145000 where id = 'aaaaaaaa-0000-7000-8000-000000000301';
    set constraints all immediate;
    set constraints all deferred
  $$,
  'diferido, pasa si en la misma transacción el pago recibe su dólar'
);

select is(
  tests.rechazo($$
    do $prueba$
    begin
      insert into public.pagos (proyecto_id, fecha, monto_centavos)
        values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 10000000);
      execute 'set constraints all immediate';
    end
    $prueba$
  $$),
  'MN039 -: A un pago en pesos de este trabajo en dólares le falta su dólar',
  'y un pago en pesos nuevo sin su dólar en un trabajo en dólares no entra'
);

select is(
  tests.hint_de($$
    do $prueba$
    begin
      insert into public.pagos (proyecto_id, fecha, monto_centavos)
        values ('aaaaaaaa-0000-7000-8000-000000000030', '2026-09-20', 10000000);
      execute 'set constraints all immediate';
    end
    $prueba$
  $$),
  'Actualizá la app y volvé a cargarlo.',
  'el rechazo le dice a una app sin actualizar qué hacer, sin decir «versión»'
);


-- guardar_proyecto: la moneda y lo que hace una app sin actualizar (MN038) -----------------------------------

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, %L, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), null, 'a_presupuestar', 200000, 'USD'),
    jsonb_build_array(tests.pago_en('aaaaaaaa-0000-7000-8000-000000000101', 12000000, 'ARS', 145000))
  ),
  'el trabajo en dólares se da de alta con su moneda y la visita pagada en pesos, con su dólar'
);

select is(
  (select array[p.moneda, g.moneda, g.cotizacion_centavos::text, coalesce(g.tesoro_id::text, 'null')]
   from public.proyectos p join public.pagos g on g.proyecto_id = p.id
   where p.id = tests.id('en_dolares')),
  array['USD', 'ARS', '145000', 'null'],
  'el trabajo queda en dólares y la visita en pesos, con su dólar y en Maun'
);

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, %L, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), tests.version(tests.id('en_dolares')), 'a_presupuestar', 200000, 'USD'),
    jsonb_build_array(
      tests.pago_en('aaaaaaaa-0000-7000-8000-000000000101', 12000000, 'ARS', 145000),
      tests.pago_en('aaaaaaaa-0000-7000-8000-000000000102', 50000, 'USD', 145000, tests.id('dolares'))
    )
  ),
  'un pago en dólares entra a su tesoro en dólares'
);

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, %L, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), tests.version(tests.id('en_dolares')), 'a_presupuestar', 200000),
    jsonb_build_array(
      tests.pago_viejo('aaaaaaaa-0000-7000-8000-000000000101', 12000000),
      tests.pago_viejo('aaaaaaaa-0000-7000-8000-000000000102', 50000)
    )
  ),
  'una app sin actualizar que guarda el trabajo sin tocar los importes pasa'
);

select is(
  (select array_agg(array[g.moneda, g.cotizacion_centavos::text, coalesce(g.tesoro_id::text, 'null')] order by g.id)
   from public.pagos g where g.proyecto_id = tests.id('en_dolares')),
  array[array['ARS', '145000', 'null'], array['USD', '145000', tests.id('dolares')::text]],
  'y conserva la moneda, el dólar y el tesoro de cada pago, y la moneda del trabajo'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_proyecto(%L, %L, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), tests.version(tests.id('en_dolares')), 'a_presupuestar', 200000),
    jsonb_build_array(tests.pago_viejo('aaaaaaaa-0000-7000-8000-000000000102', 60000))
  )),
  'MN038 pago: Este trabajo tiene plata en dólares',
  'si le cambia el importe a un pago en dólares, rebota: cree que es de pesos'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_proyecto(%L, '[]'::jsonb, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), tests.version(tests.id('en_dolares')), 'a_presupuestar', 250000)
  )),
  'MN038 presupuesto: Este trabajo tiene plata en dólares',
  'y si cambia el presupuesto de un trabajo en dólares, también'
);

select is(
  tests.hint_de(format(
    $$ select public.guardar_proyecto(%L, '[]'::jsonb, '[]'::jsonb) $$,
    tests.trabajo(tests.id('en_dolares'), tests.version(tests.id('en_dolares')), 'a_presupuestar', 250000)
  )),
  'Actualizá la app y volvé a hacerlo.',
  'el rechazo le dice qué hacer'
);


-- El libro mayor ---------------------------------------------------------------------------------------------

select results_eq(
  $$
    select coalesce(tesoro::text, 'sin clave'), tesoro_id, monto_centavos
    from public.libro_mayor
    where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010' and origen = 'pago'
    order by asiento_id
  $$,
  format(
    $$ values ('maun', %L::uuid, 12000000::bigint), ('sin clave', %L::uuid, 50000::bigint) $$,
    tests.id('maun'), tests.id('dolares')
  ),
  'el pago en pesos entra a Maun y el de dólares a su tesoro, con su importe en dólares'
);


-- El cobro, en pesos -------------------------------------------------------------------------------------------

insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values (tests.id('a_cobrar'), tests.id('cliente'), 'Cocina', 'entregado', 100000000);
insert into public.pagos (proyecto_id, fecha, monto_centavos)
  values (tests.id('a_cobrar'), '2026-09-01', 40000000);
insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id)
  values (tests.id('a_cobrar'), '2026-09-05', 40000, 'USD', 150000, tests.id('dolares'));

select is(
  tests.rechazo(format(
    $$ select public.cobrar_proyecto(%L, %s, '2026-09-10', 40040000, 0, 0, 0, 4004000, 0, 0, 36036000) $$,
    tests.id('a_cobrar'), tests.version(tests.id('a_cobrar'))
  )),
  'MN038 cobro: Este trabajo tiene plata en dólares',
  'una app sin actualizar suma los importes crudos: con plata en dólares no cobra'
);

select is(
  (
    select dist_cobrado_centavos
    from public.cobrar_proyecto(
      tests.id('a_cobrar'), tests.version(tests.id('a_cobrar')), '2026-09-10',
      100000000, 0, 0, 0, 10000000, 0, 0, 90000000
    )
  ),
  100000000::bigint,
  'lo cobrado es la suma de los valores en pesos: $ 400.000 y US$ 400 a $ 1.500 son $ 1.000.000'
);


-- El presupuesto en dólares ------------------------------------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', tests.id('en_dolares'));

select is(
  tests.rechazo(format(
    $$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', %L, '{}'::jsonb) $$,
    tests.id('en_dolares')
  )),
  'MN038 presupuesto: Este trabajo tiene plata en dólares',
  'un documento en pesos de un trabajo en dólares solo lo arma una app sin actualizar: MN038, y no MN029'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', %L, %L) $$,
    tests.id('en_dolares'),
    jsonb_build_object(
      'forma', 2, 'moneda', 'USD', 'monedaDeLoAbonado', 'USD', 'abonado', 58276,
      'referencia', jsonb_build_object('cotizacion', 145000, 'fecha', '2026-09-31')
    )
  )),
  'MN031 forma-invalida: El presupuesto no se pudo mandar.',
  'la fecha de la referencia tiene que existir'
);

select is(
  tests.mandar(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', tests.id('en_dolares'),
    jsonb_build_object(
      'forma', 2, 'moneda', 'USD', 'monedaDeLoAbonado', 'USD', 'abonado', 58276,
      'referencia', jsonb_build_object('cotizacion', 145000, 'fecha', '2026-09-20')
    )
  ) #>> '{revision,contenido,forma}',
  '2',
  'en dólares se manda un documento forma 2, con lo abonado en dólares: US$ 82,76 de la visita y US$ 500'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000112', %L, %L) $$,
    tests.id('en_dolares'),
    jsonb_build_object(
      'forma', 2, 'moneda', 'USD', 'monedaDeLoAbonado', 'ARS', 'abonado', 58276,
      'referencia', jsonb_build_object('cotizacion', 145000, 'fecha', '2026-09-20')
    )
  )),
  'MN029 abonado: Cambiaron los importes desde que lo armaste.',
  'lo abonado se compara en su moneda: en pesos es el valor en pesos de los pagos'
);

insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values (tests.id('en_pesos'), tests.id('cliente'), 'Biblioteca', 'a_presupuestar', 90000000);
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000150', tests.id('en_pesos'));

select is(
  tests.rechazo(format(
    $$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000151', %L, %L) $$,
    tests.id('en_pesos'),
    jsonb_build_object(
      'forma', 2, 'moneda', 'USD', 'monedaDeLoAbonado', 'USD', 'abonado', 0,
      'referencia', jsonb_build_object('cotizacion', 145000, 'fecha', '2026-09-20')
    )
  )),
  'MN029 moneda: Cambiaron los importes desde que lo armaste.',
  'un documento en dólares de un trabajo en pesos no coincide en la moneda: MN029'
);

select is(
  tests.mandar(
    'aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000151', tests.id('en_pesos'), '{}'::jsonb
  ) #>> '{revision,contenido,forma}',
  '1',
  'y uno en pesos de un trabajo en pesos se manda como siempre'
);


-- La página del cliente ----------------------------------------------------------------------------------------

select set_eq(
  $$ select jsonb_object_keys(public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010')) $$,
  array[
    'taller', 'cliente', 'trabajo', 'idioma', 'direccion', 'estado', 'precio_centavos', 'moneda', 'cobra_en',
    'sena_centavos', 'pago', 'cobro', 'cobro_en_dolares', 'dolar_del_dia', 'fechas', 'visita', 'entrega',
    'pagos', 'archivos', 'vidriera', 'relevamiento_centavos', 'presupuesto'
  ],
  'la vista suma la moneda, en qué le paga, la cuenta en dólares y el dólar del día'
);

select is(
  (
    select array[v ->> 'moneda', v ->> 'precio_centavos', v ->> 'sena_centavos', v #>> '{pago,instancia}', v #>> '{pago,monto_centavos}']
    from public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') as v
  ),
  array['USD', '200000', '100000', 'sena', '41724'],
  'el precio, la seña y lo que falta de seña, en dólares: US$ 1.000 menos US$ 82,76 y US$ 500'
);

select is(
  (
    select array_agg(array[e ->> 'monto_centavos', e ->> 'moneda', e ->> 'pagado_centavos', coalesce(e ->> 'cotizacion_centavos', 'null')] order by e ->> 'id')
    from jsonb_array_elements(public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'pagos') as e
  ),
  array[array['8276', 'ARS', '12000000', '145000'], array['50000', 'USD', '50000', '145000']],
  'cada pago viaja con lo que descontó en la moneda del trabajo, su moneda, lo que se entregó y su dólar'
);

select set_eq(
  $$ select jsonb_object_keys(public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'pago') $$,
  array['instancia', 'formas', 'formas_en_dolares', 'monto_centavos', 'siguiente'],
  'el pago que toca suma sus formas en dólares'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'cobro_en_dolares',
  jsonb_build_object('alias', null, 'cbu', null, 'titular', null, 'cuit', null),
  'sin cobrar en dólares, de la cuenta en dólares no viaja nada'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'dolar_del_dia',
  'null'::jsonb,
  'sin dólar del día cargado, no viaja'
);

update public.ajustes set
  dolar_del_dia_centavos = 145000, dolar_del_dia_el = '2026-09-20',
  cobro_dolares_alias = 'taller.dolares', cobro_titular = 'Ana Gutiérrez', cobro_cuit = '27-30123456-4'
where household_id = tests.id('household_a');
update public.proyectos set cobra_en = '{ARS,USD}' where id = tests.id('en_dolares');

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'dolar_del_dia',
  jsonb_build_object('cotizacion_centavos', 145000, 'fecha', '2026-09-20'),
  'en un trabajo en dólares con el presupuesto mandado, el dólar del día viaja con su fecha'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000030') -> 'dolar_del_dia',
  'null'::jsonb,
  'antes de mandarle el presupuesto no hay precio que pasar a pesos: el dólar del día no viaja (ADR 0067)'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') -> 'cobro_en_dolares',
  jsonb_build_object('alias', 'taller.dolares', 'cbu', null, 'titular', 'Ana Gutiérrez', 'cuit', '27-30123456-4'),
  'cobrando en pesos o dólares, con la cuenta en dólares, viaja la cuenta: el titular y el CUIT son los de pesos'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') #> '{pago,formas_en_dolares}',
  '["transferencia", "efectivo"]'::jsonb,
  'en dólares se puede transferir o pagar en efectivo'
);

update public.proyectos set cobra_en = '{USD}' where id = tests.id('en_dolares');

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') #> '{pago,formas}',
  '[]'::jsonb,
  'si le paga solo en dólares, las formas en pesos van vacías'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000050') -> 'dolar_del_dia',
  'null'::jsonb,
  'en un trabajo en pesos el dólar del día no viaja'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000050') #> '{pago,formas_en_dolares}',
  '[]'::jsonb,
  'y sin cobrar en dólares, sus formas en dólares van vacías'
);


-- Otro taller no puede nada de esto --------------------------------------------------------------------------

select tests.entrar_como(tests.id('b'));

select throws_ok(
  $$ select public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') $$,
  '42501', null,
  'B no ve la página de un trabajo en dólares de A'
);

select is_empty(
  format($$ select 1 from public.pagos where household_id = %L $$, tests.id('household_a')),
  'ni sus pagos en dólares'
);

with u as (
  update public.proyectos set moneda = 'ARS' where id = 'aaaaaaaa-0000-7000-8000-000000000010' returning 1
)
select is(count(*), 0::bigint, 'ni le cambia la moneda a un trabajo de A') from u;

select throws_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('bbbbbbbb-0000-7000-8000-000000000010', '2026-09-20', 50000, 'USD', 145000, %L) $$,
    tests.id('dolares')
  ),
  '23503', null,
  'ni le carga un pago a un tesoro en dólares de A'
);

select lives_ok(
  format(
    $$ insert into public.pagos (proyecto_id, fecha, monto_centavos, moneda, cotizacion_centavos, tesoro_id) values ('bbbbbbbb-0000-7000-8000-000000000010', '2026-09-20', 50000, 'USD', 145000, %L) $$,
    tests.id('dolares_b')
  ),
  'y carga los suyos en su tesoro en dólares'
);

select is(
  (select sum(monto_centavos)::bigint from public.libro_mayor where tesoro_id = tests.id('dolares_b')),
  50000::bigint,
  'que quedan en su libro, en dólares'
);

select * from finish();
