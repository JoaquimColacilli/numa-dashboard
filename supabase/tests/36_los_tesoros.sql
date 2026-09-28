-- Los tesoros (ADR 0078): la tabla, sus checks, sus grants, la RLS, los cuatro de siempre y la guarda
-- de archivar, que no deja archivar un tesoro que la plata todavía necesita (MN024).
--
-- Taller A con sus tesoros propios y taller B con uno, para la RLS. El cobro por la fila que se reabre
-- (los cobros se prueban en 38_el_cobro_por_la_fila.sql): 10M cobrados sin gastos, diezmo 1M, quedan
-- 9M; Herramientas se llena con su tope de 1M, sobran 8M y el 10% de Inmuebles es 800.000.

select plan(44);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

-- El código y el detalle de un rechazo: MN024 dice en el detalle por qué no se archiva.
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

grant execute on function tests.rechazo_de(text) to authenticated;


-- La tabla -----------------------------------------------------------------------------------------------

select results_eq(
  $$
    select a.attname::text collate "default", a.atttypid::regtype, a.attnotnull
    from pg_attribute a
    where a.attrelid = 'public.tesoros'::regclass and a.attnum > 0 and not a.attisdropped
    order by a.attnum
  $$,
  $$
    values
      ('id', 'uuid'::regtype, true),
      ('household_id', 'uuid'::regtype, true),
      ('clave', 'public.tesoro'::regtype, false),
      ('nombre', 'text'::regtype, true),
      ('descripcion', 'text'::regtype, true),
      ('tinta', 'text'::regtype, true),
      ('icono', 'text'::regtype, true),
      ('meta_centavos', 'bigint'::regtype, false),
      ('rinde_anual_bp', 'integer'::regtype, false),
      ('orden', 'integer'::regtype, true),
      ('archivado_at', 'timestamptz'::regtype, false),
      ('created_at', 'timestamptz'::regtype, true),
      ('updated_at', 'timestamptz'::regtype, true),
      ('deleted_at', 'timestamptz'::regtype, false),
      ('version', 'integer'::regtype, true)
  $$,
  'la tabla tiene sus columnas, con sus tipos y las que no pueden ir vacías'
);

select ok(
  (
    select indexdef like 'CREATE UNIQUE INDEX %(household_id, clave) WHERE (clave IS NOT NULL)'
    from pg_indexes
    where schemaname = 'public' and indexname = 'tesoros_una_clave_por_taller'
  ),
  'una sola fila por clave en cada taller, y ninguna regla para los del dueño, que no tienen clave'
);

select set_eq(
  $$
    select a.attname::text
    from pg_attribute a
    where a.attrelid = 'public.tesoros'::regclass and a.attnum > 0 and not a.attisdropped
      and has_column_privilege('authenticated', a.attrelid, a.attnum, 'INSERT')
  $$,
  array['id', 'nombre', 'descripcion', 'tinta', 'icono', 'meta_centavos', 'rinde_anual_bp', 'orden', 'archivado_at'],
  'la app da de alta todo lo del tesoro salvo el taller, la clave y la metadata'
);

select set_eq(
  $$
    select a.attname::text
    from pg_attribute a
    where a.attrelid = 'public.tesoros'::regclass and a.attnum > 0 and not a.attisdropped
      and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE')
  $$,
  array['id', 'nombre', 'descripcion', 'tinta', 'icono', 'meta_centavos', 'rinde_anual_bp', 'orden', 'archivado_at'],
  'y edita lo mismo, porque el alta es un upsert'
);

select ok(
  has_table_privilege('authenticated', 'public.tesoros', 'SELECT')
    and not has_table_privilege('authenticated', 'public.tesoros', 'DELETE'),
  'la lee entera y no la borra: un tesoro se archiva'
);

select set_eq(
  $$ select policyname::text from pg_policies where schemaname = 'public' and tablename = 'tesoros' $$,
  array['tesoros_lectura', 'tesoros_alta', 'tesoros_edicion'],
  'tres políticas, lectura, alta y edición, y ninguna de borrado'
);


-- Los cuatro de siempre ------------------------------------------------------------------------------------

