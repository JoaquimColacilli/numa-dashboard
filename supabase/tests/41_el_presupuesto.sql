-- El presupuesto adentro de la ficha (ADR 0080): los datos del taller que lleva el presupuesto, con su
-- grant y sus checks.

select plan(4);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));


-- Los datos del taller ------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select ok(
  has_column_privilege('authenticated', 'public.ajustes', 'taller_titular', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_cuit', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_condicion_fiscal', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_domicilio', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_telefono', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_email', 'UPDATE'),
  'los datos del taller para el presupuesto tienen grant de update, como el resto de los ajustes'
);

select lives_ok(
  format(
    $$ update public.ajustes set taller_titular = 'Ana Gutiérrez', taller_cuit = '27-30123456-4',
         taller_condicion_fiscal = 'monotributo', taller_domicilio = 'Avenida Rivadavia 7000, CABA',
         taller_telefono = '11 4444-0000', taller_email = 'ana@ejemplo.com'
       where household_id = %L $$,
    tests.id('household_a')
  ),
  'el dueño los guarda con un update de sus columnas, como el resto de los ajustes'
);

select throws_ok(
  format($$ update public.ajustes set taller_cuit = '27301234564' where household_id = %L $$, tests.id('household_a')),
  '23514',
  null,
  'el CUIT del taller va con guiones, como el de la cuenta'
);

select throws_ok(
  format($$ update public.ajustes set taller_condicion_fiscal = 'consumidor_final' where household_id = %L $$, tests.id('household_a')),
  '23514',
  null,
  'y la condición fiscal es una de las tres que puede tener quien presupuesta'
);


select * from finish();
