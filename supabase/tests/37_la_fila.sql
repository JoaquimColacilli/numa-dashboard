-- La fila de los tesoros (ADR 0078): guardar_la_fila guarda, suma una revisión y anota cuándo; rechaza
-- con MN006 una revisión vieja y con MN023 una fila que no se puede guardar, con el código en el
-- detalle; y la revisión sube sola cuando cambia en los ajustes algo que cambia el reparto.
--
-- Taller A con sus cuatro tesoros de siempre y tres propios: Gastos fijos, Materiales y uno archivado.
-- Taller B, para un tesoro de otro taller. La fila que se guarda: el sueldo de 100M al Hogar, los
-- gastos fijos de 30M (alquiler 20M y luz 10M), los materiales con 5M por mes y la mitad de lo que
-- sobra a Cocos.

select plan(49);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

select tests.guardar('hogar', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'hogar'));
select tests.guardar('maun', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('diezmo', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'diezmo'));
select tests.guardar('cocos', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'cocos'));
select tests.guardar('hogar_b', (select id from public.tesoros where household_id = tests.id('household_b') and clave = 'hogar'));
select tests.guardar('fijos', 'aaaaaaaa-0000-7000-8000-000000000101');
select tests.guardar('materiales', 'aaaaaaaa-0000-7000-8000-000000000102');
select tests.guardar('archivado', 'aaaaaaaa-0000-7000-8000-000000000103');

-- El código y el detalle de un rechazo: MN023 manda en el detalle qué problema tiene la fila.
create function tests.rechazo_de(p_sql text)
returns text
language plpgsql
as $$
declare
  v_codigo text;
  v_detalle text;
begin
  execute p_sql;
  return null;
exception
  when others then
    get stacked diagnostics v_codigo = returned_sqlstate, v_detalle = pg_exception_detail;
    return v_codigo || ' ' || coalesce(v_detalle, '');
end;
$$;

-- Las piezas de una fila, como las arma la app.
create function tests.paso(p_tesoro uuid, p_clase text, p_tope bigint, p_renglones jsonb default '[]')
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'tesoro', p_tesoro, 'clase', p_clase, 'tope', p_tope, 'renglones', p_renglones, 'desde', null
  )
$$;

create function tests.parte(p_tesoro uuid, p_porcentaje integer)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('tesoro', p_tesoro, 'porcentaje', p_porcentaje)
$$;

create function tests.fila(p_pasos jsonb, p_reparto jsonb default '[]', p_por_trabajo boolean default false)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('pasos', p_pasos, 'reparto', p_reparto, 'sueldoPorTrabajo', p_por_trabajo)
$$;

create function tests.fila_uno()
returns jsonb
language sql
stable
as $$
  select tests.fila(
    jsonb_build_array(
      tests.paso(tests.id('hogar'), 'sueldo', 100000000),
      tests.paso(
        tests.id('fijos'), 'fijos', 30000000,
        '[{"nombre": "Alquiler", "monto": 20000000}, {"nombre": "Luz", "monto": 10000000}]'
      ),
      tests.paso(tests.id('materiales'), 'prioridad', 5000000)
    ),
    jsonb_build_array(tests.parte(tests.id('cocos'), 5000))
  )
$$;

create function tests.revision()
returns integer
language sql
stable
as $$
  select fila_version from public.ajustes where household_id = tests.id('household_a')
$$;

grant execute on all functions in schema tests to anon, authenticated;

select tests.entrar_como(tests.id('a'));

insert into public.tesoros (id, nombre, tinta, icono) values
  ('aaaaaaaa-0000-7000-8000-000000000101', 'Gastos fijos', 'petroleo', 'building-2'),
  ('aaaaaaaa-0000-7000-8000-000000000102', 'Materiales', 'mostaza', 'package'),
  ('aaaaaaaa-0000-7000-8000-000000000103', 'Viejo', 'grana', 'vault');
