-- El reabierto cobra por mes (ADR 0079): un cobro que se había congelado con el sueldo por trabajo,
-- reabierto después de que el taller pasó a repartir el sueldo por mes (ADR 0072), se vuelve a
-- cobrar con la fecha, los objetivos y la fila de su foto, pero con el sueldo por mes: paga lo que le
-- falta al sueldo de su mes y el resto queda en Maun. Por trabajo queda solo en un taller que sigue
-- por trabajo, como el seed.
--
-- Taller A, el de MAUN: sueldo 180M, fijos 0, y septiembre de 2026 cobrado por trabajo, como pasó:
--   P1, 8/9: neta 15.800.000, sueldo 14.220.000;
--   P2, 9/9: neta 105.733.800, sueldo 95.160.420;
--   P3, 25/9: neta 154.584.953, sueldo 139.126.458 (todo lo que dejaba el diezmo).
-- Después pasa a por mes, se reabre P3 y se le carga un gasto de 7.000.000: neta 147.584.953, diezmo
-- 14.758.495. El mes ya le dio 109.380.420 al Salario, así que el tope es 70.619.580 y a Maun le
-- quedan 62.206.878. En agosto, P5 y P6 repiten la cuenta por el camino de antes.
-- Taller B sigue por trabajo, y después se reabre con la foto por la fila que trajo el sueldo por
-- trabajo. Taller C va por mes solo porque guardó su fila.

