-- El presupuesto adentro de la ficha (ADR 0080): los datos del taller, la plantilla con sus textos de
-- siempre, el borrador de cada trabajo y lo que se le mandó al cliente. Quién los escribe (nadie a
-- mano), la plantilla y el borrador con su revisión, mandarlo con el número del día, cada rechazo
-- entero y sin congelar nada, la baja con el trabajo y lo que otro taller no ve ni toca.

select plan(67);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));
select tests.guardar('beto', tests.crear_usuario('beto@maun.test'));
select tests.guardar('household_b', private.crear_household('Taller de Beto', tests.id('beto')));

-- El rechazo de una llamada como texto: código, motivo y mensaje. 'ok' si no rechazó.
create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_estado text;
  v_detalle text;
  v_mensaje text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics
      v_estado = returned_sqlstate,
      v_detalle = pg_exception_detail,
      v_mensaje = message_text;
    return v_estado || ' ' || coalesce(nullif(v_detalle, ''), '-') || ': ' || v_mensaje;
end;
$$;

-- Mandar un documento armado a mano, con la revisión del borrador que hay ahora.
create function tests.mandar_con(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_documento jsonb,
  p_que_cambio text default null
)
returns jsonb
language plpgsql
as $$
begin
  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id,
    (select b.borrador_version from public.presupuestos b where b.id = p_presupuesto_id),
    p_documento, p_que_cambio, '2026-09-20', null
  );
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Una plantilla chica que se puede guardar: una cláusula, una forma de pago y la garantía.
select set_config('tests.plantilla', $${
  "forma": 1, "plazoDeFabricacion": 30, "modificacionesIncluidas": 2,
  "valorDeUnaModificacion": 5000000, "garantiaMeses": 6,
  "incluye": [{"id": "incluye-visita", "titulo": null, "texto": "Visita a domicilio para medición y definición de detalles.", "tildadaPorDefecto": true}],
  "aTenerEnCuenta": [], "avisos": [], "condiciones": [],
  "formasDePago": [{"id": "sena-y-entrega", "nombre": "Seña y contra entrega", "texto": "Seña del {sena} para confirmar el trabajo y el saldo contra entrega."}],
  "garantia": "Garantía de {meses} desde la entrega e instalación."
}$$, true);


-- Los datos del taller ------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select ok(
  has_column_privilege('authenticated', 'public.ajustes', 'taller_titular', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_cuit', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_condicion_fiscal', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_domicilio', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_telefono', 'UPDATE')
    and has_column_privilege('authenticated', 'public.ajustes', 'taller_email', 'UPDATE'),
  'los datos del taller para el presupuesto tienen grant de update, como el resto de los ajustes'
);

select lives_ok(
  format(
    $$ update public.ajustes set taller_titular = 'Ana Gutiérrez', taller_cuit = '27-30123456-4',
         taller_condicion_fiscal = 'monotributo', taller_domicilio = 'Avenida Rivadavia 7000, CABA',
         taller_telefono = '11 4444-0000', taller_email = 'ana@ejemplo.com'
       where household_id = %L $$,
    tests.id('household_a')
  ),
  'el dueño los guarda con un update de sus columnas, como el resto de los ajustes'
);

select throws_ok(
  format($$ update public.ajustes set taller_cuit = '27301234564' where household_id = %L $$, tests.id('household_a')),
  '23514',
  null,
  'el CUIT del taller va con guiones, como el de la cuenta'
);

select throws_ok(
  format($$ update public.ajustes set taller_condicion_fiscal = 'consumidor_final' where household_id = %L $$, tests.id('household_a')),
  '23514',
  null,
  'y la condición fiscal es una de las tres que puede tener quien presupuesta'
);


-- La plantilla del taller ----------------------------------------------------------------------------------

