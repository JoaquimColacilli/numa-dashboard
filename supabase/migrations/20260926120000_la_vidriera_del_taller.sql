-- La vidriera del taller (ADR 0076): las fotos de otros trabajos y las redes del taller que el
-- cliente ve en su página.
--
-- Aditiva. Tres columnas nuevas en public.ajustes con default vacío, así el alter no reescribe la
-- fila que ya está; una restricción única nueva en public.archivos que no puede fallar, porque el id
-- ya es único; una tabla nueva; dos funciones privadas nuevas, y el reemplazo de bootstrap(), delta()
-- y la lista blanca de la vista del cliente, que no tocan ninguna fila. Ninguna fila existente cambia.
--
-- Un bundle de antes sigue andando contra esta base: lee de bootstrap() y de delta() solo las tablas
-- que conoce, y de la vista del cliente solo las claves que conoce. La clave nueva y la tabla nueva
-- las ignora.


-- Las redes del taller ------------------------------------------------------------------------------------

-- Cada link se guarda en una sola forma, la canónica, y el check la exige: vacío o esa forma, nada
-- más. No es cosmético: el texto se convierte en un enlace en una página pública que abre un
-- desconocido, así que la base es el último lugar donde se puede garantizar adónde lleva. Los
-- segmentos que no son un perfil (un posteo, un reel, una historia, un video, compartir, un grupo)
-- quedan afuera aunque tengan la forma de un nombre. La gemela está en @maun/domain
-- (esLinkDeInstagram, esLinkDeFacebook y esLinkDeTiktok) y el comparador de scripts/comparacion.ts
-- las ata.
alter table public.ajustes
  add column instagram_link text not null default ''
    constraint ajustes_instagram_link_formato check (
      instagram_link = ''
      or (
        instagram_link ~ '^https://www\.instagram\.com/[a-z0-9._]{1,30}/$'
        and split_part(instagram_link, '/', 4) <> all (
          array['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv']
        )
      )
    ),
  add column facebook_link text not null default ''
    constraint ajustes_facebook_link_formato check (
      facebook_link = ''
      or facebook_link ~ '^https://www\.facebook\.com/profile\.php\?id=[0-9]{5,20}$'
      or (
        facebook_link ~ '^https://www\.facebook\.com/[a-z0-9.]{5,50}$'
        and split_part(facebook_link, '/', 4) <> all (
          array[
            'share', 'sharer.php', 'people', 'story.php', 'photo.php', 'permalink.php', 'groups',
            'events', 'watch', 'marketplace', 'login', 'profile.php'
          ]
        )
      )
    ),
  add column tiktok_link text not null default ''
    constraint ajustes_tiktok_link_formato check (
      tiktok_link = '' or tiktok_link ~ '^https://www\.tiktok\.com/@[a-z0-9._]{2,24}$'
    );

comment on column public.ajustes.instagram_link is
  'El perfil de Instagram del taller, en la forma https://www.instagram.com/<usuario>/, o vacío. Lo ve el cliente en su página, en la vidriera, como @usuario (ADR 0076).';
comment on column public.ajustes.facebook_link is
  'El perfil o la página de Facebook del taller, en la forma https://www.facebook.com/<nombre> o https://www.facebook.com/profile.php?id=<número>, o vacío. Lo ve el cliente en su página, en la vidriera (ADR 0076).';
comment on column public.ajustes.tiktok_link is
  'El perfil de TikTok del taller, en la forma https://www.tiktok.com/@<usuario>, o vacío. Lo ve el cliente en su página, en la vidriera (ADR 0076).';

-- Solo update, sin insert: la fila de ajustes la crea private.crear_household() con el taller.
grant update (instagram_link, facebook_link, tiktok_link) on table public.ajustes to authenticated;


-- La foto de la vidriera puede venir de la foto de un trabajo -----------------------------------------------

-- La foreign key compuesta de abajo necesita esta clave. No puede fallar: el id ya es único.
alter table public.archivos add constraint archivos_household_id_key unique (household_id, id);


-- Las fotos de la vidriera -----------------------------------------------------------------------------------

create table public.fotos_de_la_vidriera (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  orden integer not null,
  tipo text not null,
  bytes bigint not null,
  ancho integer not null,
  alto integer not null,
  archivo_de_origen uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  -- Compuesta: la foto de la que sale es una foto del mismo taller.
  constraint fotos_de_la_vidriera_archivo_de_origen_fk foreign key (household_id, archivo_de_origen)
    references public.archivos (household_id, id),
  constraint fotos_de_la_vidriera_orden_valido check (orden >= 0),
  constraint fotos_de_la_vidriera_tipo_valido check (tipo in ('image/webp', 'image/jpeg')),
  constraint fotos_de_la_vidriera_bytes_validos check (bytes > 0 and bytes <= 20971520),
  constraint fotos_de_la_vidriera_medidas_validas check (ancho > 0 and alto > 0)
);

