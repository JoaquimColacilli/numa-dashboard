-- Los tesoros en dólares (ADR 0081): cada tesoro tiene una moneda que no cambia (MN034), los cuatro de
-- siempre son en pesos, un pase va entre tesoros de la misma moneda y entre pesos y dólares hay una
-- compra o una venta, con sus dos importes (MN035), la fila reparte pesos (MN023 con
-- tesoro-en-otra-moneda) y el libro mayor abre cada lado de un cambio con su importe.
--
-- Taller A con Maun en pesos, Dólares y Reserva en dólares, y Viajes en pesos; taller B con su Maun y
-- un tesoro en dólares. Los montos van en centavos de la moneda de cada tesoro; en los comentarios, en
-- pesos o en dólares: la compra de US$ 500 a $ 725.000 es la de la sección 2.3 del diseño, a $ 1.450
-- por dólar.

select plan(54);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

select tests.guardar('maun', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('cocos', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'cocos'));
select tests.guardar('diezmo', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'diezmo'));
select tests.guardar('maun_b', (select id from public.tesoros where household_id = tests.id('household_b') and clave = 'maun'));
select tests.guardar('dolares', 'aaaaaaaa-0000-7000-8000-000000000401');
select tests.guardar('reserva', 'aaaaaaaa-0000-7000-8000-000000000402');
select tests.guardar('viajes', 'aaaaaaaa-0000-7000-8000-000000000403');
select tests.guardar('dolares_b', 'bbbbbbbb-0000-7000-8000-000000000401');

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

-- El saldo de un tesoro, como lo suma la app: su libro, sin lo que ya estaba en la apertura.
create function tests.saldo(p_tesoro uuid)
returns bigint
language sql
stable
as $$
  select coalesce(sum(l.monto_centavos), 0)::bigint
  from public.libro_mayor l
  where l.tesoro_id = p_tesoro and not l.ya_en_la_apertura
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- La moneda de cada tesoro ---------------------------------------------------------------------------------

select is(
  (select array_agg(distinct moneda) from public.tesoros where household_id = tests.id('household_a')),
  array['ARS'],
  'el taller nace con sus cuatro tesoros de siempre en pesos'
);

select tests.entrar_como(tests.id('a'));

insert into public.tesoros (id, nombre, tinta, icono, moneda) values
  (tests.id('dolares'), 'Dólares', 'petroleo', 'banknote', 'USD'),
  (tests.id('reserva'), 'Reserva', 'mostaza', 'vault', 'USD');
insert into public.tesoros (id, nombre, tinta, icono)
  values (tests.id('viajes'), 'Viajes', 'grana', 'plane');

select is(
  (select moneda from public.tesoros where id = tests.id('viajes')),
  'ARS',
  'un tesoro nuevo sin moneda es en pesos: la moneda del taller'
);

select is(
  (select moneda from public.tesoros where id = tests.id('dolares')),
  'USD',
  'y uno se puede crear en dólares'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono, moneda) values ('Euros', 'grana', 'euro', 'EUR') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_moneda_valida"',
  'la moneda es una de la lista: pesos o dólares'
);

select is(
  tests.rechazo($$ update public.tesoros set moneda = 'ARS' where id = 'aaaaaaaa-0000-7000-8000-000000000401' $$),
  'MN034 moneda USD, pedida ARS: Ese tesoro sigue en su moneda',
  'la moneda de un tesoro no cambia: MN034'
);

select is(
  tests.hint_de($$ update public.tesoros set moneda = 'ARS' where id = 'aaaaaaaa-0000-7000-8000-000000000401' $$),
  'La moneda de un tesoro no se cambia. Si lo necesitás en la otra moneda, creá uno nuevo y pasá la plata con una compra o una venta.',
  'y el rechazo dice qué hacer, en el castellano de Eliseo, para una app sin actualizar que lo muestra tal cual'
);

