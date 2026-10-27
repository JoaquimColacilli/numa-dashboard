-- El cliente aprueba una opción del presupuesto (o del estimativo) desde su página y, si la revisión
-- lo pide, propone un día para que vayan a medir. Es otra escritura de alguien sin cuenta, como la
-- encuesta y la nota de la entrega, y sigue su molde: una función security definer que anon solo
-- puede ejecutar, sin grants sobre ninguna tabla, que valida todo en la base con una gemela de
-- @maun/domain; una tabla replicada para el dueño, que solo puede marcarla atendida; una respuesta
-- por revisión, el reenvío idéntico reconocido y otro distinto rechazado.

alter table public.revisiones_del_presupuesto
  add constraint revisiones_del_presupuesto_household_proyecto_id_key unique (household_id, proyecto_id, id);

create table public.respuestas_al_presupuesto (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null references public.households (id) on delete cascade,
  proyecto_id uuid not null,
  revision_id uuid not null,
  opcion_id uuid,
  dia date,
  franja text,
  nota text not null default '',
  respondida_el date not null,
  atendida_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  -- Una respuesta es de una revisión de su mismo trabajo y de su mismo taller, y hay una por revisión,
  -- contando las borradas: una revisión nueva vuelve a abrir la respuesta.
  constraint respuestas_al_presupuesto_revision_fk foreign key (household_id, proyecto_id, revision_id)
    references public.revisiones_del_presupuesto (household_id, proyecto_id, id),
  constraint respuestas_al_presupuesto_una_por_revision unique (household_id, revision_id),
  constraint respuestas_al_presupuesto_franja_valida
    check (franja is null or franja in ('manana', 'tarde', 'me_da_igual')),
  constraint respuestas_al_presupuesto_dia_con_su_franja check ((dia is null) = (franja is null)),
  constraint respuestas_al_presupuesto_nota_valida check (char_length(nota) <= 300 and (dia is not null or nota = ''))
);

comment on table public.respuestas_al_presupuesto is 'Lo que el cliente aprobó de la última revisión del presupuesto desde su página: la opción (o el total), y si la revisión pedía fecha, el día y la franja que propone para que vayan a medir, con una nota. No es una firma: el presupuesto queda confirmado con la seña. La escribe solo public.responder_el_presupuesto(), que corre elevada; el dueño no tiene grant de insert y lo único que escribe es atendida_at. Una por revisión (los detalles a mejorar).';
comment on column public.respuestas_al_presupuesto.household_id is 'Sin default: la fila la escribe la función pública, que no tiene sesión, y pone el household del enlace.';
comment on column public.respuestas_al_presupuesto.revision_id is 'La revisión a la que contesta, que era la última mandada del trabajo y seguía esperando respuesta.';
comment on column public.respuestas_al_presupuesto.opcion_id is 'La opción que aprobó, una de las de esa revisión; null si la revisión tenía un solo total.';
comment on column public.respuestas_al_presupuesto.dia is 'El día que propone para que vayan a medir, de pasado mañana a dentro de 60 días en el día del taller, si la revisión lo pedía; si no, null.';
comment on column public.respuestas_al_presupuesto.franja is 'A la mañana (manana), a la tarde (tarde) o le da igual (me_da_igual), con el día; sin día, null.';
comment on column public.respuestas_al_presupuesto.nota is 'Algo que tienen que saber para la visita, en palabras del cliente: hasta 300 caracteres sin blancos en las puntas, y solo con un día.';
comment on column public.respuestas_al_presupuesto.respondida_el is 'El día del taller en que contestó: el «Aprobaste la opción A el 26 de octubre».';
comment on column public.respuestas_al_presupuesto.atendida_at is 'Cuándo la atendió el dueño (agendó el relevamiento, aprobó el trabajo o tocó «Listo, ya lo hablé»), o null mientras espera. Es del dueño y se escribe por la cola.';
comment on column public.respuestas_al_presupuesto.deleted_at is 'Borrado lógico. Solo lo pone el borrado del trabajo.';

create index respuestas_al_presupuesto_household_actualizado on public.respuestas_al_presupuesto (household_id, updated_at);
create index respuestas_al_presupuesto_household_revision on public.respuestas_al_presupuesto (household_id, proyecto_id, revision_id);

create trigger metadatos
  before insert or update on public.respuestas_al_presupuesto
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or update or delete on public.respuestas_al_presupuesto
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.respuestas_al_presupuesto enable row level security;

revoke all on table public.respuestas_al_presupuesto from anon, authenticated;

grant select on table public.respuestas_al_presupuesto to authenticated;
grant update (atendida_at) on table public.respuestas_al_presupuesto to authenticated;

