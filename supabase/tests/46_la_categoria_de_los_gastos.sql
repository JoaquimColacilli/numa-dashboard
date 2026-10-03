-- La categoría de los gastos (ADR 0084): una columna nullable con un check de cinco valores, con grant
-- de alta y de edición, que guardar_proyecto escribe solo si el pedido trae la clave. Un bundle viejo no
-- la manda y no la borra; una vacía queda null, para que un '' no se vuelva un rechazo definitivo.

select plan(21);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));

create function tests.el_trabajo(p_version integer)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', 'aaaaaaaa-0000-7000-8000-000000000002', 'version', p_version,
    'cliente_id', 'aaaaaaaa-0000-7000-8000-000000000001', 'titulo', 'Placard',
    'estado', 'en_curso', 'comprobante', 'sin_comprobante', 'presupuesto_centavos', 90000000
  )
$$;

create function tests.version_del_trabajo()
returns integer
language sql
as $$
  select version from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000002'
$$;

create function tests.gasto(p_id text, p_monto bigint, p_categoria jsonb default null)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id, 'fecha', '2026-10-01', 'descripcion', 'Placas', 'monto_centavos', p_monto,
    'borrado', false
  ) || case when p_categoria is null then '{}'::jsonb else jsonb_build_object('categoria', p_categoria) end
$$;

create function tests.categoria_de(p_id uuid)
returns text
language sql
as $$
  select coalesce(categoria, 'null') from public.gastos where id = p_id
$$;

grant execute on all functions in schema tests to authenticated;

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía');


-- La columna -------------------------------------------------------------------------------------------

select col_type_is('public', 'gastos', 'categoria', 'text', 'gastos.categoria es texto');
select col_is_null('public', 'gastos', 'categoria', 'y puede quedar en null: «sin categoría»');

select ok(
  col_description('public.gastos'::regclass, (
    select attnum from pg_attribute where attrelid = 'public.gastos'::regclass and attname = 'categoria'
  )) like '%Null es «sin categoría»%',
  'su comentario dice qué es null'
);

select ok(
  has_column_privilege('authenticated', 'public.gastos', 'categoria', 'insert')
    and has_column_privilege('authenticated', 'public.gastos', 'categoria', 'update'),
  'authenticated la escribe al dar de alta y al editar un gasto'
);

select ok(
  not has_column_privilege('anon', 'public.gastos', 'categoria', 'select')
    and not has_column_privilege('anon', 'public.gastos', 'categoria', 'insert'),
  'anon no la ve ni la escribe'
);


-- El check ---------------------------------------------------------------------------------------------

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, jsonb_build_array(), %L) $$,
    tests.el_trabajo(null),
    jsonb_build_array(
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000011', 100, '"madera"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000012', 100, '"herrajes"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000013', 100, '"flete"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000014', 100, '"ayudante"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000015', 100, '"otro"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000016', 100, 'null')
    )
  ),
  'guardar_proyecto acepta las cinco categorías y null'
);

select is(
  (
    select array_agg(coalesce(categoria, 'null') order by id)
    from public.gastos where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000002'
  ),
  array['madera', 'herrajes', 'flete', 'ayudante', 'otro', 'null'],
  'y quedan guardadas como llegaron'
);

select throws_ok(
  $$
    insert into public.gastos (proyecto_id, fecha, monto_centavos, categoria)
    values ('aaaaaaaa-0000-7000-8000-000000000002', '2026-10-01', 100, 'materiales')
  $$,
  '23514',
  null,
  'otra categoría la rechaza el check'
);

select throws_ok(
  $$
    insert into public.gastos (proyecto_id, fecha, monto_centavos, categoria)
    values ('aaaaaaaa-0000-7000-8000-000000000002', '2026-10-01', 100, 'Madera')
  $$,
  '23514',
  null,
  'también con mayúscula: se guarda la clave, no la etiqueta'
);

select lives_ok(
  $$
    insert into public.gastos (id, proyecto_id, fecha, monto_centavos, categoria)
    values ('aaaaaaaa-0000-7000-8000-000000000017', 'aaaaaaaa-0000-7000-8000-000000000002', '2026-10-01', 100, null)
  $$,
  'un gasto sin categoría pasa'
);


-- guardar_proyecto con la clave y sin ella ---------------------------------------------------------------

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, jsonb_build_array(), %L) $$,
    tests.el_trabajo(tests.version_del_trabajo()),
    jsonb_build_array(
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000021', 2000, '"madera"'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000022', 3000, '""'),
      tests.gasto('aaaaaaaa-0000-7000-8000-000000000023', 4000, '"  flete "')
    )
  ),
  'un gasto nuevo con su categoría se guarda'
);

select is(tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000021'), 'madera', 'con la clave, la categoría que trae');
select is(tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000022'), 'null', 'una vacía queda null, no rebota contra el check');
select is(tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000023'), 'flete', 'y una con blancos en las puntas se recorta');

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, jsonb_build_array(), %L) $$,
    tests.el_trabajo(tests.version_del_trabajo()),
    jsonb_build_array(tests.gasto('aaaaaaaa-0000-7000-8000-000000000021', 2500))
  ),
  'una app sin actualizar edita el monto de un gasto sin mandar la clave'
);

select is(
  tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000021'),
  'madera',
  'y la categoría que eligió la app nueva queda: sin la clave no se toca'
);

select is(
  (select monto_centavos from public.gastos where id = 'aaaaaaaa-0000-7000-8000-000000000021'),
  2500::bigint,
  'mientras el monto sí cambia'
);

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, jsonb_build_array(), %L) $$,
    tests.el_trabajo(tests.version_del_trabajo()),
    jsonb_build_array(tests.gasto('aaaaaaaa-0000-7000-8000-000000000024', 5000))
  ),
  'un gasto nuevo de una app sin actualizar se guarda'
);

select is(tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000024'), 'null', 'sin categoría');

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L, jsonb_build_array(), %L) $$,
    tests.el_trabajo(tests.version_del_trabajo()),
    jsonb_build_array(tests.gasto('aaaaaaaa-0000-7000-8000-000000000021', 2500, 'null'))
  ),
  'con la clave en null, la app nueva le saca la categoría'
);

select is(tests.categoria_de('aaaaaaaa-0000-7000-8000-000000000021'), 'null', 'y queda sin categoría');

select * from finish();
