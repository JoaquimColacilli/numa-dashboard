-- Lo que se pregunta en una consulta: la lista del taller en ajustes, con el domicilio primero y hasta
-- doce, y lo contestado de cada trabajo, por id de pregunta y con la pregunta como estaba. Cada una se
-- escribe con un update de su columna sola y su check de forma rechaza lo que no es.

select plan(16);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));

select tests.entrar_como(tests.id('a'));

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía');
insert into public.proyectos (id, cliente_id, titulo, estado) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto');

select is(
  (select preguntas_de_la_consulta from public.ajustes where household_id = tests.id('household_a')),
  null,
  'un taller nace con las preguntas de siempre: la columna en null'
);

select lives_ok(
  $$ update public.ajustes set preguntas_de_la_consulta =
       '[{"id": "domicilio", "rotulo": "Domicilio", "ayuda": ""},
         {"id": "acceso", "rotulo": "Acceso al lugar", "ayuda": "Escaleras, piso, tamaño del ascensor."},
         {"id": "medidas", "rotulo": "Medidas", "ayuda": "Ancho y alto del lugar."}]'
     where household_id = tests.id('household_a') $$,
  'el dueño guarda su lista con un update de esa columna sola'
);

select throws_ok(
  $$ update public.ajustes set preguntas_de_la_consulta = '[{"id": "acceso", "rotulo": "Acceso", "ayuda": ""}]'
     where household_id = tests.id('household_a') $$,
  '23514', null, 'sin el domicilio primero no se guarda'
);

select throws_ok(
  $$ update public.ajustes set preguntas_de_la_consulta = '[{"id": "domicilio", "rotulo": "Domicilio", "ayuda": "", "otra": 1}]'
     where household_id = tests.id('household_a') $$,
  '23514', null, 'una pregunta con otra clave no se guarda'
);

select throws_ok(
  $$ update public.ajustes set preguntas_de_la_consulta = (
       select jsonb_agg(jsonb_build_object('id', case when n = 1 then 'domicilio' else 'p' || n end, 'rotulo', 'Pregunta', 'ayuda', ''))
       from generate_series(1, 13) as n)
     where household_id = tests.id('household_a') $$,
  '23514', null, 'trece preguntas son demasiadas'
);

select throws_ok(
  $$ update public.ajustes set preguntas_de_la_consulta = '[{"id": "domicilio", "rotulo": "Domicilio", "ayuda": ""}, {"id": "domicilio", "rotulo": "Otra", "ayuda": ""}]'
     where household_id = tests.id('household_a') $$,
  '23514', null, 'dos preguntas con el mismo id no se guardan'
);

select is(private.problema_de_las_preguntas('[{"id": "domicilio", "rotulo": "  ", "ayuda": ""}]'), 'rotulo-invalido', 'un rótulo en blanco');
select is(private.problema_de_las_preguntas(jsonb_build_array(jsonb_build_object('id', 'domicilio', 'rotulo', 'D', 'ayuda', repeat('a', 121)))), 'ayuda-invalida', 'una ayuda de más de 120');
select is(private.problema_de_las_preguntas('[{"id": "domicilio", "rotulo": "D", "ayuda": ""}, {"id": "Acceso", "rotulo": "A", "ayuda": ""}]'), 'id-invalido', 'un id con mayúscula');

select is(
  (select respuestas_de_la_consulta from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  '[]'::jsonb,
  'un trabajo nace sin nada contestado'
);

select lives_ok(
  $$ update public.proyectos set respuestas_de_la_consulta =
       '[{"id": "acceso", "pregunta": "Acceso al lugar", "respuesta": "Tercer piso por escalera"}]'
     where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'lo contestado se guarda con un update de esa columna sola'
);

select throws_ok(
  $$ update public.proyectos set respuestas_de_la_consulta =
       '[{"id": "domicilio", "pregunta": "Domicilio", "respuesta": "Arenales 1840"}]'
     where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  '23514', null, 'el domicilio no se contesta acá: es la dirección del trabajo'
);

select throws_ok(
  $$ update public.proyectos set respuestas_de_la_consulta =
       '[{"id": "acceso", "pregunta": "Acceso", "respuesta": "   "}]'
     where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  '23514', null, 'una respuesta en blanco no se guarda: se saca'
);

select is(private.problema_de_las_respuestas(jsonb_build_array(jsonb_build_object('id', 'acceso', 'pregunta', 'A', 'respuesta', repeat('ñ', 501)))), 'respuesta-invalida', 'una respuesta de más de 500');

select tests.salir();

select ok(
  has_column_privilege('authenticated', 'public.ajustes', 'preguntas_de_la_consulta', 'UPDATE')
    and has_column_privilege('authenticated', 'public.proyectos', 'respuestas_de_la_consulta', 'UPDATE'),
  'el dueño escribe las dos columnas'
);

select ok(
  not has_column_privilege('anon', 'public.ajustes', 'preguntas_de_la_consulta', 'SELECT')
    and not has_column_privilege('anon', 'public.proyectos', 'respuestas_de_la_consulta', 'SELECT')
    and not has_function_privilege('anon', 'private.problema_de_las_preguntas(jsonb)', 'EXECUTE'),
  'anon no las ve ni ejecuta su check'
);

select * from finish();
