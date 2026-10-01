-- El idioma de los clientes del taller (ADR 0082): en qué idioma leen los clientes su página, la
-- encuesta, el presupuesto en PDF y los mensajes que les manda el dueño, y en cuál se armó cada
-- revisión del presupuesto que se les mandó.
--
-- Aditiva: dos columnas con su default ('es', lo de hoy) y su check, que las filas de hoy cumplen por
-- ese default. mandar_el_presupuesto suma un parámetro con default (drop y create de las dos, con sus
-- grants): la app nueva manda el idioma con el que armó el documento, y una app sin actualizar no lo
-- manda y la base toma el de los clientes del taller. No alcanza con leer ajustes: la cola es de cada
-- aparato, y el dueño puede cambiar el idioma en la compu y mandar un presupuesto desde el celular.
--
-- Lo que lee el cliente suma el idioma: la vista del cliente (y con ella la del enlace), el de la
-- revisión adentro de su presupuesto, la encuesta y el título de la vista previa. El idioma no dice
-- nada del trabajo: sumarlo al título es una enmienda del ADR 0049.


-- Las dos columnas ------------------------------------------------------------------------------------

alter table public.ajustes
  add column idioma_de_los_clientes text not null default 'es',
  add constraint ajustes_idioma_de_los_clientes_valido check (idioma_de_los_clientes in ('es', 'en', 'pt-BR'));

comment on column public.ajustes.idioma_de_los_clientes is
  'El idioma en que leen los clientes del taller: es, en o pt-BR, con una lista y no con un formato, como las monedas. Es el de su página, la encuesta, el presupuesto que se arma desde ahora y los mensajes de WhatsApp que les manda el dueño, aunque él use la app en otro. Lo que escribió el dueño (sus textos del presupuesto, sus preguntas) queda como lo escribió. Viaja a la vista del cliente, a la encuesta y al título de la vista previa (ADR 0082).';

grant update (idioma_de_los_clientes) on table public.ajustes to authenticated;

alter table public.revisiones_del_presupuesto
  add column idioma text not null default 'es',
  add constraint revisiones_del_presupuesto_idioma_valido check (idioma in ('es', 'en', 'pt-BR'));

comment on column public.revisiones_del_presupuesto.idioma is
  'El idioma en que se armó esta revisión, el de su contenido: con él la página del cliente y el PDF escriben sus etiquetas, su plata y sus fechas. Lo manda la app al mandarla; si no viene (una app sin actualizar), es el de los clientes del taller en ese momento. Las revisiones de antes quedaron en es (ADR 0082).';


-- Mandar el presupuesto con su idioma -----------------------------------------------------------------

drop function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date);
drop function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date);

