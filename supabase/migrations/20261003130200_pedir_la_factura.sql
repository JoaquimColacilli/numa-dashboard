-- La factura con ARCA (ADR 0085): pedir la factura de un pago, pedir la nota de crédito que anula una
-- factura y descartar la alerta de una factura que NUMA no hizo.
--
-- Aditiva. Funciones nuevas: las cuatro gemelas del dominio con las que la base congela cada comprobante
-- (la condición frente al IVA del receptor, el CUIT válido, el documento del receptor y lo que falta para
-- facturar), y las tres de la app con el molde de siempre: la de public invoker en language sql y la de
-- private security definer, porque la app no tiene grant para escribir comprobantes ni las alertas. Las
-- tres reconocen su reenvío. Ninguna fila existente cambia.


-- Las gemelas del dominio -----------------------------------------------------------------------------------

create function private.condicion_iva_del_receptor(p_condicion public.condicion_fiscal)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case p_condicion
    when 'consumidor_final' then 5
    when 'monotributo' then 6
    when 'responsable_inscripto' then 1
    when 'exento' then 4
  end::smallint
$$;

comment on function private.condicion_iva_del_receptor(public.condicion_fiscal) is
  'El CondicionIVAReceptorId de ARCA para la condición del cliente: 5 consumidor final, 6 monotributo, 1 responsable inscripto y 4 exento. Gemela de condicionIvaDelReceptor en facturacion.ts; scripts/comparacion.ts las compara (ADR 0085).';

revoke all on function private.condicion_iva_del_receptor(public.condicion_fiscal) from public, anon, authenticated;