select is(
  tests.rechazo(format($$ update public.tesoros set moneda = 'USD' where id = %L $$, tests.id('maun'))),
  'MN034 moneda ARS, pedida USD: Ese tesoro sigue en su moneda',
  'tampoco a uno de los de siempre'
);

select lives_ok(
  $$
    insert into public.tesoros (id, nombre, tinta, icono, moneda)
    values ('aaaaaaaa-0000-7000-8000-000000000401', 'Dólares', 'petroleo', 'banknote', 'USD')
    on conflict (id) do update set
      nombre = excluded.nombre, tinta = excluded.tinta, icono = excluded.icono, moneda = excluded.moneda
  $$,
  'el reenvío del alta, un upsert con la misma moneda, pasa'
);

select is(
  tests.rechazo($$
    insert into public.tesoros (id, nombre, tinta, icono, moneda)
    values ('aaaaaaaa-0000-7000-8000-000000000401', 'Dólares', 'petroleo', 'banknote', 'ARS')
    on conflict (id) do update set moneda = excluded.moneda
  $$),
  'MN034 moneda USD, pedida ARS: Ese tesoro sigue en su moneda',
  'y un upsert con la otra moneda rebota igual'
);

select lives_ok(
  $$ update public.tesoros set nombre = 'Dólares del taller', meta_centavos = 100000 where id = 'aaaaaaaa-0000-7000-8000-000000000401' $$,
  'lo demás de un tesoro en dólares se edita como siempre, también su meta, que va en dólares'
);

select tests.salir();

-- Los de siempre son de la moneda del taller: ni el dueño de la base puede sembrar uno en dólares. Se
-- prueba con un Cocos sembrado de nuevo, en un taller sin movimientos.
delete from public.tesoros where household_id = tests.id('household_b') and clave = 'cocos';

select throws_ok(
  format(
    $$ insert into public.tesoros (household_id, clave, nombre, tinta, icono, moneda) values (%L, 'cocos', 'Cocos', 'cocos', 'piggy-bank', 'USD') $$,
    tests.id('household_b')
  ),
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_los_de_siempre_en_la_moneda_del_taller"',
  'los cuatro de siempre son en pesos'
);

select tests.entrar_como(tests.id('a'));


-- La compra y la venta: un cambio con sus dos importes ---------------------------------------------------

-- La compra: $ 725.000 de Maun por US$ 500 en Dólares.
select lives_ok(
  format(
    $$ insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, categoria)
       values ('aaaaaaaa-0000-7000-8000-000000000411', '2026-09-28', 'cambio', %L, %L, 72500000, 50000, 'MEP') $$,
    tests.id('maun'), tests.id('dolares')
  ),
  'una compra de dólares va de un tesoro en pesos a uno en dólares, con lo que sale y lo que entra'
);

select results_eq(
  $$
    select tesoro_id, monto_centavos, concepto
    from public.libro_mayor
    where asiento_id = 'aaaaaaaa-0000-7000-8000-000000000411'
    order by monto_centavos
  $$,
  format(
    $$ values (%L::uuid, -72500000::bigint, 'cambio'), (%L::uuid, 50000::bigint, 'cambio') $$,
    tests.id('maun'), tests.id('dolares')
  ),
  'el libro mayor abre la compra en dos asientos, cada uno con el importe de su lado'
);

select is(tests.saldo(tests.id('dolares')), 50000::bigint, 'Dólares tiene US$ 500');
select is(tests.saldo(tests.id('maun')), -72500000::bigint, 'y Maun $ 725.000 menos: nunca se suman pesos con dólares');

-- La venta: US$ 200 de Dólares por $ 286.000 en Viajes.
select lives_ok(
  format(
    $$ insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, categoria)
       values ('aaaaaaaa-0000-7000-8000-000000000412', '2026-09-29', 'cambio', %L, %L, 20000, 28600000, 'Blue') $$,
    tests.id('dolares'), tests.id('viajes')
  ),
  'una venta es lo mismo dado vuelta: de dólares a pesos'
);

