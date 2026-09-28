-- Los tipos de tesoro (ADR 0078, los tipos de tesoro de Eliseo): las obligaciones sobre lo cobrado o
-- sobre el ingreso, en el orden que elija; cómo se llena cada paso (por mes, se renueva al pagar o se
-- repone al usarlo, por trabajo); los ahorros hasta la meta; el superávit en otro tesoro; la fila del
-- primer pedido, que se sigue leyendo; lo que no se archiva (MN024) y lo que no se guarda (MN023).
--
-- Taller A, con los cuatro de siempre y los del dueño: Ingresos Brutos, Gastos fijos (el alquiler de
-- $ 500.000 que vence el 10 y la luz de $ 400.000), Stock del taller, Maquinaria e Inmueble (con meta
-- de $ 300.000 cada uno), Superávit, Viajes (sin meta) y uno archivado. Cada caso cae en su mes, así
-- lo del mes de uno no toca al otro. Los montos van en centavos; en los comentarios, en pesos. Las
-- cuentas son las de fila.ts: cada obligación es su porcentaje de lo cobrado o de lo que le llega,
-- redondeado como el diezmo; cada paso recibe hasta lo que le falta según su modo; cada parte, su
-- porcentaje de lo que sobra hacia abajo al centavo y sin pasar lo que le falta para su meta; el resto
-- es del superávit. Las columnas de siempre van con columnasDeSiempre: el diezmo es la obligación del
-- diezmo y el remanente, el ingreso menos el diezmo.

select plan(83);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));


-- Las piezas del test ----------------------------------------------------------------------------------------

-- Los ids de los tesoros del dueño, los trabajos y los repartos: aaaaaaaa-0000-7000-8000-00000000nnnn.
create function tests.rid(p_n integer)
returns uuid
language sql
immutable
as $$
  select ('aaaaaaaa-0000-7000-8000-' || lpad(p_n::text, 12, '0'))::uuid
$$;

select tests.guardar('hogar', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'hogar'));
select tests.guardar('maun', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'maun'));
select tests.guardar('diezmo', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'diezmo'));
select tests.guardar('cocos', (select id from public.tesoros where household_id = tests.id('household_a') and clave = 'cocos'));
select tests.guardar('iibb', tests.rid(101));
select tests.guardar('fijos', tests.rid(102));
select tests.guardar('stock', tests.rid(103));
select tests.guardar('maquinaria', tests.rid(104));
select tests.guardar('inmueble', tests.rid(105));
select tests.guardar('superavit', tests.rid(106));
select tests.guardar('viejo', tests.rid(107));
select tests.guardar('viajes', tests.rid(108));

-- El código y el detalle de un rechazo: MN023 dice qué problema tiene la fila y MN024 por qué no se
-- archiva.
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

create function tests.obligacion(p_tesoro text, p_porcentaje integer, p_base text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object('tesoro', tests.id(p_tesoro), 'porcentaje', p_porcentaje, 'base', p_base)
$$;

create function tests.diezmo(p_porcentaje integer default 1000)
returns jsonb
language sql
stable
as $$
  select tests.obligacion('diezmo', p_porcentaje, 'ingreso')
$$;

create function tests.paso(
  p_tesoro text, p_clase text, p_tope bigint, p_modo text default 'mes', p_hasta_la_meta boolean default false,
  p_renglones jsonb default '[]'
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'tesoro', tests.id(p_tesoro), 'clase', p_clase, 'tope', p_tope, 'renglones', p_renglones, 'desde', null,
    'modo', p_modo, 'hastaLaMeta', p_hasta_la_meta
  )
$$;

create function tests.parte(p_tesoro text, p_porcentaje integer, p_hasta_la_meta boolean default false)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object('tesoro', tests.id(p_tesoro), 'porcentaje', p_porcentaje, 'hastaLaMeta', p_hasta_la_meta)
$$;

create function tests.fila(
  p_obligaciones jsonb, p_pasos jsonb default '[]', p_reparto jsonb default '[]', p_superavit text default 'maun'
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'obligaciones', p_obligaciones, 'pasos', p_pasos, 'reparto', p_reparto,
    'superavit', tests.id(p_superavit), 'sueldoPorTrabajo', false
  )
$$;

-- Gastos fijos: el alquiler vence el 10 y la luz no tiene día.
create function tests.renglones()
returns jsonb
language sql
immutable
as $$
  select '[{"nombre": "Alquiler", "monto": 50000000, "dia": 10}, {"nombre": "Luz", "monto": 40000000, "dia": null}]'::jsonb
$$;

-- La fila de Eliseo, válida: Ingresos Brutos antes del diezmo; el sueldo, los gastos fijos que se
-- renuevan al pagar, el stock por trabajo y la maquinaria hasta su meta; el inmueble hasta su meta y
-- Cocos por porcentaje; lo que sobra, al Superávit.
create function tests.fila_de_eliseo()
returns jsonb
language sql
stable
as $$
  select tests.fila(
    jsonb_build_array(tests.obligacion('iibb', 350, 'cobrado'), tests.diezmo()),
    jsonb_build_array(
      tests.paso('hogar', 'sueldo', 100000000),
      tests.paso('fijos', 'fijos', 90000000, 'saldo', false, tests.renglones()),
      tests.paso('stock', 'prioridad', 10000000, 'trabajo'),
      tests.paso('maquinaria', 'prioridad', 20000000, 'mes', true)
    ),
    jsonb_build_array(tests.parte('inmueble', 2000, true), tests.parte('cocos', 3000)),
    'superavit'
  )
$$;

create function tests.revision()
returns integer
language sql
stable
as $$
  select fila_version from public.ajustes where household_id = tests.id('household_a')
$$;

create function tests.guardar_la_fila(p_fila jsonb)
returns integer
language sql
as $$
  select fila_version from public.guardar_la_fila(tests.revision(), p_fila)
$$;

-- Un trabajo del taller con lo que se cobró y lo que se gastó.
create function tests.trabajo(p_n integer, p_titulo text, p_estado text, p_cobrado bigint, p_gastos bigint, p_fecha date)
returns uuid
language plpgsql
as $$
begin
  insert into public.proyectos (id, cliente_id, titulo, estado)
    values (tests.rid(p_n), tests.rid(1), p_titulo, p_estado::public.estado_proyecto);
  if p_cobrado > 0 then
    insert into public.pagos (proyecto_id, fecha, monto_centavos) values (tests.rid(p_n), p_fecha, p_cobrado);
  end if;
  if p_gastos > 0 then
    insert into public.gastos (proyecto_id, fecha, monto_centavos) values (tests.rid(p_n), p_fecha, p_gastos);
  end if;
  return tests.rid(p_n);
end;
$$;

-- Un reparto del pedido, como lo manda la app, y lo que vio: {tesoro_id: centavos}.
create function tests.r(p_n integer, p_posicion integer, p_tesoro text, p_monto bigint)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', tests.rid(p_n), 'posicion', p_posicion, 'tesoro_id', tests.id(p_tesoro), 'monto_centavos', p_monto
  )
