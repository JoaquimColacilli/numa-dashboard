-- La respuesta del cliente al presupuesto (los detalles a mejorar): desde su página aprueba una opción
-- de la última revisión y, si la revisión lo pide, propone un día para que vayan a medir.
-- responder_el_presupuesto es la sexta función que ejecuta anon y sigue el molde de la entrega: el
-- enlace con su huella, MN010 para todo lo que no sirve, la validación entera en la base con el motivo
-- en el detail, una respuesta por revisión, el reenvío idéntico que no duplica y solo {estado} de
-- vuelta. El dueño la ve en su réplica y solo puede marcarla atendida.
--
-- Hoy en el taller es el lunes 26 de octubre de 2026: se puede proponer del miércoles 28 de octubre
-- al viernes 25 de diciembre.

select plan(34);

select set_config('maun.hoy_en_el_taller', '2026-10-26', true);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_estado text;
  v_detalle text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics v_estado = returned_sqlstate, v_detalle = pg_exception_detail;
    return v_estado || ' ' || coalesce(nullif(v_detalle, ''), '-');
end;
$$;

create function tests.aprobacion(p_id text, p_revision text, p_opcion text, p_dia text, p_franja text, p_nota text default '')
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'id', p_id, 'revision_id', p_revision, 'opcion_id', p_opcion, 'dia', p_dia, 'franja', p_franja, 'nota', p_nota
  )
$$;

create function tests.mandar(p_presupuesto_id uuid, p_revision_id uuid, p_extra jsonb, p_vale_hasta date default '2026-11-10')
returns jsonb
language plpgsql
as $$
begin
  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id,
    (select b.borrador_version from public.presupuestos b where b.id = p_presupuesto_id),
    tests.documento_del_presupuesto((select b.proyecto_id from public.presupuestos b where b.id = p_presupuesto_id)) || p_extra,
    case when exists (select 1 from public.revisiones_del_presupuesto r where r.presupuesto_id = p_presupuesto_id) then 'Otra opción' end,
    '2026-10-26', p_vale_hasta
  );
end;
$$;

create function tests.respuestas_de(p_proyecto uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer from public.respuestas_al_presupuesto where proyecto_id = p_proyecto and deleted_at is null
$$;

grant execute on all functions in schema tests to anon, authenticated;


-- Los trabajos de Ana -----------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía García');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto', null),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'a_presupuestar', 40000000),
  ('aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000001', 'Mesa', 'a_presupuestar', 30000000);

insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000201', 'aaaaaaaa-0000-7000-8000-000000000010', 'En melamina', 128000000),
  ('aaaaaaaa-0000-7000-8000-000000000202', 'aaaaaaaa-0000-7000-8000-000000000010', 'Laqueado', 160000000);

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000020');
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000000030');

select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101', '{"estimativo": true, "pideFecha": true}');
select tests.mandar('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000001201', '{"listoPara": "2026-12-07", "senaAntesDel": "2026-10-28"}');
select tests.mandar('aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000001301', '{}', '2026-10-25');

insert into public.enlaces_publicos (proyecto_id, token_hash, token)
select e.proyecto_id::uuid, encode(sha256(convert_to(e.token, 'UTF8')), 'hex'), e.token
from (values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'el-token-del-placard-de-lucia'),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'el-token-del-rack-de-lucia-0'),
  ('aaaaaaaa-0000-7000-8000-000000000030', 'el-token-de-la-mesa-vencida')
) as e (proyecto_id, token);


-- Lo que no sirve se rechaza entero ---------------------------------------------------------------------

select tests.entrar_como_anon();

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('un-token-que-no-existe-0000', '{}') $$),
  'MN010 -',
  'un token que no existe'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia', '[]') $$),
  'MN050 forma',
  'una respuesta que no es un objeto'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana') || '{"otra": 1}') $$),
  'MN050 forma',
  'una clave de más'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000999', '2026-10-29', 'manana')) $$),
  'MN050 opcion',
  'una opción que no es de la revisión'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', null, '2026-10-29', 'manana')) $$),
  'MN050 opcion',
  'con opciones, aprobar va con una'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', null, null)) $$),
  'MN050 dia',
  'la revisión pide fecha: sin día no se aprueba'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-27', 'manana')) $$),
  'MN050 fuera',
  'mañana es demasiado pronto: desde pasado mañana'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-12-26', 'manana')) $$),
  'MN050 fuera',
  'y hasta dentro de sesenta días'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'noche')) $$),
  'MN050 franja',
  'la franja es una de las tres'
);

select is(
  tests.rechazo(format($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana', %L)) $$, repeat('ñ', 301))),
  'MN050 largo',
  'la nota tiene hasta trescientos caracteres'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001201', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana')) $$),
  'MN050 revision',
  'la revisión de otro trabajo no es la última de este'
);

select is(tests.respuestas_de('aaaaaaaa-0000-7000-8000-000000000010'), 0, 'ningún rechazo guardó nada');


-- Aprobar -------------------------------------------------------------------------------------------------

select is(
  public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana', '  Timbre 3B  ')),
  '{"estado": "guardada"}'::jsonb,
  'aprueba la opción A del estimativo y propone el jueves 29 a la mañana'
);

select is(
  public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana', 'Timbre 3B')),
  '{"estado": "guardada"}'::jsonb,
  'el reenvío idéntico de la red se reconoce como el mismo'
);

