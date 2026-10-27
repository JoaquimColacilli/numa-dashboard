-- El estimativo se arma en el presupuesto con un tilde y el presupuesto promete una fecha de entrega
-- atada a una fecha para la seña. Las formas aceptan lo nuevo y lo de antes; mandar un estimativo pasa
-- el trabajo de contacto a estimativo enviado (desde otra etapa no la mueve) y no tilda la tarea del
-- presupuesto; cada combinación inválida de fechas rebota con su código y sin congelar nada.

select plan(29);

select tests.guardar('ana', tests.crear_usuario('ana@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller de Ana', tests.id('ana')));

create function tests.rechazo(p_sql text)
returns text
language plpgsql
as $$
declare
  v_estado text;
begin
  execute p_sql;
  return 'ok';
exception
  when others then
    get stacked diagnostics v_estado = returned_sqlstate;
    return v_estado;
end;
$$;

create function tests.mandar(p_presupuesto_id uuid, p_revision_id uuid, p_documento jsonb, p_mandado_el date default '2026-10-26')
returns jsonb
language plpgsql
as $$
begin
  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id,
    (select b.borrador_version from public.presupuestos b where b.id = p_presupuesto_id),
    p_documento, null, p_mandado_el, '2026-11-10'
  );
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

select set_config('maun.hoy_en_el_taller', '2026-10-26', true);

select set_config('tests.plantilla_chica', $${
  "forma": 1, "plazoDeFabricacion": 30, "modificacionesIncluidas": 2,
  "valorDeUnaModificacion": 5000000, "garantiaMeses": 6,
  "incluye": [{"id": "incluye-visita", "titulo": null, "texto": "Visita a domicilio para medición.", "tildadaPorDefecto": true}],
  "aTenerEnCuenta": [], "avisos": [], "condiciones": [],
  "formasDePago": [{"id": "sena-y-entrega", "nombre": "Seña y contra entrega", "texto": "Seña del {sena}."}],
  "garantia": "Garantía de {meses}."
}$$, true);


-- Las formas -------------------------------------------------------------------------------------------

select is(private.es_fecha_que_existe('2026-02-28'), true, 'una fecha que existe');
select is(private.es_fecha_que_existe('2026-02-30'), false, 'el 30 de febrero no existe');
select is(private.es_fecha_que_existe('0050-01-01'), false, 'un año de dos cifras no, como en JavaScript');
select is(private.es_fecha_que_existe('2026-2-28'), false, 'sin los ceros no es la forma');

select tests.entrar_como(tests.id('ana'));

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía García');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'contacto', 128000000),
  ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack', 'relevamiento', 40000000),
  ('aaaaaaaa-0000-7000-8000-000000000030', 'aaaaaaaa-0000-7000-8000-000000000001', 'Mesa', 'a_presupuestar', 30000000);

select tests.salir();

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')),
  null,
  'un documento de antes, sin el tilde ni las fechas, sigue sirviendo'
);

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
    || '{"estimativo": true, "pideFecha": true, "listoPara": null, "senaAntesDel": null}'),
  null,
  'un estimativo que pide fecha, sin fechas'
);

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
    || '{"estimativo": false, "pideFecha": false, "listoPara": "2026-12-07", "senaAntesDel": "2026-10-28"}'),
  null,
  'un presupuesto con sus dos fechas'
);

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"estimativo": "si"}'),
  'forma-invalida',
  'el tilde es un booleano'
);

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"listoPara": 20261207}'),
  'forma-invalida',
  'una fecha es texto'
);

select is(
  private.problema_del_documento(tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"senaAntesDel": "2026-02-30"}'),
  'fecha-invalida',
  'y tiene que existir'
);

select is(
  private.problema_del_presupuesto(tests.borrador_del_presupuesto() || '{"estimativo": true, "pideFecha": false, "listoPara": "2026-12-01", "senaAntesDel": null}'),
  null,
  'el borrador guarda el tilde, el pedido de fecha y una fecha elegida'
);

select is(
  private.problema_del_presupuesto(tests.borrador_del_presupuesto() || '{"pideFecha": null}'),
  'forma-invalida',
  'el pedido de fecha es un booleano'
);

select is(
  private.problema_del_presupuesto(tests.borrador_del_presupuesto() || '{"listoPara": "2026-13-01"}'),
  'fecha-invalida',
  'una fecha del borrador tiene que existir'
);

