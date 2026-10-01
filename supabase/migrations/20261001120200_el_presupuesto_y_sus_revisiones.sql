-- El presupuesto adentro de la ficha (ADR 0080): el borrador de cada trabajo y lo que se le mandó al
-- cliente, cada envío una revisión congelada con su número.
--
-- Aditiva. Dos tablas nuevas, solo de lectura para la app: las escriben public.guardar_el_presupuesto()
-- y public.mandar_el_presupuesto(), con una privada security definer cada una (el molde de
-- guardar_la_fila), y la fecha de aceptación la pone el trigger de los cambios de estado (la migración
-- siguiente). Las tres gemelas de presupuesto.ts que validan el borrador, el documento y lo que falta
-- para mandarlo. La baja del trabajo se lleva el borrador y sus revisiones, y la réplica las trae
-- (bootstrap y delta, con create or replace y la misma firma). Ninguna fila existente cambia.


-- El borrador, uno por trabajo -------------------------------------------------------------------------

create table public.presupuestos (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  proyecto_id uuid not null,
  contenido jsonb not null,
  borrador_version integer not null default 0,
  numero text,
  aceptado_el date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint presupuestos_household_id_key unique (household_id, id),
  constraint presupuestos_numero_unico unique (household_id, numero),
  constraint presupuestos_proyecto_fk foreign key (household_id, proyecto_id)
    references public.proyectos (household_id, id),
  constraint presupuestos_contenido_es_un_objeto check (jsonb_typeof(contenido) = 'object'),
  constraint presupuestos_borrador_version_valida check (borrador_version >= 0),
  constraint presupuestos_numero_formato check (numero is null or numero ~ '^[0-9]{8}-[0-9]{2,}$')
);

comment on table public.presupuestos is
  'El borrador del presupuesto de cada trabajo, uno vivo por trabajo, fuera del agregado del proyecto: editarlo no sube la version del trabajo ni choca con otro guardado del mismo trabajo. Lo escriben public.guardar_el_presupuesto() (el contenido y su revisión) y public.mandar_el_presupuesto() (el número del primer envío); la app solo lee. La fecha de aceptación la pone el trigger de los cambios de estado (ADR 0080).';
comment on column public.presupuestos.id is 'El UUIDv7 que manda la app, así la fila optimista y la de la base son la misma.';
comment on column public.presupuestos.household_id is 'Default: el household del usuario de la sesión. Las funciones que escriben la tabla lo ponen explícito.';
comment on column public.presupuestos.contenido is
  'El borrador, el BorradorDelPresupuesto de @maun/domain: el título, la obra, la descripción, los muebles, los herrajes, las cláusulas tildadas y las propias de este trabajo, la forma de pago elegida, el plazo y los días que vale. No guarda importes: el total y las opciones son los del trabajo. Lo valida private.problema_del_presupuesto(), que es permisivo, porque un borrador puede estar a medio hacer.';
comment on column public.presupuestos.borrador_version is
  'La revisión del borrador, aparte de la version de la fila. La suma solo public.guardar_el_presupuesto(), de a uno, y la comparan las dos funciones: un guardado o un envío armado con otra rebota con MN026. La version de la fila no sirve para eso, porque sube también con el número y con aceptado_el.';
comment on column public.presupuestos.numero is
  'El número del presupuesto, AAAAMMDD-NN: el día del primer envío y el orden de ese día en el taller, contando los borrados. Null hasta el primer envío; lo pone public.mandar_el_presupuesto() con los ajustes del taller bloqueados, y las revisiones lo mantienen.';
comment on column public.presupuestos.aceptado_el is
  'El día en que el cliente lo aprobó, o null. Lo pone el trigger de los cambios de estado cuando el trabajo pasa de una consulta a en_curso, y lo vuelve a null si vuelve a una consulta; no lo escribe nadie más. La ficha y la página del cliente leen la misma fecha.';
comment on column public.presupuestos.deleted_at is 'Se borra solo con su trabajo, por private.borrar_el_presupuesto_del_trabajo().';

create unique index presupuestos_uno_vivo_por_trabajo
  on public.presupuestos (household_id, proyecto_id)
  where deleted_at is null;

create index presupuestos_household_actualizado on public.presupuestos (household_id, updated_at);
-- La foreign key compuesta al trabajo: el índice único de arriba es parcial y no le sirve.
create index presupuestos_household_proyecto on public.presupuestos (household_id, proyecto_id);

