-- Lo que la vista del cliente suma con los detalles a mejorar: el estimativo viaja desde que se le
-- manda, en cualquier etapa antes de aprobar, con su vigencia; la revisión que espera respuesta lleva
-- su id y lo que el cliente le contestó a ella, sin la nota, y a ninguna otra; una revisión que no es
-- estimativo sigue viajando solo desde que el trabajo está en presupuesto enviado.

select plan(15);

select set_config('maun.hoy_en_el_taller', '2026-10-26', true);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.mandar(p_presupuesto_id uuid, p_revision_id uuid, p_extra jsonb)
returns jsonb
language plpgsql
as $$
begin
  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id,
    (select b.borrador_version from public.presupuestos b where b.id = p_presupuesto_id),
    tests.documento_del_presupuesto((select b.proyecto_id from public.presupuestos b where b.id = p_presupuesto_id)) || p_extra,
    case when exists (select 1 from public.revisiones_del_presupuesto r where r.presupuesto_id = p_presupuesto_id) then 'Otra opción' end,
    '2026-10-26', '2026-11-10'
  );
end;
$$;

create function tests.la_vista(p_proyecto uuid)
returns jsonb
language sql
as $$
  select public.vista_del_cliente(p_proyecto)
$$;

grant execute on all functions in schema tests to anon, authenticated;

select tests.entrar_como(tests.id('ana'));

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía García');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto', null),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'relevamiento', 40000000);

insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000201', 'aaaaaaaa-0000-7000-8000-000000000010', 'En melamina', 128000000),
  ('aaaaaaaa-0000-7000-8000-000000000202', 'aaaaaaaa-0000-7000-8000-000000000010', 'Laqueado', 160000000);

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000020');

insert into public.enlaces_publicos (proyecto_id, token_hash, token)
values ('aaaaaaaa-0000-7000-8000-000000000010', encode(sha256(convert_to('el-token-del-placard-de-lucia', 'UTF8')), 'hex'), 'el-token-del-placard-de-lucia');


-- El estimativo viaja desde que se le manda ---------------------------------------------------------------

select is(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') -> 'presupuesto', 'null'::jsonb, 'antes de mandarlo no viaja nada');

select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101', '{"estimativo": true, "pideFecha": true}');

select set_eq(
  $$ select jsonb_object_keys(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') -> 'presupuesto') $$,
  array['numero', 'revision', 'mandado_el', 'que_cambio', 'contenido', 'idioma', 'revision_id', 'respuesta'],
  'el estimativo mandado viaja como un presupuesto que espera, con su id para contestarle y su respuesta'
);

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #>> '{presupuesto,revision_id}',
  'aaaaaaaa-0000-7000-8000-000000001101',
  'el id es el de la última revisión'
);

select is(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #> '{presupuesto,respuesta}', 'null'::jsonb, 'sin contestar, la respuesta va en null');

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #>> '{fechas,vale_hasta}',
  '2026-11-10',
  'y viaja hasta cuándo vale, que decide si todavía se puede aprobar'
);

select is(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') ->> 'estado', 'presupuesto_estimativo', 'en estimativo enviado');

select is(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') -> 'precio_centavos', 'null'::jsonb, 'el precio no viaja: los importes van adentro de la revisión');


-- Lo que contestó viaja, sin la nota -------------------------------------------------------------------------

select tests.entrar_como_anon();
select public.responder_el_presupuesto('el-token-del-placard-de-lucia', jsonb_build_object(
  'id', '0199c000-0000-7000-8000-000000000001', 'revision_id', 'aaaaaaaa-0000-7000-8000-000000001101',
  'opcion_id', 'aaaaaaaa-0000-7000-8000-000000000201', 'dia', '2026-10-29', 'franja', 'manana', 'nota', 'AGUJA DE LA NOTA'
));
select tests.entrar_como(tests.id('ana'));

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #> '{presupuesto,respuesta}',
  '{"opcion_id": "aaaaaaaa-0000-7000-8000-000000000201", "respondida_el": "2026-10-26", "dia": "2026-10-29", "franja": "manana"}'::jsonb,
  'la opción, el día en que contestó, el día que propone y la franja'
);

select ok(
  position('AGUJA DE LA NOTA' in tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010')::text) = 0,
  'la nota que escribió es para el taller: no vuelve a su página'
);


-- Una revisión nueva: la respuesta a la de antes no viaja --------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010',
  tests.borrador_del_presupuesto('Placard con espejo'));
select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001102', '{"estimativo": true, "pideFecha": true}');

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #>> '{presupuesto,revision_id}',
  'aaaaaaaa-0000-7000-8000-000000001102',
  'viaja la revisión nueva'
);

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010') #> '{presupuesto,respuesta}',
  'null'::jsonb,
  'y sin respuesta: lo que contestó a la de antes no viaja'
);

select ok(
  position('0199c000-0000-7000-8000-000000000001' in tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010')::text) = 0
    and position('2026-10-29' in tests.la_vista('aaaaaaaa-0000-7000-8000-000000000010')::text) = 0,
  'ni su id ni el día que había propuesto aparecen en ninguna parte'
);


-- Un presupuesto que no es estimativo, antes de presupuesto enviado, no viaja -------------------------------------

select tests.mandar('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000001201', '{"estimativo": false}');
update public.proyectos set estado = 'relevamiento' where id = 'aaaaaaaa-0000-7000-8000-000000000020';

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000020') -> 'presupuesto',
  'null'::jsonb,
  'vuelto a relevamiento, el presupuesto de antes no viaja, como hasta ahora'
);

select is(
  tests.la_vista('aaaaaaaa-0000-7000-8000-000000000020') #> '{fechas,vale_hasta}',
  'null'::jsonb,
  'ni su vigencia'
);


-- Aprobado, la respuesta ya no viaja -----------------------------------------------------------------------------

update public.proyectos set estado = 'presupuesto_enviado' where id = 'aaaaaaaa-0000-7000-8000-000000000020';
update public.proyectos set estado = 'en_curso', fecha_inicio = '2026-10-26' where id = 'aaaaaaaa-0000-7000-8000-000000000020';

select set_eq(
  $$ select jsonb_object_keys(tests.la_vista('aaaaaaaa-0000-7000-8000-000000000020') -> 'presupuesto') $$,
  array['numero', 'revision', 'mandado_el', 'contenido', 'idioma', 'aceptado_el', 'letra'],
  'aprobado viaja lo de siempre: ni el id para contestarle ni la respuesta'
);

select * from finish();