select is(tests.saldo(tests.id('dolares')), 30000::bigint, 'a Dólares le quedan US$ 300');
select is(tests.saldo(tests.id('viajes')), 28600000::bigint, 'y Viajes recibe $ 286.000');

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos) values ('2026-09-28', 'cambio', %L, %L, 72500000) $$,
    tests.id('maun'), tests.id('dolares')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_forma_segun_tipo"',
  'un cambio sin lo que entra no tiene forma'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-28', 'cambio', %L, %L, 72500000, 0) $$,
    tests.id('maun'), tests.id('dolares')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_forma_segun_tipo"',
  'ni con lo que entra en cero'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-28', 'cambio', %L, 72500000, 50000) $$,
    tests.id('dolares')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_forma_segun_tipo"',
  'ni con un solo lado'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-28', 'transferencia', %L, %L, 100000, 100000) $$,
    tests.id('maun'), tests.id('viajes')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_forma_segun_tipo"',
  'un pase no lleva segundo importe: lo que sale es lo que entra'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-28', 'ingreso', %L, 100000, 100000) $$,
    tests.id('dolares')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_forma_segun_tipo"',
  'ni un ingreso'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, cubre_el_mes) values ('2026-09-28', 'cambio', %L, %L, 72500000, 50000, '2026-09-01') $$,
    tests.id('maun'), tests.id('dolares')
  ),
  '23514', 'new row for relation "movimientos" violates check constraint "movimientos_cubre_el_mes_valido"',
  'un cambio no cubre el faltante de un mes: eso es de un pase en pesos'
);


-- Entre pesos y dólares, siempre un cambio (MN035) ---------------------------------------------------------

select is(
  tests.rechazo(format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos) values ('2026-09-28', 'transferencia', %L, %L, 100000) $$,
    tests.id('maun'), tests.id('dolares')
  )),
  'MN035 transferencia de ARS a USD: Entre pesos y dólares es una compra o una venta',
  'un pase entre un tesoro en pesos y uno en dólares rebota con MN035'
);

select is(
  tests.hint_de(format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos) values ('2026-09-28', 'transferencia', %L, %L, 100000) $$,
    tests.id('maun'), tests.id('dolares')
  )),
  'Actualizá la app y cargalo como compra o venta de dólares.',
  'y le dice a una app sin actualizar qué hacer, sin decir «versión»'
);

select is(
  tests.rechazo(format(
    $$ insert into public.movimientos (fecha, tipo, tesoro_origen, hacia_id, monto_centavos) values ('2026-09-28', 'transferencia', 'maun', %L, 100000) $$,
    tests.id('dolares')
  )),
  'MN035 transferencia de ARS a USD: Entre pesos y dólares es una compra o una venta',
  'también cuando una app de antes manda el origen por su clave: la regla mira los lados ya completos'
);

select is(
  tests.rechazo(format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, tesoro_destino, monto_centavos) values ('2026-09-28', 'aporte_cocos', %L, 'cocos', 100) $$,
    tests.id('dolares')
  )),
  'MN035 aporte_cocos de USD a ARS: Entre pesos y dólares es una compra o una venta',
  'un aporte a Cocos desde un tesoro en dólares tampoco: Cocos es en pesos'
);

select is(
  tests.rechazo(format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-28', 'cambio', %L, %L, 100000, 100000) $$,
    tests.id('maun'), tests.id('viajes')
  )),
  'MN035 cambio de ARS a ARS: Una compra o una venta va entre un tesoro en pesos y uno en dólares',
  'y un cambio entre dos tesoros en pesos rebota con el mismo código'
);

select lives_ok(
  format(
    $$ insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000413', '2026-09-29', 'transferencia', %L, %L, 10000) $$,
    tests.id('dolares'), tests.id('reserva')
  ),
  'un pase entre dos tesoros en dólares pasa: es la misma moneda'
);