$$;

create function tests.visto(p_tesoros text[], p_montos bigint[])
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_object_agg(tests.id(u.t)::text, u.m), '{}'::jsonb) from unnest(p_tesoros, p_montos) as u (t, m)
$$;

-- Un cobro o un cierre por la fila de hoy, con las columnas de siempre de columnasDeSiempre: topes,
-- sueldo, fijos y lo del mes en cero, el diezmo y el remanente en el ingreso menos el diezmo.
create function tests.cobrar(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_diezmo bigint, p_repartos jsonb, p_previo jsonb
)
returns public.proyectos
language sql
as $$
  select * from public.cobrar_proyecto(
    p_proyecto, (select version from public.proyectos where id = p_proyecto), p_fecha, p_cobrado, p_gastos,
    0, 0, p_diezmo, 0, 0, p_cobrado - p_gastos - p_diezmo, 0, 0, false, tests.revision(), p_repartos, p_previo
  )
$$;

create function tests.cerrar(
  p_proyecto uuid, p_fecha date, p_cobrado bigint, p_gastos bigint, p_diezmo_bp integer, p_diezmo bigint,
  p_repartos jsonb, p_previo jsonb
)
returns public.proyectos
language sql
as $$
  select * from public.cerrar_perdido(
    p_proyecto, (select version from public.proyectos where id = p_proyecto), p_fecha, p_cobrado, p_gastos,
    0, 0, p_diezmo, 0, 0, p_cobrado - p_gastos - p_diezmo, p_diezmo_bp, 0, 0, false, tests.revision(),
    p_repartos, p_previo
  )
$$;

-- Los repartos vivos de un trabajo, renglón por renglón, y cómo se espera cada tipo.
create function tests.repartos_de(p_proyecto uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_array(
        r.posicion, r.nombre, r.tipo, r.clase, r.modo, r.objetivo_centavos, r.previo_centavos, r.tope_centavos,
        r.por_mes, r.porcentaje_bp, r.base, r.monto_centavos
      )
      order by r.posicion
    ),
    '[]'::jsonb
  )
  from public.repartos r
  where r.proyecto_id = p_proyecto and r.deleted_at is null
$$;

create function tests.obligacion_de(p_posicion integer, p_nombre text, p_porcentaje integer, p_base text, p_monto bigint)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(p_posicion, p_nombre, 'obligacion', null, null, null, null, null, null, p_porcentaje, p_base, p_monto)
$$;

create function tests.paso_de(
  p_posicion integer, p_nombre text, p_clase text, p_modo text, p_objetivo bigint, p_previo bigint, p_tope bigint,
  p_monto bigint
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(p_posicion, p_nombre, 'paso', p_clase, p_modo, p_objetivo, p_previo, p_tope, true, null, null, p_monto)
$$;

create function tests.parte_de(p_posicion integer, p_nombre text, p_porcentaje integer, p_tope bigint, p_monto bigint)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(p_posicion, p_nombre, 'parte', null, null, null, null, p_tope, null, p_porcentaje, null, p_monto)
$$;

create function tests.superavit_de(p_posicion integer, p_nombre text, p_monto bigint)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(p_posicion, p_nombre, 'superavit', null, null, null, null, null, null, null, null, p_monto)
$$;

-- El saldo de un tesoro como lo cuenta el libro, y lo que un trabajo dejó en Maun.
create function tests.saldo(p_tesoro text)
returns bigint
language sql
stable
as $$
  select coalesce(sum(l.monto_centavos), 0)::bigint
  from public.libro_mayor l
  where l.tesoro_id = tests.id(p_tesoro) and not l.ya_en_la_apertura
$$;

create function tests.en_maun(p_proyecto uuid)
returns bigint
language sql
stable
as $$
  select coalesce(sum(l.monto_centavos), 0)::bigint
  from public.libro_mayor l
  where l.proyecto_id = p_proyecto and l.tesoro_id = tests.id('maun')
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- El taller ----------------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

insert into public.clientes (id, nombre) values (tests.rid(1), 'Marcela');

insert into public.tesoros (id, nombre, tinta, icono, meta_centavos) values
  (tests.id('iibb'), 'Ingresos Brutos', 'ciruela', 'landmark', null),
  (tests.id('fijos'), 'Gastos fijos', 'petroleo', 'building-2', null),
  (tests.id('stock'), 'Stock del taller', 'mostaza', 'package', null),
  (tests.id('maquinaria'), 'Maquinaria', 'grana', 'wrench', 30000000),
  (tests.id('inmueble'), 'Inmueble', 'petroleo', 'house', 30000000),
  (tests.id('superavit'), 'Superávit', 'mostaza', 'sparkles', null),
  (tests.id('viejo'), 'Viejo', 'grana', 'vault', null),
  (tests.id('viajes'), 'Viajes', 'ciruela', 'plane', null);
update public.tesoros set archivado_at = now() where id = tests.id('viejo');


-- La fila por tipos y lo que no se guarda (MN023) -------------------------------------------------------

select lives_ok(
  $$ select tests.guardar_la_fila(tests.fila_de_eliseo()) $$,
  'la fila de Eliseo se guarda: obligaciones, compromisos, ahorros fijos y por porcentaje hasta la meta, y el superávit aparte'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{obligaciones,0,base}', '"neta"')) $$),
  'MN023 forma-invalida',
  'una obligación se calcula sobre lo cobrado o sobre el ingreso: otra base no se lee'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,2,modo}', '"semanal"')) $$),
  'MN023 forma-invalida',
  'un paso se llena por mes, por su saldo o por trabajo: otro modo no se lee'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,renglones,0,dia}', '"10"')) $$),
  'MN023 forma-invalida',
  'el día de pago es un número: un texto no se lee'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{superavit}', 'null')) $$),
  'MN023 forma-invalida',
  'el superávit es un tesoro: sin la clave es Maun, pero en null no se lee'
);