select results_eq(
  format(
    $$ select clave::text from public.tesoros where household_id = %L order by orden $$,
    tests.id('household_a')
  ),
  $$ values ('hogar'), ('maun'), ('diezmo'), ('cocos') $$,
  'el taller nace con sus cuatro tesoros de siempre'
);

select throws_ok(
  format(
    $$ insert into public.tesoros (household_id, clave, nombre, tinta, icono) values (%L, 'hogar', 'Otro hogar', 'hogar', 'house') $$,
    tests.id('household_a')
  ),
  '23505', null, 'y no puede tener dos con la misma clave, ni siquiera por el dueño de la base'
);


-- Un tesoro del dueño --------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

insert into public.tesoros (id, nombre, tinta, icono)
  values ('aaaaaaaa-0000-7000-8000-000000000101', 'Herramientas', 'grana', 'wrench');

select results_eq(
  $$
    select household_id, clave::text, descripcion, orden, archivado_at, version
    from public.tesoros where id = 'aaaaaaaa-0000-7000-8000-000000000101'
  $$,
  format($$ values (%L::uuid, null::text, '', 0, null::timestamptz, 1) $$, tests.id('household_a')),
  'un tesoro nuevo es del taller de la sesión, sin clave, sin descripción, primero en el orden y sin archivar'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono) values ('   ', 'grana', 'vault') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_nombre_valido"',
  'un tesoro necesita un nombre: los blancos no cuentan'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono) values (repeat('x', 25), 'grana', 'vault') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_nombre_valido"',
  'y lleva hasta 24 letras'
);

select lives_ok(
  $$ insert into public.tesoros (id, nombre, tinta, icono) values ('aaaaaaaa-0000-7000-8000-000000000102', '  ' || repeat('x', 24) || '  ', 'grana', 'vault') $$,
  'sin contar los blancos de los bordes'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, descripcion, tinta, icono) values ('Viajes', repeat('x', 81), 'grana', 'plane') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_descripcion_largo"',
  'para qué es va en hasta 80 letras'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono) values ('Viajes', 'azul', 'plane') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_tinta_valida"',
  'la tinta es una de las ocho'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono) values ('Viajes', 'petroleo', 'Plane!') $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_icono_valido"',
  'el ícono es un nombre de lucide: minúsculas, números y guiones'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono, meta_centavos) values ('Viajes', 'petroleo', 'plane', -1) $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_meta_no_negativa"',
  'la meta no es negativa'
);

select throws_ok(
  $$ insert into public.tesoros (nombre, tinta, icono, rinde_anual_bp) values ('Viajes', 'petroleo', 'plane', 100001) $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_rinde_valido"',
  'y el rinde va de 0 a 1000%'
);

select lives_ok(
  $$ update public.tesoros set meta_centavos = 300000000, rinde_anual_bp = 3500 where id = 'aaaaaaaa-0000-7000-8000-000000000101' $$,
  'un tesoro del dueño lleva su meta y su rinde'
);

select throws_ok(
  $$ update public.tesoros set meta_centavos = 100 where clave = 'cocos' $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_meta_solo_de_los_propios"',
  'los de siempre no: la meta de Cocos sigue en ajustes, donde la leen las apps sin actualizar'
);

select throws_ok(
  $$ insert into public.tesoros (clave, nombre, tinta, icono) values ('cocos', 'Otro Cocos', 'cocos', 'piggy-bank') $$,
  '42501', null, 'la app no escribe la clave: es del sistema'
);

select throws_ok(
  $$ update public.tesoros set clave = 'maun' where id = 'aaaaaaaa-0000-7000-8000-000000000101' $$,
  '42501', null, 'ni se la cambia a un tesoro'
);

select throws_ok(
  $$ delete from public.tesoros where id = 'aaaaaaaa-0000-7000-8000-000000000101' $$,
  '42501', null, 'y no borra un tesoro'
);

select throws_ok(
  $$ update public.tesoros set archivado_at = now() where clave = 'hogar' $$,
  '23514', 'new row for relation "tesoros" violates check constraint "tesoros_los_de_siempre_no_se_archivan"',
  'Hogar, Maun, Diezmo y Cocos no se archivan: son el taller'
);


