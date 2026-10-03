-- La factura con ARCA (ADR 0085): el disparo de la función de borde facturar y sus dos trabajos programados.
--
-- Aditiva: funciones nuevas sin grants, un trigger nuevo en comprobantes y dos trabajos de pg_cron, como los
-- de los avisos. Cada sentencia que pide un comprobante le avisa a la función que hay algo para emitir; lo
-- que quedó sin respuesta lo retoma el trabajo de cada cinco minutos, y el control corre una vez por día.
-- pg_net no manda el pedido hasta que la transacción confirma: los tests y el ensayo, que terminan en
-- rollback, no mandan nada. Sin facturar_url y facturar_secreto en Vault no se pide nada. Ninguna fila
-- existente cambia.


-- Los secretos y lo pendiente ----------------------------------------------------------------------------------

-- Aparte, para que el pgTAP las reemplace por dobles dentro de su transacción sin depender de Vault ni de las
-- filas de otros talleres.
create function private.secretos_de_la_facturacion()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'url', (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'facturar_url'),
    'secreto', (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'facturar_secreto')
  )
$$;

comment on function private.secretos_de_la_facturacion() is
  'La URL de la función de borde facturar y el secreto del disparo, de Vault (facturar_url y facturar_secreto), o null el que falte. Los carga db:facturacion --vault desde variables de entorno (ADR 0085).';

revoke all on function private.secretos_de_la_facturacion() from public, anon, authenticated, service_role;

create function private.hay_facturacion_pendiente()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.comprobantes c
    where c.estado in ('pedida', 'emitiendo') and c.deleted_at is null
  )
$$;

comment on function private.hay_facturacion_pendiente() is
  'Si hay algún comprobante pedido o emitiendo, de cualquier taller: sin nada, el trabajo de cada cinco minutos no llama a la función (ADR 0085).';

revoke all on function private.hay_facturacion_pendiente() from public, anon, authenticated, service_role;


-- El pedido a la función de borde ------------------------------------------------------------------------------

create function private.pedir_la_facturacion(p_ruta text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secretos jsonb;
begin
  if p_ruta is null or p_ruta not in ('trabajo', 'control') then
    raise exception 'La función de la facturación tiene dos rutas: trabajo y control' using errcode = '22023';
  end if;

  v_secretos := private.secretos_de_la_facturacion();
  if v_secretos ->> 'url' is null or v_secretos ->> 'secreto' is null then
    return null;
  end if;

  if p_ruta = 'trabajo' and not private.hay_facturacion_pendiente() then
    return null;
  end if;

  return net.http_post(
    url := rtrim(v_secretos ->> 'url', '/') || '/' || p_ruta,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (v_secretos ->> 'secreto')
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

comment on function private.pedir_la_facturacion(text) is
  'Le pide a la función de borde facturar que trabaje lo pendiente (trabajo) o que haga el control diario (control), con el secreto del disparo. Sin los secretos en Vault devuelve null y no pide nada; para trabajo, tampoco sin nada pedido ni emitiendo. La llaman el disparo de cada pedido y pg_cron. pg_net manda el pedido recién cuando la transacción confirma (ADR 0085).';

revoke all on function private.pedir_la_facturacion(text) from public, anon, authenticated, service_role;

create function private.pedir_la_emision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.pedir_la_facturacion('trabajo');
  return null;
end;
$$;

comment on function private.pedir_la_emision() is
  'Trigger AFTER INSERT de comprobantes, por sentencia: cada pedido de una factura o de una nota de crédito le avisa a la función de borde que hay algo para emitir, así el dueño la tiene en segundos y no a los cinco minutos (ADR 0085).';

revoke all on function private.pedir_la_emision() from public, anon, authenticated, service_role;

create trigger pedir_la_emision
  after insert on public.comprobantes
  for each statement execute function private.pedir_la_emision();


-- Los trabajos ---------------------------------------------------------------------------------------------------

select cron.unschedule(jobid) from cron.job where jobname in ('facturacion-pendientes', 'facturacion-control');

-- Lo que quedó sin respuesta de ARCA, lo que se cortó y lo de producción cuando se prenda.
select cron.schedule('facturacion-pendientes', '*/5 * * * *', $$select private.pedir_la_facturacion('trabajo')$$);

-- El control diario, a las 6:15 en la Argentina.
select cron.schedule('facturacion-control', '15 9 * * *', $$select private.pedir_la_facturacion('control')$$);
