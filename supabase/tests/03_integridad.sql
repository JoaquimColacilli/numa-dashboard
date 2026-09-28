-- Metadatos, idempotencia, constraints de plata y las guardas que protegen lo congelado.

select plan(82);

select tests.guardar('a', tests.crear_usuario('a@maun.test'));
select tests.guardar('household_a', private.crear_household('Taller A', tests.id('a')));
select tests.guardar('household_b', private.crear_household('Taller B', null));


-- UUIDv7 ---------------------------------------------------------------------------------------

select matches(
  private.uuidv7()::text,
  '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  'private.uuidv7() da versión 7 y variante RFC 9562'
);

select tests.guardar('uuid_anterior', private.uuidv7());
select pg_sleep(0.005);
select ok(private.uuidv7() > tests.id('uuid_anterior'), 'private.uuidv7() crece con el tiempo');


-- Metadatos ------------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

insert into public.clientes (nombre) values ('Cliente sin id');
select matches(
  (select id::text from public.clientes where nombre = 'Cliente sin id'),
  '^[0-9a-f]{8}-[0-9a-f]{4}-7',
  'si el cliente no manda id, el default genera un UUIDv7'
);

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000001', 'Marcela');

select is(
  (select version from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  1,
  'una fila nueva nace en version 1'
);

select set_config('tests.marca_1', (select updated_at::text from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'), true);

update public.clientes set notas = 'Llamar a la tarde' where id = 'aaaaaaaa-0000-7000-8000-000000000001';

select is(
  (select version from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  2,
  'un cambio incrementa version'
);
select ok(
  (select updated_at from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001') > current_setting('tests.marca_1')::timestamptz,
  'un cambio mueve updated_at'
);

select set_config('tests.marca_2', (select updated_at::text from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'), true);

update public.clientes set notas = 'Llamar a la tarde' where id = 'aaaaaaaa-0000-7000-8000-000000000001';

select is(
  (select version from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  2,
  'un update sin cambios no incrementa version'
);

-- El reenvío de la cola de salida: el mismo upsert, dos veces.
insert into public.clientes (id, nombre, notas)
values ('aaaaaaaa-0000-7000-8000-000000000001', 'Marcela', 'Llamar a la tarde')
on conflict (id) do update set nombre = excluded.nombre, notas = excluded.notas;

select is(
  (select version from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  2,
  'reenviar un upsert ya aplicado no incrementa version'
);
select is(
  (select updated_at from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  current_setting('tests.marca_2')::timestamptz,
  'reenviar un upsert ya aplicado no mueve updated_at: no genera un delta'
);

select throws_ok(
  $$ update public.clientes set version = 99 where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  '42501',
  null,
  'el cliente no escribe version'
);

select throws_ok(
  $$ update public.clientes set updated_at = now() - interval '1 year' where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  '42501',
  null,
  'el cliente no escribe updated_at'
);

select tests.salir();

select throws_ok(
  format('update public.clientes set household_id = %L where id = %L', tests.id('household_b'), 'aaaaaaaa-0000-7000-8000-000000000001'),
  'MN004',
  null,
  'ni el dueño de la base mueve una fila de household'
);

select throws_ok(
  $$ update public.clientes set id = private.uuidv7() where id = 'aaaaaaaa-0000-7000-8000-000000000001' $$,
  'MN004',
  null,
  'el id de una fila es inmutable'
);

update public.clientes set created_at = '2000-01-01' where id = 'aaaaaaaa-0000-7000-8000-000000000001';
select isnt(
  (select created_at from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'),
  '2000-01-01'::timestamptz,
  'created_at no se reescribe en un update'
);


-- Constraints ----------------------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

insert into public.proyectos (id, cliente_id, titulo, estado)
  values ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'entregado');
insert into public.pagos (id, proyecto_id, fecha, monto_centavos) values
  ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-08-01', 60000000),
  ('aaaaaaaa-0000-7000-8000-000000000012', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-08-20', 40000000);
insert into public.gastos (id, proyecto_id, fecha, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000013', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-08-02', 30000000);

select throws_ok(
  $$ update public.proyectos set estado = 'cobrado' where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'MN007',
  null,
  'el cliente no marca cobrado un proyecto: eso es cobrar_proyecto'
);

select throws_ok(
  $$ update public.proyectos set dist_diezmo_centavos = 1 where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  '42501',
  null,
  'el cliente no escribe la distribución congelada'
);

select throws_ok(
  $$ insert into public.pagos (proyecto_id, fecha, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000010', '2026-08-21', 0) $$,
  '23514',
  null,
  'un pago no puede ser de cero'
);

select throws_ok(
  $$ insert into public.proyectos (cliente_id, titulo, presupuesto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000001', 'x', -1) $$,
  '23514',
  null,
  'un presupuesto no puede ser negativo'
);

select throws_ok(
  $$ insert into public.clientes (nombre, cuit) values ('Estudio', '30712345678') $$,
  '23514',
  null,
  'el CUIT va con guiones'
);

select tests.salir();

-- Cada rechazo nombra su constraint: con las demás satisfechas, falla la que se está probando y no
-- otra por accidente.
select throws_ok(
  $$
    update public.proyectos set
      estado = 'cobrado', fecha_cobro = '2026-08-20',
      dist_cobrado_centavos = 100000000, dist_gastos_centavos = 30000000, dist_diezmo_bp = 1000,
      dist_tope_sueldo_centavos = 180000000, dist_tope_fijos_centavos = 25000000,
      dist_diezmo_centavos = 7000000, dist_sueldo_centavos = 63000000, dist_fijos_centavos = 0, dist_remanente_centavos = 1,
      dist_objetivo_sueldo_centavos = 180000000, dist_objetivo_fijos_centavos = 25000000, dist_sueldo_mensual = false,
      dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 0, dist_liquidado_at = now()
    where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  $$,
  '23514',
  'new row for relation "proyectos" violates check constraint "proyectos_distribucion_cuadra"',
  'una distribución que no suma la ganancia neta no entra'
);

select throws_ok(
  $$
    update public.proyectos set
      estado = 'cobrado', fecha_cobro = '2026-08-20',
      dist_cobrado_centavos = 100000000, dist_gastos_centavos = 30000000, dist_diezmo_bp = 1000,
      dist_tope_sueldo_centavos = 50000000, dist_tope_fijos_centavos = 25000000,
      dist_diezmo_centavos = 7000000, dist_sueldo_centavos = 63000000, dist_fijos_centavos = 0, dist_remanente_centavos = 0,
      dist_objetivo_sueldo_centavos = 50000000, dist_objetivo_fijos_centavos = 25000000, dist_sueldo_mensual = false,
      dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 0, dist_liquidado_at = now()
    where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  $$,
  '23514',
  'new row for relation "proyectos" violates check constraint "proyectos_distribucion_cuadra"',
  'el sueldo no pasa su tope'
);

select throws_ok(
  $$
    update public.proyectos set
      estado = 'cobrado', fecha_cobro = '2026-08-20',
      dist_cobrado_centavos = 100000000, dist_gastos_centavos = 30000000, dist_diezmo_bp = 1000,
      dist_tope_sueldo_centavos = 180000000, dist_tope_fijos_centavos = 25000000,
      dist_diezmo_centavos = 7000000, dist_sueldo_centavos = 63000000, dist_fijos_centavos = 0, dist_remanente_centavos = 0,
      dist_objetivo_sueldo_centavos = 180000000, dist_objetivo_fijos_centavos = 25000000, dist_sueldo_mensual = false,
      dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 10000000, dist_liquidado_at = now()
    where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  $$,
  '23514',
  'new row for relation "proyectos" violates check constraint "proyectos_topes_del_mes"',
  'el tope congelado sale del objetivo y de lo que el mes ya llevaba liquidado'
);

select throws_ok(
  $$
    update public.proyectos set
      estado = 'cobrado', fecha_cobro = '2026-08-20',
      dist_cobrado_centavos = 100000000, dist_gastos_centavos = 30000000, dist_diezmo_bp = 1000,
      dist_tope_sueldo_centavos = 180000000, dist_tope_fijos_centavos = 25000000,
      dist_diezmo_centavos = 7000000, dist_sueldo_centavos = 63000000, dist_fijos_centavos = 0, dist_remanente_centavos = 0,
      dist_objetivo_sueldo_centavos = 180000000, dist_objetivo_fijos_centavos = 25000000, dist_sueldo_mensual = false,
      dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 0
    where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  $$,
  '23514',
  'new row for relation "proyectos" violates check constraint "proyectos_liquidado_con_distribucion"',
  'lo congelado está completo o no está: sin el instante de la liquidación no entra'
);

select lives_ok(
  $$
    update public.proyectos set
      estado = 'cobrado', fecha_cobro = '2026-08-20',
      dist_cobrado_centavos = 100000000, dist_gastos_centavos = 30000000, dist_diezmo_bp = 1000,
      dist_tope_sueldo_centavos = 180000000, dist_tope_fijos_centavos = 25000000,
      dist_diezmo_centavos = 7000000, dist_sueldo_centavos = 63000000, dist_fijos_centavos = 0, dist_remanente_centavos = 0,
      dist_objetivo_sueldo_centavos = 180000000, dist_objetivo_fijos_centavos = 25000000, dist_sueldo_mensual = false,
      dist_sueldo_previo_centavos = 0, dist_fijos_previo_centavos = 0, dist_liquidado_at = now()
    where id = 'aaaaaaaa-0000-7000-8000-000000000010'
  $$,
  'una distribución que cuadra congela el proyecto'
);

select lives_ok(
  $$
    insert into public.proyectos (
      household_id, cliente_id, titulo, estado, fecha_cobro,
      dist_cobrado_centavos, dist_gastos_centavos, dist_diezmo_bp, dist_tope_sueldo_centavos, dist_tope_fijos_centavos,
      dist_diezmo_centavos, dist_sueldo_centavos, dist_fijos_centavos, dist_remanente_centavos,
      dist_objetivo_sueldo_centavos, dist_objetivo_fijos_centavos, dist_sueldo_mensual,
      dist_sueldo_previo_centavos, dist_fijos_previo_centavos, dist_liquidado_at
    )
    select household_id, id, 'Proyecto a pérdida', 'cobrado', '2026-08-20',
      10000000, 15000000, 1000, 180000000, 25000000,
      0, 0, 0, -5000000,
      180000000, 25000000, false,
      0, 0, now()
    from public.clientes where id = 'aaaaaaaa-0000-7000-8000-000000000001'
  $$,
  'un proyecto con pérdida congela todo en cero y la pérdida en el remanente'
);


-- Lo congelado no se toca ----------------------------------------------------------------------

select tests.entrar_como(tests.id('a'));

select throws_ok(
  $$ insert into public.pagos (proyecto_id, fecha, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000010', '2026-08-25', 1000) $$,
  'MN001',
  null,
  'no entra un pago nuevo en un proyecto cobrado'
);

select throws_ok(
  $$ update public.pagos set monto_centavos = 1 where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN001',
  null,
  'no se edita un pago de un proyecto cobrado'
);

select throws_ok(
  $$ update public.pagos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN001',
  null,
  'no se borra un pago de un proyecto cobrado'
);

select throws_ok(
  $$ insert into public.gastos (proyecto_id, fecha, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000010', '2026-08-25', 1000) $$,
  'MN001',
  null,
  'no entra un gasto nuevo en un proyecto cobrado'
);

select lives_ok(
  $$
    insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
    values ('aaaaaaaa-0000-7000-8000-000000000011', 'aaaaaaaa-0000-7000-8000-000000000010', '2026-08-01', 60000000)
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id, fecha = excluded.fecha, monto_centavos = excluded.monto_centavos
  $$,
  'el reenvío idéntico de un pago ya aplicado pasa aunque el proyecto se haya cobrado después'
);

select is(
  (select version from public.pagos where id = 'aaaaaaaa-0000-7000-8000-000000000011'),
  1,
  'y no toca la fila'
);

insert into public.proyectos (id, cliente_id, titulo)
  values ('aaaaaaaa-0000-7000-8000-000000000020', 'aaaaaaaa-0000-7000-8000-000000000001', 'Escritorio');

select throws_ok(
  $$ update public.pagos set proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000020' where id = 'aaaaaaaa-0000-7000-8000-000000000011' $$,
  'MN001',
  null,
  'no se saca un pago de un proyecto cobrado moviéndolo a otro'
);

select throws_ok(
  $$ update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000010' $$,
  'MN001',
  null,
  'un proyecto cobrado no se borra'
);

-- Una edición encolada antes del cobro trae el estado viejo: tiene que rebotar con un código de
-- negocio que la cola sepa mostrar, no con el 23514 del check.
select throws_ok(
  $$
    insert into public.proyectos (id, cliente_id, titulo, estado)
    values ('aaaaaaaa-0000-7000-8000-000000000010', 'aaaaaaaa-0000-7000-8000-000000000001', 'Placard', 'entregado')
    on conflict (id) do update set titulo = excluded.titulo, estado = excluded.estado
  $$,
  'MN001',
  null,
  'el estado de un proyecto cobrado no vuelve atrás por una edición encolada'
);


-- Bajas -----------------------------------------------------------------------------------------

insert into public.pagos (id, proyecto_id, fecha, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000021', 'aaaaaaaa-0000-7000-8000-000000000020', '2026-09-01', 10000);
insert into public.gastos (id, proyecto_id, fecha, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000022', 'aaaaaaaa-0000-7000-8000-000000000020', '2026-09-01', 5000);

select throws_ok(
  $$ update public.pagos set proyecto_id = 'aaaaaaaa-0000-7000-8000-000000000010' where id = 'aaaaaaaa-0000-7000-8000-000000000021' $$,
  'MN001',
  null,
  'no se mete un pago en un proyecto cobrado moviéndolo desde otro'
);

-- La marca la manda el cliente con su hora, que no es la del servidor: un literal distinto de
-- now() prueba que la cascada copia la del proyecto y no pone la suya.
update public.proyectos set deleted_at = '2026-09-01 10:00-03' where id = 'aaaaaaaa-0000-7000-8000-000000000020';

select ok(
  (select deleted_at is not null from public.pagos where id = 'aaaaaaaa-0000-7000-8000-000000000021')
  and (select deleted_at is not null from public.gastos where id = 'aaaaaaaa-0000-7000-8000-000000000022'),
  'borrar un proyecto borra sus pagos y gastos'
);

select ok(
  (select deleted_at from public.pagos where id = 'aaaaaaaa-0000-7000-8000-000000000021') = '2026-09-01 10:00-03'::timestamptz
  and (select deleted_at from public.gastos where id = 'aaaaaaaa-0000-7000-8000-000000000022') = '2026-09-01 10:00-03'::timestamptz,
  'con la misma marca que el proyecto, no con la hora del servidor'
);

update public.pagos set deleted_at = '2030-01-01 00:00-03' where id = 'aaaaaaaa-0000-7000-8000-000000000021';

select ok(
  (select version = 2 and deleted_at = '2026-09-01 10:00-03'::timestamptz
   from public.pagos where id = 'aaaaaaaa-0000-7000-8000-000000000021'),
  'borrar otra vez lo ya borrado, con otra marca, es un no-op: conserva la primera y no sube version'
);

select throws_ok(
  $$ update public.proyectos set deleted_at = null where id = 'aaaaaaaa-0000-7000-8000-000000000020' $$,
  'MN002',
  null,
  'un proyecto borrado no revive: una edición vieja encolada no lo resucita sin sus pagos'
);

select throws_ok(
  $$ insert into public.pagos (proyecto_id, fecha, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000020', '2026-09-02', 1000) $$,
  'MN002',
  null,
  'no entra un pago en un proyecto borrado'
);

insert into public.clientes (id, nombre) values ('aaaaaaaa-0000-7000-8000-000000000030', 'Cliente con obra');
insert into public.proyectos (id, cliente_id, titulo)
  values ('aaaaaaaa-0000-7000-8000-000000000031', 'aaaaaaaa-0000-7000-8000-000000000030', 'Vanitory');

select throws_ok(
  $$ update public.clientes set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  'MN003',
  null,
  'no se borra un cliente con proyectos vivos'
);

update public.proyectos set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000031';

select lives_ok(
  $$ update public.clientes set deleted_at = now() where id = 'aaaaaaaa-0000-7000-8000-000000000030' $$,
  'sin proyectos vivos, el cliente se borra'
);

select throws_ok(
  $$ insert into public.proyectos (cliente_id, titulo) values ('aaaaaaaa-0000-7000-8000-000000000030', 'Encolado offline') $$,
  'MN005',
  null,
  'no entra un proyecto para un cliente borrado, aunque venga de una cola offline'
);

insert into public.proyectos (id, cliente_id, titulo)
  values ('aaaaaaaa-0000-7000-8000-000000000040', 'aaaaaaaa-0000-7000-8000-000000000001', 'Rack de TV');

select throws_ok(
  $$ update public.proyectos set cliente_id = 'aaaaaaaa-0000-7000-8000-000000000030' where id = 'aaaaaaaa-0000-7000-8000-000000000040' $$,
  'MN005',
  null,
  'un proyecto vivo no se reasigna a un cliente borrado'
);


-- Forma de los movimientos ---------------------------------------------------------------------

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos) values ('2026-09-01', 'ingreso', 'maun', 'hogar', 100) $$,
  '23514', null, 'un ingreso viene de afuera: no tiene origen'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_destino, monto_centavos) values ('2026-09-01', 'gasto', 'hogar', 100) $$,
  '23514', null, 'un gasto sale de un tesoro: tiene origen y no destino'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos) values ('2026-09-01', 'transferencia', 'maun', 'maun', 100) $$,
  '23514', null, 'una transferencia no va de un tesoro a sí mismo'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, monto_centavos) values ('2026-09-01', 'pago_diezmo', 'maun', 100) $$,
  '23514', null, 'el diezmo se paga desde el tesoro diezmo'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, monto_centavos) values ('2026-09-01', 'aporte_cocos', 'maun', 100) $$,
  '23514', null, 'un aporte a Cocos tiene destino cocos'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos) values ('2026-09-01', 'ajuste', 'maun', 'hogar', 100) $$,
  '23514', null, 'un ajuste toca un solo tesoro'
);
select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_destino, monto_centavos) values ('2026-09-01', 'ingreso', 'hogar', -100) $$,
  '23514', null, 'el monto de un movimiento es positivo: el sentido lo dan origen y destino'
);

select lives_ok(
  $$
    insert into public.movimientos (fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos) values
      ('2026-09-01', 'ingreso', null, 'hogar', 100),
      ('2026-09-01', 'gasto', 'hogar', null, 100),
      ('2026-09-01', 'transferencia', 'maun', 'hogar', 100),
      ('2026-09-01', 'pago_diezmo', 'diezmo', null, 100),
      ('2026-09-01', 'aporte_cocos', 'maun', 'cocos', 100),
      ('2026-09-01', 'ajuste', null, 'cocos', 100),
      ('2026-09-01', 'ajuste', 'cocos', null, 100)
  $$,
  'las siete formas válidas de movimiento entran'
);


-- Los movimientos nombran sus tesoros por id (ADR 0078) ----------------------------------------------

-- Dos tesoros del dueño, sin clave. Los cuatro de siempre se leen por su clave.
insert into public.tesoros (id, nombre, tinta, icono) values
  ('aaaaaaaa-0000-7000-8000-000000000051', 'Herramientas', 'grana', 'wrench'),
  ('aaaaaaaa-0000-7000-8000-000000000052', 'Materiales', 'mostaza', 'package');

select tests.guardar('hogar_a', (select id from public.tesoros where clave = 'hogar'));
select tests.guardar('maun_a', (select id from public.tesoros where clave = 'maun'));
select tests.guardar('diezmo_a', (select id from public.tesoros where clave = 'diezmo'));
select tests.guardar('cocos_a', (select id from public.tesoros where clave = 'cocos'));

select lives_ok(
  $$ insert into public.movimientos (id, fecha, tipo, desde_id, hacia_id, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000061', '2026-09-01', 'transferencia', 'aaaaaaaa-0000-7000-8000-000000000051', 'aaaaaaaa-0000-7000-8000-000000000052', 100) $$,
  'una transferencia entre dos tesoros del dueño, que no tienen clave, entra'
);

select results_eq(
  $$ select tesoro_origen::text, tesoro_destino::text from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000061' $$,
  $$ values (null::text, null::text) $$,
  'y queda con las dos claves en null: los checks miran los ids'
);

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos) values ('2026-09-01', 'transferencia', 'aaaaaaaa-0000-7000-8000-000000000051', 'aaaaaaaa-0000-7000-8000-000000000051', 100) $$,
  '23514', null, 'una transferencia de un tesoro a sí mismo rebota también por id'
);

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, desde_id, monto_centavos) values ('2026-09-01', 'pago_diezmo', 'aaaaaaaa-0000-7000-8000-000000000051', 100) $$,
  '23514', null, 'el diezmo se sigue pagando desde el diezmo: un tesoro del dueño no tiene la clave'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos) values ('2026-09-01', 'aporte_cocos', %L, 'aaaaaaaa-0000-7000-8000-000000000052', 100) $$,
    tests.id('maun_a')
  ),
  '23514', null, 'y un aporte sigue yendo a Cocos: a otro tesoro es una transferencia'
);

select lives_ok(
  format(
    $$ insert into public.movimientos (id, fecha, tipo, desde_id, monto_centavos) values ('aaaaaaaa-0000-7000-8000-000000000062', '2026-09-01', 'pago_diezmo', %L, 100) $$,
    tests.id('diezmo_a')
  ),
  'el pago del diezmo que manda una app nueva, con el id y sin la clave, entra'
);

select is(
  (select tesoro_origen::text from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000062'),
  'diezmo',
  'porque el trigger completa la clave desde el id antes de los checks'
);

-- Lo que manda una app sin actualizar: la clave, sin el id.
insert into public.movimientos (id, fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000063', '2026-09-02', 'transferencia', 'maun', 'cocos', 100);

select results_eq(
  $$ select desde_id, hacia_id from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  format($$ values (%L::uuid, %L::uuid) $$, tests.id('maun_a'), tests.id('cocos_a')),
  'lo que manda una app vieja, con la clave, queda también con los ids de sus tesoros'
);

-- La edición de una app vieja manda solo la clave que cambió. Sin seguir ese lado, el id viejo
-- quedaría apuntando a Cocos.
update public.movimientos set tesoro_destino = 'hogar' where id = 'aaaaaaaa-0000-7000-8000-000000000063';

select results_eq(
  $$ select tesoro_destino::text, hacia_id from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  format($$ values ('hogar', %L::uuid) $$, tests.id('hogar_a')),
  'la edición de una app vieja que cambia la clave deja el id nuevo, no el viejo'
);

update public.movimientos set hacia_id = 'aaaaaaaa-0000-7000-8000-000000000052' where id = 'aaaaaaaa-0000-7000-8000-000000000063';

select results_eq(
  $$ select tesoro_destino::text, hacia_id from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  $$ values (null::text, 'aaaaaaaa-0000-7000-8000-000000000052'::uuid) $$,
  'y la de una app nueva que cambia el id recalcula la clave: null para un tesoro del dueño'
);

select throws_ok(
  format(
    $$ update public.movimientos set tesoro_destino = 'cocos', hacia_id = %L where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
    tests.id('hogar_a')
  ),
  '23514', null, 'si cambian los dos lados y no dicen lo mismo, rebota como un check'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, tesoro_destino, hacia_id, monto_centavos) values ('2026-09-02', 'ingreso', 'hogar', %L, 100) $$,
    tests.id('maun_a')
  ),
  '23514', null, 'y un alta con la clave de un tesoro y el id de otro, también'
);

select lives_ok(
  format(
    $$ update public.movimientos set tesoro_destino = 'cocos', hacia_id = %L where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
    tests.id('cocos_a')
  ),
  'cambiar los dos a la vez, diciendo lo mismo, pasa'
);

-- La edición de una app nueva manda solo el id que cambió, también cuando lo saca: la clave vieja no
-- lo puede volver a poner.
select lives_ok(
  $$ update public.movimientos set tipo = 'gasto', hacia_id = null where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  'una app nueva que pasa una transferencia a gasto manda el destino en null y la clave lo sigue'
);

select results_eq(
  $$ select tesoro_destino::text, hacia_id from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  $$ values (null::text, null::uuid) $$,
  'y el gasto queda sin destino: ni el id ni la clave de antes'
);

insert into public.movimientos (id, fecha, tipo, tesoro_origen, hacia_id, monto_centavos)
  values ('aaaaaaaa-0000-7000-8000-000000000064', '2026-09-02', 'transferencia', 'maun', 'aaaaaaaa-0000-7000-8000-000000000052', 100);

select lives_ok(
  $$ update public.movimientos set tipo = 'ingreso', desde_id = null where id = 'aaaaaaaa-0000-7000-8000-000000000064' $$,
  'lo mismo del lado del origen: una transferencia que pasa a ingreso'
);

select results_eq(
  $$ select tesoro_origen::text, desde_id from public.movimientos where id = 'aaaaaaaa-0000-7000-8000-000000000064' $$,
  $$ values (null::text, null::uuid) $$,
  'queda sin origen'
);

-- Sacar el id y poner la clave de otro tesoro en la misma edición no dice lo mismo: rebota.
select throws_ok(
  $$ update public.movimientos set desde_id = null, tesoro_origen = 'hogar' where id = 'aaaaaaaa-0000-7000-8000-000000000063' $$,
  '23514', 'El tesoro de origen no coincide con su clave',
  'un origen con el id en null y la clave de otro tesoro rebota como un check'
);

select throws_ok(
  $$ update public.movimientos set hacia_id = null, tesoro_destino = 'cocos' where id = 'aaaaaaaa-0000-7000-8000-000000000064' $$,
  '23514', 'El tesoro de destino no coincide con su clave',
  'y un destino, igual'
);


-- La plata que cubre un mes --------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_destino, monto_centavos, cubre_el_mes) values ('2026-09-02', 'ingreso', 'maun', 100, '2026-09-01') $$,
  '23514', null, 'solo una transferencia cubre un mes: un ingreso no'
);

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, hacia_id, monto_centavos, cubre_el_mes) values ('2026-09-02', 'transferencia', 'maun', 'aaaaaaaa-0000-7000-8000-000000000052', 100, '2026-09-15') $$,
  '23514', null, 'el mes que se cubre va como su primer día'
);