create trigger metadatos
  before insert or update on public.presupuestos
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.presupuestos
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.presupuestos enable row level security;

revoke all on table public.presupuestos from anon, authenticated;

grant select on table public.presupuestos to authenticated;

create policy presupuestos_lectura on public.presupuestos
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));


-- Lo que se mandó, que no cambia -------------------------------------------------------------------------

create table public.revisiones_del_presupuesto (
  id uuid primary key default private.uuidv7(),
  household_id uuid not null default private.household_actual()
    references public.households (id) on delete cascade,
  presupuesto_id uuid not null,
  proyecto_id uuid not null,
  revision integer not null,
  numero text not null,
  mandado_el date not null,
  vale_hasta date,
  que_cambio text,
  contenido jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint revisiones_del_presupuesto_revision_unica unique (household_id, presupuesto_id, revision),
  constraint revisiones_del_presupuesto_presupuesto_fk foreign key (household_id, presupuesto_id)
    references public.presupuestos (household_id, id),
  constraint revisiones_del_presupuesto_proyecto_fk foreign key (household_id, proyecto_id)
    references public.proyectos (household_id, id),
  constraint revisiones_del_presupuesto_revision_valida check (revision >= 1),
  constraint revisiones_del_presupuesto_numero_formato check (numero ~ '^[0-9]{8}-[0-9]{2,}$'),
  constraint revisiones_del_presupuesto_que_cambio_largo check (
    que_cambio is null or char_length(que_cambio) <= 280
  ),
  constraint revisiones_del_presupuesto_contenido_es_un_objeto check (jsonb_typeof(contenido) = 'object')
);

comment on table public.revisiones_del_presupuesto is
  'Cada envío del presupuesto, congelado: la foto completa del documento que vio el cliente, con su número, su revisión y su día, que nadie edita después. Es la regla de lo que se mandó lleva su foto (ADR 0057): cambiar el borrador o la plantilla no cambia lo mandado, y el PDF de una revisión se rehace igual. La escribe solo public.mandar_el_presupuesto(); la app no tiene grant de insert ni de update. ARCA pide conservar los presupuestos dos años: no se borra, salvo con su trabajo (ADR 0080).';
comment on column public.revisiones_del_presupuesto.id is 'El UUIDv7 que manda la app al mandarlo: con él la base reconoce el reenvío de la cola y no congela dos veces.';
comment on column public.revisiones_del_presupuesto.household_id is 'Default: el household del usuario de la sesión. public.mandar_el_presupuesto() lo pone explícito.';
comment on column public.revisiones_del_presupuesto.revision is 'Desde 1, una más por cada envío del mismo presupuesto. Después de aprobado no hay revisiones (MN028).';
comment on column public.revisiones_del_presupuesto.numero is 'El número del presupuesto, el mismo en todas sus revisiones.';
comment on column public.revisiones_del_presupuesto.mandado_el is 'El día del envío, que manda la app y no puede ser posterior a hoy en el taller (MN033).';
comment on column public.revisiones_del_presupuesto.vale_hasta is 'Hasta cuándo valía este envío, para la historia, o null si se mandó sin vencimiento. La vigencia viva es la del trabajo, proyectos.presupuesto_vale_hasta, que el dueño puede extender.';
comment on column public.revisiones_del_presupuesto.que_cambio is 'Lo que cambió desde la revisión anterior, en palabras del dueño y sin blancos en las puntas: obligatorio desde la segunda, de hasta 280 caracteres; null en la primera. El cliente lo ve arriba del presupuesto.';
comment on column public.revisiones_del_presupuesto.contenido is 'El DocumentoDelPresupuesto de @maun/domain tal como se mandó: los textos con sus huecos completados, los importes, la seña, lo pagado hasta ese día (abonado), los datos del taller y el nombre del cliente. Lo arma la app, y la base valida su forma (private.problema_del_documento()) y compara sus importes con los del trabajo antes de congelarlo.';
comment on column public.revisiones_del_presupuesto.deleted_at is 'Se borra solo con su trabajo, por private.borrar_el_presupuesto_del_trabajo().';

create index revisiones_del_presupuesto_household_actualizado
  on public.revisiones_del_presupuesto (household_id, updated_at);
-- La foreign key compuesta al trabajo. La del borrador la cubre la clave única de la revisión.
create index revisiones_del_presupuesto_household_proyecto
  on public.revisiones_del_presupuesto (household_id, proyecto_id);

create trigger metadatos
  before insert or update on public.revisiones_del_presupuesto
  for each row execute function private.mantener_metadatos();