create policy respuestas_al_presupuesto_lectura on public.respuestas_al_presupuesto
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));

create policy respuestas_al_presupuesto_edicion on public.respuestas_al_presupuesto
  for update to authenticated
  using (household_id = any (array(select private.user_household_ids())))
  with check (household_id = any (array(select private.user_household_ids())));

create function private.validar_aprobacion(p_aprobacion jsonb, p_documento jsonb, p_hoy date)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_opcion jsonb;
  v_dia jsonb;
  v_franja jsonb;
  v_nota text;
  v_opciones text[];
  v_distancia integer;
begin
  -- La forma: {id, revision_id, opcion_id, dia, franja, nota}, con cada valor de su tipo.
  if p_aprobacion is null or jsonb_typeof(p_aprobacion) is distinct from 'object' then
    return 'forma';
  end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_aprobacion) as k)
    is distinct from array['dia', 'franja', 'id', 'nota', 'opcion_id', 'revision_id'] then
    return 'forma';
  end if;
  if jsonb_typeof(p_aprobacion -> 'id') is distinct from 'string'
    or (p_aprobacion ->> 'id') !~* c_uuid
    or jsonb_typeof(p_aprobacion -> 'revision_id') is distinct from 'string'
    or (p_aprobacion ->> 'revision_id') !~* c_uuid then
    return 'forma';
  end if;
  v_opcion := p_aprobacion -> 'opcion_id';
  v_dia := p_aprobacion -> 'dia';
  v_franja := p_aprobacion -> 'franja';
  if jsonb_typeof(v_opcion) not in ('null', 'string')
    or jsonb_typeof(v_dia) not in ('null', 'string')
    or jsonb_typeof(v_franja) not in ('null', 'string')
    or jsonb_typeof(p_aprobacion -> 'nota') is distinct from 'string' then
    return 'forma';
  end if;
  v_nota := p_aprobacion ->> 'nota';

  -- La opción es una de las de la revisión; con un solo total, ninguna. Sin valores no hay qué aprobar.
  if jsonb_typeof(p_documento -> 'valores') is distinct from 'object' then
    v_opciones := array[]::text[];
  elsif p_documento #>> '{valores,tipo}' = 'opciones' then
    select coalesce(array_agg(e.valor ->> 'id'), array[]::text[]) into v_opciones
    from jsonb_array_elements(p_documento #> '{valores,opciones}') as e (valor);
  else
    v_opciones := null;
  end if;
  if v_opciones is null then
    if jsonb_typeof(v_opcion) <> 'null' then
      return 'opcion';
    end if;
  elsif jsonb_typeof(v_opcion) = 'null' or not ((p_aprobacion ->> 'opcion_id') = any (v_opciones)) then
    return 'opcion';
  end if;

  -- Si la revisión no pide fecha, no lleva día, franja ni nota.
  if coalesce(p_documento -> 'pideFecha' = 'true'::jsonb, false) is false then
    if jsonb_typeof(v_dia) = 'null' and jsonb_typeof(v_franja) = 'null' and v_nota !~ '[^ \t\n\r\f\v]' then
      return null;
    end if;
    return 'dia';
  end if;

  if jsonb_typeof(v_dia) = 'null' then
    return 'dia';
  end if;
  -- De pasado mañana a dentro de 60 días, en el día del taller.
  if not ((p_aprobacion ->> 'dia') ~ '^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
      and pg_input_is_valid(p_aprobacion ->> 'dia', 'date')) then
    return 'fuera';
  end if;
  v_distancia := (p_aprobacion ->> 'dia')::date - p_hoy;
  if v_distancia < 2 or v_distancia > 60 then
    return 'fuera';
  end if;
  if jsonb_typeof(v_franja) = 'null' or (p_aprobacion ->> 'franja') not in ('manana', 'tarde', 'me_da_igual') then
    return 'franja';
  end if;
  if char_length(regexp_replace(v_nota, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')) > 300 then
    return 'largo';
  end if;
  return null;
end;
$$;

revoke all on function private.validar_aprobacion(jsonb, jsonb, date) from public, anon, authenticated;

comment on function private.validar_aprobacion(jsonb, jsonb, date) is 'El motivo por el que una aprobación del cliente no sirve para una revisión del presupuesto, o null: la forma (forma), la opción que no es de la revisión o que falta o sobra (opcion), el día que falta o que sobra porque la revisión no pide fecha (dia), un día fuera de pasado mañana a dentro de 60 (fuera), la franja (franja) y la nota de más de 300 caracteres (largo). Gemela de validarAprobacion de @maun/domain, en el mismo orden; scripts/comparacion.ts las ata.';

create function private.motivo_de_la_aprobacion(p_motivo text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_motivo
    when 'forma' then 'La respuesta no tiene la forma que espera la página'
    when 'opcion' then 'Esa opción no es de este presupuesto'
    when 'dia' then 'Falta el día para ir a medir, o sobra porque el taller no lo pidió'
    when 'fuera' then 'El día está fuera de los que se pueden elegir'
    when 'franja' then 'Falta el horario para ir a medir'
    when 'largo' then 'La nota pasa de los 300 caracteres'
    when 'revision' then 'El taller cambió el presupuesto, o ya no espera respuesta'
    when 'respondida' then 'Ya contestaste este presupuesto'
    else 'La respuesta no sirve para este presupuesto'
  end
$$;

revoke all on function private.motivo_de_la_aprobacion(text) from public, anon, authenticated;

comment on function private.motivo_de_la_aprobacion(text) is 'El mensaje de respaldo de cada motivo de MN050; la página traduce el motivo por su cuenta, en sus tres idiomas.';

create function public.responder_el_presupuesto(p_token text, p_respuesta jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enlace public.enlaces_publicos;
  v_proyecto public.proyectos;
  v_revision public.revisiones_del_presupuesto;
  v_anterior public.respuestas_al_presupuesto;
  v_hoy date := private.hoy_en_el_taller();
  c_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_id uuid;
  v_revision_id uuid;
  v_nota text;
  v_motivo text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- El enlace, sin bloquearlo: solo para saber de qué trabajo es.
  select * into v_enlace
  from public.enlaces_publicos e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocado_at is null
    and e.deleted_at is null;

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- El trabajo con for update, en el orden de mandar el presupuesto, que también lo toma primero: una
  -- revisión nueva que se manda mientras el cliente contesta espera acá, o espera a que esto termine.
  -- Después el enlace con for share, por si lo dieron de baja mientras tanto.
  select * into v_proyecto
  from public.proyectos p
  where p.household_id = v_enlace.household_id and p.id = v_enlace.proyecto_id
  for update;

  if not found or v_proyecto.deleted_at is not null or v_proyecto.estado = 'perdido' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  perform 1
  from public.enlaces_publicos e
  where e.id = v_enlace.id and e.revocado_at is null and e.deleted_at is null
  for share;

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  if pg_column_size(p_respuesta) > 8192
    or jsonb_typeof(p_respuesta) is distinct from 'object'
    or jsonb_typeof(p_respuesta -> 'id') is distinct from 'string'
    or jsonb_typeof(p_respuesta -> 'revision_id') is distinct from 'string'
    or (p_respuesta ->> 'id') !~* c_uuid
    or (p_respuesta ->> 'revision_id') !~* c_uuid then
    raise exception '%', private.motivo_de_la_aprobacion('forma') using errcode = 'MN050', detail = 'forma';
  end if;

  v_id := (p_respuesta ->> 'id')::uuid;
  v_revision_id := (p_respuesta ->> 'revision_id')::uuid;
  v_nota := regexp_replace(coalesce(p_respuesta ->> 'nota', ''), '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g');

  -- El mismo envío que vuelve porque la respuesta del primero se perdió en la red: ya está guardado.
  -- Con el mismo id y otra cosa adentro no es un reenvío.
  select * into v_anterior
  from public.respuestas_al_presupuesto a
  where a.id = v_id;

  if found then
    if v_anterior.household_id = v_proyecto.household_id
      and v_anterior.revision_id = v_revision_id
      and v_anterior.opcion_id::text is not distinct from (p_respuesta ->> 'opcion_id')
      and v_anterior.dia::text is not distinct from (p_respuesta ->> 'dia')
      and v_anterior.franja is not distinct from (p_respuesta ->> 'franja')
      and v_anterior.nota = v_nota then
      return jsonb_build_object('estado', 'guardada');
    end if;
    raise exception '%', private.motivo_de_la_aprobacion('respondida') using errcode = 'MN050', detail = 'respondida';
  end if;

  -- La revisión a la que contesta tiene que ser la última mandada del trabajo y seguir esperando: el
  -- trabajo sin aprobar y el presupuesto sin vencer, en el día del taller.
  select r.* into v_revision
  from public.revisiones_del_presupuesto r
  join public.presupuestos b on b.household_id = r.household_id and b.id = r.presupuesto_id
  where r.household_id = v_proyecto.household_id
    and r.proyecto_id = v_proyecto.id
    and r.deleted_at is null
    and b.deleted_at is null
  order by r.revision desc
  limit 1;

  if v_revision.id is null
    or v_revision.id <> v_revision_id
    or v_proyecto.estado in ('en_curso', 'entregado', 'cobrado')
    or (v_proyecto.presupuesto_vale_hasta is not null and v_proyecto.presupuesto_vale_hasta < v_hoy) then
    raise exception '%', private.motivo_de_la_aprobacion('revision') using errcode = 'MN050', detail = 'revision';
  end if;

  if exists (
    select 1 from public.respuestas_al_presupuesto a
    where a.household_id = v_proyecto.household_id and a.revision_id = v_revision.id
  ) then
    raise exception '%', private.motivo_de_la_aprobacion('respondida') using errcode = 'MN050', detail = 'respondida';
  end if;

  -- Todo se valida acá, del lado de la base, y antes de escribir: lo que no cumple se rechaza entero.
  v_motivo := private.validar_aprobacion(p_respuesta, v_revision.contenido, v_hoy);
  if v_motivo is not null then
    raise exception '%', private.motivo_de_la_aprobacion(v_motivo) using errcode = 'MN050', detail = v_motivo;
  end if;

  insert into public.respuestas_al_presupuesto (
    id, household_id, proyecto_id, revision_id, opcion_id, dia, franja, nota, respondida_el
  ) values (
    v_id,
    v_proyecto.household_id,
    v_proyecto.id,
    v_revision.id,
    (p_respuesta ->> 'opcion_id')::uuid,
    (p_respuesta ->> 'dia')::date,
    p_respuesta ->> 'franja',
    v_nota,
    v_hoy
  );

  -- Las guardas diferidas no son security definer: al commit correrían como anon y cortarían con
  -- 42501. Se corren acá, todavía como dueño de la función, y se devuelven a diferidas.
  set constraints all immediate;
  set constraints all deferred;

  return jsonb_build_object('estado', 'guardada');
end;
$$;

revoke all on function public.responder_el_presupuesto(text, jsonb) from public, anon, authenticated;
grant execute on function public.responder_el_presupuesto(text, jsonb) to anon;

comment on function public.responder_el_presupuesto(text, jsonb) is 'La puerta del cliente para aprobar el presupuesto desde su página (los detalles a mejorar): resuelve el token contra su sha256, toma el trabajo for update y el enlace for share, reconoce el reenvío idéntico por su id, exige que la revisión sea la última mandada y siga esperando (el trabajo sin aprobar ni perdido y el presupuesto sin vencer), una sola respuesta por revisión, y valida el resto con private.validar_aprobacion. Rechaza entero con MN010 (el link) o MN050 y el motivo en el detail; guarda solo lo que dice la fila y contesta guardada. Solo la ejecuta anon, y no devuelve nada de la base.';

CREATE OR REPLACE FUNCTION public.bootstrap()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
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
    ),
    'respuestas_al_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_al_presupuesto t where t.deleted_at is null
    )
  )
$function$;

comment on function bootstrap() is 'Todo el household del usuario en un JSON, sin filas borradas, más el cursor para el primer delta. Es también el reconcile completo: el cliente reemplaza su copia entera con esto.';

CREATE OR REPLACE FUNCTION public.delta(p_desde timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
    ),
    'respuestas_al_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_al_presupuesto t where t.updated_at >= v_desde
    )
  );
