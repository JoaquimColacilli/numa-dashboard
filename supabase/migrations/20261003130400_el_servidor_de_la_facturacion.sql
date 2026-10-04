-- La factura con ARCA (ADR 0085): lo que usa la función de borde facturar, la única que habla con ARCA.
--
-- Aditiva. Tres tablas de private, fuera de la réplica y sin grants para nadie: los certificados de
-- producción de cada taller con su clave privada cifrada, los tickets del WSAA y el registro de cada llamada
-- a ARCA. Los pares de funciones de service_role que la función de borde llama por REST: la de public
-- invoker y la de private security definer, con grant solo a service_role y sin household_actual(), porque
-- sin sesión no hay taller. Y tres funciones de private sin ningún grant, que corren solo como dueño de la
-- base: conectar y desconectar la facturación de un taller y resolver a mano un comprobante a revisar
-- (db:facturacion). Con esto service_role escribe por primera vez, sin que nadie lo pida en ese momento, en
-- tablas de la réplica (comprobantes y las alertas de ajustes): siempre por estas funciones, que corren como
-- dueño y pasan por los triggers de siempre (ADR 0085, que enmienda los ADR 0051 y 0054). Ninguna fila
-- existente cambia.


-- Los certificados de producción de cada taller -----------------------------------------------------------

create table private.arca_certificados (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null references public.households (id) on delete cascade,
  cuit text not null,
  pedido text not null,
  clave_cifrada text not null,
  clave_iv text not null,
  certificado text,
  huella text,
  vence date,
  estado text not null default 'pedido',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint arca_certificados_cuit_formato check (cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'),
  constraint arca_certificados_estado_valido check (estado in ('pedido', 'subido', 'activo')),
  constraint arca_certificados_pedido_pem check (pedido like '-----BEGIN CERTIFICATE REQUEST-----%'),
  constraint arca_certificados_clave_en_base64 check (
    clave_cifrada ~ '^[A-Za-z0-9+/]+={0,2}$' and clave_iv ~ '^[A-Za-z0-9+/]+={0,2}$'
  ),
  constraint arca_certificados_certificado_pem check (
    certificado is null or certificado like '-----BEGIN CERTIFICATE-----%'
  ),
  constraint arca_certificados_huella_formato check (huella is null or huella ~ '^[0-9a-f]{64}$'),
  -- Un pedido todavía no tiene certificado; uno subido o activo tiene el certificado, su huella y su
  -- vencimiento.
  constraint arca_certificados_con_su_certificado check (
    case
      when estado = 'pedido' then certificado is null and huella is null and vence is null
      else certificado is not null and huella is not null and vence is not null
    end
  )
);

comment on table private.arca_certificados is
  'El certificado de ARCA de producción de cada taller, que el dueño hace desde Ajustes con el asistente: la función de borde genera la clave y el pedido (pedido), el dueño sube el certificado que le firmó ARCA (subido) y la conexión lo deja activo. Por taller hay como mucho uno activo y uno que no lo es, así un certificado se renueva sin cortar; al activar uno, el anterior se borra. La clave privada está cifrada con AES-GCM y ARCA_PRODUCCION_LLAVE, que solo tiene la función: ni la base ni la app la pueden leer en claro. Sin grants para nadie; la tocan solo las funciones de service_role de la facturación (ADR 0085).';
comment on column private.arca_certificados.cuit is 'El CUIT del pedido (NN-NNNNNNNN-N): el de «Tu presupuesto» al pedir el primero, y el de la conexión al renovar.';
comment on column private.arca_certificados.pedido is 'El pedido PKCS#10 en PEM, el que el dueño sube a ARCA.';
comment on column private.arca_certificados.clave_cifrada is 'La clave privada en PKCS#8, cifrada con AES-GCM y ARCA_PRODUCCION_LLAVE, en base64. Nunca sale de la función en claro.';
comment on column private.arca_certificados.clave_iv is 'El IV del cifrado de la clave, en base64: uno nuevo por pedido.';
comment on column private.arca_certificados.certificado is 'El certificado que firmó ARCA, en PEM, o null mientras es un pedido.';
comment on column private.arca_certificados.huella is 'El SHA-256 del certificado en hexadecimal: es la clave de su ticket en private.arca_tickets.';
comment on column private.arca_certificados.vence is 'Hasta cuándo vale el certificado. El control avisa treinta días antes (certificado-por-vencer).';
comment on column private.arca_certificados.estado is 'pedido (la clave y el pedido, esperando el certificado), subido (con el certificado, sin conectar) o activo (el que firma los pedidos de login del taller).';

create index arca_certificados_household on private.arca_certificados (household_id);
create unique index arca_certificados_un_activo on private.arca_certificados (household_id) where estado = 'activo';
create unique index arca_certificados_un_pendiente on private.arca_certificados (household_id) where estado <> 'activo';
create unique index arca_certificados_una_huella on private.arca_certificados (huella) where huella is not null;

alter table private.arca_certificados enable row level security;
revoke all on table private.arca_certificados from public, anon, authenticated, service_role;


-- Los tickets del WSAA ---------------------------------------------------------------------------------------

create table private.arca_tickets (
  certificado text primary key,
  token text,
  firma text,
  vence timestamptz,
  obtenido_at timestamptz,
  login_hasta timestamptz,
  bloqueado_hasta timestamptz,

  constraint arca_tickets_certificado_valido check (certificado = 'homologacion' or certificado ~ '^[0-9a-f]{64}$'),
  constraint arca_tickets_completo check (num_nulls(token, firma, vence, obtenido_at) in (0, 4))
);

comment on table private.arca_tickets is
  'El ticket de acceso del WSAA de cada certificado, para reusarlo mientras vale: pedir otro con uno vigente da «ya posee un TA valido». Una fila por certificado: homologacion para el de prueba y la huella para cada uno de producción. Se guarda tal como llega, sin decodificarlo: trae el CUIT del certificado. Sin grants para nadie (ADR 0085).';
comment on column private.arca_tickets.login_hasta is 'Hasta cuándo una llamada de la función está pidiendo un ticket nuevo: las demás esperan, así hay un solo login por vez.';
comment on column private.arca_tickets.bloqueado_hasta is 'Hasta cuándo ARCA no da otro ticket, después de contestar «ya posee un TA valido».';

alter table private.arca_tickets enable row level security;
revoke all on table private.arca_tickets from public, anon, authenticated, service_role;

create function private.borrar_el_ticket_del_certificado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.huella is not null then
    delete from private.arca_tickets t where t.certificado = old.huella;
  end if;
  return old;
end;
$$;

comment on function private.borrar_el_ticket_del_certificado() is
  'Trigger AFTER DELETE de private.arca_certificados: el ticket de un certificado se va con él, en la misma transacción.';

revoke all on function private.borrar_el_ticket_del_certificado() from public, anon, authenticated, service_role;

create trigger borrar_el_ticket
  after delete on private.arca_certificados
  for each row execute function private.borrar_el_ticket_del_certificado();


-- El registro de cada llamada a ARCA ------------------------------------------------------------------------------

create table private.arca_intercambios (
  id uuid primary key default private.uuidv7(),
  household_id uuid references public.households (id) on delete cascade,
  comprobante_id uuid,
  ambiente text not null,
  metodo text not null,
  http_estado integer,
  duracion_ms integer,
  pedido text,
  respuesta text,
  error text,
  created_at timestamptz not null default now(),

  constraint arca_intercambios_ambiente_valido check (ambiente in ('homologacion', 'produccion')),
  constraint arca_intercambios_metodo_valido check (metodo ~ '^[A-Za-z]{1,40}$'),
  constraint arca_intercambios_duracion_valida check (duracion_ms is null or duracion_ms >= 0),
  constraint arca_intercambios_largos check (
    coalesce(char_length(pedido), 0) <= 102400
    and coalesce(char_length(respuesta), 0) <= 102400
    and coalesce(char_length(error), 0) <= 500
  ),
  -- Lo que no se guarda nunca: el bloque Auth (el token y la firma), ningún elemento Cuit y el CMS del login.
  constraint arca_intercambios_sin_lo_que_no_se_guarda check (
    coalesce(pedido, '') !~* '<([a-z0-9_]+:)?(auth|token|sign|cuit|in0)[ >/]'
    and coalesce(respuesta, '') !~* '<([a-z0-9_]+:)?(auth|token|sign|cuit|in0)[ >/]'
  )
);

comment on table private.arca_intercambios is
  'Cada llamada a ARCA de la función de borde, para revisar qué pasó con un comprobante: el método, el estado HTTP, el tiempo y el XML del pedido y de la respuesta, sin el bloque Auth, sin ningún elemento Cuit y sin el CMS, recortados a 100 KB. Del login se guardan solo el resultado y el tiempo. El control diario borra lo de homologación de más de dos años y lo de producción de más de dos años que no terminó en un comprobante autorizado o anulado. Sin grants para nadie (ADR 0085).';
comment on column private.arca_intercambios.household_id is 'El taller, o null en un login de homologación, que es de todos los talleres conectados ahí.';
comment on column private.arca_intercambios.comprobante_id is 'El comprobante, si la llamada fue por uno. Sin foreign key a propósito: el registro conserva el id aunque se borre a mano uno de prueba, y una foreign key haría que un truncate de comprobantes rebote antes de llegar a su guarda (MN043).';
comment on column private.arca_intercambios.metodo is 'El método de ARCA (loginCms, FECAESolicitar, FECompConsultar, FECompUltimoAutorizado, FEDummy, FEParamGetPtosVenta…) o resolver, cuando lo resolvió alguien a mano con db:facturacion.';

create index arca_intercambios_household on private.arca_intercambios (household_id);
create index arca_intercambios_comprobante on private.arca_intercambios (comprobante_id);
create index arca_intercambios_creado on private.arca_intercambios (created_at);

alter table private.arca_intercambios enable row level security;
revoke all on table private.arca_intercambios from public, anon, authenticated, service_role;


-- Lo que comparten las funciones de abajo --------------------------------------------------------------------------

-- Una secuencia es el taller, el ambiente y el tipo: la factura y la nota numeran aparte.
create function private.facturacion_secuencia_ocupada(p_comprobante public.comprobantes)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.comprobantes c
    where c.household_id = p_comprobante.household_id
      and c.ambiente = p_comprobante.ambiente
      and c.tipo = p_comprobante.tipo
      and c.id <> p_comprobante.id
      and c.deleted_at is null
      and (c.estado = 'emitiendo' or (c.estado = 'pedida' and c.emitiendo_hasta > now()))
  )