-- Cada taller ve y toca lo suyo --------------------------------------------------------------------------

select tests.entrar_como(tests.id('b'));

insert into public.tesoros (id, nombre, tinta, icono)
  values ('bbbbbbbb-0000-7000-8000-000000000101', 'Herramientas de B', 'ciruela', 'wrench');

select is(
  (select count(*)::int from public.tesoros),
  5,
  'B ve sus cuatro de siempre y el suyo'
);

select is_empty(
  format($$ select 1 from public.tesoros where household_id = %L $$, tests.id('household_a')),
  'y ninguno de A'
);

with u as (
  update public.tesoros set nombre = 'Intrusión' where id = 'aaaaaaaa-0000-7000-8000-000000000101' returning 1
)
select is(count(*), 0::bigint, 'B no renombra un tesoro de A: la RLS lo vuelve invisible') from u;

select tests.entrar_como(tests.id('a'));

with u as (
  update public.tesoros set archivado_at = now() where id = 'bbbbbbbb-0000-7000-8000-000000000101' returning 1
)
select is(count(*), 0::bigint, 'ni A archiva el de B') from u;


-- No se archiva lo que está en la fila (MN024) -------------------------------------------------------------

insert into public.tesoros (id, nombre, tinta, icono)
  values ('aaaaaaaa-0000-7000-8000-000000000103', 'Inmuebles', 'petroleo', 'building-2');

-- Herramientas es un ahorro fijo con 1M por mes e Inmuebles lleva el 10% de lo que sobra. El diezmo
-- es la única obligación y lo que sobra queda en Maun. Las obligaciones y el superávit que no se
-- archivan están en 39_los_tipos_de_tesoro.sql.
select fila_version
from public.guardar_la_fila(
  (select fila_version from public.ajustes),
  jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', (select id from public.tesoros where clave = 'diezmo'), 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', '[{"tesoro": "aaaaaaaa-0000-7000-8000-000000000101", "clase": "prioridad", "tope": 1000000, "renglones": [], "desde": null, "modo": "mes", "hastaLaMeta": false}]'::jsonb,
    'reparto', '[{"tesoro": "aaaaaaaa-0000-7000-8000-000000000103", "porcentaje": 1000, "hastaLaMeta": false}]'::jsonb,
    'superavit', (select id from public.tesoros where clave = 'maun'),
    'sueldoPorTrabajo', false
  )
);

select throws_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000101' $$,
  'MN024', 'Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.',
  'un paso de la fila guardada no se archiva: primero sale de la fila'
);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000101' $$),
  'MN024 en la fila',
  'y el detalle dice por qué'
);

select throws_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000103' $$,
  'MN024', null, 'una parte del reparto tampoco'
);


-- No se archiva lo que está en la foto de un cobro reabierto ----------------------------------------------

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Marcela');
insert into public.proyectos (id, cliente_id, titulo, estado)
  values ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'entregado');