select ok(
  not has_column_privilege('authenticated', 'public.ajustes', 'plantilla_del_presupuesto', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.ajustes', 'plantilla_del_presupuesto_version', 'UPDATE'),
  'la plantilla no tiene grant de update: la escribe solo guardar_la_plantilla_del_presupuesto'
);

select ok(
  not (
    select p.prosecdef from pg_proc p
    where p.oid = 'public.guardar_la_plantilla_del_presupuesto(integer, jsonb)'::regprocedure
  )
  and (
    select p.prosecdef from pg_proc p
    where p.oid = 'private.guardar_la_plantilla_del_presupuesto(integer, jsonb)'::regprocedure
  ),
  'la de public corre con los permisos de quien llama y su privada, elevada: el molde de guardar_la_fila'
);

select is(
  (public.guardar_la_plantilla_del_presupuesto(0, current_setting('tests.plantilla')::jsonb)).plantilla_del_presupuesto_version,
  1,
  'guardar los textos de siempre suma una revisión'
);

select is(
  (select plantilla_del_presupuesto from public.ajustes where household_id = tests.id('household_a')),
  current_setting('tests.plantilla')::jsonb,
  'y quedan guardados tal cual'
);

select is(
  (public.guardar_la_plantilla_del_presupuesto(0, current_setting('tests.plantilla')::jsonb)).plantilla_del_presupuesto_version,
  1,
  'el reenvío idéntico devuelve los ajustes como quedaron'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_plantilla_del_presupuesto(0, %L) $$,
    current_setting('tests.plantilla')::jsonb || '{"plazoDeFabricacion": 45}'
  )),
  'MN030 revisión vista 0, revisión actual 1: Los textos del presupuesto se cambiaron en otro aparato.',
  'con una revisión vieja rebota: otro aparato los cambió'
);

select is(
  tests.rechazo($$ select public.guardar_la_plantilla_del_presupuesto(1, '{"forma": 1}') $$),
  'MN031 forma-invalida: Los textos del presupuesto no se pudieron guardar.',
  'una plantilla que no tiene la forma no se guarda'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_la_plantilla_del_presupuesto(1, %L) $$,
    current_setting('tests.plantilla')::jsonb || '{"formasDePago": []}'
  )),
  'MN031 sin-formas-de-pago: Los textos del presupuesto no se pudieron guardar.',
  'ni una sin ninguna forma de pago: la base saca la misma cuenta que problemaDeLaPlantilla'
);

select is(
  (
    select array[(a.plantilla_del_presupuesto_version)::text, (a.plantilla_del_presupuesto is null)::text]
    from public.guardar_la_plantilla_del_presupuesto(1, null) as a
  ),
  array['2', 'true'],
  'con null vuelve a los textos de siempre, y también suma una revisión'
);

select throws_ok(
  format(
    $$ update public.ajustes set plantilla_del_presupuesto = '{}' where household_id = %L $$,
    tests.id('household_a')
  ),
  '42501',
  null,
  'la plantilla no se escribe con un update suelto'
);


-- Nadie escribe el presupuesto a mano ---------------------------------------------------------------------

select ok(
  not has_table_privilege('authenticated', 'public.presupuestos', 'INSERT')
    and not has_table_privilege('authenticated', 'public.presupuestos', 'UPDATE')
    and not has_any_column_privilege('authenticated', 'public.presupuestos', 'INSERT, UPDATE'),
  'la app no escribe el borrador a mano: lo escriben guardar_el_presupuesto y mandar_el_presupuesto'
);

select ok(
  not has_table_privilege('authenticated', 'public.revisiones_del_presupuesto', 'INSERT')
    and not has_table_privilege('authenticated', 'public.revisiones_del_presupuesto', 'UPDATE')
    and not has_any_column_privilege('authenticated', 'public.revisiones_del_presupuesto', 'INSERT, UPDATE'),
  'nadie escribe una revisión a mano: no hay insert ni update para authenticated'
);

select ok(
  (
    select bool_and(not p.prosecdef)
    from pg_proc p
    where p.oid in (
      'public.guardar_el_presupuesto(uuid, uuid, integer, jsonb)'::regprocedure,
      'public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date)'::regprocedure
    )
  )
  and (
    select bool_and(p.prosecdef)
    from pg_proc p
    where p.oid in (
      'private.guardar_el_presupuesto(uuid, uuid, integer, jsonb)'::regprocedure,
      'private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date)'::regprocedure
    )
  ),
  'las dos puertas del presupuesto corren con los permisos de quien llama, y sus privadas elevadas'
);