create function private.mandar_el_presupuesto(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_version integer,
  p_documento jsonb,
  p_que_cambio text,
  p_mandado_el date,
  p_vale_hasta date,
  p_idioma text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_household uuid := private.household_actual();
  v_proyecto_id uuid;
  v_proyecto public.proyectos;
  v_ajustes public.ajustes;
  v_presupuesto public.presupuestos;
  v_revision public.revisiones_del_presupuesto;
  v_siguiente integer;
  v_del_dia integer;
  v_problema text;
  v_falta text[];
  v_vivos jsonb;
  v_mandados jsonb;
  v_pagado bigint;
  v_distintos text[] := array[]::text[];
begin
  if num_nulls(p_presupuesto_id, p_revision_id, p_version, p_documento, p_mandado_el) > 0 then
    raise exception 'Mandar el presupuesto necesita el borrador, la revisión, la revisión que viste, el documento y el día'
      using errcode = '22004';
  end if;

  -- El trabajo del borrador. Se lee sin candado: un borrador nunca cambia de trabajo.
  select b.proyecto_id into v_proyecto_id
  from public.presupuestos b
  where b.household_id = v_household and b.id = p_presupuesto_id;

  if not found then
    raise exception 'El presupuesto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- Los candados en el orden de la liquidación: el trabajo y después los ajustes del taller. Con el
  -- trabajo, un reintento del mismo envío espera al primero; con los ajustes, dos envíos del mismo
  -- taller cuentan los números del día de a uno.
  select p.* into v_proyecto
  from public.proyectos p
  where p.household_id = v_household and p.id = v_proyecto_id
  for update;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_household
  for no key update;

  -- El reenvío de la cola, mirado con los dos candados tomados: este envío ya se congeló y la respuesta
  -- se perdió. Se devuelve lo que quedó, sin congelar ni numerar dos veces.
  select r.* into v_revision
  from public.revisiones_del_presupuesto r
  where r.household_id = v_household and r.id = p_revision_id;

  if found then
    if v_revision.presupuesto_id <> p_presupuesto_id then
      raise exception 'El presupuesto no se pudo mandar.'
        using errcode = 'MN031',
              detail = 'revisión de otro presupuesto',
              hint = 'Revisalo y probá de nuevo.';
    end if;

    select b.* into v_presupuesto
    from public.presupuestos b
    where b.household_id = v_household and b.id = p_presupuesto_id;

    return jsonb_build_object(
      'revision', to_jsonb(v_revision),
      'presupuesto', to_jsonb(v_presupuesto),
      'proyecto', to_jsonb(v_proyecto),
      'proximos_contactos', (
        select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
        from public.proximos_contactos c
        where c.household_id = v_household and c.proyecto_id = v_proyecto.id
      )
    );
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  -- Con el trabajo bloqueado, el borrador no cambia más hasta que esto termine.
  select b.* into v_presupuesto
  from public.presupuestos b
  where b.household_id = v_household and b.id = p_presupuesto_id;

  if v_presupuesto.borrador_version <> p_version then
    raise exception 'Este presupuesto se cambió en otro aparato.'
      using errcode = 'MN026',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_presupuesto.borrador_version),
            hint = 'Abrilo de nuevo para ver la última versión y seguí desde ahí.';
  end if;

  -- Después de aprobado no hay revisiones: un cambio después de la seña es un adicional.
  if v_proyecto.estado in ('en_curso', 'entregado', 'cobrado') then
    raise exception 'Ya lo aprobó: el presupuesto no se cambia.'
      using errcode = 'MN028',
            detail = v_proyecto.estado::text,
            hint = 'Un cambio después de la seña se arregla aparte con tu cliente.';
  end if;

  if v_proyecto.estado = 'perdido' then
    raise exception 'Este trabajo está perdido: el presupuesto no se manda.'
      using errcode = 'MN032',
            detail = 'perdido',
            hint = 'Si el cliente volvió, reactivalo desde la ficha y mandalo desde ahí.';
  end if;

  if p_mandado_el > private.hoy_en_el_taller() then
    raise exception 'El día del envío todavía no llegó.'
      using errcode = 'MN033',
            detail = format('mandado el %s, hoy %s', p_mandado_el, private.hoy_en_el_taller()),
            hint = 'Revisá la fecha del aparato y volvé a mandarlo.';
  end if;

  -- El idioma con el que la app armó el documento: uno de los tres. Sin él (una app sin actualizar),
  -- vale el de los clientes del taller.
  if p_idioma is not null and p_idioma not in ('es', 'en', 'pt-BR') then
    raise exception 'El presupuesto no se pudo mandar.'
      using errcode = 'MN031',
            detail = 'idioma',
            hint = 'Revisalo y probá de nuevo.';
  end if;

  v_problema := private.problema_del_documento(p_documento);
  if v_problema is not null then
    raise exception 'El presupuesto no se pudo mandar.'
      using errcode = 'MN031',
            detail = v_problema,
            hint = 'Revisalo y probá de nuevo.';
  end if;

  select coalesce(max(r.revision), 0) + 1 into v_siguiente
  from public.revisiones_del_presupuesto r
  where r.household_id = v_household and r.presupuesto_id = v_presupuesto.id;

  v_falta := private.lo_que_falta_para_mandar(p_documento, v_siguiente, p_que_cambio);
  if cardinality(v_falta) > 0 then
    raise exception 'Al presupuesto le falta algo para mandarlo.'
      using errcode = 'MN027',
            detail = array_to_string(v_falta, ', '),
            hint = 'Revisá que tenga título, por lo menos un mueble con su detalle y un total.';
  end if;

  -- Los importes que vio la app contra los vivos, como el control de lo que vio la app de la
  -- liquidación: las opciones (ids, importes y orden por id) o el total, el porcentaje de seña efectivo
  -- y lo pagado hasta hoy. Si no coinciden, no se congela nada.
  select coalesce(jsonb_agg(jsonb_build_array(o.id::text, o.monto_centavos) order by o.id), '[]'::jsonb)
  into v_vivos
  from public.opciones_de_presupuesto o
  where o.household_id = v_household and o.proyecto_id = v_proyecto.id and o.deleted_at is null;

  v_vivos := case
    when jsonb_array_length(v_vivos) > 0 then jsonb_build_object('opciones', v_vivos)
    when v_proyecto.presupuesto_centavos is not null then
      jsonb_build_object('total', v_proyecto.presupuesto_centavos)
    else 'null'::jsonb
  end;

  v_mandados := case
    when p_documento #>> '{valores,tipo}' = 'opciones' then jsonb_build_object(
      'opciones', (
        select coalesce(jsonb_agg(jsonb_build_array(e.valor ->> 'id', e.valor -> 'total') order by e.orden), '[]'::jsonb)
        from jsonb_array_elements(p_documento #> '{valores,opciones}') with ordinality as e (valor, orden)
      )
    )
    when p_documento #>> '{valores,tipo}' = 'total' then
      jsonb_build_object('total', p_documento #> '{valores,total}')
    else 'null'::jsonb
  end;

  if v_vivos is distinct from v_mandados then
    v_distintos := v_distintos || 'valores'::text;
  end if;

  if p_documento -> 'senaBp' is distinct from to_jsonb(coalesce(v_proyecto.sena_bp, v_ajustes.sena_bp)) then
    v_distintos := v_distintos || 'sena'::text;
  end if;

  select coalesce(sum(g.monto_centavos), 0) into v_pagado
  from public.pagos g
  where g.household_id = v_household and g.proyecto_id = v_proyecto.id and g.deleted_at is null;

  if p_documento -> 'abonado' is distinct from to_jsonb(v_pagado) then
    v_distintos := v_distintos || 'abonado'::text;
  end if;

  if cardinality(v_distintos) > 0 then
    raise exception 'Cambiaron los importes desde que lo armaste.'
      using errcode = 'MN029',
            detail = array_to_string(v_distintos, ', '),
            hint = 'Revisá los valores y volvé a mandarlo.';
  end if;

  -- El número, en el primer envío: el día y el siguiente de ese día en el taller, contando los
  -- borrados, así un número no se reusa. Los ajustes bloqueados ordenan a dos envíos del mismo taller.
  if v_presupuesto.numero is null then
    select coalesce(max(split_part(r.numero, '-', 2)::integer), 0) + 1 into v_del_dia
    from public.revisiones_del_presupuesto r
    where r.household_id = v_household
      and r.numero like to_char(p_mandado_el, 'YYYYMMDD') || '-%';

    update public.presupuestos set
      numero = to_char(p_mandado_el, 'YYYYMMDD') || '-'
        || lpad(v_del_dia::text, greatest(2, char_length(v_del_dia::text)), '0')
    where id = v_presupuesto.id
    returning * into v_presupuesto;
  end if;

  insert into public.revisiones_del_presupuesto (
    id, household_id, presupuesto_id, proyecto_id, revision, numero, mandado_el, vale_hasta, que_cambio,
    contenido, idioma
  ) values (
    p_revision_id, v_household, v_presupuesto.id, v_proyecto.id, v_siguiente, v_presupuesto.numero,
    p_mandado_el, p_vale_hasta,
    case
      when v_siguiente > 1 then regexp_replace(p_que_cambio, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    end,
    p_documento,
    coalesce(p_idioma, v_ajustes.idioma_de_los_clientes)
  )
  returning * into v_revision;

  -- Lo mismo que hace hoy «Mandé el presupuesto», más el documento: la etapa si estaba antes (o en
  -- seguimiento, que cierra su contacto pendiente con el trigger de siempre), la vigencia, el último
  -- contacto y la tarea del presupuesto tildada. El trigger de siempre anota el cambio de estado.
  update public.proyectos set
    estado = case
      when estado <> 'presupuesto_enviado' and private.transicion_valida(estado, 'presupuesto_enviado')
        then 'presupuesto_enviado'::public.estado_proyecto
      else estado
    end,
    presupuesto_vale_hasta = p_vale_hasta,
    ultimo_contacto = p_mandado_el,
    presupuesto_pdf = true
  where id = v_proyecto.id
  returning * into v_proyecto;

  return jsonb_build_object(
    'revision', to_jsonb(v_revision),
    'presupuesto', to_jsonb(v_presupuesto),
    'proyecto', to_jsonb(v_proyecto),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
      from public.proximos_contactos c
      where c.household_id = v_household and c.proyecto_id = v_proyecto.id
    )
  );
end;
$function$;

comment on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) is
  'Manda el presupuesto, en una transacción: bloquea el trabajo y después los ajustes del taller; si la revisión ya existe la devuelve (el reenvío); rechaza si el borrador cambió (MN026), si el trabajo está aprobado (MN028) o perdido (MN032), si el día del envío no llegó (MN033), si el idioma no es uno de los tres o el documento no tiene la forma (MN031), si le falta algo para mandarlo (MN027) o si sus importes, su seña o lo pagado no son los del trabajo (MN029); en el primer envío le pone número; congela la revisión siguiente con el idioma en que la app la armó (sin él, una app sin actualizar, el de los clientes del taller, ADR 0082) y pasa el trabajo a presupuesto enviado con la vigencia, el último contacto y la tarea tildada. Devuelve la revisión, el borrador, el trabajo y sus próximos contactos. Toda lectura filtra por el taller de la sesión, también la del reenvío (ADR 0080).';