select is(
  tests.rechazo_de($$
    select tests.guardar_la_fila(jsonb_set(
      tests.fila_de_eliseo(), '{obligaciones}',
      (select jsonb_agg(jsonb_build_object('tesoro', gen_random_uuid(), 'porcentaje', 100, 'base', 'cobrado')) from generate_series(1, 7))
    ))
  $$),
  'MN023 demasiadas-obligaciones',
  'entran hasta 6 obligaciones'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{obligaciones,0,tesoro}', to_jsonb(tests.id('maun')))) $$),
  'MN023 obligacion-en-hogar-o-maun',
  'Maun no puede ser obligación'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{obligaciones,0,porcentaje}', '0')) $$),
  'MN023 obligacion-invalida',
  'una obligación lleva desde 0,01%'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{obligaciones,1,porcentaje}', '10001')) $$),
  'MN023 obligacion-invalida',
  'y hasta 100%, también el diezmo'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{obligaciones}', jsonb_build_array(tests.obligacion('iibb', 350, 'cobrado')))) $$),
  'MN023 sin-diezmo',
  'el diezmo va siempre entre las obligaciones'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,2,tesoro}', to_jsonb(tests.id('iibb')))) $$),
  'MN023 tesoro-repetido',
  'un tesoro que es obligación no es también un paso'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,0,modo}', '"saldo"')) $$),
  'MN023 modo-invalido',
  'el sueldo del Hogar va siempre por mes: renovarlo pagaría el sueldo varias veces'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,modo}', '"trabajo"')) $$),
  'MN023 modo-invalido',
  'un compromiso no se llena por trabajo: eso es de los ahorros fijos'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,tesoro}', to_jsonb(tests.id('maun')))) $$),
  'MN023 modo-invalido',
  'un paso de Maun no se renueva al pagar'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,hastaLaMeta}', 'true')) $$),
  'MN023 meta-fuera-de-ahorro',
  'solo los ahorros van hasta la meta'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,3,tesoro}', to_jsonb(tests.id('viajes')))) $$),
  'MN023 meta-sin-monto',
  'un ahorro fijo hasta la meta necesita que su tesoro tenga meta'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{reparto,0,tesoro}', to_jsonb(tests.id('viajes')))) $$),
  'MN023 meta-sin-monto',
  'y una parte hasta la meta, también'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,renglones,0,dia}', '32')) $$),
  'MN023 dia-invalido',
  'el día de pago va del 1 al 31'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{pasos,1,renglones,1,dia}', '0')) $$),
  'MN023 dia-invalido',
  'también en el segundo renglón'
);

select is(
  tests.rechazo_de($$
    select tests.guardar_la_fila(tests.fila(
      jsonb_build_array(tests.diezmo()),
      jsonb_build_array(
        tests.paso('stock', 'prioridad', 10000000, 'trabajo'),
        tests.paso('fijos', 'fijos', 90000000, 'saldo', false, tests.renglones())
      )
    ))
  $$),
  'MN023 ahorro-antes-de-compromiso',
  'los ahorros van después de los compromisos: así el ingreso libre y la ganancia quedan en un solo lugar'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{superavit}', to_jsonb(tests.id('hogar')))) $$),
  'MN023 superavit-invalido',
  'lo que sobra no va al Hogar'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{superavit}', to_jsonb(tests.id('diezmo')))) $$),
  'MN023 superavit-invalido',
  'ni al diezmo'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(jsonb_set(tests.fila_de_eliseo(), '{superavit}', to_jsonb(tests.id('cocos')))) $$),
  'MN023 superavit-en-la-fila',
  'ni a un tesoro que ya está en la fila'
);

select lives_ok(
  $$
    select tests.guardar_la_fila(tests.fila(
      jsonb_build_array(tests.diezmo()),
      jsonb_build_array(tests.paso('maun', 'fijos', 30000000, 'mes', false, '[{"nombre": "Costos fijos", "monto": 30000000, "dia": null}]')),
      '[]',
      'maun'
    ))
  $$,
  'Maun sí: puede tener sus costos fijos y además quedarse con lo que sobra, como en la fila de siempre'
);

select is(
  tests.rechazo_de($$ select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.diezmo()), '[]', jsonb_build_array(tests.parte('cocos', 5000, true)))) $$),
  'MN023 meta-sin-monto',
  'la meta de Cocos es la de los ajustes: sin ella, Cocos no va hasta la meta'
);

update public.ajustes set meta_cocos_centavos = 100000000 where household_id = tests.id('household_a');

select lives_ok(
  $$ select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.diezmo()), '[]', jsonb_build_array(tests.parte('cocos', 5000, true)))) $$,
  'con la meta de Cocos puesta en los ajustes, va hasta la meta'
);


-- Ingresos Brutos sobre lo cobrado, antes y después del diezmo (septiembre y octubre) ---------------------

select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.obligacion('iibb', 350, 'cobrado'), tests.diezmo())));

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = tests.id('iibb') $$),
  'MN024 en la fila',
  'Ingresos Brutos es una obligación de la fila guardada: no se archiva'
);