create trigger avisar_los_cambios
  after insert or delete or update on public.revisiones_del_presupuesto
  for each row execute function private.avisar_los_cambios('household_id');

alter table public.revisiones_del_presupuesto enable row level security;

revoke all on table public.revisiones_del_presupuesto from anon, authenticated;

-- Solo lectura: las filas las pone public.mandar_el_presupuesto(), que corre elevada. Sin insert ni
-- update, nadie puede inventarse un envío ni corregirlo.
grant select on table public.revisiones_del_presupuesto to authenticated;

create policy revisiones_del_presupuesto_lectura on public.revisiones_del_presupuesto
  for select to authenticated
  using (household_id = any (array(select private.user_household_ids())));


-- La gemela de problemaDelBorrador ----------------------------------------------------------------------

create function private.problema_del_presupuesto(p_contenido jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_grupos constant text[] := array['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'];
  v_grupo text;
  v_elemento jsonb;
  v_vistos text[];
  v_id text;
  v_forma jsonb;
  v_plazo bigint;
  v_validez bigint;
begin
  -- La forma entera antes que cualquier tope, como en el dominio.
  if jsonb_typeof(p_contenido) is distinct from 'object'
    or p_contenido -> 'forma' is distinct from '1'::jsonb
    or jsonb_typeof(p_contenido -> 'titulo') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'obra') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'descripcion') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'muebles') is distinct from 'array'
    or jsonb_typeof(p_contenido -> 'herrajes') is distinct from 'object'
    or jsonb_typeof(p_contenido #> '{herrajes,mostrar}') is distinct from 'boolean'
    or jsonb_typeof(p_contenido #> '{herrajes,lista}') is distinct from 'array'
  then
    return 'forma-invalida';
  end if;

  for v_elemento in select e.valor from jsonb_array_elements(p_contenido -> 'muebles') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  for v_elemento in select e.valor from jsonb_array_elements(p_contenido #> '{herrajes,lista}') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  foreach v_grupo in array c_grupos loop
    if jsonb_typeof(p_contenido -> v_grupo) is distinct from 'object'
      or jsonb_typeof(p_contenido -> v_grupo -> 'tildadas') is distinct from 'array'
      or jsonb_typeof(p_contenido -> v_grupo -> 'propias') is distinct from 'array'
    then
      return 'forma-invalida';
    end if;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_contenido -> v_grupo -> 'tildadas') as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'string' then
        return 'forma-invalida';
      end if;
    end loop;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_contenido -> v_grupo -> 'propias') as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  -- La forma de pago es null (no se muestra) o la elegida, con el texto en null mientras no se retoque.
  v_forma := p_contenido -> 'formaDePago';
  if not (
    jsonb_typeof(v_forma) is not distinct from 'null'
    or (
      jsonb_typeof(v_forma) is not distinct from 'object'
      and jsonb_typeof(v_forma -> 'plantillaId') is not distinct from 'string'
      and coalesce(jsonb_typeof(v_forma -> 'texto'), '') in ('null', 'string')
    )
  ) then
    return 'forma-invalida';
  end if;

  v_plazo := private.entero_de_json(p_contenido -> 'plazoDeFabricacion');
  if v_plazo is null then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_contenido -> 'validezDias') is not distinct from 'null' then
    v_validez := null;
  else
    v_validez := private.entero_de_json(p_contenido -> 'validezDias');
    if v_validez is null then
      return 'forma-invalida';
    end if;
  end if;

  if char_length(p_contenido ->> 'titulo') > 200 then
    return 'titulo-largo';
  end if;
  if char_length(p_contenido ->> 'obra') > 300 then
    return 'obra-larga';
  end if;
  if char_length(p_contenido ->> 'descripcion') > 4000 then
    return 'descripcion-larga';
  end if;

  if jsonb_array_length(p_contenido -> 'muebles') > 30 then
    return 'demasiados-muebles';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_contenido -> 'muebles') with ordinality as e (valor, orden)
    order by e.orden
  loop
    v_id := v_elemento ->> 'id';
    if v_id !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistos) then
      return 'id-repetido';
    end if;
    v_vistos := v_vistos || v_id;
    if char_length(v_elemento ->> 'nombre') > 120 then
      return 'nombre-del-mueble-largo';
    end if;
    if char_length(v_elemento ->> 'descripcion') > 4000 then
      return 'detalle-del-mueble-largo';
    end if;
  end loop;

  if jsonb_array_length(p_contenido #> '{herrajes,lista}') > 40 then
    return 'demasiados-herrajes';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_contenido #> '{herrajes,lista}') with ordinality as e (valor, orden)
    order by e.orden
  loop
    v_id := v_elemento ->> 'id';
    if v_id !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistos) then
      return 'id-repetido';
    end if;
    v_vistos := v_vistos || v_id;
    if char_length(v_elemento ->> 'texto') > 200 then
      return 'herraje-largo';
    end if;
  end loop;

  -- Grupo por grupo: primero las tildadas, después las propias, cada una con sus ids.
  foreach v_grupo in array c_grupos loop
    if jsonb_array_length(p_contenido -> v_grupo -> 'tildadas') > 20 then
      return 'demasiadas-tildadas';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_contenido -> v_grupo -> 'tildadas') with ordinality as e (valor, orden)
      order by e.orden
    loop
      v_id := v_elemento #>> '{}';
      if v_id !~ '^[a-z0-9-]{1,60}$' then
        return 'id-invalido';
      end if;
      if v_id = any (v_vistos) then
        return 'id-repetido';
      end if;
      v_vistos := v_vistos || v_id;
    end loop;

    if jsonb_array_length(p_contenido -> v_grupo -> 'propias') > 20 then
      return 'demasiadas-propias';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_contenido -> v_grupo -> 'propias') with ordinality as e (valor, orden)
      order by e.orden
    loop
      v_id := v_elemento ->> 'id';
      if v_id !~ '^[a-z0-9-]{1,60}$' then
        return 'id-invalido';
      end if;
      if v_id = any (v_vistos) then
        return 'id-repetido';
      end if;
      v_vistos := v_vistos || v_id;
      if char_length(v_elemento ->> 'texto') > 1000 then
        return 'propia-larga';
      end if;
    end loop;
  end loop;

  if jsonb_typeof(v_forma) = 'object' then
    if (v_forma ->> 'plantillaId') !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if jsonb_typeof(v_forma -> 'texto') = 'string' and char_length(v_forma ->> 'texto') > 2000 then
      return 'forma-de-pago-larga';
    end if;
  end if;

  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_validez is not null and v_validez not between 1 and 365 then
    return 'validez-fuera-de-rango';
  end if;

  return null;