update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000103';


-- Las columnas y quién las escribe ---------------------------------------------------------------------------

select results_eq(
  $$ select fila, fila_version, fila_guardada_at from public.ajustes $$,
  $$ values (null::jsonb, 0, null::timestamptz) $$,
  'un taller nace sin fila guardada, en la revisión 0: reparte con la fila de siempre'
);

select ok(
  not has_column_privilege('authenticated', 'public.ajustes', 'fila', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.ajustes', 'fila_version', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.ajustes', 'fila_guardada_at', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'fila', 'SELECT'),
  'la fila, su revisión y su fecha se leen pero no se editan con un update'
);

select throws_ok(
  format(
    $$ update public.ajustes set fila_version = 99 where household_id = %L $$,
    tests.id('household_a')
  ),
  '42501', null, 'así la revisión no se pisa a mano'
);

select ok(
  has_function_privilege('authenticated', 'public.guardar_la_fila(integer, jsonb)', 'execute')
    and not has_function_privilege('anon', 'public.guardar_la_fila(integer, jsonb)', 'execute')
    and not has_function_privilege('anon', 'private.guardar_la_fila(integer, jsonb)', 'execute'),
  'la escribe guardar_la_fila, que ejecuta el dueño y no anon'
);

select throws_ok(
  $$ select public.guardar_la_fila(null, '{"pasos": [], "reparto": [], "sueldoPorTrabajo": false}') $$,
  '22004', null, 'guardar la fila necesita la revisión que vio la app'
);


-- Sin fila guardada, la revisión sigue a los ajustes ------------------------------------------------------

update public.ajustes set sueldo_mensual_centavos = 100000000 where household_id = tests.id('household_a');
select is(tests.revision(), 1, 'sin fila guardada, cambiar el sueldo suma una revisión: cambia la fila de siempre');

update public.ajustes set costos_fijos_centavos = 30000000 where household_id = tests.id('household_a');
select is(tests.revision(), 2, 'cambiar los costos fijos también');

select tests.salir();
update public.ajustes set sueldo_tope_mensual = false where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));
select is(tests.revision(), 3, 'y pasar el sueldo a por trabajo también');

update public.ajustes set perdido_con_sueldo = true where household_id = tests.id('household_a');
select is(tests.revision(), 4, 'que un perdido pague sueldo cambia el reparto de un perdido: suma una');

update public.ajustes set perdido_con_diezmo = false where household_id = tests.id('household_a');
select is(tests.revision(), 5, 'y que no pague diezmo, otra');

update public.ajustes set sena_bp = 4000 where household_id = tests.id('household_a');
select is(tests.revision(), 5, 'la seña no cambia cómo se reparte un cobro: no suma');

update public.ajustes set sueldo_mensual_centavos = 100000000 where household_id = tests.id('household_a');
select is(tests.revision(), 5, 'ni un sueldo que se guarda igual');


-- Guardar ------------------------------------------------------------------------------------------------------

select results_eq(
  $$
    select fila = tests.fila_uno(), fila_version, fila_guardada_at is not null
    from public.guardar_la_fila(5, tests.fila_uno())
  $$,
  $$ values (true, 6, true) $$,
  'guardar la fila la deja en los ajustes, suma una revisión y anota cuándo'
);

select set_config(
  'tests.guardada',
  (select fila_guardada_at::text from public.ajustes where household_id = tests.id('household_a')),
  true
);

select throws_ok(
  $$ select public.guardar_la_fila(5, tests.fila(jsonb_build_array(tests.paso(tests.id('hogar'), 'sueldo', 90000000)))) $$,
  'MN006', 'La fila cambió desde que la abriste.',
  'otra fila armada sobre la revisión de antes rebota: la fila cambió desde que la abrió'
);

select is(
  (select fila_version from public.guardar_la_fila(5, tests.fila_uno())),
  6,
  'el reenvío idéntico de la cola, la misma fila con la revisión que ya subió, devuelve los ajustes sin rechazar'
);