select tests.trabajo(1001, 'Cocina de septiembre', 'entregado', 250000000, 50000000, '2026-09-01');

-- Se cobran $ 2.500.000 con $ 500.000 de gastos: el ingreso es $ 2.000.000. Ingresos Brutos, el 3,5% de
-- lo cobrado: $ 87.500. El diezmo, el 10% de lo que llega: $ 191.250. El ingreso libre, $ 1.721.250,
-- queda en Maun, que es el superávit.
select throws_ok(
  $$ select tests.cobrar(tests.rid(1001), '2026-09-10', 250000000, 50000000, 19325000, jsonb_build_array(tests.r(11001, 1, 'iibb', 7000000)), '{}') $$,
  'MN008', null,
  'Ingresos Brutos sobre el ingreso y no sobre lo cobrado no es la cuenta de la base'
);

select throws_ok(
  $$ select tests.cobrar(tests.rid(1001), '2026-09-10', 250000000, 50000000, 19125000, '[]', '{}') $$,
  'MN008', null,
  'y un cobro sin la fila de Ingresos Brutos tampoco: cada obligación que no es el diezmo lleva la suya'
);

select is(
  (select estado::text from tests.cobrar(tests.rid(1001), '2026-09-10', 250000000, 50000000, 19125000, jsonb_build_array(tests.r(11001, 1, 'iibb', 8750000)), '{}')),
  'cobrado',
  'con Ingresos Brutos antes del diezmo el cobro reparte $ 87.500 y $ 191.250'
);

select results_eq(
  $$ select dist_diezmo_bp, dist_diezmo_centavos, dist_remanente_centavos from public.proyectos where id = tests.rid(1001) $$,
  $$ values (1000, 19125000::bigint, 180875000::bigint) $$,
  'el diezmo va a las columnas de siempre, y el remanente es el ingreso menos el diezmo'
);

select is(
  tests.repartos_de(tests.rid(1001)),
  jsonb_build_array(tests.obligacion_de(1, 'Ingresos Brutos', 350, 'cobrado', 8750000)),
  'Ingresos Brutos lleva su fila de repartos, con su porcentaje y sobre qué se calcula'
);

select results_eq(
  $$ select tests.saldo('iibb'), tests.en_maun(tests.rid(1001)) $$,
  $$ values (8750000::bigint, 172125000::bigint) $$,
  'en el libro, Ingresos Brutos recibe su parte y en Maun queda el ingreso libre'
);

select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.diezmo(), tests.obligacion('iibb', 350, 'cobrado'))));
select tests.trabajo(1002, 'Cocina de octubre', 'entregado', 250000000, 50000000, '2026-10-01');
select tests.trabajo(1003, 'Mesa a pérdida', 'entregado', 10000000, 30000000, '2026-10-01');

-- Con el diezmo primero: $ 200.000 de diezmo y $ 87.500 de Ingresos Brutos; quedan $ 1.712.500.
select is(
  (select estado::text from tests.cobrar(tests.rid(1002), '2026-10-10', 250000000, 50000000, 20000000, jsonb_build_array(tests.r(11002, 1, 'iibb', 8750000)), '{}')),
  'cobrado',
  'con el diezmo primero, el cobro reparte $ 200.000 de diezmo y $ 87.500 de Ingresos Brutos'
);

select results_eq(
  $$ select dist_diezmo_centavos, dist_remanente_centavos, tests.en_maun(tests.rid(1002)) from public.proyectos where id = tests.rid(1002) $$,
  $$ values (20000000::bigint, 180000000::bigint, 171250000::bigint) $$,
  'y en Maun quedan $ 1.712.500'
);

-- Un trabajo a pérdida: $ 100.000 cobrados y $ 300.000 gastados. No se aparta nada.
select is(
  (select dist_remanente_centavos from tests.cobrar(tests.rid(1003), '2026-10-12', 10000000, 30000000, 0, jsonb_build_array(tests.r(11003, 1, 'iibb', 0)), '{}')),
  -20000000::bigint,
  'un trabajo a pérdida se cobra con la pérdida en el remanente'
);

select is(
  tests.repartos_de(tests.rid(1003)),
  jsonb_build_array(tests.obligacion_de(1, 'Ingresos Brutos', 350, 'cobrado', 0)),
  'y no aparta Ingresos Brutos aunque se deba: la fila va, en cero'
);


-- El perdido con obligaciones y un diezmo del 12% (noviembre) ----------------------------------------------

select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.obligacion('iibb', 350, 'cobrado'), tests.diezmo(1200))));
select tests.trabajo(1004, 'Vestidor que se cayó', 'en_curso', 100000000, 20000000, '2026-11-01');
select tests.trabajo(1005, 'Placard que se cayó', 'en_curso', 100000000, 20000000, '2026-11-01');

-- Seña $ 1.000.000 y $ 200.000 gastados: el ingreso es $ 800.000. Ingresos Brutos, $ 35.000; el diezmo,
-- el 12% de $ 765.000: $ 91.800.
select throws_ok(
  $$ select tests.cerrar(tests.rid(1004), '2026-11-15', 100000000, 20000000, 1000, 7650000, jsonb_build_array(tests.r(11004, 1, 'iibb', 3500000)), '{}') $$,
  'MN006', null,
  'un perdido se cierra con el porcentaje del diezmo de la fila: el 10% de la cuenta de siempre rebota'
);

select is(
  (select estado::text from tests.cerrar(tests.rid(1004), '2026-11-15', 100000000, 20000000, 1200, 9180000, jsonb_build_array(tests.r(11004, 1, 'iibb', 3500000)), '{}')),
  'perdido',
  'con el 12% de la fila, el perdido se cierra'
);

select results_eq(
  $$ select dist_diezmo_bp, dist_diezmo_centavos, dist_remanente_centavos from public.proyectos where id = tests.rid(1004) $$,
  $$ values (1200, 9180000::bigint, 70820000::bigint) $$,
  'el diezmo congela su porcentaje de la fila, no el 10% de siempre'
);

