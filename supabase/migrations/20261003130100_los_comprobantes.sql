-- La factura con ARCA (ADR 0085): los comprobantes, una fila por factura o nota de crédito, pedida, en
-- curso o resuelta.
--
-- Aditiva. Una tabla nueva de la réplica, solo de lectura para la app y sin escrituras directas ni para
-- service_role: la escriben las funciones security definer de las migraciones siguientes. Lo que dice cada
-- comprobante queda congelado desde que se pide, y uno de producción no se borra nunca (los dos triggers de
-- abajo, que corren también para service_role y para el dueño de la base). La baja de un trabajo se lleva
-- sus comprobantes de prueba; los de producción traban la baja (migración 20261003130300). La réplica los
-- trae (bootstrap y delta, con create or replace y la misma firma). Suma pagos_household_id_key, la clave
-- única (household_id, id) de pagos para la foreign key compuesta: no puede fallar, porque id ya es la
-- clave primaria. Ninguna fila existente cambia.


-- La clave de pagos para la foreign key compuesta --------------------------------------------------------

alter table public.pagos add constraint pagos_household_id_key unique (household_id, id);


-- La forma del emisor --------------------------------------------------------------------------------------

create function private.emisor_bien_formado(p_emisor jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_emisor) = 'object'
    and (select array_agg(k order by k collate "C") from jsonb_object_keys(p_emisor) as k)
      = array['cuit', 'domicilio', 'ingresosBrutos', 'inicioDeActividades', 'nombreDelTaller', 'razonSocial']
    and (select bool_and(jsonb_typeof(v) = 'string') from jsonb_each(p_emisor) as e (k, v)),
    false
  )
$$;

comment on function private.emisor_bien_formado(jsonb) is
  'Si el emisor congelado de un comprobante tiene su forma: un objeto con razonSocial, nombreDelTaller, domicilio, cuit, ingresosBrutos e inicioDeActividades, todos texto, y nada más. Lo usa el check comprobantes_emisor_bien_formado (ADR 0085).';

revoke all on function private.emisor_bien_formado(jsonb) from public, anon, authenticated;


-- Los comprobantes -------------------------------------------------------------------------------------------

