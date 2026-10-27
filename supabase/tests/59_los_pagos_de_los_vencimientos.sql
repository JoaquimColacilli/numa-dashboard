-- El pago de los vencimientos de los compromisos que se pagan solos (los tipos de tesoro de Eliseo):
-- el día de pago la base paga el tope menos lo ya pagado para ese vencimiento, con el saldo de lo
-- fechado antes del día; si no alcanza, Maun pone la diferencia como deuda interna; si sobra, vuelve a
-- Maun; el tesoro queda en cero. Una vez por tesoro y vencimiento, poniéndose al día con los que se
-- perdió, nunca antes de que se guardó con «Se paga sola», y un gasto que llega tarde cuenta para el
-- vencimiento siguiente.
--
-- El salario de Ana es de $ 1.000.000 y vence el 10. Los importes van en centavos.

select plan(29);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.id_de(p_clave text)
returns uuid
language sql
as $$
  select t.id from public.tesoros t where t.household_id = tests.id('household_a') and t.clave::text = p_clave
$$;

create function tests.fila(p_salario jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'obligaciones', jsonb_build_array(jsonb_build_object('tesoro', tests.id_de('diezmo'), 'porcentaje', 1000, 'base', 'ingreso')),
    'pasos', jsonb_build_array(
      jsonb_build_object('tesoro', tests.id_de('hogar'), 'clase', 'sueldo', 'tope', 100000000, 'renglones', '[]'::jsonb, 'desde', null, 'modo', 'mes') || p_salario
    ),
    'reparto', '[]'::jsonb,
    'superavit', tests.id_de('maun'),
    'sueldoPorTrabajo', false
  )
$$;

create function tests.saldo(p_clave text)
returns bigint
language sql
as $$
  select coalesce(sum(l.monto_centavos), 0)::bigint
  from public.libro_mayor l
  where l.household_id = tests.id('household_a') and l.tesoro_id = tests.id_de(p_clave) and not l.ya_en_la_apertura
$$;

create function tests.el_pago(p_vencimiento date)
returns bigint[]
language sql
as $$
  select array[tope_centavos, pagado_antes_centavos, saldo_centavos, a_pagar_centavos, puso_maun_centavos, vuelve_a_maun_centavos]
  from public.pagos_de_vencimientos
  where household_id = tests.id('household_a') and tesoro_id = tests.id_de('hogar') and vencimiento = p_vencimiento
$$;

create function tests.movimiento(p_fecha date, p_tipo text, p_desde text, p_hacia text, p_monto bigint, p_vencimiento date default null)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos, categoria, vencimiento)
  values (v_id, p_fecha, p_tipo::public.tipo_movimiento, tests.id_de(p_desde), tests.id_de(p_hacia), p_monto, '', p_vencimiento);
  return v_id;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

select set_config('maun.hoy_en_el_taller', '2026-10-27', true);
select tests.entrar_como(tests.id('ana'));


-- Sin «Se paga sola» no se mueve nada ------------------------------------------------------------------------

select public.guardar_la_fila(0, tests.fila('{"dia": 10}'));
select tests.movimiento('2026-10-27', 'ingreso', null, 'hogar', 60000000);

select tests.salir();
select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2026-11-10'), 0, 'con día y sin pagarse solo, el día de pago no se paga nada');
select tests.entrar_como(tests.id('ana'));


-- 600.000 juntados y un adelanto de 300.000 --------------------------------------------------------------------

select public.guardar_la_fila(1, tests.fila('{"dia": 10, "pagaSola": true}'));