select is(
  tests.repartos_de(tests.rid(1004)),
  jsonb_build_array(tests.obligacion_de(1, 'Ingresos Brutos', 350, 'cobrado', 3500000)),
  'y las demás obligaciones se aplican igual en un perdido'
);

update public.ajustes set perdido_con_diezmo = false where household_id = tests.id('household_a');

select is(
  (select dist_diezmo_bp from tests.cerrar(tests.rid(1005), '2026-11-20', 100000000, 20000000, 0, 0, jsonb_build_array(tests.r(11005, 1, 'iibb', 3500000)), '{}')),
  0,
  'un perdido que no paga diezmo lo lleva en cero'
);

select results_eq(
  $$ select dist_diezmo_centavos, dist_remanente_centavos, tests.repartos_de(tests.rid(1005)) from public.proyectos where id = tests.rid(1005) $$,
  $$ values (0::bigint, 80000000::bigint, jsonb_build_array(tests.obligacion_de(1, 'Ingresos Brutos', 350, 'cobrado', 3500000))) $$,
  'pero Ingresos Brutos se aparta igual'
);

update public.ajustes set perdido_con_diezmo = true where household_id = tests.id('household_a');


-- Un compromiso que se renueva al pagar (diciembre) ---------------------------------------------------------

select tests.guardar_la_fila(tests.fila(
  jsonb_build_array(tests.diezmo()),
  jsonb_build_array(tests.paso('fijos', 'fijos', 90000000, 'saldo', false, tests.renglones()))
));
select tests.trabajo(1006, 'Rack de diciembre', 'entregado', 200000000, 0, '2026-12-01');
select tests.trabajo(1007, 'Banco de diciembre', 'entregado', 100000000, 0, '2026-12-01');

-- Gastos fijos está vacío: el cobro de $ 2.000.000 aparta $ 200.000 de diezmo y le da los $ 900.000.
-- Cada cobro va en su propia sentencia: una función stable no ve lo que se escribió en la misma.
select estado from tests.cobrar(tests.rid(1006), '2026-12-05', 200000000, 0, 20000000, jsonb_build_array(tests.r(11006, 1, 'fijos', 90000000)), tests.visto('{fijos}', '{0}'));

select is(
  tests.repartos_de(tests.rid(1006)),
  jsonb_build_array(tests.paso_de(1, 'Gastos fijos', 'fijos', 'saldo', 90000000, 0, 90000000, 90000000)),
  'un compromiso que se renueva al pagar se llena con el cobro hasta su monto'
);

-- Registrar el pago de la luz es un gasto desde Gastos fijos: le quedan $ 630.000.
insert into public.movimientos (fecha, tipo, desde_id, monto_centavos, categoria)
  values ('2026-12-12', 'gasto', tests.id('fijos'), 27000000, 'Luz');

select is(tests.saldo('fijos'), 63000000::bigint, 'registrar el pago lo baja');

-- El cobro siguiente, del mismo mes, desde un aparato que no vio el pago: para él Gastos fijos estaba
-- lleno y no le daba nada. La base mira el saldo: le faltan $ 270.000 y se los da.
select is(
  (select estado::text from tests.cobrar(tests.rid(1007), '2026-12-20', 100000000, 0, 10000000, jsonb_build_array(tests.r(11007, 1, 'fijos', 0)), tests.visto('{fijos}', '{90000000}'))),
  'cobrado',
  'el cobro siguiente, armado sin ver el pago, no se rechaza: se ajusta'
);

select results_eq(
  $$ select tests.repartos_de(tests.rid(1007)), dist_previo = tests.visto('{fijos}', '{63000000}'), tests.saldo('fijos') from public.proyectos where id = tests.rid(1007) $$,
  $$ values (jsonb_build_array(tests.paso_de(1, 'Gastos fijos', 'fijos', 'saldo', 90000000, 63000000, 27000000, 27000000)), true, 90000000::bigint) $$,
  'y lo vuelve a llenar: recibe como mucho los $ 270.000 que le faltaban, aunque ya haya recibido en el mes'
);


-- Un ahorro por trabajo (enero de 2027) --------------------------------------------------------------------

select tests.guardar_la_fila(tests.fila(
  jsonb_build_array(tests.diezmo()),
  jsonb_build_array(tests.paso('stock', 'prioridad', 10000000, 'trabajo'))
));
select tests.trabajo(1008, 'Silla uno', 'entregado', 50000000, 0, '2027-01-02');
select tests.trabajo(1009, 'Silla dos', 'entregado', 50000000, 0, '2027-01-02');

select estado from tests.cobrar(tests.rid(1008), '2027-01-05', 50000000, 0, 5000000, jsonb_build_array(tests.r(11008, 1, 'stock', 10000000)), tests.visto('{stock}', '{0}'));
select estado from tests.cobrar(tests.rid(1009), '2027-01-06', 50000000, 0, 5000000, jsonb_build_array(tests.r(11009, 1, 'stock', 10000000)), tests.visto('{stock}', '{0}'));

select is(
  tests.repartos_de(tests.rid(1009)),
  jsonb_build_array(tests.paso_de(1, 'Stock del taller', 'prioridad', 'trabajo', 10000000, 0, 10000000, 10000000)),
  'un ahorro por trabajo recibe su monto en cada cobro, sin mirar el mes'
);

select is(tests.saldo('stock'), 20000000::bigint, 'dos cobros del mismo mes, dos veces su monto');


-- Las metas (febrero, marzo y abril de 2027) ------------------------------------------------------------

insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos) values
  ('2027-01-31', 'ingreso', tests.id('maquinaria'), 25000000),
  ('2027-01-31', 'ingreso', tests.id('inmueble'), 25000000);

