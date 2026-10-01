-- El presupuesto adentro de la ficha (ADR 0080): los datos del taller que lleva el presupuesto y la
-- plantilla con sus textos de siempre, que se guarda con su revisión.

select plan(14);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

-- El rechazo de una llamada como texto: código, motivo y mensaje. 'ok' si no rechazó.
create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_estado text;
  v_detalle text;
  v_mensaje text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics
      v_estado = returned_sqlstate,
      v_detalle = pg_exception_detail,
      v_mensaje = message_text;
    return v_estado || ' ' || coalesce(nullif(v_detalle, ''), '-') || ': ' || v_mensaje;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Una plantilla chica que se puede guardar: una cláusula, una forma de pago y la garantía.
select set_config('tests.plantilla', $${
  "forma": 1, "plazoDeFabricacion": 30, "modificacionesIncluidas": 2,
  "valorDeUnaModificacion": 5000000, "garantiaMeses": 6,
  "incluye": [{"id": "incluye-visita", "titulo": null, "texto": "Visita a domicilio para medición y definición de detalles.", "tildadaPorDefecto": true}],
  "aTenerEnCuenta": [], "avisos": [], "condiciones": [],
  "formasDePago": [{"id": "sena-y-entrega", "nombre": "Seña y contra entrega", "texto": "Seña del {sena} para confirmar el trabajo y el saldo contra entrega."}],
  "garantia": "Garantía de {meses} desde la entrega e instalación."
}$$, true);


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


-- La plantilla del taller ----------------------------------------------------------------------------------

select ok(
  not has_column_privilege('authenticated', 'public.ajustes', 'plantilla_del_presupuesto', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.ajustes', 'plantilla_del_presupuesto_version', 'UPDATE'),
  'la plantilla no tiene grant de update: la escribe solo guardar_la_plantilla_del_presupuesto'
);

select ok(
  not (
    select p.prosecdef from pg_proc p
    where p.oid = 'public.guardar_la_plantilla_del_presupuesto(integer, jsonb)'::regprocedure
  )
  and (
    select p.prosecdef from pg_proc p
    where p.oid = 'private.guardar_la_plantilla_del_presupuesto(integer, jsonb)'::regprocedure
  ),
  'la de public corre con los permisos de quien llama y su privada, elevada: el molde de guardar_la_fila'
);

select is(
  (public.guardar_la_plantilla_del_presupuesto(0, current_setting('tests.plantilla')::jsonb)).plantilla_del_presupuesto_version,
  1,
  'guardar los textos de siempre suma una revisión'
);

select is(
  (select plantilla_del_presupuesto from public.ajustes where household_id = tests.id('household_a')),
  current_setting('tests.plantilla')::jsonb,
  'y quedan guardados tal cual'
);

select is(
  (public.guardar_la_plantilla_del_presupuesto(0, current_setting('tests.plantilla')::jsonb)).plantilla_del_presupuesto_version,
  1,
  'el reenvío idéntico devuelve los ajustes como quedaron'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_plantilla_del_presupuesto(0, %L) $$,
    current_setting('tests.plantilla')::jsonb || '{"plazoDeFabricacion": 45}'
  )),
  'MN030 revisión vista 0, revisión actual 1: Los textos del presupuesto se cambiaron en otro aparato.',
  'con una revisión vieja rebota: otro aparato los cambió'
);

select is(
  tests.rechazo($$ select public.guardar_la_plantilla_del_presupuesto(1, '{"forma": 1}') $$),
  'MN031 forma-invalida: Los textos del presupuesto no se pudieron guardar.',
  'una plantilla que no tiene la forma no se guarda'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_plantilla_del_presupuesto(1, %L) $$,
    current_setting('tests.plantilla')::jsonb || '{"formasDePago": []}'
  )),
  'MN031 sin-formas-de-pago: Los textos del presupuesto no se pudieron guardar.',
  'ni una sin ninguna forma de pago: la base saca la misma cuenta que problemaDeLaPlantilla'
);

select is(
  (
    select array[(a.plantilla_del_presupuesto_version)::text, (a.plantilla_del_presupuesto is null)::text]
    from public.guardar_la_plantilla_del_presupuesto(1, null) as a
  ),
  array['2', 'true'],
  'con null vuelve a los textos de siempre, y también suma una revisión'
);

select throws_ok(
  format(
    $$ update public.ajustes set plantilla_del_presupuesto = '{}' where household_id = %L $$,
    tests.id('household_a')
  ),
  '42501',
  null,
  'la plantilla no se escribe con un update suelto'
);


select * from finish();
