-- La vista del cliente antes de aprobar (ADR 0067). Un campo cargado no es un hecho: un trabajo sin
-- aprobar puede tener la dirección, el inicio y la entrega cargados, y la vista no los manda. Cada
-- dato viaja desde la etapa en la que es cierto; la seña sale de una sola función; hasta cuándo vale
-- el presupuesto viaja solo mientras espera la seña, y guardar_proyecto la escribe solo si viene la
-- clave.

select plan(76);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.la_vista()
returns jsonb
language sql
as $$
  select public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000010')
$$;

create function tests.el_contacto(p_version integer, p_extra jsonb default '{}'::jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', 'bbbbbbbb-0000-7000-8000-000000000020', 'version', p_version,
    'cliente_id', 'bbbbbbbb-0000-7000-8000-000000000001', 'titulo', 'Rack', 'descripcion', '',
    'estado', 'presupuesto_enviado', 'comprobante', 'sin_comprobante', 'notas', ''
  ) || p_extra
$$;

create function tests.vale_hasta_del_contacto()
returns date
language sql
as $$
  select presupuesto_vale_hasta from public.proyectos where id = 'bbbbbbbb-0000-7000-8000-000000000020'
$$;

create function tests.el_presupuesto()
returns jsonb
language sql
as $$
  select public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000040') -> 'presupuesto'
$$;

select tests.entrar_como(tests.id('ana'));

update public.ajustes set cobro_alias = 'taller.maun.ok'
  where household_id = tests.id('household_a');

insert into public.clientes (id, nombre)
  values ('bbbbbbbb-0000-7000-8000-000000000001', 'Lucía Ferreyra');

-- Con el presupuesto mandado y sin aprobar, pero con todo lo que después se promete ya cargado: es lo
-- que tiene el Escritorio en producción, que vino así del sistema viejo. Vale hasta el 2 de octubre.
insert into public.proyectos (
  id, cliente_id, titulo, estado, presupuesto_centavos, fecha_inicio, entrega_estimada,
  direccion_entrega, presupuesto_vale_hasta
) values (
  'bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'Escritorio',
  'presupuesto_enviado', 124800000, '2026-08-14', '2026-10-10', 'Belgrano 455, Haedo',
  '2026-10-02'
);

insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000100', 'bbbbbbbb-0000-7000-8000-000000000010',
          '2026-08-13', 'Relevamiento Tecnico', 12000000);


-- Presupuesto mandado y sin aprobar: lo cargado no viaja ----------------------------------------------

select is(
  tests.la_vista() ->> 'direccion',
  '',
  'sin aprobar, la dirección no viaja: la clave va vacía para que una versión vieja de la app la siga leyendo'
);

