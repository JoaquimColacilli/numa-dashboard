-- La plantilla del presupuesto (ADR 0080): los textos de siempre del taller (lo que incluye, lo que hay
-- que tener en cuenta, las formas de pago, los avisos, las condiciones y la garantía) y los números que
-- llevan adentro (el plazo, las modificaciones incluidas, lo que vale una más y los meses de garantía).
--
-- Aditiva: dos columnas nuevas de ajustes, la plantilla en null (la de siempre, PLANTILLA_DE_SIEMPRE de
-- @maun/domain) y su revisión en 0, así el alter no reescribe ninguna fila y no hace falta migrar datos,
-- igual que la fila (ADR 0078). Sin grant de update: las escribe solo
-- public.guardar_la_plantilla_del_presupuesto(), con el molde de guardar_la_fila, y las valida la gemela
-- de problemaDeLaPlantilla. Ninguna fila existente cambia.


-- Las columnas ------------------------------------------------------------------------------------------

alter table public.ajustes
  add column plantilla_del_presupuesto jsonb,
  add column plantilla_del_presupuesto_version integer not null default 0,
  add constraint ajustes_plantilla_del_presupuesto_es_un_objeto check (
    plantilla_del_presupuesto is null or jsonb_typeof(plantilla_del_presupuesto) = 'object'
  ),
  add constraint ajustes_plantilla_del_presupuesto_version_valida check (
    plantilla_del_presupuesto_version >= 0
  );

comment on column public.ajustes.plantilla_del_presupuesto is
  'Los textos de siempre del presupuesto del taller y sus números: lo que incluye, lo que hay que tener en cuenta, las formas de pago, los avisos, las condiciones, la garantía, el plazo de fabricación, las modificaciones incluidas, lo que vale una más y los meses de garantía. Null es la de siempre, PLANTILLA_DE_SIEMPRE de @maun/domain, con los textos del dueño. La valida private.problema_de_la_plantilla() y la escribe solo public.guardar_la_plantilla_del_presupuesto(): no tiene grant de update. Cambiarla no cambia ningún presupuesto ya mandado, que lleva su foto (ADR 0080).';
comment on column public.ajustes.plantilla_del_presupuesto_version is
  'La revisión de la plantilla del presupuesto. Suma uno cada vez que se guarda; un guardado armado con otra revisión rebota con MN030. Arranca en 0.';


-- La gemela de problemaDeLaPlantilla ---------------------------------------------------------------------

create function private.problema_de_la_plantilla(p_plantilla jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_grupos constant text[] := array['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'];
  v_plazo bigint;
  v_modificaciones bigint;
  v_valor bigint;
  v_meses bigint;
  v_grupo text;
  v_elemento jsonb;
  v_vistos text[];
  v_id text;
  v_texto text;
begin
  if jsonb_typeof(p_plantilla) is distinct from 'object'
    or p_plantilla -> 'forma' is distinct from '1'::jsonb
  then
    return 'forma-invalida';
  end if;

  v_plazo := private.entero_de_json(p_plantilla -> 'plazoDeFabricacion');
  v_modificaciones := private.entero_de_json(p_plantilla -> 'modificacionesIncluidas');
  v_valor := private.entero_de_json(p_plantilla -> 'valorDeUnaModificacion');
  v_meses := private.entero_de_json(p_plantilla -> 'garantiaMeses');

  if v_plazo is null or v_modificaciones is null or v_valor is null or v_meses is null
    or jsonb_typeof(p_plantilla -> 'formasDePago') is distinct from 'array'
    or jsonb_typeof(p_plantilla -> 'garantia') is distinct from 'string'
  then
    return 'forma-invalida';
  end if;

  -- La forma entera antes que cualquier tope, como en el dominio: cada grupo es una lista de cláusulas
  -- con su id, su texto, su tilde y un título que puede faltar.
  foreach v_grupo in array c_grupos loop
    if jsonb_typeof(p_plantilla -> v_grupo) is distinct from 'array' then
      return 'forma-invalida';
    end if;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_plantilla -> v_grupo) as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'tildadaPorDefecto') is distinct from 'boolean'
        or coalesce(jsonb_typeof(v_elemento -> 'titulo'), 'null') not in ('null', 'string')
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  for v_elemento in
    select e.valor from jsonb_array_elements(p_plantilla -> 'formasDePago') as e (valor)
  loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_modificaciones not between 0 and 10 then
    return 'modificaciones-fuera-de-rango';
  end if;
  if v_valor < 0 or v_valor > 1000000000000 then
    return 'valor-fuera-de-rango';
  end if;
  if v_meses not between 6 and 120 then
    return 'garantia-fuera-de-rango';
  end if;

  -- Grupo por grupo, y adentro de cada uno, cláusula por cláusula: el primer problema es el que vuelve.
  foreach v_grupo in array c_grupos loop
    if jsonb_array_length(p_plantilla -> v_grupo) > 20 then
      return 'demasiadas-clausulas';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_plantilla -> v_grupo) with ordinality as e (valor, orden)
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
      if jsonb_typeof(v_elemento -> 'titulo') = 'string'
        and char_length(v_elemento ->> 'titulo') > 120
      then
        return 'titulo-largo';
      end if;
      v_texto := v_elemento ->> 'texto';
      if v_texto !~ '[^ \t\n\r\f\v]' then
        return 'texto-vacio';
      end if;
      if char_length(v_texto) > 2000 then
        return 'texto-largo';
      end if;
    end loop;
  end loop;

  if jsonb_array_length(p_plantilla -> 'formasDePago') = 0 then
    return 'sin-formas-de-pago';
  end if;
  if jsonb_array_length(p_plantilla -> 'formasDePago') > 6 then
    return 'demasiadas-formas-de-pago';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_plantilla -> 'formasDePago') with ordinality as e (valor, orden)
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
    if (v_elemento ->> 'nombre') !~ '[^ \t\n\r\f\v]' then
      return 'nombre-vacio';
    end if;
    if char_length(v_elemento ->> 'nombre') > 60 then
      return 'nombre-largo';
    end if;
    v_texto := v_elemento ->> 'texto';
    if v_texto !~ '[^ \t\n\r\f\v]' then
      return 'texto-vacio';
    end if;
    if char_length(v_texto) > 2000 then
      return 'texto-largo';
    end if;
  end loop;

  if (p_plantilla ->> 'garantia') !~ '[^ \t\n\r\f\v]' then
    return 'garantia-vacia';
  end if;
  if char_length(p_plantilla ->> 'garantia') > 2000 then
    return 'garantia-larga';
  end if;

  return null;