select is(
  array[tests.saldo(tests.id('dolares')), tests.saldo(tests.id('reserva'))],
  array[20000::bigint, 10000::bigint],
  'y mueve dólares de uno al otro'
);

select lives_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos, categoria) values ('2026-09-29', 'ingreso', %L, 5000, 'Ingreso en dólares') $$,
    tests.id('reserva')
  ),
  'un ingreso a un tesoro en dólares pasa: tiene un solo lado'
);

select lives_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, monto_centavos, categoria) values ('2026-09-30', 'gasto', %L, 1000, 'Pasaje') $$,
    tests.id('reserva')
  ),
  'y un gasto desde uno también'
);

select is(tests.saldo(tests.id('reserva')), 14000::bigint, 'Reserva queda con US$ 140');


-- Las ediciones también miran las monedas ------------------------------------------------------------------

insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000414', '2026-09-29', 'transferencia', tests.id('maun'), tests.id('viajes'), 300000);

select is(
  tests.rechazo($$
    update public.movimientos set tipo = 'cambio', monto_destino_centavos = 300000
    where id = 'aaaaaaaa-0000-7000-8000-000000000414'
  $$),
  'MN035 cambio de ARS a ARS: Una compra o una venta va entre un tesoro en pesos y uno en dólares',
  'un pase en pesos editado a cambio sin tocar los lados rebota: si no, crearía plata en el libro'
);

select is(
  tests.rechazo(format(
    $$ update public.movimientos set hacia_id = %L where id = 'aaaaaaaa-0000-7000-8000-000000000414' $$,
    tests.id('dolares')
  )),
  'MN035 transferencia de ARS a USD: Entre pesos y dólares es una compra o una venta',
  'y uno al que se le cambia el destino por un tesoro en dólares, también'
);

select is(
  tests.rechazo($$
    update public.movimientos set tipo = 'transferencia', monto_destino_centavos = null
    where id = 'aaaaaaaa-0000-7000-8000-000000000411'
  $$),
  'MN035 transferencia de ARS a USD: Entre pesos y dólares es una compra o una venta',
  'una compra editada a pase, igual'
);

select lives_ok(
  $$ update public.movimientos set descripcion = 'Compra para el viaje', categoria = 'Oficial', monto_destino_centavos = 50100 where id = 'aaaaaaaa-0000-7000-8000-000000000411' $$,
  'una compra se edita como cualquier movimiento: su nota, su dólar y sus importes'
);

select is(tests.saldo(tests.id('dolares')), 20100::bigint, 'y el libro toma el importe nuevo del lado que entra');

select lives_ok(
  $$
    insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, categoria, descripcion)
    select id, fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, categoria, descripcion
    from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000411'
    on conflict (id) do update set
      tipo = excluded.tipo, desde_id = excluded.desde_id, hacia_id = excluded.hacia_id,
      monto_centavos = excluded.monto_centavos, monto_destino_centavos = excluded.monto_destino_centavos
  $$,
  'el reenvío de la cola, un upsert con lo mismo, pasa'
);