select results_eq(
  $$ select fila_version, fila_guardada_at::text from public.ajustes where household_id = tests.id('household_a') $$,
  $$ values (6, current_setting('tests.guardada')) $$,
  'y no suma otra revisión ni cambia la fecha'
);


-- Una fila que no se puede guardar (MN023) ------------------------------------------------------------------

select throws_ok(
  $$ select public.guardar_la_fila(tests.revision(), '{"pasos": []}') $$,
  'MN023', 'La fila no se pudo guardar.',
  'una fila que no se puede guardar rebota con MN023'
);

select is(
  tests.hint_de($$ select public.guardar_la_fila(tests.revision(), '{"pasos": []}') $$),
  'Revisala y probá de nuevo.',
  'y el rechazo dice cómo seguir'
);

select is(
  tests.rechazo_de($$ select public.guardar_la_fila(tests.revision(), '{"pasos": []}') $$),
  'MN023 forma-invalida',
  'una fila sin reparto no se puede leer'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila((select jsonb_agg(tests.paso(gen_random_uuid(), 'prioridad', 1)) from generate_series(1, 13)))
    )
  $$),
  'MN023 demasiados-pasos',
  'entran hasta 12 pasos'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila('[]', (select jsonb_agg(tests.parte(gen_random_uuid(), 1)) from generate_series(1, 9)))
    )
  $$),
  'MN023 demasiadas-partes',
  'y hasta 8 partes en el reparto'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('hogar_b'), 'sueldo', 100))))
  $$),
  'MN023 tesoro-desconocido',
  'un tesoro de otro taller es un tesoro desconocido'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('archivado'), 'prioridad', 100))))
  $$),
  'MN023 tesoro-archivado',
  'uno archivado no entra en la fila'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila(
        jsonb_build_array(tests.paso(tests.id('materiales'), 'prioridad', 100)),
        jsonb_build_array(tests.parte(tests.id('materiales'), 1000))
      )
    )
  $$),
  'MN023 tesoro-repetido',
  'un tesoro va una sola vez, como paso o como parte'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('diezmo'), 'prioridad', 100))))
  $$),
  'MN023 diezmo-en-la-fila',
  'el diezmo no está en la fila: sale siempre primero'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('hogar'), 'prioridad', 100))))
  $$),
  'MN023 hogar-no-es-sueldo',
  'Hogar solo recibe el sueldo'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('materiales'), 'sueldo', 100))))
  $$),
  'MN023 sueldo-no-es-hogar',
  'y el sueldo va siempre a Hogar'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('maun'), 'prioridad', 100))))
  $$),
  'MN023 maun-no-es-fijos',
  'Maun solo puede ser un paso de gastos fijos'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('materiales'), 'prioridad', -1))))
  $$),
  'MN023 tope-fuera-de-rango',
  'un tope no es negativo'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila(jsonb_build_array(tests.paso(tests.id('materiales'), 'prioridad', 100, '[{"nombre": "Luz", "monto": 100}]')))
    )
  $$),
  'MN023 renglones-en-otra-clase',
  'solo los gastos fijos tienen renglones'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('fijos'), 'fijos', 100))))
  $$),
  'MN023 fijos-sin-renglones',
  'y los gastos fijos necesitan al menos uno'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila(jsonb_build_array(tests.paso(tests.id('fijos'), 'fijos', 200, '[{"nombre": "Alquiler", "monto": 100}]')))
    )
  $$),
  'MN023 tope-no-es-la-suma',
  'su tope es la suma de los renglones'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila(jsonb_build_array(tests.paso(tests.id('fijos'), 'fijos', 100, '[{"nombre": "  ", "monto": 100}]')))
    )
  $$),
  'MN023 renglon-sin-nombre',
  'y cada renglón lleva un nombre'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila(jsonb_build_array(jsonb_set(tests.paso(tests.id('materiales'), 'prioridad', 100), '{desde}', '"2026-13"')))
    )
  $$),
  'MN023 desde-invalido',
  'el mes desde el que rige un tope va como AAAA-MM'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila('[]', jsonb_build_array(tests.parte(tests.id('maun'), 1000))))
  $$),
  'MN023 maun-en-el-reparto',
  'Maun no va en el reparto: se queda con lo que sobra'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila('[]', jsonb_build_array(tests.parte(tests.id('hogar'), 1000))))
  $$),
  'MN023 hogar-en-el-reparto',
  'ni Hogar, que recibe el sueldo'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila('[]', jsonb_build_array(tests.parte(tests.id('materiales'), 0))))
  $$),
  'MN023 porcentaje-invalido',
  'cada parte lleva de 0,01% a 100%'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(
      tests.revision(),
      tests.fila('[]', jsonb_build_array(tests.parte(tests.id('materiales'), 6000), tests.parte(tests.id('cocos'), 5000)))
    )
  $$),
  'MN023 reparto-pasa-de-cien',
  'y entre todas no pasan de 100%'
);