select is(tests.la_vista() #> '{fechas,inicio}', 'null'::jsonb, 'ni el día de inicio');

select is(tests.la_vista() #> '{fechas,entrega_pautada}', 'null'::jsonb, 'ni la entrega');

select is(tests.la_vista() #> '{fechas,aprobado}', 'null'::jsonb, 'ni un día de aprobación');

select is_empty(
  format(
    $$
      select v.aguja
      from unnest(array['Belgrano 455', '2026-08-14', '2026-10-10']) as v (aguja)
      where %L like '%%' || v.aguja || '%%'
    $$,
    tests.la_vista()::text
  ),
  'en el JSON entero no aparece ni la dirección, ni el inicio, ni la entrega cargados'
);

select is(
  tests.la_vista() #>> '{pagos,0,concepto}',
  'Relevamiento Tecnico',
  'el pago del relevamiento viaja, con su nombre'
);

select is(
  tests.la_vista() -> 'precio_centavos',
  to_jsonb(124800000::bigint),
  'y el presupuesto también: es lo que el cliente tiene que aprobar'
);

select is(
  tests.la_vista() #>> '{fechas,vale_hasta}',
  '2026-10-02',
  'y hasta cuándo vale el presupuesto, que es la fecha de la proyección'
);

select is(
  tests.la_vista() -> 'relevamiento_centavos',
  'null'::jsonb,
  'con el presupuesto mandado, lo que cobra el taller por el relevamiento no viaja (ADR 0079)'
);


-- La seña: una sola cuenta ---------------------------------------------------------------------------------

select is(
  tests.la_vista() -> 'sena_centavos',
  to_jsonb(62400000::bigint),
  'la seña para arrancar viaja en pesos: la mitad del presupuesto, con el porcentaje del taller'
);

select is(
  tests.la_vista() -> 'pago',
  jsonb_build_object(
    'instancia', 'sena',
    'formas', jsonb_build_array('transferencia', 'efectivo'),
    'monto_centavos', 50400000,
    'siguiente', jsonb_build_object(
      'instancia', 'saldo',
      'formas', jsonb_build_array('transferencia', 'efectivo'),
      'monto_centavos', 62400000
    )
  ),
  'lo que se le pide es la seña menos lo que ya pagó: el relevamiento queda a cuenta'
);

select is(
  (tests.la_vista() ->> 'sena_centavos')::bigint - 12000000,
  (tests.la_vista() #>> '{pago,monto_centavos}')::bigint,
  'la seña de arriba menos lo pagado es exactamente lo que pide «Cómo pagar»: salen de la misma función'
);

select is(
  private.sena_esperada(124800000, 5000),
  62400000::bigint,
  'private.sena_esperada es la cuenta de la seña'
);

select is(private.sena_esperada(1, 5000), 1::bigint, 'con medio centavo para arriba, como el dominio');

select is(private.sena_esperada(null, 5000), null::bigint, 'y sin presupuesto no hay seña');

-- Con la seña cubierta antes de aprobar, para aprobar no le falta pagar nada: el saldo existe desde
-- que aprueba, así que tampoco se le pide.
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000101', 'bbbbbbbb-0000-7000-8000-000000000010',
          '2026-08-20', 'A cuenta', 60000000);

select is(
  tests.la_vista() -> 'pago',
  jsonb_build_object(
    'instancia', null, 'formas', jsonb_build_array(), 'monto_centavos', null, 'siguiente', null
  ),
  'con la seña cubierta y sin aprobar, no se le pide el saldo'
);

select is(
  tests.la_vista() -> 'cobro',
  jsonb_build_object('alias', null, 'cbu', null, 'titular', null, 'cuit', null, 'link', null),
  'y como no toca ningún pago, la cuenta no viaja'
);

select is(
  tests.la_vista() -> 'sena_centavos',
  to_jsonb(62400000::bigint),
  'la seña sigue siendo la seña: la pantalla dice que ya la cubrió'
);

update public.pagos set deleted_at = now() where id = 'bbbbbbbb-0000-7000-8000-000000000101';


-- Antes de mandar el presupuesto, el número guardado es un borrador ----------------------------------------

update public.proyectos set estado = 'a_presupuestar'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  tests.la_vista() -> 'precio_centavos',
  'null'::jsonb,
  'a presupuestar, el presupuesto guardado no viaja: todavía no se le mandó'
);

select is(tests.la_vista() -> 'sena_centavos', 'null'::jsonb, 'ni la seña que saldría de él');

select is(
  tests.la_vista() #> '{fechas,vale_hasta}',
  'null'::jsonb,
  'ni hasta cuándo vale: no hay presupuesto mandado'
);

select is(
  tests.la_vista() #> '{pago,monto_centavos}',
  'null'::jsonb,
  'y lo que viene se anticipa sin importe, como en cualquier trabajo sin presupuesto'
);

select is(
  tests.la_vista() -> 'relevamiento_centavos',
  to_jsonb(12000000::bigint),
  'antes de mandarlo sí viaja lo que el taller cobra el relevamiento: la página lo explica mientras falta ir a medir'
);


-- Aprobado: desde ahí todo es cierto y todo viaja ----------------------------------------------------------

update public.proyectos set estado = 'presupuesto_enviado'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';
update public.proyectos set estado = 'en_curso'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(tests.la_vista() ->> 'direccion', 'Belgrano 455, Haedo', 'aprobado, la dirección viaja');

select is(tests.la_vista() #>> '{fechas,inicio}', '2026-08-14', 'y el día de inicio');

select is(tests.la_vista() #>> '{fechas,entrega_pautada}', '2026-10-10', 'y la entrega pautada');

select is(
  tests.la_vista() #>> '{fechas,aprobado}',
  ((now() at time zone 'America/Argentina/Buenos_Aires')::date)::text,
  'y el día de la aprobación, que sale de su registro y no de un pago'
);

select is(
  tests.la_vista() #> '{fechas,vale_hasta}',
  'null'::jsonb,
  'hasta cuándo valía el presupuesto ya no viaja: está aprobado'
);

select is(
  tests.la_vista() -> 'sena_centavos',
  to_jsonb(62400000::bigint),
  'la seña acordada viaja en pesos'
);

select is(
  tests.la_vista() #>> '{pago,instancia}',
  'sena',
  'aprobado sin la seña completa, lo que toca es lo que falta de ella'
);

insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000102', 'bbbbbbbb-0000-7000-8000-000000000010',
          '2026-09-24', 'Seña', 50400000);

select is(
  tests.la_vista() -> 'pago',
  jsonb_build_object(
    'instancia', 'saldo',
    'formas', jsonb_build_array('transferencia', 'efectivo'),
    'monto_centavos', 62400000,
    'siguiente', null
  ),
  'con la seña cubierta, desde la aprobación lo que toca es el saldo'
);

-- Una entrega cargada con la obra todavía en el taller no es una entrega: desde el ADR 0071 la base ni
-- la guarda.
update public.proyectos set fecha_entrega = '2026-09-30'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  tests.la_vista() #> '{fechas,entregado}',
  'null'::jsonb,
  'en curso, el día de entrega cargado no viaja'
);

update public.proyectos set estado = 'entregado', fecha_entrega = '2026-09-30'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(tests.la_vista() #>> '{fechas,entregado}', '2026-09-30', 'entregado, viaja');

-- Si vuelve a presupuesto, vuelve a no estar aprobado, aunque el registro de la aprobación quede.
update public.proyectos set estado = 'en_curso', fecha_entrega = null
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';
update public.proyectos set estado = 'presupuesto_enviado'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  array[
    tests.la_vista() ->> 'direccion',
    tests.la_vista() #>> '{fechas,aprobado}',
    tests.la_vista() #>> '{fechas,inicio}',
    tests.la_vista() #>> '{fechas,entrega_pautada}'
  ],
  array['', null, null, null],
  'vuelto a presupuesto, ni la dirección, ni la aprobación, ni el inicio, ni la entrega viajan'
);


-- Las dos puertas dicen lo mismo ------------------------------------------------------------------------------

insert into public.enlaces_publicos (id, proyecto_id, token_hash)
  values (
    'bbbbbbbb-0000-7000-8000-000000000300',
    'bbbbbbbb-0000-7000-8000-000000000010',
    encode(sha256(convert_to('el-token-del-escritorio-26', 'UTF8')), 'hex')
  );

select set_config('tests.payload', tests.la_vista()::text, true);

select tests.entrar_como_anon();

select is(
  public.vista_compartida('el-token-del-escritorio-26')::text,
  current_setting('tests.payload'),
  'por el enlace se ve exactamente lo mismo que desde la app, también antes de aprobar'
);

select throws_ok(
  $$ select private.sena_esperada(100, 5000) $$,
  '42501',
  null,
  'el rol anónimo no puede ejecutar la cuenta de la seña: vive en private'
);

select is(
  has_column_privilege('anon', 'public.proyectos', 'presupuesto_vale_hasta', 'SELECT'),
  false,
  'ni leer hasta cuándo vale un presupuesto'
);

select is(
  has_column_privilege('anon', 'public.ajustes', 'presupuesto_vale_dias', 'SELECT'),
  false,
  'ni los días que valen en el taller'
);

select is(
  has_column_privilege('anon', 'public.ajustes', 'relevamiento_centavos', 'SELECT'),
  false,
  'ni el valor del relevamiento: le llega solo por la vista'
);

select tests.salir();
select tests.entrar_como(tests.id('ana'));


-- Los días que vale un presupuesto, en Ajustes --------------------------------------------------------------

select is(
  (select presupuesto_vale_dias from public.ajustes where household_id = tests.id('household_a')),
  15,
  'un taller arranca con presupuestos que valen quince días'
);

select throws_ok(
  format(
    $$ update public.ajustes set presupuesto_vale_dias = 0 where household_id = %L $$,
    tests.id('household_a')
  ),
  '23514',
  null,
  'un presupuesto que vale cero días lo frena la base'
);

select throws_ok(
  format(
    $$ update public.ajustes set presupuesto_vale_dias = 366 where household_id = %L $$,
    tests.id('household_a')
  ),
  '23514',
  null,
  'y uno de más de un año también'
);

select lives_ok(
  format(
    $$ update public.ajustes set presupuesto_vale_dias = 30 where household_id = %L $$,
    tests.id('household_a')
  ),
  'el dueño los cambia: la columna tiene grant de update'
);


-- El valor del relevamiento, en Ajustes (ADR 0079) -----------------------------------------------------------

select is(
  (select relevamiento_centavos from public.ajustes where household_id = tests.id('household_a')),
  12000000::bigint,
  'un taller arranca con el relevamiento en $ 120.000'
);

select throws_ok(
  format(
    $$ update public.ajustes set relevamiento_centavos = 0 where household_id = %L $$,
    tests.id('household_a')
  ),
  '23514',
  null,
  'un relevamiento en cero lo frena la base: vacío se guarda null'
);

select throws_ok(
  format(
    $$ update public.ajustes set relevamiento_centavos = -100 where household_id = %L $$,
    tests.id('household_a')
  ),
  '23514',
  null,
  'y uno negativo también'
);

select lives_ok(
  format(
    $$ update public.ajustes set relevamiento_centavos = 15000000 where household_id = %L $$,
    tests.id('household_a')
  ),
  'el dueño lo cambia: la columna tiene grant de update'
);

select lives_ok(
  format(
    $$ update public.ajustes set relevamiento_centavos = null where household_id = %L $$,
    tests.id('household_a')
  ),
  'y lo deja vacío: el cliente ve qué es el relevamiento sin el precio'
);


-- guardar_proyecto la escribe solo si viene la clave ------------------------------------------------------

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L::jsonb, '[]'::jsonb, '[]'::jsonb) $$,
    tests.el_contacto(null, jsonb_build_object('presupuesto_vale_hasta', '2026-10-09'))
  ),
  'un alta con la fecha la guarda'
);

