-- El cobro por la fila (ADR 0078): cada liquidación reparte por la fila del taller y congela una fila de
-- repartos por paso y por parte; la app vieja sigue por el camino de antes mientras no haya fila
-- guardada, y con fila guardada rebota con MN025.
--
-- Taller A: sueldo 100M y costos fijos 30M por mes. Sin fila guardada reparte con la fila de siempre:
-- el diezmo como única obligación, el sueldo a Hogar y los costos fijos a un paso de Maun. La fila que
-- después guarda (F1), con la forma de los tipos de tesoro y todo por mes, sin metas:
--   el diezmo al 10% sobre el ingreso;
--   1. Hogar, sueldo, tope 100M
--   2. Gastos fijos, con alquiler 20M y luz 10M: tope 30M
--   3. Materiales, prioridad, tope 5M
--   y lo que sobra: 50% a Cocos, 30% a Inmuebles y el 20% que queda en Maun, el superávit.
-- Más adelante guarda otra (F2): Materiales con tope 8M y 60% a Cocos, sin Inmuebles. Las
-- obligaciones de otro tipo, los otros modos, las metas y el superávit aparte están en
-- 39_los_tipos_de_tesoro.sql.
--
-- Cada cobro cae en su propio mes, así lo que el mes ya llevaba se lee en el comentario de cada caso.
-- Las cuentas son las de fila.ts: el diezmo es el 10% redondeado, cada paso recibe hasta lo que le
-- falta de su tope en el mes, y cada parte se redondea hacia abajo; el resto queda en Maun. Por la
-- fila, las columnas de siempre van con columnasDeSiempre: topes, sueldo y fijos en 0, y el
-- remanente con lo que pasa por Maun antes del reparto (neta − diezmo).

select plan(86);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

select tests.guardar('hogar', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'hogar'));
select tests.guardar('maun', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('diezmo', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'diezmo'));
select tests.guardar('cocos', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'cocos'));


-- Las piezas del test ----------------------------------------------------------------------------------------

-- Los ids de los proyectos y de los repartos: aaaaaaaa-0000-7000-8000-00000000nnnn.
create function tests.rid(p_n integer)
returns uuid
language sql
immutable
as $$
  select ('aaaaaaaa-0000-7000-8000-' || lpad(p_n::text, 12, '0'))::uuid
$$;

-- Un reparto del pedido, como lo manda la app.
create function tests.r(p_n integer, p_posicion integer, p_tesoro text, p_monto bigint)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', tests.rid(p_n), 'posicion', p_posicion, 'tesoro_id', tests.id(p_tesoro), 'monto_centavos', p_monto
  )
$$;

-- Lo que la app vio del mes: {tesoro_id: centavos}.
create function tests.mes(p_tesoros text[], p_montos bigint[])
returns jsonb
language sql
stable
as $$
  select jsonb_object_agg(tests.id(u.t)::text, u.m) from unnest(p_tesoros, p_montos) as u (t, m)
$$;

-- Un paso, una parte y la obligación del diezmo, con la forma que manda la app: por mes, sin meta.
create function tests.paso(p_tesoro text, p_clase text, p_tope bigint, p_renglones jsonb, p_desde text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'tesoro', tests.id(p_tesoro), 'clase', p_clase, 'tope', p_tope, 'renglones', p_renglones,
    'desde', p_desde, 'modo', 'mes', 'hastaLaMeta', false
  )
$$;

create function tests.parte(p_tesoro text, p_porcentaje integer)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object('tesoro', tests.id(p_tesoro), 'porcentaje', p_porcentaje, 'hastaLaMeta', false)
$$;

create function tests.fila(p_pasos jsonb, p_reparto jsonb)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', tests.id('diezmo'), 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', p_pasos,
    'reparto', p_reparto,
    'superavit', tests.id('maun'),
    'sueldoPorTrabajo', false
  )
$$;

-- La de siempre, como la arma private.fila_de_siempre(): el renglón de los costos fijos sin día.
create function tests.fila_de_siempre(p_sueldo bigint, p_fijos bigint)
returns jsonb
language sql
stable
as $$
  select tests.fila(
    jsonb_build_array(
      tests.paso('hogar', 'sueldo', p_sueldo, '[]', null),
      tests.paso('maun', 'fijos', p_fijos, jsonb_build_array(jsonb_build_object('nombre', 'Costos fijos', 'monto', p_fijos, 'dia', null)), null)
    ),
    '[]'
  )
$$;

create function tests.fila_1()
returns jsonb
language sql
stable
as $$
  select tests.fila(
    jsonb_build_array(
      tests.paso('hogar', 'sueldo', 100000000, '[]', null),
      tests.paso(
        'fijos', 'fijos', 30000000,
        '[{"nombre": "Alquiler", "monto": 20000000, "dia": 10}, {"nombre": "Luz", "monto": 10000000, "dia": null}]',
        '2026-09'
      ),
      tests.paso('materiales', 'prioridad', 5000000, '[]', null)
    ),
    jsonb_build_array(tests.parte('cocos', 5000), tests.parte('inmuebles', 3000))
  )
$$;

create function tests.fila_2()
returns jsonb
language sql
stable
as $$
  select tests.fila(
    jsonb_build_array(
      tests.paso('hogar', 'sueldo', 100000000, '[]', null),
      tests.paso(
        'fijos', 'fijos', 30000000,
        '[{"nombre": "Alquiler", "monto": 20000000, "dia": 10}, {"nombre": "Luz", "monto": 10000000, "dia": null}]',
        '2026-09'
      ),
      tests.paso('materiales', 'prioridad', 8000000, '[]', '2026-12')
    ),
    jsonb_build_array(tests.parte('cocos', 6000))
  )
$$;

-- Los repartos del cobro de septiembre con F1, que se usan en varios casos.
create function tests.r1()
returns jsonb
language sql
stable
as $$
  select jsonb_build_array(
    tests.r(1101, 1, 'hogar', 100000000),
    tests.r(1102, 2, 'fijos', 30000000),
    tests.r(1103, 3, 'materiales', 5000000),
    tests.r(1104, 4, 'cocos', 13500000),
    tests.r(1105, 5, 'inmuebles', 8100000)
  )
$$;

-- Un cobro o un cierre por la fila con la versión del proyecto de hoy y las columnas de siempre de
-- columnasDeSiempre: topes, sueldo, fijos y lo del mes en cero, y el remanente en neta − diezmo.
create function tests.cobrar(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_diezmo bigint,
  p_fila_version integer, p_repartos jsonb, p_previo jsonb, p_apertura boolean default false
)
returns public.proyectos
language sql
as $$
  select * from public.cobrar_proyecto(
    p_proyecto, (select version from public.proyectos where id = p_proyecto), p_fecha, p_cobrado, p_gastos,
    0, 0, p_diezmo, 0, 0, p_cobrado - p_gastos - p_diezmo, 0, 0, p_apertura, p_fila_version, p_repartos, p_previo
  )
$$;

create function tests.cerrar(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_diezmo_bp integer, p_diezmo bigint,
  p_fila_version integer, p_repartos jsonb, p_previo jsonb
)
returns public.proyectos
language sql
as $$
  select * from public.cerrar_perdido(
    p_proyecto, (select version from public.proyectos where id = p_proyecto), p_fecha, p_cobrado, p_gastos,
    0, 0, p_diezmo, 0, 0, p_cobrado - p_gastos - p_diezmo, p_diezmo_bp, 0, 0, false, p_fila_version,
    p_repartos, p_previo
  )