create table public.comprobantes (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  proyecto_id uuid not null,
  pago_id uuid not null,
  asociado_id uuid,
  tipo text not null,
  ambiente text not null,
  estado text not null default 'pedida',
  cuit_emisor text not null,
  punto_de_venta integer not null,
  concepto smallint not null,
  numero bigint,
  fecha date,
  importe_centavos bigint not null,
  moneda text not null default 'ARS',
  doc_tipo smallint not null,
  doc_nro text not null,
  condicion_iva_receptor smallint not null,
  receptor_condicion public.condicion_fiscal not null,
  receptor_nombre text not null,
  receptor_domicilio text not null default '',
  emisor jsonb not null,
  detalle text not null,
  cae text,
  cae_vence date,
  rechazo jsonb,
  intentos integer not null default 0,
  emitiendo_hasta timestamptz,
  ultimo_error text,
  pedida_at timestamptz not null default now(),
  autorizada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint comprobantes_household_id_key unique (household_id, id),
  constraint comprobantes_proyecto_fk foreign key (household_id, proyecto_id)
    references public.proyectos (household_id, id),
  constraint comprobantes_pago_fk foreign key (household_id, pago_id)
    references public.pagos (household_id, id),
  constraint comprobantes_asociado_fk foreign key (household_id, asociado_id)
    references public.comprobantes (household_id, id),
  constraint comprobantes_tipo_valido check (tipo in ('factura_c', 'nota_de_credito_c')),
  constraint comprobantes_ambiente_valido check (ambiente in ('homologacion', 'produccion')),
  constraint comprobantes_estado_valido check (
    estado in ('pedida', 'emitiendo', 'autorizada', 'anulada', 'rechazada', 'a_revisar')
  ),
  constraint comprobantes_moneda_pesos check (moneda = 'ARS'),
  constraint comprobantes_cuit_emisor_formato check (cuit_emisor ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'),
  constraint comprobantes_punto_de_venta_valido check (punto_de_venta between 1 and 99998),
  constraint comprobantes_concepto_valido check (concepto in (1, 2, 3)),
  constraint comprobantes_numero_valido check (numero is null or numero between 1 and 99999999),
  constraint comprobantes_importe_positivo check (importe_centavos > 0),
  constraint comprobantes_doc_tipo_valido check (doc_tipo in (80, 96, 99)),
  constraint comprobantes_condicion_iva_valida check (condicion_iva_receptor in (1, 4, 5, 6)),
  constraint comprobantes_receptor_nombre_valido check (
    receptor_nombre ~ '[^ \t\n\r\f\v]' and char_length(receptor_nombre) <= 200
  ),
  constraint comprobantes_receptor_domicilio_largo check (char_length(receptor_domicilio) <= 500),
  constraint comprobantes_emisor_bien_formado check (private.emisor_bien_formado(emisor)),
  constraint comprobantes_detalle_valido check (
    detalle ~ '[^ \t\n\r\f\v]' and char_length(detalle) <= 200
  ),
  constraint comprobantes_cae_formato check (cae is null or cae ~ '^[0-9]{14}$'),
  constraint comprobantes_rechazo_es_un_objeto check (rechazo is null or jsonb_typeof(rechazo) = 'object'),
  constraint comprobantes_intentos_validos check (intentos >= 0),
  constraint comprobantes_ultimo_error_largo check (ultimo_error is null or char_length(ultimo_error) <= 500),
  -- La nota de crédito, y solo ella, lleva su factura.
  constraint comprobantes_nota_con_su_factura check ((tipo = 'nota_de_credito_c') = (asociado_id is not null)),
  -- Se anula una factura, nunca una nota.
  constraint comprobantes_anulada_es_factura check (estado <> 'anulada' or tipo = 'factura_c'),
  constraint comprobantes_autorizada_completa check (
    estado not in ('autorizada', 'anulada')
    or (numero is not null and fecha is not null and cae is not null and cae_vence is not null)
  ),
  -- El número y la fecha los reserva el servidor al emitir: hay en emitiendo y a revisar, y no hay en pedida
  -- ni en rechazada, que vuelven sin número.
  constraint comprobantes_con_numero check (
    case
      when estado in ('emitiendo', 'a_revisar') then numero is not null and fecha is not null
      when estado in ('pedida', 'rechazada') then numero is null and fecha is null
      else true
    end
  ),
  constraint comprobantes_documento_coherente check (
    (doc_tipo = 99 and doc_nro = '0')
    or (doc_tipo = 80 and doc_nro ~ '^[0-9]{11}$')
    or (doc_tipo = 96 and doc_nro ~ '^[0-9]{7,8}$')
  ),
  constraint comprobantes_produccion_no_se_borra check (ambiente = 'homologacion' or deleted_at is null)
);

comment on table public.comprobantes is
  'Las facturas C y las notas de crédito C que el taller le pide a ARCA, una fila por comprobante, desde que se pide hasta que queda resuelto. La app solo lee: las escriben public.pedir_la_factura() y public.pedir_la_nota_de_credito(), que congelan lo que dice el comprobante desde la base, y la función de borde facturar por las funciones de service_role, que reservan el número, guardan el CAE o el rechazo y llevan la toma. Lo que dice un comprobante no cambia desde que se pide, ni desde el servidor ni como dueño de la base (private.cuidar_los_comprobantes), y uno de producción no se borra nunca (private.no_se_borran_los_comprobantes): ARCA conserva lo autorizado y NUMA también. Los de homologación son de prueba, no tienen efecto fiscal y se van con su trabajo (ADR 0085).';
comment on column public.comprobantes.id is
  'El UUIDv7 que genera la app al tocar: es la clave de idempotencia del pedido, así un reenvío de la cola devuelve el mismo comprobante y no pide otro.';
comment on column public.comprobantes.household_id is 'El taller. Las funciones que escriben la tabla lo ponen explícito.';
comment on column public.comprobantes.pago_id is 'El pago que factura. La nota de crédito lleva el de su factura.';
comment on column public.comprobantes.asociado_id is 'Solo en la nota de crédito: la factura que anula.';
comment on column public.comprobantes.tipo is 'factura_c (código 11 de ARCA) o nota_de_credito_c (código 13).';
comment on column public.comprobantes.ambiente is
  'homologacion (prueba, sin efecto fiscal) o produccion, copiado del taller al pedir y congelado: la función de borde trabaja cada fila con su ambiente, no con el que tenga el taller después (traba 3 del ADR 0085).';
comment on column public.comprobantes.estado is
  'pedida, emitiendo (el servidor reservó el número y le está pidiendo el CAE a ARCA), autorizada, anulada (una factura con su nota de crédito autorizada), rechazada (ARCA no la autorizó) o a_revisar (NUMA no sabe si quedó autorizada). Solo sigue las flechas de private.cuidar_los_comprobantes().';
comment on column public.comprobantes.cuit_emisor is
  'El CUIT con el que se factura, congelado al pedir: el del taller en producción y el inventado 20-11111111-2 en homologación, donde ARCA recibe el del certificado de prueba.';
comment on column public.comprobantes.numero is 'El número en el punto de venta, de 1 a 99999999. Lo reserva el servidor al emitir, con el último autorizado de ARCA más uno.';
comment on column public.comprobantes.fecha is 'La fecha del comprobante: el día, en la Argentina, en que el servidor le pide el CAE, o la que contesta ARCA al autorizarlo.';
comment on column public.comprobantes.importe_centavos is 'El importe del pago, congelado al pedir. En pesos: no se factura en dólares.';
comment on column public.comprobantes.doc_tipo is 'El documento del receptor según ARCA: 80 CUIT, 96 DNI o 99 sin identificar, con private.documento_del_receptor().';
comment on column public.comprobantes.doc_nro is 'El número del documento: 0 con 99, once dígitos con 80, siete u ocho con 96.';
comment on column public.comprobantes.condicion_iva_receptor is 'CondicionIVAReceptorId de ARCA: 5 consumidor final, 6 monotributo, 1 responsable inscripto o 4 exento.';
comment on column public.comprobantes.receptor_condicion is 'La condición del cliente frente al IVA al pedir, para el PDF.';
comment on column public.comprobantes.receptor_nombre is 'El nombre o la razón social del cliente como sale en la factura, congelado al pedir.';
comment on column public.comprobantes.receptor_domicilio is 'El domicilio del cliente como sale en la factura, o vacío.';
comment on column public.comprobantes.emisor is
  'Los datos del taller como salen en la factura, congelados al pedir: razonSocial, nombreDelTaller, domicilio, cuit, ingresosBrutos e inicioDeActividades, todos texto. Salen de la base, no de lo que mandó la app.';
comment on column public.comprobantes.detalle is 'La línea del detalle, de 1 a 200 caracteres: lo único del comprobante que escribe el dueño.';
comment on column public.comprobantes.cae is 'El Código de Autorización Electrónico de ARCA, catorce dígitos, desde que queda autorizado.';
comment on column public.comprobantes.cae_vence is 'El vencimiento del CAE.';
comment on column public.comprobantes.rechazo is
  'Lo que contestó ARCA al rechazarlo ({ errores: [{ codigo, mensaje }], observaciones }), o el motivo por el que quedó a revisar ({ motivo }).';
comment on column public.comprobantes.intentos is 'Cuántas veces lo tomó el servidor.';
comment on column public.comprobantes.emitiendo_hasta is
  'La toma del servidor: hasta cuándo una vuelta de la función tiene el comprobante en la mano. No es una transacción, porque la función habla con ARCA entre llamadas a la base.';
comment on column public.comprobantes.ultimo_error is 'El último error pasajero (la red, ARCA caída), hasta 500 caracteres, para db:facturacion --listar. Nunca lleva un CUIT ni un ticket.';
comment on column public.comprobantes.pedida_at is 'Cuándo se pidió. Ordena la cola del servidor.';
comment on column public.comprobantes.autorizada_at is 'Cuándo lo autorizó ARCA.';
comment on column public.comprobantes.deleted_at is 'Solo en homologación, con su trabajo. Uno de producción no se borra nunca.';

create index comprobantes_household_actualizado on public.comprobantes (household_id, updated_at);
create index comprobantes_household_proyecto on public.comprobantes (household_id, proyecto_id);
create index comprobantes_household_pago on public.comprobantes (household_id, pago_id);
create index comprobantes_household_asociado on public.comprobantes (household_id, asociado_id);

-- Una factura viva por pago y una nota viva por factura: una rechazada o una anulada no cuentan, así el
-- pago se vuelve a facturar.
create unique index comprobantes_una_factura_por_pago
  on public.comprobantes (household_id, pago_id)
  where tipo = 'factura_c' and deleted_at is null and estado in ('pedida', 'emitiendo', 'autorizada', 'a_revisar');

create unique index comprobantes_una_nota_por_factura
  on public.comprobantes (asociado_id)
  where tipo = 'nota_de_credito_c' and deleted_at is null and estado in ('pedida', 'emitiendo', 'autorizada', 'a_revisar');

-- En producción un número es uno solo. En homologación no: ARCA puede reiniciar sus datos de prueba y
-- volver a numerar desde 1.
create unique index comprobantes_numero_unico
  on public.comprobantes (cuit_emisor, punto_de_venta, tipo, numero)
  where ambiente = 'produccion' and numero is not null;

-- Lo pendiente, para la cola del servidor.
create index comprobantes_pendientes
  on public.comprobantes (pedida_at)
  where estado in ('pedida', 'emitiendo') and deleted_at is null;

alter table public.comprobantes enable row level security;

revoke all on table public.comprobantes from anon, authenticated;
-- Ni la clave del servidor escribe directo: una factura de producción no se tiene que poder borrar ni
-- editar con ella. La función de borde escribe solo por sus funciones security definer, que corren como
-- dueño (ADR 0085, que hace la excepción al ADR 0008).
revoke insert, update, delete, truncate on table public.comprobantes from service_role;

grant select on table public.comprobantes to authenticated;

create policy comprobantes_lectura on public.comprobantes
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));