end;
$$;

comment on function private.problema_del_presupuesto(jsonb) is
  'El primer problema que impide guardar un borrador del presupuesto, con el mismo código y en el mismo orden que problemaDelBorrador en presupuesto.ts, o null si se puede guardar. Es permisivo, porque un borrador puede estar a medio hacer: mira la forma y los topes (30 muebles, 40 herrajes, 20 tildadas y 20 propias por grupo, los largos de cada texto, ids únicos) y los rangos del plazo y de la vigencia. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

revoke all on function private.problema_del_presupuesto(jsonb) from public, anon, authenticated;


-- La gemela de problemaDelDocumento ---------------------------------------------------------------------

create function private.problema_del_documento(p_documento jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_taller jsonb;
  v_valores jsonb;
  v_opciones jsonb;
  v_elemento jsonb;
  v_lista text;
  v_sena bigint;
  v_abonado bigint;
  v_plazo bigint;
  v_validez bigint;
  v_meses bigint;
begin
  if jsonb_typeof(p_documento) is distinct from 'object'
    or p_documento -> 'forma' is distinct from '1'::jsonb
  then
    return 'forma-invalida';
  end if;

  v_taller := p_documento -> 'taller';
  if jsonb_typeof(v_taller) is distinct from 'object'
    or jsonb_typeof(v_taller -> 'nombre') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'titular') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'cuit') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'domicilio') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'telefono') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'email') is distinct from 'string'
    or not (
      jsonb_typeof(v_taller -> 'condicionFiscal') is not distinct from 'null'
      or (
        jsonb_typeof(v_taller -> 'condicionFiscal') is not distinct from 'string'
        and (v_taller ->> 'condicionFiscal') in ('monotributo', 'responsable_inscripto', 'exento')
      )
    )
  then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_documento -> 'cliente') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'titulo') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'obra') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'descripcion') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'muebles') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'herrajes') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'aTenerEnCuenta') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'incluye') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'avisos') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'condiciones') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'garantia') is distinct from 'string'
    or coalesce(jsonb_typeof(p_documento -> 'formaDePago'), '') not in ('null', 'string')
  then
    return 'forma-invalida';
  end if;

  for v_elemento in select e.valor from jsonb_array_elements(p_documento -> 'muebles') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  foreach v_lista in array array['herrajes', 'aTenerEnCuenta', 'incluye'] loop
    for v_elemento in select e.valor from jsonb_array_elements(p_documento -> v_lista) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'string' then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  foreach v_lista in array array['avisos', 'condiciones'] loop
    for v_elemento in select e.valor from jsonb_array_elements(p_documento -> v_lista) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
        or coalesce(jsonb_typeof(v_elemento -> 'titulo'), 'null') not in ('null', 'string')
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  -- Los valores: null (un borrador sin importe), el total, o las opciones con su id, su letra, su
  -- descripción y su total.
  v_valores := p_documento -> 'valores';
  v_opciones := '[]'::jsonb;
  if jsonb_typeof(v_valores) is not distinct from 'null' then
    v_valores := null;
  elsif jsonb_typeof(v_valores) is distinct from 'object' then
    return 'forma-invalida';
  elsif v_valores -> 'tipo' = '"total"'::jsonb then
    if private.entero_de_json(v_valores -> 'total') is null then
      return 'forma-invalida';
    end if;
  elsif v_valores -> 'tipo' = '"opciones"'::jsonb
    and jsonb_typeof(v_valores -> 'opciones') = 'array'
  then
    v_opciones := v_valores -> 'opciones';
    for v_elemento in select e.valor from jsonb_array_elements(v_opciones) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'letra') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
        or private.entero_de_json(v_elemento -> 'total') is null
      then
        return 'forma-invalida';
      end if;
    end loop;
  else
    return 'forma-invalida';
  end if;

  v_sena := private.entero_de_json(p_documento -> 'senaBp');
  v_abonado := private.entero_de_json(p_documento -> 'abonado');
  v_plazo := private.entero_de_json(p_documento -> 'plazoDeFabricacion');
  v_meses := private.entero_de_json(p_documento -> 'garantiaMeses');
  if v_sena is null or v_abonado is null or v_plazo is null or v_meses is null then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_documento -> 'validezDias') is not distinct from 'null' then
    v_validez := null;
  else
    v_validez := private.entero_de_json(p_documento -> 'validezDias');
    if v_validez is null then
      return 'forma-invalida';
    end if;
  end if;

  if v_sena < 0 or v_sena > 10000 then
    return 'sena-fuera-de-rango';
  end if;
  if v_abonado < 0 or v_abonado > 1000000000000 then
    return 'abonado-fuera-de-rango';
  end if;
  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_validez is not null and v_validez not between 1 and 365 then
    return 'validez-fuera-de-rango';
  end if;
  if v_meses not between 6 and 120 then
    return 'garantia-fuera-de-rango';
  end if;

  if (
      v_valores -> 'tipo' = '"total"'::jsonb
      and private.entero_de_json(v_valores -> 'total') not between 0 and 1000000000000
    )
    or exists (
      select 1
      from jsonb_array_elements(v_opciones) as e (valor)
      where private.entero_de_json(e.valor -> 'total') not between 0 and 1000000000000
    )
  then
    return 'importe-fuera-de-rango';
  end if;

  if jsonb_array_length(p_documento -> 'muebles') > 30 then
    return 'demasiados-muebles';
  end if;
  if jsonb_array_length(p_documento -> 'herrajes') > 40 then
    return 'demasiados-herrajes';
  end if;
  if greatest(
    jsonb_array_length(p_documento -> 'aTenerEnCuenta'),
    jsonb_array_length(p_documento -> 'incluye'),
    jsonb_array_length(p_documento -> 'avisos'),
    jsonb_array_length(p_documento -> 'condiciones')
  ) > 40 then
    return 'demasiadas-clausulas';
  end if;
  if jsonb_array_length(v_opciones) > 26 then
    return 'demasiadas-opciones';
  end if;

  -- Cada texto con su tope: los del borrador, y los que salen de la plantilla con sus huecos
  -- completados, que pueden crecer un poco.
  if exists (
    select 1
    from (
      select v_taller ->> 'nombre', 120
      union all select v_taller ->> 'titular', 120
      union all select v_taller ->> 'cuit', 13
      union all select v_taller ->> 'domicilio', 300
      union all select v_taller ->> 'telefono', 40
      union all select v_taller ->> 'email', 200
      union all select p_documento ->> 'cliente', 200
      union all select p_documento ->> 'titulo', 200
      union all select p_documento ->> 'obra', 300
      union all select p_documento ->> 'descripcion', 4000
      union all
        select m.valor ->> 'nombre', 120 from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
      union all
        select m.valor ->> 'descripcion', 4000 from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
      union all
        select h.valor #>> '{}', 200 from jsonb_array_elements(p_documento -> 'herrajes') as h (valor)
      union all
        select t.valor #>> '{}', 4000
        from jsonb_array_elements((p_documento -> 'aTenerEnCuenta') || (p_documento -> 'incluye')) as t (valor)
      union all select o.valor ->> 'letra', 3 from jsonb_array_elements(v_opciones) as o (valor)
      union all select o.valor ->> 'descripcion', 500 from jsonb_array_elements(v_opciones) as o (valor)
      union all select coalesce(p_documento ->> 'formaDePago', ''), 4000
      union all
        select coalesce(c.valor ->> 'titulo', ''), 120
        from jsonb_array_elements((p_documento -> 'avisos') || (p_documento -> 'condiciones')) as c (valor)
      union all
        select c.valor ->> 'texto', 4000
        from jsonb_array_elements((p_documento -> 'avisos') || (p_documento -> 'condiciones')) as c (valor)
      union all select p_documento ->> 'garantia', 4000
    ) as t (texto, largo)
    where char_length(t.texto) > t.largo
  ) then
    return 'texto-largo';
  end if;

  return null;