comment on table public.fotos_de_la_vidriera is
  'Las fotos que el taller le muestra a todos sus clientes en su página, hasta 12 vivas. El binario vive en el bucket archivos, en {household}/vidriera/{id}.webp y al lado {id}.mini.webp (o .jpg): una foto que sale de un trabajo se copia, no se apunta, así la ruta no lleva el id de otro trabajo y borrarla del trabajo no la saca de la vidriera (ADR 0076).';
comment on column public.fotos_de_la_vidriera.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.fotos_de_la_vidriera.orden is 'El lugar de la foto en la vidriera, de menor a mayor. Dos aparatos que suman a la vez pueden dejar dos iguales: el orden de verdad es orden, created_at, id, y mover una foto renumera la lista.';
comment on column public.fotos_de_la_vidriera.tipo is 'Lo que quedó en el bucket: image/webp, o image/jpeg donde el navegador no codifica WebP. La extensión de la ruta sale de acá.';
comment on column public.fotos_de_la_vidriera.bytes is 'Lo que ocupa en el bucket, la foto y su miniatura. Suma al espacio del plan, que los trabajos y la vidriera comparten.';
comment on column public.fotos_de_la_vidriera.ancho is 'Ancho en píxeles de la foto completa, para reservarle el lugar antes de que cargue.';
comment on column public.fotos_de_la_vidriera.alto is 'Alto en píxeles de la foto completa.';
comment on column public.fotos_de_la_vidriera.archivo_de_origen is 'La foto del trabajo de la que se copió, o null si se subió para la vidriera. Es para decir de dónde salió: el binario es otro, y la vidriera no depende de que esa foto siga viva.';
comment on column public.fotos_de_la_vidriera.deleted_at is 'Borrado lógico, como en todo el household. La app quita el binario del bucket cuando vence el deshacer.';

create index fotos_de_la_vidriera_household_actualizado
  on public.fotos_de_la_vidriera (household_id, updated_at);
-- Foreign key compuesta hacia archivos.
create index fotos_de_la_vidriera_household_origen
  on public.fotos_de_la_vidriera (household_id, archivo_de_origen);

create trigger metadatos
  before insert or update on public.fotos_de_la_vidriera
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.fotos_de_la_vidriera
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.fotos_de_la_vidriera enable row level security;

revoke all on table public.fotos_de_la_vidriera from anon, authenticated;

grant select on table public.fotos_de_la_vidriera to authenticated;
-- Todas las columnas del alta entran en el update porque el alta y el deshacer de una baja son un
-- upsert, y el upsert de PostgREST las incluye en el SET. Mover una foto es un update de orden. Sin
-- household_id: lo pone el default. Sin grant de delete: la baja es lógica.
grant insert (id, orden, tipo, bytes, ancho, alto, archivo_de_origen, deleted_at)
  on table public.fotos_de_la_vidriera to authenticated;
grant update (id, orden, tipo, bytes, ancho, alto, archivo_de_origen, deleted_at)
  on table public.fotos_de_la_vidriera to authenticated;

create policy fotos_de_la_vidriera_lectura on public.fotos_de_la_vidriera
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));

create policy fotos_de_la_vidriera_alta on public.fotos_de_la_vidriera
  for insert to authenticated
  with check (household_id = any (array(select private.user_household_ids())));

create policy fotos_de_la_vidriera_edicion on public.fotos_de_la_vidriera
  for update to authenticated
  using (household_id = any (array(select private.user_household_ids())))
  with check (household_id = any (array(select private.user_household_ids())));


-- El tope: doce fotos vivas por taller ---------------------------------------------------------------------

create function private.cuidar_el_tope_de_la_vidriera()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_vivas integer;
begin
  -- Solo cuenta lo que deja una foto viva de más: el alta de una foto viva y restaurar una borrada.
  -- Mover una foto viva o sacarla no suma nada.
  if new.deleted_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.deleted_at is null then
    return new;
  end if;

  -- Bloquea el taller antes de contar: dos aparatos que suman a la vez se esperan acá, y el segundo
  -- cuenta con la foto del primero adentro. Es FOR NO KEY UPDATE para no chocar con las foreign keys
  -- que apuntan al taller, que toman FOR KEY SHARE: solo espera a otra foto que se suma o a quien
  -- renombra el taller.
  perform 1 from public.households h where h.id = new.household_id for no key update;

  -- No se cuenta a sí misma: el reenvío de un alta que ya había entrado vuelve a pasar por acá.
  select count(*) into v_vivas
  from public.fotos_de_la_vidriera f
  where f.household_id = new.household_id
    and f.deleted_at is null
    and f.id <> new.id;

  if v_vivas >= 12 then
    raise exception 'La vidriera ya tiene 12 fotos'
      using errcode = 'MN022',
            hint = 'Sacá una foto de la vidriera antes de sumar otra.';
  end if;

  return new;
end;
$$;

comment on function private.cuidar_el_tope_de_la_vidriera() is
  'Guarda del alta y de la restauración de una foto de la vidriera: un taller tiene a lo sumo 12 fotos vivas. Bloquea la fila del taller antes de contar, así dos altas a la vez se esperan, y no se cuenta a sí misma. Rechaza con MN022 (ADR 0076).';

