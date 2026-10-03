-- La categoría de los gastos (ADR 0084).
--
-- «Dinero gastado» y «materiales más usados» piden saber en qué se gastó. Los gastos de un trabajo
-- suman una categoría opcional, la misma clasificación de los costos estimados (madera, herrajes,
-- flete, ayudante) más «otro», como dejó anotado el ADR 0045. Null es «sin categoría»: todo lo
-- cargado antes y lo que se cargue sin elegir. No toca ninguna fila: la columna nace en null.
--
-- guardar_proyecto lee la categoría de cada gasto solo si el pedido trae la clave, con el molde de las
-- columnas nuevas de los pagos: un bundle viejo no la manda y no puede borrar la que eligió uno nuevo.
-- La función se reemplaza entera desde su cuerpo vigente (el de 20261001121300_los_pagos_en_dolares)
-- y solo cambia el alta de los gastos. La firma no cambia, así que los grants quedan como estaban.

alter table public.gastos
  add column categoria text
    constraint gastos_categoria_valida
    check (categoria in ('madera', 'herrajes', 'flete', 'ayudante', 'otro'));

comment on column public.gastos.categoria is 'En qué se gastó: madera, herrajes, flete, ayudante u otro, las cuatro de los costos estimados más «otro» (ADR 0084). Null es «sin categoría»: lo cargado antes de la columna y lo que se carga sin elegir. La escribe guardar_proyecto solo si el pedido trae la clave.';

grant insert (categoria), update (categoria) on public.gastos to authenticated;

