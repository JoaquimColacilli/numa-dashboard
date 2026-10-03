-- Los idiomas (ADR 0082): el de los clientes del taller, que es el de su página, la encuesta y la vista
-- previa del enlace; el de cada revisión del presupuesto, que manda la app (o, si no lo manda, el de los
-- clientes del taller); y el de cada persona en los avisos de la mañana, leído de su cuenta.
--
-- Taller A en portugués para sus clientes, taller B como de fábrica. Los textos que escribió el dueño no
-- se traducen: acá solo viaja el idioma.

select plan(24);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('b', tests.crear_usuario('b@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller B', tests.id('b')));

-- El código, el detalle y el mensaje de un rechazo.
create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_codigo text;
  v_detalle text;
  v_mensaje text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics
      v_codigo = returned_sqlstate,
      v_detalle = pg_exception_detail,
      v_mensaje = message_text;
    return v_codigo || ' ' || coalesce(nullif(v_detalle, ''), '-') || ': ' || v_mensaje;
end;
$$;

-- Mandar el presupuesto como lo manda la app, con la revisión del borrador que hay ahora y, si viene,
-- el idioma con que lo armó. Sin idioma, como lo manda una app sin actualizar.
create function tests.mandar_en(p_presupuesto_id uuid, p_revision_id uuid, p_mandado_el date, p_idioma text)
returns jsonb
language plpgsql
as $$
declare
  v_version integer;
  v_proyecto uuid;
begin
  select b.borrador_version, b.proyecto_id into v_version, v_proyecto
  from public.presupuestos b
  where b.id = p_presupuesto_id;

  if p_idioma is null then
    return public.mandar_el_presupuesto(
      p_presupuesto_id, p_revision_id, v_version, tests.documento_del_presupuesto(v_proyecto),
      case when p_mandado_el > '2026-09-20' then 'Otra revisión' end, p_mandado_el, null
    );
  end if;
  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id, v_version, tests.documento_del_presupuesto(v_proyecto),
    case when p_mandado_el > '2026-09-20' then 'Otra revisión' end, p_mandado_el, null, p_idioma
  );
end;
$$;

create function tests.registrar(p_endpoint text)
returns jsonb
language sql
as $$
  select public.registrar_suscripcion(p_endpoint, 'B' || repeat('x', 86), repeat('y', 22), 'America/Argentina/Buenos_Aires')
$$;

create function tests.idioma_del_aviso(p_endpoint text)
returns text
language sql
as $$
  select e ->> 'idioma'
  from jsonb_array_elements(public.avisos_por_mandar('2026-09-14 10:40:00+00')) as e
  where e ->> 'endpoint' = p_endpoint
$$;

grant usage on schema tests to service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;


-- El idioma de los clientes del taller ---------------------------------------------------------------------

select is(
  (select idioma_de_los_clientes from public.ajustes where household_id = tests.id('household_a')),
  'es',
  'un taller nuevo les habla a sus clientes en español, como hasta ahora'
);

select ok(
  has_column_privilege('authenticated', 'public.ajustes', 'idioma_de_los_clientes', 'UPDATE'),
  'el dueño lo cambia con un update de su columna, como el resto de los ajustes'
);

select tests.entrar_como(tests.id('a'));

select throws_ok(
  format($$ update public.ajustes set idioma_de_los_clientes = 'fr' where household_id = %L $$, tests.id('household_a')),
  '23514', 'new row for relation "ajustes" violates check constraint "ajustes_idioma_de_los_clientes_valido"',
  'es uno de los tres: español, inglés o portugués de Brasil'
);

select throws_ok(
  format($$ update public.ajustes set idioma_de_los_clientes = 'pt' where household_id = %L $$, tests.id('household_a')),
  '23514', 'new row for relation "ajustes" violates check constraint "ajustes_idioma_de_los_clientes_valido"',
  'con su valor exacto: el portugués es pt-BR'
);

select lives_ok(
  format($$ update public.ajustes set idioma_de_los_clientes = 'pt-BR' where household_id = %L $$, tests.id('household_a')),
  'el taller A pasa a sus clientes al portugués'
);


-- Un trabajo con su presupuesto, su enlace y su encuesta ----------------------------------------------------

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Marcela Duarte');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'a_presupuestar', 120000000);
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000010');


-- El idioma de cada revisión ---------------------------------------------------------------------------------

select is(
  tests.mandar_en(
    'aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000021', '2026-09-20', 'en'
  ) #>> '{revision,idioma}',
  'en',
  'la revisión se congela en el idioma con que la app armó el documento, aunque los clientes lean otro'
);

select is(
  tests.mandar_en(
    'aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000021', '2026-09-20', 'es'
  ) #>> '{revision,idioma}',
  'en',
  'el reenvío de la cola devuelve lo que quedó, con su idioma, aunque venga con otro'
);

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000010');

select is(
  tests.rechazo($$
    select tests.mandar_en(
      'aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000022', '2026-09-22', 'fr'
    )
  $$),
  'MN031 idioma: El presupuesto no se pudo mandar.',
  'un idioma que no es uno de los tres no se manda: MN031 con el motivo'
);

select is(
  (select count(*)::int from public.revisiones_del_presupuesto where presupuesto_id = 'aaaaaaaa-0000-7000-8000-000000000020'),
  1,
  'y no congela nada'
);

select is(
  tests.mandar_en(
    'aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000022', '2026-09-22', null
  ) #>> '{revision,idioma}',
  'pt-BR',
  'una app sin actualizar no manda el idioma: la revisión toma el de los clientes del taller'
);

