-- La fila reparte pesos (ADR 0081): un tesoro en dólares no entra en la fila, ni como obligación, ni
-- como paso, ni como parte, ni como superávit. Es el código tesoro-en-otra-moneda de
-- private.problema_de_la_fila, gemelo de problemaDelTesoro y problemaDelSuperavit de fila.ts, después
-- de tesoro-archivado y en los mismos cuatro lugares. El rechazo sigue siendo MN023 con el código en el
-- detail: no hace falta un MN nuevo.
--
-- private.guardar_la_fila le pasa la moneda de cada tesoro, leída de la tabla; problema_de_la_fila
-- tolera que falte y la toma como ARS. repartir_por_la_fila, plan_del_reparto, previo_del_mes,
-- lo_del_mes_es_otro y fila_de_siempre no cambian: con la fila validada y la moneda inmutable (MN034),
-- ningún tesoro en otra moneda llega al plan.

create or replace function private.problema_de_la_fila(p_fila jsonb, p_tesoros jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $function$
declare
  c_formato_id constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  c_formato_mes constant text := '^[0-9]{4}-(0[1-9]|1[0-2])$';
  c_maximo constant bigint := 1000000000000;
  v_diezmo text;
  v_maun text;
  v_obligaciones jsonb;
  v_superavit text;
  v_obligacion jsonb;
  v_paso jsonb;
  v_parte jsonb;
  v_renglon jsonb;
  v_tesoro jsonb;
  v_clave text;
  v_clase text;
  v_modo text;
  v_vistos text[] := '{}';
  v_tope bigint;
  v_monto bigint;
  v_suma bigint;
  v_dia bigint;
  v_porcentaje bigint;
  v_suma_del_reparto bigint := 0;
  v_con_diezmo boolean := false;
  v_lugar integer := 0;
begin
  -- Los ids del diezmo y de Maun salen de los tesoros del taller, como sistemaDeLosTesoros: vacíos si
  -- no están, y entonces lo que se completa con ellos no es un tesoro conocido.
  v_diezmo := coalesce(
    (select t.value ->> 'id' from jsonb_array_elements(p_tesoros) as t where t.value ->> 'clave' = 'diezmo' limit 1),
    ''
  );
  v_maun := coalesce(
    (select t.value ->> 'id' from jsonb_array_elements(p_tesoros) as t where t.value ->> 'clave' = 'maun' limit 1),
    ''
  );

  -- La forma, como leerLaFila: una clave que falta toma lo de siempre y una que está con otro tipo no
  -- se lee.
  if jsonb_typeof(p_fila) is distinct from 'object'
    or jsonb_typeof(p_fila -> 'sueldoPorTrabajo') is distinct from 'boolean'
    or jsonb_typeof(p_fila -> 'pasos') is distinct from 'array'
    or jsonb_typeof(p_fila -> 'reparto') is distinct from 'array'
    or (p_fila ? 'obligaciones' and jsonb_typeof(p_fila -> 'obligaciones') is distinct from 'array')
    or (
      p_fila ? 'superavit'
      and (jsonb_typeof(p_fila -> 'superavit') is distinct from 'string' or (p_fila ->> 'superavit') !~ c_formato_id)
    )
  then
    return 'forma-invalida';
  end if;

  if p_fila ? 'obligaciones' then
    for v_obligacion in select value from jsonb_array_elements(p_fila -> 'obligaciones') loop
      if jsonb_typeof(v_obligacion) is distinct from 'object'
        or jsonb_typeof(v_obligacion -> 'tesoro') is distinct from 'string'
        or jsonb_typeof(v_obligacion -> 'base') is distinct from 'string'
      then
        return 'forma-invalida';
      end if;
      if (v_obligacion ->> 'tesoro') !~ c_formato_id
        or private.entero_de_json(v_obligacion -> 'porcentaje') is null
        or (v_obligacion ->> 'base') not in ('cobrado', 'ingreso')
      then
        return 'forma-invalida';
      end if;
    end loop;
    v_obligaciones := p_fila -> 'obligaciones';
  else
    v_obligaciones := jsonb_build_array(
      jsonb_build_object('tesoro', v_diezmo, 'porcentaje', 1000, 'base', 'ingreso')
    );
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') loop
    if jsonb_typeof(v_paso) is distinct from 'object'
      or jsonb_typeof(v_paso -> 'tesoro') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'clase') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'renglones') is distinct from 'array'
      or not (v_paso ? 'desde')
      or jsonb_typeof(v_paso -> 'desde') not in ('null', 'string')
      or (v_paso ? 'modo' and jsonb_typeof(v_paso -> 'modo') is distinct from 'string')
      or (v_paso ? 'hastaLaMeta' and jsonb_typeof(v_paso -> 'hastaLaMeta') is distinct from 'boolean')
    then
      return 'forma-invalida';
    end if;
    if (v_paso ->> 'tesoro') !~ c_formato_id
      or (v_paso ->> 'clase') not in ('sueldo', 'fijos', 'prioridad')
      or private.entero_de_json(v_paso -> 'tope') is null
      or coalesce(v_paso ->> 'modo', 'mes') not in ('mes', 'saldo', 'trabajo')
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
      -- Sin día, o con el día en null, no tiene día de pago; si lo tiene, es un entero.
      if coalesce(jsonb_typeof(v_renglon -> 'dia'), 'null') <> 'null'
        and private.entero_de_json(v_renglon -> 'dia') is null
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') loop
    if jsonb_typeof(v_parte) is distinct from 'object'
      or jsonb_typeof(v_parte -> 'tesoro') is distinct from 'string'
      or (v_parte ? 'hastaLaMeta' and jsonb_typeof(v_parte -> 'hastaLaMeta') is distinct from 'boolean')
    then
      return 'forma-invalida';
    end if;
    if (v_parte ->> 'tesoro') !~ c_formato_id
      or private.entero_de_json(v_parte -> 'porcentaje') is null
    then
      return 'forma-invalida';
    end if;
  end loop;

  v_superavit := coalesce(p_fila ->> 'superavit', v_maun);

  -- Los problemas, en el orden de problemasDeLaFila: el primero es el que se devuelve.
  if jsonb_array_length(v_obligaciones) > 6 then
    return 'demasiadas-obligaciones';
  end if;
  if jsonb_array_length(p_fila -> 'pasos') > 12 then
    return 'demasiados-pasos';
  end if;
  if jsonb_array_length(p_fila -> 'reparto') > 8 then
    return 'demasiadas-partes';
  end if;

  for v_obligacion in select value from jsonb_array_elements(v_obligaciones) with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_obligacion ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if coalesce(v_tesoro ->> 'moneda', 'ARS') <> 'ARS' then
      return 'tesoro-en-otra-moneda';
    end if;
    if (v_obligacion ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave in ('hogar', 'maun') then
      return 'obligacion-en-hogar-o-maun';
    end if;
    v_porcentaje := private.entero_de_json(v_obligacion -> 'porcentaje');
    if v_porcentaje < 1 or v_porcentaje > 10000 or (v_obligacion ->> 'base') not in ('cobrado', 'ingreso') then
      return 'obligacion-invalida';
    end if;
    if v_clave = 'diezmo' then
      v_con_diezmo := true;
    end if;
    v_vistos := v_vistos || (v_obligacion ->> 'tesoro');
  end loop;

  if not v_con_diezmo then
    return 'sin-diezmo';
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    v_lugar := v_lugar + 1;
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_paso ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if coalesce(v_tesoro ->> 'moneda', 'ARS') <> 'ARS' then
      return 'tesoro-en-otra-moneda';
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
        v_dia := private.entero_de_json(v_renglon -> 'dia');
        if v_dia is not null and (v_dia < 1 or v_dia > 31) then
          return 'dia-invalido';
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

    -- Cómo se llena, como modosPosibles: el sueldo y Maun, por mes; los gastos fijos, por mes o por
    -- su saldo; un ahorro fijo, de las tres formas.
    v_modo := coalesce(v_paso ->> 'modo', 'mes');
    if not (
      case
        when v_clave is not distinct from 'maun' or v_clase = 'sueldo' then v_modo = 'mes'
        when v_clase = 'fijos' then v_modo in ('mes', 'saldo')
        else true
      end
    ) then
      return 'modo-invalido';
    end if;

    if coalesce((v_paso ->> 'hastaLaMeta')::boolean, false) then
      if v_clase <> 'prioridad' then
        return 'meta-fuera-de-ahorro';
      end if;
      if coalesce(private.entero_de_json(v_tesoro -> 'meta'), 0) <= 0 then
        return 'meta-sin-monto';
      end if;
    end if;

    -- Un ahorro no va antes de un compromiso.
    if v_clase = 'prioridad' and exists (
      select 1
      from jsonb_array_elements(p_fila -> 'pasos') with ordinality as s (valor, lugar)
      where s.lugar > v_lugar and s.valor ->> 'clase' <> 'prioridad'
    ) then
      return 'ahorro-antes-de-compromiso';
    end if;

    v_vistos := v_vistos || (v_paso ->> 'tesoro');
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_parte ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if coalesce(v_tesoro ->> 'moneda', 'ARS') <> 'ARS' then
      return 'tesoro-en-otra-moneda';
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
    if coalesce((v_parte ->> 'hastaLaMeta')::boolean, false)
      and coalesce(private.entero_de_json(v_tesoro -> 'meta'), 0) <= 0
    then
      return 'meta-sin-monto';
    end if;
    v_suma_del_reparto := v_suma_del_reparto + v_porcentaje;
    v_vistos := v_vistos || (v_parte ->> 'tesoro');
  end loop;

  if v_suma_del_reparto > 10000 then
    return 'reparto-pasa-de-cien';
  end if;

  -- El superávit: un tesoro conocido, vivo y en pesos, que no sea Hogar ni el diezmo ni esté ya en la
  -- fila (Maun sí puede, aunque sea un paso de gastos fijos).
  select t.value into v_tesoro
  from jsonb_array_elements(p_tesoros) as t
  where t.value ->> 'id' = v_superavit
  limit 1;
  if v_tesoro is null then
    return 'tesoro-desconocido';
  end if;
  if (v_tesoro ->> 'archivado')::boolean then
    return 'tesoro-archivado';
  end if;
  if coalesce(v_tesoro ->> 'moneda', 'ARS') <> 'ARS' then
    return 'tesoro-en-otra-moneda';
  end if;
  v_clave := v_tesoro ->> 'clave';
  if v_clave in ('hogar', 'diezmo') then
    return 'superavit-invalido';
  end if;
  if v_clave is distinct from 'maun' and v_superavit = any (v_vistos) then
    return 'superavit-en-la-fila';
  end if;

  if (p_fila ->> 'sueldoPorTrabajo')::boolean then
    return 'sueldo-por-trabajo';
  end if;
  return null;
end;
$function$;

comment on function private.problema_de_la_fila(jsonb, jsonb) is
  'El primer problema que impide guardar una fila, con el mismo código y en el mismo orden que problemasDeLaFila en fila.ts, o null si se puede guardar. Lee la forma del primer pedido completando lo que falta con lo de siempre, como leerLaFila, con los ids del diezmo y de Maun sacados de los tesoros. Recibe los tesoros del taller como un arreglo de {id, clave, archivado, meta, moneda}: la meta de Cocos es la de ajustes, un tesoro tiene meta si es mayor que cero, y uno que no es de la moneda del taller (ARS si la moneda falta) no entra en la fila: tesoro-en-otra-moneda (ADR 0081). Gemela de primerProblemaDeLaFila (ADR 0078).';

create or replace function private.guardar_la_fila(p_version integer, p_fila jsonb)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $function$
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
    -- Los tesoros del taller con su meta y su moneda: la meta de Cocos sigue en ajustes, la de los
    -- demás en tesoros.
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'clave', t.clave,
          'archivado', t.archivado_at is not null,
          'meta', case when t.clave = 'cocos' then v_ajustes.meta_cocos_centavos else t.meta_centavos end,
          'moneda', t.moneda
        )
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
$function$;

comment on function private.guardar_la_fila(integer, jsonb) is
  'Guarda la fila del taller: bloquea los ajustes, compara la revisión que vio la app (MN006), valida la fila con private.problema_de_la_fila() contra los tesoros del taller con su meta (la de Cocos, de ajustes) y su moneda (MN023, con el código del problema en el detail; un tesoro en dólares no entra, ADR 0081), la guarda, suma una revisión y anota la fecha. Con la fila en null vuelve a la fila de siempre. Reconoce el reenvío idéntico: la misma fila con la revisión siguiente. Los cambios valen desde el próximo cobro: no toca ninguna liquidación hecha (ADR 0003 y 0078).';