create or replace function public.guardar_proyecto(p_proyecto jsonb, p_pagos jsonb, p_gastos jsonb, p_opciones jsonb default null::jsonb, p_necesidades jsonb default null::jsonb, p_proximos jsonb default null::jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_p record;
  v_actual public.proyectos;
  v_fila public.proyectos;
  v_existia boolean;
  v_sin_cambios boolean;
  v_vencimiento date;
  v_visita_hecha boolean;
  v_sena_bp integer;
  v_entrega_hora time;
  v_visita_hora time;
  v_vale_hasta date;
  v_fecha_entrega date;
  v_listo date;
  v_comprometida date;
  v_franja public.franja_de_entrega;
  v_tipo text;
  v_moneda text;
  v_household_id uuid;
  v_cuantas integer;
  v_aprobadas integer;
  v_monto_aprobado bigint;
  v_presupuesto bigint;
  v_entra_en_seguimiento boolean;
begin
  if p_proyecto is null or jsonb_typeof(p_proyecto) <> 'object' then
    raise exception 'El proyecto va en un objeto jsonb' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_pagos, 'null'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_gastos, 'null'::jsonb)) <> 'array'
  then
    raise exception 'Los pagos y los gastos van en arrays jsonb' using errcode = '22023';
  end if;

  if p_opciones is not null and jsonb_typeof(p_opciones) <> 'array' then
    raise exception 'Las opciones de presupuesto van en un array jsonb' using errcode = '22023';
  end if;

  if p_necesidades is not null and jsonb_typeof(p_necesidades) <> 'array' then
    raise exception 'Lo que hace falta va en un array jsonb' using errcode = '22023';
  end if;

  if p_proximos is not null and jsonb_typeof(p_proximos) <> 'array' then
    raise exception 'Los próximos contactos van en un array jsonb' using errcode = '22023';
  end if;

  -- Las horas se leen como texto por la misma razón que las fechas: un <input type="time"> vacío
  -- manda "" y un cast directo cortaría la llamada entera con 22007, un rechazo definitivo sin
  -- mensaje que tapa la cola (ADR 0015).
  select * into v_p from jsonb_to_record(p_proyecto) as x (
    id uuid,
    version integer,
    cliente_id uuid,
    titulo text,
    descripcion text,
    estado public.estado_proyecto,
    presupuesto_centavos bigint,
    forma_pago public.forma_pago,
    comprobante public.comprobante,
    fecha_visita date,
    ultimo_contacto date,
    fecha_inicio date,
    entrega_estimada date,
    fecha_entrega date,
    direccion_entrega text,
    notas text,
    vencimiento_presupuesto text,
    visita_hecha boolean,
    sena_bp integer,
    entrega_hora text,
    visita_hora text,
    presupuesto_vale_hasta text,
    listo_el text,
    entrega_comprometida text,
    entrega_comprometida_franja text,
    tipo_de_proyecto text,
    moneda text
  );

  if v_p.id is null or v_p.cliente_id is null or v_p.titulo is null or v_p.estado is null then
    raise exception 'El proyecto necesita id, cliente, título y estado' using errcode = '22004';
  end if;

  -- Una fila hija sin id o sin monto rebotaría contra un not null con un 23502 genérico, que no es
  -- un mensaje para el usuario y que tapa la cola igual que cualquier otro rechazo definitivo.
  if exists (
    select 1
    from jsonb_to_recordset(p_pagos) as r (id uuid, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and r.monto_centavos is null)
  ) then
    raise exception 'Cada pago necesita id y monto' using errcode = '22004';
  end if;

  -- La fecha de un pago es el día en que entró la plata, y la sabe la app. Sin ella, o con algo que
  -- no es un día, no se guarda: la base no la inventa (ADR 0063). Se lee como texto por lo mismo
  -- que las horas, y se revisa la forma antes de castear para no cortar con un 22007 sin mensaje.
  if exists (
    select 1
    from jsonb_to_recordset(p_pagos) as r (fecha text, borrado boolean)
    where not coalesce(r.borrado, false)
      and coalesce(r.fecha, '') !~ '^\d{4}-\d{2}-\d{2}$'
  ) then
    raise exception 'Cada pago necesita su fecha'
      using errcode = 'MN016',
            hint = 'Poné el día en que te pagaron.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_gastos) as r (id uuid, fecha text, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and (nullif(r.fecha, '') is null or r.monto_centavos is null))
  ) then
    raise exception 'Cada gasto necesita id, fecha y monto' using errcode = '22004';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb))
      as r (id uuid, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and r.monto_centavos is null)
  ) then
    raise exception 'Cada opción de presupuesto necesita id y monto' using errcode = '22004';
  end if;

  -- El tipo se lee como texto y se valida contra los valores del enum: castearlo de una cortaría con
  -- un 22P02 crudo, que es definitivo y no tiene traducción. Contra el enum y no contra una lista
  -- escrita acá, para que un tipo nuevo no obligue a reescribir la función (ADR 0060).
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_necesidades, '[]'::jsonb))
      as r (id uuid, tipo text, nombre text, borrado boolean)
    where r.id is null
       or (
         not coalesce(r.borrado, false)
         and (
           coalesce(r.tipo, '') <> all (enum_range(null::public.tipo_de_necesidad)::text[])
           or btrim(coalesce(r.nombre, '')) = ''
         )
       )
  ) then
    raise exception 'Cada material, herraje o herramienta necesita id, tipo y nombre'
      using errcode = '22004';
  end if;

  -- El próximo contacto: el día en que hay que escribirle, la etapa a la que vuelve y, si ya se hizo,
  -- el día y el resultado. Todo se lee como texto y se revisa la forma antes de castear, por lo mismo
  -- que las fechas de los pagos.
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_proximos, '[]'::jsonb))
      as r (id uuid, fecha text, etapa_previa text, hecho_el text, resultado text, borrado boolean)
    where r.id is null
       or (
         not coalesce(r.borrado, false)
         and (
           coalesce(r.fecha, '') !~ '^\d{4}-\d{2}-\d{2}$'
           or coalesce(r.etapa_previa, '') not in (
             'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado'
           )
           or (nullif(r.hecho_el, '') is not null and r.hecho_el !~ '^\d{4}-\d{2}-\d{2}$')
           or (nullif(r.hecho_el, '') is null) <> (nullif(r.resultado, '') is null)
           or coalesce(nullif(r.resultado, ''), 'otra_fecha') not in ('reactivado', 'perdido', 'otra_fecha')
         )
       )
  ) then
    raise exception 'Cada próximo contacto necesita id, día y la etapa a la que vuelve; si ya se hizo, el día y el resultado'
      using errcode = '22004';
  end if;

  -- Primer lock: el proyecto, con for update, la misma disciplina que private.liquidar. La guarda
  -- de pagos y gastos toma for share sobre esta misma fila, así que un cobro que llega en el mismo
  -- instante se serializa con este guardado: o la liquidación espera y suma los pagos nuevos, o
  -- este guardado espera y ve el proyecto ya liquidado, y entonces la guarda lo rechaza con MN001.
  select * into v_actual from public.proyectos p where p.id = v_p.id for update;
  v_existia := found;

  v_vencimiento := case
    when p_proyecto ? 'vencimiento_presupuesto' then nullif(v_p.vencimiento_presupuesto, '')::date
    else v_actual.vencimiento_presupuesto
  end;

  v_visita_hecha := case
    when p_proyecto ? 'visita_hecha' then coalesce(v_p.visita_hecha, false)
    else coalesce(v_actual.visita_hecha, false)
  end;

  -- Como el vencimiento: un bundle viejo que no manda la clave no borra la seña propia del trabajo.
  v_sena_bp := case
    when p_proyecto ? 'sena_bp' then v_p.sena_bp
    else v_actual.sena_bp
  end;

  v_entrega_hora := case
    when p_proyecto ? 'entrega_hora' then nullif(v_p.entrega_hora, '')::time
    else v_actual.entrega_hora
  end;

  v_visita_hora := case
    when p_proyecto ? 'visita_hora' then nullif(v_p.visita_hora, '')::time
    else v_actual.visita_hora
  end;

  -- Hasta cuándo vale el presupuesto, con el mismo patrón: un bundle viejo no la manda y no la borra.
  v_vale_hasta := case
    when p_proyecto ? 'presupuesto_vale_hasta' then nullif(v_p.presupuesto_vale_hasta, '')::date
    else v_actual.presupuesto_vale_hasta
  end;

  -- El listo, la comprometida con su franja y el tipo, con el mismo patrón: un bundle viejo no los
  -- conoce y no los borra. Las fechas y la franja se leen como texto por lo mismo que las horas.
  v_listo := case
    when p_proyecto ? 'listo_el' then nullif(v_p.listo_el, '')::date
    else v_actual.listo_el
  end;

  v_comprometida := case
    when p_proyecto ? 'entrega_comprometida' then nullif(v_p.entrega_comprometida, '')::date
    else v_actual.entrega_comprometida
  end;

  v_franja := case
    when p_proyecto ? 'entrega_comprometida_franja'
      then nullif(v_p.entrega_comprometida_franja, '')::public.franja_de_entrega
    else v_actual.entrega_comprometida_franja
  end;

  v_tipo := case
    when p_proyecto ? 'tipo_de_proyecto' then nullif(btrim(v_p.tipo_de_proyecto), '')
    else v_actual.tipo_de_proyecto
  end;

  -- La moneda del trabajo, con el mismo patrón: un bundle viejo no la manda y no la cambia, y un trabajo
  -- nuevo sin la clave nace en pesos (ADR 0081).
  v_moneda := case
    when p_proyecto ? 'moneda' then coalesce(v_p.moneda, 'ARS')
    else coalesce(v_actual.moneda, 'ARS')
  end;

  -- Lo mismo que hace private.cuidar_las_fechas_de_la_entrega() con cualquier escritura: en curso no
  -- hay entrega real, antes de aprobar no hay listo ni comprometida, y la franja no va sin su día.
  v_fecha_entrega := case when v_p.estado = 'en_curso' then null else v_p.fecha_entrega end;
  if v_p.estado in (
    'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
    'en_seguimiento'
  ) then
    v_listo := null;
    v_comprometida := null;
  end if;
  if v_comprometida is null then
    v_franja := null;
  end if;

  v_household_id := coalesce(v_actual.household_id, private.household_actual());

  -- Entra en seguimiento en este guardado: la etapa a la que vuelve es la que tenía el trabajo, y la
  -- decide la base, que la tiene en la mano, no lo que diga la app.
  v_entra_en_seguimiento := v_existia
    and v_p.estado = 'en_seguimiento'
    and v_actual.estado is distinct from 'en_seguimiento'
    and v_actual.estado in ('contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado');

  -- El presupuesto que va a quedar, calculado ANTES de escribir el proyecto y sobre el conjunto de
  -- opciones que va a quedar: las que ya están, más las que vienen, menos las que vienen marcadas de
  -- baja. Si se escribiera después habría que corregir el proyecto con un update más, y ese update
  -- subiría la version una segunda vez: el cliente mandaría la versión vieja en el guardado siguiente
  -- y rebotaría con MN006.
  with entrantes as (
    select r.id, r.monto_centavos, coalesce(r.aprobada, false) as aprobada,
           coalesce(r.borrado, false) as borrado
    from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb))
      as r (id uuid, monto_centavos bigint, aprobada boolean, borrado boolean)
  ),
  existentes as (
    select o.id, o.monto_centavos, o.aprobada
    from public.opciones_de_presupuesto o
    where o.household_id = v_household_id
      and o.proyecto_id = v_p.id
      and o.deleted_at is null
  ),
  quedan as (
    select coalesce(e.monto_centavos, x.monto_centavos) as monto_centavos,
           coalesce(e.aprobada, x.aprobada) as aprobada
    from existentes x
    full outer join entrantes e on e.id = x.id
    where not coalesce(e.borrado, false)
  )
  select count(*)::integer,
         count(*) filter (where aprobada)::integer,
         min(monto_centavos) filter (where aprobada)
  into v_cuantas, v_aprobadas, v_monto_aprobado
  from quedan;

  if v_aprobadas > 1 then
    raise exception 'Solo se puede tildar una opción del presupuesto'
      using errcode = 'MN009',
            hint = 'Destildá la que no va y dejá tildada la que te aprobaron.';
  end if;

  -- Con opciones, el presupuesto no se elige: sale de la aprobada, y no hay ninguna mientras el
  -- cliente no eligió. Sin opciones, es el campo que manda el usuario, como siempre.
  v_presupuesto := case
    when v_cuantas > 0 then (case when v_aprobadas > 0 then v_monto_aprobado else null end)
    else v_p.presupuesto_centavos
  end;

  if v_existia then
    if v_actual.deleted_at is not null then
      raise exception 'El proyecto está borrado' using errcode = 'MN002';
    end if;

    v_sin_cambios := (
      v_actual.cliente_id, v_actual.titulo, v_actual.descripcion, v_actual.estado,
      v_actual.presupuesto_centavos, v_actual.forma_pago, v_actual.comprobante,
      v_actual.fecha_visita, v_actual.ultimo_contacto, v_actual.fecha_inicio,
      v_actual.entrega_estimada, v_actual.fecha_entrega, v_actual.direccion_entrega, v_actual.notas,
      v_actual.vencimiento_presupuesto, v_actual.visita_hecha, v_actual.sena_bp,
      v_actual.entrega_hora, v_actual.visita_hora, v_actual.presupuesto_vale_hasta,
      v_actual.listo_el, v_actual.entrega_comprometida, v_actual.entrega_comprometida_franja,
      v_actual.tipo_de_proyecto, v_actual.moneda
    ) is not distinct from (
      v_p.cliente_id, v_p.titulo, coalesce(v_p.descripcion, ''), v_p.estado,
      v_presupuesto, v_p.forma_pago, v_p.comprobante,
      v_p.fecha_visita, v_p.ultimo_contacto, v_p.fecha_inicio,
      v_p.entrega_estimada, v_fecha_entrega, coalesce(v_p.direccion_entrega, ''),
      coalesce(v_p.notas, ''), v_vencimiento, v_visita_hecha, v_sena_bp,
      v_entrega_hora, v_visita_hora, v_vale_hasta,
      v_listo, v_comprometida, v_franja, v_tipo, v_moneda
    );

    -- Un guardado hecho sin señal sobre una versión vieja no pisa en silencio lo que hay. La
    -- excepción es el reenvío de la cola: este mismo guardado ya se aplicó (la versión subió
    -- exactamente uno y la fila quedó igual a lo que se manda) y la respuesta se perdió. Reaplicar
    -- entonces no hace nada, porque el update de abajo y las bajas ya son no-op.
    if v_p.version is not null
      and v_actual.version <> v_p.version
      and not (v_sin_cambios and v_actual.version = v_p.version + 1)
    then
      raise exception 'El proyecto cambió desde que lo abriste'
        using errcode = 'MN006',
              detail = format('versión vista %s, versión actual %s', v_p.version, v_actual.version),
              hint = 'Abrilo de nuevo para ver lo que hay ahora y volvé a cargar lo que te falte.';
    end if;

    -- Una app sin actualizar no manda la moneda y cree que todo importe es de pesos: en un trabajo en
    -- dólares no cambia el presupuesto ni el importe de una opción. Lo de siempre pasa (ADR 0081).
    if not (p_proyecto ? 'moneda') and v_actual.moneda <> 'ARS' and (
      v_presupuesto is distinct from v_actual.presupuesto_centavos
      or exists (
        select 1
        from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb))
          as r (id uuid, monto_centavos bigint, borrado boolean)
        left join public.opciones_de_presupuesto o
          on o.household_id = v_household_id and o.id = r.id and o.deleted_at is null
        where not coalesce(r.borrado, false)
          and o.monto_centavos is distinct from r.monto_centavos
      )
    ) then
      raise exception 'Este trabajo tiene plata en dólares'
        using errcode = 'MN038',
              detail = 'presupuesto',
              hint = 'Actualizá la app y volvé a hacerlo.';
    end if;
  end if;

  -- Lo mismo con un pago en dólares: sin la clave de la moneda del pago, su importe no se cambia.
  if exists (
    select 1
    from jsonb_array_elements(p_pagos) as e
    cross join lateral jsonb_to_record(e) as r (id uuid, monto_centavos bigint, borrado boolean)
    join public.pagos g on g.household_id = v_household_id and g.id = r.id
    where not coalesce(r.borrado, false)
      and not (e ? 'moneda')
      and g.moneda <> 'ARS'
      and g.monto_centavos is distinct from r.monto_centavos
  ) then
    raise exception 'Este trabajo tiene plata en dólares'
      using errcode = 'MN038',
            detail = 'pago',
            hint = 'Actualizá la app y volvé a hacerlo.';
  end if;

  -- Alta y edición se escriben por separado, no con un upsert. En un `insert ... on conflict do
  -- update`, Postgres evalúa los check de la tabla sobre la fila propuesta antes de resolver el
  -- conflicto: guardar las notas de un proyecto cobrado proponía una fila con estado cobrado y la
  -- distribución en null, y eso choca contra proyectos_liquidado_con_distribucion. El reenvío del
  -- alta cae igual en la rama de edición, porque el select de arriba ya encontró la fila.
  --
  -- La edición manda la fila entera y no solo las columnas que cambiaron, al revés que el resto de
  -- las mutaciones (ADR 0010): acá el chequeo de versión es la garantía más fuerte, porque si el
  -- servidor cambió algo el guardado se rechaza en vez de pisarlo en silencio. Los cuatro costos
  -- estimados quedan afuera a propósito: van por su propio update, como las marcas de la agenda.
  if v_existia then
    update public.proyectos set
      cliente_id = v_p.cliente_id,
      titulo = v_p.titulo,
      descripcion = coalesce(v_p.descripcion, ''),
      estado = v_p.estado,
      presupuesto_centavos = v_presupuesto,
      forma_pago = v_p.forma_pago,
      comprobante = v_p.comprobante,
      fecha_visita = v_p.fecha_visita,
      ultimo_contacto = v_p.ultimo_contacto,
      fecha_inicio = v_p.fecha_inicio,
      entrega_estimada = v_p.entrega_estimada,
      fecha_entrega = v_fecha_entrega,
      direccion_entrega = coalesce(v_p.direccion_entrega, ''),
      notas = coalesce(v_p.notas, ''),
      vencimiento_presupuesto = v_vencimiento,
      visita_hecha = v_visita_hecha,
      sena_bp = v_sena_bp,
      entrega_hora = v_entrega_hora,
      visita_hora = v_visita_hora,
      presupuesto_vale_hasta = v_vale_hasta,
      listo_el = v_listo,
      entrega_comprometida = v_comprometida,
      entrega_comprometida_franja = v_franja,
      tipo_de_proyecto = v_tipo,
      moneda = v_moneda
    where id = v_p.id
    returning * into v_fila;
  else
    begin
      insert into public.proyectos (
        id, cliente_id, titulo, descripcion, estado, presupuesto_centavos, forma_pago, comprobante,
        fecha_visita, ultimo_contacto, fecha_inicio, entrega_estimada, fecha_entrega,
        direccion_entrega, notas, vencimiento_presupuesto, visita_hecha, sena_bp,
        entrega_hora, visita_hora, presupuesto_vale_hasta, listo_el, entrega_comprometida,
        entrega_comprometida_franja, tipo_de_proyecto, moneda
      ) values (
        v_p.id, v_p.cliente_id, v_p.titulo, coalesce(v_p.descripcion, ''), v_p.estado,
        v_presupuesto, v_p.forma_pago, v_p.comprobante,
        v_p.fecha_visita, v_p.ultimo_contacto, v_p.fecha_inicio, v_p.entrega_estimada,
        v_fecha_entrega, coalesce(v_p.direccion_entrega, ''), coalesce(v_p.notas, ''),
        v_vencimiento, v_visita_hecha, v_sena_bp, v_entrega_hora, v_visita_hora, v_vale_hasta,
        v_listo, v_comprometida, v_franja, v_tipo, v_moneda
      )
      returning * into v_fila;
    exception
      -- El id existe pero el select de arriba no lo vio: es de otro household. Se responde lo mismo
      -- que si no existiera, que es lo que la RLS ya dice, en vez de filtrar que está. Un duplicate
      -- key crudo sería además un rechazo definitivo sin mensaje, y la cola drena de a una.
      when unique_violation then
        raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
    end;
  end if;

  -- Los hijos van después del proyecto: la foreign key compuesta exige que el padre exista. La marca
  -- de la apertura de un pago, su moneda, su cotización y su tesoro usan el patrón de la clave
  -- presente: sin la clave (un bundle viejo) queda lo que ya tenía el pago, y un pago nuevo nace en
  -- false y en pesos, sin cotización ni tesoro. Van también en la fila propuesta, porque los checks se
  -- evalúan sobre ella antes del on conflict.
  insert into public.pagos (
    id, proyecto_id, fecha, concepto, monto_centavos, ya_en_la_apertura, moneda, cotizacion_centavos,
    tesoro_id
  )
  select r.id, v_fila.id, r.fecha::date, coalesce(r.concepto, ''), r.monto_centavos,
         case
           when e ? 'ya_en_la_apertura' then coalesce(r.ya_en_la_apertura, false)
           else coalesce(g.ya_en_la_apertura, false)
         end,
         case when e ? 'moneda' then coalesce(r.moneda, 'ARS') else coalesce(g.moneda, 'ARS') end,
         case when e ? 'cotizacion_centavos' then r.cotizacion_centavos else g.cotizacion_centavos end,
         case when e ? 'tesoro_id' then r.tesoro_id else g.tesoro_id end
  from jsonb_array_elements(p_pagos) as e
  cross join lateral jsonb_to_record(e) as r (
    id uuid, fecha text, concepto text, monto_centavos bigint, ya_en_la_apertura boolean,
    moneda text, cotizacion_centavos bigint, tesoro_id uuid, borrado boolean
  )
  left join public.pagos g on g.id = r.id
  where not coalesce(r.borrado, false)
  on conflict (id) do update set
    proyecto_id = excluded.proyecto_id,
    fecha = excluded.fecha,
    concepto = excluded.concepto,
    monto_centavos = excluded.monto_centavos,
    ya_en_la_apertura = excluded.ya_en_la_apertura,
    moneda = excluded.moneda,
    cotizacion_centavos = excluded.cotizacion_centavos,
    tesoro_id = excluded.tesoro_id;

  -- La categoría de un gasto usa el patrón de la clave presente, como la moneda de un pago: sin la
  -- clave (un bundle viejo) queda la que tenía el gasto, y un gasto nuevo nace sin categoría. Se lee
  -- como texto y una vacía es null: un '' rechazado por el check sería un rechazo definitivo que tapa
  -- la cola (ADR 0084).
  insert into public.gastos (id, proyecto_id, fecha, descripcion, monto_centavos, categoria)
  select r.id, v_fila.id, r.fecha::date, coalesce(r.descripcion, ''), r.monto_centavos,
         case
           when e ? 'categoria' then nullif(btrim(r.categoria), '')
           else g.categoria
         end
  from jsonb_array_elements(p_gastos) as e
  cross join lateral jsonb_to_record(e) as r (
    id uuid, fecha text, descripcion text, monto_centavos bigint, categoria text, borrado boolean
  )
  left join public.gastos g on g.id = r.id
  where not coalesce(r.borrado, false)
  on conflict (id) do update set
    proyecto_id = excluded.proyecto_id,
    fecha = excluded.fecha,
    descripcion = excluded.descripcion,
    monto_centavos = excluded.monto_centavos,
    categoria = excluded.categoria;

  -- Las opciones solo se tocan si el pedido las trae: p_opciones en null es un bundle viejo, que no
  -- las conoce y no tiene por qué borrarlas.
  if p_opciones is not null then
    -- Apagar antes de escribir. El índice único parcial de la aprobada se evalúa fila por fila, y el
    -- orden dentro del upsert no está definido: sin este paso, mover la aprobación de una opción a
    -- otra dejaba dos prendidas a la vez y cortaba con 23505.
    update public.opciones_de_presupuesto
    set aprobada = false
    where household_id = v_fila.household_id
      and proyecto_id = v_fila.id
      and aprobada
      and deleted_at is null;

    insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos, aprobada)
    select r.id, v_fila.id, coalesce(r.descripcion, ''), r.monto_centavos, coalesce(r.aprobada, false)
    from jsonb_to_recordset(p_opciones) as r (
      id uuid, descripcion text, monto_centavos bigint, aprobada boolean, borrado boolean
    )
    where not coalesce(r.borrado, false)
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      descripcion = excluded.descripcion,
      monto_centavos = excluded.monto_centavos,
      aprobada = excluded.aprobada;
  end if;

  -- Lo mismo con lo que hace falta: sin la clave no se toca. No hay índice único parcial acá, así que
  -- el upsert va de una y el orden entre filas no importa.
  if p_necesidades is not null then
    insert into public.necesidades (id, proyecto_id, tipo, nombre, cantidad, listo)
    select r.id, v_fila.id, r.tipo::public.tipo_de_necesidad, btrim(r.nombre), r.cantidad,
           coalesce(r.listo, false)
    from jsonb_to_recordset(p_necesidades) as r (
      id uuid, tipo text, nombre text, cantidad integer, listo boolean, borrado boolean
    )
    where not coalesce(r.borrado, false)
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      tipo = excluded.tipo,
      nombre = excluded.nombre,
      cantidad = excluded.cantidad,
      listo = excluded.listo;
  end if;

  -- El próximo contacto, también solo si viene la clave. Primero los registrados y después los
  -- pendientes: el índice único del pendiente se evalúa fila por fila, y cerrar uno y abrir el
  -- siguiente en el mismo guardado tiene que pasar por un momento sin ninguno. La marca de importante
  -- no viaja por acá: se tilda con su propio update.
  if p_proximos is not null then
    insert into public.proximos_contactos (
      id, proyecto_id, fecha, nota, etapa_previa, hecho_el, resultado, respuesta
    )
    select r.id, v_fila.id, r.fecha::date, coalesce(r.nota, ''),
           r.etapa_previa::public.estado_proyecto, r.hecho_el::date, r.resultado,
           coalesce(r.respuesta, '')
    from jsonb_to_recordset(p_proximos) as r (
      id uuid, fecha text, nota text, etapa_previa text, hecho_el text, resultado text,
      respuesta text, borrado boolean
    )
    where not coalesce(r.borrado, false)
      and nullif(r.hecho_el, '') is not null
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      fecha = excluded.fecha,
      nota = excluded.nota,
      etapa_previa = excluded.etapa_previa,
      hecho_el = excluded.hecho_el,
      resultado = excluded.resultado,
      respuesta = excluded.respuesta;

    begin
      insert into public.proximos_contactos (id, proyecto_id, fecha, nota, etapa_previa, respuesta)
      select r.id, v_fila.id, r.fecha::date, coalesce(r.nota, ''),
             case
               when v_entra_en_seguimiento then v_actual.estado
               else r.etapa_previa::public.estado_proyecto
             end,
             coalesce(r.respuesta, '')
      from jsonb_to_recordset(p_proximos) as r (
        id uuid, fecha text, nota text, etapa_previa text, hecho_el text, respuesta text,
        borrado boolean
      )
      where not coalesce(r.borrado, false)
        and nullif(r.hecho_el, '') is null
      on conflict (id) do update set
        proyecto_id = excluded.proyecto_id,
        fecha = excluded.fecha,
        nota = excluded.nota,
        etapa_previa = excluded.etapa_previa,
        respuesta = excluded.respuesta;
    exception
      -- Otro dispositivo ya dejó un contacto pendiente para este trabajo: este guardado viene de
      -- una versión vieja del seguimiento. Se contesta como cualquier otro choque de versiones.
      when unique_violation then
        raise exception 'El seguimiento cambió desde que lo abriste'
          using errcode = 'MN006',
                hint = 'Abrilo de nuevo para ver cuándo le toca, y volvé a cargar lo que te falte.';
    end;
  end if;

  -- La baja de una fila hija es la que el cliente vio y sacó del formulario, marcada en el mismo
  -- array. Nunca es "todo lo que no vino en el pedido": la version del proyecto no se mueve cuando
  -- solo cambian sus hijos, así que un guardado viejo borraría en silencio un pago cargado desde
  -- otro lado. El filtro por deleted_at deja el reenvío en no-op y conserva la primera marca.
  update public.pagos g
  set deleted_at = now()
  from jsonb_to_recordset(p_pagos) as r (id uuid, borrado boolean)
  where g.id = r.id
    and coalesce(r.borrado, false)
    and g.proyecto_id = v_fila.id
    and g.deleted_at is null;

  update public.gastos g
  set deleted_at = now()
  from jsonb_to_recordset(p_gastos) as r (id uuid, borrado boolean)
  where g.id = r.id
    and coalesce(r.borrado, false)
    and g.proyecto_id = v_fila.id
    and g.deleted_at is null;

  update public.opciones_de_presupuesto o
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where o.id = r.id
    and coalesce(r.borrado, false)
    and o.proyecto_id = v_fila.id
    and o.deleted_at is null;

  update public.necesidades n
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_necesidades, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where n.id = r.id
    and coalesce(r.borrado, false)
    and n.proyecto_id = v_fila.id
    and n.deleted_at is null;

  update public.proximos_contactos c
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_proximos, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where c.id = r.id
    and coalesce(r.borrado, false)
    and c.proyecto_id = v_fila.id
    and c.deleted_at is null;

  -- Vuelve el agregado entero: las filas vivas más las que este guardado dio de baja, para que el
  -- cliente las saque de su réplica sin esperar al próximo delta.
  return jsonb_build_object(
    'proyecto', to_jsonb(v_fila),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb)
      from public.pagos g
      where g.household_id = v_fila.household_id
        and g.proyecto_id = v_fila.id
        and (
          g.deleted_at is null
          or g.id in (select (r ->> 'id')::uuid from jsonb_array_elements(p_pagos) as r)
        )
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb)
      from public.gastos g
      where g.household_id = v_fila.household_id
        and g.proyecto_id = v_fila.id
        and (
          g.deleted_at is null
          or g.id in (select (r ->> 'id')::uuid from jsonb_array_elements(p_gastos) as r)
        )
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
      from public.opciones_de_presupuesto o
      where o.household_id = v_fila.household_id
        and o.proyecto_id = v_fila.id
        and (
          o.deleted_at is null
          or o.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_opciones, '[]'::jsonb)) as r
          )
        )
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
      from public.necesidades n
      where n.household_id = v_fila.household_id
        and n.proyecto_id = v_fila.id
        and (
          n.deleted_at is null
          or n.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_necesidades, '[]'::jsonb)) as r
          )
        )
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
      from public.proximos_contactos c
      where c.household_id = v_fila.household_id
        and c.proyecto_id = v_fila.id
        and (
          c.deleted_at is null
          or c.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_proximos, '[]'::jsonb)) as r
          )
        )
    )
  );