$$;

-- Los repartos vivos de un proyecto y cómo se esperan, renglón por renglón. Un paso guarda cómo se
-- llena: acá todos por mes.
create function tests.repartos_de(p_proyecto uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_array(
        r.id, r.posicion, r.tesoro_id, r.nombre, r.tipo, r.clase, r.modo, r.objetivo_centavos, r.previo_centavos,
        r.tope_centavos, r.por_mes, r.porcentaje_bp, r.base, r.monto_centavos, r.fecha, r.ya_en_la_apertura
      )
      order by r.posicion
    ),
    '[]'::jsonb
  )
  from public.repartos r
  where r.proyecto_id = p_proyecto and r.deleted_at is null
$$;

create function tests.paso_de(
  p_n integer, p_posicion integer, p_tesoro text, p_nombre text, p_clase text,
  p_objetivo bigint, p_previo bigint, p_tope bigint, p_monto bigint, p_fecha date
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_array(
    tests.rid(p_n), p_posicion, tests.id(p_tesoro), p_nombre, 'paso', p_clase, 'mes', p_objetivo, p_previo, p_tope,
    true, null, null, p_monto, p_fecha, false
  )
$$;

create function tests.parte_de(
  p_n integer, p_posicion integer, p_tesoro text, p_nombre text, p_porcentaje integer, p_monto bigint, p_fecha date
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_array(
    tests.rid(p_n), p_posicion, tests.id(p_tesoro), p_nombre, 'parte', null, null, null, null, null,
    null, p_porcentaje, null, p_monto, p_fecha, false
  )
$$;

-- Los asientos de los repartos de un proyecto en el libro mayor, y cómo se espera cada uno.
create function tests.libro_de(p_proyecto uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_array(l.tesoro_id, l.contrapartida_id, l.monto_centavos, l.categoria, l.fecha, l.ya_en_la_apertura)
      order by l.monto_centavos, l.tesoro_id
    ),
    '[]'::jsonb
  )
  from public.libro_mayor l
  where l.proyecto_id = p_proyecto and l.origen = 'reparto'
$$;

create function tests.asiento(p_tesoro text, p_contrapartida text, p_monto bigint, p_fecha date, p_apertura boolean default false)
returns jsonb
language sql
stable
as $$
  select jsonb_build_array(tests.id(p_tesoro), tests.id(p_contrapartida), p_monto, 'Distribución', p_fecha, p_apertura)
$$;

create function tests.revision()
returns integer
language sql
stable
as $$
  select fila_version from public.ajustes where household_id = tests.id('household_a')
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- El taller ----------------------------------------------------------------------------------------------

select tests.guardar('p0', tests.rid(10));
select tests.guardar('p8', tests.rid(18));
select tests.guardar('p7a', tests.rid(17));
select tests.guardar('p7b', tests.rid(27));
select tests.guardar('p6old', tests.rid(16));
select tests.guardar('l6old', tests.rid(26));
select tests.guardar('p6new1', tests.rid(36));
select tests.guardar('p6re', tests.rid(46));
select tests.guardar('p6fin', tests.rid(56));
select tests.guardar('p1', tests.rid(11));
select tests.guardar('pap', tests.rid(12));
select tests.guardar('p5a', tests.rid(15));
select tests.guardar('p5b', tests.rid(25));
select tests.guardar('p9', tests.rid(19));
select tests.guardar('p10r', tests.rid(20));
select tests.guardar('l10', tests.rid(30));
select tests.guardar('l10b', tests.rid(40));
select tests.guardar('fijos', tests.rid(101));
select tests.guardar('materiales', tests.rid(102));
select tests.guardar('inmuebles', tests.rid(103));

select tests.entrar_como(tests.id('a'));

insert into public.tesoros (id, nombre, tinta, icono) values
  (tests.id('fijos'), 'Gastos fijos', 'petroleo', 'building-2'),
  (tests.id('materiales'), 'Materiales', 'mostaza', 'package'),
  (tests.id('inmuebles'), 'Inmuebles', 'grana', 'landmark');

insert into public.clientes (id, nombre) values (tests.rid(1), 'Marcela');

insert into public.proyectos (id, cliente_id, titulo, estado) values
  (tests.id('p0'), tests.rid(1), 'Banqueta', 'entregado'),
  (tests.id('p8'), tests.rid(1), 'Placard de mayo', 'entregado'),
  (tests.id('p7a'), tests.rid(1), 'Cocina de julio', 'entregado'),
  (tests.id('p7b'), tests.rid(1), 'Mesa de julio', 'entregado'),
  (tests.id('p6old'), tests.rid(1), 'Rack de noviembre', 'entregado'),
  (tests.id('l6old'), tests.rid(1), 'Lead de noviembre', 'contacto'),
  (tests.id('p6new1'), tests.rid(1), 'Estante de noviembre', 'entregado'),
  (tests.id('p6re'), tests.rid(1), 'Vanitory de noviembre', 'entregado'),
  (tests.id('p6fin'), tests.rid(1), 'Vestidor de noviembre', 'entregado'),
  (tests.id('p1'), tests.rid(1), 'Placard de septiembre', 'entregado'),
  (tests.id('pap'), tests.rid(1), 'Escritorio de agosto', 'entregado'),
  (tests.id('p5a'), tests.rid(1), 'Biblioteca de octubre', 'entregado'),
  (tests.id('p5b'), tests.rid(1), 'Alacena de octubre', 'entregado'),
  (tests.id('p9'), tests.rid(1), 'Cama de diciembre', 'entregado'),
  (tests.id('p10r'), tests.rid(1), 'Deck de febrero', 'entregado'),
  (tests.id('l10'), tests.rid(1), 'Lead de enero', 'contacto'),
  (tests.id('l10b'), tests.rid(1), 'Otro lead de enero', 'contacto');

insert into public.pagos (proyecto_id, fecha, monto_centavos) values
  (tests.id('p0'), '2026-06-01', 10000000),
  (tests.id('p8'), '2026-05-01', 20000000),
  (tests.id('p7a'), '2026-07-01', 150000000),
  (tests.id('p7b'), '2026-07-01', 50000000),
  (tests.id('p6old'), '2026-11-01', 40000000),
  (tests.id('l6old'), '2026-11-01', 10000000),
  (tests.id('p6new1'), '2026-11-01', 20000000),
  (tests.id('p6re'), '2026-11-01', 10000000),
  (tests.id('p6fin'), '2026-11-01', 100000000),
  (tests.id('p1'), '2026-09-01', 200000000),
  (tests.id('pap'), '2026-08-01', 10000000),
  (tests.id('p5a'), '2026-10-01', 120000000),
  (tests.id('p5b'), '2026-10-01', 60000000),
  (tests.id('p9'), '2026-12-01', 180000000),
  (tests.id('p10r'), '2027-02-01', 30000000),
  (tests.id('l10'), '2027-01-01', 50000000),
  (tests.id('l10b'), '2027-01-01', 50000000);

insert into public.gastos (proyecto_id, fecha, monto_centavos) values
  (tests.id('p1'), '2026-09-02', 20000000);


-- Sin fila guardada, cambiar el sueldo cambia la fila de siempre (MN006) ---------------------------------

-- En la revisión 0 el taller no tiene sueldo ni fijos: la fila de siempre no tiene pasos. Un cobro de
-- la banqueta armado ahí (neta 10M, diezmo 1M, sin repartos) queda en la cola, y el sueldo cambia.
select tests.salir();
update public.ajustes
set sueldo_mensual_centavos = 100000000, costos_fijos_centavos = 30000000
where household_id = tests.id('household_a');
select tests.entrar_como(tests.id('a'));

select is(tests.revision(), 1, 'sin fila guardada, cambiar el sueldo y los fijos suma una revisión');

select throws_ok(
  $$ select tests.cobrar(tests.id('p0'), '2026-06-10', 10000000, 0, 1000000, 0, '[]', '{}') $$,
  'MN006', 'La fila cambió desde que la abriste.',
  'el cobro armado con la revisión de antes rebota con MN006: cambió la fila de siempre'
);

select throws_ok(
  $$ select tests.cobrar(tests.id('p0'), '2026-06-10', 10000000, 0, 1000000, 1, '[]', '{}') $$,
  'MN008', null,
  'y no con MN008, que es lo que saldría con la revisión nueva: la fila de siempre ahora tiene dos pasos'
);


-- Sin fila guardada: la app vieja y la nueva conviven (mayo, julio) ---------------------------------------

-- Mayo, una app vieja por el camino de antes. Neta 20M: diezmo 2M y sueldo 18M.
select is(
  (
    select dist_sueldo_centavos
    from public.cobrar_proyecto(
      tests.id('p8'), 1, '2026-05-10', 20000000, 0, 100000000, 30000000, 2000000, 18000000, 0, 0, 0, 0
    )
  ),
  18000000::bigint,
  'sin fila guardada, una app vieja cobra por el camino de antes'
);

-- Julio, una app nueva por la fila de siempre. Neta 150M: diezmo 15M, quedan 135M; Hogar recibe los
-- 100M del sueldo y Maun aparta los 30M de los costos fijos. Sobran 5M, que se quedan en Maun.
select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p7a'), '2026-07-05', 150000000, 0, 15000000, 1,
      jsonb_build_array(tests.r(1701, 1, 'hogar', 100000000), tests.r(1702, 2, 'maun', 30000000)),
      tests.mes('{hogar,maun}', '{0,0}')
    )
  ),
  'cobrado',
  'sin fila guardada, una app nueva cobra por la fila de siempre, con la revisión de los ajustes'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila = tests.fila_de_siempre(100000000, 30000000),
           dist_previo = tests.mes('{hogar,maun}', '{0,0}'), dist_diezmo_centavos, dist_remanente_centavos,
           dist_sueldo_centavos, dist_fijos_centavos, dist_tope_sueldo_centavos, dist_tope_fijos_centavos,
           dist_sueldo_mensual
    from public.proyectos where id = tests.id('p7a')
  $$,
  $$ values (1, true, true, 15000000::bigint, 135000000::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, true) $$,
  'congela la fila de siempre armada en ese momento, lo del mes y las columnas de siempre de columnasDeSiempre'
);