select tests.guardar_la_fila(tests.fila(
  jsonb_build_array(tests.diezmo()),
  jsonb_build_array(tests.paso('maquinaria', 'prioridad', 20000000, 'mes', true)),
  jsonb_build_array(tests.parte('inmueble', 2000, true))
));
select tests.trabajo(1010, 'Cama de febrero', 'entregado', 116666667, 0, '2027-02-01');
select tests.trabajo(1011, 'Placard de marzo', 'entregado', 100000000, 0, '2027-03-02');
select tests.trabajo(1012, 'Mesa de abril', 'entregado', 100000000, 0, '2027-04-01');

-- Maquinaria y el Inmueble tienen $ 250.000 de su meta de $ 300.000. El cobro deja $ 1.050.000 después
-- del diezmo. Maquinaria tiene $ 200.000 por mes pero le faltan $ 50.000 para la meta: arranca en
-- $ 150.000 y recibe $ 50.000. Sobra $ 1.000.000: al Inmueble le tocaban $ 200.000, recibe los $ 50.000
-- que le faltan y los $ 150.000 que no recibe van al superávit.
select estado from tests.cobrar(tests.rid(1010), '2027-02-10', 116666667, 0, 11666667, jsonb_build_array(tests.r(11010, 1, 'maquinaria', 5000000), tests.r(11011, 2, 'inmueble', 5000000)), tests.visto('{maquinaria,inmueble}', '{15000000,5000000}'));

select is(
  tests.repartos_de(tests.rid(1010)),
  jsonb_build_array(
    tests.paso_de(1, 'Maquinaria', 'prioridad', 'mes', 20000000, 15000000, 5000000, 5000000),
    tests.parte_de(2, 'Inmueble', 2000, 5000000, 5000000)
  ),
  'un ahorro fijo y uno por porcentaje hasta la meta reciben solo lo que les falta'
);

select results_eq(
  $$ select dist_previo = tests.visto('{maquinaria,inmueble}', '{15000000,5000000}'), tests.en_maun(tests.rid(1010)) from public.proyectos where id = tests.rid(1010) $$,
  $$ values (true, 95000000::bigint) $$,
  'lo que vio la app lleva el previo de la maquinaria y el tope del inmueble, y en Maun quedan $ 950.000'
);

select results_eq(
  $$ select tests.saldo('maquinaria'), tests.saldo('inmueble') $$,
  $$ values (30000000::bigint, 30000000::bigint) $$,
  'los dos llegaron a su meta'
);

-- La Maquinaria pasa de su meta. Un aparato que no vio las metas arma el cobro como si juntaran sin
-- fin: Maquinaria sus $ 200.000 y el Inmueble el 20% de los $ 700.000 que sobran.
insert into public.movimientos (fecha, tipo, hacia_id, monto_centavos) values ('2027-03-01', 'ingreso', tests.id('maquinaria'), 10000000);

select is(
  (select estado::text from tests.cobrar(tests.rid(1011), '2027-03-10', 100000000, 0, 10000000, jsonb_build_array(tests.r(11012, 1, 'maquinaria', 20000000), tests.r(11013, 2, 'inmueble', 14000000)), tests.visto('{maquinaria}', '{0}'))),
  'cobrado',
  'un cobro armado sin ver las metas no se rechaza: se ajusta'
);

select results_eq(
  $$ select tests.repartos_de(tests.rid(1011)), dist_previo = tests.visto('{maquinaria,inmueble}', '{20000000,0}') from public.proyectos where id = tests.rid(1011) $$,
  $$
    values (
      jsonb_build_array(
        tests.paso_de(1, 'Maquinaria', 'prioridad', 'mes', 20000000, 20000000, 0, 0),
        tests.parte_de(2, 'Inmueble', 2000, 0, 0)
      ),
      true
    )
  $$,
  'con el saldo en la meta o arriba no reciben nada: lo que les tocaba sigue hasta el superávit'
);

-- Los dos se quedan sin meta. La fila guardada todavía dice «hasta la meta»: juntan sin fin.
update public.tesoros set meta_centavos = null where id in (tests.id('maquinaria'), tests.id('inmueble'));

select estado from tests.cobrar(tests.rid(1012), '2027-04-10', 100000000, 0, 10000000, jsonb_build_array(tests.r(11014, 1, 'maquinaria', 20000000), tests.r(11015, 2, 'inmueble', 14000000)), tests.visto('{maquinaria}', '{0}'));

select is(
  tests.repartos_de(tests.rid(1012)),
  jsonb_build_array(
    tests.paso_de(1, 'Maquinaria', 'prioridad', 'mes', 20000000, 0, 20000000, 20000000),
    tests.parte_de(2, 'Inmueble', 2000, null, 14000000)
  ),
  'un tesoro que se quedó sin meta junta sin fin: el paso por mes y la parte sin tope'
);

select is(
  tests.rechazo_de($$
    select tests.guardar_la_fila(tests.fila(
      jsonb_build_array(tests.diezmo()),
      jsonb_build_array(tests.paso('maquinaria', 'prioridad', 20000000, 'mes', true)),
      jsonb_build_array(tests.parte('inmueble', 2000, true))
    ))
  $$),
  'MN023 meta-sin-monto',
  'y esa fila, así, ya no se vuelve a guardar'
);


-- El superávit en otro tesoro (mayo de 2027) --------------------------------------------------------------

select tests.guardar_la_fila(tests.fila(jsonb_build_array(tests.diezmo()), '[]', jsonb_build_array(tests.parte('cocos', 5000)), 'superavit'));

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = tests.id('superavit') $$),
  'MN024 en la fila',
  'el tesoro que recibe lo que sobra no se archiva, aunque no tenga plata'
);

select tests.trabajo(1013, 'Deck de mayo', 'entregado', 100000000, 0, '2027-05-01');
select tests.trabajo(1014, 'Silla a pérdida', 'entregado', 10000000, 30000000, '2027-05-01');

-- $ 1.000.000: $ 100.000 de diezmo, la mitad de lo que sobra a Cocos y el resto al Superávit.
select throws_ok(
  $$ select tests.cobrar(tests.rid(1013), '2027-05-10', 100000000, 0, 10000000, jsonb_build_array(tests.r(11016, 1, 'cocos', 45000000)), '{}') $$,
  'MN008', null,
  'con el superávit aparte, el cobro lleva también su fila'
);

