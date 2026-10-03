-- Las etapas en la réplica (ADR 0084): cambios_de_estado viaja en bootstrap() y delta() como las otras
-- tablas del delta y avisa sus cambios. bootstrap() trae solo las filas de los trabajos vivos, porque la
-- tabla no tiene borrado lógico, y nunca las de otro taller.

select plan(16);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  ('aaaaaaaa-0000-7000-8000-000000000002', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto'),
  ('aaaaaaaa-0000-7000-8000-000000000003', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'contacto');
update public.proyectos set estado = 'relevamiento' where id = 'aaaaaaaa-0000-7000-8000-000000000002';
update public.proyectos set estado = 'a_presupuestar' where id = 'aaaaaaaa-0000-7000-8000-000000000002';
update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000003';

select tests.entrar_como(tests.id('b'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Rocío');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  ('bbbbbbbb-0000-7000-8000-000000000002', 'bbbbbbbb-0000-7000-8000-000000000001', 'Mesa', 'contacto');


-- La tabla y su aviso ----------------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_trigger g
    where g.tgrelid = 'public.cambios_de_estado'::regclass
      and g.tgname = 'avisar_los_cambios'
      and g.tgfoid = 'private.avisar_los_cambios()'::regprocedure
      and not g.tgisinternal
  ),
  1,
  'cambios_de_estado avisa sus cambios con el mismo trigger que las demás tablas del delta'
);

select ok(
  not has_table_privilege('authenticated', 'public.cambios_de_estado', 'insert')
    and not has_table_privilege('authenticated', 'public.cambios_de_estado', 'update')
    and not has_table_privilege('authenticated', 'public.cambios_de_estado', 'delete')
    and has_table_privilege('authenticated', 'public.cambios_de_estado', 'select'),
  'la app la sigue leyendo y nada más: la escribe el trigger'
);

select ok(
  not has_table_privilege('anon', 'public.cambios_de_estado', 'select'),
  'anon no la lee'
);


-- bootstrap() -----------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

select ok(public.bootstrap() ? 'cambios_de_estado', 'bootstrap() trae la clave cambios_de_estado');

select is(
  (
    select array_agg(coalesce(e ->> 'desde', 'alta') || ' a ' || (e ->> 'hacia') order by e ->> 'updated_at', e ->> 'id')
    from jsonb_array_elements(public.bootstrap() -> 'cambios_de_estado') as e
  ),
  array['alta a contacto', 'contacto a relevamiento', 'relevamiento a a_presupuestar'],
  'bootstrap() trae las etapas del trabajo vivo del taller, con la de su alta'
);

select is(
  (
    select count(*)::int
    from public.cambios_de_estado
    where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000003'
  ),
  1,
  'el trabajo borrado conserva su historia en la tabla'
);

select is(
  (
    select count(*)::int
    from jsonb_array_elements(public.bootstrap() -> 'cambios_de_estado') as e
    where e ->> 'proyecto_id' = 'aaaaaaaa-0000-7000-8000-000000000003'
  ),
  0,
  'pero bootstrap() no la trae: un trabajo borrado no existe para la réplica'
);

select is(
  (
    select array_agg(distinct e ->> 'household_id')
    from jsonb_array_elements(public.bootstrap() -> 'cambios_de_estado') as e
  ),
  array[tests.id('household_a')::text],
  'bootstrap() de A no trae ninguna etapa de B'
);

select ok(
  (
    select bool_and(e ? 'id' and e ? 'version' and e ? 'deleted_at' and e ? 'updated_at' and e ? 'ocurrio_el')
    from jsonb_array_elements(public.bootstrap() -> 'cambios_de_estado') as e
  ),
  'cada etapa viaja con id, version, deleted_at y updated_at, lo que la réplica exige, y con su día'
);


-- delta() ---------------------------------------------------------------------------------------------

select ok(public.delta(now()) ? 'cambios_de_estado', 'delta() trae la clave cambios_de_estado');

select is(
  (
    select count(*)::int
    from jsonb_array_elements(public.delta(now() - interval '1 hour') -> 'cambios_de_estado') as e
  ),
  4,
  'delta() trae las etapas por su updated_at, como las demás tablas: las del trabajo vivo y la del borrado'
);

select is(
  (
    select array_agg(distinct e ->> 'household_id')
    from jsonb_array_elements(public.delta(now() - interval '1 hour') -> 'cambios_de_estado') as e
  ),
  array[tests.id('household_a')::text],
  'delta() de A no trae ninguna etapa de B'
);

select is(
  jsonb_array_length(public.delta(now() + interval '1 hour') -> 'cambios_de_estado'),
  0,
  'sin cambios desde el cursor, no trae etapas'
);


-- El aviso, con un espía como en 31_el_aviso_de_cambios.sql -------------------------------------------

select tests.salir();

create table tests.avisos (orden bigint generated always as identity, household uuid);

create or replace function private.mandar_el_aviso_de_cambios(p_household uuid)
returns void
language sql
set search_path = ''
as $$
  insert into tests.avisos (household) values (p_household)
$$;

select set_config('maun.cambios_avisados', '', true);

insert into public.cambios_de_estado (household_id, proyecto_id, desde, hacia, ocurrio_el)
values (tests.id('household_b'), 'bbbbbbbb-0000-7000-8000-000000000002', 'contacto', 'relevamiento', '2026-10-03');

select is(
  (select array_agg(household order by orden) from tests.avisos),
  array[tests.id('household_b')],
  'una etapa nueva avisa al canal de su taller'
);


-- Los comentarios ---------------------------------------------------------------------------------------

select ok(
  obj_description('public.cambios_de_estado'::regclass, 'pg_class') like '%Viaja en la réplica%'
    and obj_description('public.cambios_de_estado'::regclass, 'pg_class') not like '%no lo muestra ninguna pantalla%',
  'el comentario de cambios_de_estado ya no dice que ninguna pantalla la lee'
);

select ok(
  obj_description('public.cambios_de_fecha'::regclass, 'pg_class') not like '%al revés que cambios_de_estado%',
  'y el de cambios_de_fecha ya no dice que cambios_de_estado está afuera de la réplica'
);

select * from finish();