-- La fila reparte pesos (MN023, tesoro-en-otra-moneda) -----------------------------------------------------

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_fila(0, %L) $$,
    jsonb_build_object(
      'pasos', jsonb_build_array(jsonb_build_object(
        'tesoro', tests.id('dolares'), 'clase', 'prioridad', 'tope', 100000, 'renglones', '[]'::jsonb,
        'desde', null, 'modo', 'mes', 'hastaLaMeta', false
      )),
      'reparto', '[]'::jsonb,
      'sueldoPorTrabajo', false
    )
  )),
  'MN023 tesoro-en-otra-moneda: La fila no se pudo guardar.',
  'un tesoro en dólares no es un paso de la fila'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_fila(0, %L) $$,
    jsonb_build_object(
      'pasos', '[]'::jsonb,
      'reparto', jsonb_build_array(jsonb_build_object('tesoro', tests.id('dolares'), 'porcentaje', 1000, 'hastaLaMeta', false)),
      'sueldoPorTrabajo', false
    )
  )),
  'MN023 tesoro-en-otra-moneda: La fila no se pudo guardar.',
  'ni una parte del reparto'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_fila(0, %L) $$,
    jsonb_build_object(
      'obligaciones', jsonb_build_array(
        jsonb_build_object('tesoro', tests.id('diezmo'), 'porcentaje', 1000, 'base', 'ingreso'),
        jsonb_build_object('tesoro', tests.id('dolares'), 'porcentaje', 300, 'base', 'cobrado')
      ),
      'pasos', '[]'::jsonb,
      'reparto', '[]'::jsonb,
      'sueldoPorTrabajo', false
    )
  )),
  'MN023 tesoro-en-otra-moneda: La fila no se pudo guardar.',
  'ni una obligación'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_fila(0, %L) $$,
    jsonb_build_object(
      'pasos', '[]'::jsonb,
      'reparto', '[]'::jsonb,
      'superavit', tests.id('dolares'),
      'sueldoPorTrabajo', false
    )
  )),
  'MN023 tesoro-en-otra-moneda: La fila no se pudo guardar.',
  'ni el superávit'
);

select is(
  (
    select fila_version
    from public.guardar_la_fila(
      0,
      jsonb_build_object(
        'pasos', '[]'::jsonb,
        'reparto', jsonb_build_array(jsonb_build_object('tesoro', tests.id('viajes'), 'porcentaje', 1000, 'hastaLaMeta', false)),
        'sueldoPorTrabajo', false
      )
    )
  ),
  1,
  'con los tesoros en pesos, la fila se guarda como siempre'
);


-- Archivar un tesoro en dólares ------------------------------------------------------------------------------

select is(
  tests.rechazo($$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000402' $$),
  'MN024 saldo 14000: Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.',
  'un tesoro con dólares no se archiva: el saldo se cuenta en su moneda'
);

insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos)
  values ('2026-09-30', 'transferencia', tests.id('reserva'), tests.id('dolares'), 14000);

select lives_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000402' $$,
  'pasados sus dólares a otro tesoro en dólares, se archiva'
);


-- Otro taller no toca nada de esto ----------------------------------------------------------------------------

select tests.entrar_como(tests.id('b'));

insert into public.tesoros (id, nombre, tinta, icono, moneda)
  values (tests.id('dolares_b'), 'Dólares de B', 'ciruela', 'banknote', 'USD');

select is_empty(
  format($$ select 1 from public.tesoros where household_id = %L $$, tests.id('household_a')),
  'B no ve ningún tesoro de A, tampoco los en dólares'
);

select is_empty(
  format($$ select 1 from public.libro_mayor where household_id = %L $$, tests.id('household_a')),
  'ni su libro mayor, con sus cambios'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos) values ('2026-09-30', 'cambio', %L, %L, 72500000, 50000) $$,
    tests.id('maun_b'), tests.id('dolares')
  ),
  '23503', null,
  'B no compra dólares hacia un tesoro de A: el tesoro tiene que ser de su taller'
);

with u as (
  update public.tesoros set nombre = 'Intrusión' where id = 'aaaaaaaa-0000-7000-8000-000000000401' returning 1
)
select is(count(*), 0::bigint, 'ni toca un tesoro en dólares de A: la RLS lo vuelve invisible') from u;

with u as (
  update public.movimientos set monto_destino_centavos = 1 where id = 'aaaaaaaa-0000-7000-8000-000000000411' returning 1
)
select is(count(*), 0::bigint, 'ni edita una compra de A') from u;

select lives_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, monto_destino_centavos, categoria) values ('2026-09-30', 'cambio', %L, %L, 14500000, 10000, 'Oficial') $$,
    tests.id('maun_b'), tests.id('dolares_b')
  ),
  'y compra los suyos'
);

select is(tests.saldo(tests.id('dolares_b')), 10000::bigint, 'que quedan en su tesoro en dólares');

select * from finish();