$$;

comment on function private.facturacion_secuencia_ocupada(public.comprobantes) is
  'Si otro comprobante de la misma secuencia (el taller, el ambiente y el tipo) está emitiendo o tomado: con eso, este no se toma ni reserva número. Es la invariante 1: un número en vuelo por secuencia (ADR 0085).';

revoke all on function private.facturacion_secuencia_ocupada(public.comprobantes) from public, anon, authenticated, service_role;

create function private.autorizar_el_comprobante(p_id uuid, p_cae text, p_cae_vence date, p_fecha date)
returns public.comprobantes
language plpgsql
set search_path = ''
as $$
declare
  v_comprobante public.comprobantes;
begin
  if coalesce(p_cae, '') !~ '^[0-9]{14}$' or p_cae_vence is null or p_fecha is null then
    raise exception 'Una autorización lleva el CAE, su vencimiento y la fecha del comprobante' using errcode = '22023';
  end if;

  update public.comprobantes c
  set estado = 'autorizada',
      fecha = p_fecha,
      cae = p_cae,
      cae_vence = p_cae_vence,
      autorizada_at = now(),
      emitiendo_hasta = null,
      rechazo = null,
      ultimo_error = null
  where c.id = p_id
  returning c.* into v_comprobante;

  -- Una nota de crédito autorizada anula su factura en la misma transacción.
  if v_comprobante.tipo = 'nota_de_credito_c' then
    update public.comprobantes f
    set estado = 'anulada'
    where f.household_id = v_comprobante.household_id
      and f.id = v_comprobante.asociado_id
      and f.estado = 'autorizada';
  end if;

  return v_comprobante;
end;
$$;

comment on function private.autorizar_el_comprobante(uuid, text, date, date) is
  'Deja autorizado un comprobante con su CAE, su vencimiento y la fecha que dice ARCA, y si es una nota de crédito, anula su factura en la misma transacción. La llaman private.facturacion_anotar() y private.resolver_el_comprobante(), que ya tomaron los candados (ADR 0085).';

revoke all on function private.autorizar_el_comprobante(uuid, text, date, date) from public, anon, authenticated, service_role;

create function private.facturacion_del_taller(p_household_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'householdId', a.household_id,
    'ambiente', a.facturacion_ambiente,
    'cuit', a.facturacion_cuit,
    'puntoDeVenta', a.facturacion_punto_de_venta,
    'desde', a.facturacion_desde,
    'tallerCuit', a.taller_cuit,
    'tallerTitular', a.taller_titular,
    'tallerCondicionFiscal', a.taller_condicion_fiscal,
    'certificados', jsonb_build_object(
      'activo', (
        select jsonb_build_object('id', c.id, 'estado', c.estado, 'cuit', c.cuit, 'vence', c.vence)
        from private.arca_certificados c
        where c.household_id = a.household_id and c.estado = 'activo'
      ),
      'pendiente', (
        select jsonb_build_object('id', c.id, 'estado', c.estado, 'cuit', c.cuit, 'vence', c.vence)
        from private.arca_certificados c
        where c.household_id = a.household_id and c.estado <> 'activo'
      )
    )
  )
  from public.ajustes a
  where a.household_id = p_household_id
$$;

comment on function private.facturacion_del_taller(uuid) is
  'La facturación de un taller como la ven las rutas con sesión de la función de borde: la conexión, los datos de «Tu presupuesto» que hacen falta para pedir el certificado y el estado de sus certificados, sin ninguna clave (ADR 0085).';

revoke all on function private.facturacion_del_taller(uuid) from public, anon, authenticated, service_role;


-- Conectar, desconectar y resolver a mano: sin grants, solo el dueño de la base ----------------------------------

create function private.conectar_la_facturacion(
  p_household_id uuid,
  p_ambiente text,
  p_cuit text,
  p_punto_de_venta integer,
  p_desde date
)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
begin
  if num_nulls(p_household_id, p_ambiente, p_cuit, p_punto_de_venta, p_desde) > 0 then
    raise exception 'Conectar la facturación necesita el taller, el ambiente, el CUIT, el punto de venta y la fecha'
      using errcode = '22004';
  end if;

  if p_ambiente not in ('homologacion', 'produccion') then
    raise exception 'El ambiente es homologacion o produccion' using errcode = '22023', hint = 'ambiente';
  end if;

  if p_cuit !~ '^[0-9]{2}-[0-9]{8}-[0-9]$' or not private.cuit_valido(p_cuit) then
    raise exception 'El CUIT va con guiones y con su dígito verificador' using errcode = '22023', hint = 'cuit-invalido';
  end if;

  if p_punto_de_venta not between 1 and 99998 then
    raise exception 'El punto de venta va de 1 a 99998' using errcode = '22023', hint = 'punto-de-venta';
  end if;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = p_household_id
  for no key update;

  if not found then
    raise exception 'Ese taller no existe' using errcode = '22023', hint = 'sin-taller';
  end if;

  if v_ajustes.facturacion_ambiente is not null then
    raise exception 'La facturación de ese taller ya está conectada' using errcode = '22023', hint = 'ya-conectada';
  end if;

  if exists (
    select 1 from public.comprobantes c
    where c.household_id = p_household_id
      and c.deleted_at is null
      and c.estado in ('pedida', 'emitiendo', 'a_revisar')
  ) then
    raise exception 'Ese taller tiene comprobantes en camino' using errcode = '22023', hint = 'comprobantes-en-vuelo';
  end if;

  if exists (
    select 1 from public.ajustes o
    where o.household_id <> p_household_id
      and o.facturacion_ambiente = p_ambiente
      and o.facturacion_cuit = p_cuit
      and o.facturacion_punto_de_venta = p_punto_de_venta
  ) then
    raise exception 'Ese punto de venta ya lo usa otro taller' using errcode = '22023', hint = 'punto-de-venta-de-otro-taller';
  end if;

  update public.ajustes a
  set facturacion_ambiente = p_ambiente,
      facturacion_cuit = p_cuit,
      facturacion_punto_de_venta = p_punto_de_venta,
      facturacion_desde = p_desde,
      facturacion_alertas = '[]'::jsonb
  where a.household_id = p_household_id
  returning a.* into v_ajustes;

  return v_ajustes;