select is(
  tests.rechazo_de($$
    select public.guardar_la_fila(tests.revision(), tests.fila(jsonb_build_array(tests.paso(tests.id('hogar'), 'sueldo', 100)), '[]', true))
  $$),
  'MN023 sueldo-por-trabajo',
  'una fila guardada cuenta el sueldo por mes: el sueldo por trabajo es solo de la fila de siempre'
);

select results_eq(
  $$ select fila = tests.fila_uno(), fila_version from public.ajustes where household_id = tests.id('household_a') $$,
  $$ values (true, 6) $$,
  'ninguno de los rechazos tocó la fila guardada ni su revisión'
);


-- Con fila guardada, el sueldo y los fijos son de la fila ----------------------------------------------

update public.ajustes set sueldo_mensual_centavos = 120000000 where household_id = tests.id('household_a');
select is(tests.revision(), 6, 'con fila guardada, cambiar el sueldo de los ajustes no cambia el reparto: no suma');

update public.ajustes set costos_fijos_centavos = 40000000 where household_id = tests.id('household_a');
select is(tests.revision(), 6, 'ni cambiar los costos fijos');

select tests.salir();
update public.ajustes set sueldo_tope_mensual = true where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));
select is(tests.revision(), 6, 'ni el modo del sueldo: la fila guardada lo cuenta por mes');

update public.ajustes set perdido_con_sueldo = false where household_id = tests.id('household_a');
select is(tests.revision(), 7, 'pero si un perdido paga sueldo sigue siendo de los ajustes: suma');

update public.ajustes set perdido_con_diezmo = true where household_id = tests.id('household_a');
select is(tests.revision(), 8, 'y si paga diezmo, también');

update public.ajustes set sena_bp = 5000 where household_id = tests.id('household_a');
select is(tests.revision(), 8, 'la seña sigue sin sumar');


-- Volver a la fila de siempre --------------------------------------------------------------------------------

select results_eq(
  $$
    select fila is null, fila_version, fila_guardada_at > current_setting('tests.guardada')::timestamptz
    from public.guardar_la_fila(8, null)
  $$,
  $$ values (true, 9, true) $$,
  'guardar la fila en null vuelve a la fila de siempre, con su revisión y su fecha'
);

update public.ajustes set sueldo_mensual_centavos = 130000000 where household_id = tests.id('household_a');
select is(tests.revision(), 10, 'y ahí el sueldo de los ajustes vuelve a armar la fila: suma');

select tests.salir();

select results_eq(
  format($$ select fila, fila_version from public.ajustes where household_id = %L $$, tests.id('household_b')),
  $$ values (null::jsonb, 0) $$,
  'nada de esto tocó la fila de B'
);

select * from finish();