select is(
  tests.repartos_de(tests.id('p7a')),
  jsonb_build_array(
    tests.paso_de(1701, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 0, 100000000, 100000000, '2026-07-05'),
    tests.paso_de(1702, 2, 'maun', 'Maun', 'fijos', 30000000, 0, 30000000, 30000000, '2026-07-05')
  ),
  'y una fila de repartos por paso, con los ids del pedido'
);

select is(
  tests.libro_de(tests.id('p7a')),
  jsonb_build_array(
    tests.asiento('maun', 'hogar', -100000000, '2026-07-05'),
    tests.asiento('hogar', 'maun', 100000000, '2026-07-05')
  ),
  'en el libro, el sueldo pasa de Maun a Hogar y el paso de Maun no deja asiento: no se mueve a sí mismo'
);

-- Julio, después, una app vieja que no vio el cobro de la nueva: con el mes en cero el sueldo tiene
-- su tope entero y ella calcula diezmo 5M y sueldo 45M. La base suma los 100M que Hogar ya recibió
-- por los repartos, y los 30M de fijos que quedaron en Maun: los topes son 0 y se congela ajustada.
select results_eq(
  $$
    select dist_tope_sueldo_centavos, dist_sueldo_centavos, dist_remanente_centavos,
           dist_sueldo_previo_centavos, dist_fijos_previo_centavos
    from public.cobrar_proyecto(
      tests.id('p7b'), 1, '2026-07-20', 50000000, 0, 100000000, 30000000, 5000000, 45000000, 0, 0, 0, 0
    )
  $$,
  $$ values (0::bigint, 0::bigint, 45000000::bigint, 100000000::bigint, 30000000::bigint) $$,
  'una app vieja que cobra después de una nueva en el mismo mes cuenta sus repartos y se congela ajustada'
);

select is(
  (
    select sum(monto_centavos)::bigint
    from public.libro_mayor
    where tesoro_id = tests.id('hogar') and fecha >= '2026-07-01' and fecha < '2026-08-01' and not ya_en_la_apertura
  ),
  100000000::bigint,
  'julio le paga a Hogar un sueldo, no dos'
);


-- Lo del mes, con sus tres fuentes (noviembre, sin fila guardada) ----------------------------------------

-- Una app vieja: neta 40M, diezmo 4M y sueldo 36M.
select is(
  (
    select dist_sueldo_centavos
    from public.cobrar_proyecto(
      tests.id('p6old'), 1, '2026-11-02', 40000000, 0, 100000000, 30000000, 4000000, 36000000, 0, 0, 0, 0
    )
  ),
  36000000::bigint,
  'noviembre arranca con un cobro de antes que le da 36M a Hogar'
);

-- Un perdido de antes, sin sueldo y con diezmo: seña 10M, diezmo 1M y 9M a los costos fijos.
select is(
  (
    select dist_fijos_centavos
    from public.cerrar_perdido(
      tests.id('l6old'), 1, '2026-11-03', 10000000, 0, 0, 30000000, 1000000, 0, 9000000, 0, 1000, 36000000, 0
    )
  ),
  9000000::bigint,
  'y un perdido de antes que aparta 9M de costos fijos en Maun'
);

-- Por la fila de siempre, el mes lleva Hogar 36M (el sueldo del cobro de antes) y Maun 9M (los fijos
-- del perdido). Neta 20M: diezmo 2M, quedan 18M; a Hogar le faltan 64M y recibe los 18M.
select is(
  (
    select dist_previo
    from tests.cobrar(
      tests.id('p6new1'), '2026-11-04', 20000000, 0, 2000000, 1,
      jsonb_build_array(tests.r(1601, 1, 'hogar', 18000000), tests.r(1602, 2, 'maun', 0)),
      tests.mes('{hogar,maun}', '{36000000,9000000}')
    )
  ),
  tests.mes('{hogar,maun}', '{36000000,9000000}'),
  'lo del mes suma las liquidaciones de antes: su sueldo para Hogar y sus fijos para Maun'
);

