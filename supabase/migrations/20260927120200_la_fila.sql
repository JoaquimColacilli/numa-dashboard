-- La fila de los tesoros (ADR 0078): cómo reparte cada cobro lo que deja, guardada en los ajustes del
-- taller, con su revisión, y las cinco gemelas de @maun/domain/fila.ts que la validan y la calculan.
--
-- Aditiva. Tres columnas nuevas en public.ajustes: la fila en null (la de siempre, armada con el sueldo
-- y los costos fijos), la revisión en 0 y la fecha del último guardado en null, así el alter no reescribe
-- la fila que ya está. Un trigger que suma una revisión cuando cambia algo que cambia el reparto, las
-- gemelas, y public.guardar_la_fila(), que es la única que escribe la fila. Ninguna fila existente
-- cambia.
--
-- Un bundle de antes sigue andando: no conoce las columnas y no las manda, y el trigger no le cambia
-- nada de lo que lee.


-- Las columnas ------------------------------------------------------------------------------------------

alter table public.ajustes
  add column fila jsonb,
  add column fila_version integer not null default 0,
  add column fila_guardada_at timestamptz,
  add constraint ajustes_fila_es_un_objeto check (fila is null or jsonb_typeof(fila) = 'object'),
  add constraint ajustes_fila_version_valida check (fila_version >= 0);

comment on column public.ajustes.fila is
  'La fila del taller: los pasos con su tope por mes, en el orden que puso el dueño, y el reparto por porcentajes de lo que sobra, con los tesoros por id. Null es la fila de siempre, que private.fila_de_siempre() arma con el sueldo y los costos fijos de esta fila y da lo mismo que la cascada de antes. La valida private.problema_de_la_fila() y la escribe solo public.guardar_la_fila(): no tiene grant de update (ADR 0078).';
comment on column public.ajustes.fila_version is
  'La revisión de la fila. Suma uno cada vez que se guarda y cada vez que cambia algo que cambia el reparto (sin fila guardada, el sueldo, los costos fijos o sueldo_tope_mensual; siempre, perdido_con_sueldo y perdido_con_diezmo). Un cobro armado con otra revisión rebota con MN006. Arranca en 0.';
comment on column public.ajustes.fila_guardada_at is
  'Cuándo se guardó la fila por última vez, o null si nunca se guardó. Es el «rige» del rótulo del plano.';


-- La revisión sube con lo que cambia el reparto -------------------------------------------------------

create function private.contar_la_revision_de_la_fila()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Sin fila guardada, la fila de siempre sale del sueldo y de los costos fijos: cambiarlos es cambiar
  -- la fila. Con o sin fila, un perdido reparte según perdido_con_*. Así un cobro que quedó en la cola
  -- armado con los ajustes de antes rebota con MN006, como siempre, y no con MN008.
  if (
      new.fila is null
      and (
        new.sueldo_mensual_centavos is distinct from old.sueldo_mensual_centavos
        or new.costos_fijos_centavos is distinct from old.costos_fijos_centavos
        or new.sueldo_tope_mensual is distinct from old.sueldo_tope_mensual
      )
    )
    or new.perdido_con_sueldo is distinct from old.perdido_con_sueldo
    or new.perdido_con_diezmo is distinct from old.perdido_con_diezmo
  then
    new.fila_version := new.fila_version + 1;
  end if;
  return new;
end;
$$;

comment on function private.contar_la_revision_de_la_fila() is
  'Trigger de ajustes: suma una revisión a la fila cuando cambia algo que cambia el reparto, sin fila guardada el sueldo, los costos fijos o sueldo_tope_mensual, y siempre perdido_con_sueldo o perdido_con_diezmo. La app hace lo mismo con su fila optimista (ADR 0078).';

revoke all on function private.contar_la_revision_de_la_fila() from public, anon, authenticated;