end;
$function$;

comment on function delta(timestamp with time zone) is 'Filas del household cambiadas desde el cursor, incluidas las borradas (deleted_at no null), más el cursor siguiente. Aplica un solape de cinco minutos.';

CREATE OR REPLACE FUNCTION private.borrar_el_presupuesto_del_trabajo(p_household_id uuid, p_proyecto_id uuid, p_momento timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para borrar un borrador ni una revisión, y
  -- esta puerta no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  update public.respuestas_al_presupuesto a
  set deleted_at = p_momento
  where a.household_id = p_household_id and a.proyecto_id = p_proyecto_id and a.deleted_at is null;

  update public.revisiones_del_presupuesto r
  set deleted_at = p_momento
  where r.household_id = p_household_id and r.proyecto_id = p_proyecto_id and r.deleted_at is null;

  update public.presupuestos b
  set deleted_at = p_momento
  where b.household_id = p_household_id and b.proyecto_id = p_proyecto_id and b.deleted_at is null;
end;
$function$;

comment on function private.borrar_el_presupuesto_del_trabajo(uuid,uuid,timestamp with time zone) is 'Borra, con la marca del trabajo, el borrador del presupuesto, sus revisiones y lo que el cliente les contestó de un trabajo que ya se borró. Es security definer porque el dueño no tiene grant para escribir ninguna de las tres: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo (ADR 0080).';
