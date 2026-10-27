-- Los compromisos de Eliseo: el día de pago corta el ciclo de cada compromiso por mes, «se paga sola»
-- pide el día y la fecha desde la que se paga sola la pone la base al guardar; una obligación puede
-- llevarse un monto fijo de cada cobro, nunca más de lo que llega. Lo de antes se lee como siempre.

select plan(37);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));
select set_config('maun.hoy_en_el_taller', '2026-10-27', true);

-- Los tesoros de Ana, para validar filas como lo hace guardar_la_fila.
create function tests.tesoros()
returns jsonb
language sql
as $$
  select jsonb_agg(jsonb_build_object('id', t.id, 'clave', t.clave, 'archivado', false, 'meta', t.meta_centavos, 'moneda', t.moneda))
  from public.tesoros t
  where t.household_id = tests.id('household_a') and t.deleted_at is null
$$;

create function tests.id_de(p_clave text)
returns text
language sql
as $$
  select t.id::text from public.tesoros t where t.household_id = tests.id('household_a') and t.clave::text = p_clave
$$;

-- Una fila con el diezmo, el salario por mes y lo que pida cada caso.
create function tests.fila(p_salario jsonb default '{}', p_obligacion jsonb default '{}', p_mas_pasos jsonb default '[]')
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'obligaciones', jsonb_build_array(jsonb_build_object('tesoro', tests.id_de('diezmo'), 'porcentaje', 1000, 'base', 'ingreso') || p_obligacion),
    'pasos', jsonb_build_array(
      jsonb_build_object('tesoro', tests.id_de('hogar'), 'clase', 'sueldo', 'tope', 100000000, 'renglones', '[]'::jsonb, 'desde', null, 'modo', 'mes') || p_salario
    ) || p_mas_pasos,
    'reparto', '[]'::jsonb,
    'superavit', tests.id_de('maun'),
    'sueldoPorTrabajo', false
  )
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- El ciclo ------------------------------------------------------------------------------------------------

select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-10-27', 10)), '{2026-10-10,2026-11-10}', 'con el día 10, del 10 al 10');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-11-10', 10)), '{2026-11-10,2026-12-10}', 'el día del vencimiento ya es el ciclo que viene');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-11-09', 10)), '{2026-10-10,2026-11-10}', 'la víspera es todavía el ciclo que vence');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-10-27', 1)), '{2026-10-01,2026-11-01}', 'con el día 1, el mes del calendario');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-11-15', 31)), '{2026-10-31,2026-11-30}', 'el 31: en noviembre vence el 30');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2026-12-15', 31)), '{2026-11-30,2026-12-31}', 'en diciembre vence el 31, y ese ciclo arranca el 30 de noviembre');
select is((select array[desde, hasta]::text from private.ciclo_de_la_fecha('2027-02-10', 30)), '{2027-01-30,2027-02-28}', 'el 30 en febrero vence el último día');


-- La forma de lo nuevo -------------------------------------------------------------------------------------

select is(private.problema_de_la_fila(tests.fila(), tests.tesoros()), null, 'una fila con la forma de antes sirve');
select is(private.problema_de_la_fila(tests.fila('{"dia": 10, "pagaSola": true, "pagaSolaDesde": "2026-10-27"}'), tests.tesoros()), null, 'el salario con día de pago y «se paga sola»');
select is(private.problema_de_la_fila(tests.fila('{"dia": 10}'), tests.tesoros()), null, 'con día y sin pagarse solo, también');
select is(private.problema_de_la_fila(tests.fila('{"dia": "10"}'), tests.tesoros()), 'forma-invalida', 'el día es un entero');
select is(private.problema_de_la_fila(tests.fila('{"pagaSola": "si"}'), tests.tesoros()), 'forma-invalida', '«se paga sola» es un booleano');
select is(private.problema_de_la_fila(tests.fila('{"pagaSolaDesde": 20261027}'), tests.tesoros()), 'forma-invalida', 'la fecha es texto');
select is(private.problema_de_la_fila(tests.fila('{}', '{"montoFijo": "5"}'), tests.tesoros()), 'forma-invalida', 'el monto fijo es un entero');
select is(private.problema_de_la_fila(tests.fila('{"dia": 32}'), tests.tesoros()), 'dia-de-pago-invalido', 'el día va del 1 al 31');
select is(private.problema_de_la_fila(tests.fila('{"dia": 0}'), tests.tesoros()), 'dia-de-pago-invalido', 'y no cero');
select is(private.problema_de_la_fila(tests.fila('{"pagaSola": true, "pagaSolaDesde": "2026-10-27"}'), tests.tesoros()), 'paga-sola-sin-dia', '«se paga sola» pide el día');
select is(private.problema_de_la_fila(tests.fila('{"dia": 10, "pagaSola": true}'), tests.tesoros()), 'paga-sola-desde-invalido', 'y desde cuándo');
select is(private.problema_de_la_fila(tests.fila('{"dia": 10, "pagaSola": true, "pagaSolaDesde": "2026-02-30"}'), tests.tesoros()), 'paga-sola-desde-invalido', 'una fecha que existe');
select is(private.problema_de_la_fila(tests.fila('{"pagaSolaDesde": "2026-10-27"}'), tests.tesoros()), 'paga-sola-desde-invalido', 'sin pagarse sola, sin esa fecha');
select is(
  private.problema_de_la_fila(tests.fila('{}', '{}', jsonb_build_array(jsonb_build_object(
    'tesoro', tests.id_de('maun'), 'clase', 'fijos', 'tope', 500, 'renglones', '[{"nombre": "Luz", "monto": 500}]'::jsonb,
    'desde', null, 'modo', 'mes', 'dia', 5, 'pagaSola', true, 'pagaSolaDesde', '2026-10-27'))), tests.tesoros()),
  'paga-sola-en-maun',
  'Maun puede tener día pero nunca se paga sola'
);
select is(
  private.problema_de_la_fila(tests.fila('{}', '{}', jsonb_build_array(jsonb_build_object(
    'tesoro', tests.id_de('maun'), 'clase', 'fijos', 'tope', 500, 'renglones', '[{"nombre": "Luz", "monto": 500, "dia": 5}]'::jsonb,
    'desde', null, 'modo', 'mes', 'dia', 5))), tests.tesoros()),
  'dias-en-los-renglones',
  'con día de pago, los renglones no llevan días'
);
select is(private.problema_de_la_fila(tests.fila('{}', '{"montoFijo": 500000}'), tests.tesoros()), 'diezmo-por-monto', 'el diezmo no va por monto');