-- Antes que metadatos, por el orden alfabético de los triggers del mismo momento.
create trigger contar_la_revision_de_la_fila
  before update on public.ajustes
  for each row execute function private.contar_la_revision_de_la_fila();


-- Las gemelas de fila.ts -------------------------------------------------------------------------------

create or replace function private.entero_de_json(p_valor jsonb)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_numero numeric;
begin
  if p_valor is null or jsonb_typeof(p_valor) <> 'number' then
    return null;
  end if;
  v_numero := (p_valor #>> '{}')::numeric;
  if v_numero <> trunc(v_numero) or abs(v_numero) > 9007199254740991 then
    return null;
  end if;
  return v_numero::bigint;
end;
$$;

comment on function private.entero_de_json(jsonb) is 'Un número entero de JSON que entra en un entero seguro de JavaScript, o null. Gemela de esEntero en fila.ts.';
revoke all on function private.entero_de_json(jsonb) from public, anon, authenticated;

create or replace function private.repartir_por_la_fila(
  p_cobrado_centavos bigint,
  p_gastos_centavos bigint,
  p_diezmo_bp integer,
  p_objetivos bigint[],
  p_previos bigint[],
  p_por_mes boolean[],
  p_porcentajes integer[],
  out neta_centavos bigint,
  out diezmo_centavos bigint,
  out topes bigint[],
  out montos bigint[],
  out sobrante_centavos bigint,
  out partes bigint[],
  out remanente_centavos bigint
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_maximo constant bigint := 9007199254740991;
  v_pasos integer;
  v_resto bigint;
  v_tope bigint;
  v_monto bigint;
  v_suma integer := 0;
  i integer;
begin
  if num_nulls(
    p_cobrado_centavos, p_gastos_centavos, p_diezmo_bp, p_objetivos, p_previos, p_por_mes,
    p_porcentajes
  ) > 0 then
    raise exception 'El reparto necesita todos sus parámetros' using errcode = '22004';
  end if;

  v_pasos := cardinality(p_objetivos);
  if cardinality(p_previos) <> v_pasos or cardinality(p_por_mes) <> v_pasos then
    raise exception 'Cada paso lleva su objetivo, lo que ya recibió y si va por mes'
      using errcode = '22023';
  end if;

  if p_cobrado_centavos < 0 or p_gastos_centavos < 0 then
    raise exception 'Lo cobrado y los gastos no pueden ser negativos' using errcode = '22023';
  end if;
  if p_cobrado_centavos > c_maximo or p_gastos_centavos > c_maximo then
    raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
  end if;
  if p_diezmo_bp not between 0 and 10000 then
    raise exception 'El diezmo va en puntos básicos entre 0 y 10000' using errcode = '22023';
  end if;

  for i in 1 .. v_pasos loop
    if p_objetivos[i] is null or p_previos[i] is null or p_por_mes[i] is null then
      raise exception 'Un paso no puede tener datos vacíos' using errcode = '22004';
    end if;
    if p_objetivos[i] < 0 or p_previos[i] < 0 then
      raise exception 'Un objetivo o lo ya recibido no pueden ser negativos' using errcode = '22023';
    end if;
    if p_objetivos[i] > c_maximo or p_previos[i] > c_maximo then
      raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
    end if;
  end loop;

  for i in 1 .. cardinality(p_porcentajes) loop
    if p_porcentajes[i] is null then
      raise exception 'Una parte del reparto no puede ir sin porcentaje' using errcode = '22004';
    end if;
    if p_porcentajes[i] not between 1 and 10000 then
      raise exception 'Una parte del reparto va entre 1 y 10000 puntos básicos' using errcode = '22023';
    end if;
    v_suma := v_suma + p_porcentajes[i];
  end loop;
  if v_suma > 10000 then
    raise exception 'El reparto no puede pasar del 100%%' using errcode = '22023';
  end if;

  neta_centavos := p_cobrado_centavos - p_gastos_centavos;
  topes := '{}';
  montos := '{}';
  partes := '{}';

  if neta_centavos > 0 then
    if neta_centavos::numeric * p_diezmo_bp + 5000 > c_maximo then
      raise exception 'La ganancia es demasiado grande para aplicarle el diezmo con exactitud'
        using errcode = '22003';
    end if;
    diezmo_centavos := (neta_centavos * p_diezmo_bp + 5000) / 10000;
    v_resto := neta_centavos - diezmo_centavos;
  else
    diezmo_centavos := 0;
    v_resto := 0;
  end if;

  for i in 1 .. v_pasos loop
    v_tope := case
      when p_por_mes[i] then greatest(0, p_objetivos[i] - p_previos[i])
      else p_objetivos[i]
    end;
    v_monto := least(v_tope, v_resto);
    v_resto := v_resto - v_monto;
    topes := topes || v_tope;
    montos := montos || v_monto;
  end loop;

  sobrante_centavos := v_resto;
  for i in 1 .. cardinality(p_porcentajes) loop
    if sobrante_centavos::numeric * p_porcentajes[i] > c_maximo then
      raise exception 'Lo que sobra es demasiado grande para repartirlo con exactitud'
        using errcode = '22003';
    end if;
    v_monto := (sobrante_centavos * p_porcentajes[i]) / 10000;
    v_resto := v_resto - v_monto;
    partes := partes || v_monto;
  end loop;

  remanente_centavos := case when neta_centavos > 0 then v_resto else neta_centavos end;
end;
$$;

comment on function private.repartir_por_la_fila(bigint, bigint, integer, bigint[], bigint[], boolean[], integer[]) is 'Reparte la ganancia de un cobro por la fila: el diezmo, cada paso hasta lo que le falta del mes y lo que sobra por porcentajes, cada parte redondeada hacia abajo; el resto y los centavos quedan en el taller. Gemela de repartir en fila.ts.';
revoke all on function private.repartir_por_la_fila(bigint, bigint, integer, bigint[], bigint[], boolean[], integer[]) from public, anon, authenticated;

create or replace function private.fila_de_siempre(
  p_sueldo_centavos bigint,
  p_fijos_centavos bigint,
  p_sueldo_tope_mensual boolean,
  p_hogar uuid,
  p_maun uuid
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_pasos jsonb := '[]'::jsonb;
begin
  if num_nulls(p_sueldo_centavos, p_fijos_centavos, p_sueldo_tope_mensual, p_hogar, p_maun) > 0 then
    raise exception 'La fila de siempre necesita todos sus parámetros' using errcode = '22004';
  end if;
  if p_sueldo_centavos < 0 or p_fijos_centavos < 0 then
    raise exception 'El sueldo y los costos fijos no pueden ser negativos' using errcode = '22023';
  end if;
  if p_sueldo_centavos > 9007199254740991 or p_fijos_centavos > 9007199254740991 then
    raise exception 'El sueldo o los costos fijos pasan el máximo que se puede contar sin perder centavos' using errcode = '22003';
  end if;

  if p_sueldo_centavos > 0 then
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'tesoro', p_hogar, 'clase', 'sueldo', 'tope', p_sueldo_centavos,
      'renglones', '[]'::jsonb, 'desde', null
    ));
  end if;
  if p_fijos_centavos > 0 then
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'tesoro', p_maun, 'clase', 'fijos', 'tope', p_fijos_centavos,
      'renglones', jsonb_build_array(jsonb_build_object('nombre', 'Costos fijos', 'monto', p_fijos_centavos)),
      'desde', null
    ));
  end if;

  return jsonb_build_object(
    'pasos', v_pasos, 'reparto', '[]'::jsonb, 'sueldoPorTrabajo', not p_sueldo_tope_mensual
  );