end;
$$;

comment on function private.conectar_la_facturacion(uuid, text, text, integer, date) is
  'Conecta la facturación de un taller: el ambiente, el CUIT, el punto de venta y desde cuándo. Es lo único que escribe esas cuatro columnas, que no tienen grant (traba 2). Sin ningún grant: la llaman db:facturacion, como dueño de la base, solo en homologación y solo para el taller de la cuenta de los e2e, y public.facturacion_conectar(), en producción, recién después de que la función de borde entró a ARCA con el certificado del taller. Se niega si el taller ya está conectado, si tiene comprobantes en camino o si otro taller usa ese punto de venta con ese CUIT en ese ambiente (ADR 0085).';

revoke all on function private.conectar_la_facturacion(uuid, text, text, integer, date) from public, anon, authenticated, service_role;

create function private.desconectar_la_facturacion(p_household_id uuid, p_forzar boolean)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
begin
  if p_household_id is null then
    raise exception 'Desconectar la facturación necesita el taller' using errcode = '22004';
  end if;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = p_household_id
  for no key update;

  if not found then
    raise exception 'Ese taller no existe' using errcode = '22023', hint = 'sin-taller';
  end if;

  -- Con lo pedido o en camino no se desconecta; lo que está a revisar, solo forzando.
  if exists (
    select 1 from public.comprobantes c
    where c.household_id = p_household_id
      and c.deleted_at is null
      and (
        c.estado in ('pedida', 'emitiendo')
        or (c.estado = 'a_revisar' and not coalesce(p_forzar, false))
      )
  ) then
    raise exception 'Ese taller tiene comprobantes en camino' using errcode = '22023', hint = 'comprobantes-en-vuelo';
  end if;

  update public.ajustes a
  set facturacion_ambiente = null,
      facturacion_cuit = '',
      facturacion_punto_de_venta = null,
      facturacion_desde = null,
      facturacion_alertas = '[]'::jsonb
  where a.household_id = p_household_id
  returning a.* into v_ajustes;

  return v_ajustes;
end;
$$;

comment on function private.desconectar_la_facturacion(uuid, boolean) is
  'Desconecta la facturación de un taller: deja la conexión y las alertas vacías. No toca los comprobantes ni el certificado del taller, que puede volver a conectar desde Ajustes con su certificado activo. Se niega con algo pedido o en camino, y con algo a revisar salvo forzando. Sin ningún grant: la llama db:facturacion como dueño de la base (ADR 0085).';

revoke all on function private.desconectar_la_facturacion(uuid, boolean) from public, anon, authenticated, service_role;

create function private.resolver_el_comprobante(p_id uuid, p_resolucion jsonb)
returns public.comprobantes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_comprobante public.comprobantes;
  v_como text := p_resolucion ->> 'como';
begin
  if p_id is null or v_como is null or v_como not in ('autorizada', 'rechazada') then
    raise exception 'Se resuelve como autorizada, con el CAE, su vencimiento y la fecha, o como rechazada'
      using errcode = '22023';
  end if;

  select c.household_id into v_household from public.comprobantes c where c.id = p_id;
  if not found then
    raise exception 'Ese comprobante no existe' using errcode = '22023';
  end if;

  perform 1 from public.ajustes a where a.household_id = v_household for no key update;

  select c.* into v_comprobante from public.comprobantes c where c.id = p_id for update;

  if v_comprobante.estado <> 'a_revisar' then
    raise exception 'Solo se resuelve a mano un comprobante a revisar' using errcode = '22023', hint = 'no-esta-a-revisar';
  end if;

  if v_como = 'autorizada' then
    v_comprobante := private.autorizar_el_comprobante(
      p_id,
      p_resolucion ->> 'cae',
      (p_resolucion ->> 'vence')::date,
      (p_resolucion ->> 'fecha')::date
    );
  else
    update public.comprobantes c
    set estado = 'rechazada',
        numero = null,
        fecha = null,
        rechazo = coalesce(c.rechazo, '{}'::jsonb) || '{"resuelta": "a mano"}'::jsonb,
        emitiendo_hasta = null
    where c.id = p_id
    returning c.* into v_comprobante;
  end if;

  insert into private.arca_intercambios (household_id, comprobante_id, ambiente, metodo, pedido)
  values (v_household, p_id, v_comprobante.ambiente, 'resolver', p_resolucion::text);

  return v_comprobante;
end;
$$;

comment on function private.resolver_el_comprobante(uuid, jsonb) is
  'Resuelve a mano un comprobante a revisar que el control no pudo resolver, después de mirarlo en ARCA: {"como": "autorizada", "cae", "vence", "fecha"} o {"como": "rechazada"}. Deja anotado en private.arca_intercambios qué se hizo. Sin ningún grant: la llama db:facturacion --resolver como dueño de la base (ADR 0085).';

revoke all on function private.resolver_el_comprobante(uuid, jsonb) from public, anon, authenticated, service_role;


-- La cola: qué hay para trabajar, la toma y los pasos ------------------------------------------------------------

create function private.facturacion_pendientes(p_ambientes text[])
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(t.id order by t.orden, t.pedida_at, t.id), array[]::uuid[])
  from (
    select c.id, case c.estado when 'emitiendo' then 0 else 1 end as orden, c.pedida_at
    from public.comprobantes c
    where c.estado in ('pedida', 'emitiendo')
      and c.deleted_at is null
      and c.ambiente = any (coalesce(p_ambientes, array[]::text[]))
      and (c.emitiendo_hasta is null or c.emitiendo_hasta <= now())
    order by 2, c.pedida_at, c.id
    limit 20
  ) as t
$$;

comment on function private.facturacion_pendientes(text[]) is
  'Hasta 20 comprobantes para trabajar, de los ambientes que la función de borde tiene prendidos: primero los emitiendo cuya toma venció, que hay que consultar antes de pedir de nuevo, y después los pedidos, por cuándo se pidieron (ADR 0085).';

revoke all on function private.facturacion_pendientes(text[]) from public, anon, authenticated;
grant execute on function private.facturacion_pendientes(text[]) to service_role;

create function public.facturacion_pendientes(p_ambientes text[])
returns uuid[]
language sql
stable
set search_path = ''
as $$
  select private.facturacion_pendientes(p_ambientes)
$$;

comment on function public.facturacion_pendientes(text[]) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_pendientes(text[]) from public, anon, authenticated;
grant execute on function public.facturacion_pendientes(text[]) to service_role;

