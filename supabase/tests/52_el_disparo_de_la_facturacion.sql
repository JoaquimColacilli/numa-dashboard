-- El disparo de la función de la facturación (ADR 0085): los dos trabajos de pg_cron, que pedir_la_facturacion
-- no llama sin los secretos ni, para trabajar, sin nada pendiente, y que el pedido de un comprobante la llama
-- una vez por sentencia. Los secretos y lo pendiente se reemplazan por dobles dentro de la transacción, como el
-- espía de 31_el_aviso_de_cambios.sql, así el test no depende de Vault ni de las filas de otros talleres. El
-- pedido de pg_net queda en su cola sin confirmar y el rollback lo descarta: no sale nada, y la URL de los
-- dobles es de un dominio que no existe.

select plan(14);

create table tests.secretos (url text, secreto text);
insert into tests.secretos values (null, null);

create table tests.pendiente (hay boolean);
insert into tests.pendiente values (false);

create or replace function private.secretos_de_la_facturacion()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object('url', s.url, 'secreto', s.secreto) from tests.secretos s
$$;

create or replace function private.hay_facturacion_pendiente()
returns boolean
language sql
stable
set search_path = ''
as $$
  select p.hay from tests.pendiente p
$$;

create function tests.el_pedido(p_id bigint)
returns text[]
language sql
as $$
  select array[q.url, q.headers ->> 'Authorization']
  from net.http_request_queue q
  where q.id = p_id
$$;


-- Los trabajos -------------------------------------------------------------------------------------------------

select is(
  (
    select count(*)::int from cron.job
    where jobname = 'facturacion-pendientes'
      and schedule = '*/5 * * * *'
      and command = 'select private.pedir_la_facturacion(''trabajo'')'
  ),
  1,
  'cada cinco minutos se retoma lo pendiente'
);

select is(
  (
    select count(*)::int from cron.job
    where jobname = 'facturacion-control'
      and schedule = '15 9 * * *'
      and command = 'select private.pedir_la_facturacion(''control'')'
  ),
  1,
  'y el control corre todos los días a las 6:15 de la Argentina'
);


-- El pedido a la función -------------------------------------------------------------------------------------

select is(
  private.pedir_la_facturacion('control'),
  null,
  'sin los secretos en Vault no se pide nada'
);

update tests.secretos set url = 'https://facturar.ejemplo.invalid/functions/v1/facturar/', secreto = null;

select is(
  private.pedir_la_facturacion('control'),
  null,
  'tampoco con la URL y sin el secreto'
);

update tests.secretos set secreto = 'secreto-de-prueba';

select is(
  private.pedir_la_facturacion('trabajo'),
  null,
  'con los secretos y nada pedido ni emitiendo, el trabajo no llama'
);

select is(
  tests.el_pedido(private.pedir_la_facturacion('control')),
  array['https://facturar.ejemplo.invalid/functions/v1/facturar/control', 'Bearer secreto-de-prueba'],
  'el control llama siempre, a su ruta y con el secreto'
);

update tests.pendiente set hay = true;

select is(
  tests.el_pedido(private.pedir_la_facturacion('trabajo')),
  array['https://facturar.ejemplo.invalid/functions/v1/facturar/trabajo', 'Bearer secreto-de-prueba'],
  'y con algo pendiente, el trabajo también'
);

select throws_ok(
  $$ select private.pedir_la_facturacion('otra') $$,
  '22023', null,
  'la función tiene dos rutas y ninguna más'
);


-- El disparo de cada pedido ----------------------------------------------------------------------------------

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));