end;
$$;

comment on function private.problema_del_documento(jsonb) is
  'El primer problema que impide congelar un documento del presupuesto, con el mismo código y en el mismo orden que problemaDelDocumento en presupuesto.ts, o null si sirve: la forma de cada campo, los rangos de la seña, de lo pagado, del plazo, de la vigencia, de la garantía y de los importes, los topes de las listas y el largo de cada texto. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

revoke all on function private.problema_del_documento(jsonb) from public, anon, authenticated;


-- La gemela de problemasParaMandar ----------------------------------------------------------------------

create function private.lo_que_falta_para_mandar(p_documento jsonb, p_revision integer, p_que_cambio text)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_falta text[] := array[]::text[];
  v_valores jsonb := p_documento -> 'valores';
  v_escrito text;
begin
  if coalesce(p_documento ->> 'titulo', '') !~ '[^ \t\n\r\f\v]' then
    v_falta := v_falta || 'titulo'::text;
  end if;

  if not coalesce(
    case
      when jsonb_typeof(p_documento -> 'muebles') = 'array' then exists (
        select 1
        from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
        where coalesce(m.valor ->> 'descripcion', '') ~ '[^ \t\n\r\f\v]'
      )
    end,
    false
  ) then
    v_falta := v_falta || 'muebles'::text;
  end if;

  if jsonb_typeof(v_valores) is distinct from 'object' then
    v_falta := v_falta || 'valores'::text;
  elsif v_valores ->> 'tipo' = 'total' then
    if coalesce(private.entero_de_json(v_valores -> 'total') <= 0, true) then
      v_falta := v_falta || 'valores'::text;
    end if;
  elsif jsonb_typeof(v_valores -> 'opciones') is distinct from 'array' then
    v_falta := v_falta || 'valores'::text;
  elsif jsonb_array_length(v_valores -> 'opciones') = 0
    or exists (
      select 1
      from jsonb_array_elements(v_valores -> 'opciones') as o (valor)
      where coalesce(private.entero_de_json(o.valor -> 'total') <= 0, true)
    )
  then
    v_falta := v_falta || 'valores'::text;
  end if;

  if p_revision > 1 then
    v_escrito := regexp_replace(coalesce(p_que_cambio, ''), '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g');
    if v_escrito = '' or char_length(v_escrito) > 280 then
      v_falta := v_falta || 'queCambio'::text;
    end if;
  end if;

  return v_falta;