select is(tests.vale_hasta_del_contacto(), '2026-10-09'::date, 'y queda guardada');

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L::jsonb, '[]'::jsonb, '[]'::jsonb) $$,
    tests.el_contacto(
      (select version from public.proyectos where id = 'bbbbbbbb-0000-7000-8000-000000000020'),
      jsonb_build_object('titulo', 'Rack de living')
    )
  ),
  'un guardado sin la clave, como el de un bundle viejo, no rebota'
);

select is(
  tests.vale_hasta_del_contacto(),
  '2026-10-09'::date,
  'y no borra la fecha que no conoce'
);

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L::jsonb, '[]'::jsonb, '[]'::jsonb) $$,
    tests.el_contacto(
      (select version from public.proyectos where id = 'bbbbbbbb-0000-7000-8000-000000000020'),
      jsonb_build_object('titulo', 'Rack de living', 'presupuesto_vale_hasta', '2026-10-16')
    )
  ),
  'con la clave la cambia'
);

select is(tests.vale_hasta_del_contacto(), '2026-10-16'::date, 'y queda la nueva');

select lives_ok(
  format(
    $$ select public.guardar_proyecto(%L::jsonb, '[]'::jsonb, '[]'::jsonb) $$,
    tests.el_contacto(
      (select version from public.proyectos where id = 'bbbbbbbb-0000-7000-8000-000000000020'),
      jsonb_build_object('titulo', 'Rack de living', 'presupuesto_vale_hasta', '')
    )
  ),
  'vacía, como la manda un campo de fecha borrado, no rebota'
);