end;
$$;

comment on function private.problema_de_la_plantilla(jsonb) is
  'El primer problema que impide guardar una plantilla del presupuesto, con el mismo código y en el mismo orden que problemaDeLaPlantilla en presupuesto.ts, o null si se puede guardar: la forma, los rangos de los números, hasta 20 cláusulas por grupo con ids únicos, títulos de hasta 120 caracteres y textos de hasta 2000 no vacíos, de 1 a 6 formas de pago con nombre de hasta 60, y la garantía. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

revoke all on function private.problema_de_la_plantilla(jsonb) from public, anon, authenticated;


-- Guardar la plantilla --------------------------------------------------------------------------------

create function private.guardar_la_plantilla_del_presupuesto(p_version integer, p_plantilla jsonb)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
  v_problema text;
begin
  if p_version is null then
    raise exception 'Guardar la plantilla necesita la revisión que viste' using errcode = '22004';
  end if;

  -- El candado de los ajustes del taller, como guardar_la_fila: dos guardados a la vez se esperan, y
  -- un presupuesto que se está mandando ve la plantilla de antes o la de después.
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = private.household_actual()
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  -- El reenvío de la cola: esta misma plantilla ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.plantilla_del_presupuesto_version = p_version + 1
    and v_ajustes.plantilla_del_presupuesto is not distinct from p_plantilla
  then
    return v_ajustes;
  end if;

  if v_ajustes.plantilla_del_presupuesto_version <> p_version then
    raise exception 'Los textos del presupuesto se cambiaron en otro aparato.'
      using errcode = 'MN030',
            detail = format(
              'revisión vista %s, revisión actual %s', p_version, v_ajustes.plantilla_del_presupuesto_version
            ),
            hint = 'Abrí la pantalla de nuevo y volvé a guardar.';
  end if;

  -- Null vuelve a la plantilla de siempre: es «Volver a los textos de siempre» de Ajustes.
  if p_plantilla is not null then
    -- El código del problema va en el detail, para el registro. La pantalla ya frena antes con
    -- problemaDeLaPlantilla, que es la misma cuenta.
    v_problema := private.problema_de_la_plantilla(p_plantilla);
    if v_problema is not null then
      raise exception 'Los textos del presupuesto no se pudieron guardar.'
        using errcode = 'MN031',
              detail = v_problema,
              hint = 'Revisalos y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    plantilla_del_presupuesto = p_plantilla,
    plantilla_del_presupuesto_version = plantilla_del_presupuesto_version + 1
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$$;

comment on function private.guardar_la_plantilla_del_presupuesto(integer, jsonb) is
  'Guarda la plantilla del presupuesto del taller con el molde de private.guardar_la_fila(): bloquea los ajustes, compara la revisión que vio la app (MN030), valida la plantilla con private.problema_de_la_plantilla() (MN031, con el código del problema en el detail), la guarda y suma una revisión. Con la plantilla en null vuelve a la de siempre. Reconoce el reenvío idéntico: la misma plantilla con la revisión siguiente. No toca ningún presupuesto ya mandado (ADR 0080).';

revoke all on function private.guardar_la_plantilla_del_presupuesto(integer, jsonb) from public, anon, authenticated;
grant execute on function private.guardar_la_plantilla_del_presupuesto(integer, jsonb) to authenticated;

create function public.guardar_la_plantilla_del_presupuesto(p_version integer, p_plantilla jsonb)
returns public.ajustes
language sql
set search_path = ''
as $$
  select * from private.guardar_la_plantilla_del_presupuesto(p_version, p_plantilla)
$$;

comment on function public.guardar_la_plantilla_del_presupuesto(integer, jsonb) is
  'RPC de Ajustes, «Tu presupuesto»: guarda los textos de siempre del presupuesto con la revisión que vio la app y devuelve la fila de ajustes. Ver private.guardar_la_plantilla_del_presupuesto().';

revoke all on function public.guardar_la_plantilla_del_presupuesto(integer, jsonb) from public, anon, authenticated;
grant execute on function public.guardar_la_plantilla_del_presupuesto(integer, jsonb) to authenticated;