-- Lo congelado no cambia --------------------------------------------------------------------------------------

create function private.cuidar_los_comprobantes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_reserva boolean;
  v_autoriza boolean;
  v_suelta boolean;
begin
  if (
    new.household_id, new.proyecto_id, new.pago_id, new.asociado_id, new.tipo, new.ambiente, new.cuit_emisor,
    new.punto_de_venta, new.concepto, new.importe_centavos, new.moneda, new.doc_tipo, new.doc_nro,
    new.condicion_iva_receptor, new.receptor_condicion, new.receptor_nombre, new.receptor_domicilio,
    new.emisor, new.detalle, new.pedida_at
  ) is distinct from (
    old.household_id, old.proyecto_id, old.pago_id, old.asociado_id, old.tipo, old.ambiente, old.cuit_emisor,
    old.punto_de_venta, old.concepto, old.importe_centavos, old.moneda, old.doc_tipo, old.doc_nro,
    old.condicion_iva_receptor, old.receptor_condicion, old.receptor_nombre, old.receptor_domicilio,
    old.emisor, old.detalle, old.pedida_at
  ) then
    raise exception 'Lo que dice un comprobante no cambia'
      using errcode = 'MN043',
            detail = 'congelado',
            hint = 'Si está mal, anulá la factura con una nota de crédito y pedí otra.';
  end if;

  -- Las flechas de los estados (ADR 0085, «Los estados y la toma»).
  if new.estado <> old.estado and not (
    (old.estado = 'pedida' and new.estado = 'emitiendo')
    or (old.estado = 'emitiendo' and new.estado in ('autorizada', 'rechazada', 'pedida', 'a_revisar'))
    or (old.estado = 'a_revisar' and new.estado in ('autorizada', 'pedida', 'rechazada'))
    or (old.estado = 'autorizada' and new.estado = 'anulada')
  ) then
    raise exception 'Un comprobante no pasa de % a %', old.estado, new.estado
      using errcode = 'MN043',
            detail = format('estado %s → %s', old.estado, new.estado);
  end if;

  -- El número y la fecha se reservan al pasar a emitiendo (o al volver a reservar), vuelven a null al
  -- volver a pedida o al rechazarse, y la fecha toma la que dice ARCA al autorizarse. El CAE, su
  -- vencimiento y cuándo se autorizó se escriben una sola vez, al autorizarse. Después, nada de eso cambia.
  v_reserva := new.estado = 'emitiendo' and old.estado in ('pedida', 'emitiendo');
  v_autoriza := new.estado = 'autorizada' and old.estado in ('emitiendo', 'a_revisar');
  v_suelta := new.estado in ('pedida', 'rechazada') and old.estado <> new.estado;

  if not (v_reserva or v_suelta) and new.numero is distinct from old.numero then
    raise exception 'El número de un comprobante no cambia'
      using errcode = 'MN043', detail = 'numero';
  end if;

  if not (v_reserva or v_suelta or v_autoriza) and new.fecha is distinct from old.fecha then
    raise exception 'La fecha de un comprobante no cambia'
      using errcode = 'MN043', detail = 'fecha';
  end if;

  if not v_autoriza
    and (new.cae, new.cae_vence, new.autorizada_at) is distinct from (old.cae, old.cae_vence, old.autorizada_at)
  then
    raise exception 'El CAE de un comprobante se escribe una sola vez, al autorizarse'
      using errcode = 'MN043', detail = 'cae';
  end if;

  if new.deleted_at is distinct from old.deleted_at and old.ambiente = 'produccion' then
    raise exception 'Un comprobante de producción no se borra'
      using errcode = 'MN043', detail = 'produccion';
  end if;

  return new;