select is(tests.vale_hasta_del_contacto(), null::date, 'y la borra: el presupuesto queda sin fecha');


-- El listo y la entrega: desde cuándo viaja cada uno (ADR 0071) -----------------------------------------------

-- El mismo escritorio, que a esta altura volvió a «Presupuesto enviado». Hoy, en el taller, es el 25 de
-- septiembre: el día propuesto tiene que ser desde mañana.
select set_config('maun.hoy_en_el_taller', '2026-09-25', true);

update public.proyectos set listo_el = '2026-09-20', entrega_comprometida = '2026-10-01'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  array[tests.la_vista() #> '{fechas,listo}', tests.la_vista() -> 'entrega'],
  array['null'::jsonb, '{"comprometida": null, "propuesta": null, "respuesta": null}'::jsonb],
  'sin aprobar, ni el listo ni la entrega viajan: la base ni siquiera los guarda'
);

update public.proyectos set estado = 'en_curso'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  array[tests.la_vista() #> '{fechas,listo}', tests.la_vista() -> 'entrega'],
  array['null'::jsonb, '{"comprometida": null, "propuesta": null, "respuesta": null}'::jsonb],
  'aprobado y todavía en fabricación, no hay listo ni nada que coordinar'
);

update public.proyectos set listo_el = '2026-09-24'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(tests.la_vista() #>> '{fechas,listo}', '2026-09-24', 'listo, viaja el día en que se terminó');

insert into public.propuestas_de_entrega (id, proyecto_id, forma, fecha, franja)
  values ('bbbbbbbb-0000-7000-8000-000000000500', 'bbbbbbbb-0000-7000-8000-000000000010',
          'un_dia', '2026-10-01', 'manana');

select is(
  tests.la_vista() #> '{entrega,propuesta}',
  jsonb_build_object(
    'id', 'bbbbbbbb-0000-7000-8000-000000000500', 'forma', 'un_dia', 'fecha', '2026-10-01',
    'franja', 'manana'
  ),
  'listo y con un día propuesto, viaja la propuesta con el id con el que el cliente le contesta'
);

select tests.salir();
insert into public.respuestas_de_entrega (household_id, proyecto_id, propuesta_id, respuesta, dias, nota)
  values (tests.id('household_a'), 'bbbbbbbb-0000-7000-8000-000000000010',
          'bbbbbbbb-0000-7000-8000-000000000500', 'mis_dias',
          '[{"fecha": "2026-10-02", "franjas": ["tarde"]}]', 'Tercer piso por escalera');
select tests.entrar_como(tests.id('ana'));

select is(
  tests.la_vista() #> '{entrega,respuesta}',
  '{"respuesta": "mis_dias", "dias": [{"fecha": "2026-10-02", "franjas": ["tarde"]}], "nota": "Tercer piso por escalera"}'::jsonb,
  'y lo que el cliente contestó, tal como lo mandó'
);

-- El día propuesto pasó sin que nadie lo acordara: para el cliente no hay nada propuesto.
select set_config('maun.hoy_en_el_taller', '2026-10-02', true);

select is(
  tests.la_vista() -> 'entrega',
  '{"comprometida": null, "propuesta": null, "respuesta": null}'::jsonb,
  'una propuesta de un día que ya pasó no viaja, ni lo que se le contestó'
);

select set_config('maun.hoy_en_el_taller', '2026-09-25', true);

update public.proyectos set entrega_comprometida = '2026-10-03', entrega_comprometida_franja = 'tarde'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  tests.la_vista() -> 'entrega',
  '{"comprometida": {"fecha": "2026-10-03", "franja": "tarde"}, "propuesta": null, "respuesta": null}'::jsonb,
  'comprometida, viaja la comprometida con su franja y ya no hay nada que contestar'
);