end;
$$;

comment on function private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid) is 'La fila de un taller que nunca guardó la suya: el sueldo al hogar y los costos fijos apartados en el taller, como la cascada de antes. Gemela de filaDeSiempre en fila.ts.';
revoke all on function private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid) from public, anon, authenticated;

create or replace function private.problema_de_la_fila(p_fila jsonb, p_tesoros jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_formato_id constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  c_formato_mes constant text := '^[0-9]{4}-(0[1-9]|1[0-2])$';
  c_maximo constant bigint := 1000000000000;
  v_paso jsonb;
  v_parte jsonb;
  v_renglon jsonb;
  v_tesoro jsonb;
  v_clave text;
  v_clase text;
  v_vistos text[] := '{}';
  v_tope bigint;
  v_monto bigint;
  v_suma bigint;
  v_porcentaje bigint;
  v_suma_del_reparto bigint := 0;
begin
  if jsonb_typeof(p_fila) is distinct from 'object'
    or jsonb_typeof(p_fila -> 'pasos') is distinct from 'array'
    or jsonb_typeof(p_fila -> 'reparto') is distinct from 'array'
    or jsonb_typeof(p_fila -> 'sueldoPorTrabajo') is distinct from 'boolean'
  then
    return 'forma-invalida';
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') loop
    if jsonb_typeof(v_paso) is distinct from 'object'
      or jsonb_typeof(v_paso -> 'tesoro') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'clase') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'renglones') is distinct from 'array'
      or not (v_paso ? 'desde')
      or jsonb_typeof(v_paso -> 'desde') not in ('null', 'string')
    then
      return 'forma-invalida';
    end if;
    if (v_paso ->> 'tesoro') !~ c_formato_id
      or (v_paso ->> 'clase') not in ('sueldo', 'fijos', 'prioridad')
      or private.entero_de_json(v_paso -> 'tope') is null
    then
      return 'forma-invalida';
    end if;
    for v_renglon in select value from jsonb_array_elements(v_paso -> 'renglones') loop
      if jsonb_typeof(v_renglon) is distinct from 'object'
        or jsonb_typeof(v_renglon -> 'nombre') is distinct from 'string'
        or private.entero_de_json(v_renglon -> 'monto') is null
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') loop
    if jsonb_typeof(v_parte) is distinct from 'object'
      or jsonb_typeof(v_parte -> 'tesoro') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
    if (v_parte ->> 'tesoro') !~ c_formato_id
      or private.entero_de_json(v_parte -> 'porcentaje') is null
    then
      return 'forma-invalida';
    end if;
  end loop;

  if jsonb_array_length(p_fila -> 'pasos') > 12 then
    return 'demasiados-pasos';
  end if;
  if jsonb_array_length(p_fila -> 'reparto') > 8 then
    return 'demasiadas-partes';
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) t
    where t.value ->> 'id' = v_paso ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if (v_paso ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave is not distinct from 'diezmo' then
      return 'diezmo-en-la-fila';
    end if;

    v_clase := v_paso ->> 'clase';
    if v_clave is not distinct from 'hogar' and v_clase <> 'sueldo' then
      return 'hogar-no-es-sueldo';
    end if;
    if v_clase = 'sueldo' and v_clave is distinct from 'hogar' then
      return 'sueldo-no-es-hogar';
    end if;
    if v_clave is not distinct from 'maun' and v_clase <> 'fijos' then
      return 'maun-no-es-fijos';
    end if;

    v_tope := private.entero_de_json(v_paso -> 'tope');
    if v_tope < 0 or v_tope > c_maximo then
      return 'tope-fuera-de-rango';
    end if;

    if v_clase <> 'fijos' then
      if jsonb_array_length(v_paso -> 'renglones') > 0 then
        return 'renglones-en-otra-clase';
      end if;
    else
      if jsonb_array_length(v_paso -> 'renglones') = 0 then
        return 'fijos-sin-renglones';
      end if;
      if jsonb_array_length(v_paso -> 'renglones') > 12 then
        return 'demasiados-renglones';
      end if;
      v_suma := 0;
      for v_renglon in select value from jsonb_array_elements(v_paso -> 'renglones') with ordinality order by ordinality loop
        if btrim(v_renglon ->> 'nombre') = '' then
          return 'renglon-sin-nombre';
        end if;
        if char_length(v_renglon ->> 'nombre') > 40 then
          return 'renglon-largo';
        end if;
        v_monto := private.entero_de_json(v_renglon -> 'monto');
        if v_monto <= 0 or v_monto > c_maximo then
          return 'renglon-fuera-de-rango';
        end if;
        v_suma := v_suma + v_monto;
      end loop;
      if v_suma <> v_tope then
        return 'tope-no-es-la-suma';
      end if;
    end if;

    if jsonb_typeof(v_paso -> 'desde') = 'string' and (v_paso ->> 'desde') !~ c_formato_mes then
      return 'desde-invalido';
    end if;

    v_vistos := v_vistos || (v_paso ->> 'tesoro');
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) t
    where t.value ->> 'id' = v_parte ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if (v_parte ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave is not distinct from 'diezmo' then
      return 'diezmo-en-la-fila';
    end if;
    if v_clave is not distinct from 'maun' then
      return 'maun-en-el-reparto';
    end if;
    if v_clave is not distinct from 'hogar' then
      return 'hogar-en-el-reparto';
    end if;
    v_porcentaje := private.entero_de_json(v_parte -> 'porcentaje');
    if v_porcentaje < 1 or v_porcentaje > 10000 then
      return 'porcentaje-invalido';
    end if;
    v_suma_del_reparto := v_suma_del_reparto + v_porcentaje;
    v_vistos := v_vistos || (v_parte ->> 'tesoro');
  end loop;

  if v_suma_del_reparto > 10000 then
    return 'reparto-pasa-de-cien';
  end if;
  if (p_fila ->> 'sueldoPorTrabajo')::boolean then
    return 'sueldo-por-trabajo';
  end if;
  return null;
end;
$$;

comment on function private.problema_de_la_fila(jsonb, jsonb) is 'El primer problema que impide guardar una fila, con el mismo código y en el mismo orden que problemasDeLaFila en fila.ts, o null si se puede guardar. Recibe los tesoros del taller como un arreglo de {id, clave, archivado}.';
revoke all on function private.problema_de_la_fila(jsonb, jsonb) from public, anon, authenticated;

create or replace function private.plan_del_reparto(
  p_destino text,
  p_fila jsonb,
  p_perdido_con_sueldo boolean,
  p_perdido_con_diezmo boolean,
  out diezmo_bp integer,
  out tesoros uuid[],
  out clases text[],
  out objetivos bigint[],
  out por_mes boolean[],
  out tesoros_del_reparto uuid[],
  out porcentajes integer[]
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_perdido boolean;
  v_por_trabajo boolean;
  v_paso jsonb;
  v_parte jsonb;
begin
  if num_nulls(p_destino, p_fila, p_perdido_con_sueldo, p_perdido_con_diezmo) > 0 then
    raise exception 'El plan del reparto necesita todos sus parámetros' using errcode = '22004';
  end if;
  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se reparte al cobrar o al dar por perdido' using errcode = '22023';
  end if;

  v_perdido := p_destino = 'perdido';
  v_por_trabajo := (p_fila ->> 'sueldoPorTrabajo')::boolean;
  diezmo_bp := case when v_perdido and not p_perdido_con_diezmo then 0 else 1000 end;
  tesoros := '{}';
  clases := '{}';
  objetivos := '{}';
  por_mes := '{}';
  tesoros_del_reparto := '{}';
  porcentajes := '{}';

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    tesoros := tesoros || (v_paso ->> 'tesoro')::uuid;
    clases := clases || (v_paso ->> 'clase');
    objetivos := objetivos || case
      when v_perdido and v_paso ->> 'clase' = 'sueldo' and not p_perdido_con_sueldo then 0::bigint
      else (v_paso ->> 'tope')::bigint
    end;
    por_mes := por_mes || not (v_paso ->> 'clase' = 'sueldo' and v_por_trabajo);
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    tesoros_del_reparto := tesoros_del_reparto || (v_parte ->> 'tesoro')::uuid;
    porcentajes := porcentajes || (v_parte ->> 'porcentaje')::integer;
  end loop;
end;
$$;

comment on function private.plan_del_reparto(text, jsonb, boolean, boolean) is 'Con qué diezmo y qué objetivos se reparte un cobro o un perdido según la fila: un perdido lleva diezmo y sueldo según los ajustes, y el sueldo por trabajo no mira el mes. Gemela de planDelReparto en fila.ts. Recibe una fila ya validada.';
revoke all on function private.plan_del_reparto(text, jsonb, boolean, boolean) from public, anon, authenticated;

-- Guardar la fila ---------------------------------------------------------------------------------------

create function private.guardar_la_fila(p_version integer, p_fila jsonb)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajustes public.ajustes;
  v_tesoros jsonb;
  v_problema text;
begin
  if p_version is null then
    raise exception 'Guardar la fila necesita la revisión que viste' using errcode = '22004';
  end if;

  -- El mismo candado que una liquidación: un cobro del taller ve la fila de antes o la de después,
  -- nunca una a medias, y dos guardados a la vez se esperan.
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = private.household_actual()
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  -- El reenvío de la cola: esta misma fila ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.fila_version = p_version + 1 and v_ajustes.fila is not distinct from p_fila then
    return v_ajustes;
  end if;

  if v_ajustes.fila_version <> p_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_ajustes.fila_version);
  end if;

  -- Null vuelve a la fila de siempre. La pantalla no lo ofrece: lo usan los e2e para dejar sin fila
  -- el taller de prueba.
  if p_fila is not null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object('id', t.id, 'clave', t.clave, 'archivado', t.archivado_at is not null)
      ),
      '[]'::jsonb
    )
    into v_tesoros
    from public.tesoros t
    where t.household_id = v_ajustes.household_id
      and t.deleted_at is null;

    -- El código del problema va en el detail, para el registro. La app no lo lee: la pantalla ya
    -- frena antes con problemasDeLaFila, que es la misma cuenta.
    v_problema := private.problema_de_la_fila(p_fila, v_tesoros);
    if v_problema is not null then
      raise exception 'La fila no se pudo guardar.'
        using errcode = 'MN023',
              detail = v_problema,
              hint = 'Revisala y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    fila = p_fila,
    fila_version = fila_version + 1,
    fila_guardada_at = clock_timestamp()
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$$;