end;
$function$;

comment on function public.guardar_proyecto(jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) is
  'Guarda un proyecto con sus pagos, sus gastos, sus opciones de presupuesto, lo que hace falta para el trabajo y su próximo contacto en una sola transacción, idempotente por el id del proyecto. El alta es un upsert; la edición manda la version que vio el cliente y se rechaza con MN006 si la fila cambió. Las bajas de las filas hijas vienen marcadas con borrado en su propio array. Un pago sin fecha se rechaza con MN016: la fecha la manda la app (ADR 0063); la guarda de la tabla rechaza además una fecha que todavía no llegó y una marca de la apertura que no corresponde. Con opciones vivas, el presupuesto del proyecto sale de la opción aprobada y no de lo que manda el cliente. Entrar en seguimiento, cambiar la fecha y registrar el contacto viajan en p_proximos junto con el estado, y la guarda diferida exige que el trabajo en seguimiento tenga su contacto pendiente (MN019, ADR 0064); al entrar, la etapa a la que vuelve la pone la base. Hasta cuándo vale el presupuesto (presupuesto_vale_hasta), el día en que quedó listo (listo_el), la entrega comprometida con su franja y el tipo de proyecto se escriben solo si la clave viene en el pedido, como el vencimiento (ADR 0067 y 0071); con el trabajo en curso la entrega real va en null, y antes de aprobar el listo y la comprometida también. p_opciones, p_necesidades y p_proximos en null quieren decir "no toques eso", para que un bundle viejo no lo borre; lo mismo la clave ya_en_la_apertura de cada pago. La moneda del trabajo y la moneda, la cotización y el tesoro de cada pago usan el mismo patrón de la clave presente, y también la categoría de cada gasto (ADR 0084); sin la clave de la moneda (una app sin actualizar), cambiar el presupuesto o una opción de un trabajo en dólares, o el importe de un pago en dólares, rebota con MN038 (ADR 0081). Los cuatro costos estimados, su dólar y lo que te paga en no los escribe esta función: van por un update de sus columnas solas.';