create function private.cuit_valido(p_cuit text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_pesos constant integer[] := array[5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  v_digitos text := regexp_replace(coalesce(p_cuit, ''), '[^0-9]', '', 'g');
  v_suma integer := 0;
  v_verificador integer;
begin
  if char_length(v_digitos) <> 11 or left(v_digitos, 2) not in ('20', '23', '24', '27', '30', '33', '34') then
    return false;
  end if;

  for v_indice in 1..10 loop
    v_suma := v_suma + c_pesos[v_indice] * substr(v_digitos, v_indice, 1)::integer;
  end loop;

  v_verificador := 11 - v_suma % 11;
  if v_verificador = 11 then
    v_verificador := 0;
  end if;

  -- Con un resto de 10 no hay dígito verificador: revisarCuit lo da por ambiguo, y ambiguo no es válido.
  return v_verificador <> 10 and v_verificador = substr(v_digitos, 11, 1)::integer;
end;
$$;

comment on function private.cuit_valido(text) is
  'Si un CUIT es válido para facturar: once dígitos sin contar los guiones ni nada que no sea un dígito, uno de los prefijos de persona o de empresa y el dígito verificador. Gemela de cuitValido en facturacion.ts (revisarCuit da valido); scripts/comparacion.ts las compara (ADR 0085).';

revoke all on function private.cuit_valido(text) from public, anon, authenticated;

create function private.documento_del_receptor(
  p_condicion public.condicion_fiscal,
  p_cuit text,
  p_dni text,
  p_operacion_centavos bigint
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  -- UMBRAL_DE_IDENTIFICACION_CENTAVOS de @maun/domain: $ 10.000.000 (RG 5866).
  c_umbral constant bigint := 1000000000;
  v_digitos text := regexp_replace(coalesce(p_cuit, ''), '[^0-9]', '', 'g');
begin
  if private.cuit_valido(p_cuit) then
    return jsonb_build_object('docTipo', 80, 'docNro', v_digitos);
  end if;

  if v_digitos <> '' then
    return jsonb_build_object('falta', 'cuit-invalido');
  end if;

  if p_condicion is distinct from 'consumidor_final' then
    return jsonb_build_object('falta', 'cuit');
  end if;

  if coalesce(p_operacion_centavos, 0) < c_umbral then
    return jsonb_build_object('docTipo', 99, 'docNro', '0');
  end if;

  if coalesce(p_dni, '') ~ '^[0-9]{7,8}$' then
    return jsonb_build_object('docTipo', 96, 'docNro', p_dni);
  end if;

  return jsonb_build_object('falta', 'dni');
end;
$$;

comment on function private.documento_del_receptor(public.condicion_fiscal, text, text, bigint) is
  'El documento del cliente en la factura, {docTipo, docNro}, o lo que falta, {falta}: con un CUIT válido, 80 y sus dígitos, sea o no consumidor final; con un CUIT cargado que no es válido, cuit-invalido; sin CUIT, al que no es consumidor final le falta el cuit; al consumidor final, 99 y 0 si la operación (el trabajo, no el pago) no llega a $ 10.000.000, y si llega, 96 y su DNI, o le falta el dni. Gemela de documentoDelReceptor en facturacion.ts; scripts/comparacion.ts las compara (ADR 0085).';

revoke all on function private.documento_del_receptor(public.condicion_fiscal, text, text, bigint) from public, anon, authenticated;

create function private.lo_que_falta_para_facturar(p_datos jsonb)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_algo_escrito constant text := '[^ \t\n\r\f\v]';
  v_taller jsonb := coalesce(p_datos -> 'taller', '{}'::jsonb);
  v_trabajo jsonb := coalesce(p_datos -> 'trabajo', '{}'::jsonb);
  v_pago jsonb := coalesce(p_datos -> 'pago', '{}'::jsonb);
  v_cliente jsonb := coalesce(p_datos -> 'cliente', '{}'::jsonb);
  v_precio bigint := (v_trabajo ->> 'precio')::bigint;
  v_cobrado bigint := coalesce((v_trabajo ->> 'cobrado')::bigint, 0);
  v_documento jsonb;
  v_falta text[] := array[]::text[];
begin
  if (v_taller ->> 'condicion') is distinct from 'monotributo' then
    v_falta := v_falta || 'taller-no-monotributo'::text;
  end if;

  if coalesce(v_taller ->> 'razonSocial', '') !~ c_algo_escrito then
    v_falta := v_falta || 'taller-sin-razon-social'::text;
  end if;

  if coalesce(v_taller ->> 'domicilio', '') !~ c_algo_escrito then
    v_falta := v_falta || 'taller-sin-domicilio'::text;
  end if;

  if coalesce(v_taller ->> 'ingresosBrutos', '') !~ c_algo_escrito then
    v_falta := v_falta || 'taller-sin-ingresos-brutos'::text;
  end if;

  if (v_taller ->> 'inicioDeActividades') is null then
    v_falta := v_falta || 'taller-sin-inicio-de-actividades'::text;
  end if;

  if coalesce((v_pago ->> 'borrado')::boolean, false) or coalesce((v_trabajo ->> 'borrado')::boolean, false) then
    v_falta := v_falta || 'pago-borrado'::text;
  end if;

  if (v_pago ->> 'moneda') is distinct from 'ARS' or (v_trabajo ->> 'moneda') is distinct from 'ARS' then
    v_falta := v_falta || 'en-dolares'::text;
  end if;

  if coalesce((v_pago ->> 'yaEnLaApertura')::boolean, false) then
    v_falta := v_falta || 'de-la-apertura'::text;
  end if;

  -- La operación es el trabajo y no el pago: su precio o lo cobrado, lo que sea más (operacionDelTrabajo).
  v_documento := private.documento_del_receptor(
    (v_cliente ->> 'condicion')::public.condicion_fiscal,
    coalesce(v_cliente ->> 'cuit', ''),
    coalesce(v_cliente ->> 'dni', ''),
    case when v_precio is not null and v_precio > v_cobrado then v_precio else v_cobrado end
  );

  if v_documento ->> 'falta' = 'cuit' then
    v_falta := v_falta || 'cliente-sin-cuit'::text;
  end if;

  if v_documento ->> 'falta' = 'cuit-invalido' then
    v_falta := v_falta || 'cliente-cuit-invalido'::text;
  end if;

  if (v_cliente ->> 'condicion') is distinct from 'consumidor_final'
    and coalesce(v_cliente ->> 'domicilioFiscal', '') !~ c_algo_escrito
    and coalesce(v_cliente ->> 'direccion', '') !~ c_algo_escrito then
    v_falta := v_falta || 'cliente-sin-domicilio'::text;
  end if;

  if v_documento ->> 'falta' = 'dni' then
    v_falta := v_falta || 'cliente-sin-dni'::text;
  end if;

  return v_falta;
end;
$$;

comment on function private.lo_que_falta_para_facturar(jsonb) is
  'Lo que le falta a un pago, a su cliente o al taller para facturarlo, con los mismos códigos y en el mismo orden que loQueFaltaParaFacturar en facturacion.ts, que recibe el mismo objeto: {taller: {condicion, razonSocial, domicilio, ingresosBrutos, inicioDeActividades}, trabajo: {moneda, borrado, precio, cobrado}, pago: {moneda, borrado, yaEnLaApertura}, cliente: {condicion, cuit, dni, domicilioFiscal, direccion}}. Vacío si se puede facturar. La conexión (MN040) y la factura repetida (MN042) no son de esta lista. scripts/comparacion.ts las compara (ADR 0085).';

revoke all on function private.lo_que_falta_para_facturar(jsonb) from public, anon, authenticated;


-- Pedir la factura de un pago ----------------------------------------------------------------------------

create function private.pedir_la_factura(p_id uuid, p_pago_id uuid, p_detalle text)
returns public.comprobantes
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_algo_escrito constant text := '[^ \t\n\r\f\v]';
  c_puntas constant text := '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$';
  v_household uuid := private.household_actual();
  v_proyecto_id uuid;
  v_proyecto public.proyectos;
  v_pago public.pagos;
  v_ajustes public.ajustes;
  v_cliente public.clientes;
  v_comprobante public.comprobantes;
  v_cobrado bigint;
  v_falta text[];
  v_documento jsonb;
  v_detalle text;
  v_con_razon_social boolean;
begin
  if num_nulls(p_id, p_pago_id, p_detalle) > 0 then
    raise exception 'Pedir la factura necesita su id, el pago y el detalle' using errcode = '22004';
  end if;

  -- El trabajo del pago, leído sin candado para saber cuál tomar primero.
  select g.proyecto_id into v_proyecto_id
  from public.pagos g
  where g.household_id = v_household and g.id = p_pago_id;

  if not found then
    raise exception 'Le falta algo para facturar'
      using errcode = 'MN041',
            hint = 'pago-borrado';
  end if;

  -- Los candados, en este orden: el trabajo, el pago y los ajustes del taller. Un guardado del trabajo o
  -- un cambio del pago esperan a que la factura quede pedida, y la factura espera a que terminen.
  select p.* into v_proyecto
  from public.proyectos p
  where p.household_id = v_household and p.id = v_proyecto_id
  for share;

  select g.* into v_pago
  from public.pagos g
  where g.household_id = v_household and g.id = p_pago_id
  for no key update;

  if v_pago.proyecto_id <> v_proyecto.id then
    raise exception 'El pago cambió de trabajo mientras se pedía su factura'
      using errcode = '40001',
            hint = 'Probá de nuevo.';
  end if;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_household
  for share;

  -- El reenvío de la cola, mirado con los candados tomados: esta factura ya se pidió y la respuesta se
  -- perdió. Se devuelve tal cual, esté como esté.
  select c.* into v_comprobante
  from public.comprobantes c
  where c.id = p_id;

  if found then
    if v_comprobante.household_id <> v_household then
      raise exception 'Ese comprobante no es de tu taller' using errcode = '42501';
    end if;

    if v_comprobante.tipo = 'factura_c' and v_comprobante.pago_id = p_pago_id then
      return v_comprobante;
    end if;

    raise exception 'Ese id ya es de otro comprobante' using errcode = '22023';
  end if;

  if v_ajustes.facturacion_ambiente is null then
    raise exception 'La facturación con ARCA no está conectada'
      using errcode = 'MN040',
            hint = 'Conectala en Ajustes.';
  end if;

  select c.* into v_cliente
  from public.clientes c
  where c.household_id = v_household and c.id = v_proyecto.cliente_id;

  -- Lo cobrado del trabajo, en su moneda: lo que descuenta cada pago vivo (ADR 0081).
  select coalesce(
    sum(private.lo_que_descuenta(g.moneda, g.monto_centavos, g.cotizacion_centavos, v_proyecto.moneda)),
    0
  ) into v_cobrado
  from public.pagos g
  where g.household_id = v_household
    and g.proyecto_id = v_proyecto.id
    and g.deleted_at is null;

  v_falta := private.lo_que_falta_para_facturar(jsonb_build_object(
    'taller', jsonb_build_object(
      'condicion', v_ajustes.taller_condicion_fiscal,
      'razonSocial', v_ajustes.taller_titular,
      'domicilio', v_ajustes.taller_domicilio,
      'ingresosBrutos', v_ajustes.facturacion_ingresos_brutos,
      'inicioDeActividades', to_char(v_ajustes.facturacion_inicio_de_actividades, 'YYYY-MM-DD')
    ),
    'trabajo', jsonb_build_object(
      'moneda', v_proyecto.moneda,
      'borrado', v_proyecto.deleted_at is not null,
      'precio', v_proyecto.presupuesto_centavos,
      'cobrado', v_cobrado
    ),
    'pago', jsonb_build_object(
      'moneda', v_pago.moneda,
      'borrado', v_pago.deleted_at is not null,
      'yaEnLaApertura', v_pago.ya_en_la_apertura
    ),
    'cliente', jsonb_build_object(
      'condicion', v_cliente.condicion_fiscal,
      'cuit', v_cliente.cuit,
      'dni', v_cliente.dni,
      'domicilioFiscal', v_cliente.domicilio_fiscal,
      'direccion', v_cliente.direccion
    )
  ));

  -- La app no deja tocar «Emitir» si falta algo: este rechazo es para la carrera. Los códigos van en el
  -- hint, separados por coma, en el orden de la lista.
  if cardinality(v_falta) > 0 then
    raise exception 'Le falta algo para facturar'
      using errcode = 'MN041',
            hint = array_to_string(v_falta, ', ');
  end if;

  if exists (
    select 1
    from public.comprobantes c
    where c.household_id = v_household
      and c.pago_id = p_pago_id
      and c.tipo = 'factura_c'
      and c.deleted_at is null
      and c.estado in ('pedida', 'emitiendo', 'autorizada', 'a_revisar')
  ) then
    raise exception 'Ese pago ya tiene su factura'
      using errcode = 'MN042',
            detail = 'factura';
  end if;

  -- El detalle es lo único que factura que manda la app: sin blancos en las puntas y hasta 200, como
  -- detalleDeLaFactura.
  v_detalle := regexp_replace(left(regexp_replace(p_detalle, c_puntas, '', 'g'), 200), c_puntas, '', 'g');
  if v_detalle = '' then
    raise exception 'La factura necesita su detalle' using errcode = '22023';
  end if;

  v_documento := private.documento_del_receptor(
    v_cliente.condicion_fiscal,
    v_cliente.cuit,
    v_cliente.dni,
    case
      when v_proyecto.presupuesto_centavos > v_cobrado then v_proyecto.presupuesto_centavos
      else v_cobrado
    end
  );

  -- El nombre y el domicilio del receptor, como nombreDelReceptor y domicilioDelReceptor: del que no es
  -- consumidor final, la razón social y el domicilio fiscal, si los tiene.
  v_con_razon_social := v_cliente.condicion_fiscal <> 'consumidor_final';

  begin
    insert into public.comprobantes (
      id, household_id, proyecto_id, pago_id, tipo, ambiente, cuit_emisor, punto_de_venta, concepto,
      importe_centavos, moneda, doc_tipo, doc_nro, condicion_iva_receptor, receptor_condicion,
      receptor_nombre, receptor_domicilio, emisor, detalle
    ) values (
      p_id,
      v_household,
      v_proyecto.id,
      v_pago.id,
      'factura_c',
      v_ajustes.facturacion_ambiente,
      v_ajustes.facturacion_cuit,
      v_ajustes.facturacion_punto_de_venta,
      v_ajustes.facturacion_concepto,
      v_pago.monto_centavos,
      'ARS',
      (v_documento ->> 'docTipo')::smallint,
      v_documento ->> 'docNro',
      private.condicion_iva_del_receptor(v_cliente.condicion_fiscal),
      v_cliente.condicion_fiscal,
      regexp_replace(
        case
          when v_con_razon_social and v_cliente.razon_social ~ c_algo_escrito then v_cliente.razon_social
          else v_cliente.nombre
        end,
        c_puntas, '', 'g'
      ),
      regexp_replace(
        case
          when v_con_razon_social and v_cliente.domicilio_fiscal ~ c_algo_escrito then v_cliente.domicilio_fiscal
          else v_cliente.direccion
        end,
        c_puntas, '', 'g'
      ),
      jsonb_build_object(
        'razonSocial', regexp_replace(v_ajustes.taller_titular, c_puntas, '', 'g'),
        'nombreDelTaller', (select h.nombre from public.households h where h.id = v_household),
        'domicilio', regexp_replace(v_ajustes.taller_domicilio, c_puntas, '', 'g'),
        'cuit', v_ajustes.facturacion_cuit,
        'ingresosBrutos', regexp_replace(v_ajustes.facturacion_ingresos_brutos, c_puntas, '', 'g'),
        'inicioDeActividades', to_char(v_ajustes.facturacion_inicio_de_actividades, 'YYYY-MM-DD')
      ),
      v_detalle
    )
    returning * into v_comprobante;
  exception
    when unique_violation then
      -- Nunca un 23505 crudo: si es el mismo pedido, la fila; si no, ese pago ya tiene su factura.
      select c.* into v_comprobante
      from public.comprobantes c
      where c.id = p_id;

      if found
        and v_comprobante.household_id = v_household
        and v_comprobante.tipo = 'factura_c'
        and v_comprobante.pago_id = p_pago_id then
        return v_comprobante;
      end if;

      raise exception 'Ese pago ya tiene su factura'
        using errcode = 'MN042',
              detail = 'factura';
  end;

  return v_comprobante;
end;
$$;

comment on function private.pedir_la_factura(uuid, uuid, text) is
  'Pide la Factura C de un pago: la deja en pedida, con todo lo que factura congelado desde la base (el importe del pago, el receptor según el cliente y la operación del trabajo, el concepto, el ambiente, el CUIT y el punto de venta del taller, y el emisor), salvo el detalle, que manda la app. Toma el trabajo for share, el pago for no key update y los ajustes for share, en ese orden. Reconoce el reenvío por el id (42501 si es de otro taller, 22023 si es de otro pago o de una nota). Rechaza con MN040 sin la conexión, con MN041 si falta algo (los códigos de private.lo_que_falta_para_facturar en el hint, separados por coma) y con MN042 si el pago ya tiene una factura viva. Del resto se ocupa la función de borde (ADR 0085).';

revoke all on function private.pedir_la_factura(uuid, uuid, text) from public, anon, authenticated;
grant execute on function private.pedir_la_factura(uuid, uuid, text) to authenticated;

create function public.pedir_la_factura(p_id uuid, p_pago_id uuid, p_detalle text)
returns public.comprobantes
language sql
set search_path = ''
as $$
  select * from private.pedir_la_factura(p_id, p_pago_id, p_detalle)
$$;

comment on function public.pedir_la_factura(uuid, uuid, text) is
  'RPC de «Facturar este pago»: pide la Factura C del pago y devuelve el comprobante para la réplica. Ver private.pedir_la_factura().';

revoke all on function public.pedir_la_factura(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.pedir_la_factura(uuid, uuid, text) to authenticated;


-- Pedir la nota de crédito que anula una factura -------------------------------------------------------------

create function private.pedir_la_nota_de_credito(p_id uuid, p_factura_id uuid)
returns public.comprobantes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid := private.household_actual();
  v_proyecto_id uuid;
  v_factura public.comprobantes;
  v_nota public.comprobantes;
begin
  if num_nulls(p_id, p_factura_id) > 0 then
    raise exception 'Pedir la nota de crédito necesita su id y la factura' using errcode = '22004';
  end if;

  select c.proyecto_id into v_proyecto_id
  from public.comprobantes c
  where c.household_id = v_household and c.id = p_factura_id;

  if not found then
    raise exception 'La factura no existe o no es tuya' using errcode = '42501';
  end if;

  -- Los candados en el orden de pedir la factura: el trabajo y después el comprobante.
  perform 1
  from public.proyectos p
  where p.household_id = v_household and p.id = v_proyecto_id
  for share;

  select c.* into v_factura
  from public.comprobantes c
  where c.household_id = v_household and c.id = p_factura_id
  for update;

  -- El reenvío de la cola, como en pedir_la_factura.
  select c.* into v_nota
  from public.comprobantes c
  where c.id = p_id;

  if found then
    if v_nota.household_id <> v_household then
      raise exception 'Ese comprobante no es de tu taller' using errcode = '42501';
    end if;

    if v_nota.tipo = 'nota_de_credito_c' and v_nota.asociado_id = p_factura_id then
      return v_nota;
    end if;

    raise exception 'Ese id ya es de otro comprobante' using errcode = '22023';
  end if;

  if v_factura.tipo <> 'factura_c'
    or v_factura.estado <> 'autorizada'
    or v_factura.deleted_at is not null
    or exists (
      select 1
      from public.comprobantes c
      where c.household_id = v_household
        and c.asociado_id = v_factura.id
        and c.tipo = 'nota_de_credito_c'
        and c.deleted_at is null
        and c.estado in ('pedida', 'emitiendo', 'autorizada', 'a_revisar')
    ) then
    raise exception 'Esa factura ya está anulada o todavía no está autorizada'
      using errcode = 'MN042',
            detail = 'nota';
  end if;

  begin
    insert into public.comprobantes (
      id, household_id, proyecto_id, pago_id, asociado_id, tipo, ambiente, cuit_emisor, punto_de_venta,
      concepto, importe_centavos, moneda, doc_tipo, doc_nro, condicion_iva_receptor, receptor_condicion,
      receptor_nombre, receptor_domicilio, emisor, detalle
    ) values (
      p_id,
      v_household,
      v_factura.proyecto_id,
      v_factura.pago_id,
      v_factura.id,
      'nota_de_credito_c',
      v_factura.ambiente,
      v_factura.cuit_emisor,
      v_factura.punto_de_venta,
      v_factura.concepto,
      v_factura.importe_centavos,
      v_factura.moneda,
      v_factura.doc_tipo,
      v_factura.doc_nro,
      v_factura.condicion_iva_receptor,
      v_factura.receptor_condicion,
      v_factura.receptor_nombre,
      v_factura.receptor_domicilio,
      v_factura.emisor,
      format(
        'Anula la factura C %s-%s',
        lpad(v_factura.punto_de_venta::text, 5, '0'),
        lpad(v_factura.numero::text, 8, '0')
      )
    )
    returning * into v_nota;
  exception
    when unique_violation then
      select c.* into v_nota
      from public.comprobantes c
      where c.id = p_id;

      if found
        and v_nota.household_id = v_household
        and v_nota.tipo = 'nota_de_credito_c'
        and v_nota.asociado_id = p_factura_id then
        return v_nota;
      end if;

      raise exception 'Esa factura ya está anulada o todavía no está autorizada'
        using errcode = 'MN042',
              detail = 'nota';
  end;

  return v_nota;
end;
$$;

comment on function private.pedir_la_nota_de_credito(uuid, uuid) is
  'Pide la Nota de Crédito C que anula entera una factura autorizada: la deja en pedida con el mismo pago, ambiente, CUIT, punto de venta, concepto, importe, receptor y emisor que la factura, y el detalle «Anula la factura C 00003-00000042». Toma el trabajo for share y la factura for update. Reconoce el reenvío por el id como pedir_la_factura y rechaza con MN042 si la factura no está autorizada o ya tiene una nota viva. No pide que la facturación siga conectada: una factura se anula aunque el taller ya no facture con NUMA. Cuando la nota queda autorizada, la factura queda anulada (ADR 0085).';

revoke all on function private.pedir_la_nota_de_credito(uuid, uuid) from public, anon, authenticated;
grant execute on function private.pedir_la_nota_de_credito(uuid, uuid) to authenticated;

create function public.pedir_la_nota_de_credito(p_id uuid, p_factura_id uuid)
returns public.comprobantes
language sql
set search_path = ''
as $$
  select * from private.pedir_la_nota_de_credito(p_id, p_factura_id)
$$;

comment on function public.pedir_la_nota_de_credito(uuid, uuid) is
  'RPC de «Anular la factura»: pide la nota de crédito que la anula y devuelve el comprobante para la réplica. Ver private.pedir_la_nota_de_credito().';

revoke all on function public.pedir_la_nota_de_credito(uuid, uuid) from public, anon, authenticated;
grant execute on function public.pedir_la_nota_de_credito(uuid, uuid) to authenticated;


-- Descartar la alerta de una factura que NUMA no hizo ----------------------------------------------------------

create function private.descartar_la_alerta_de_facturacion(p_codigo text, p_numero bigint)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid := private.household_actual();
  v_ajustes public.ajustes;
  v_alertas jsonb;
begin
  if num_nulls(p_codigo, p_numero) > 0 then
    raise exception 'Descartar la alerta necesita su código y el número de ARCA' using errcode = '22004';
  end if;

  -- Las demás alertas no se descartan: se van solas cuando se resuelven.
  if p_codigo <> 'fuera-de-numa' then
    raise exception 'Esa alerta se va sola cuando se resuelve' using errcode = '22023';
  end if;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_household
  for no key update;

  -- Solo la del número que vio el dueño: si mientras tanto llegó otra, esa sigue.
  select coalesce(
    jsonb_agg(
      case
        when t.alerta ->> 'codigo' = 'fuera-de-numa' and t.alerta -> 'numeroArca' = to_jsonb(p_numero)
          then t.alerta || '{"descartada": true}'::jsonb
        else t.alerta
      end
      order by t.orden
    ),
    '[]'::jsonb
  ) into v_alertas
  from jsonb_array_elements(v_ajustes.facturacion_alertas) with ordinality as t (alerta, orden);

  -- El reenvío no cambia nada: la fila queda como estaba, sin otra versión.
  if v_alertas is distinct from v_ajustes.facturacion_alertas then
    update public.ajustes a
    set facturacion_alertas = v_alertas
    where a.household_id = v_household
    returning a.* into v_ajustes;
  end if;

  return v_ajustes;
end;
$$;

comment on function private.descartar_la_alerta_de_facturacion(text, bigint) is
  'Marca descartada ({"descartada": true}) la alerta fuera-de-numa del taller cuyo número de ARCA (numeroArca) es el que vio el dueño: si mientras tanto llegó otra con otro número, esa no se descarta. Las otras alertas no se descartan (22023): se van solas cuando se resuelven. Toma los ajustes for no key update. Las alertas son objetos con su codigo: fuera-de-numa {tipo, puntoDeVenta, numeroArca, numeroNuma, descartada}, a-revisar {comprobanteId, proyectoId, tipo, puntoDeVenta, numero, cliente}, certificado-por-vencer {vence} y sin-acceso {desde} (ADR 0085).';

revoke all on function private.descartar_la_alerta_de_facturacion(text, bigint) from public, anon, authenticated;
grant execute on function private.descartar_la_alerta_de_facturacion(text, bigint) to authenticated;

create function public.descartar_la_alerta_de_facturacion(p_codigo text, p_numero bigint)
returns public.ajustes
language sql
set search_path = ''
as $$
  select * from private.descartar_la_alerta_de_facturacion(p_codigo, p_numero)
$$;

comment on function public.descartar_la_alerta_de_facturacion(text, bigint) is
  'RPC de «Ya lo revisé» en Inicio: descarta la alerta de una factura que NUMA no hizo, con el número de ARCA que vio el dueño, y devuelve la fila de ajustes. Ver private.descartar_la_alerta_de_facturacion().';

revoke all on function public.descartar_la_alerta_de_facturacion(text, bigint) from public, anon, authenticated;
grant execute on function public.descartar_la_alerta_de_facturacion(text, bigint) to authenticated;