-- El plan y el reparto con monto fijo ----------------------------------------------------------------------

select is(
  (select array[p.dias[1]::text, coalesce(p.montos_fijos[1]::text, 'porcentaje')]
   from private.plan_del_reparto('cobrado', tests.fila('{"dia": 10}'), false, false, tests.id_de('diezmo')::uuid, tests.id_de('maun')::uuid) as p),
  array['10', 'porcentaje'],
  'el plan lleva el día de pago del compromiso y el diezmo siempre por porcentaje'
);

select is(
  (select p.dias[1] from private.plan_del_reparto('cobrado', tests.fila('{"dia": 10, "modo": "mes"}') #- '{pasos,0,dia}', false, false, tests.id_de('diezmo')::uuid, tests.id_de('maun')::uuid) as p),
  null::integer,
  'sin día, el ciclo es el mes del calendario'
);

select is(
  (select r.obligaciones from private.repartir_por_la_fila(13000000, 0, '{350,1000}', '{cobrado,ingreso}', '{}', '{}', '{}', '{}', '{}', '{5000000,null}') as r),
  '{5000000,800000}'::bigint[],
  'una obligación de monto fijo se lleva su monto, y la que sigue su porcentaje de lo que queda'
);

select is(
  (select r.obligaciones from private.repartir_por_la_fila(3000000, 0, '{350}', '{cobrado}', '{}', '{}', '{}', '{}', '{}', '{5000000}') as r),
  '{3000000}'::bigint[],
  'una de 50.000 cuando a su lugar llegan 30.000 se lleva 30.000: nunca más de lo que llega'
);

select is(
  (select r.obligaciones from private.repartir_por_la_fila(0, 1000, '{350}', '{cobrado}', '{}', '{}', '{}', '{}', '{}', '{5000000}') as r),
  '{0}'::bigint[],
  'con un ingreso que no es positivo no se aparta nada'
);

select is(
  (select r.obligaciones from private.repartir_por_la_fila(13000000, 0, '{350}', '{cobrado}', '{}', '{}', '{}', '{}', '{}') as r),
  '{455000}'::bigint[],
  'sin montos fijos, todas por porcentaje, como antes'
);

select throws_ok(
  $$ select * from private.repartir_por_la_fila(13000000, 0, '{350}', '{cobrado}', '{}', '{}', '{}', '{}', '{}', '{-1}') $$,
  '22023', null, 'un monto fijo negativo rebota'
);


-- Desde cuándo se paga sola lo pone la base --------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select lives_ok(
  format($$ select public.guardar_la_fila(0, %L) $$, tests.fila('{"dia": 10, "pagaSola": true, "pagaSolaDesde": "2020-01-01"}')),
  'guardar el salario para que se pague solo'
);

select is(
  (select fila #>> '{pasos,0,pagaSolaDesde}' from public.ajustes where household_id = tests.id('household_a')),
  '2026-10-27',
  'desde hoy en el taller, aunque la app mande otra fecha: nunca un vencimiento de antes'
);

select set_config('maun.hoy_en_el_taller', '2026-11-20', true);

select lives_ok(
  format($$ select public.guardar_la_fila(1, %L) $$, tests.fila('{"dia": 10, "pagaSola": true, "pagaSolaDesde": "2026-11-20", "tope": 120000000}')),
  'guardarla otra vez con otro tope'
);

select is(
  (select fila #>> '{pasos,0,pagaSolaDesde}' from public.ajustes where household_id = tests.id('household_a')),
  '2026-10-27',
  'si ya se pagaba solo, conserva desde cuándo'
);

select lives_ok(
  format($$ select public.guardar_la_fila(2, %L) $$, tests.fila('{"dia": 10, "pagaSola": false, "pagaSolaDesde": "2026-10-27"}')),
  'apagar «se paga sola»'
);

select is(
  (select fila #> '{pasos,0,pagaSolaDesde}' from public.ajustes where household_id = tests.id('household_a')),
  'null'::jsonb,
  'sin pagarse sola, sin la fecha'
);

select tests.salir();

select ok(
  not has_function_privilege('authenticated', 'private.con_el_paga_sola_desde(jsonb, jsonb, date)', 'EXECUTE')
    and not has_function_privilege('anon', 'private.ciclo_de_la_fecha(date, integer)', 'EXECUTE'),
  'las gemelas nuevas no las ejecuta nadie de afuera'
);

select * from finish();