-- Lo que se pasa a Maun para cubrir noviembre cuenta; lo que cubre diciembre, lo borrado y una
-- transferencia que no cubre nada, no.
insert into public.movimientos (id, fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos, cubre_el_mes) values
  (tests.rid(5001), '2026-11-06', 'transferencia', 'hogar', 'maun', 1000000, '2026-11-01'),
  (tests.rid(5002), '2026-11-06', 'transferencia', 'hogar', 'maun', 5000000, '2026-12-01'),
  (tests.rid(5003), '2026-11-06', 'transferencia', 'hogar', 'maun', 2000000, '2026-11-01'),
  (tests.rid(5004), '2026-11-06', 'transferencia', 'hogar', 'maun', 3000000, null);
update public.movimientos set deleted_at = now() where id = tests.rid(5003);

-- Hogar 36M + 18M del reparto de recién = 54M; Maun 9M + 0 del reparto + 1M cubierto = 10M. Neta 10M:
-- diezmo 1M y los 9M a Hogar, que todavía tiene 46M de tope.
select is(
  (
    select dist_previo
    from tests.cobrar(
      tests.id('p6re'), '2026-11-07', 10000000, 0, 1000000, 1,
      jsonb_build_array(tests.r(1611, 1, 'hogar', 9000000), tests.r(1612, 2, 'maun', 0)),
      tests.mes('{hogar,maun}', '{54000000,10000000}')
    )
  ),
  tests.mes('{hogar,maun}', '{54000000,10000000}'),
  'y los repartos vivos de otro cobro del mes, y lo que se pasó para cubrirlo'
);

select version from public.reabrir_proyecto(tests.id('p6re'), 2);

-- Reabierto ese cobro, sus 9M no cuentan: Hogar sigue en 54M y Maun en 10M. Neta 100M: diezmo 10M,
-- quedan 90M; Hogar recibe los 46M que le faltan, Maun aparta los 20M que le faltan y 24M quedan en Maun.
select is(
  (
    select dist_previo
    from tests.cobrar(
      tests.id('p6fin'), '2026-11-20', 100000000, 0, 10000000, 1,
      jsonb_build_array(tests.r(1621, 1, 'hogar', 46000000), tests.r(1622, 2, 'maun', 20000000)),
      tests.mes('{hogar,maun}', '{54000000,10000000}')
    )
  ),
  tests.mes('{hogar,maun}', '{54000000,10000000}'),
  'un reparto borrado de un cobro reabierto no cuenta, ni lo que cubre otro mes, ni lo borrado'
);

select is(
  tests.repartos_de(tests.id('p6fin')),
  jsonb_build_array(
    tests.paso_de(1621, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 54000000, 46000000, 46000000, '2026-11-20'),
    tests.paso_de(1622, 2, 'maun', 'Maun', 'fijos', 30000000, 10000000, 20000000, 20000000, '2026-11-20')
  ),
  'cada paso lleva lo que el tesoro ya tenía del mes y el tope que le quedaba'
);


-- Se guarda la fila --------------------------------------------------------------------------------------

select is(
  (select fila_version from public.guardar_la_fila(1, tests.fila_1())),
  2,
  'el taller guarda su fila: revisión 2'
);

select is(
  (
    select version
    from public.cobrar_proyecto(
      tests.id('p8'), 1, '2026-05-10', 20000000, 0, 100000000, 30000000, 2000000, 18000000, 0, 0, 0, 0
    )
  ),
  2,
  'el reenvío de un cobro de antes, después de guardar la fila, devuelve el proyecto: no sale MN025'
);

select is(
  (
    select version
    from public.cobrar_proyecto(
      tests.id('p7b'), 1, '2026-07-20', 50000000, 0, 100000000, 30000000, 5000000, 45000000, 0, 0, 0, 0
    )
  ),
  2,
  'y el de uno de antes que salió ajustado, también'
);

select throws_ok(
  $$ select public.cobrar_proyecto(tests.id('p5a'), 1, '2026-10-05', 120000000, 0, 100000000, 30000000, 12000000, 100000000, 8000000, 0, 0, 0) $$,
  'MN025', 'Actualizá la app para cobrar con tu fila.',
  'con fila guardada, una app vieja no cobra: repartiría distinto de lo que armó el dueño'
);

select throws_ok(
  $$ select public.cobrar_proyecto(tests.id('p1'), 1, '2026-09-10', 200000000, 20000000, 0, 0, 18000000, 0, 0, 162000000, 0, 0, false, 2, null, null) $$,
  '22004', null, 'la revisión de la fila viaja con sus repartos'
);


-- Un cobro por la fila (septiembre, F1) ------------------------------------------------------------------

-- Cobrado 200M y gastos 20M: neta 180M, diezmo 18M, quedan 162M. Hogar 100M, Gastos fijos 30M y
-- Materiales 5M: sobran 27M. Cocos 50% = 13.500.000, Inmuebles 30% = 8.100.000, y 5.400.000 quedan en
-- Maun. Las columnas de siempre: diezmo 18M y remanente 162M.