select is(
  (select fila #>> '{pasos,0,pagaSolaDesde}' from public.ajustes where household_id = tests.id('household_a')),
  '2026-10-27',
  'se paga solo desde el día en que se guardó así'
);

select set_config('maun.hoy_en_el_taller', '2026-11-05', true);
select set_config('tests.adelanto', tests.movimiento('2026-11-05', 'gasto', 'hogar', null, 30000000)::text, true);

select is(
  (select vencimiento from public.movimientos where id = current_setting('tests.adelanto')::uuid),
  null::date,
  'un adelanto del ciclo cuenta para el vencimiento de su ciclo sin anotarlo'
);

select tests.salir();

select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2026-11-09'), 0, 'la víspera no se paga');
select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2026-11-10'), 1, 'el día 10 se paga el vencimiento');
select is(
  tests.el_pago('2026-11-10'),
  array[100000000, 30000000, 30000000, 70000000, 40000000, 0]::bigint[],
  'se pagan 700.000 (el tope menos el adelanto), con 300.000 de saldo: Maun pone 400.000'
);
select is(tests.saldo('hogar'), 0::bigint, 'y el tesoro queda en cero');
select is(
  (select array_agg(array[concepto, categoria, monto_centavos::text, fecha::text] order by concepto, monto_centavos)
   from public.libro_mayor where household_id = tests.id('household_a') and origen = 'vencimiento'),
  array[
    array['deuda_interna', 'Deuda interna', '-40000000', '2026-11-10'],
    array['deuda_interna', 'Deuda interna', '40000000', '2026-11-10'],
    array['vencimiento', 'Vencimiento', '-70000000', '2026-11-10']
  ],
  'en el libro: la deuda interna de Maun al salario y el pago, todo con la fecha del vencimiento'
);
select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2026-11-10'), 0, 'corrida otra vez el mismo día, no hace nada');
select is((select count(*)::integer from public.pagos_de_vencimientos where household_id = tests.id('household_a')), 1, 'un solo pago por vencimiento');


-- Un gasto que llega tarde cuenta para el vencimiento siguiente ---------------------------------------------------

select tests.entrar_como(tests.id('ana'));
select set_config('maun.hoy_en_el_taller', '2026-11-12', true);
select set_config('tests.tarde', tests.movimiento('2026-11-08', 'gasto', 'hogar', null, 5000000)::text, true);

select is(
  (select vencimiento from public.movimientos where id = current_setting('tests.tarde')::uuid),
  '2026-12-10'::date,
  'un gasto del 8 que llega cuando el 10 ya se pagó cuenta para el vencimiento siguiente: nada se paga dos veces'
);

select set_config('tests.registrado', tests.movimiento('2026-11-12', 'gasto', 'hogar', null, 1000000, '2026-11-10')::text, true);

select is(
  (select vencimiento from public.movimientos where id = current_setting('tests.registrado')::uuid),
  '2026-12-10'::date,
  'tampoco uno que se registra para un vencimiento ya pagado'
);

update public.movimientos set fecha = '2026-11-12' where id = current_setting('tests.adelanto')::uuid;

select is(
  (select vencimiento from public.movimientos where id = current_setting('tests.adelanto')::uuid),
  '2026-11-10'::date,
  'cambiarle el día a un adelanto que ya contó para un vencimiento pagado lo deja en ese vencimiento'
);

update public.movimientos set fecha = '2026-11-05' where id = current_setting('tests.adelanto')::uuid;


-- 1.000.000 juntados, sin adelanto; y ponerse al día ----------------------------------------------------------

select tests.movimiento('2026-11-15', 'ingreso', null, 'hogar', 94000000);

select tests.salir();

select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2027-01-15'), 2, 'se pone al día con los dos que se perdió');
select is(
  tests.el_pago('2026-12-10'),
  array[100000000, 6000000, 88000000, 94000000, 6000000, 0]::bigint[],
  'el 10 de diciembre cuenta lo que llegó tarde: paga 940.000 y Maun pone lo que faltaba'
);
select is(
  tests.el_pago('2027-01-10'),
  array[100000000, 0, 0, 100000000, 100000000, 0]::bigint[],
  'el de enero arranca con el tesoro en cero: Maun pone el millón entero'
);
select is(tests.saldo('hogar'), 0::bigint, 'el tesoro sigue en cero');


-- 1.100.000 de saldo: vuelven 100.000 a Maun ----------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));
select set_config('maun.hoy_en_el_taller', '2027-01-20', true);
select tests.movimiento('2027-01-20', 'transferencia', 'maun', 'hogar', 110000000);
select tests.salir();

select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2027-02-10'), 1, 'el 10 de febrero');
select is(
  tests.el_pago('2027-02-10'),
  array[100000000, 0, 110000000, 100000000, 0, 10000000]::bigint[],
  'con 1.100.000 se paga 1.000.000 y vuelven 100.000 a Maun'
);
select is(tests.saldo('hogar'), 0::bigint, 'y el tesoro queda en cero');
select ok(
  exists (select 1 from public.libro_mayor where household_id = tests.id('household_a') and origen = 'vencimiento' and concepto = 'sobrante' and tesoro_id = tests.id_de('maun') and monto_centavos = 10000000),
  'lo que sobra vuelve a Maun en el libro'
);


-- Nunca antes de que se guardó así ------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));
select set_config('maun.hoy_en_el_taller', '2027-02-10', true);
select public.guardar_la_fila(2, tests.fila('{"dia": 10, "pagaSola": false}'));
select public.guardar_la_fila(3, tests.fila('{"dia": 10, "pagaSola": true}'));
select tests.salir();

select is(
  (select fila #>> '{pasos,0,pagaSolaDesde}' from public.ajustes where household_id = tests.id('household_a')),
  '2027-02-10',
  'apagado y vuelto a prender, se paga solo desde el día en que se volvió a guardar'
);
select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2027-03-09'), 0, 'guardado el mismo día 10, ese vencimiento no se paga solo');
select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2027-03-10'), 1, 'el primero es el del mes que viene');


-- Lo que puede el dueño --------------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select throws_ok(
  $$ update public.pagos_de_vencimientos set a_pagar_centavos = 1 where household_id = tests.id('household_a') $$,
  '42501', null, 'el dueño no cambia la cuenta de un pago'
);

select lives_ok(
  $$ update public.pagos_de_vencimientos set deleted_at = now() where vencimiento = '2027-03-10' $$,
  'pero puede deshacerlo'
);

select tests.salir();

select is(private.pagar_los_vencimientos_del_taller(tests.id('household_a'), '2027-03-10'), 0, 'y un pago deshecho no se vuelve a pagar solo');

select ok(
  not has_table_privilege('anon', 'public.pagos_de_vencimientos', 'SELECT, INSERT, UPDATE, DELETE')
    and not has_function_privilege('authenticated', 'private.pagar_los_vencimientos_del_taller(uuid, date)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.pagar_los_vencimientos()', 'EXECUTE'),
  'anon no toca la tabla y nadie de afuera corre el pago'
);

select is(
  (select schedule from cron.job where jobname = 'pagar-los-vencimientos'),
  '7 * * * *',
  'el trabajo de pg_cron corre cada hora'
);

select * from finish();