-- Dos talleres con sus trabajos ------------------------------------------------------------------------

select tests.entrar_como(tests.id('beto'));
insert into public.clientes (id, nombre) values ('bbbbbbbb-0000-7000-8000-000000000001', 'Martín Quiroga');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('bbbbbbbb-0000-7000-8000-000000000010', 'bbbbbbbb-0000-7000-8000-000000000001', 'Placard de Beto', 'a_presupuestar', 100000000);
select tests.guardar_el_borrador('bbbbbbbb-0000-7000-8000-000000000110', 'bbbbbbbb-0000-7000-8000-000000000010');

select tests.entrar_como(tests.id('ana'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Paula Benítez');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'a_presupuestar', 120000000),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Vanitory', 'contacto', null),
  ('aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000001', 'Escritorio', 'presupuesto_estimativo', 50000000),
  ('aaaaaaaa-0000-7000-8000-000000000040', 'aaaaaaaa-0000-7000-8000-000000000001', 'Mesa', 'contacto', 30000000),
  ('aaaaaaaa-0000-7000-8000-000000000050', 'aaaaaaaa-0000-7000-8000-000000000001', 'Biblioteca', 'a_presupuestar', 70000000),
  ('aaaaaaaa-0000-7000-8000-000000000060', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'a_presupuestar', 40000000);

-- El relevamiento que el cliente del placard ya pagó: va como abonado en el documento.
insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-01', 'Relevamiento', 12000000);

insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000201', 'aaaaaaaa-0000-7000-8000-000000000020', 'En melamina', 80000000),
  ('aaaaaaaa-0000-7000-8000-000000000202', 'aaaaaaaa-0000-7000-8000-000000000020', 'Laqueado', 95000000);

-- El escritorio, en seguimiento después del estimativo.
update public.proyectos set estado = 'en_seguimiento' where id = 'aaaaaaaa-0000-7000-8000-000000000030';
insert into public.proximos_contactos (id, proyecto_id, fecha, etapa_previa)
  values ('aaaaaaaa-0000-7000-8000-000000000031', 'aaaaaaaa-0000-7000-8000-000000000030', '2026-10-15', 'presupuesto_estimativo');


-- Guardar el borrador -----------------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.presupuestos (proyecto_id, contenido) values ('aaaaaaaa-0000-7000-8000-000000000010', '{}') $$,
  '42501',
  null,
  'Ana no inserta un borrador a mano: no tiene grant'
);

select is(
  (
    select array[g ->> 'borrador_version', g ->> 'numero', g ->> 'aceptado_el']
    from tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010') as g
  ),
  array['1', null, null],
  'el alta del borrador lo deja en su revisión 1, sin número ni día de aceptación'
);

select is(
  (public.guardar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 1,
    tests.borrador_del_presupuesto('Placard de pasillo')
  )).borrador_version,
  2,
  'con la revisión que vio la app, guardarlo suma una'
);

select set_config(
  'tests.version_de_la_fila',
  (select version::text from public.presupuestos where id = 'aaaaaaaa-0000-7000-8000-000000000110'),
  true
);

select is(
  (public.guardar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 1,
    tests.borrador_del_presupuesto('Placard de pasillo')
  )).borrador_version,
  2,
  'el reenvío idéntico de la cola devuelve el borrador como quedó, sin sumar otra revisión'
);

select is(
  (select version from public.presupuestos where id = 'aaaaaaaa-0000-7000-8000-000000000110'),
  current_setting('tests.version_de_la_fila')::integer,
  'ni tocar la fila'
);

select is(
  tests.rechazo($$
    select public.guardar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 1,
      tests.borrador_del_presupuesto('Placard con otro título')
    )
  $$),
  'MN026 revisión vista 1, revisión actual 2: Este presupuesto se cambió en otro aparato.',
  'con una revisión vieja rebota: otro aparato lo cambió'
);

select is(
  tests.rechazo($$
    select public.guardar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000119', 'aaaaaaaa-0000-7000-8000-000000000010', 0,
      tests.borrador_del_presupuesto()
    )
  $$),
  'MN026 el trabajo ya tiene otro borrador: Este presupuesto se cambió en otro aparato.',
  'un alta con otro id para un trabajo que ya tiene borrador, como la de dos aparatos sin señal, rebota con el mismo código y no con el 23505 del índice único'
);

