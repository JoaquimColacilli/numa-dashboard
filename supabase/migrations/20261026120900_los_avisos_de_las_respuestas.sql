-- Los avisos de lo nuevo (los detalles a mejorar de Eliseo, ADR 0036).
--
-- Las preferencias de avisos suman una séptima clave, respuestas («Respuestas de tus clientes»),
-- prendida, como se sumaron seguimientos y vencimientos: las filas que ya existen quedan como están, y
-- quien las lee les completa lo que falta con el valor inicial. Un bundle viejo que guarda cuatro, cinco
-- o seis claves no rebota.
--
-- Cuando un cliente aprueba desde su página, la base le pide a la función de avisos que lo avise en el
-- momento, por el mismo camino que el aviso de la mañana: pg_net, con avisos_url y avisos_secreto de
-- Vault. Ningún secreto nuevo, ninguna clave VAPID tocada, ningún servicio nuevo. Si no llega, el aviso
-- de la mañana lo repite.
--
-- El aviso de la mañana suma los pagos de los vencimientos que se pagaron solos, para decir cuánto se
-- pagó y cuánto puso Maun, y los gastos del mes anterior, porque el ciclo de un compromiso con día de
-- pago arranca en él.
--
-- Lo que autorizó el dueño: create or replace de avisos_bien_formados, avisos_completos y
-- avisos_por_mandar, el default nuevo de preferencias_de_avisos.avisos y un trigger nuevo en
-- respuestas_al_presupuesto. Ningún dato cambia.

CREATE OR REPLACE FUNCTION private.avisos_bien_formados(p_avisos jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    jsonb_typeof(p_avisos) = 'object'
    and (select array_agg(clave order by clave) from jsonb_object_keys(p_avisos) as clave) in (
      array['anotaciones', 'entregas', 'presupuestos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'vencimientos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'respuestas', 'seguimientos', 'vencimientos', 'visitas']
    )
    and (
      select bool_and(
        case
          when jsonb_typeof(valor) <> 'object' then false
          else jsonb_typeof(valor -> 'activo') = 'boolean'
            and coalesce(valor ->> 'anticipacion', '') in ('0', '1', '2', '3')
            and valor - 'activo' - 'anticipacion' = '{}'::jsonb
        end
      )
      from jsonb_each(p_avisos) as e (clave, valor)
    ),
    false
  )
$function$;

comment on function private.avisos_bien_formados(jsonb) is 'Qué avisa y con cuánta anticipación: las claves de AVISOS_DE_LA_AGENDA de @maun/domain, cada una con activo y una anticipación de 0 a 3 días. Acepta también las formas de antes, sin seguimientos, vencimientos ni respuestas, sin vencimientos ni respuestas o sin respuestas, para que un bundle viejo no rebote: quien la lee le completa lo que falta con avisos_completos.';

CREATE OR REPLACE FUNCTION private.avisos_completos(p_avisos jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
      'seguimientos', jsonb_build_object('activo', true, 'anticipacion', 0),
      'vencimientos', jsonb_build_object('activo', true, 'anticipacion', 0),
      'respuestas', jsonb_build_object('activo', true, 'anticipacion', 0)
    )
    || p_avisos
$function$;

comment on function private.avisos_completos(jsonb) is 'Las preferencias de avisos con todas las claves: a las que se guardaron antes de que existieran seguimientos, vencimientos o respuestas les agrega esas claves con su valor inicial (prendidas, el mismo día), sin reescribir la fila. Gemela de PREFERENCIAS_INICIALES de @maun/domain para esas claves.';

alter table private.preferencias_de_avisos alter column avisos set default '{
  "entregas": {"activo": true, "anticipacion": 2},
  "visitas": {"activo": true, "anticipacion": 1},
  "presupuestos": {"activo": true, "anticipacion": 1},
  "seguimientos": {"activo": true, "anticipacion": 0},
  "vencimientos": {"activo": true, "anticipacion": 0},
  "anotaciones": {"activo": false, "anticipacion": 0},
  "respuestas": {"activo": true, "anticipacion": 0}
}'::jsonb;

