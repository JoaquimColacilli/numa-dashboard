-- La factura con ARCA (ADR 0085): la página del cliente suma sus facturas.
--
-- Aditiva. public.vista_del_cliente() con create or replace y la misma firma, copiada entera desde su
-- cuerpo vigente (como 20261001121600_la_vista_en_dolares.sql), suma la clave facturas al final y reescribe
-- su comment on function. Ninguna otra clave cambia, y ninguna fila tampoco. Una app sin actualizar no lee
-- la clave nueva.

create or replace function public.vista_del_cliente(p_proyecto_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_p public.proyectos;
  v_etapa public.estado_proyecto;
  v_aprobado boolean;
  v_propuesta public.propuestas_de_entrega;
  v_respuesta public.respuestas_de_entrega;
  v_presupuesto_mandado boolean;
  v_taller text;
  v_cliente text;
  v_ajustes public.ajustes;
  v_alias text;
  v_cbu text;
  v_link text;
  v_hay_como_transferir boolean;
  v_precio bigint;
  v_pagado bigint;
  v_sena_bp integer;
  v_instancia text;
  v_monto bigint;
  v_instancia_despues text;
  v_monto_despues bigint;
  v_formas public.forma_de_cobro[];
  v_por_transferencia boolean;
  v_hay_cuenta_en_dolares boolean;
  v_cobra_en_pesos boolean;
  v_cobra_en_dolares boolean;
  v_formas_en_dolares public.forma_de_cobro[];
  v_por_transferencia_en_dolares boolean;
  v_siguiente jsonb;
  v_borrador public.presupuestos;
  v_revision public.revisiones_del_presupuesto;
  v_aprobada uuid;
  v_contenido jsonb;
  v_elegidas jsonb;
  v_presupuesto jsonb;
begin
  select * into v_p from public.proyectos p where p.id = p_proyecto_id and p.deleted_at is null;

  -- Lo mismo que si no existiera. Con la RLS puesta, un trabajo de otro household no se ve, y esta
  -- respuesta no distingue «no existe» de «no es tuyo».
  if not found then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  -- Un trabajo dado por perdido no tiene nada que contarle al cliente, y decirle que se perdió
  -- sería contarle una decisión del taller. El link se comporta como si no sirviera.
  if v_p.estado = 'perdido' then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El «por ahora no» es una nota del taller para acordarse de volver a escribirle, no una etapa del
  -- trabajo del cliente: el cliente sigue viendo la etapa en la que estaba, la misma que va a ver si
  -- vuelve. La saca del contacto pendiente, que la guarda al entrar.
  v_etapa := v_p.estado;
  if v_p.estado = 'en_seguimiento' then
    select c.etapa_previa into v_etapa
    from public.proximos_contactos c
    where c.household_id = v_p.household_id
      and c.proyecto_id = v_p.id
      and c.hecho_el is null
      and c.deleted_at is null;
    v_etapa := coalesce(v_etapa, 'presupuesto_enviado');
  end if;

  -- Cada dato tiene una etapa a partir de la cual es cierto. Un campo cargado antes de esa etapa (el
  -- sistema viejo le copió el inicio y la entrega a todo trabajo, aprobado o no) no es un hecho ni un
  -- acuerdo, y no sale de la base.
  v_aprobado := v_etapa in ('en_curso', 'entregado', 'cobrado');
  v_presupuesto_mandado := v_aprobado or v_etapa = 'presupuesto_enviado';

  select h.nombre into v_taller from public.households h where h.id = v_p.household_id;
  select c.nombre into v_cliente from public.clientes c where c.id = v_p.cliente_id;
  select * into v_ajustes from public.ajustes a where a.household_id = v_p.household_id;

  v_alias := nullif(v_ajustes.cobro_alias, '');
  v_cbu := nullif(v_ajustes.cobro_cbu, '');
  v_link := nullif(v_ajustes.cobro_link, '');
  v_hay_como_transferir := v_alias is not null or v_cbu is not null or v_link is not null;

  -- La cuenta en dólares y en qué le paga el cliente. Sin «Te paga en», el trabajo cobra en la moneda
  -- del taller (ADR 0081).
  v_hay_cuenta_en_dolares := nullif(v_ajustes.cobro_dolares_cbu, '') is not null
    or nullif(v_ajustes.cobro_dolares_alias, '') is not null;
  v_cobra_en_pesos := v_p.cobra_en is null or 'ARS' = any (v_p.cobra_en);
  v_cobra_en_dolares := coalesce('USD' = any (v_p.cobra_en), false);

  -- El presupuesto existe para el cliente desde que se le manda. Antes, lo que haya en
  -- presupuesto_centavos es un borrador, o el número de un estimativo, y no viaja.
  v_precio := case when v_presupuesto_mandado then v_p.presupuesto_centavos end;
  v_sena_bp := coalesce(v_p.sena_bp, v_ajustes.sena_bp, 5000);

  -- Lo pagado, en la moneda del trabajo: lo que descuenta cada pago (ADR 0081).
  select coalesce(
    sum(private.lo_que_descuenta(g.moneda, g.monto_centavos, g.cotizacion_centavos, v_p.moneda)),
    0
  ) into v_pagado
  from public.pagos g
  where g.household_id = v_p.household_id
    and g.proyecto_id = v_p.id
    and g.deleted_at is null;

  select r.instancia, r.monto_centavos into v_instancia, v_monto
  from private.pagos_por_delante(v_precio, v_pagado, v_sena_bp) as r
  where r.orden = 1;

  select r.instancia, r.monto_centavos into v_instancia_despues, v_monto_despues
  from private.pagos_por_delante(v_precio, v_pagado, v_sena_bp) as r
  where r.orden = 2;

  -- Antes de aprobar lo único que se le puede pedir es la seña: el saldo existe desde que aprueba. Si
  -- lo que ya pagó la cubre, para aprobar no le falta pagar nada.
  if not v_aprobado and v_instancia = 'saldo' then
    v_instancia := null;
    v_monto := null;
    v_instancia_despues := null;
    v_monto_despues := null;
  end if;

  -- Con todo pagado no hay ninguna instancia, así que tampoco hay formas ni datos de la cuenta. Las
  -- formas de cada moneda salen de lo mismo guardado; cada una va vacía si su moneda no está en «Te
  -- paga en», y en dólares, transferir pide la cuenta en dólares (ADR 0081).
  if v_instancia is null then
    v_formas := array[]::public.forma_de_cobro[];
    v_formas_en_dolares := array[]::public.forma_de_cobro[];
  else
    v_formas := case
      when v_cobra_en_pesos then private.formas_de_cobro(
        case when v_instancia = 'sena' then v_p.cobro_sena else v_p.cobro_saldo end, v_hay_como_transferir
      )
      else array[]::public.forma_de_cobro[]
    end;
    v_formas_en_dolares := case
      when v_cobra_en_dolares then private.formas_de_cobro(
        case when v_instancia = 'sena' then v_p.cobro_sena else v_p.cobro_saldo end, v_hay_cuenta_en_dolares
      )
      else array[]::public.forma_de_cobro[]
    end;
  end if;

  v_por_transferencia := 'transferencia' = any (v_formas);
  v_por_transferencia_en_dolares := 'transferencia' = any (v_formas_en_dolares);

  if v_instancia_despues is null then
    v_siguiente := null;
  else
    v_siguiente := jsonb_build_object(
      'instancia', v_instancia_despues,
      'formas', to_jsonb(
        case
          when not v_cobra_en_pesos then array[]::public.forma_de_cobro[]
          when v_instancia_despues = 'sena'
            then private.formas_de_cobro(v_p.cobro_sena, v_hay_como_transferir)
          else private.formas_de_cobro(v_p.cobro_saldo, v_hay_como_transferir)
        end
      ),
      'formas_en_dolares', to_jsonb(
        case
          when not v_cobra_en_dolares then array[]::public.forma_de_cobro[]
          when v_instancia_despues = 'sena'
            then private.formas_de_cobro(v_p.cobro_sena, v_hay_cuenta_en_dolares)
          else private.formas_de_cobro(v_p.cobro_saldo, v_hay_cuenta_en_dolares)
        end
      ),
      'monto_centavos', v_monto_despues
    );
  end if;

  -- Lo que hay para coordinar la entrega: solo con el trabajo en curso, el mueble listo y sin entrega
  -- comprometida, la propuesta abierta si sigue vigente (un día propuesto que ya pasó no se le
  -- muestra), y lo último que el cliente le contestó.
  if v_etapa = 'en_curso' and v_p.listo_el is not null and v_p.entrega_comprometida is null then
    select * into v_propuesta
    from public.propuestas_de_entrega d
    where d.household_id = v_p.household_id
      and d.proyecto_id = v_p.id
      and d.cerrada_at is null
      and d.deleted_at is null
      and (d.fecha is null or d.fecha >= private.hoy_en_el_taller());

    if v_propuesta.id is not null then
      select * into v_respuesta
      from public.respuestas_de_entrega r
      where r.household_id = v_p.household_id
        and r.proyecto_id = v_p.id
        and r.propuesta_id = v_propuesta.id
        and r.deleted_at is null
      order by r.created_at desc, r.id desc
      limit 1;
    end if;
  end if;

  -- El presupuesto que se le mandó desde la app (ADR 0080): la última revisión, desde que se le manda.
  -- Desde el link esta función corre sin RLS, así que el borrador y sus revisiones se filtran por el
  -- taller del trabajo.
  if v_presupuesto_mandado then
    select b.* into v_borrador
    from public.presupuestos b
    where b.household_id = v_p.household_id
      and b.proyecto_id = v_p.id
      and b.deleted_at is null;

    if v_borrador.id is not null then
      select r.* into v_revision
      from public.revisiones_del_presupuesto r
      where r.household_id = v_p.household_id
        and r.presupuesto_id = v_borrador.id
        and r.deleted_at is null
      order by r.revision desc
      limit 1;
    end if;
  end if;

  if v_revision.id is null then
    v_presupuesto := null;
  elsif not v_aprobado then
    -- Esperando la seña: la revisión tal cual, con todas sus opciones y lo que cambió.
    v_presupuesto := jsonb_build_object(
      'numero', v_revision.numero,
      'revision', v_revision.revision,
      'mandado_el', v_revision.mandado_el,
      'que_cambio', v_revision.que_cambio,
      'contenido', v_revision.contenido,
      'idioma', v_revision.idioma
    );
  else
    -- Aprobado: solo la opción que eligió, con su letra. Si ya no hay ninguna opción aprobada (se cargó
    -- el presupuesto a mano), el documento viaja sin valores y la página muestra lo acordado.
    select o.id into v_aprobada
    from public.opciones_de_presupuesto o
    where o.household_id = v_p.household_id
      and o.proyecto_id = v_p.id
      and o.aprobada
      and o.deleted_at is null;

    v_contenido := v_revision.contenido;
    if v_contenido #>> '{valores,tipo}' = 'opciones' then
      select coalesce(jsonb_agg(e.valor order by e.orden), '[]'::jsonb) into v_elegidas
      from jsonb_array_elements(v_contenido #> '{valores,opciones}') with ordinality as e (valor, orden)
      where e.valor ->> 'id' = v_aprobada::text;

      v_contenido := jsonb_set(
        v_contenido,
        '{valores}',
        case
          when jsonb_array_length(v_elegidas) = 0 then 'null'::jsonb
          else jsonb_build_object('tipo', 'opciones', 'opciones', v_elegidas)
        end
      );
    end if;

    v_presupuesto := jsonb_build_object(
      'numero', v_revision.numero,
      'revision', v_revision.revision,
      'mandado_el', v_revision.mandado_el,
      'contenido', v_contenido,
      'idioma', v_revision.idioma,
      'aceptado_el', v_borrador.aceptado_el,
      'letra', v_elegidas -> 0 ->> 'letra'
    );
  end if;

  -- Los campos van enumerados uno por uno, a propósito. Si esto fuera to_jsonb(v_p) con la pantalla
  -- filtrando, el día que alguien le agregue una columna a proyectos esa columna quedaría expuesta
  -- sin que nadie lo decida: lo que el cliente ve se decide acá, no en el navegador. La suite lo
  -- controla con supabase/tests/25_vista_del_cliente.sql, que falla apenas aparece una columna
  -- nueva en proyectos o en ajustes hasta que alguien la clasifica como pública o privada.
  return jsonb_build_object(
    'taller', jsonb_build_object('nombre', v_taller),
    'cliente', jsonb_build_object('nombre', v_cliente),
    'trabajo', v_p.titulo,
    -- El idioma de los clientes del taller: la página habla en él, con sus fechas y su plata (ADR 0082).
    -- El presupuesto lleva adentro el de su revisión, que es el de su contenido.
    'idioma', coalesce(v_ajustes.idioma_de_los_clientes, 'es'),
    -- La dirección de la casa del cliente, desde que aprueba. Antes viaja vacía y no en null: el
    -- lector de una versión vieja de la app la exige como texto.
    'direccion', case when v_aprobado then v_p.direccion_entrega else '' end,
    'estado', v_etapa,
    'precio_centavos', v_precio,
    -- La moneda del trabajo, en la que van el precio, la seña, los pagos y lo que toca pagar, y en qué
    -- le paga el cliente, null si en la moneda del taller (ADR 0081).
    'moneda', v_p.moneda,
    'cobra_en', to_jsonb(v_p.cobra_en),
    -- La seña en pesos: la que se le pide para arrancar mientras espera, y la acordada desde que
    -- aprueba. Sale de la misma función que el importe de «pago», así que las dos no pueden dar
    -- distinto. El porcentaje sigue sin viajar.
    'sena_centavos', private.sena_esperada(v_precio, v_sena_bp),
    -- El pago que toca ahora y, si hay otro después, cuánto es y cómo se paga. Los importes salen
    -- de lo que ya está guardado; el porcentaje de seña sigue sin viajar, que es lo que dejó
    -- abierto el ADR 0048.
    'pago', jsonb_build_object(
      'instancia', v_instancia,
      'formas', to_jsonb(v_formas),
      'formas_en_dolares', to_jsonb(v_formas_en_dolares),
      'monto_centavos', v_monto,
      'siguiente', v_siguiente
    ),
    -- Cómo pagarle al taller, y solo si el pago que toca se puede pagar así: los cuatro datos de
    -- la cuenta para transferir y el link de Mercado Pago para pagar desde la misma página. De
    -- ajustes no viaja nada más: ni el sueldo, ni los costos fijos, ni la meta de Cocos, ni la seña.
    -- Las redes van en la vidriera y el valor del relevamiento, al final.
    'cobro', jsonb_build_object(
      'alias', case when v_por_transferencia then v_alias end,
      'cbu', case when v_por_transferencia then v_cbu end,
      'titular', case when v_por_transferencia then nullif(v_ajustes.cobro_titular, '') end,
      'cuit', case when v_por_transferencia then nullif(v_ajustes.cobro_cuit, '') end,
      'link', case when v_por_transferencia then v_link end
    ),
    -- La cuenta en dólares, solo si el pago que toca se ofrece en dólares por transferencia. El
    -- titular y el CUIT son los de la cuenta en pesos (ADR 0081).
    'cobro_en_dolares', jsonb_build_object(
      'alias', case when v_por_transferencia_en_dolares then nullif(v_ajustes.cobro_dolares_alias, '') end,
      'cbu', case when v_por_transferencia_en_dolares then nullif(v_ajustes.cobro_dolares_cbu, '') end,
      'titular', case when v_por_transferencia_en_dolares then nullif(v_ajustes.cobro_titular, '') end,
      'cuit', case when v_por_transferencia_en_dolares then nullif(v_ajustes.cobro_cuit, '') end
    ),
    -- El dólar del día del taller, con la fecha para la que vale: solo en un trabajo en dólares y
    -- desde que se le manda el presupuesto, que es cuando hay un precio que pasar a pesos. La página
    -- lo usa solo si es de hoy (ADR 0081).
    'dolar_del_dia', case
      when v_p.moneda <> 'ARS' and v_presupuesto_mandado and v_ajustes.dolar_del_dia_centavos is not null
        then jsonb_build_object(
          'cotizacion_centavos', v_ajustes.dolar_del_dia_centavos,
          'fecha', v_ajustes.dolar_del_dia_el
        )
    end,
    'fechas', jsonb_build_object(
      'estimativo', (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'presupuesto_estimativo'
      ),
      'presupuesto', (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'presupuesto_enviado'
      ),
      -- La aprobación sale de su registro, no de un pago, y solo mientras el trabajo está aprobado:
      -- uno que volvió a presupuesto no se muestra aprobado.
      'aprobado', case when v_aprobado then (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'en_curso'
      ) end,
      'inicio', case when v_aprobado then v_p.fecha_inicio end,
      -- La entrega estimada, desde que aprueba. La clave no se renombró: la app la lee como
      -- estimada, y no la muestra si ya pasó (ADR 0071).
      'entrega_pautada', case when v_aprobado then v_p.entrega_estimada end,
      -- El día en que se terminó de fabricar, desde que está listo.
      'listo', case when v_aprobado then v_p.listo_el end,
      'entregado', case when v_etapa in ('entregado', 'cobrado') then v_p.fecha_entrega end,
      'cobro', case when v_p.estado = 'cobrado' then v_p.fecha_cobro end,
      -- Hasta cuándo vale el presupuesto, solo mientras está mandado y sin aprobar.
      'vale_hasta', case when v_etapa = 'presupuesto_enviado' then v_p.presupuesto_vale_hasta end
    ),
    -- La visita para medir: el día acordado o en que se fue, y si ya se fue. La hora no viaja.
    'visita', jsonb_build_object(
      'dia', v_p.fecha_visita,
      'hecha', v_p.visita_hecha
    ),
    -- La entrega que se coordina con el cliente (ADR 0071). La comprometida viaja mientras el trabajo
    -- está en curso; entregado, lo que cuenta es el día en que se entregó. La propuesta y la respuesta,
    -- solo mientras hay algo que contestar. De la propuesta viaja su id, que es con lo que el cliente
    -- contesta; de la respuesta, lo que él mismo mandó.
    'entrega', jsonb_build_object(
      'comprometida', case
        when v_etapa = 'en_curso' and v_p.entrega_comprometida is not null then jsonb_build_object(
          'fecha', v_p.entrega_comprometida,
          'franja', v_p.entrega_comprometida_franja
        )
      end,
      'propuesta', case
        when v_propuesta.id is not null then jsonb_build_object(
          'id', v_propuesta.id,
          'forma', v_propuesta.forma,
          'fecha', v_propuesta.fecha,
          'franja', v_propuesta.franja
        )
      end,
      'respuesta', case
        when v_respuesta.id is not null then jsonb_build_object(
          'respuesta', v_respuesta.respuesta,
          'dias', v_respuesta.dias,
          'nota', v_respuesta.nota
        )
      end
    ),
    'pagos', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'fecha', g.fecha,
            'concepto', g.concepto,
            -- Lo que descuenta, en la moneda del trabajo: la suma sigue dando lo pagado en la moneda del
            -- precio. Lo que se entregó va en pagado_centavos, en la moneda del pago, con su dólar.
            'monto_centavos',
              private.lo_que_descuenta(g.moneda, g.monto_centavos, g.cotizacion_centavos, v_p.moneda),
            'moneda', g.moneda,
            'pagado_centavos', g.monto_centavos,
            'cotizacion_centavos', g.cotizacion_centavos
          )
          order by g.fecha, g.id
        ),
        '[]'::jsonb
      )
      from public.pagos g
      where g.household_id = v_p.household_id
        and g.proyecto_id = v_p.id
        and g.deleted_at is null
    ),
    'archivos', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'nombre', a.nombre,
            'tipo', a.tipo,
            'ancho', a.ancho,
            'alto', a.alto,
            'fecha', a.created_at,
            -- La ruta en el bucket, que es pública y se sirve por el CDN. Sale del id, como en la
            -- app: private.ruta_del_archivo() es el único lugar donde se arma.
            'ruta', private.ruta_del_archivo(a.household_id, a.proyecto_id, a.id, a.tipo, false),
            'ruta_mini', private.ruta_del_archivo(a.household_id, a.proyecto_id, a.id, a.tipo, true)
          )
          order by a.created_at desc, a.id desc
        ),
        '[]'::jsonb
      )
      from public.archivos a
      where a.household_id = v_p.household_id
        and a.proyecto_id = v_p.id
        and a.deleted_at is null
        and a.visible_para_cliente
    ),
    -- La vidriera del taller (ADR 0076), en todas las etapas: las redes y hasta doce fotos, en su
    -- orden. Las fotos se filtran por el taller del trabajo a mano: desde el link esta función corre
    -- con los permisos del dueño de las tablas, que no pasa por la RLS, y sin ese filtro traería las
    -- de todos los talleres. La ruta es la de la carpeta de la vidriera: el id de la foto de la que se
    -- copió, y el de su trabajo, no viajan.
    'vidriera', jsonb_build_object(
      'redes', jsonb_build_object(
        'instagram', nullif(v_ajustes.instagram_link, ''),
        'facebook', nullif(v_ajustes.facebook_link, ''),
        'tiktok', nullif(v_ajustes.tiktok_link, '')
      ),
      'fotos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'ruta', private.ruta_de_la_vidriera(f.household_id, f.id, f.tipo, false),
              'ruta_mini', private.ruta_de_la_vidriera(f.household_id, f.id, f.tipo, true),
              'ancho', f.ancho,
              'alto', f.alto
            )
            order by f.orden, f.created_at, f.id
          ),
          '[]'::jsonb
        )
        from (
          select v.id, v.household_id, v.tipo, v.ancho, v.alto, v.orden, v.created_at
          from public.fotos_de_la_vidriera v
          where v.household_id = v_p.household_id
            and v.deleted_at is null
          order by v.orden, v.created_at, v.id
          limit 12
        ) as f
      )
    ),
    -- Cuánto cobra el taller el relevamiento técnico, la visita para medir (ADR 0079): solo antes de
    -- mandar el presupuesto, que es cuando la página explica qué es y cuánto vale. En null después, o
    -- si el dueño lo dejó vacío. Es un dato de ajustes y no un pago: lo que el cliente paga por la
    -- visita es un pago del trabajo, y queda a cuenta de la seña.
    'relevamiento_centavos', case when not v_presupuesto_mandado then v_ajustes.relevamiento_centavos end,
    -- El presupuesto que se le mandó desde la app, en la forma de su etapa (ver arriba), o null.
    'presupuesto', v_presupuesto,
    -- Sus facturas con ARCA (ADR 0085): las autorizadas o anuladas y las notas de crédito autorizadas,
    -- desde cualquier etapa, porque la de la seña existe antes de aprobar. Las de producción, siempre; las
    -- de prueba, solo mientras el taller siga en homologación. Campo por campo, como todo lo demás: el
    -- emisor clave por clave y nunca el jsonb entero, y del receptor lo que dice la factura, que es del
    -- propio cliente y lo necesita el PDF. Lo de la emisión (el rechazo, los intentos, la toma, el último
    -- error) no viaja. Desde el link esta función corre sin RLS: se filtra por el taller del trabajo.
    'facturas', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'tipo', c.tipo,
            'punto_de_venta', c.punto_de_venta,
            'numero', c.numero,
            'fecha', c.fecha,
            'importe_centavos', c.importe_centavos,
            'detalle', c.detalle,
            'cae', c.cae,
            'cae_vence', c.cae_vence,
            'prueba', c.ambiente = 'homologacion',
            'emisor', jsonb_build_object(
              'razonSocial', c.emisor ->> 'razonSocial',
              'nombreDelTaller', c.emisor ->> 'nombreDelTaller',
              'domicilio', c.emisor ->> 'domicilio',
              'cuit', c.emisor ->> 'cuit',
              'ingresosBrutos', c.emisor ->> 'ingresosBrutos',
              'inicioDeActividades', c.emisor ->> 'inicioDeActividades'
            ),
            'receptor', jsonb_build_object(
              'nombre', c.receptor_nombre,
              'domicilio', c.receptor_domicilio,
              'condicion', c.receptor_condicion,
              'doc_tipo', c.doc_tipo,
              'doc_nro', c.doc_nro
            ),
            'anulada_por', (
              select jsonb_build_object('punto_de_venta', n.punto_de_venta, 'numero', n.numero, 'fecha', n.fecha)
              from public.comprobantes n
              where c.tipo = 'factura_c'
                and n.household_id = c.household_id
                and n.asociado_id = c.id
                and n.tipo = 'nota_de_credito_c'
                and n.estado = 'autorizada'
                and n.deleted_at is null
            ),
            'anula_a', (
              select jsonb_build_object('punto_de_venta', f.punto_de_venta, 'numero', f.numero, 'fecha', f.fecha)
              from public.comprobantes f
              where c.tipo = 'nota_de_credito_c'
                and f.household_id = c.household_id
                and f.id = c.asociado_id
            )
          )
          order by c.fecha, c.tipo, c.numero, c.id
        ),
        '[]'::jsonb
      )
      from public.comprobantes c
      where c.household_id = v_p.household_id
        and c.proyecto_id = v_p.id
        and c.deleted_at is null
        and (
          (c.tipo = 'factura_c' and c.estado in ('autorizada', 'anulada'))
          or (c.tipo = 'nota_de_credito_c' and c.estado = 'autorizada')
        )
        and (c.ambiente = 'produccion' or v_ajustes.facturacion_ambiente = 'homologacion')
    )
  );
