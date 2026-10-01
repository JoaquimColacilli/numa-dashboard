-- El idioma de los avisos (ADR 0082): cada aviso de la mañana sale en el idioma que la persona eligió
-- para su cuenta, que vive en user_metadata.idioma de auth.users. private.avisos_por_mandar lo devuelve
-- con cada dispositivo, validado contra los tres; si no está o no es uno de ellos, 'es', así el aviso
-- de quien no eligió nada sale como hoy. La función de borde tolera que no venga.
--
-- Solo cambia el jsonb que devuelve: la firma y los grants quedan.

create or replace function private.avisos_por_mandar(p_ahora timestamp with time zone)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
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
          -- anticipación (que puede ser el siguiente): con ellos se sabe qué renglón ya se pagó.
          'movimientos', (
            select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
            from public.movimientos m
            where m.household_id = d.household_id
              and m.deleted_at is null
              and m.tipo = 'gasto'
              and m.desde_id is not null
              and m.fecha >= date_trunc('month', d.dia)::date
              and m.fecha < (date_trunc('month', d.dia + 3) + interval '1 month')::date
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

comment on function private.avisos_por_mandar(timestamp with time zone) is
  'Los dispositivos a los que les toca el aviso de la mañana en este momento, según la zona horaria y la hora de cada persona, con su zona, el idioma de su cuenta (es si no eligió uno de los tres, ADR 0082) y los datos de su taller que necesita la agenda: los trabajos, los clientes, las anotaciones, los contactos en seguimiento pendientes y, para los vencimientos de los compromisos, los ajustes con la fila, los tesoros y los gastos desde un tesoro de los meses que mira el aviso. Qué avisar lo decide eventosParaAvisar de @maun/domain en la función de borde, no esta consulta.';