select estado from tests.cobrar(tests.rid(1013), '2027-05-10', 100000000, 0, 10000000, jsonb_build_array(tests.r(11016, 1, 'cocos', 45000000), tests.r(11017, 2, 'superavit', 45000000)), '{}');

select is(
  tests.repartos_de(tests.rid(1013)),
  jsonb_build_array(tests.parte_de(1, 'Cocos', 5000, null, 45000000), tests.superavit_de(2, 'Superávit', 45000000)),
  'el resto va al Superávit, con su fila de repartos al final'
);

select is(
  (
    select jsonb_agg(jsonb_build_array(t.nombre, l.monto_centavos) order by l.monto_centavos, t.nombre)
    from public.libro_mayor l
    join public.tesoros t on t.id = l.tesoro_id
    where l.proyecto_id = tests.rid(1013) and l.origen = 'reparto'
  ),
  jsonb_build_array(
    jsonb_build_array('Maun', -45000000), jsonb_build_array('Maun', -45000000),
    jsonb_build_array('Cocos', 45000000), jsonb_build_array('Superávit', 45000000)
  ),
  'en el libro, lo que sobra pasa de Maun al Superávit como cualquier reparto'
);

select is(tests.en_maun(tests.rid(1013)), 0::bigint, 'y a Maun no le queda nada de ese cobro: solo guarda los insumos y lo que se cargue a mano');

select estado from tests.cobrar(tests.rid(1014), '2027-05-15', 10000000, 30000000, 0, jsonb_build_array(tests.r(11018, 1, 'cocos', 0), tests.r(11019, 2, 'superavit', 0)), '{}');

select results_eq(
  $$ select tests.repartos_de(tests.rid(1014)), (select count(*)::int from public.libro_mayor where proyecto_id = tests.rid(1014) and origen = 'reparto') $$,
  $$ values (jsonb_build_array(tests.parte_de(1, 'Cocos', 5000, null, 0), tests.superavit_de(2, 'Superávit', 0)), 0) $$,
  'un trabajo a pérdida deja el superávit en cero, y la pérdida queda en Maun'
);


-- La fila del primer pedido se sigue leyendo (junio de 2027) --------------------------------------------

select lives_ok(
  $$
    select tests.guardar_la_fila(jsonb_build_object(
      'pasos', jsonb_build_array(jsonb_build_object(
        'tesoro', tests.id('fijos'), 'clase', 'fijos', 'tope', 90000000,
        'renglones', '[{"nombre": "Alquiler", "monto": 50000000}, {"nombre": "Luz", "monto": 40000000}]'::jsonb,
        'desde', null
      )),
      'reparto', jsonb_build_array(jsonb_build_object('tesoro', tests.id('cocos'), 'porcentaje', 5000)),
      'sueldoPorTrabajo', false
    ))
  $$,
  'una fila con la forma del primer pedido, sin obligaciones, sin modos, sin metas, sin días y sin superávit, se guarda'
);

select tests.trabajo(1015, 'Biblioteca de junio', 'entregado', 200000000, 0, '2027-06-01');

-- Lee lo de siempre: el diezmo al 10% sobre el ingreso, por mes, sin metas y lo que sobra en Maun.
select estado from tests.cobrar(tests.rid(1015), '2027-06-10', 200000000, 0, 20000000, jsonb_build_array(tests.r(11020, 1, 'fijos', 90000000), tests.r(11021, 2, 'cocos', 45000000)), tests.visto('{fijos}', '{0}'));

select is(
  tests.repartos_de(tests.rid(1015)),
  jsonb_build_array(
    tests.paso_de(1, 'Gastos fijos', 'fijos', 'mes', 90000000, 0, 90000000, 90000000),
    tests.parte_de(2, 'Cocos', 5000, null, 45000000)
  ),
  'y se cobra con lo de siempre en lo que le falta: el diezmo al 10%, por mes, sin meta y sin superávit aparte'
);

select results_eq(
  $$ select dist_diezmo_bp, dist_diezmo_centavos, dist_fila ? 'obligaciones', tests.en_maun(tests.rid(1015)) from public.proyectos where id = tests.rid(1015) $$,
  $$ values (1000, 20000000::bigint, false, 45000000::bigint) $$,
  'congela la fila tal cual se guardó, y lo que sobra queda en Maun'
);


-- No se archiva lo que está en la foto de un cobro reabierto (MN024) --------------------------------------

select is(
  (select reapertura_fila -> 'fila' -> 'obligaciones' -> 1 ->> 'tesoro' from public.reabrir_proyecto(tests.rid(1002), (select version from public.proyectos where id = tests.rid(1002)))),
  tests.id('iibb')::text,
  'reabrir el cobro de octubre guarda su fila, con Ingresos Brutos entre las obligaciones'
);

select is(
  (select reapertura_fila -> 'fila' ->> 'superavit' from public.reabrir_proyecto(tests.rid(1013), (select version from public.proyectos where id = tests.rid(1013)))),
  tests.id('superavit')::text,
  'y reabrir el de mayo guarda la suya, con el Superávit'
);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = tests.id('iibb') $$),
  'MN024 en la fila',
  'la fila de hoy no tiene Ingresos Brutos, pero volver a cobrar el reabierto le pagaría: no se archiva'
);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = tests.id('superavit') $$),
  'MN024 en la fila',
  'ni el Superávit, que recibiría lo que sobra'
);

update public.proyectos set deleted_at = now() where id = tests.rid(1002);

select is(
  tests.rechazo_de($$ update public.tesoros set archivado_at = now() where id = tests.id('iibb') $$),
  'MN024 saldo 15750000',
  'con el trabajo borrado la foto ya no cuenta, pero Ingresos Brutos todavía tiene lo que apartaron los otros'
);

update public.proyectos set deleted_at = now() where id = tests.rid(1013);

select lives_ok(
  $$ update public.tesoros set archivado_at = now() where id = tests.id('superavit') $$,
  'el Superávit, sin la foto y sin plata, se archiva'
);