select throws_ok(
  format(
    $$ insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, cubre_el_mes) values ('2026-09-02', 'transferencia', %L, 'aaaaaaaa-0000-7000-8000-000000000052', 100, '2026-09-01') $$,
    tests.id('diezmo_a')
  ),
  '23514', null, 'y no se cubre con el diezmo, aunque venga solo con el id: esa plata no es del taller'
);

select lives_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, hacia_id, monto_centavos, cubre_el_mes) values ('2026-09-02', 'transferencia', 'maun', 'aaaaaaaa-0000-7000-8000-000000000052', 100, '2026-09-01') $$,
  'una transferencia de Maun a un tesoro del dueño cubre septiembre'
);


-- Todo movimiento toma los ajustes (ADR 0078, los tipos de tesoro) ------------------------------------

-- Un gasto desde un compromiso que se renueva al pagar cambia el saldo que mira la liquidación. Se ve
-- en la fila de ajustes: un lock de fila deja en xmax la transacción que lo tiene (la de este archivo
-- o su subtransacción, según cómo lo corra el runner). B nació en esta transacción y nadie más la ve,
-- así que el lock es del gasto. Que otra sesión espere lo prueba concurrencia.test.ts.
select tests.salir();

select is(
  (select xmax::text from public.ajustes where household_id = tests.id('household_b')),
  '0',
  'antes de mover plata, nadie tomó los ajustes de B'
);