select is(
  (select count(*)::integer from public.presupuestos where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  1,
  'y no deja un segundo borrador'
);

select is(
  tests.rechazo($$
    select public.guardar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 2, '{"forma": 2}'
    )
  $$),
  'MN031 forma-invalida: El presupuesto no se pudo guardar.',
  'un borrador que no tiene la forma no se guarda, con el código del problema en el detail'
);

select is(
  tests.rechazo(format(
    $$ select public.guardar_el_presupuesto('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 2, %L) $$,
    tests.borrador_del_presupuesto(repeat('a', 201))
  )),
  'MN031 titulo-largo: El presupuesto no se pudo guardar.',
  'ni uno con un título de más de 200 caracteres: la base saca la misma cuenta que problemaDelBorrador'
);

select is(
  tests.rechazo($$
    select public.guardar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000119', 'bbbbbbbb-0000-7000-8000-000000000010', 0,
      tests.borrador_del_presupuesto()
    )
  $$),
  '42501 -: El trabajo no existe o no es tuyo',
  'el trabajo de otro taller no existe para Ana: no le arma un borrador'
);


-- Mandarlo ----------------------------------------------------------------------------------------------

select set_config(
  'tests.mandado',
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', '2026-09-20',
    p_vale_hasta => '2026-10-05'
  )::text,
  true
);

select is(
  array[
    current_setting('tests.mandado')::jsonb #>> '{revision,numero}',
    current_setting('tests.mandado')::jsonb #>> '{revision,revision}',
    current_setting('tests.mandado')::jsonb #>> '{presupuesto,numero}'
  ],
  array['20260920-01', '1', '20260920-01'],
  'el primer envío congela la revisión 1 con el número del día: es el primero del taller'
);

select is(
  (
    select array[estado::text, presupuesto_vale_hasta::text, ultimo_contacto::text, presupuesto_pdf::text]
    from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  ),
  array['presupuesto_enviado', '2026-10-05', '2026-09-20', 'true'],
  'y pasa el trabajo a presupuesto enviado, con la vigencia, el último contacto y la tarea del presupuesto tildada'
);

select is(
  array(select k from jsonb_object_keys(current_setting('tests.mandado')::jsonb) as k order by k),
  array['presupuesto', 'proximos_contactos', 'proyecto', 'revision'],
  'devuelve la revisión, el borrador, el trabajo y sus próximos contactos, para la réplica'
);

select is(
  (select borrador_version from public.presupuestos where id = 'aaaaaaaa-0000-7000-8000-000000000110'),
  2,
  'mandarlo no toca la revisión del borrador: ponerle número no es un guardado'
);

select is(
  current_setting('tests.mandado')::jsonb #> '{revision,contenido}',
  tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010'),
  'la revisión guarda el documento tal como lo armó la app'
);

select is(
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', '2026-09-20',
    p_vale_hasta => '2026-10-05'
  ) #>> '{revision,id}',
  'aaaaaaaa-0000-7000-8000-000000000111',
  'el reenvío del mismo envío devuelve la revisión que ya se congeló'
);

select is(
  (
    select array[count(*)::text, min(numero)]
    from public.revisiones_del_presupuesto where presupuesto_id = 'aaaaaaaa-0000-7000-8000-000000000110'
  ),
  array['1', '20260920-01'],
  'y no congela ni numera dos veces'
);

select throws_ok(
  $$ update public.revisiones_del_presupuesto set que_cambio = 'Otra cosa' where id = 'aaaaaaaa-0000-7000-8000-000000000111' $$,
  '42501',
  null,
  'lo que se mandó no se corrige: no hay grant de update'
);

-- El vanitory, con sus dos opciones, el mismo día.
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000020');

select is(
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000121', '2026-09-20'
  ) #>> '{revision,numero}',
  '20260920-02',
  'otro presupuesto del mismo taller el mismo día lleva el número siguiente'
);