update public.proyectos set estado = 'entregado', fecha_entrega = '2026-10-03'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  array[
    tests.la_vista() #>> '{fechas,listo}',
    tests.la_vista() #>> '{fechas,entregado}',
    tests.la_vista() #>> '{entrega,comprometida}'
  ],
  array['2026-09-24', '2026-10-03', null],
  'entregado, lo que cuenta es el día en que se entregó: la comprometida deja de viajar y el listo queda'
);

update public.proyectos set estado = 'en_curso'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';
update public.proyectos set estado = 'presupuesto_enviado'
  where id = 'bbbbbbbb-0000-7000-8000-000000000010';

select is(
  array[tests.la_vista() #> '{fechas,listo}', tests.la_vista() -> 'entrega'],
  array['null'::jsonb, '{"comprometida": null, "propuesta": null, "respuesta": null}'::jsonb],
  'vuelto a presupuesto, el listo y la comprometida se van con la aprobación'
);


-- El presupuesto que se le mandó desde la app, etapa por etapa (ADR 0080) -------------------------------------

select is(
  tests.la_vista() -> 'presupuesto',
  'null'::jsonb,
  'un presupuesto mandado por fuera de la app no trae documento: la clave viaja en null'
);

-- Una biblioteca a presupuestar, con la dirección cargada en el trabajo y el borrador a medio armar.
-- Hoy, en el taller, sigue siendo el 25 de septiembre.
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos, direccion_entrega)
  values ('bbbbbbbb-0000-7000-8000-000000000040', 'bbbbbbbb-0000-7000-8000-000000000001', 'Biblioteca',
          'a_presupuestar', 90000000, 'Juncal 2210, Recoleta');

select tests.guardar_el_borrador('bbbbbbbb-0000-7000-8000-000000000041', 'bbbbbbbb-0000-7000-8000-000000000040');

select is(
  tests.el_presupuesto(),
  'null'::jsonb,
  'con el borrador a medio armar, el presupuesto no viaja: todavía no se le mandó'
);