insert into public.movimientos (household_id, fecha, tipo, tesoro_origen, monto_centavos, categoria)
  values (tests.id('household_b'), '2026-09-02', 'gasto', 'hogar', 100, 'Supermercado');

select ok(
  (select xmax::text <> '0' and version = 1 from public.ajustes where household_id = tests.id('household_b')),
  'un gasto cualquiera, sin cubrir ningún mes, toma los ajustes del taller sin cambiarlos: una liquidación lo ve entero o no lo ve'
);

select tests.entrar_como(tests.id('a'));

select lives_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, monto_centavos, categoria, proyecto_id) values ('2026-09-02', 'gasto', 'maun', 100, 'Flete', 'aaaaaaaa-0000-7000-8000-000000000040') $$,
  'un gasto con su trabajo toma primero el trabajo y después los ajustes, y el dueño puede tomar los dos'
);

select throws_ok(
  $$ insert into public.movimientos (fecha, tipo, tesoro_origen, monto_centavos, proyecto_id) values ('2026-09-02', 'gasto', 'maun', 100, 'aaaaaaaa-0000-7000-8000-000000000099') $$,
  '23503', null,
  'con un trabajo que no existe no hay nada que tomar: la foreign key lo rechaza, como siempre'
);


-- Ajustes --------------------------------------------------------------------------------------

select lives_ok(
  format('update public.ajustes set sueldo_mensual_centavos = 190000000 where household_id = %L', tests.id('household_a')),
  'el usuario edita sus ajustes'
);

select throws_ok(
  format('update public.ajustes set tasa_cocos_anual_bp = -1 where household_id = %L', tests.id('household_a')),
  '23514', null, 'la tasa no es negativa'
);

-- Contrato de la cola (ADR 0010): las altas son upsert, las ediciones son update por id. ajustes
-- solo se edita, así que el upsert no tiene grant.
select throws_ok(
  format(
    'insert into public.ajustes (id, sueldo_mensual_centavos) values (%L, 1) on conflict (id) do update set sueldo_mensual_centavos = excluded.sueldo_mensual_centavos',
    (select id from public.ajustes where household_id = tests.id('household_a'))
  ),
  '42501', null, 'ajustes se edita con update, no con upsert'
);

select * from finish();