end;
$$;

comment on function private.lo_que_falta_para_mandar(jsonb, integer, text) is
  'Lo que le falta a un documento para mandarlo, con los mismos campos y en el mismo orden que problemasParaMandar en presupuesto.ts: titulo si no tiene título, muebles si ningún mueble tiene su detalle, valores si no hay total o alguna opción no tiene importe, y queCambio si desde la segunda revisión no dice qué cambió o pasa de 280 caracteres. Vacío si no falta nada. Recibe un documento que ya pasó private.problema_del_documento(). scripts/comparacion.ts las compara caso por caso (ADR 0080).';

revoke all on function private.lo_que_falta_para_mandar(jsonb, integer, text) from public, anon, authenticated;


-- Guardar el borrador -----------------------------------------------------------------------------------

create function private.guardar_el_presupuesto(
  p_id uuid,
  p_proyecto_id uuid,
  p_version integer,
  p_contenido jsonb
)
returns public.presupuestos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid := private.household_actual();
  v_proyecto public.proyectos;
  v_presupuesto public.presupuestos;
  v_problema text;
begin
  if num_nulls(p_id, p_proyecto_id, p_version, p_contenido) > 0 then
    raise exception 'Guardar el presupuesto necesita su id, el trabajo, la revisión que viste y el borrador'
      using errcode = '22004';
  end if;

  -- El trabajo, bloqueado antes de mirar el borrador: un envío o un guardado del mismo trabajo que
  -- corre en paralelo termina antes o espera. Sin RLS acá adentro, toda lectura va por el taller de la
  -- sesión.
  select p.* into v_proyecto
  from public.proyectos p
  where p.household_id = v_household and p.id = p_proyecto_id
  for update;

  if not found then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  select b.* into v_presupuesto
  from public.presupuestos b
  where b.household_id = v_household and b.proyecto_id = p_proyecto_id and b.deleted_at is null;

  -- El reenvío de la cola: este mismo borrador ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_presupuesto.id = p_id
    and v_presupuesto.borrador_version = p_version + 1
    and v_presupuesto.contenido = p_contenido
  then
    return v_presupuesto;
  end if;

  -- Otro aparato lo cambió, o lo arrancó con otro id mientras este no tenía señal: el mismo rechazo, y
  -- antes del insert, porque el índice único daría un 23505 que tapa la cola.
  if (v_presupuesto.id is not null and v_presupuesto.id <> p_id)
    or coalesce(v_presupuesto.borrador_version, 0) <> p_version
  then
    raise exception 'Este presupuesto se cambió en otro aparato.'
      using errcode = 'MN026',
            detail = case
              when v_presupuesto.id <> p_id then 'el trabajo ya tiene otro borrador'
              else format(
                'revisión vista %s, revisión actual %s', p_version, coalesce(v_presupuesto.borrador_version, 0)
              )
            end,
            hint = 'Abrilo de nuevo para ver la última versión y seguí desde ahí.';
  end if;

  if v_proyecto.estado in ('en_curso', 'entregado', 'cobrado') then
    raise exception 'Ya lo aprobó: el presupuesto no se cambia.'
      using errcode = 'MN028',
            detail = v_proyecto.estado::text,
            hint = 'Un cambio después de la seña se arregla aparte con tu cliente.';
  end if;

  if v_proyecto.estado = 'perdido' then
    raise exception 'Este trabajo está perdido: su presupuesto no se cambia.'
      using errcode = 'MN032',
            detail = 'perdido',
            hint = 'Si el cliente volvió, reactivalo desde la ficha y seguí desde ahí.';
  end if;

  -- El código del problema va en el detail, para el registro. La pantalla no deja escribir de más.
  v_problema := private.problema_del_presupuesto(p_contenido);
  if v_problema is not null then
    raise exception 'El presupuesto no se pudo guardar.'
      using errcode = 'MN031',
            detail = v_problema,
            hint = 'Revisalo y probá de nuevo.';
  end if;

  if v_presupuesto.id is null then
    insert into public.presupuestos (id, household_id, proyecto_id, contenido, borrador_version)
    values (p_id, v_household, p_proyecto_id, p_contenido, 1)
    returning * into v_presupuesto;
  else
    update public.presupuestos set
      contenido = p_contenido,
      borrador_version = borrador_version + 1
    where id = v_presupuesto.id
    returning * into v_presupuesto;
  end if;

  return v_presupuesto;