revoke all on function private.cuidar_el_tope_de_la_vidriera() from public, anon, authenticated;

create trigger cuidar_el_tope_de_la_vidriera
  before insert or update of deleted_at on public.fotos_de_la_vidriera
  for each row execute function private.cuidar_el_tope_de_la_vidriera();


-- La ruta del binario --------------------------------------------------------------------------------------

create function private.ruta_de_la_vidriera(
  p_household_id uuid,
  p_foto_id uuid,
  p_tipo text,
  p_miniatura boolean
)
returns text
language sql
immutable
set search_path = ''
as $$
  select p_household_id::text || '/vidriera/' || p_foto_id::text
    || case when p_miniatura then '.mini' else '' end
    || case p_tipo
         when 'image/webp' then '.webp'
         when 'image/jpeg' then '.jpg'
         else '.bin'
       end
$$;

comment on function private.ruta_de_la_vidriera(uuid, uuid, text, boolean) is
  'La ruta de una foto de la vidriera en el bucket archivos, la misma que arma la app: {household}/vidriera/{id}.webp y al lado {id}.mini.webp, o .jpg (ADR 0076). Es la gemela de private.ruta_del_archivo para la carpeta de la vidriera: la vista del cliente la manda armada.';

revoke all on function private.ruta_de_la_vidriera(uuid, uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function private.ruta_de_la_vidriera(uuid, uuid, text, boolean) to authenticated;


-- La réplica trae las fotos de la vidriera -------------------------------------------------------------------

-- Una clave más en el mismo JSON. Un bundle viejo lee solo las tablas que conoce y la ignora.
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
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
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
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    )
  );
end;
$$;


-- La vista del cliente trae la vidriera ---------------------------------------------------------------------

-- La misma función, con la misma firma y los mismos grants, y una clave más al final. Un bundle de
-- antes lee solo las claves que conoce: la nueva la ignora.
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
  v_siguiente jsonb;
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

  -- Los campos van enumerados uno por uno, a propósito. Si esto fuera to_jsonb(v_p) con la pantalla
  -- filtrando, el día que alguien le agregue una columna a proyectos esa columna quedaría expuesta
  -- sin que nadie lo decida: lo que el cliente ve se decide acá, no en el navegador. La suite lo
  -- controla con supabase/tests/25_vista_del_cliente.sql, que falla apenas aparece una columna
  -- nueva en proyectos o en ajustes hasta que alguien la clasifica como pública o privada.
  return jsonb_build_object(
    'taller', jsonb_build_object('nombre', v_taller),
    'cliente', jsonb_build_object('nombre', v_cliente),
    'trabajo', v_p.titulo,
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
    )
  );
end;
$$;

comment on function public.vista_del_cliente(uuid) is
  'Lo único que un cliente puede ver de su trabajo, y cada dato recién desde la etapa en la que es cierto (ADR 0067): el presupuesto desde que se le manda; la dirección de entrega, el día de inicio, la entrega estimada (la clave entrega_pautada, que no se renombró) y el día de la aprobación desde que aprueba; el día en que el mueble quedó listo desde que lo está; el día de la entrega desde que se entrega. Antes de esas etapas no viajan, aunque estén cargados: un campo cargado no es un hecho. Devuelve cuánto vale, cuánto pagó, en qué anda, la seña en pesos, qué pago le toca ahora, cuánto es, cómo puede pagarlo y cuál viene después (antes de aprobar solo se le pide la seña), hasta cuándo vale el presupuesto mientras espera la seña, los archivos que el dueño marcó, el día que se le mandó el estimativo y el día de la visita para medir con si ya se fue. La clave entrega trae la entrega comprometida mientras el trabajo está en curso, y la propuesta de entrega vigente con lo último que contestó el cliente solo con el trabajo en curso, listo y sin comprometida (ADR 0071). La clave vidriera trae, en todas las etapas, las redes del taller y hasta 12 fotos de su vidriera con la ruta de cada una, solo del taller del trabajo (ADR 0076). Enumera los campos uno por uno y nunca devuelve la fila entera: convertirla en un select * expondría cada columna nueva de proyectos sin que nadie lo decida, costos estimados, margen y tipo de proyecto incluidos. Un trabajo en seguimiento se muestra en la etapa en la que estaba: el «por ahora no» y su próximo contacto son del taller y no viajan (ADR 0064). Del estimativo viaja el día, nunca un importe. De la visita viajan el día y la marca, no la hora. De ajustes viajan exactamente los cinco campos de cobro —los cuatro de la cuenta y el link de Mercado Pago—, y solo cuando el pago que toca AHORA se ofrece por transferencia: lo que no se muestra, no se manda; y los tres links de las redes, siempre. El porcentaje de seña y los días que vale un presupuesto no viajan nunca; lo que viaja son el importe y la fecha que salen de ellos. Es security invoker: desde la app la llama el dueño y la RLS decide; desde el link la llama public.vista_compartida(), que ya resolvió el token (ADR 0046, 0048, 0053, 0054, 0058, 0067, 0071 y 0076).';
