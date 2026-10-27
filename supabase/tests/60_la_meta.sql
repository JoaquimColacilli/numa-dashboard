-- La meta: un tesoro con objetivo suma una fecha estimada opcional, y Cocos puede tener la suya en
-- tesoros como cualquier otro. Mientras no la tenga, vale la de ajustes.

select plan(8);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));
select private.sembrar_cocos(tests.id('household_a'));

select tests.entrar_como(tests.id('ana'));

insert into public.tesoros (id, nombre, tinta, icono, meta_centavos)
values ('aaaaaaaa-0000-7000-8000-00000000a001', 'Máquina', 'grana', 'drill', 2000000000);

select lives_ok(
  $$ update public.tesoros set meta_fecha = '2027-03-01' where id = 'aaaaaaaa-0000-7000-8000-00000000a001' $$,
  'una meta lleva la fecha para cuándo quiere llegar'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono, meta_fecha) values ('Sin meta', 'grana', 'vault', '2027-03-01') $$,
  '23514', null, 'sin meta no hay fecha'
);

select lives_ok(
  format($$ update public.tesoros set meta_centavos = 7000000000, meta_fecha = '2028-01-01' where household_id = %L and clave = 'cocos' $$, tests.id('household_a')),
  'Cocos tiene su meta en tesoros, como los del dueño'
);

select throws_ok(
  format($$ update public.tesoros set rinde_anual_bp = 2600 where household_id = %L and clave = 'cocos' $$, tests.id('household_a')),
  '23514', null, 'pero no un rinde: eso dejó de calcularse'
);

select throws_ok(
  format($$ update public.tesoros set meta_centavos = 100 where household_id = %L and clave = 'maun' $$, tests.id('household_a')),
  '23514', null, 'Maun, Hogar y el diezmo no tienen meta'
);

select ok(
  has_column_privilege('authenticated', 'public.tesoros', 'meta_fecha', 'UPDATE')
    and has_column_privilege('authenticated', 'public.tesoros', 'meta_fecha', 'INSERT'),
  'el dueño escribe la fecha de la meta'
);

-- Con una fila que reparte hasta la meta de Cocos: la de ajustes en null y la de tesoros puesta sirve.
update public.ajustes set meta_cocos_centavos = 0 where household_id = tests.id('household_a');

select lives_ok(
  format($$ select public.guardar_la_fila(0, %L) $$, jsonb_build_object(
    'obligaciones', jsonb_build_array(jsonb_build_object('tesoro', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'diezmo'), 'porcentaje', 1000, 'base', 'ingreso')),
    'pasos', '[]'::jsonb,
    'reparto', jsonb_build_array(jsonb_build_object('tesoro', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'cocos'), 'porcentaje', 7500, 'hastaLaMeta', true)),
    'superavit', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'),
    'sueldoPorTrabajo', false
  )),
  'una parte de Cocos hasta su meta se guarda con la meta de tesoros'
);

select is(
  (select fila #>> '{reparto,0,hastaLaMeta}' from public.ajustes where household_id = tests.id('household_a')),
  'true',
  'y queda guardada hasta la meta'
);

select * from finish();