end;
$$;

comment on function private.guardar_el_presupuesto(uuid, uuid, integer, jsonb) is
  'Guarda el borrador del presupuesto de un trabajo con el molde de private.guardar_la_fila(): bloquea el trabajo, compara la revisión del borrador que vio la app (MN026, también si el trabajo ya tiene otro borrador vivo, antes del insert), rechaza si el trabajo está aprobado (MN028) o perdido (MN032), valida con private.problema_del_presupuesto() (MN031, con el código en el detail), hace el alta o la edición y suma uno a borrador_version. Reconoce el reenvío idéntico: el mismo borrador con la revisión siguiente. Toda lectura filtra por el taller de la sesión (ADR 0080).';

revoke all on function private.guardar_el_presupuesto(uuid, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function private.guardar_el_presupuesto(uuid, uuid, integer, jsonb) to authenticated;

create function public.guardar_el_presupuesto(
  p_id uuid,
  p_proyecto_id uuid,
  p_version integer,
  p_contenido jsonb
)
returns public.presupuestos
language sql
set search_path = ''
as $$
  select * from private.guardar_el_presupuesto(p_id, p_proyecto_id, p_version, p_contenido)
$$;

comment on function public.guardar_el_presupuesto(uuid, uuid, integer, jsonb) is
  'RPC del editor del presupuesto: guarda el borrador de un trabajo con la revisión que vio la app y devuelve la fila. Ver private.guardar_el_presupuesto().';

revoke all on function public.guardar_el_presupuesto(uuid, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.guardar_el_presupuesto(uuid, uuid, integer, jsonb) to authenticated;


-- Mandarlo ----------------------------------------------------------------------------------------------

create function private.mandar_el_presupuesto(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_version integer,
  p_documento jsonb,
  p_que_cambio text,
  p_mandado_el date,
  p_vale_hasta date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
    contenido
  ) values (
    p_revision_id, v_household, v_presupuesto.id, v_proyecto.id, v_siguiente, v_presupuesto.numero,
    p_mandado_el, p_vale_hasta,
    case
      when v_siguiente > 1 then regexp_replace(p_que_cambio, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    end,
    p_documento
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
$$;

comment on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) is
  'Manda el presupuesto, en una transacción: bloquea el trabajo y después los ajustes del taller; si la revisión ya existe la devuelve (el reenvío); rechaza si el borrador cambió (MN026), si el trabajo está aprobado (MN028) o perdido (MN032), si el día del envío no llegó (MN033), si el documento no tiene la forma (MN031), si le falta algo para mandarlo (MN027) o si sus importes, su seña o lo pagado no son los del trabajo (MN029); en el primer envío le pone número; congela la revisión siguiente y pasa el trabajo a presupuesto enviado con la vigencia, el último contacto y la tarea tildada. Devuelve la revisión, el borrador, el trabajo y sus próximos contactos. Toda lectura filtra por el taller de la sesión, también la del reenvío (ADR 0080).';

revoke all on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) from public, anon, authenticated;
grant execute on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) to authenticated;

create function public.mandar_el_presupuesto(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_version integer,
  p_documento jsonb,
  p_que_cambio text,
  p_mandado_el date,
  p_vale_hasta date
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id, p_version, p_documento, p_que_cambio, p_mandado_el, p_vale_hasta
  )
$$;

comment on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) is
  'RPC de la hoja de mandar: congela una revisión del presupuesto con el documento que armó la app y devuelve la revisión, el borrador, el trabajo y sus próximos contactos para la réplica. Ver private.mandar_el_presupuesto().';