comment on function private.guardar_la_fila(integer, jsonb) is
  'Guarda la fila del taller: bloquea los ajustes, compara la revisión que vio la app (MN006), valida la fila con private.problema_de_la_fila() contra los tesoros del taller (MN023, con el código del problema en el detail), la guarda, suma una revisión y anota la fecha. Con la fila en null vuelve a la fila de siempre. Reconoce el reenvío idéntico: la misma fila con la revisión siguiente. Los cambios valen desde el próximo cobro: no toca ninguna liquidación hecha (ADR 0003 y 0078).';

revoke all on function private.guardar_la_fila(integer, jsonb) from public, anon, authenticated;
grant execute on function private.guardar_la_fila(integer, jsonb) to authenticated;

create function public.guardar_la_fila(p_version integer, p_fila jsonb)
returns public.ajustes
language sql
set search_path = ''
as $$
  select * from private.guardar_la_fila(p_version, p_fila)
$$;

comment on function public.guardar_la_fila(integer, jsonb) is
  'RPC de la pantalla Tesoros: guarda la fila del taller con la revisión que vio la app y devuelve la fila de ajustes. Ver private.guardar_la_fila().';

revoke all on function public.guardar_la_fila(integer, jsonb) from public, anon, authenticated;
grant execute on function public.guardar_la_fila(integer, jsonb) to authenticated;