select is(
  (
    select array_agg(o ->> 'letra' || ' ' || (o ->> 'total') order by n)
    from jsonb_array_elements(
      public.vista_del_cliente('aaaaaaaa-0000-7000-8000-000000000020') #> '{presupuesto,contenido,valores,opciones}'
    ) with ordinality as x (o, n)
  ),
  array['A 80000000', 'B 95000000'],
  'esperando la seña, el cliente ve todas las opciones que se le mandaron, en el orden de la ficha'
);

-- Un rack que se manda el mismo día y después se borra con el trabajo.
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000160', 'aaaaaaaa-0000-7000-8000-000000000060');
select tests.mandar_el_presupuesto(
  'aaaaaaaa-0000-7000-8000-000000000160', 'aaaaaaaa-0000-7000-8000-000000000161', '2026-09-20'
);
update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000060';

select is(
  (
    select array_agg(x.borrado order by x.tabla)
    from (
      select 'presupuestos' as tabla, b.deleted_at = p.deleted_at as borrado
      from public.presupuestos b
      join public.proyectos p on p.id = b.proyecto_id
      where b.id = 'aaaaaaaa-0000-7000-8000-000000000160'
      union all
      select 'revisiones', r.deleted_at = p.deleted_at
      from public.revisiones_del_presupuesto r
      join public.proyectos p on p.id = r.proyecto_id
      where r.id = 'aaaaaaaa-0000-7000-8000-000000000161'
    ) as x
  ),
  array[true, true],
  'borrar el trabajo se lleva el borrador y lo que se mandó, con la misma marca'
);

select private.borrar_el_presupuesto_del_trabajo(
  tests.id('household_a'), 'aaaaaaaa-0000-7000-8000-000000000010', now()
);

select is(
  (select deleted_at from public.presupuestos where id = 'aaaaaaaa-0000-7000-8000-000000000110'),
  null::timestamptz,
  'la puerta de esa baja no le borra el presupuesto a un trabajo vivo'
);

-- El escritorio, que estaba en seguimiento, el mismo día.
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000000030');
select set_config(
  'tests.desde_el_seguimiento',
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000000131', '2026-09-20'
  )::text,
  true
);

select is(
  current_setting('tests.desde_el_seguimiento')::jsonb #>> '{revision,numero}',
  '20260920-04',
  'el número cuenta también los de los trabajos borrados: un número no se reusa'
);

select is(
  array[
    (select estado::text from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000030'),
    (select hecho_el::text from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000031'),
    (select resultado from public.proximos_contactos where id = 'aaaaaaaa-0000-7000-8000-000000000031')
  ],
  array['presupuesto_enviado', '2099-12-31', 'reactivado'],
  'mandarlo desde el seguimiento lo pasa a presupuesto enviado y cierra su próximo contacto, con el trigger de siempre'
);

select is(
  current_setting('tests.desde_el_seguimiento')::jsonb #>> '{proximos_contactos,0,resultado}',
  'reactivado',
  'y devuelve ese contacto ya cerrado, para que la réplica no lo siga mostrando pendiente'
);


-- Las revisiones -----------------------------------------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');

select is(
  tests.rechazo($$
    select tests.mandar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000112', '2026-09-22'
    )
  $$),
  'MN027 queCambio: Al presupuesto le falta algo para mandarlo.',
  'desde la segunda revisión, mandarlo sin decir qué cambió rebota'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_el_presupuesto('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000112', '2026-09-22', %L) $$,
    repeat('a', 281)
  )),
  'MN027 queCambio: Al presupuesto le falta algo para mandarlo.',
  'y con más de 280 caracteres, también'
);

select set_config(
  'tests.revision_2',
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000112', '2026-09-22',
    E'\t Cambiamos las bisagras por unas con cierre suave. ', '2026-10-07'
  )::text,
  true
);

select is(
  array[
    current_setting('tests.revision_2')::jsonb #>> '{revision,revision}',
    current_setting('tests.revision_2')::jsonb #>> '{revision,numero}',
    current_setting('tests.revision_2')::jsonb #>> '{revision,que_cambio}'
  ],
  array['2', '20260920-01', 'Cambiamos las bisagras por unas con cierre suave.'],
  'la revisión 2 mantiene el número y guarda qué cambió, sin los blancos de las puntas'
);