select is(tests.respuestas_de('aaaaaaaa-0000-7000-8000-000000000010'), 1, 'sin duplicar');

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000001', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000202', '2026-10-29', 'manana')) $$),
  'MN050 respondida',
  'el mismo id con otra opción no es un reenvío'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000002', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000202', '2026-11-02', 'tarde')) $$),
  'MN050 respondida',
  'una sola respuesta por revisión: no se cambia desde la página'
);

select is(
  public.responder_el_presupuesto('el-token-del-rack-de-lucia-0',
    tests.aprobacion('0199c000-0000-7000-8000-000000000003', 'aaaaaaaa-0000-7000-8000-000000001201', null, null, null)),
  '{"estado": "guardada"}'::jsonb,
  'un presupuesto de un solo total que no pide fecha se aprueba sin día'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-de-la-mesa-vencida',
    tests.aprobacion('0199c000-0000-7000-8000-000000000004', 'aaaaaaaa-0000-7000-8000-000000001301', null, null, null)) $$),
  'MN050 revision',
  'un presupuesto vencido ya no espera respuesta'
);

select ok(
  not has_table_privilege('anon', 'public.respuestas_al_presupuesto', 'SELECT, INSERT, UPDATE, DELETE'),
  'anon no tiene ningún grant sobre la tabla'
);


-- Lo que ve el dueño ---------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select is(
  (select array[opcion_id::text, dia::text, franja, nota, respondida_el::text, coalesce(atendida_at::text, 'pendiente')]
   from public.respuestas_al_presupuesto where id = '0199c000-0000-7000-8000-000000000001'),
  array['aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana', 'Timbre 3B', '2026-10-26', 'pendiente'],
  'Ana ve lo que aprobó Lucía, con la nota sin los blancos de las puntas y el día del taller'
);

select is(
  (select estado::text from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  'presupuesto_estimativo',
  'la respuesta no mueve la etapa: lo hace Ana al agendar'
);

select lives_ok(
  $$ update public.respuestas_al_presupuesto set atendida_at = now() where id = '0199c000-0000-7000-8000-000000000001' $$,
  'Ana la marca atendida'
);

select throws_ok(
  $$ update public.respuestas_al_presupuesto set opcion_id = 'aaaaaaaa-0000-7000-8000-000000000202' where id = '0199c000-0000-7000-8000-000000000001' $$,
  '42501', null, 'y no puede cambiar lo que contestó el cliente'
);

select throws_ok(
  $$ insert into public.respuestas_al_presupuesto (household_id, proyecto_id, revision_id, respondida_el)
     values (tests.id('household_a'), 'aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000001301', '2026-10-26') $$,
  '42501', null, 'ni escribir una respuesta a mano'
);

select ok(
  (select public.bootstrap() -> 'respuestas_al_presupuesto') @> '[{"id": "0199c000-0000-7000-8000-000000000001"}]'::jsonb,
  'la respuesta está en la réplica'
);


-- Una revisión nueva vuelve a abrir la respuesta -----------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010',
  tests.borrador_del_presupuesto('Placard con espejo'));
select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001102', '{"estimativo": true, "pideFecha": false}');

select tests.entrar_como_anon();

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000005', 'aaaaaaaa-0000-7000-8000-000000001101', 'aaaaaaaa-0000-7000-8000-000000000201', '2026-10-29', 'manana')) $$),
  'MN050 revision',
  'a la revisión de antes ya no se le contesta'
);

select is(
  tests.rechazo($$ select public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000005', 'aaaaaaaa-0000-7000-8000-000000001102', 'aaaaaaaa-0000-7000-8000-000000000202', '2026-10-29', 'manana')) $$),
  'MN050 dia',
  'la nueva no pide fecha: con día no'
);

select is(
  public.responder_el_presupuesto('el-token-del-placard-de-lucia',
    tests.aprobacion('0199c000-0000-7000-8000-000000000005', 'aaaaaaaa-0000-7000-8000-000000001102', 'aaaaaaaa-0000-7000-8000-000000000202', null, null)),
  '{"estado": "guardada"}'::jsonb,
  'a la nueva se le contesta otra vez'
);

select is(tests.respuestas_de('aaaaaaaa-0000-7000-8000-000000000010'), 2, 'una por revisión');


-- La baja del trabajo se las lleva ------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000010';

select is(tests.respuestas_de('aaaaaaaa-0000-7000-8000-000000000010'), 0, 'borrar el trabajo borra lo que contestó el cliente');

select tests.salir();

select ok(
  has_function_privilege('anon', 'public.responder_el_presupuesto(text, jsonb)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.responder_el_presupuesto(text, jsonb)', 'EXECUTE'),
  'la ejecuta anon y nadie más'
);

select ok(
  not has_function_privilege('anon', 'private.validar_aprobacion(jsonb, jsonb, date)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.validar_aprobacion(jsonb, jsonb, date)', 'EXECUTE'),
  'su gemela no la ejecuta nadie de afuera'
);

select is(
  private.validar_aprobacion(
    tests.aprobacion('0199c000-0000-7000-8000-000000000009', 'aaaaaaaa-0000-7000-8000-000000001201', null, null, null, 'hola'),
    '{"valores": {"tipo": "total", "total": 100}, "pideFecha": false}', '2026-10-26'
  ),
  'dia',
  'sin pedir fecha tampoco va una nota'
);

select * from finish();