end;
$$;

comment on function private.cuidar_los_comprobantes() is
  'Trigger BEFORE UPDATE de comprobantes. Corre para todos, también para service_role y para el dueño de la base: lo que dice el comprobante (el taller, el trabajo, el pago, la factura que anula, el tipo, el ambiente, el CUIT, el punto de venta, el concepto, el importe, la moneda, el receptor, el emisor, el detalle y cuándo se pidió) no cambia nunca; el estado sigue solo sus flechas; el número y la fecha cambian solo al reservarse o al soltarse, y la fecha al autorizarse; el CAE se escribe una vez; y uno de producción no se borra. Cualquier otra cosa es MN043 (ADR 0085).';

revoke all on function private.cuidar_los_comprobantes() from public, anon, authenticated;

create function private.no_se_borran_los_comprobantes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'TRUNCATE' then
    raise exception 'Los comprobantes no se truncan'
      using errcode = 'MN043', detail = 'truncate';
  end if;

  if old.ambiente = 'produccion' then
    raise exception 'Un comprobante de producción no se borra'
      using errcode = 'MN043', detail = 'produccion';
  end if;

  return old;
end;
$$;

comment on function private.no_se_borran_los_comprobantes() is
  'Trigger BEFORE DELETE (por fila) y BEFORE TRUNCATE de comprobantes: uno de producción no se borra ni físicamente, ni como dueño de la base, y la tabla no se trunca nunca (MN043). Los de homologación se pueden borrar a mano; la app los da de baja con su trabajo (ADR 0085).';