end;
$$;

comment on function public.vista_del_cliente(uuid) is
  'Lo único que un cliente puede ver de su trabajo, y cada dato recién desde la etapa en la que es cierto (ADR 0067): el presupuesto desde que se le manda; la dirección de entrega, el día de inicio, la entrega estimada (la clave entrega_pautada, que no se renombró) y el día de la aprobación desde que aprueba; el día en que el mueble quedó listo desde que lo está; el día de la entrega desde que se entrega. Antes de esas etapas no viajan, aunque estén cargados: un campo cargado no es un hecho. Devuelve cuánto vale, cuánto pagó, en qué anda, la seña en pesos, qué pago le toca ahora, cuánto es, cómo puede pagarlo y cuál viene después (antes de aprobar solo se le pide la seña), hasta cuándo vale el presupuesto mientras espera la seña, los archivos que el dueño marcó, el día que se le mandó el estimativo y el día de la visita para medir con si ya se fue. La clave entrega trae la entrega comprometida mientras el trabajo está en curso, y la propuesta de entrega vigente con lo último que contestó el cliente solo con el trabajo en curso, listo y sin comprometida (ADR 0071). La clave vidriera trae, en todas las etapas, las redes del taller y hasta 12 fotos de su vidriera con la ruta de cada una, solo del taller del trabajo (ADR 0076). La clave presupuesto trae el presupuesto que se le mandó desde la app (ADR 0080): null antes de mandarlo o si nunca se mandó desde la app; esperando la seña, la última revisión tal cual (numero, revision, mandado_el, que_cambio y contenido, con las opciones y la obra adentro); desde que aprueba, la última revisión sin que_cambio, con las opciones del contenido filtradas a la aprobada, más aceptado_el y la letra de esa opción: las que no eligió no viajan. Los datos del taller para el presupuesto viajan solo adentro del contenido de cada revisión. La clave idioma trae el idioma de los clientes del taller, en el que habla la página, y el presupuesto trae el de su revisión, en el que se armó (ADR 0082). Desde el ADR 0081 trae también la moneda del trabajo y en qué le paga el cliente (cobra_en), las formas en dólares del pago que toca y del siguiente (vacías si no cobra en dólares; las de pesos, vacías si no cobra en pesos), la cuenta en dólares (cobro_en_dolares) solo si el pago que toca se ofrece en dólares por transferencia, y el dólar del día con su fecha solo en un trabajo en dólares y desde que se le manda el presupuesto. Lo pagado y el monto_centavos de cada pago son lo que descuenta, en la moneda del trabajo; cada pago trae además su moneda, lo que se entregó (pagado_centavos) y su dólar. La clave facturas trae sus facturas con ARCA (ADR 0085): las facturas autorizadas o anuladas y las notas de crédito autorizadas del trabajo, desde cualquier etapa, porque la de la seña existe antes de aprobar; las de producción siempre, aunque el taller se haya desconectado, y las de homologación solo mientras el taller siga en homologación (prueba en true). De cada una viajan el tipo, el punto de venta, el número, la fecha, el importe, el detalle, el CAE con su vencimiento, el emisor clave por clave (nunca el jsonb entero), el receptor como dice la factura (nombre, domicilio, condición y documento: los únicos datos del cliente que viajan además de su nombre, porque son suyos y el PDF los necesita) y la nota que la anula o la factura que anula; lo de la emisión (el rechazo, los intentos, la toma, el último error) no viaja. Enumera los campos uno por uno y nunca devuelve la fila entera: convertirla en un select * expondría cada columna nueva de proyectos sin que nadie lo decida, costos estimados, margen y tipo de proyecto incluidos. Un trabajo en seguimiento se muestra en la etapa en la que estaba: el «por ahora no» y su próximo contacto son del taller y no viajan (ADR 0064). Del estimativo viaja el día, nunca un importe. De la visita viajan el día y la marca, no la hora. De ajustes viajan exactamente los cinco campos de cobro —los cuatro de la cuenta y el link de Mercado Pago—, y solo cuando el pago que toca AHORA se ofrece por transferencia: lo que no se muestra, no se manda; los tres links de las redes, siempre; y el valor del relevamiento técnico (relevamiento_centavos) solo antes de mandar el presupuesto, en null después o si el dueño lo dejó vacío (ADR 0079). El porcentaje de seña y los días que vale un presupuesto no viajan nunca; lo que viaja son el importe y la fecha que salen de ellos. Es security invoker: desde la app la llama el dueño y la RLS decide; desde el link la llama public.vista_compartida(), que ya resolvió el token (ADR 0046, 0048, 0053, 0054, 0058, 0067, 0071, 0076, 0079, 0080, 0081, 0082 y 0085).';