create function private.facturacion_tomar(p_id uuid, p_segundos integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_comprobante public.comprobantes;
begin
  if p_id is null or p_segundos is null or p_segundos not between 1 and 600 then
    raise exception 'La toma necesita el comprobante y de 1 a 600 segundos' using errcode = '22023';
  end if;

  select c.household_id into v_household from public.comprobantes c where c.id = p_id;
  if not found then
    return null;
  end if;

  -- Los candados de la invariante 1, en este orden: los ajustes del taller y después la fila.
  perform 1 from public.ajustes a where a.household_id = v_household for no key update;

  select c.* into v_comprobante from public.comprobantes c where c.id = p_id for update;

  if v_comprobante.estado not in ('pedida', 'emitiendo')
    or v_comprobante.deleted_at is not null
    or v_comprobante.emitiendo_hasta > now() then
    return null;
  end if;

  if v_comprobante.estado = 'pedida' and private.facturacion_secuencia_ocupada(v_comprobante) then
    return null;
  end if;

  update public.comprobantes c
  set emitiendo_hasta = now() + make_interval(secs => p_segundos),
      intentos = c.intentos + 1
  where c.id = p_id
  returning c.* into v_comprobante;

  return to_jsonb(v_comprobante);
end;
$$;

comment on function private.facturacion_tomar(uuid, integer) is
  'La toma de un comprobante: si está pedido o emitiendo, sin baja y libre o con la toma vencida, y si es un pedido cuya secuencia no tiene otro emitiendo ni tomado, le pone emitiendo_hasta = ahora + p_segundos, le suma un intento y lo devuelve. Si no, null. Toma los ajustes del taller for no key update y después la fila for update. La toma es una fecha y no una transacción, porque la función habla con ARCA entre llamadas a la base; cada paso lleva su número de intento (ADR 0085).';

revoke all on function private.facturacion_tomar(uuid, integer) from public, anon, authenticated;
grant execute on function private.facturacion_tomar(uuid, integer) to service_role;

create function public.facturacion_tomar(p_id uuid, p_segundos integer)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_tomar(p_id, p_segundos)
$$;

comment on function public.facturacion_tomar(uuid, integer) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_tomar(uuid, integer) from public, anon, authenticated;
grant execute on function public.facturacion_tomar(uuid, integer) to service_role;

create function private.facturacion_anotar(p_id uuid, p_paso jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paso text := p_paso ->> 'paso';
  v_household uuid;
  v_comprobante public.comprobantes;
  v_numero bigint;
  v_fecha date;
  v_segundos integer;
  v_motivo text;
  v_choco boolean := false;
begin
  if p_id is null
    or jsonb_typeof(p_paso) is distinct from 'object'
    or v_paso is null
    or v_paso not in ('reservar', 'autorizada', 'rechazada', 'a_revisar', 'pedida', 'soltar') then
    raise exception 'Ese paso no existe' using errcode = '22023';
  end if;

  select c.household_id into v_household from public.comprobantes c where c.id = p_id;
  if not found then
    raise exception 'Ese comprobante no existe' using errcode = '22023';
  end if;

  perform 1 from public.ajustes a where a.household_id = v_household for no key update;

  select c.* into v_comprobante from public.comprobantes c where c.id = p_id for update;

  -- Todo paso sobre un pedido o un emitiendo es de una toma vigente, y de esa toma: la vuelta que lo tomó
  -- manda su intento. Uno a revisar lo resuelve el control sin tomarlo, solo a autorizado o a pedido.
  if v_comprobante.estado in ('pedida', 'emitiendo') then
    if v_comprobante.emitiendo_hasta is null
      or v_comprobante.emitiendo_hasta <= now()
      or (p_paso ->> 'intento') is distinct from v_comprobante.intentos::text then
      raise exception 'La toma de este comprobante venció o es de otra vuelta' using errcode = '55000';
    end if;
  elsif not (v_comprobante.estado = 'a_revisar' and v_paso in ('autorizada', 'pedida')) then
    raise exception 'Un comprobante % no da el paso %', v_comprobante.estado, v_paso using errcode = '55000';
  end if;

  case v_paso
    when 'reservar' then
      v_numero := (p_paso ->> 'numero')::bigint;
      v_fecha := (p_paso ->> 'fecha')::date;
      v_segundos := coalesce((p_paso ->> 'segundos')::integer, 120);

      if v_numero is null or v_numero not between 1 and 99999999 or v_segundos not between 1 and 600 then
        raise exception 'Reservar necesita un número de 1 a 99999999' using errcode = '22023';
      end if;

      if v_fecha is distinct from private.hoy_en_el_taller() then
        raise exception 'La fecha del comprobante es la de hoy en el taller' using errcode = '22023';
      end if;

      -- Con los mismos candados que la toma, y en el mismo orden: si otro de la secuencia está en vuelo, o
      -- si el número ya es de otro, contesta como soltar.
      if private.facturacion_secuencia_ocupada(v_comprobante) then
        v_choco := true;
      else
        begin
          update public.comprobantes c
          set estado = 'emitiendo',
              numero = v_numero,
              fecha = v_fecha,
              emitiendo_hasta = now() + make_interval(secs => v_segundos)
          where c.id = p_id
          returning c.* into v_comprobante;
        exception
          when unique_violation then
            v_choco := true;
        end;
      end if;

      if v_choco then
        update public.comprobantes c
        set emitiendo_hasta = case when c.estado = 'emitiendo' then now() + interval '5 minutes' end,
            ultimo_error = 'La secuencia o el número estaban ocupados: se vuelve a intentar.'
        where c.id = p_id
        returning c.* into v_comprobante;

        return jsonb_build_object('hecho', false, 'comprobante', to_jsonb(v_comprobante));
      end if;

    when 'autorizada' then
      if v_comprobante.estado = 'pedida' then
        raise exception 'Un comprobante pedido no queda autorizado sin su número' using errcode = '55000';
      end if;

      v_comprobante := private.autorizar_el_comprobante(
        p_id,
        p_paso ->> 'cae',
        (p_paso ->> 'caeVence')::date,
        (p_paso ->> 'fecha')::date
      );

    when 'rechazada' then
      if v_comprobante.estado <> 'emitiendo' then
        raise exception 'Solo se rechaza un comprobante emitiendo' using errcode = '55000';
      end if;

      if jsonb_typeof(p_paso -> 'rechazo') is distinct from 'object' then
        raise exception 'Un rechazo lleva lo que contestó ARCA' using errcode = '22023';
      end if;

      update public.comprobantes c
      set estado = 'rechazada',
          numero = null,
          fecha = null,
          rechazo = p_paso -> 'rechazo',
          emitiendo_hasta = null,
          ultimo_error = null
      where c.id = p_id
      returning c.* into v_comprobante;

    when 'a_revisar' then
      if v_comprobante.estado <> 'emitiendo' then
        raise exception 'Solo queda a revisar un comprobante emitiendo' using errcode = '55000';
      end if;

      v_motivo := left(p_paso ->> 'motivo', 500);
      if coalesce(v_motivo, '') !~ '[^ \t\n\r\f\v]' then
        raise exception 'A revisar lleva su motivo' using errcode = '22023';
      end if;

      update public.comprobantes c
      set estado = 'a_revisar',
          rechazo = jsonb_build_object('motivo', v_motivo),
          emitiendo_hasta = null,
          ultimo_error = null
      where c.id = p_id
      returning c.* into v_comprobante;

    when 'pedida' then
      if v_comprobante.estado = 'pedida' then
        raise exception 'Ya está pedido: para dejarlo, soltar' using errcode = '55000';
      end if;

      update public.comprobantes c
      set estado = 'pedida',
          numero = null,
          fecha = null,
          emitiendo_hasta = null,
          ultimo_error = left(p_paso ->> 'error', 500)
      where c.id = p_id
      returning c.* into v_comprobante;

    when 'soltar' then
      -- Un emitiendo que se quedó sin respuesta no se libera enseguida: ARCA puede estar terminando.
      update public.comprobantes c
      set emitiendo_hasta = case when c.estado = 'emitiendo' then now() + interval '5 minutes' end,
          ultimo_error = left(p_paso ->> 'error', 500)
      where c.id = p_id
      returning c.* into v_comprobante;
  end case;

  return jsonb_build_object('hecho', true, 'comprobante', to_jsonb(v_comprobante));
end;
$$;

comment on function private.facturacion_anotar(uuid, jsonb) is
  'Cada paso de la función de borde sobre un comprobante tomado, con su intento: reservar ({numero, fecha, segundos}: emitiendo con el número, la fecha de hoy en el taller y la toma extendida; si la secuencia tiene otro en vuelo o el número es de otro, contesta como soltar, con hecho en false), autorizada ({cae, caeVence, fecha}; una nota de crédito anula su factura en la misma transacción), rechazada ({rechazo}), a_revisar ({motivo}), pedida (vuelve sin número) y soltar ({error}: libera un pedido y deja un emitiendo cinco minutos más). Toma los ajustes y la fila en el orden de facturacion_tomar. Uno a revisar lo resuelve el control sin tomarlo, a autorizada o a pedida. Devuelve {hecho, comprobante} (ADR 0085).';

revoke all on function private.facturacion_anotar(uuid, jsonb) from public, anon, authenticated;
grant execute on function private.facturacion_anotar(uuid, jsonb) to service_role;

create function public.facturacion_anotar(p_id uuid, p_paso jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_anotar(p_id, p_paso)
$$;

comment on function public.facturacion_anotar(uuid, jsonb) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_anotar(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.facturacion_anotar(uuid, jsonb) to service_role;


-- El ticket del WSAA ------------------------------------------------------------------------------------------------

create function private.facturacion_tomar_el_login(p_certificado text, p_segundos integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket private.arca_tickets;
  v_el_guardado jsonb;
begin
  if p_certificado is null or p_segundos is null or p_segundos not between 1 and 600 then
    raise exception 'El login necesita el certificado y de 1 a 600 segundos' using errcode = '22023';
  end if;

  if p_certificado <> 'homologacion'
    and not exists (select 1 from private.arca_certificados c where c.huella = p_certificado) then
    raise exception 'Ese certificado no existe' using errcode = '22023';
  end if;

  insert into private.arca_tickets (certificado) values (p_certificado) on conflict do nothing;

  select t.* into v_ticket from private.arca_tickets t where t.certificado = p_certificado for update;

  v_el_guardado := jsonb_build_object(
    'ticket', jsonb_build_object('token', v_ticket.token, 'firma', v_ticket.firma, 'vence', v_ticket.vence)
  );

  -- Con más de diez minutos por delante, el guardado.
  if v_ticket.vence > now() + interval '10 minutes' then
    return v_el_guardado;
  end if;

  -- Si ARCA no da otro todavía, o alguien ya lo está pidiendo, el guardado mientras valga; si no, esperar.
  if v_ticket.bloqueado_hasta > now() or v_ticket.login_hasta > now() then
    if v_ticket.vence > now() + interval '1 minute' then
      return v_el_guardado;
    end if;

    return jsonb_build_object(
      'esperar', greatest(coalesce(v_ticket.bloqueado_hasta, '-infinity'), coalesce(v_ticket.login_hasta, '-infinity'))
    );
  end if;

  update private.arca_tickets t
  set login_hasta = now() + make_interval(secs => p_segundos)
  where t.certificado = p_certificado;

  return jsonb_build_object('pedir', true);
end;
$$;

comment on function private.facturacion_tomar_el_login(text, integer) is
  'El ticket del WSAA de un certificado (homologacion, o la huella de uno de producción): el guardado si le quedan más de diez minutos ({ticket}); si no, el permiso de pedir uno nuevo a una sola llamada por vez, por p_segundos ({pedir}); a las demás, el guardado mientras valga o hasta cuándo esperar ({esperar}), y lo mismo con el bloqueo de «ya posee un TA valido». La fila nace la primera vez (ADR 0085).';

revoke all on function private.facturacion_tomar_el_login(text, integer) from public, anon, authenticated;
grant execute on function private.facturacion_tomar_el_login(text, integer) to service_role;

create function public.facturacion_tomar_el_login(p_certificado text, p_segundos integer)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_tomar_el_login(p_certificado, p_segundos)
$$;

comment on function public.facturacion_tomar_el_login(text, integer) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_tomar_el_login(text, integer) from public, anon, authenticated;
grant execute on function public.facturacion_tomar_el_login(text, integer) to service_role;

create function private.facturacion_guardar_el_ticket(p_certificado text, p_ticket jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_certificado is null or jsonb_typeof(p_ticket) is distinct from 'object' then
    raise exception 'Guardar el ticket necesita el certificado y qué guardar' using errcode = '22023';
  end if;

  if p_certificado <> 'homologacion'
    and not exists (select 1 from private.arca_certificados c where c.huella = p_certificado) then
    raise exception 'Ese certificado no existe' using errcode = '22023';
  end if;

  insert into private.arca_tickets (certificado) values (p_certificado) on conflict do nothing;

  if p_ticket ? 'token' then
    if coalesce(p_ticket ->> 'token', '') = '' or coalesce(p_ticket ->> 'firma', '') = '' or (p_ticket ->> 'vence') is null then
      raise exception 'Un ticket lleva el token, la firma y su vencimiento' using errcode = '22023';
    end if;

    update private.arca_tickets t
    set token = p_ticket ->> 'token',
        firma = p_ticket ->> 'firma',
        vence = (p_ticket ->> 'vence')::timestamptz,
        obtenido_at = now(),
        login_hasta = null,
        bloqueado_hasta = null
    where t.certificado = p_certificado;
  elsif p_ticket ? 'bloqueadoHasta' then
    update private.arca_tickets t
    set bloqueado_hasta = (p_ticket ->> 'bloqueadoHasta')::timestamptz,
        login_hasta = null
    where t.certificado = p_certificado;
  elsif p_ticket -> 'soltar' = 'true'::jsonb then
    update private.arca_tickets t
    set login_hasta = null
    where t.certificado = p_certificado;
  elsif p_ticket -> 'borrar' = 'true'::jsonb then
    update private.arca_tickets t
    set token = null, firma = null, vence = null, obtenido_at = null, login_hasta = null
    where t.certificado = p_certificado;
  else
    raise exception 'Se guarda un ticket, un bloqueo, se suelta el login o se borra el ticket' using errcode = '22023';
  end if;

  return true;
end;
$$;

comment on function private.facturacion_guardar_el_ticket(text, jsonb) is
  'Guarda el ticket nuevo de un certificado ({token, firma, vence}), el bloqueo de ARCA ({bloqueadoHasta}), suelta el login que no consiguió nada ({soltar: true}) o borra el ticket guardado, después de un 600 o un 601 del WSFE ({borrar: true}). El ticket se guarda tal como llega, sin decodificarlo (ADR 0085).';

revoke all on function private.facturacion_guardar_el_ticket(text, jsonb) from public, anon, authenticated;
grant execute on function private.facturacion_guardar_el_ticket(text, jsonb) to service_role;

create function public.facturacion_guardar_el_ticket(p_certificado text, p_ticket jsonb)
returns boolean
language sql
set search_path = ''
as $$
  select private.facturacion_guardar_el_ticket(p_certificado, p_ticket)
$$;

comment on function public.facturacion_guardar_el_ticket(text, jsonb) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_guardar_el_ticket(text, jsonb) from public, anon, authenticated;
grant execute on function public.facturacion_guardar_el_ticket(text, jsonb) to service_role;


-- El certificado de cada taller y la conexión de producción ---------------------------------------------------------

create function private.facturacion_certificados(p_household_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'activo', (
      select jsonb_build_object(
        'id', c.id, 'cuit', c.cuit, 'certificado', c.certificado, 'huella', c.huella, 'vence', c.vence,
        'claveCifrada', c.clave_cifrada, 'claveIv', c.clave_iv
      )
      from private.arca_certificados c
      where c.household_id = p_household_id and c.estado = 'activo'
    ),
    'pendiente', (
      select jsonb_build_object(
        'id', c.id, 'estado', c.estado, 'cuit', c.cuit, 'pedido', c.pedido, 'certificado', c.certificado,
        'huella', c.huella, 'vence', c.vence, 'claveCifrada', c.clave_cifrada, 'claveIv', c.clave_iv
      )
      from private.arca_certificados c
      where c.household_id = p_household_id and c.estado <> 'activo'
    )
  )
$$;

comment on function private.facturacion_certificados(uuid) is
  'El certificado activo y el pendiente de un taller, con la clave cifrada, para que la función de borde firme el login o controle el certificado que sube el dueño. La clave sale cifrada: sin ARCA_PRODUCCION_LLAVE no sirve (ADR 0085).';

revoke all on function private.facturacion_certificados(uuid) from public, anon, authenticated;
grant execute on function private.facturacion_certificados(uuid) to service_role;

create function public.facturacion_certificados(p_household_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.facturacion_certificados(p_household_id)
$$;

comment on function public.facturacion_certificados(uuid) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_certificados(uuid) from public, anon, authenticated;
grant execute on function public.facturacion_certificados(uuid) to service_role;

create function private.facturacion_guardar_el_pedido(
  p_household_id uuid,
  p_cuit text,
  p_pedido text,
  p_clave_cifrada text,
  p_clave_iv text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_certificado private.arca_certificados;
begin
  if num_nulls(p_household_id, p_cuit, p_pedido, p_clave_cifrada, p_clave_iv) > 0 then
    raise exception 'Guardar el pedido necesita el taller, el CUIT, el pedido y la clave cifrada' using errcode = '22004';
  end if;

  if p_cuit !~ '^[0-9]{2}-[0-9]{8}-[0-9]$' or not private.cuit_valido(p_cuit) then
    raise exception 'El CUIT del pedido no es válido' using errcode = '22023', hint = 'cuit-invalido';
  end if;

  perform 1 from public.ajustes a where a.household_id = p_household_id for no key update;
  if not found then
    raise exception 'Ese taller no existe' using errcode = '22023', hint = 'sin-taller';
  end if;

  -- El pedido nuevo reemplaza al pendiente anterior, nunca al activo.
  delete from private.arca_certificados c
  where c.household_id = p_household_id and c.estado <> 'activo';

  insert into private.arca_certificados (household_id, cuit, pedido, clave_cifrada, clave_iv)
  values (p_household_id, p_cuit, p_pedido, p_clave_cifrada, p_clave_iv)
  returning * into v_certificado;

  return jsonb_build_object(
    'id', v_certificado.id, 'estado', v_certificado.estado, 'cuit', v_certificado.cuit, 'vence', v_certificado.vence
  );
end;
$$;

comment on function private.facturacion_guardar_el_pedido(uuid, text, text, text, text) is
  'Guarda un pedido de certificado nuevo de un taller, con su clave privada cifrada, y borra el pendiente anterior: nunca el activo. Devuelve el pedido sin la clave (ADR 0085).';

revoke all on function private.facturacion_guardar_el_pedido(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function private.facturacion_guardar_el_pedido(uuid, text, text, text, text) to service_role;

create function public.facturacion_guardar_el_pedido(
  p_household_id uuid,
  p_cuit text,
  p_pedido text,
  p_clave_cifrada text,
  p_clave_iv text
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_guardar_el_pedido(p_household_id, p_cuit, p_pedido, p_clave_cifrada, p_clave_iv)
$$;

comment on function public.facturacion_guardar_el_pedido(uuid, text, text, text, text) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_guardar_el_pedido(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.facturacion_guardar_el_pedido(uuid, text, text, text, text) to service_role;

create function private.facturacion_guardar_el_certificado(
  p_id uuid,
  p_certificado text,
  p_huella text,
  p_vence date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_certificado private.arca_certificados;
begin
  if num_nulls(p_id, p_certificado, p_huella, p_vence) > 0 then
    raise exception 'Guardar el certificado necesita el pedido, el certificado, su huella y su vencimiento' using errcode = '22004';
  end if;

  select c.household_id into v_household from private.arca_certificados c where c.id = p_id;
  if not found then
    raise exception 'Ese pedido no existe' using errcode = '22023', hint = 'sin-pedido';
  end if;

  perform 1 from public.ajustes a where a.household_id = v_household for no key update;

  begin
    update private.arca_certificados c
    set estado = 'subido',
        certificado = p_certificado,
        huella = p_huella,
        vence = p_vence,
        updated_at = now()
    where c.id = p_id and c.estado = 'pedido'
    returning c.* into v_certificado;
  exception
    when unique_violation then
      raise exception 'Ese certificado ya está guardado' using errcode = '22023', hint = 'certificado-repetido';
  end;

  if v_certificado.id is null then
    raise exception 'Ese pedido ya tiene su certificado' using errcode = '22023', hint = 'sin-pedido';
  end if;

  return jsonb_build_object(
    'id', v_certificado.id, 'estado', v_certificado.estado, 'cuit', v_certificado.cuit, 'vence', v_certificado.vence
  );
end;
$$;

comment on function private.facturacion_guardar_el_certificado(uuid, text, text, date) is
  'Guarda el certificado que el dueño bajó de ARCA en su pedido, con su huella y su vencimiento: pasa a subido solo un certificado en pedido. Los controles del certificado (que sea X.509, de la clave del pedido, del CUIT del pedido y no vencido) los hace la función de borde antes (ADR 0085).';

revoke all on function private.facturacion_guardar_el_certificado(uuid, text, text, date) from public, anon, authenticated;
grant execute on function private.facturacion_guardar_el_certificado(uuid, text, text, date) to service_role;

create function public.facturacion_guardar_el_certificado(p_id uuid, p_certificado text, p_huella text, p_vence date)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_guardar_el_certificado(p_id, p_certificado, p_huella, p_vence)
$$;

comment on function public.facturacion_guardar_el_certificado(uuid, text, text, date) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_guardar_el_certificado(uuid, text, text, date) from public, anon, authenticated;
grant execute on function public.facturacion_guardar_el_certificado(uuid, text, text, date) to service_role;

create function private.facturacion_conectar(p_household_id uuid, p_certificado_id uuid, p_punto_de_venta integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
  v_certificado private.arca_certificados;
begin
  if num_nulls(p_household_id, p_certificado_id, p_punto_de_venta) > 0 or p_punto_de_venta not between 1 and 99998 then
    raise exception 'Conectar necesita el taller, el certificado y un punto de venta de 1 a 99998' using errcode = '22023';
  end if;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = p_household_id
  for no key update;

  select c.* into v_certificado
  from private.arca_certificados c
  where c.id = p_certificado_id
  for update;

  if v_ajustes.household_id is null or v_certificado.id is null or v_certificado.household_id <> p_household_id then
    raise exception 'Ese certificado no es de este taller' using errcode = '22023', hint = 'certificado-ajeno';
  end if;

  if v_ajustes.facturacion_ambiente = 'homologacion' then
    raise exception 'El taller factura en prueba' using errcode = '22023', hint = 'en-prueba';
  end if;

  if v_ajustes.facturacion_ambiente = 'produccion' then
    -- Renovar: cambia solo el certificado, con el mismo CUIT y el mismo punto de venta.
    if v_certificado.estado <> 'subido' then
      raise exception 'Ese certificado no está subido' using errcode = '22023', hint = 'certificado-sin-subir';
    end if;

    if v_certificado.cuit <> v_ajustes.facturacion_cuit then
      raise exception 'El certificado nuevo es de otro CUIT' using errcode = '22023', hint = 'otro-cuit';
    end if;

    if p_punto_de_venta <> v_ajustes.facturacion_punto_de_venta then
      raise exception 'Al renovar, el punto de venta es el mismo' using errcode = '22023', hint = 'otro-punto-de-venta';
    end if;
  else
    -- Conectar: con el subido, o con el activo de un taller que se desconectó.
    if v_certificado.estado = 'pedido' then
      raise exception 'Ese certificado no está subido' using errcode = '22023', hint = 'certificado-sin-subir';
    end if;

    if exists (
      select 1 from public.comprobantes c
      where c.household_id = p_household_id
        and c.deleted_at is null
        and c.estado in ('pedida', 'emitiendo', 'a_revisar')
    ) then
      raise exception 'El taller tiene comprobantes en camino' using errcode = '22023', hint = 'comprobantes-en-vuelo';
    end if;

    if exists (
      select 1 from public.ajustes o
      where o.household_id <> p_household_id
        and o.facturacion_ambiente = 'produccion'
        and o.facturacion_cuit = v_certificado.cuit
        and o.facturacion_punto_de_venta = p_punto_de_venta
    ) then
      raise exception 'Ese punto de venta ya lo usa otro taller' using errcode = '22023', hint = 'punto-de-venta-de-otro-taller';
    end if;
  end if;

  -- Al activar uno, el anterior se borra, con su ticket.
  if v_certificado.estado = 'subido' then
    delete from private.arca_certificados c
    where c.household_id = p_household_id and c.estado = 'activo';

    update private.arca_certificados c
    set estado = 'activo', updated_at = now()
    where c.id = p_certificado_id;
  end if;

  if v_ajustes.facturacion_ambiente is null then
    perform private.conectar_la_facturacion(
      p_household_id, 'produccion', v_certificado.cuit, p_punto_de_venta, private.hoy_en_el_taller()
    );
  end if;

  return private.facturacion_del_taller(p_household_id);
end;
$$;

comment on function private.facturacion_conectar(uuid, uuid, integer) is
  'Conecta un taller en producción, o renueva su certificado. La llama la función de borde recién después de entrar a ARCA con ese certificado y de encontrar el punto de venta, en el mismo pedido que confirmó el dueño. Con un certificado subido lo pasa a activo y borra el anterior; con el activo de un taller desconectado, lo deja como está. Si el taller no estaba conectado, lo conecta con el CUIT del certificado, ese punto de venta y hoy (private.conectar_la_facturacion). Se niega, con el motivo en el hint, si el certificado no es de ese taller (certificado-ajeno) o no está subido ni es el activo de un taller desconectado (certificado-sin-subir), si el taller está en homologación (en-prueba), si al conectarse tiene comprobantes en camino (comprobantes-en-vuelo) o si otro taller usa ese CUIT y ese punto de venta (punto-de-venta-de-otro-taller), y al renovar, si el CUIT o el punto de venta no son los mismos (otro-cuit, otro-punto-de-venta) (ADR 0085).';

revoke all on function private.facturacion_conectar(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function private.facturacion_conectar(uuid, uuid, integer) to service_role;

create function public.facturacion_conectar(p_household_id uuid, p_certificado_id uuid, p_punto_de_venta integer)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_conectar(p_household_id, p_certificado_id, p_punto_de_venta)
$$;

comment on function public.facturacion_conectar(uuid, uuid, integer) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_conectar(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.facturacion_conectar(uuid, uuid, integer) to service_role;


-- Lo que anota la función: los intercambios, el acceso y las alertas del control ------------------------------------

create function private.facturacion_anotar_el_intercambio(p_intercambio jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_intercambio) is distinct from 'object' then
    raise exception 'Un intercambio es un objeto' using errcode = '22023';
  end if;

  insert into private.arca_intercambios (
    household_id, comprobante_id, ambiente, metodo, http_estado, duracion_ms, pedido, respuesta, error
  ) values (
    (p_intercambio ->> 'householdId')::uuid,
    (p_intercambio ->> 'comprobanteId')::uuid,
    p_intercambio ->> 'ambiente',
    p_intercambio ->> 'metodo',
    (p_intercambio ->> 'httpEstado')::integer,
    (p_intercambio ->> 'duracionMs')::integer,
    left(p_intercambio ->> 'pedido', 102400),
    left(p_intercambio ->> 'respuesta', 102400),
    left(p_intercambio ->> 'error', 500)
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function private.facturacion_anotar_el_intercambio(jsonb) is
  'Anota una llamada a ARCA en private.arca_intercambios: {householdId, comprobanteId, ambiente, metodo, httpEstado, duracionMs, pedido, respuesta, error}, con el pedido y la respuesta recortados a 100 KB y el error a 500. El check de la tabla rechaza un XML con el bloque Auth, un elemento Cuit o el CMS (ADR 0085).';

revoke all on function private.facturacion_anotar_el_intercambio(jsonb) from public, anon, authenticated;
grant execute on function private.facturacion_anotar_el_intercambio(jsonb) to service_role;

create function public.facturacion_anotar_el_intercambio(p_intercambio jsonb)
returns uuid
language sql
set search_path = ''
as $$
  select private.facturacion_anotar_el_intercambio(p_intercambio)
$$;

comment on function public.facturacion_anotar_el_intercambio(jsonb) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_anotar_el_intercambio(jsonb) from public, anon, authenticated;
grant execute on function public.facturacion_anotar_el_intercambio(jsonb) to service_role;

create function private.facturacion_anotar_el_acceso(p_ambiente text, p_ok boolean, p_household_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taller record;
  v_alertas jsonb;
  v_cuantos integer := 0;
begin
  if p_ambiente is null or p_ambiente not in ('homologacion', 'produccion') or p_ok is null then
    raise exception 'El acceso necesita el ambiente y si anduvo' using errcode = '22023';
  end if;

  -- En producción cada taller entra con su certificado: el acceso es siempre de uno.
  if p_ambiente = 'produccion' and p_household_id is null then
    raise exception 'En producción el acceso es de un taller' using errcode = '22023';
  end if;

  for v_taller in
    select a.household_id, a.facturacion_alertas
    from public.ajustes a
    where (p_household_id is null and a.facturacion_ambiente = p_ambiente)
       or a.household_id = p_household_id
    order by a.household_id
    for no key update
  loop
    if p_ok then
      select coalesce(jsonb_agg(t.alerta order by t.orden), '[]'::jsonb) into v_alertas
      from jsonb_array_elements(v_taller.facturacion_alertas) with ordinality as t (alerta, orden)
      where t.alerta ->> 'codigo' is distinct from 'sin-acceso';
    elsif exists (
      select 1 from jsonb_array_elements(v_taller.facturacion_alertas) as t (alerta)
      where t.alerta ->> 'codigo' = 'sin-acceso'
    ) then
      v_alertas := v_taller.facturacion_alertas;
    else
      v_alertas := v_taller.facturacion_alertas || jsonb_build_array(jsonb_build_object('codigo', 'sin-acceso', 'desde', now()));
    end if;

    if v_alertas is distinct from v_taller.facturacion_alertas then
      update public.ajustes a set facturacion_alertas = v_alertas where a.household_id = v_taller.household_id;
      v_cuantos := v_cuantos + 1;
    end if;
  end loop;

  return v_cuantos;
end;
$$;

comment on function private.facturacion_anotar_el_acceso(text, boolean, uuid) is
  'Pone o saca la alerta sin-acceso ({codigo, desde}) después de un login: sin taller, solo en homologación y en todos los talleres conectados ahí, que comparten el certificado de prueba; con un taller, solo en ese. En producción va siempre con el taller del certificado, y sin taller se niega. Devuelve en cuántos talleres cambió algo (ADR 0085).';

revoke all on function private.facturacion_anotar_el_acceso(text, boolean, uuid) from public, anon, authenticated;
grant execute on function private.facturacion_anotar_el_acceso(text, boolean, uuid) to service_role;

create function public.facturacion_anotar_el_acceso(p_ambiente text, p_ok boolean, p_household_id uuid)
returns integer
language sql
set search_path = ''
as $$
  select private.facturacion_anotar_el_acceso(p_ambiente, p_ok, p_household_id)
$$;

comment on function public.facturacion_anotar_el_acceso(text, boolean, uuid) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_anotar_el_acceso(text, boolean, uuid) from public, anon, authenticated;
grant execute on function public.facturacion_anotar_el_acceso(text, boolean, uuid) to service_role;

create function private.facturacion_para_controlar(p_ambientes text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'householdId', a.household_id,
        'ambiente', a.facturacion_ambiente,
        'cuit', a.facturacion_cuit,
        'puntoDeVenta', a.facturacion_punto_de_venta,
        'certificadoVence', (
          select c.vence from private.arca_certificados c
          where c.household_id = a.household_id and c.estado = 'activo'
        ),
        'ultimos', (
          select jsonb_build_object(
            'factura_c', max(c.numero) filter (where c.tipo = 'factura_c'),
            'nota_de_credito_c', max(c.numero) filter (where c.tipo = 'nota_de_credito_c')
          )
          from public.comprobantes c
          where c.household_id = a.household_id
            and c.ambiente = a.facturacion_ambiente
            and c.cuit_emisor = a.facturacion_cuit
            and c.punto_de_venta = a.facturacion_punto_de_venta
            and c.estado in ('autorizada', 'anulada', 'emitiendo', 'a_revisar')
        ),
        'aRevisar', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id', c.id, 'tipo', c.tipo, 'ambiente', c.ambiente, 'cuitEmisor', c.cuit_emisor,
                'puntoDeVenta', c.punto_de_venta, 'numero', c.numero, 'fecha', c.fecha,
                'importeCentavos', c.importe_centavos, 'docTipo', c.doc_tipo, 'docNro', c.doc_nro,
                'proyectoId', c.proyecto_id, 'cliente', c.receptor_nombre
              )
              order by c.pedida_at, c.id
            ),
            '[]'::jsonb
          )
          from public.comprobantes c
          where c.household_id = a.household_id and c.estado = 'a_revisar' and c.deleted_at is null
        ),
        'alertas', a.facturacion_alertas
      )
      order by a.household_id
    ),
    '[]'::jsonb
  )
  from public.ajustes a
  where a.facturacion_ambiente = any (coalesce(p_ambientes, array[]::text[]))
$$;

comment on function private.facturacion_para_controlar(text[]) is
  'Lo que mira el control diario, por taller conectado en los ambientes prendidos: el ambiente, el CUIT, el punto de venta, el vencimiento de su certificado activo, el último número de cada tipo que NUMA tiene en esa secuencia (autorizado, anulado, emitiendo o a revisar, contando las filas dadas de baja), los comprobantes a revisar y las alertas que tiene (ADR 0085).';

revoke all on function private.facturacion_para_controlar(text[]) from public, anon, authenticated;
grant execute on function private.facturacion_para_controlar(text[]) to service_role;

create function public.facturacion_para_controlar(p_ambientes text[])
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.facturacion_para_controlar(p_ambientes)
$$;

comment on function public.facturacion_para_controlar(text[]) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_para_controlar(text[]) from public, anon, authenticated;
grant execute on function public.facturacion_para_controlar(text[]) to service_role;

create function private.facturacion_anotar_las_alertas(p_household_id uuid, p_alertas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_del_control constant text[] := array['fuera-de-numa', 'certificado-por-vencer', 'a-revisar'];
  v_viejas jsonb;
  v_nuevas jsonb;
begin
  if p_household_id is null
    or jsonb_typeof(p_alertas) is distinct from 'array'
    or exists (
      select 1 from jsonb_array_elements(p_alertas) as t (alerta)
      where jsonb_typeof(t.alerta) <> 'object' or not coalesce(t.alerta ->> 'codigo' = any (c_del_control), false)
    ) then
    raise exception 'Las alertas del control son fuera-de-numa, certificado-por-vencer y a-revisar' using errcode = '22023';
  end if;

  select a.facturacion_alertas into v_viejas
  from public.ajustes a
  where a.household_id = p_household_id
  for no key update;

  if not found then
    raise exception 'Ese taller no existe' using errcode = '22023';
  end if;

  -- La fuera-de-numa que el dueño ya descartó con el mismo número sigue descartada; con otro, vuelve.
  select coalesce(
    jsonb_agg(
      case
        when t.alerta ->> 'codigo' = 'fuera-de-numa' then
          t.alerta || jsonb_build_object('descartada', exists (
            select 1 from jsonb_array_elements(v_viejas) as v (alerta)
            where v.alerta ->> 'codigo' = 'fuera-de-numa'
              and v.alerta -> 'tipo' = t.alerta -> 'tipo'
              and v.alerta -> 'numeroArca' = t.alerta -> 'numeroArca'
              and v.alerta -> 'descartada' = 'true'::jsonb
          ))
        else t.alerta
      end
      order by t.orden
    ),
    '[]'::jsonb
  ) into v_nuevas
  from jsonb_array_elements(p_alertas) with ordinality as t (alerta, orden);

  -- Las que no son del control (sin-acceso, del login) quedan como estaban, adelante.
  v_nuevas := coalesce(
    (
      select jsonb_agg(t.alerta order by t.orden)
      from jsonb_array_elements(v_viejas) with ordinality as t (alerta, orden)
      where not coalesce(t.alerta ->> 'codigo' = any (c_del_control), false)
    ),
    '[]'::jsonb
  ) || v_nuevas;

  if v_nuevas is distinct from v_viejas then
    update public.ajustes a set facturacion_alertas = v_nuevas where a.household_id = p_household_id;
  end if;

  return v_nuevas;
end;
$$;

comment on function private.facturacion_anotar_las_alertas(uuid, jsonb) is
  'Reemplaza las alertas del control diario de un taller (fuera-de-numa, certificado-por-vencer y a-revisar) sin tocar sin-acceso, que es del login, y conserva descartada la fuera-de-numa que el dueño ya vio con el mismo tipo y el mismo número de ARCA. Devuelve las alertas que quedaron (ADR 0085).';

revoke all on function private.facturacion_anotar_las_alertas(uuid, jsonb) from public, anon, authenticated;
grant execute on function private.facturacion_anotar_las_alertas(uuid, jsonb) to service_role;

create function public.facturacion_anotar_las_alertas(p_household_id uuid, p_alertas jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select private.facturacion_anotar_las_alertas(p_household_id, p_alertas)
$$;

comment on function public.facturacion_anotar_las_alertas(uuid, jsonb) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_anotar_las_alertas(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.facturacion_anotar_las_alertas(uuid, jsonb) to service_role;

create function private.facturacion_del_usuario(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.facturacion_del_taller(m.household_id)
  from public.household_members m
  join public.households h on h.id = m.household_id and h.deleted_at is null
  where m.user_id = p_user_id
    and m.deleted_at is null
    and m.rol = 'titular'
  limit 1
$$;

comment on function private.facturacion_del_usuario(uuid) is
  'Para las rutas con sesión de la función de borde, que validan la sesión con Auth y mandan el id del usuario: la facturación de su taller si es su titular (private.facturacion_del_taller), o null si no es dueño de ninguno. Sin ninguna clave (ADR 0085).';

revoke all on function private.facturacion_del_usuario(uuid) from public, anon, authenticated;
grant execute on function private.facturacion_del_usuario(uuid) to service_role;

create function public.facturacion_del_usuario(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.facturacion_del_usuario(p_user_id)
$$;

comment on function public.facturacion_del_usuario(uuid) is 'Solo para la función de borde de la facturación (service_role).';

revoke all on function public.facturacion_del_usuario(uuid) from public, anon, authenticated;
grant execute on function public.facturacion_del_usuario(uuid) to service_role;