select plan(20);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('c', tests.crear_usuario('c@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));
select tests.guardar('household_c', private.crear_household('Taller C', tests.id('c')));

select tests.guardar('hogar_a', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'hogar'));
select tests.guardar('maun_a', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('hogar_b', (select id from public.tesoros where household_id = tests.id('household_b') and clave = 'hogar'));
select tests.guardar('hogar_c', (select id from public.tesoros where household_id = tests.id('household_c') and clave = 'hogar'));
select tests.guardar('maun_c', (select id from public.tesoros where household_id = tests.id('household_c') and clave = 'maun'));
select tests.guardar('diezmo_c', (select id from public.tesoros where household_id = tests.id('household_c') and clave = 'diezmo'));
select tests.guardar('cocos_c', (select id from public.tesoros where household_id = tests.id('household_c') and clave = 'cocos'));

-- Los tres talleres arrancan como MAUN antes del ADR 0072: el sueldo por trabajo.
update public.ajustes
set sueldo_mensual_centavos = 180000000, costos_fijos_centavos = 0, sueldo_tope_mensual = false
where household_id in (tests.id('household_a'), tests.id('household_b'), tests.id('household_c'));


-- Las piezas del test ----------------------------------------------------------------------------------------

create function tests.rid(p_n integer)
returns uuid
language sql
immutable
as $$
  select ('cccccccc-0000-7000-8000-' || lpad(p_n::text, 12, '0'))::uuid
$$;

create function tests.version_de(p_proyecto uuid)
returns integer
language sql
stable
as $$
  select version from public.proyectos where id = p_proyecto
$$;

-- Un cobro por el camino de antes, el de una app anterior a la fila: el sueldo con su tope, los fijos
-- en cero y el acumulado del mes que vio la app.
create function tests.de_antes(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_tope bigint, p_diezmo bigint,
  p_sueldo bigint, p_remanente bigint, p_previo bigint
)
returns public.proyectos
language sql
as $$
  select * from public.cobrar_proyecto(
    p_proyecto, tests.version_de(p_proyecto), p_fecha, p_cobrado, p_gastos, p_tope, 0, p_diezmo, p_sueldo,
    0, p_remanente, p_previo, 0
  )
$$;

-- Un cobro por la fila de un reabierto de antes: la de siempre armada con su foto, en la revisión 0,
-- con un solo paso (el sueldo al Salario, porque los fijos son 0) y lo que la app vio del mes.
create function tests.por_la_fila(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_diezmo bigint, p_hogar text,
  p_sueldo bigint, p_previo bigint, p_n integer
)
returns public.proyectos
language sql
as $$
  select * from public.cobrar_proyecto(
    p_proyecto, tests.version_de(p_proyecto), p_fecha, p_cobrado, p_gastos, 0, 0, p_diezmo, 0, 0,
    p_cobrado - p_gastos - p_diezmo, 0, 0, false, 0,
    jsonb_build_array(
      jsonb_build_object('id', tests.rid(p_n), 'posicion', 1, 'tesoro_id', tests.id(p_hogar), 'monto_centavos', p_sueldo)
    ),
    jsonb_build_object(tests.id(p_hogar)::text, p_previo)
  )
$$;

-- Un cobro que tiene que rebotar: si la base lo acepta, igual se deshace, así el caso siguiente
-- arranca del mismo lugar y la falla dice qué pasó.
create function tests.sin_aplicar(p_sql text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise exception 'la base lo aceptó' using errcode = 'P0001';
end;
$$;

-- El reparto del sueldo de un proyecto, como quedó congelado.
create function tests.sueldo_de(p_proyecto uuid)
returns table (modo text, objetivo bigint, previo bigint, tope bigint, por_mes boolean, monto bigint)
language sql
stable
as $$
  select r.modo::text, r.objetivo_centavos, r.previo_centavos, r.tope_centavos, r.por_mes, r.monto_centavos
  from public.repartos r
  where r.proyecto_id = p_proyecto and r.deleted_at is null and r.tipo = 'paso' and r.clase = 'sueldo'
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- Taller A: septiembre, cobrado por trabajo ------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

insert into public.clientes (id, nombre) values (tests.rid(1), 'Clientes de MAUN');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  (tests.rid(11), tests.rid(1), 'Estanteria Secretaria', 'entregado'),
  (tests.rid(12), tests.rid(1), 'Escritorio - Estanteria Sara', 'entregado'),
  (tests.rid(13), tests.rid(1), 'Varios Proyectos', 'entregado'),
  (tests.rid(15), tests.rid(1), 'Placard de agosto', 'entregado'),
  (tests.rid(16), tests.rid(1), 'Cocina de agosto', 'entregado');
insert into public.pagos (proyecto_id, fecha, monto_centavos) values
  (tests.rid(11), '2026-09-01', 15800000),
  (tests.rid(12), '2026-09-01', 105733800),
  (tests.rid(13), '2026-09-01', 154584953),
  (tests.rid(15), '2026-08-01', 121533800),
  (tests.rid(16), '2026-08-01', 154584953);

select tests.de_antes(tests.rid(11), '2026-09-08', 15800000, 0, 180000000, 1580000, 14220000, 0, 0);
select tests.de_antes(tests.rid(12), '2026-09-09', 105733800, 0, 180000000, 10573380, 95160420, 0, 14220000);
select tests.de_antes(tests.rid(15), '2026-08-08', 121533800, 0, 180000000, 12153380, 109380420, 0, 0);
select tests.de_antes(tests.rid(16), '2026-08-20', 154584953, 0, 180000000, 15458495, 139126458, 0, 109380420);

select results_eq(
  $$
    select dist_tope_sueldo_centavos, dist_sueldo_centavos, dist_remanente_centavos, dist_sueldo_mensual
    from tests.de_antes(tests.rid(13), '2026-09-25', 154584953, 0, 180000000, 15458495, 139126458, 0, 109380420)
  $$,
  $$ values (180000000::bigint, 139126458::bigint, 0::bigint, false) $$,
  'el cobro del 25/9 se congela por trabajo: el sueldo entero de tope y todo lo que deja el diezmo al Salario'
);

-- El ADR 0072: el taller pasa a repartir el sueldo por mes. La app no tiene grant sobre esa columna.
select tests.salir();
update public.ajustes set sueldo_tope_mensual = true where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));

select results_eq(
  $$
    select reapertura_sueldo_mensual, reapertura_fila is null, reapertura_fecha_cobro,
           reapertura_objetivo_sueldo_centavos, reapertura_objetivo_fijos_centavos
    from public.reabrir_proyecto(tests.rid(13), 2)
  $$,
  $$ values (false, true, '2026-09-25'::date, 180000000::bigint, 0::bigint) $$,
  'reabrirlo guarda su foto: la fecha, los objetivos y el sueldo por trabajo con el que se cobró'
);

insert into public.gastos (proyecto_id, fecha, descripcion, monto_centavos) values
  (tests.rid(13), '2026-09-26', 'Flete', 7000000);

select throws_ok(
  $$ select tests.sin_aplicar($c$ select tests.por_la_fila(tests.rid(13), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_a', 132826458, 109380420, 1301) $c$) $$,
  'MN008', null,
  'la cuenta por trabajo de una app sin el arreglo rebota: el Salario no puede recibir un sueldo entero en un mes que ya tenía 109.380.420'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila ->> 'sueldoPorTrabajo', dist_previo = jsonb_build_object(tests.id('hogar_a')::text, 109380420),
           dist_diezmo_centavos, fecha_cobro
    from tests.por_la_fila(tests.rid(13), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_a', 70619580, 109380420, 1302)
  $$,
  $$ values (0, 'false', true, 14758495::bigint, '2026-09-25'::date) $$,
  'la cuenta por mes pasa: la fila de siempre de su foto, en la revisión 0, con el sueldo por mes y su fecha'
);

select results_eq(
  $$ select * from tests.sueldo_de(tests.rid(13)) $$,
  $$ values ('mes', 180000000::bigint, 109380420::bigint, 70619580::bigint, true, 70619580::bigint) $$,
  'el Salario recibe lo que le faltaba al mes: 180.000.000 menos 109.380.420'
);

select is(
  (
    select sum(monto_centavos)
    from public.libro_mayor
    where proyecto_id = tests.rid(13) and tesoro_id = tests.id('maun_a')
  ),
  62206878::numeric,
  'y a Maun le quedan 62.206.878: lo cobrado menos el gasto, el diezmo y el sueldo'
);

select is(
  (
    select sum(monto_centavos)
    from public.libro_mayor
    where tesoro_id = tests.id('hogar_a') and origen in ('distribucion', 'reparto')
      and fecha between '2026-09-01' and '2026-09-30'
  ),
  180000000::numeric,
  'septiembre le paga al Salario un sueldo, no uno por cobro'
);


-- Taller A, agosto: el camino de antes, el de una app anterior a la fila ------------------------------------

select results_eq(
  $$ select reapertura_sueldo_mensual, reapertura_fila is null from public.reabrir_proyecto(tests.rid(16), 2) $$,
  $$ values (false, true) $$,
  'un cobro de agosto por trabajo también se reabre con su foto por trabajo'
);

insert into public.gastos (proyecto_id, fecha, descripcion, monto_centavos) values
  (tests.rid(16), '2026-08-21', 'Flete', 7000000);

select throws_ok(
  $$ select tests.sin_aplicar($c$ select tests.de_antes(tests.rid(16), '2026-08-20', 154584953, 7000000, 180000000, 14758495, 132826458, 0, 109380420) $c$) $$,
  'MN006', null,
  'por el camino de antes, la cuenta por trabajo rebota: con el mismo acumulado, el tope del sueldo ya es lo que le falta a agosto'
);

select results_eq(
  $$
    select dist_tope_sueldo_centavos, dist_sueldo_centavos, dist_remanente_centavos, dist_sueldo_mensual
    from tests.de_antes(tests.rid(16), '2026-08-20', 154584953, 7000000, 70619580, 14758495, 70619580, 62206878, 109380420)
  $$,
  $$ values (70619580::bigint, 70619580::bigint, 62206878::bigint, true) $$,
  'y la cuenta por mes pasa: un reabierto de un mes anterior se cuenta contra el sueldo de su mes'
);


-- Taller B: sigue por trabajo, como el seed --------------------------------------------------------------------

select tests.entrar_como(tests.id('b'));

insert into public.clientes (id, nombre) values (tests.rid(2), 'Clientes de B');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  (tests.rid(21), tests.rid(2), 'Biblioteca de septiembre', 'entregado'),
  (tests.rid(22), tests.rid(2), 'Rack de septiembre', 'entregado');
insert into public.pagos (proyecto_id, fecha, monto_centavos) values
  (tests.rid(21), '2026-09-01', 121533800),
  (tests.rid(22), '2026-09-01', 154584953);

select tests.de_antes(tests.rid(21), '2026-09-09', 121533800, 0, 180000000, 12153380, 109380420, 0, 0);
select tests.de_antes(tests.rid(22), '2026-09-25', 154584953, 0, 180000000, 15458495, 139126458, 0, 109380420);
select version from public.reabrir_proyecto(tests.rid(22), 2);
insert into public.gastos (proyecto_id, fecha, descripcion, monto_centavos) values
  (tests.rid(22), '2026-09-26', 'Flete', 7000000);

select throws_ok(
  $$ select tests.sin_aplicar($c$ select tests.por_la_fila(tests.rid(22), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_b', 70619580, 109380420, 2201) $c$) $$,
  'MN008', null,
  'en un taller que sigue por trabajo, la cuenta por mes rebota'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila ->> 'sueldoPorTrabajo'
    from tests.por_la_fila(tests.rid(22), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_b', 132826458, 109380420, 2202)
  $$,
  $$ values (0, 'true') $$,
  'y el reabierto sigue por trabajo, con la fila de siempre de su foto'
);

select results_eq(
  $$ select * from tests.sueldo_de(tests.rid(22)) $$,
  $$ values ('mes', 180000000::bigint, 109380420::bigint, 180000000::bigint, false, 132826458::bigint) $$,
  'el sueldo entero de tope, como hasta ahora'
);

select results_eq(
  $$
    select reapertura_fila ->> 'version', reapertura_fila #>> '{fila,sueldoPorTrabajo}', reapertura_sueldo_mensual
    from public.reabrir_proyecto(tests.rid(22), tests.version_de(tests.rid(22)))
  $$,
  $$ values ('0', 'true', true) $$,
  'reabrir ese cobro por la fila guarda la fila con el sueldo por trabajo en su foto'
);

select tests.salir();
update public.ajustes set sueldo_tope_mensual = true where household_id = tests.id('household_b');
select tests.entrar_como(tests.id('b'));

select throws_ok(
  $$ select tests.sin_aplicar($c$ select tests.por_la_fila(tests.rid(22), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_b', 132826458, 109380420, 2203) $c$) $$,
  'MN008', null,
  'con el taller ya por mes, esa foto por trabajo tampoco se vuelve a cobrar por trabajo'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila ->> 'sueldoPorTrabajo'
    from tests.por_la_fila(tests.rid(22), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_b', 70619580, 109380420, 2204)
  $$,
  $$ values (0, 'false') $$,
  'se cobra con la fila de su foto, en su revisión, y el sueldo por mes'
);

select results_eq(
  $$ select * from tests.sueldo_de(tests.rid(22)) $$,
  $$ values ('mes', 180000000::bigint, 109380420::bigint, 70619580::bigint, true, 70619580::bigint) $$,
  'el Salario recibe lo que le faltaba al mes'
);


-- Taller C: por mes porque guardó su fila ----------------------------------------------------------------------

select tests.entrar_como(tests.id('c'));

insert into public.clientes (id, nombre) values (tests.rid(3), 'Clientes de C');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  (tests.rid(31), tests.rid(3), 'Mesa de septiembre', 'entregado'),
  (tests.rid(32), tests.rid(3), 'Vestidor de septiembre', 'entregado');
insert into public.pagos (proyecto_id, fecha, monto_centavos) values
  (tests.rid(31), '2026-09-01', 121533800),
  (tests.rid(32), '2026-09-01', 154584953);

select tests.de_antes(tests.rid(31), '2026-09-09', 121533800, 0, 180000000, 12153380, 109380420, 0, 0);
select tests.de_antes(tests.rid(32), '2026-09-25', 154584953, 0, 180000000, 15458495, 139126458, 0, 109380420);
select version from public.reabrir_proyecto(tests.rid(32), 2);
insert into public.gastos (proyecto_id, fecha, descripcion, monto_centavos) values
  (tests.rid(32), '2026-09-26', 'Flete', 7000000);

select fila_version from public.guardar_la_fila(
  (select fila_version from public.ajustes where household_id = tests.id('household_c')),
  jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', tests.id('diezmo_c'), 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', jsonb_build_array(
      jsonb_build_object(
        'tesoro', tests.id('hogar_c'), 'clase', 'sueldo', 'tope', 180000000, 'renglones', '[]'::jsonb,
        'desde', null, 'modo', 'mes', 'hastaLaMeta', false
      )
    ),
    'reparto', jsonb_build_array(
      jsonb_build_object('tesoro', tests.id('cocos_c'), 'porcentaje', 5000, 'hastaLaMeta', false)
    ),
    'superavit', tests.id('maun_c'),
    'sueldoPorTrabajo', false
  )
);

select throws_ok(
  $$ select tests.sin_aplicar($c$ select tests.por_la_fila(tests.rid(32), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_c', 132826458, 109380420, 3201) $c$) $$,
  'MN008', null,
  'con la fila guardada el taller va por mes aunque sueldo_tope_mensual siga apagado: la cuenta por trabajo rebota'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila ->> 'sueldoPorTrabajo', dist_fila -> 'reparto'
    from tests.por_la_fila(tests.rid(32), '2026-09-25', 154584953, 7000000, 14758495, 'hogar_c', 70619580, 109380420, 3202)
  $$,
  $$ values (0, 'false', '[]'::jsonb) $$,
  'y se cobra con la fila de siempre de su foto, sin las partes de la fila de hoy'
);

select results_eq(
  $$
    select s.*, (select sueldo_tope_mensual from public.ajustes where household_id = tests.id('household_c'))
    from tests.sueldo_de(tests.rid(32)) as s
  $$,
  $$ values ('mes', 180000000::bigint, 109380420::bigint, 70619580::bigint, true, 70619580::bigint, false) $$,
  'con el sueldo por mes, aunque sueldo_tope_mensual siga apagado'
);

select * from finish();