revoke all on function private.no_se_borran_los_comprobantes() from public, anon, authenticated;

create trigger cuidar_los_comprobantes
  before update on public.comprobantes
  for each row execute function private.cuidar_los_comprobantes();

create trigger metadatos
  before insert or update on public.comprobantes
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.comprobantes
  for each row execute function private.avisar_los_cambios('household_id');

create trigger no_se_borran_los_comprobantes
  before delete on public.comprobantes
  for each row execute function private.no_se_borran_los_comprobantes();

create trigger no_se_truncan_los_comprobantes
  before truncate on public.comprobantes
  for each statement execute function private.no_se_borran_los_comprobantes();


-- Lo de prueba se va con su trabajo ------------------------------------------------------------------------

create function private.borrar_los_comprobantes_de_prueba(
  p_household_id uuid,
  p_proyecto_id uuid,
  p_momento timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para escribir un comprobante, y esta puerta
  -- no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  update public.comprobantes c
  set deleted_at = p_momento
  where c.household_id = p_household_id
    and c.proyecto_id = p_proyecto_id
    and c.ambiente = 'homologacion'
    and c.deleted_at is null;
end;
$$;

comment on function private.borrar_los_comprobantes_de_prueba(uuid, uuid, timestamptz) is
  'Da de baja, con la marca del trabajo, los comprobantes de homologación de un trabajo que ya se borró. Los de producción no se tocan: no se borran nunca, y la baja de un trabajo que los tiene la frena private.validar_proyecto() (MN043). Es security definer porque el dueño no tiene grant para escribir comprobantes: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo (ADR 0085).';

revoke all on function private.borrar_los_comprobantes_de_prueba(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function private.borrar_los_comprobantes_de_prueba(uuid, uuid, timestamptz) to authenticated;

create or replace function private.borrar_hijos_de_proyecto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.pagos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.gastos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.archivos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.opciones_de_presupuesto
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.necesidades
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.enlaces_publicos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.proximos_contactos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  -- Las propuestas de entrega después del enlace, en el orden en que las bloquea el cliente que
  -- contesta: el trabajo, el enlace, la propuesta.
  update public.propuestas_de_entrega
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  perform private.borrar_la_entrega_del_trabajo(new.household_id, new.id, new.deleted_at);

  -- El borrador del presupuesto y lo que se mandó, que el dueño tampoco puede borrar a mano.
  perform private.borrar_el_presupuesto_del_trabajo(new.household_id, new.id, new.deleted_at);

  -- La encuesta que se le mandó, lo que contestó y sus preguntas propias. El enlace deja de
  -- funcionar con el trabajo.
  perform private.borrar_las_opiniones_del_trabajo(new.household_id, new.id, new.deleted_at);

  -- Los comprobantes de prueba (ADR 0085). Los de producción no se borran nunca, y un trabajo que los
  -- tiene no llega acá: lo frena private.validar_proyecto().
  perform private.borrar_los_comprobantes_de_prueba(new.household_id, new.id, new.deleted_at);

  return null;
end;
$$;


-- La réplica --------------------------------------------------------------------------------------------------

create or replace function public.bootstrap()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.deleted_at is null
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.deleted_at is null
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.deleted_at is null
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.deleted_at is null
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.deleted_at is null
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.deleted_at is null
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.deleted_at is null
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.deleted_at is null
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.deleted_at is null
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.deleted_at is null
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.deleted_at is null
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.deleted_at is null
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.deleted_at is null
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.deleted_at is null
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.deleted_at is null
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.deleted_at is null
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.deleted_at is null
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.deleted_at is null
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.deleted_at is null
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.deleted_at is null
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.deleted_at is null
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.deleted_at is null
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.deleted_at is null
    ),
    'cambios_de_estado', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_estado t
      where t.deleted_at is null
        and exists (
          select 1 from public.proyectos p
          where p.household_id = t.household_id and p.id = t.proyecto_id and p.deleted_at is null
        )
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.deleted_at is null
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.deleted_at is null
    ),
    'comprobantes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.comprobantes t where t.deleted_at is null
    )
  )
$$;

create or replace function public.delta(p_desde timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_desde timestamptz;
begin
  if p_desde is null then
    raise exception 'delta() necesita un cursor: sin cursor corresponde bootstrap()'
      using errcode = '22004';
  end if;

  v_desde := p_desde - interval '5 minutes';

  return jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.updated_at >= v_desde
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.updated_at >= v_desde
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.updated_at >= v_desde
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.updated_at >= v_desde
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.updated_at >= v_desde
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.updated_at >= v_desde
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.updated_at >= v_desde
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.updated_at >= v_desde
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.updated_at >= v_desde
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.updated_at >= v_desde
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.updated_at >= v_desde
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.updated_at >= v_desde
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.updated_at >= v_desde
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.updated_at >= v_desde
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.updated_at >= v_desde
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.updated_at >= v_desde
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.updated_at >= v_desde
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.updated_at >= v_desde
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.updated_at >= v_desde
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.updated_at >= v_desde
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.updated_at >= v_desde
    ),
    'cambios_de_estado', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_estado t where t.updated_at >= v_desde
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.updated_at >= v_desde
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.updated_at >= v_desde
    ),
    'comprobantes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.comprobantes t where t.updated_at >= v_desde
    )
  );
end;
$$;