select tests.salir();

select throws_ok(
  $$ update public.revisiones_del_presupuesto set idioma = 'fr' where id = 'aaaaaaaa-0000-7000-8000-000000000022' $$,
  '23514', 'new row for relation "revisiones_del_presupuesto" violates check constraint "revisiones_del_presupuesto_idioma_valido"',
  'el idioma de una revisión también es uno de los tres, ni siquiera el dueño de la base pone otro'
);

select tests.entrar_como(tests.id('a'));


-- Lo que lee el cliente ---------------------------------------------------------------------------------------

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') ->> 'idioma',
  'pt-BR',
  'la vista del cliente trae el idioma de los clientes del taller: la página le habla en él'
);

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') #>> '{presupuesto,idioma}',
  'pt-BR',
  'y el presupuesto trae el de su última revisión, que es el de su contenido'
);

update public.proyectos set estado = 'en_curso' where id = 'aaaaaaaa-0000-7000-8000-000000000010';

select is(
  public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000010') #>> '{presupuesto,idioma}',
  'pt-BR',
  'aprobado, también'
);

insert into public.enlaces_publicos (id, proyecto_id, token_hash) values (
  'aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000010',
  encode(sha256(convert_to('el-token-del-placard-de-a', 'UTF8')), 'hex')
);

update public.proyectos set estado = 'entregado', fecha_entrega = '2026-09-25'
  where id = 'aaaaaaaa-0000-7000-8000-000000000010';
insert into public.encuestas_enviadas (proyecto_id, token_hash, token) values (
  'aaaaaaaa-0000-7000-8000-000000000010',
  encode(sha256(convert_to('la-encuesta-del-placard-a', 'UTF8')), 'hex'), 'la-encuesta-del-placard-a'
);

-- La primera pregunta de la encuesta de fábrica, sembrada en castellano.
select set_config(
  'tests.primera_pregunta',
  (select p.texto from public.preguntas p where p.proyecto_id is null and p.orden = 10),
  true
);

select tests.entrar_como(tests.id('b'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Martín Quiroga');
insert into public.proyectos (id, cliente_id, titulo, estado)
  values ('bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'Mesa', 'contacto');
insert into public.enlaces_publicos (id, proyecto_id, token_hash) values (
  'bbbbbbbb-0000-7000-8000-000000000030', 'bbbbbbbb-0000-7000-8000-000000000010',
  encode(sha256(convert_to('el-token-de-la-mesa-de-b', 'UTF8')), 'hex')
);

select is(
  public.vista_del_cliente('bbbbbbbb-0000-7000-8000-000000000010') ->> 'idioma',
  'es',
  'cada taller con el suyo: B sigue en español'
);

select tests.entrar_como_anon();

select is(
  public.vista_compartida('el-token-del-placard-de-a') ->> 'idioma',
  'pt-BR',
  'desde el enlace, el cliente sin sesión recibe el mismo idioma'
);

select is(
  public.titulo_compartido('el-token-del-placard-de-a'),
  jsonb_build_object('trabajo', 'Placard', 'taller', 'Taller A', 'idioma', 'pt-BR'),
  'el título de la vista previa trae el idioma con el trabajo y el taller, y nada más'
);

select is(
  public.titulo_compartido('el-token-de-la-mesa-de-b') ->> 'idioma',
  'es',
  'el de B, en español'
);

select is(
  public.encuesta_compartida('la-encuesta-del-placard-a') ->> 'idioma',
  'pt-BR',
  'la encuesta también le habla en el idioma de los clientes del taller'
);

select is(
  public.encuesta_compartida('la-encuesta-del-placard-a') -> 'preguntas' -> 0 ->> 'texto',
  current_setting('tests.primera_pregunta'),
  'y sus preguntas quedan como las escribió el dueño: no se traducen'
);


-- El idioma de los avisos de la mañana ------------------------------------------------------------------------

select tests.salir();
select tests.guardar('en', tests.crear_usuario('en@maun.test'));
select tests.guardar('household_en', private.crear_household('Workshop', tests.id('en')));
select tests.guardar('fr', tests.crear_usuario('fr@maun.test'));
select tests.guardar('household_fr', private.crear_household('Atelier', tests.id('fr')));
update auth.users set raw_user_meta_data = '{"nombre": "Ann", "idioma": "en"}' where id = tests.id('en');
update auth.users set raw_user_meta_data = '{"idioma": "fr"}' where id = tests.id('fr');

select tests.entrar_como(tests.id('a'));
select tests.registrar('https://push.example/a');
select tests.entrar_como(tests.id('en'));
select tests.registrar('https://push.example/en');
select tests.entrar_como(tests.id('fr'));
select tests.registrar('https://push.example/fr');

select tests.salir();
select set_config('role', 'service_role', true);

select is(
  tests.idioma_del_aviso('https://push.example/en'),
  'en',
  'el aviso de quien eligió inglés para su cuenta sale con su idioma'
);

select is(
  tests.idioma_del_aviso('https://push.example/a'),
  'es',
  'el de quien no eligió ninguno, en español, como siempre'
);

select is(
  tests.idioma_del_aviso('https://push.example/fr'),
  'es',
  'y el de un idioma que no es uno de los tres, también en español'
);

select tests.salir();

select is(
  (
    select count(*)::int
    from jsonb_array_elements(private.avisos_por_mandar('2026-09-14 10:40:00+00')) as e
    where e ->> 'endpoint' like 'https://push.example/%' and not (e ? 'idioma')
  ),
  0,
  'todo aviso lleva su idioma'
);

select * from finish();