create function private.respuesta_para_el_aviso(p_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'proyecto_id', r.proyecto_id,
    'cliente', c.nombre,
    'estimativo', coalesce(v.contenido -> 'estimativo' = 'true'::jsonb, false),
    'letra', (
      select coalesce(nullif(o.valor ->> 'letra', ''), chr(64 + o.indice::integer))
      from jsonb_array_elements(
        case
          when v.contenido #>> '{valores,tipo}' = 'opciones'
            and jsonb_typeof(v.contenido #> '{valores,opciones}') = 'array'
          then v.contenido #> '{valores,opciones}'
          else '[]'::jsonb
        end
      ) with ordinality as o (valor, indice)
      where o.valor ->> 'id' = r.opcion_id::text
    ),
    'dia', r.dia,
    'franja', r.franja,
    'respondida_el', r.respondida_el
  )
  from public.respuestas_al_presupuesto r
  join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
  join public.clientes c on c.household_id = p.household_id and c.id = p.cliente_id
  join public.revisiones_del_presupuesto v on v.household_id = r.household_id and v.id = r.revision_id
  where r.id = p_id
$$;

revoke all on function private.respuesta_para_el_aviso(uuid) from public, anon, authenticated;

comment on function private.respuesta_para_el_aviso(uuid) is 'Una respuesta al presupuesto como la escribe el aviso: el nombre del cliente, si la revisión era un estimativo, la letra de la opción que aprobó (null con un solo total), el día y la franja que propone para medir, y el día en que contestó. La nota no viaja. La usan private.avisos_por_mandar y private.aviso_de_la_respuesta (los detalles a mejorar).';

CREATE OR REPLACE FUNCTION private.avisos_por_mandar(p_ahora timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with locales as (
    select
      s.id,
      s.user_id,
      s.endpoint,
      s.p256dh,
      s.auth,
      s.ultimo_dia_avisado,
      p.avisos,
      p.hora,
      p.zona,
      (p_ahora at time zone p.zona) as ahora_local
    from private.suscripciones_de_avisos s
    join private.preferencias_de_avisos p on p.user_id = s.user_id
  ),
  debidas as (
    select
      l.*,
      l.ahora_local::date as dia,
      (
        select m.household_id
        from public.household_members m
        where m.user_id = l.user_id and m.deleted_at is null
        order by m.created_at
        limit 1
      ) as household_id
    from locales l
    -- La hora local de cada persona, calculada acá con su zona: desde la hora que eligió y durante
    -- tres horas, una vez por día local.
    where l.ahora_local >= l.ahora_local::date + l.hora
      and l.ahora_local < l.ahora_local::date + l.hora + interval '3 hours'
      and (l.ultimo_dia_avisado is null or l.ultimo_dia_avisado < l.ahora_local::date)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'endpoint', d.endpoint,
        'p256dh', d.p256dh,
        'auth', d.auth,
        'dia', d.dia,
        -- La zona de la persona: con ella la función pasa fila_guardada_at al mes en que se guardó, que
        -- en las últimas horas del último día de un mes no es el mismo en UTC.
        'zona', d.zona,
        -- El idioma de la persona, el que eligió para su cuenta (ADR 0082): la función escribe el aviso
        -- en él. Si no eligió ninguno o no es uno de los tres, español, que es lo de siempre.
        'idioma', coalesce(
          (
            select u.raw_user_meta_data ->> 'idioma'
            from auth.users u
            where u.id = d.user_id and u.raw_user_meta_data ->> 'idioma' in ('es', 'en', 'pt-BR')
          ),
          'es'
        ),
        'preferencias', private.avisos_completos(d.avisos),
        -- Lo que aprobaron los clientes desde su página y el dueño todavía no atendió, de ayer y de hoy
        -- en el día de la persona: el aviso en el momento sale cuando llega la respuesta
        -- (private.pedir_el_aviso_de_la_respuesta), y el de la mañana lo repite por si no llegó.
        'respuestas', (
          select coalesce(jsonb_agg(private.respuesta_para_el_aviso(r.id) order by r.created_at), '[]'::jsonb)
          from public.respuestas_al_presupuesto r
          join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id and p.deleted_at is null
          where r.household_id = d.household_id
            and r.deleted_at is null
            and r.atendida_at is null
            and r.respondida_el >= d.dia - 1
        ),
        'filas', jsonb_build_object(
          'proyectos', (
            select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
            from public.proyectos p
            where p.household_id = d.household_id
              and p.deleted_at is null
              and p.estado in (
                'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
                'en_seguimiento', 'en_curso'
              )
          ),
          'clientes', (
            select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre, 'zona', c.zona)), '[]'::jsonb)
            from public.clientes c
            where c.household_id = d.household_id and c.deleted_at is null
          ),
          'anotaciones', (
            select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
            from public.anotaciones a
            where a.household_id = d.household_id
              and a.deleted_at is null
              and not a.hecha
              and a.fecha between d.dia and d.dia + 3
          ),
          -- A quién le toca volver a escribirle: los contactos pendientes de los próximos días. Lo
          -- registrado ya no se avisa.
          'proximos_contactos', (
            select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
            from public.proximos_contactos c
            where c.household_id = d.household_id
              and c.deleted_at is null
              and c.hecho_el is null
              and c.fecha between d.dia and d.dia + 3
          ),
          -- Los vencimientos salen de la fila del taller: los ajustes, con la fila y cuándo se guardó.
          'ajustes', (
            select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
            from public.ajustes a
            where a.household_id = d.household_id and a.deleted_at is null
          ),
          -- Todos los tesoros del taller, también los archivados, para el nombre de cada vencimiento.
          'tesoros', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from public.tesoros t
            where t.household_id = d.household_id and t.deleted_at is null
          ),
          -- Los gastos desde un tesoro de los meses que mira el aviso, del mes de hoy al de la mayor
          -- anticipación (que puede ser el siguiente), y del mes anterior: el ciclo de un compromiso con
          -- día de pago arranca en el vencimiento anterior (los tipos de tesoro). Con ellos se sabe qué
          -- renglón ya se pagó y cuánto falta pagar para cada vencimiento; también los que cuentan para
          -- un vencimiento de esos meses aunque su fecha sea de antes.
          'movimientos', (
            select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
            from public.movimientos m
            where m.household_id = d.household_id
              and m.deleted_at is null
              and m.tipo = 'gasto'
              and m.desde_id is not null
              and (
                m.fecha >= (date_trunc('month', d.dia) - interval '1 month')::date
                or m.vencimiento >= date_trunc('month', d.dia)::date
              )
              and m.fecha < (date_trunc('month', d.dia + 3) + interval '1 month')::date
          ),
          -- Los pagos de los vencimientos que se pagaron solos en los meses que mira el aviso: el de hoy
          -- dice cuánto se pagó y cuánto puso Maun (los tipos de tesoro).
          'pagos_de_vencimientos', (
            select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
            from public.pagos_de_vencimientos v
            where v.household_id = d.household_id
              and v.deleted_at is null
              and v.vencimiento >= date_trunc('month', d.dia)::date
              and v.vencimiento < (date_trunc('month', d.dia + 3) + interval '1 month')::date
          )
        )
      )
      order by d.id
    ),
    '[]'::jsonb
  )
  from debidas d
  where d.household_id is not null