select is(
  private.problema_de_la_plantilla(current_setting('tests.plantilla_chica')::jsonb),
  null,
  'una plantilla de antes, sin los días para la seña'
);

select is(
  private.problema_de_la_plantilla(current_setting('tests.plantilla_chica')::jsonb || '{"diasParaLaSena": 61}'),
  'dias-para-la-sena-fuera-de-rango',
  'los días para la seña van de 0 a 60'
);

select is(
  private.problema_de_la_plantilla(current_setting('tests.plantilla_chica')::jsonb || '{"diasParaLaSena": null}'),
  'forma-invalida',
  'y si están, son un número'
);


-- Mandar un estimativo ----------------------------------------------------------------------------------

select tests.entrar_como(tests.id('ana'));

select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000000010');
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000000020');
select tests.guardar_el_borrador('aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000000030');

select is(
  tests.rechazo($$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
      || '{"estimativo": true, "listoPara": "2026-12-07", "senaAntesDel": "2026-10-28"}') $$),
  'MN044',
  'un estimativo con fechas no se manda'
);

select is(
  tests.rechazo($$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"listoPara": "2026-12-07"}') $$),
  'MN045',
  'un presupuesto con una sola de sus fechas no se manda'
);

select is(
  tests.rechazo($$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
      || '{"listoPara": "2026-12-07", "senaAntesDel": "2026-10-25"}') $$),
  'MN046',
  'la seña no vence antes del día de mandar'
);

select is(
  tests.rechazo($$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010')
      || '{"listoPara": "2026-10-28", "senaAntesDel": "2026-10-28"}') $$),
  'MN047',
  'la entrega va después de la seña'
);

select is(
  (select count(*)::integer from public.revisiones_del_presupuesto where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  0,
  'ningún rechazo congeló nada'
);

select is(
  tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"estimativo": true, "pideFecha": true}') #>> '{proyecto,estado}',
  'presupuesto_estimativo',
  'mandar un estimativo desde contacto lo pasa a estimativo enviado'
);

select is(
  (select array[presupuesto_pdf::text, presupuesto_vale_hasta::text, ultimo_contacto::text] from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  array['false', '2026-11-10', '2026-10-26'],
  'no tilda la tarea del presupuesto, y lleva la vigencia y el último contacto como cualquiera'
);

select is(
  (select array[numero is not null, revision = 1, contenido -> 'estimativo' = 'true'::jsonb]
   from public.revisiones_del_presupuesto where id = 'aaaaaaaa-0000-7000-8000-000000001101'),
  array[true, true, true],
  'lleva número y revisión, y la revisión dice que es un estimativo'
);

select is(
  tests.mandar('aaaaaaaa-0000-7000-8000-000000000120', 'aaaaaaaa-0000-7000-8000-000000001201',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000020') || '{"estimativo": true}') #>> '{proyecto,estado}',
  'relevamiento',
  'desde otra etapa un estimativo no la mueve'
);

select is(
  tests.mandar('aaaaaaaa-0000-7000-8000-000000000130', 'aaaaaaaa-0000-7000-8000-000000001301',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000030')
      || '{"estimativo": false, "pideFecha": true, "listoPara": "2026-12-07", "senaAntesDel": "2026-10-26"}') #>> '{proyecto,estado}',
  'presupuesto_enviado',
  'un presupuesto con sus fechas, la seña desde el mismo día, pasa a presupuesto enviado como siempre'
);

select is(
  (select presupuesto_pdf from public.proyectos where id = 'aaaaaaaa-0000-7000-8000-000000000030'),
  true,
  'y tilda la tarea del presupuesto'
);

select is(
  tests.rechazo($$ select tests.mandar('aaaaaaaa-0000-7000-8000-000000000110', 'aaaaaaaa-0000-7000-8000-000000001101',
    tests.documento_del_presupuesto('aaaaaaaa-0000-7000-8000-000000000010') || '{"estimativo": true, "pideFecha": true}') $$),
  'ok',
  'el reenvío de la cola de un estimativo devuelve lo que quedó'
);

select is(
  (select count(*)::integer from public.revisiones_del_presupuesto where proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010'),
  1,
  'sin congelar dos veces'
);

select * from finish();