select is(
  (
    select array[estado::text, presupuesto_vale_hasta::text, ultimo_contacto::text]
    from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  ),
  array['presupuesto_enviado', '2026-10-07', '2026-09-22'],
  'una revisión deja el trabajo en su etapa y renueva la vigencia y el último contacto'
);


-- Cada rechazo, sin congelar nada -------------------------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');

select is(
  tests.rechazo(format(
    $$ select public.mandar_el_presupuesto('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', 3, %L, 'Otra cosa', '2026-09-23', null) $$,
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
  )),
  'MN026 revisión vista 3, revisión actual 4: Este presupuesto se cambió en otro aparato.',
  'mandar lo armado con una revisión vieja del borrador rebota'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', %L, 'Otra cosa') $$,
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"valores": {"tipo": "total", "total": 100}}'
  )),
  'MN029 valores: Cambiaron los importes desde que lo armaste.',
  'un total que no es el del trabajo rebota'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', %L, 'Otra cosa') $$,
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"senaBp": 3000}'
  )),
  'MN029 sena: Cambiaron los importes desde que lo armaste.',
  'una seña que no es la del trabajo, también'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', %L, 'Otra cosa') $$,
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"valores": {"tipo": "total", "total": 1}, "abonado": 0}'
  )),
  'MN029 valores, abonado: Cambiaron los importes desde que lo armaste.',
  'y lo pagado que no es la suma de los pagos vivos: dice todo lo que no coincide'
);

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000020');

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000122', %L, 'Cambié el orden') $$,
    jsonb_set(
      tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000020'),
      '{valores,opciones}',
      (
        select jsonb_agg(x.o order by x.n desc)
        from jsonb_array_elements(
          tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000020') #> '{valores,opciones}'
        ) with ordinality as x (o, n)
      )
    )
  )),
  'MN029 valores: Cambiaron los importes desde que lo armaste.',
  'las opciones van en el orden de sus ids, el de la ficha: en otro orden rebota'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000122', %L, 'Otro importe') $$,
    jsonb_set(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000020'), '{valores,opciones,1,total}', '95000001')
  )),
  'MN029 valores: Cambiaron los importes desde que lo armaste.',
  'y una opción con otro importe, también'
);

select is(
  tests.rechazo($$
    select tests.mandar_con(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', '{"forma": 1}', 'Otra cosa'
    )
  $$),
  'MN031 forma-invalida: El presupuesto no se pudo mandar.',
  'un documento que no tiene la forma no se congela'
);

select is(
  tests.rechazo(format(
    $$ select tests.mandar_con('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', %L, 'Otra cosa') $$,
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
      || '{"titulo": " \n ", "muebles": [{"nombre": "Placard", "descripcion": ""}]}'
  )),
  'MN027 titulo, muebles: Al presupuesto le falta algo para mandarlo.',
  'sin título ni un mueble con su detalle no se manda: la base saca la cuenta de problemasParaMandar'
);

select set_config('maun.hoy_en_el_taller', '2026-09-25', true);

select is(
  tests.rechazo($$
    select tests.mandar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000113', '2026-09-26', 'Otra cosa'
    )
  $$),
  'MN033 mandado el 2026-09-26, hoy 2026-09-25: El día del envío todavía no llegó.',
  'mandado con un día que todavía no llegó en el taller, rebota'
);

select set_config('maun.hoy_en_el_taller', '2099-12-31', true);

select is(
  (
    select array[count(*)::text, max(revision)::text]
    from public.revisiones_del_presupuesto where presupuesto_id = 'aaaaaaaa-0000-7000-8000-000000000110'
  ),
  array['2', '2'],
  'después de cada rechazo no quedó nada congelado: siguen las dos revisiones'
);

-- La mesa: el borrador se arma mientras es una consulta, y después se da por perdida.
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000140', 'aaaaaaaa-0000-7000-8000-000000000040');