$function$;

comment on function private.avisos_por_mandar(timestamp with time zone) is 'Los dispositivos a los que les toca el aviso de la mañana en este momento, según la zona horaria y la hora de cada persona, con su zona, el idioma de su cuenta (es si no eligió uno de los tres, ADR 0082) y los datos de su taller que necesita la agenda: los trabajos, los clientes, las anotaciones, los contactos en seguimiento pendientes y, para los vencimientos de los compromisos, los ajustes con la fila, los tesoros, los gastos desde un tesoro de los meses que mira el aviso y del anterior, y los pagos de los vencimientos que se pagaron solos. Trae además, fuera de filas, las respuestas de los clientes de ayer y de hoy que el dueño no atendió, ya armadas con private.respuesta_para_el_aviso (los detalles a mejorar). Qué avisar lo decide eventosParaAvisar de @maun/domain en la función de borde, no esta consulta.';

create function private.aviso_de_la_respuesta(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'endpoint', s.endpoint,
        'p256dh', s.p256dh,
        'auth', s.auth,
        'idioma', coalesce(
          (
            select u.raw_user_meta_data ->> 'idioma'
            from auth.users u
            where u.id = s.user_id and u.raw_user_meta_data ->> 'idioma' in ('es', 'en', 'pt-BR')
          ),
          'es'
        ),
        'respuesta', private.respuesta_para_el_aviso(r.id)
      )
      order by s.id
    ),
    '[]'::jsonb
  )
  from public.respuestas_al_presupuesto r
  join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id and p.deleted_at is null
  join public.household_members m on m.household_id = r.household_id and m.deleted_at is null
  join private.suscripciones_de_avisos s on s.user_id = m.user_id
  left join private.preferencias_de_avisos pr on pr.user_id = s.user_id
  where r.id = p_id
    and r.deleted_at is null
    and r.atendida_at is null
    and private.avisos_completos(coalesce(pr.avisos, '{}'::jsonb)) #> '{respuestas,activo}' = 'true'::jsonb