select tests.mandar_el_presupuesto(
  'bbbbbbbb-0000-7000-8000-000000000041', 'bbbbbbbb-0000-7000-8000-000000000042', '2026-09-20',
  p_vale_hasta => '2026-10-05', p_obra => 'Juncal 2210, Recoleta'
);

select is(
  array(select jsonb_object_keys(tests.el_presupuesto()) as k order by k),
  array['contenido', 'mandado_el', 'numero', 'que_cambio', 'revision'],
  'mandado y esperando la seña, viaja la última revisión: su número, su revisión, el día, lo que cambió y el documento'
);

select is(
  array[
    tests.el_presupuesto() ->> 'numero', tests.el_presupuesto() ->> 'revision',
    tests.el_presupuesto() ->> 'mandado_el', tests.el_presupuesto() ->> 'que_cambio'
  ],
  array['20260920-01', '1', '2026-09-20', null],
  'con el número del día en que se mandó por primera vez, la revisión 1 y nada que diga qué cambió'
);

select is(
  array[
    tests.el_presupuesto() #>> '{contenido,obra}',
    public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000040') ->> 'direccion'
  ],
  array['Juncal 2210, Recoleta', ''],
  'la obra viaja adentro del presupuesto, que es lo que el dueño decidió mandar; la dirección del trabajo sigue sin viajar hasta que aprueba'
);

select tests.guardar_el_borrador('bbbbbbbb-0000-7000-8000-000000000041', 'bbbbbbbb-0000-7000-8000-000000000040');
select tests.mandar_el_presupuesto(
  'bbbbbbbb-0000-7000-8000-000000000041', 'bbbbbbbb-0000-7000-8000-000000000043', '2026-09-24',
  E'  Sumamos un estante más arriba.\n', '2026-10-09', 'Juncal 2210, Recoleta'
);

select is(
  array[
    tests.el_presupuesto() ->> 'numero', tests.el_presupuesto() ->> 'revision',
    tests.el_presupuesto() ->> 'que_cambio'
  ],
  array['20260920-01', '2', 'Sumamos un estante más arriba.'],
  'una revisión mantiene el número y dice qué cambió, sin los blancos de las puntas'
);

select is(
  public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000040') #>> '{fechas,vale_hasta}',
  '2026-10-09',
  'cada revisión renueva la vigencia, que viaja como siempre en fechas.vale_hasta'
);

-- «Por ahora no»: el cliente sigue viendo la etapa en la que estaba, con su presupuesto.
update public.proyectos set estado = 'en_seguimiento'
  where id = 'bbbbbbbb-0000-7000-8000-000000000040';
insert into public.proximos_contactos (proyecto_id, fecha, etapa_previa)
  values ('bbbbbbbb-0000-7000-8000-000000000040', '2026-10-15', 'presupuesto_enviado');

select is(
  tests.el_presupuesto() ->> 'revision',
  '2',
  'en seguimiento, el cliente sigue viendo el presupuesto que esperaba la seña'
);

update public.proyectos set estado = 'presupuesto_enviado'
  where id = 'bbbbbbbb-0000-7000-8000-000000000040';
update public.proyectos set estado = 'en_curso'
  where id = 'bbbbbbbb-0000-7000-8000-000000000040';

select is(
  array(select jsonb_object_keys(tests.el_presupuesto()) as k order by k),
  array['aceptado_el', 'contenido', 'letra', 'mandado_el', 'numero', 'revision'],
  'aprobado, viaja sin lo que cambió y con el día en que se aceptó'
);

select is(
  array[
    tests.el_presupuesto() ->> 'aceptado_el',
    public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000040') #>> '{fechas,aprobado}'
  ],
  array[
    ((now() at time zone 'America/Argentina/Buenos_Aires')::date)::text,
    ((now() at time zone 'America/Argentina/Buenos_Aires')::date)::text
  ],
  'el día en que se aceptó es el de la aprobación, el mismo que dice fechas.aprobado'
);

update public.proyectos set estado = 'presupuesto_enviado'
  where id = 'bbbbbbbb-0000-7000-8000-000000000040';

select is(
  array[tests.el_presupuesto() ->> 'revision', tests.el_presupuesto() ->> 'aceptado_el'],
  array['2', null],
  'si vuelve a presupuesto, vuelve a viajar la revisión que espera la seña, sin el día en que se había aceptado'
);

select * from finish();