select tests.salir();
update public.proyectos set
  estado = 'perdido', fecha_cobro = '2026-09-10', dist_liquidado_at = '2026-09-10 18:00-03',
  dist_cobrado_centavos = 0, dist_gastos_centavos = 0, dist_diezmo_bp = 1000,
  dist_objetivo_sueldo_centavos = 0, dist_objetivo_fijos_centavos = 0, dist_sueldo_mensual = false,
  dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 0,
  dist_tope_sueldo_centavos = 0, dist_tope_fijos_centavos = 0,
  dist_diezmo_centavos = 0, dist_sueldo_centavos = 0, dist_fijos_centavos = 0, dist_remanente_centavos = 0
where id = 'aaaaaaaa-0000-7000-8000-000000000040';
select tests.entrar_como(tests.id('ana'));

select is(
  tests.rechazo($$
    select tests.mandar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000140', 'aaaaaaaa-0000-7000-8000-000000000141', '2026-09-20'
    )
  $$),
  'MN032 perdido: Este trabajo está perdido: el presupuesto no se manda.',
  'un trabajo perdido no se manda'
);

select is(
  tests.rechazo($$
    select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000140', 'aaaaaaaa-0000-7000-8000-000000000040')
  $$),
  'MN032 perdido: Este trabajo está perdido: su presupuesto no se cambia.',
  'ni se le cambia el borrador'
);


-- Después de aprobado no hay revisiones ---------------------------------------------------------------------

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000050');
select tests.mandar_el_presupuesto(
  'aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000151', '2026-09-21'
);
update public.proyectos set estado = 'en_curso' where id = 'aaaaaaaa-0000-7000-8000-000000000050';

select is(
  tests.rechazo($$
    select tests.mandar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000152', '2026-09-22', 'Un estante más'
    )
  $$),
  'MN028 en_curso: Ya lo aprobó: el presupuesto no se cambia.',
  'después de aprobado no hay revisiones'
);

select is(
  tests.rechazo($$
    select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000050')
  $$),
  'MN028 en_curso: Ya lo aprobó: el presupuesto no se cambia.',
  'ni se cambia el borrador'
);

update public.proyectos set estado = 'presupuesto_enviado' where id = 'aaaaaaaa-0000-7000-8000-000000000050';
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000050');

select is(
  tests.mandar_el_presupuesto(
    'aaaaaaaa-0000-7000-8000-000000000150', 'aaaaaaaa-0000-7000-8000-000000000152', '2026-09-22',
    'Sumamos un estante.'
  ) #>> '{revision,revision}',
  '2',
  'si vuelve a presupuesto, se le puede mandar otra revisión'
);


-- Lo que otro taller no ve ni toca --------------------------------------------------------------------------

select tests.entrar_como(tests.id('beto'));

select is(
  tests.rechazo($$
    select public.mandar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'bbbbbbbb-0000-7000-8000-000000000199', 4, '{"forma": 1}', null,
      '2026-09-20', null
    )
  $$),
  '42501 -: El presupuesto no existe o no es tuyo',
  'otro taller no manda el presupuesto de Ana: para él no existe'
);

select is(
  tests.rechazo($$
    select public.guardar_el_presupuesto(
      'aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010', 4,
      tests.borrador_del_presupuesto()
    )
  $$),
  '42501 -: El trabajo no existe o no es tuyo',
  'ni le guarda el borrador'
);

select is(
  array[
    (select count(*)::integer from public.revisiones_del_presupuesto where id = 'aaaaaaaa-0000-7000-8000-000000000111'),
    (select count(*)::integer from public.presupuestos where id = 'aaaaaaaa-0000-7000-8000-000000000110')
  ],
  array[0, 0],
  'ni lee una revisión ni un borrador de Ana aunque sepa sus ids'
);

select ok(
  tests.rechazo($$
    select tests.mandar_el_presupuesto(
      'bbbbbbbb-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000111', '2026-09-20'
    )
  $$) like '23505 %',
  'el reenvío se busca solo en el taller de la sesión: con el id de una revisión de Ana, a Beto no le devuelve nada de ella'
);

select is(
  tests.mandar_el_presupuesto(
    'bbbbbbbb-0000-7000-8000-000000000110', 'bbbbbbbb-0000-7000-8000-000000000111', '2026-09-20'
  ) #>> '{revision,numero}',
  '20260920-01',
  'el número es de cada taller: otro taller, el mismo día, arranca en -01'
);

select * from finish();
