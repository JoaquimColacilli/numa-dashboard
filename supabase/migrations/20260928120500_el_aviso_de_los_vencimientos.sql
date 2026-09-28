-- El aviso de la mañana también dice qué compromiso vence (ADR 0036 y 0078, los tipos de tesoro).
--
-- Las preferencias de avisos suman una sexta clave, vencimientos, prendida y para el mismo día, como
-- se sumó seguimientos (migración 20260923150000_el_aviso_del_seguimiento). Las filas que ya existen
-- quedan como están: con cuatro o cinco claves siguen siendo válidas, y quien las lee (la pantalla de
-- avisos y el aviso de la mañana) les completa lo que falta con el valor inicial. Así ninguna fila
-- cambia, y un bundle viejo que guarda cuatro o cinco claves no rebota.
--
-- Los vencimientos no se guardan: salen de la fila del taller, de los días de pago de sus renglones.
-- Por eso private.avisos_por_mandar() suma a filas tres claves con el mismo patrón que las que ya
-- tiene (arreglos de filas completas, para leerlas como las filas de su tabla): ajustes, con la fila
-- del taller y cuándo se guardó; tesoros, todos los del taller, archivados incluidos, para los
-- nombres; y movimientos, solo los gastos vivos desde un tesoro de los meses que mira el aviso, que
-- pueden ser dos, para saber qué renglón ya se pagó. No son public.gastos: esos son los gastos de los
-- trabajos. Cada aviso suma además la zona de la persona, con la que la función lee en qué mes se
-- guardó la fila.
--
-- Lo que autorizó el dueño aunque la regla lo cuente como destructivo, porque no cambia ningún dato:
-- create or replace de avisos_completos, avisos_bien_formados y avisos_por_mandar, y el default nuevo
-- de preferencias_de_avisos.avisos.

create or replace function private.avisos_bien_formados(p_avisos jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_avisos) = 'object'
    and (select array_agg(clave order by clave) from jsonb_object_keys(p_avisos) as clave) in (
      array['anotaciones', 'entregas', 'presupuestos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'vencimientos', 'visitas']
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
$$;

comment on function private.avisos_bien_formados(jsonb) is
  'Qué avisa y con cuánta anticipación: las claves de AVISOS_DE_LA_AGENDA de @maun/domain, cada una con activo y una anticipación de 0 a 3 días. Acepta también las formas de antes, sin seguimientos ni vencimientos o sin vencimientos, para que un bundle viejo no rebote: quien la lee le completa lo que falta con avisos_completos.';

create or replace function private.avisos_completos(p_avisos jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
      'seguimientos', jsonb_build_object('activo', true, 'anticipacion', 0),
      'vencimientos', jsonb_build_object('activo', true, 'anticipacion', 0)
    )
    || p_avisos
$$;

comment on function private.avisos_completos(jsonb) is
  'Las preferencias de avisos con todas las claves: a las que se guardaron antes de que existieran seguimientos o vencimientos les agrega esas claves con su valor inicial (prendidas, el mismo día), sin reescribir la fila. Gemela de PREFERENCIAS_INICIALES de @maun/domain para esas claves.';

alter table private.preferencias_de_avisos alter column avisos set default '{
  "entregas": {"activo": true, "anticipacion": 2},
  "visitas": {"activo": true, "anticipacion": 1},
  "presupuestos": {"activo": true, "anticipacion": 1},
  "seguimientos": {"activo": true, "anticipacion": 0},
  "vencimientos": {"activo": true, "anticipacion": 0},
  "anotaciones": {"activo": false, "anticipacion": 0}
}'::jsonb;

create or replace function private.avisos_por_mandar(p_ahora timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
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
$$;

comment on function private.avisos_por_mandar(timestamptz) is
  'Los dispositivos a los que les toca el aviso de la mañana en este momento, según la zona horaria y la hora de cada persona, con su zona y los datos de su taller que necesita la agenda: los trabajos, los clientes, las anotaciones, los contactos en seguimiento pendientes y, para los vencimientos de los compromisos, los ajustes con la fila, los tesoros y los gastos desde un tesoro de los meses que mira el aviso. Qué avisar lo decide eventosParaAvisar de @maun/domain en la función de borde, no esta consulta.';