-- Registrar un pago: un gasto desde cualquier tesoro ---------------------------------------------------

select lives_ok(
  $$
    insert into public.movimientos (fecha, tipo, desde_id, monto_centavos, categoria) values
      ('2027-07-01', 'gasto', tests.id('hogar'), 100, 'Supermercado'),
      ('2027-07-01', 'gasto', tests.id('maun'), 100, 'Gasto del taller'),
      ('2027-07-01', 'gasto', tests.id('diezmo'), 100, 'Donación'),
      ('2027-07-01', 'gasto', tests.id('cocos'), 100, 'Escritura'),
      ('2027-07-01', 'gasto', tests.id('fijos'), 100, 'Alquiler'),
      ('2027-07-01', 'gasto', tests.id('viajes'), 100, ''),
      ('2027-07-01', 'gasto', tests.id('stock'), 100, repeat('x', 200))
  $$,
  'un gasto sale de cualquier tesoro, del sistema o del dueño, con la categoría que sea'
);

select is(
  (
    select count(*)::int from public.libro_mayor
    where fecha = '2027-07-01' and origen = 'manual' and concepto = 'gasto' and monto_centavos = -100
  ),
  7,
  'y cada uno baja el saldo de su tesoro en el libro'
);


-- La forma de cada tipo en repartos ---------------------------------------------------------------------

select tests.salir();

create function tests.reparto_suelto(p_tipo text, p_cambios jsonb)
returns void
language plpgsql
as $$
begin
  insert into public.repartos (
    household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos, previo_centavos,
    tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha
  )
  select tests.id('household_a'), tests.rid(1001), 99, tests.id('iibb'), 'Suelto', p_tipo,
    x.clase, x.modo, x.objetivo_centavos, x.previo_centavos, x.tope_centavos, x.por_mes, x.porcentaje_bp, x.base,
    coalesce(x.monto_centavos, 0), '2026-09-10'
  from jsonb_to_record(p_cambios) as x (
    clase text, modo text, objetivo_centavos bigint, previo_centavos bigint, tope_centavos bigint, por_mes boolean,
    porcentaje_bp integer, base text, monto_centavos bigint
  );
end;
$$;

select throws_ok(
  $$ select tests.reparto_suelto('obligacion', '{"porcentaje_bp": 350}') $$,
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'una obligación lleva sobre qué se calcula, ni siquiera escrita por el dueño de la base'
);

select throws_ok(
  $$ select tests.reparto_suelto('superavit', '{"porcentaje_bp": 100}') $$,
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'un superávit lleva solo su monto'
);

select throws_ok(
  $$ select tests.reparto_suelto('parte', '{"porcentaje_bp": 2000, "tope_centavos": 5, "monto_centavos": 6}') $$,
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'una parte con meta no recibe más que su tope'
);

select throws_ok(
  $$ select tests.reparto_suelto('paso', '{"clase": "sueldo", "modo": "saldo", "objetivo_centavos": 0, "previo_centavos": 0, "tope_centavos": 0, "por_mes": true}') $$,
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'el sueldo no se renueva al pagar'
);

select throws_ok(
  $$ select tests.reparto_suelto('paso', '{"clase": "fijos", "modo": "trabajo", "objetivo_centavos": 0, "previo_centavos": 0, "tope_centavos": 0, "por_mes": true}') $$,
  '23514', 'new row for relation "repartos" violates check constraint "repartos_forma_segun_tipo"',
  'ni un compromiso va por trabajo'
);

select lives_ok(
  $$ select tests.reparto_suelto('paso', '{"clase": "fijos", "objetivo_centavos": 0, "previo_centavos": 0, "tope_centavos": 0, "por_mes": true}') $$,
  'un paso con el modo en null es como los que se liquidaron antes de los tipos: vale como por mes'
);


-- Los vectores fijos, en las gemelas -------------------------------------------------------------------

select results_eq(
  $$
    select r.obligaciones::text, r.libre_centavos
    from private.repartir_por_la_fila(250000000, 50000000, '{350,1000}', '{cobrado,ingreso}', '{}', '{}', '{}', '{}', '{}') as r
  $$,
  $$ values ('{8750000,19125000}', 172125000::bigint) $$,
  'Ingresos Brutos al 3,5% sobre lo cobrado antes del diezmo: $ 87.500 y $ 191.250, y el ingreso libre es $ 1.721.250'
);

select results_eq(
  $$
    select r.obligaciones::text, r.libre_centavos
    from private.repartir_por_la_fila(250000000, 50000000, '{1000,350}', '{ingreso,cobrado}', '{}', '{}', '{}', '{}', '{}') as r
  $$,
  $$ values ('{20000000,8750000}', 171250000::bigint) $$,
  'con el diezmo primero: $ 200.000 y $ 87.500, y quedan $ 1.712.500'
);

select results_eq(
  $$
    select r.partes::text, r.remanente_centavos
    from private.repartir_por_la_fila(100000000, 0, '{}', '{}', '{}', '{}', '{}', '{2000}', '{5000000}') as r
  $$,
  $$ values ('{5000000}', 95000000::bigint) $$,
  'un ahorro del 20% al que le faltan $ 50.000 para la meta, con $ 1.000.000 que sobran, recibe $ 50.000 y $ 150.000 más van al superávit'
);

select results_eq(
  $$
    select p.previos::text, r.topes::text
    from private.previo_del_mes(
      array[tests.id('fijos')], '{90000000}', '{saldo}', '{false}', '{}', '{}', '{}',
      jsonb_build_object(tests.id('fijos'), 63000000), '{}'
    ) as p
    cross join lateral private.repartir_por_la_fila(100000000, 0, '{}', '{}', '{90000000}', p.previos, '{true}', '{}', '{}') as r
  $$,
  $$ values ('{63000000}', '{27000000}') $$,
  'un compromiso que se renueva de $ 900.000 con $ 630.000 de saldo recibe como mucho $ 270.000'
);

select * from finish();