select throws_ok(
  $$ select tests.cobrar(tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 1, tests.r1(), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN006', 'La fila cambió desde que la abriste.',
  'un cobro armado con la revisión de antes de guardar la fila rebota'
);

select throws_ok(
  $$ select tests.cobrar(tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 2, jsonb_set(tests.r1(), '{2,monto_centavos}', '5000001'), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', 'La distribución que viste no es la que calcula la base: actualizá la app',
  'un reparto con otro monto, por un centavo, no es el de la base'
);

select throws_ok(
  $$ select tests.cobrar(tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 2, jsonb_set(jsonb_set(tests.r1(), '{3,tesoro_id}', to_jsonb(tests.id('inmuebles'))), '{4,tesoro_id}', to_jsonb(tests.id('cocos'))), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', null,
  'ni uno que le da la parte de Cocos a Inmuebles'
);

select throws_ok(
  $$ select tests.cobrar(tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 2, jsonb_set(tests.r1(), '{3,posicion}', '5'), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', null,
  'ni uno con la posición corrida'
);

select throws_ok(
  $$ select tests.cobrar(tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 2, tests.r1() - 4, tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', null,
  'ni uno al que le falta una parte'
);

select throws_ok(
  $$ select public.cobrar_proyecto(tests.id('p1'), 1, '2026-09-10', 200000000, 20000000, 0, 0, 18000000, 0, 0, 5400000, 0, 0, false, 2, tests.r1(), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', null,
  'las columnas de siempre van con columnasDeSiempre: el remanente es lo que pasa por Maun, no lo que queda'
);

select throws_ok(
  $$ select public.cobrar_proyecto(tests.id('p1'), 1, '2026-09-10', 200000000, 20000000, 0, 0, 18000000, 0, 0, 162000000, 100000000, 0, false, 2, tests.r1(), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN008', null,
  'y lo del mes de siempre va en cero: lo del mes viaja por tesoro'
);

select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p1'), '2026-09-10', 200000000, 20000000, 18000000, 2, tests.r1(),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'con la revisión, los repartos y las columnas de siempre que calcula la base, se cobra por la fila'
);

select results_eq(
  $$
    select fecha_cobro, dist_cobrado_centavos, dist_gastos_centavos, dist_diezmo_bp,
           dist_tope_sueldo_centavos, dist_tope_fijos_centavos, dist_diezmo_centavos, dist_sueldo_centavos,
           dist_fijos_centavos, dist_remanente_centavos, dist_objetivo_sueldo_centavos,
           dist_objetivo_fijos_centavos, dist_sueldo_mensual, dist_sueldo_previo_centavos,
           dist_fijos_previo_centavos
    from public.proyectos where id = tests.id('p1')
  $$,
  $$
    values ('2026-09-10'::date, 200000000::bigint, 20000000::bigint, 1000, 0::bigint, 0::bigint,
            18000000::bigint, 0::bigint, 0::bigint, 162000000::bigint, 0::bigint, 0::bigint, true,
            0::bigint, 0::bigint)
  $$,
  'las columnas de siempre: el diezmo, los topes, el sueldo y los fijos en cero y el remanente en neta − diezmo'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila = tests.fila_1(), dist_previo = tests.mes('{hogar,fijos,materiales}', '{0,0,0}'),
           reapertura_fila is null, version
    from public.proyectos where id = tests.id('p1')
  $$,
  $$ values (2, true, true, true, 2) $$,
  'y congela la revisión, la fila con la que repartió y lo que cada paso llevaba del mes'
);

select is(
  tests.repartos_de(tests.id('p1')),
  jsonb_build_array(
    tests.paso_de(1101, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 0, 100000000, 100000000, '2026-09-10'),
    tests.paso_de(1102, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 0, 30000000, 30000000, '2026-09-10'),
    tests.paso_de(1103, 3, 'materiales', 'Materiales', 'prioridad', 5000000, 0, 5000000, 5000000, '2026-09-10'),
    tests.parte_de(1104, 4, 'cocos', 'Cocos', 5000, 13500000, '2026-09-10'),
    tests.parte_de(1105, 5, 'inmuebles', 'Inmuebles', 3000, 8100000, '2026-09-10')
  ),
  'una fila de repartos por paso y por parte, pasos primero, con los ids del pedido y el nombre del tesoro'
);

select is(
  (
    select version
    from public.cobrar_proyecto(
      tests.id('p1'), 1, '2026-09-10', 200000000, 20000000, 0, 0, 18000000, 0, 0, 162000000, 0, 0, false, 2,
      tests.r1(), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  2,
  'el reenvío idéntico de la cola devuelve el proyecto cobrado sin rechazar'
);

select is(
  (select count(*)::int from public.repartos where proyecto_id = tests.id('p1')),
  5,
  'y no escribe otros repartos'
);

select throws_ok(
  $$ select public.cobrar_proyecto(tests.id('p1'), 1, '2026-09-10', 200000000, 20000000, 0, 0, 18000000, 0, 0, 162000000, 0, 0, false, 2, jsonb_set(tests.r1(), '{0,id}', to_jsonb(tests.rid(1199))), tests.mes('{hogar,fijos,materiales}', '{0,0,0}')) $$,
  'MN001', null,
  'un pedido con otros ids no es el reenvío: el proyecto ya está cobrado'
);

select is(
  tests.libro_de(tests.id('p1')),
  jsonb_build_array(
    tests.asiento('maun', 'hogar', -100000000, '2026-09-10'),
    tests.asiento('maun', 'fijos', -30000000, '2026-09-10'),
    tests.asiento('maun', 'cocos', -13500000, '2026-09-10'),
    tests.asiento('maun', 'inmuebles', -8100000, '2026-09-10'),
    tests.asiento('maun', 'materiales', -5000000, '2026-09-10'),
    tests.asiento('materiales', 'maun', 5000000, '2026-09-10'),
    tests.asiento('inmuebles', 'maun', 8100000, '2026-09-10'),
    tests.asiento('cocos', 'maun', 13500000, '2026-09-10'),
    tests.asiento('fijos', 'maun', 30000000, '2026-09-10'),
    tests.asiento('hogar', 'maun', 100000000, '2026-09-10')
  ),
  'en el libro, cada reparto pasa de Maun a su tesoro, como Distribución y con la fecha del cobro'
);

select results_eq(
  $$
    select tesoro::text, monto_centavos from public.libro_mayor
    where proyecto_id = tests.id('p1') and origen = 'distribucion'
    order by monto_centavos
  $$,
  $$ values ('maun', -18000000::bigint), ('diezmo', 18000000::bigint) $$,
  'el diezmo sigue pasando por la distribución de siempre, y el sueldo en cero no deja asiento'
);


-- Lo que ya estaba en los saldos de la apertura (agosto, F1) ---------------------------------------------

select tests.salir();
insert into public.movimientos (household_id, fecha, tipo, tesoro_destino, monto_centavos, categoria, descripcion)
  values (tests.id('household_a'), '2026-09-14', 'ajuste', 'maun', 100000000, 'Apertura', 'Apertura');
select tests.entrar_como(tests.id('a'));

-- Neta 10M: diezmo 1M y los 9M a Hogar. Los demás pasos y las partes reciben cero.
select is(
  (
    select reparto_ya_en_la_apertura
    from tests.cobrar(
      tests.id('pap'), '2026-08-20', 10000000, 0, 1000000, 2,
      jsonb_build_array(
        tests.r(1201, 1, 'hogar', 9000000), tests.r(1202, 2, 'fijos', 0), tests.r(1203, 3, 'materiales', 0),
        tests.r(1204, 4, 'cocos', 0), tests.r(1205, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}'),
      true
    )
  ),
  true,
  'un cobro por la fila de antes de la apertura se marca como ya incluido en ella'
);

select results_eq(
  $$
    select count(*)::int, count(*) filter (where ya_en_la_apertura)::int, min(fecha), max(fecha)
    from public.repartos where proyecto_id = tests.id('pap') and deleted_at is null
  $$,
  $$ values (5, 5, '2026-08-20'::date, '2026-08-20'::date) $$,
  'y sus repartos llevan la marca y la fecha del cobro'
);

select is(
  tests.libro_de(tests.id('pap')),
  jsonb_build_array(
    tests.asiento('maun', 'hogar', -9000000, '2026-08-20', true),
    tests.asiento('hogar', 'maun', 9000000, '2026-08-20', true)
  ),
  'en el libro quedan marcados, y los repartos en cero no dejan asiento'
);

select results_eq(
  format(
    $$
      select t.nombre, sum(l.monto_centavos)::bigint
      from public.libro_mayor l
      join public.tesoros t on t.id = l.tesoro_id
      where l.tesoro_id in (%L, %L, %L, %L) and not l.ya_en_la_apertura
      group by t.nombre
      order by t.nombre
    $$,
    tests.id('cocos'), tests.id('fijos'), tests.id('inmuebles'), tests.id('materiales')
  ),
  $$
    values ('Cocos', 13500000::bigint), ('Gastos fijos', 30000000::bigint),
           ('Inmuebles', 8100000::bigint), ('Materiales', 5000000::bigint)
  $$,
  'el saldo de cada tesoro sale de sumar sus asientos por tesoro_id, sin lo que ya estaba en la apertura'
);


-- Lo del mes que vio la app no es el de la base (octubre, F1) -------------------------------------------

-- El primer cobro: neta 120M, diezmo 12M, quedan 108M. Hogar 100M y Gastos fijos los 8M que quedan.
select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p5a'), '2026-10-05', 120000000, 0, 12000000, 2,
      jsonb_build_array(
        tests.r(1501, 1, 'hogar', 100000000), tests.r(1502, 2, 'fijos', 8000000), tests.r(1503, 3, 'materiales', 0),
        tests.r(1504, 4, 'cocos', 0), tests.r(1505, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'octubre arranca con un cobro que llena el sueldo y deja 8M en Gastos fijos'
);

-- El segundo, desde un aparato que no vio el primero. Con el mes en cero: neta 60M, diezmo 6M, y los
-- 54M a Hogar. Con lo de la base (Hogar 100M, Gastos fijos 8M): Hogar 0, Gastos fijos los 22M que le
-- faltan, Materiales 5M, sobran 27M: Cocos 13.500.000, Inmuebles 8.100.000 y 5.400.000 en Maun.
select throws_ok(
  $$
    select tests.cobrar(
      tests.id('p5b'), '2026-10-20', 60000000, 0, 6000000, 2,
      jsonb_build_array(
        tests.r(1521, 1, 'hogar', 0), tests.r(1522, 2, 'fijos', 22000000), tests.r(1523, 3, 'materiales', 5000000),
        tests.r(1524, 4, 'cocos', 13500000), tests.r(1525, 5, 'inmuebles', 8100000)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  $$,
  'MN008', null,
  'la cuenta de la app tiene que dar con lo que dice haber visto: con el mes en cero, Hogar recibía 54M'
);

select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p5b'), '2026-10-20', 60000000, 0, 6000000, 2,
      jsonb_build_array(
        tests.r(1521, 1, 'hogar', 54000000), tests.r(1522, 2, 'fijos', 0), tests.r(1523, 3, 'materiales', 0),
        tests.r(1524, 4, 'cocos', 0), tests.r(1525, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'con su cuenta bien hecha sobre el mes que vio, el cobro no se rechaza'
);

select is(
  (select dist_previo from public.proyectos where id = tests.id('p5b')),
  tests.mes('{hogar,fijos,materiales}', '{100000000,8000000,0}'),
  'se congela con lo del mes de la base: comparándolo con lo que mandó, la app sabe que se ajustó'
);

select is(
  tests.repartos_de(tests.id('p5b')),
  jsonb_build_array(
    tests.paso_de(1521, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 100000000, 0, 0, '2026-10-20'),
    tests.paso_de(1522, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 8000000, 22000000, 22000000, '2026-10-20'),
    tests.paso_de(1523, 3, 'materiales', 'Materiales', 'prioridad', 5000000, 0, 5000000, 5000000, '2026-10-20'),
    tests.parte_de(1524, 4, 'cocos', 'Cocos', 5000, 13500000, '2026-10-20'),
    tests.parte_de(1525, 5, 'inmuebles', 'Inmuebles', 3000, 8100000, '2026-10-20')
  ),
  'y los repartos llevan los ids del pedido con los montos de la base'
);

select is(
  (
    select version
    from public.cobrar_proyecto(
      tests.id('p5b'), 1, '2026-10-20', 60000000, 0, 0, 0, 6000000, 0, 0, 54000000, 0, 0, false, 2,
      jsonb_build_array(
        tests.r(1521, 1, 'hogar', 54000000), tests.r(1522, 2, 'fijos', 0), tests.r(1523, 3, 'materiales', 0),
        tests.r(1524, 4, 'cocos', 0), tests.r(1525, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  2,
  'el reenvío de un cobro que salió ajustado también se reconoce'
);


-- Reabrir un cobro por la fila (diciembre y febrero, F1) ------------------------------------------------

-- Neta 180M, sin nada en el mes para los pasos: los mismos repartos que el cobro de septiembre.
select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p9'), '2026-12-10', 180000000, 0, 18000000, 2,
      jsonb_build_array(
        tests.r(1901, 1, 'hogar', 100000000), tests.r(1902, 2, 'fijos', 30000000), tests.r(1903, 3, 'materiales', 5000000),
        tests.r(1904, 4, 'cocos', 13500000), tests.r(1905, 5, 'inmuebles', 8100000)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'diciembre se cobra por la fila'
);

-- Neta 30M: diezmo 3M y los 27M a Hogar.
select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p10r'), '2027-02-10', 30000000, 0, 3000000, 2,
      jsonb_build_array(
        tests.r(2001, 1, 'hogar', 27000000), tests.r(2002, 2, 'fijos', 0), tests.r(2003, 3, 'materiales', 0),
        tests.r(2004, 4, 'cocos', 0), tests.r(2005, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'y febrero también'
);

select is(
  (select estado::text from public.reabrir_proyecto(tests.id('p9'), 2)),
  'entregado',
  'reabrir el cobro de diciembre lo vuelve a entregado'
);

select results_eq(
  $$
    select reapertura_fila = jsonb_build_object('version', 2, 'fila', tests.fila_1()), reapertura_fecha_cobro,
           reapertura_objetivo_sueldo_centavos, reapertura_objetivo_fijos_centavos, reapertura_sueldo_mensual,
           dist_fila_version is null and dist_fila is null and dist_previo is null
    from public.proyectos where id = tests.id('p9')
  $$,
  $$ values (true, '2026-12-10'::date, 0::bigint, 0::bigint, true, true) $$,
  'guarda la fila con su revisión en reapertura_fila, la foto de siempre con lo de columnasDeSiempre, y descongela'
);

select results_eq(
  $$
    select count(*) filter (where deleted_at is null)::int, count(*) filter (where deleted_at is not null)::int
    from public.repartos where proyecto_id = tests.id('p9')
  $$,
  $$ values (0, 5) $$,
  'y sus repartos quedan borrados, no eliminados: el delta se los lleva'
);

select is_empty(
  $$ select 1 from public.libro_mayor where proyecto_id = tests.id('p9') and origen in ('reparto', 'distribucion') $$,
  'salen del libro'
);

select version from public.reabrir_proyecto(tests.id('p10r'), 2);
update public.proyectos set estado = 'en_curso' where id = tests.id('p10r');


-- La fila cambia (F2) ----------------------------------------------------------------------------------

select is(
  (select fila_version from public.guardar_la_fila(2, tests.fila_2())),
  3,
  'el taller guarda otra fila: revisión 3'
);

-- Con F2 el cobro de diciembre repartiría Materiales 8M y Cocos 60%, pero el reabierto va con su foto.
select throws_ok(
  $$
    select tests.cobrar(
      tests.id('p9'), '2026-12-10', 180000000, 0, 18000000, 3,
      jsonb_build_array(
        tests.r(1911, 1, 'hogar', 100000000), tests.r(1912, 2, 'fijos', 30000000), tests.r(1913, 3, 'materiales', 8000000),
        tests.r(1914, 4, 'cocos', 14400000)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  $$,
  'MN006', null,
  'volver a cobrar un reabierto con la fila de hoy rebota: se cobra con la fila con la que se había cobrado'
);


-- El perdido (enero de 2027, F2) ------------------------------------------------------------------------

select throws_ok(
  $$ select public.cerrar_perdido(tests.id('l10'), 1, '2027-01-15', 50000000, 0, 0, 30000000, 5000000, 0, 30000000, 15000000, 1000, 0, 0) $$,
  'MN025', null,
  'con fila guardada, una app vieja tampoco cierra un perdido'
);

-- Por defecto un perdido paga diezmo y no sueldo. Seña 50M: diezmo 5M, quedan 45M. Hogar tiene su
-- objetivo en cero y no recibe; Gastos fijos 30M, Materiales 8M, sobran 7M: Cocos 60% = 4.200.000 y
-- 2.800.000 en Maun.
select is(
  (
    select estado::text
    from tests.cerrar(
      tests.id('l10'), '2027-01-15', 50000000, 0, 1000, 5000000, 3,
      jsonb_build_array(
        tests.r(3001, 1, 'hogar', 0), tests.r(3002, 2, 'fijos', 30000000), tests.r(3003, 3, 'materiales', 8000000),
        tests.r(3004, 4, 'cocos', 4200000)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'perdido',
  'un perdido se cierra por la fila de los ajustes'
);

select results_eq(
  $$
    select dist_diezmo_bp, dist_diezmo_centavos, dist_remanente_centavos, dist_fila_version, dist_fila = tests.fila_2()
    from public.proyectos where id = tests.id('l10')
  $$,
  $$ values (1000, 5000000::bigint, 45000000::bigint, 3, true) $$,
  'con el diezmo, porque perdido_con_diezmo está prendido'
);

select is(
  tests.repartos_de(tests.id('l10')),
  jsonb_build_array(
    tests.paso_de(3001, 1, 'hogar', 'Hogar', 'sueldo', 0, 0, 0, 0, '2027-01-15'),
    tests.paso_de(3002, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 0, 30000000, 30000000, '2027-01-15'),
    tests.paso_de(3003, 3, 'materiales', 'Materiales', 'prioridad', 8000000, 0, 8000000, 8000000, '2027-01-15'),
    tests.parte_de(3004, 4, 'cocos', 'Cocos', 6000, 4200000, '2027-01-15')
  ),
  'y el sueldo con objetivo en cero, porque perdido_con_sueldo está apagado; los demás pasos, iguales'
);

update public.ajustes set perdido_con_sueldo = true, perdido_con_diezmo = false
where household_id = tests.id('household_a');

select is(tests.revision(), 4, 'dar vuelta los dos parámetros del perdido suma una revisión');

-- Sin diezmo y con sueldo. El mes ya lleva Gastos fijos 30M y Materiales 8M del perdido anterior. Seña
-- 50M: Hogar tiene 100M de tope y se lleva los 50M; los demás, completos, no reciben.
select is(
  (
    select estado::text
    from tests.cerrar(
      tests.id('l10b'), '2027-01-20', 50000000, 0, 0, 0, 4,
      jsonb_build_array(
        tests.r(4001, 1, 'hogar', 50000000), tests.r(4002, 2, 'fijos', 0), tests.r(4003, 3, 'materiales', 0),
        tests.r(4004, 4, 'cocos', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,30000000,8000000}')
    )
  ),
  'perdido',
  'con los parámetros dados vuelta, el mismo cierre'
);

select results_eq(
  $$
    select dist_diezmo_bp, dist_diezmo_centavos, dist_remanente_centavos,
           dist_previo = tests.mes('{hogar,fijos,materiales}', '{0,30000000,8000000}')
    from public.proyectos where id = tests.id('l10b')
  $$,
  $$ values (0, 0::bigint, 50000000::bigint, true) $$,
  'va sin diezmo'
);

select is(
  tests.repartos_de(tests.id('l10b')),
  jsonb_build_array(
    tests.paso_de(4001, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 0, 100000000, 50000000, '2027-01-20'),
    tests.paso_de(4002, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 30000000, 0, 0, '2027-01-20'),
    tests.paso_de(4003, 3, 'materiales', 'Materiales', 'prioridad', 8000000, 8000000, 0, 0, '2027-01-20'),
    tests.parte_de(4004, 4, 'cocos', 'Cocos', 6000, 0, '2027-01-20')
  ),
  'y le paga el sueldo a Hogar'
);

update public.ajustes set perdido_con_sueldo = false, perdido_con_diezmo = true
where household_id = tests.id('household_a');

-- El de febrero se había cobrado con F1, se reabrió y volvió a la obra. Cerrado como perdido, va por
-- F2, la de los ajustes: seña 30M, diezmo 3M, Hogar sin objetivo, y Gastos fijos se lleva los 27M.
select throws_ok(
  $$
    select tests.cerrar(
      tests.id('p10r'), '2027-02-20', 30000000, 0, 1000, 3000000, 2,
      jsonb_build_array(
        tests.r(2011, 1, 'hogar', 0), tests.r(2012, 2, 'fijos', 27000000), tests.r(2013, 3, 'materiales', 0),
        tests.r(2014, 4, 'cocos', 0), tests.r(2015, 5, 'inmuebles', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  $$,
  'MN006', null,
  'el perdido de un reabierto no usa la foto de la reapertura: con la revisión de la foto rebota'
);

select is(
  (
    select estado::text
    from tests.cerrar(
      tests.id('p10r'), '2027-02-20', 30000000, 0, 1000, 3000000, 5,
      jsonb_build_array(
        tests.r(2011, 1, 'hogar', 0), tests.r(2012, 2, 'fijos', 27000000), tests.r(2013, 3, 'materiales', 0),
        tests.r(2014, 4, 'cocos', 0)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'perdido',
  'se cierra con la fila de los ajustes y su revisión'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila = tests.fila_2(), reapertura_fila is null, reapertura_fecha_cobro is null
    from public.proyectos where id = tests.id('p10r')
  $$,
  $$ values (5, true, true, true) $$,
  'y deja la foto de la reapertura en null'
);

select is(
  tests.repartos_de(tests.id('p10r')),
  jsonb_build_array(
    tests.paso_de(2011, 1, 'hogar', 'Hogar', 'sueldo', 0, 0, 0, 0, '2027-02-20'),
    tests.paso_de(2012, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 0, 30000000, 27000000, '2027-02-20'),
    tests.paso_de(2013, 3, 'materiales', 'Materiales', 'prioridad', 8000000, 0, 8000000, 0, '2027-02-20'),
    tests.parte_de(2014, 4, 'cocos', 'Cocos', 6000, 0, '2027-02-20')
  ),
  'con los repartos de F2'
);


-- De vuelta a la fila de siempre ----------------------------------------------------------------------------

select is(
  (select fila_version from public.guardar_la_fila(5, null)),
  6,
  'el taller vuelve a la fila de siempre: revisión 6'
);

select throws_ok(
  format(
    $$ select public.cobrar_proyecto(%L, %s, '2026-12-10', 180000000, 0, 100000000, 30000000, 18000000, 100000000, 30000000, 32000000, 0, 0) $$,
    tests.id('p9'), (select version from public.proyectos where id = tests.id('p9'))
  ),
  'MN025', null,
  'sin fila guardada, una app vieja igual no vuelve a cobrar un reabierto que se cobró por la fila'
);

-- Diciembre sigue sin nada para los pasos: los mismos montos del cobro original, con ids nuevos.
select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p9'), '2026-12-10', 180000000, 0, 18000000, 2,
      jsonb_build_array(
        tests.r(1911, 1, 'hogar', 100000000), tests.r(1912, 2, 'fijos', 30000000), tests.r(1913, 3, 'materiales', 5000000),
        tests.r(1914, 4, 'cocos', 13500000), tests.r(1915, 5, 'inmuebles', 8100000)
      ),
      tests.mes('{hogar,fijos,materiales}', '{0,0,0}')
    )
  ),
  'cobrado',
  'una app nueva lo vuelve a cobrar con la fila y la revisión de la foto, aunque la fila de hoy sea otra'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila = tests.fila_1(), reapertura_fila is null, reapertura_fecha_cobro is null
    from public.proyectos where id = tests.id('p9')
  $$,
  $$ values (2, true, true, true) $$,
  'congela F1 con su revisión y limpia la foto'
);

select is(
  tests.repartos_de(tests.id('p9')),
  jsonb_build_array(
    tests.paso_de(1911, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 0, 100000000, 100000000, '2026-12-10'),
    tests.paso_de(1912, 2, 'fijos', 'Gastos fijos', 'fijos', 30000000, 0, 30000000, 30000000, '2026-12-10'),
    tests.paso_de(1913, 3, 'materiales', 'Materiales', 'prioridad', 5000000, 0, 5000000, 5000000, '2026-12-10'),
    tests.parte_de(1914, 4, 'cocos', 'Cocos', 5000, 13500000, '2026-12-10'),
    tests.parte_de(1915, 5, 'inmuebles', 'Inmuebles', 3000, 8100000, '2026-12-10')
  ),
  'con los repartos nuevos y los de antes borrados'
);


-- Reabrir un cobro de antes (mayo) ---------------------------------------------------------------------------

select results_eq(
  $$
    select reapertura_fila, reapertura_objetivo_sueldo_centavos, reapertura_objetivo_fijos_centavos,
           reapertura_sueldo_mensual, reapertura_fecha_cobro
    from public.reabrir_proyecto(tests.id('p8'), 2)
  $$,
  $$ values (null::jsonb, 100000000::bigint, 30000000::bigint, true, '2026-05-10'::date) $$,
  'reabrir un cobro de antes no deja fila en la foto: guarda sus objetivos, como siempre'
);

-- Con sus objetivos, la fila de siempre: Hogar 100M y Maun 30M. Neta 20M: diezmo 2M y 18M a Hogar.
select throws_ok(
  $$
    select tests.cobrar(
      tests.id('p8'), '2026-05-10', 20000000, 0, 2000000, 6,
      jsonb_build_array(tests.r(1801, 1, 'hogar', 18000000), tests.r(1802, 2, 'maun', 0)),
      tests.mes('{hogar,maun}', '{0,0}')
    )
  $$,
  'MN006', null,
  'volver a cobrarlo con la revisión de los ajustes rebota: la fila armada con la foto es la revisión 0'
);

select is(
  (
    select estado::text
    from tests.cobrar(
      tests.id('p8'), '2026-05-10', 20000000, 0, 2000000, 0,
      jsonb_build_array(tests.r(1801, 1, 'hogar', 18000000), tests.r(1802, 2, 'maun', 0)),
      tests.mes('{hogar,maun}', '{0,0}')
    )
  ),
  'cobrado',
  'una app nueva lo vuelve a cobrar por la fila de siempre armada con sus objetivos'
);

select results_eq(
  $$
    select dist_fila_version, dist_fila = tests.fila_de_siempre(100000000, 30000000)
    from public.proyectos where id = tests.id('p8')
  $$,
  $$ values (0, true) $$,
  'y congela esa fila con la revisión 0'
);

select is(
  tests.repartos_de(tests.id('p8')),
  jsonb_build_array(
    tests.paso_de(1801, 1, 'hogar', 'Hogar', 'sueldo', 100000000, 0, 100000000, 18000000, '2026-05-10'),
    tests.paso_de(1802, 2, 'maun', 'Maun', 'fijos', 30000000, 0, 30000000, 0, '2026-05-10')
  ),
  'con sus repartos'
);


-- Reactivar un perdido por la fila -----------------------------------------------------------------------

select results_eq(
  $$
    select estado::text, reapertura_fila is null, reapertura_fecha_cobro is null, dist_fila_version is null
    from public.reactivar_perdido(tests.id('l10'), 2, 'contacto')
  $$,
  $$ values ('contacto', true, true, true) $$,
  'reactivar un perdido que se cerró por la fila no deja foto: un cierre posterior es un evento nuevo'
);

select results_eq(
  $$
    select count(*) filter (where deleted_at is null)::int, count(*) filter (where deleted_at is not null)::int
    from public.repartos where proyecto_id = tests.id('l10')
  $$,
  $$ values (0, 4) $$,
  'y sus repartos quedan borrados'
);


-- La tabla de los repartos -------------------------------------------------------------------------------

select ok(
  has_table_privilege('authenticated', 'public.repartos', 'SELECT')
    and not has_any_column_privilege('authenticated', 'public.repartos', 'INSERT')
    and not has_any_column_privilege('authenticated', 'public.repartos', 'UPDATE'),
  'la app lee los repartos y no los escribe: los escriben la liquidación y la reversión'
);

select throws_ok(
  $$ update public.repartos set monto_centavos = 0 where id = tests.rid(1101) $$,
  '42501', null, 'así un reparto congelado no se toca'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'private.lo_del_mes_es_otro(uuid[], uuid[], jsonb, jsonb)',
      'private.entero_de_json(jsonb)',
      'private.repartir_por_la_fila(bigint, bigint, integer[], text[], bigint[], bigint[], boolean[], integer[], bigint[])',
      'private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid, uuid)',
      'private.problema_de_la_fila(jsonb, jsonb)',
      'private.plan_del_reparto(text, jsonb, boolean, boolean, uuid, uuid)',
      'private.previo_del_mes(uuid[], bigint[], text[], boolean[], uuid[], boolean[], jsonb, jsonb, jsonb)'
    ]) as f (firma)
    cross join unnest(array['anon', 'authenticated']) as r (rol)
    where has_function_privilege(r.rol, f.firma, 'execute')
  ),
  'ni anon ni authenticated ejecutan las gemelas de la fila ni la comparación de lo que vio la app: solo las llama la liquidación'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace = 'private'::regnamespace
      and p.proname in ('lo_del_mes_es_otro', 'repartir_por_la_fila', 'fila_de_siempre', 'plan_del_reparto')
      and p.oid::regprocedure::text not in (
        'private.lo_del_mes_es_otro(uuid[],uuid[],jsonb,jsonb)',
        'private.repartir_por_la_fila(bigint,bigint,integer[],text[],bigint[],bigint[],boolean[],integer[],bigint[])',
        'private.fila_de_siempre(bigint,bigint,boolean,uuid,uuid,uuid)',
        'private.plan_del_reparto(text,jsonb,boolean,boolean,uuid,uuid)'
      )
  $$,
  'de cada gemela que cambió de firma queda una sola versión: la de los tipos de tesoro'
);

select tests.salir();

select throws_ok(
  format(
    $$
      insert into public.repartos (household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase,
        objetivo_centavos, previo_centavos, tope_centavos, por_mes, monto_centavos, fecha)
      values (%L, %L, 9, %L, 'Hogar', 'paso', 'sueldo', 100, 0, 100, true, 101, '2026-09-10')
    $$,
    tests.id('household_a'), tests.id('p1'), tests.id('hogar')
  ),
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'un paso no recibe más que su tope, ni siquiera escrito por el dueño de la base'
);

select tests.entrar_como(tests.id('a'));

update public.tesoros set nombre = 'Fijos del taller' where id = tests.id('fijos');

select is(
  (select nombre from public.repartos where id = tests.rid(1102)),
  'Gastos fijos',
  'renombrar un tesoro no cambia sus repartos: siguen con el nombre que tenía al liquidar'
);

select tests.entrar_como(tests.id('b'));

select is_empty(
  $$ select 1 from public.repartos $$,
  'B no ve ninguno de los repartos de A'
);

select * from finish();