$$;

revoke all on function private.aviso_de_la_respuesta(uuid) from public, anon, authenticated;
grant execute on function private.aviso_de_la_respuesta(uuid) to service_role;

comment on function private.aviso_de_la_respuesta(uuid) is 'Los dispositivos de los miembros del taller que tienen prendidas las respuestas de los clientes, con el idioma de cada cuenta y la respuesta armada para el aviso, mientras siga sin atender. Vacío si ya se atendió, se borró o el trabajo ya no está. Solo para la función de borde de los avisos (service_role), en la ruta /respuesta (los detalles a mejorar).';

create function public.aviso_de_la_respuesta(p_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.aviso_de_la_respuesta(p_id)
$$;

revoke all on function public.aviso_de_la_respuesta(uuid) from public, anon, authenticated;
grant execute on function public.aviso_de_la_respuesta(uuid) to service_role;

comment on function public.aviso_de_la_respuesta(uuid) is 'Solo para la función de borde de los avisos (service_role).';

create function private.pedir_el_aviso_de_la_respuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secreto text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'avisos_url';
  select decrypted_secret into v_secreto from vault.decrypted_secrets where name = 'avisos_secreto';
  if v_url is null or v_secreto is null then
    return null;
  end if;

  -- La aprobación del cliente vale más que el aviso: si el pedido no se puede encolar, la respuesta
  -- queda igual y la repite el aviso de la mañana.
  begin
    perform net.http_post(
      url := rtrim(v_url, '/') || '/respuesta',
      body := jsonb_build_object('respuesta', new.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secreto
      ),
      timeout_milliseconds := 30000
    );
  exception when others then
    raise warning 'no se pudo pedir el aviso de la respuesta %: % (%)', new.id, sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

revoke all on function private.pedir_el_aviso_de_la_respuesta() from public, anon, authenticated;

comment on function private.pedir_el_aviso_de_la_respuesta() is 'Le pide a la función de avisos, en la ruta /respuesta y con el secreto del trabajo, que avise en el momento la respuesta que acaba de llegar. Sin avisos_url y avisos_secreto en Vault no pide nada. pg_net manda el pedido recién cuando la transacción confirma: una respuesta que se deshace no avisa. Si el pedido no se puede encolar, la respuesta queda igual y la repite el aviso de la mañana (los detalles a mejorar).';

create trigger avisar_la_respuesta
  after insert on public.respuestas_al_presupuesto
  for each row execute function private.pedir_el_aviso_de_la_respuesta();