revoke all on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) from public, anon, authenticated;
grant execute on function public.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date) to authenticated;


-- Se dan de baja con el trabajo -------------------------------------------------------------------------

create function private.borrar_el_presupuesto_del_trabajo(
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
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para borrar un borrador ni una revisión, y
  -- esta puerta no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  update public.revisiones_del_presupuesto r
  set deleted_at = p_momento
  where r.household_id = p_household_id and r.proyecto_id = p_proyecto_id and r.deleted_at is null;

  update public.presupuestos b
  set deleted_at = p_momento
  where b.household_id = p_household_id and b.proyecto_id = p_proyecto_id and b.deleted_at is null;
end;
$$;

comment on function private.borrar_el_presupuesto_del_trabajo(uuid, uuid, timestamptz) is
  'Borra, con la marca del trabajo, el borrador del presupuesto y sus revisiones de un trabajo que ya se borró. Es security definer porque el dueño no tiene grant para escribir ninguna de las dos: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo (ADR 0080).';

revoke all on function private.borrar_el_presupuesto_del_trabajo(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function private.borrar_el_presupuesto_del_trabajo(uuid, uuid, timestamptz) to authenticated;

-- Misma firma: or replace conserva los grants. Suma el presupuesto, que se da de baja como la entrega.
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

  return null;
end;
$$;


-- La réplica trae el borrador y las revisiones ---------------------------------------------------------

-- Dos claves más en el mismo JSON. Un bundle viejo lee solo las tablas que conoce y las ignora.
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
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.deleted_at is null
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.deleted_at is null
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
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.updated_at >= v_desde
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.updated_at >= v_desde
    )
  );
end;
$$;