select tests.entrar_como(tests.id('a'));
insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Lucía Gómez');
insert into public.proyectos (id, cliente_id, titulo, estado, presupuesto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'en_curso', 90000000);
insert into public.pagos (id, proyecto_id, fecha, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-20', 10000000),
  ('aaaaaaaa-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-09-21', 10000000);
select tests.salir();

create function tests.pedidos_a_facturar()
returns integer
language sql
as $$
  select count(*)::int from net.http_request_queue q where q.url = 'https://facturar.ejemplo.invalid/functions/v1/facturar/trabajo'
$$;

create table tests.cuenta (antes integer);
insert into tests.cuenta select tests.pedidos_a_facturar();

-- Dos comprobantes en una sola sentencia, con lo mismo que pone tests.un_comprobante.
insert into public.comprobantes
select *
from jsonb_populate_recordset(
  null::public.comprobantes,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', f.id, 'household_id', tests.id('household_a'), 'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010',
        'pago_id', f.pago_id, 'tipo', 'factura_c', 'ambiente', 'homologacion', 'estado', 'pedida',
        'cuit_emisor', '20-11111111-2', 'punto_de_venta', 1, 'concepto', 1, 'importe_centavos', 10000000,
        'moneda', 'ARS', 'doc_tipo', 99, 'doc_nro', '0', 'condicion_iva_receptor', 5,
        'receptor_condicion', 'consumidor_final', 'receptor_nombre', 'Lucía Gómez', 'receptor_domicilio', '',
        'emisor', jsonb_build_object('razonSocial', 'RIVAS MARTIN', 'nombreDelTaller', 'Taller A',
          'domicilio', 'Pasaje Los Robles 450', 'cuit', '20-11111111-2', 'ingresosBrutos', '1',
          'inicioDeActividades', '2019-03-01'),
        'detalle', 'Seña — Placard', 'intentos', 0, 'pedida_at', now(), 'created_at', now(), 'updated_at', now(),
        'version', 1
      )
    )
    from (values
      ('cccccccc-0000-7000-8000-000000000001'::uuid, 'aaaaaaaa-0000-7000-8000-000000000011'::uuid),
      ('cccccccc-0000-7000-8000-000000000002'::uuid, 'aaaaaaaa-0000-7000-8000-000000000012'::uuid)
    ) as f (id, pago_id)
  )
);

select is(
  tests.pedidos_a_facturar(),
  (select antes from tests.cuenta) + 1,
  'dos comprobantes pedidos en una sola sentencia llaman una sola vez a la función'
);

select tests.un_comprobante(jsonb_build_object(
  'id', 'cccccccc-0000-7000-8000-000000000003', 'household_id', tests.id('household_a'),
  'proyecto_id', 'aaaaaaaa-0000-7000-8000-000000000010', 'pago_id', 'aaaaaaaa-0000-7000-8000-000000000011',
  'estado', 'rechazada', 'rechazo', '{"errores": []}'::jsonb
));

select is(
  tests.pedidos_a_facturar(),
  (select antes from tests.cuenta) + 2,
  'y cada pedido siguiente, otra'
);

select ok(
  exists (
    select 1 from pg_trigger t
    where t.tgrelid = 'public.comprobantes'::regclass
      and t.tgname = 'pedir_la_emision'
      and t.tgfoid = 'private.pedir_la_emision()'::regprocedure
      and (t.tgtype & 1) = 0
  ),
  'el disparo es un trigger por sentencia, no por fila'
);


-- Quién llama a qué ---------------------------------------------------------------------------------------------

select ok(
  not has_function_privilege('authenticated', 'private.pedir_la_facturacion(text)', 'EXECUTE')
    and not has_function_privilege('service_role', 'private.pedir_la_facturacion(text)', 'EXECUTE')
    and not has_function_privilege('anon', 'private.pedir_la_facturacion(text)', 'EXECUTE'),
  'nadie más que la base y pg_cron llaman a la función de la facturación'
);

select ok(
  not has_function_privilege('authenticated', 'private.secretos_de_la_facturacion()', 'EXECUTE')
    and not has_function_privilege('service_role', 'private.secretos_de_la_facturacion()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.hay_facturacion_pendiente()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.pedir_la_emision()', 'EXECUTE'),
  'ni leen el secreto del disparo'
);

select ok(
  (select prosecdef from pg_proc where oid = 'private.pedir_la_emision()'::regprocedure),
  'el disparo corre como dueño: pide la emisión aunque el comprobante lo escriba una función de service_role'
);

select * from finish();