insert into public.pagos (proyecto_id, fecha, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000011', '2026-09-01', 10000000);

-- Neta 10M: diezmo 1M, Herramientas 1M, Inmuebles 800.000 y 7,2M quedan en Maun. Las columnas de
-- siempre van con columnasDeSiempre: los topes, el sueldo y los fijos en cero, y el remanente con lo
-- que pasa por Maun antes del reparto, 9M.
select is(
  (
    select estado::text
    from public.cobrar_proyecto(
      'aaaaaaaa-0000-7000-8000-000000000011',
      (select version from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000011'),
      '2026-09-10', 10000000, 0, 0, 0, 1000000, 0, 0, 9000000, null, null, false,
      (select fila_version from public.ajustes),
      '[{"id": "aaaaaaaa-0000-7000-8000-000000000201", "posicion": 1, "tesoro_id": "aaaaaaaa-0000-7000-8000-000000000101", "monto_centavos": 1000000},
        {"id": "aaaaaaaa-0000-7000-8000-000000000202", "posicion": 2, "tesoro_id": "aaaaaaaa-0000-7000-8000-000000000103", "monto_centavos": 800000}]',
      '{"aaaaaaaa-0000-7000-8000-000000000101": 0}'
    )
  ),
  'cobrado',
  'el cobro por la fila le da 1M a Herramientas y 800.000 a Inmuebles'
);

select is(
  (
    select reapertura_fila -> 'fila' -> 'reparto' -> 0 ->> 'tesoro'
    from public.reabrir_proyecto(
      'aaaaaaaa-0000-7000-8000-000000000011',
      (select version from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000011')
    )
  ),
  'aaaaaaaa-0000-7000-8000-000000000103',
  'reabrirlo guarda la fila con la que se cobró, con Inmuebles en el reparto'
);

-- La fila cambia: ni Herramientas ni Inmuebles están ya en ella.
select fila_version
from public.guardar_la_fila(
  (select fila_version from public.ajustes),
  jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', (select id from public.tesoros where clave = 'diezmo'), 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', '[]'::jsonb,
    'reparto', '[]'::jsonb,
    'superavit', (select id from public.tesoros where clave = 'maun'),
    'sueldoPorTrabajo', false
  )
);

select is(
  (
    select coalesce(sum(monto_centavos), 0)::bigint
    from public.libro_mayor
    where tesoro_id = 'aaaaaaaa-0000-7000-8000-000000000103' and not ya_en_la_apertura
  ),
  0::bigint,
  'reabierto el cobro, Inmuebles no tiene plata: sus repartos se borraron'
);

select throws_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000103' $$,
  'MN024', null, 'pero no se archiva: volver a cobrar el reabierto le pagaría con la foto'
);

select lives_ok(
  $$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'el trabajo reabierto se borra'
);

select lives_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000103' $$,
  'y con el trabajo borrado, la foto ya no cuenta: Inmuebles se archiva'
);


-- No se archiva un tesoro con plata ------------------------------------------------------------------------

insert into public.tesoros (id, nombre, tinta, icono)
  values ('aaaaaaaa-0000-7000-8000-000000000104', 'Ahorro', 'mostaza', 'vault');
insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos)
  values ('2026-09-12', 'ingreso', 'aaaaaaaa-0000-7000-8000-000000000104', 500000);

select throws_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000104' $$,
  'MN024', null, 'un tesoro con plata no se archiva'
);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000104' $$),
  'MN024 saldo 500000',
  'y el detalle dice cuánto tiene'
);

insert into public.tesoros (id, nombre, tinta, icono)
  values ('aaaaaaaa-0000-7000-8000-000000000105', 'Préstamo', 'ciruela', 'landmark');
insert into public.movimientos (fecha, tipo, desde_id, monto_centavos)
  values ('2026-09-12', 'gasto', 'aaaaaaaa-0000-7000-8000-000000000105', 100);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000105' $$),
  'MN024 saldo -100',
  'uno en rojo tampoco: el saldo tiene que ser cero'
);

-- La hoja de archivar pasa primero la plata a otro tesoro, Maun sugerido.
insert into public.movimientos (fecha, tipo, desde_id, tesoro_destino, monto_centavos)
  values ('2026-09-13', 'transferencia', 'aaaaaaaa-0000-7000-8000-000000000104', 'maun', 500000);

select lives_ok(
  $$ update public.tesoros set archivado_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000104' $$,
  'sin plata, fuera de la fila y sin cobros reabiertos que lo usen, se archiva'
);

select ok(
  (select archivado_at is not null from public.tesoros where id = 'aaaaaaaa-0000-7000-8000-000000000104'),
  'y queda archivado'
);

select lives_ok(
  $$ update public.tesoros set nombre = 'Ahorro viejo' where id = 'aaaaaaaa-0000-7000-8000-000000000104' $$,
  'uno archivado se puede renombrar: la guarda solo mira el momento de archivar'
);

select lives_ok(
  $$ update public.tesoros set archivado_at = null where id = 'aaaaaaaa-0000-7000-8000-000000000104' $$,
  'y desarchivarlo pasa'
);

select ok(
  (select archivado_at is null from public.tesoros where id = 'aaaaaaaa-0000-7000-8000-000000000104'),
  'y vuelve a estar a mano'
);

select * from finish();