revoke all on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) from public, anon, authenticated;
grant execute on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) to authenticated;

create function public.mandar_el_presupuesto(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_version integer,
  p_documento jsonb,
  p_que_cambio text,
  p_mandado_el date,
  p_vale_hasta date,
  p_idioma text default null
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id, p_version, p_documento, p_que_cambio, p_mandado_el, p_vale_hasta,
    p_idioma
  )
$$;

comment on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) is
  'RPC de la hoja de mandar: congela una revisión del presupuesto con el documento que armó la app, en el idioma con que lo armó, y devuelve la revisión, el borrador, el trabajo y sus próximos contactos para la réplica. El idioma tiene default: una app sin actualizar lo llama como antes (ADR 0082). Ver private.mandar_el_presupuesto().';

revoke all on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) from public, anon, authenticated;
grant execute on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) to authenticated;


-- Lo que lee el cliente -------------------------------------------------------------------------------

create or replace function public.vista_del_cliente(p_proyecto_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $function$
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

  -- El presupuesto existe para el cliente desde que se le manda. Antes, lo que haya en
  -- presupuesto_centavos es un borrador, o el número de un estimativo, y no viaja.
  v_precio := case when v_presupuesto_mandado then v_p.presupuesto_centavos end;
  v_sena_bp := coalesce(v_p.sena_bp, v_ajustes.sena_bp, 5000);

  select coalesce(sum(g.monto_centavos), 0) into v_pagado
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

  -- Con todo pagado no hay ninguna instancia, así que tampoco hay formas ni datos de la cuenta.
  if v_instancia is null then
    v_formas := array[]::public.forma_de_cobro[];
  elsif v_instancia = 'sena' then
    v_formas := private.formas_de_cobro(v_p.cobro_sena, v_hay_como_transferir);
  else
    v_formas := private.formas_de_cobro(v_p.cobro_saldo, v_hay_como_transferir);
  end if;

  v_por_transferencia := 'transferencia' = any (v_formas);

  if v_instancia_despues is null then
    v_siguiente := null;
  else
    v_siguiente := jsonb_build_object(
      'instancia', v_instancia_despues,
      'formas', to_jsonb(
        case
          when v_instancia_despues = 'sena'
            then private.formas_de_cobro(v_p.cobro_sena, v_hay_como_transferir)
          else private.formas_de_cobro(v_p.cobro_saldo, v_hay_como_transferir)
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
            'monto_centavos', g.monto_centavos
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
    'presupuesto', v_presupuesto
  );
end;
$function$;

comment on function public.vista_del_cliente(uuid) is
  'Lo único que un cliente puede ver de su trabajo, y cada dato recién desde la etapa en la que es cierto (ADR 0067): el presupuesto desde que se le manda; la dirección de entrega, el día de inicio, la entrega estimada (la clave entrega_pautada, que no se renombró) y el día de la aprobación desde que aprueba; el día en que el mueble quedó listo desde que lo está; el día de la entrega desde que se entrega. Antes de esas etapas no viajan, aunque estén cargados: un campo cargado no es un hecho. Devuelve cuánto vale, cuánto pagó, en qué anda, la seña en pesos, qué pago le toca ahora, cuánto es, cómo puede pagarlo y cuál viene después (antes de aprobar solo se le pide la seña), hasta cuándo vale el presupuesto mientras espera la seña, los archivos que el dueño marcó, el día que se le mandó el estimativo y el día de la visita para medir con si ya se fue. La clave entrega trae la entrega comprometida mientras el trabajo está en curso, y la propuesta de entrega vigente con lo último que contestó el cliente solo con el trabajo en curso, listo y sin comprometida (ADR 0071). La clave vidriera trae, en todas las etapas, las redes del taller y hasta 12 fotos de su vidriera con la ruta de cada una, solo del taller del trabajo (ADR 0076). La clave presupuesto trae el presupuesto que se le mandó desde la app (ADR 0080): null antes de mandarlo o si nunca se mandó desde la app; esperando la seña, la última revisión tal cual (numero, revision, mandado_el, que_cambio y contenido, con las opciones y la obra adentro); desde que aprueba, la última revisión sin que_cambio, con las opciones del contenido filtradas a la aprobada, más aceptado_el y la letra de esa opción: las que no eligió no viajan. Los datos del taller para el presupuesto viajan solo adentro del contenido de cada revisión. La clave idioma trae el idioma de los clientes del taller, en el que habla la página, y el presupuesto trae el de su revisión, en el que se armó (ADR 0082). Enumera los campos uno por uno y nunca devuelve la fila entera: convertirla en un select * expondría cada columna nueva de proyectos sin que nadie lo decida, costos estimados, margen y tipo de proyecto incluidos. Un trabajo en seguimiento se muestra en la etapa en la que estaba: el «por ahora no» y su próximo contacto son del taller y no viajan (ADR 0064). Del estimativo viaja el día, nunca un importe. De la visita viajan el día y la marca, no la hora. De ajustes viajan exactamente los cinco campos de cobro —los cuatro de la cuenta y el link de Mercado Pago—, y solo cuando el pago que toca AHORA se ofrece por transferencia: lo que no se muestra, no se manda; los tres links de las redes, siempre; y el valor del relevamiento técnico (relevamiento_centavos) solo antes de mandar el presupuesto, en null después o si el dueño lo dejó vacío (ADR 0079). El porcentaje de seña y los días que vale un presupuesto no viajan nunca; lo que viaja son el importe y la fecha que salen de ellos. Es security invoker: desde la app la llama el dueño y la RLS decide; desde el link la llama public.vista_compartida(), que ya resolvió el token (ADR 0046, 0048, 0053, 0054, 0058, 0067, 0071, 0076, 0079, 0080 y 0082).';

create or replace function public.titulo_compartido(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_enlace public.enlaces_publicos;
  v_p public.proyectos;
  v_taller text;
  v_idioma text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    return null;
  end if;

  select * into v_enlace
  from public.enlaces_publicos e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocado_at is null
    and e.deleted_at is null;

  if not found then
    return null;
  end if;

  select * into v_p
  from public.proyectos p
  where p.id = v_enlace.proyecto_id
    and p.deleted_at is null
    and p.estado <> 'perdido';

  if not found then
    return null;
  end if;

  select h.nombre into v_taller from public.households h where h.id = v_p.household_id;

  select a.idioma_de_los_clientes into v_idioma from public.ajustes a where a.household_id = v_p.household_id;

  return jsonb_build_object('trabajo', v_p.titulo, 'taller', v_taller, 'idioma', coalesce(v_idioma, 'es'));
end;
$function$;

comment on function public.titulo_compartido(text) is
  'Devuelve solamente el título del trabajo, el nombre del taller y el idioma de sus clientes, y no llama a public.vista_del_cliente(). El idioma es con el que la vista previa escribe su texto y el lang de la página: no dice nada del trabajo, y sumarlo es la enmienda del ADR 0049 que hace el ADR 0082. Tiene que ser así por dos motivos. El primero es qué pide quien la llama: la vista previa que arma WhatsApp cuando se pega el enlace queda guardada en el chat, así que ahí no puede ir ni un importe, ni la etapa, ni el nombre ni la dirección del cliente, que son justamente las cosas que sí devuelve la vista. El segundo es quién la llama: la pide un rastreador, no una persona, y la vista cuenta cada lectura como una visita del cliente (public.vista_compartida incrementa visitas). Si la vista previa usara esa puerta, el contador que el dueño mira en la pantalla de compartir contaría robots. Es stable a propósito: no escribe nada. Un token inválido, uno dado de baja, uno inexistente y un trabajo perdido devuelven null, los cuatro iguales (ADR 0049).';

create or replace function public.encuesta_compartida(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_encuesta public.encuestas_enviadas;
  v_proyecto public.proyectos;
  v_respuesta public.respuestas;
begin
  -- Un token que no tiene la forma de un token no llega ni a consultarse.
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_encuesta
  from public.encuestas_enviadas e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocada_at is null
    and e.deleted_at is null;

  -- Inexistente, dado de baja, de un trabajo borrado o de uno perdido contestan exactamente lo
  -- mismo, y lo mismo que la vista del cliente: el que tiene el enlace no se entera de nada.
  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_proyecto
  from public.proyectos p
  where p.household_id = v_encuesta.household_id
    and p.id = v_encuesta.proyecto_id
    and p.deleted_at is null
    and p.estado <> 'perdido';

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_respuesta
  from public.respuestas r
  where r.household_id = v_encuesta.household_id
    and r.encuesta_id = v_encuesta.id
    and r.deleted_at is null;

  -- Los campos van enumerados uno por uno, también los de cada pregunta: lo que el cliente ve se
  -- decide acá. supabase/tests/27_encuesta_publica.sql falla apenas aparece una columna nueva en
  -- cualquiera de las tablas que esta función lee, hasta que alguien decide si viaja.
  return jsonb_build_object(
    'taller', (select h.nombre from public.households h where h.id = v_encuesta.household_id),
    -- Del cliente, solo la primera palabra del nombre: la encuesta le dice «Gracias, Marcela».
    'cliente', (
      select nullif(split_part(btrim(c.nombre), ' ', 1), '') from public.clientes c
      where c.household_id = v_proyecto.household_id and c.id = v_proyecto.cliente_id
    ),
    'trabajo', v_proyecto.titulo,
    'resena', (
      select nullif(a.resena_link, '') from public.ajustes a
      where a.household_id = v_encuesta.household_id
    ),
    -- El idioma de los clientes del taller: la encuesta habla en él (ADR 0082). Las preguntas quedan
    -- como las escribió el dueño.
    'idioma', coalesce(
      (select a.idioma_de_los_clientes from public.ajustes a where a.household_id = v_encuesta.household_id),
      'es'
    ),
    'preguntas', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', p -> 'id',
            'texto', p -> 'texto',
            'tipo', p -> 'tipo',
            'escala', p -> 'escala',
            'obligatoria', p -> 'obligatoria',
            'opciones', p -> 'opciones',
            'propia', p -> 'propia'
          )
          order by t.orden
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(private.preguntas_de_la_encuesta(v_encuesta)) with ordinality as t (p, orden)
    ),
    'contestada', case
      when v_respuesta.id is null then null
      else jsonb_build_object(
        'fecha', (v_respuesta.contestada_at at time zone 'America/Argentina/Buenos_Aires')::date,
        'renglones', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'pregunta', g.pregunta_id,
                'valor', case g.tipo
                  when 'varias' then to_jsonb(g.valor_opciones)
                  when 'texto' then to_jsonb(g.valor_texto)
                  else to_jsonb(g.valor_numero)
                end
              )
              order by g.id
            ),
            '[]'::jsonb
          )
          from public.renglones_de_respuesta g
          where g.household_id = v_respuesta.household_id
            and g.respuesta_id = v_respuesta.id
            and g.deleted_at is null
        )
      )
    end
  );
end;
$function$;

comment on function public.encuesta_compartida(text) is
  'La encuesta de un enlace, para el cliente que lo abre sin sesión. Es una de las dos únicas funciones que el rol anónimo puede ejecutar. PUEDE: resolver el token contra su sha256 y devolver el nombre del taller, la primera palabra del nombre del cliente, el título del trabajo, el enlace de reseña del taller, el idioma de sus clientes (ADR 0082), las preguntas de ese enlace (la foto que se tomó al mandarlo más las propias del trabajo, cada una con id, texto, tipo, escala, obligatoria, opciones y si es propia) y, si ya contestó, qué contestó y cuándo. NO PUEDE: devolver un importe, un pago, la etapa, la dirección, el teléfono ni ningún otro dato del cliente o del trabajo; devolver nada de otro trabajo ni de otro taller; escribir nada, ni siquiera una visita (es stable, y por eso la usa también la vista previa del enlace). Un enlace inválido, dado de baja, de un trabajo borrado o perdido contestan lo mismo, MN010, sin decir si existió (ADR 0057).';
