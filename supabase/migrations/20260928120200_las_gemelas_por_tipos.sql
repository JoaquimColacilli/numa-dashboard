-- Las gemelas de fila.ts con la fila por tipos (ADR 0078, los tipos de tesoro): las obligaciones sobre
-- lo cobrado o sobre el ingreso, cómo se llena cada paso (por mes, por su saldo o por trabajo), las
-- metas de los ahorros, los días de pago de los renglones y el superávit a elección.
--
-- Leen la forma del primer pedido completando lo que falta con lo de siempre, como leerLaFila: sin
-- obligaciones, el diezmo al 10% sobre el ingreso; sin modo, por mes; sin hastaLaMeta, sin meta; sin
-- día, sin día de pago; sin superávit, Maun. Así se siguen leyendo ajustes.fila, dist_fila y
-- reapertura_fila guardados antes.
--
-- Las que cambian de firma (repartir_por_la_fila, plan_del_reparto y fila_de_siempre) van por drop y
-- create, con su revoke, como las del primer pedido. problema_de_la_fila no cambia de firma: or
-- replace. Dos gemelas nuevas: previo_del_mes (el previo de cada paso según su modo y el tope de cada
-- parte que va hasta la meta) y la versión de lo_del_mes_es_otro que mira también las partes. La de
-- antes de lo_del_mes_es_otro la sigue usando private.liquidar hasta la migración siguiente, que la
-- reemplaza y recién ahí la saca.
--
-- Lo que autorizó el dueño aunque la regla lo cuente como destructivo: el drop y create de las
-- gemelas que cambian de firma, que son de este mismo PR. Ninguna la llama una app en producción: las
-- usa el camino por la fila, que todavía no tiene ningún taller.


-- El reparto ----------------------------------------------------------------------------------------------

drop function private.repartir_por_la_fila(bigint, bigint, integer, bigint[], bigint[], boolean[], integer[]);

create function private.repartir_por_la_fila(
  p_cobrado_centavos bigint,
  p_gastos_centavos bigint,
  p_obligaciones integer[],
  p_bases text[],
  p_objetivos bigint[],
  p_previos bigint[],
  p_por_mes boolean[],
  p_porcentajes integer[],
  p_topes bigint[],
  out neta_centavos bigint,
  out obligaciones bigint[],
  out libre_centavos bigint,
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
  v_obligaciones integer;
  v_pasos integer;
  v_partes integer;
  v_resto bigint;
  v_sobre bigint;
  v_tope bigint;
  v_monto bigint;
  v_suma integer := 0;
  i integer;
begin
  if num_nulls(
    p_cobrado_centavos, p_gastos_centavos, p_obligaciones, p_bases, p_objetivos, p_previos, p_por_mes,
    p_porcentajes, p_topes
  ) > 0 then
    raise exception 'El reparto necesita todos sus parámetros' using errcode = '22004';
  end if;

  v_obligaciones := cardinality(p_obligaciones);
  v_pasos := cardinality(p_objetivos);
  v_partes := cardinality(p_porcentajes);
  if cardinality(p_bases) <> v_obligaciones then
    raise exception 'Cada obligación lleva su porcentaje y sobre qué se calcula' using errcode = '22023';
  end if;
  if cardinality(p_previos) <> v_pasos or cardinality(p_por_mes) <> v_pasos then
    raise exception 'Cada paso lleva su objetivo, lo que ya tiene y si descuenta lo que tiene'
      using errcode = '22023';
  end if;
  if cardinality(p_topes) <> v_partes then
    raise exception 'Cada parte lleva su tope, o null si junta sin fin' using errcode = '22023';
  end if;

  if p_cobrado_centavos < 0 or p_gastos_centavos < 0 then
    raise exception 'Lo cobrado y los gastos no pueden ser negativos' using errcode = '22023';
  end if;
  if p_cobrado_centavos > c_maximo or p_gastos_centavos > c_maximo then
    raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
  end if;

  for i in 1 .. v_obligaciones loop
    if p_obligaciones[i] is null or p_bases[i] is null then
      raise exception 'Una obligación no puede tener datos vacíos' using errcode = '22004';
    end if;
    if p_obligaciones[i] not between 0 and 10000 then
      raise exception 'Una obligación va en puntos básicos entre 0 y 10000' using errcode = '22023';
    end if;
    if p_bases[i] not in ('cobrado', 'ingreso') then
      raise exception 'Una obligación se calcula sobre lo cobrado o sobre el ingreso' using errcode = '22023';
    end if;
  end loop;

  for i in 1 .. v_pasos loop
    if p_objetivos[i] is null or p_previos[i] is null or p_por_mes[i] is null then
      raise exception 'Un paso no puede tener datos vacíos' using errcode = '22004';
    end if;
    if p_objetivos[i] < 0 or p_previos[i] < 0 then
      raise exception 'Un objetivo o lo que un paso ya tiene no pueden ser negativos' using errcode = '22023';
    end if;
    if p_objetivos[i] > c_maximo or p_previos[i] > c_maximo then
      raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
    end if;
  end loop;

  for i in 1 .. v_partes loop
    if p_porcentajes[i] is null then
      raise exception 'Una parte del reparto no puede ir sin porcentaje' using errcode = '22004';
    end if;
    if p_porcentajes[i] not between 1 and 10000 then
      raise exception 'Una parte del reparto va entre 1 y 10000 puntos básicos' using errcode = '22023';
    end if;
    -- Un tope en null es una parte que junta sin fin; si lo tiene, es lo que le falta para su meta.
    if p_topes[i] < 0 then
      raise exception 'El tope de una parte no puede ser negativo' using errcode = '22023';
    end if;
    if p_topes[i] > c_maximo then
      raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
    end if;
    v_suma := v_suma + p_porcentajes[i];
  end loop;
  if v_suma > 10000 then
    raise exception 'El reparto no puede pasar del 100%%' using errcode = '22023';
  end if;

  neta_centavos := p_cobrado_centavos - p_gastos_centavos;
  v_resto := case when neta_centavos > 0 then neta_centavos else 0 end;
  obligaciones := '{}';
  topes := '{}';
  montos := '{}';
  partes := '{}';

  -- Las obligaciones, en su orden: su porcentaje de lo cobrado o de lo que les llega, redondeado como
  -- el diezmo (mitad hacia arriba), y nunca más que lo que llega. Con un ingreso que no es positivo
  -- no se aparta nada.
  for i in 1 .. v_obligaciones loop
    if neta_centavos > 0 then
      v_sobre := case p_bases[i] when 'cobrado' then p_cobrado_centavos else v_resto end;
      if v_sobre::numeric * p_obligaciones[i] + 5000 > c_maximo then
        raise exception 'El importe es demasiado grande para aplicarle una obligación con exactitud'
          using errcode = '22003';
      end if;
      v_monto := least((v_sobre * p_obligaciones[i] + 5000) / 10000, v_resto);
    else
      v_monto := 0;
    end if;
    v_resto := v_resto - v_monto;
    obligaciones := obligaciones || v_monto;
  end loop;
  libre_centavos := v_resto;

  -- Los compromisos y los ahorros fijos, cada uno hasta lo que le falta.
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

  -- Los ahorros por porcentaje, sobre lo que sobra, cada uno hacia abajo al centavo y sin pasar su tope.
  sobrante_centavos := v_resto;
  for i in 1 .. v_partes loop
    if sobrante_centavos::numeric * p_porcentajes[i] > c_maximo then
      raise exception 'Lo que sobra es demasiado grande para repartirlo con exactitud'
        using errcode = '22003';
    end if;
    v_monto := (sobrante_centavos * p_porcentajes[i]) / 10000;
    if p_topes[i] is not null then
      v_monto := least(v_monto, p_topes[i]);
    end if;
    v_resto := v_resto - v_monto;
    partes := partes || v_monto;
  end loop;

  remanente_centavos := case when neta_centavos > 0 then v_resto else neta_centavos end;
end;
$$;

comment on function private.repartir_por_la_fila(bigint, bigint, integer[], text[], bigint[], bigint[], boolean[], integer[], bigint[]) is
  'Reparte el ingreso de un cobro por la fila: las obligaciones en su orden (su porcentaje de lo cobrado o de lo que les llega, redondeado como el diezmo y nunca más que lo que llega), cada paso hasta lo que le falta y lo que sobra por porcentajes, cada parte redondeada hacia abajo y sin pasar su tope; el resto y los centavos son del superávit. Rechaza con 22004, 22023 y 22003 donde repartir tira RangeError. Gemela de repartir en fila.ts (ADR 0078).';
revoke all on function private.repartir_por_la_fila(bigint, bigint, integer[], text[], bigint[], bigint[], boolean[], integer[], bigint[]) from public, anon, authenticated;


-- La fila de siempre -----------------------------------------------------------------------------------------

drop function private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid);

create function private.fila_de_siempre(
  p_sueldo_centavos bigint,
  p_fijos_centavos bigint,
  p_sueldo_tope_mensual boolean,
  p_hogar uuid,
  p_maun uuid,
  p_diezmo uuid
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_pasos jsonb := '[]'::jsonb;
begin
  if num_nulls(p_sueldo_centavos, p_fijos_centavos, p_sueldo_tope_mensual, p_hogar, p_maun, p_diezmo) > 0 then
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
      'tesoro', p_hogar, 'clase', 'sueldo', 'tope', p_sueldo_centavos, 'renglones', '[]'::jsonb,
      'desde', null, 'modo', 'mes', 'hastaLaMeta', false
    ));
  end if;
  if p_fijos_centavos > 0 then
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'tesoro', p_maun, 'clase', 'fijos', 'tope', p_fijos_centavos,
      'renglones', jsonb_build_array(
        jsonb_build_object('nombre', 'Costos fijos', 'monto', p_fijos_centavos, 'dia', null)
      ),
      'desde', null, 'modo', 'mes', 'hastaLaMeta', false
    ));
  end if;

  return jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', p_diezmo, 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', v_pasos,
    'reparto', '[]'::jsonb,
    'superavit', p_maun,
    'sueldoPorTrabajo', not p_sueldo_tope_mensual
  );
end;
$$;

comment on function private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid, uuid) is
  'La fila de un taller que nunca guardó la suya: el diezmo al 10% sobre el ingreso como única obligación, el sueldo al hogar y los costos fijos apartados en el taller, por mes, y el superávit en Maun, como la cascada de antes. Gemela de filaDeSiempre en fila.ts (ADR 0078).';
revoke all on function private.fila_de_siempre(bigint, bigint, boolean, uuid, uuid, uuid) from public, anon, authenticated;


-- Los problemas de la fila ----------------------------------------------------------------------------------

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

  -- El superávit: un tesoro conocido y vivo, que no sea Hogar ni el diezmo ni esté ya en la fila (Maun
  -- sí puede, aunque sea un paso de gastos fijos).
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
$$;

comment on function private.problema_de_la_fila(jsonb, jsonb) is
  'El primer problema que impide guardar una fila, con el mismo código y en el mismo orden que problemasDeLaFila en fila.ts, o null si se puede guardar. Lee la forma del primer pedido completando lo que falta con lo de siempre, como leerLaFila, con los ids del diezmo y de Maun sacados de los tesoros. Recibe los tesoros del taller como un arreglo de {id, clave, archivado, meta}: la meta de Cocos es la de ajustes, y un tesoro tiene meta si es mayor que cero. Gemela de primerProblemaDeLaFila (ADR 0078).';


-- El plan del reparto ----------------------------------------------------------------------------------------

drop function private.plan_del_reparto(text, jsonb, boolean, boolean);

create function private.plan_del_reparto(
  p_destino text,
  p_fila jsonb,
  p_perdido_con_sueldo boolean,
  p_perdido_con_diezmo boolean,
  p_diezmo uuid,
  p_maun uuid,
  out obligaciones uuid[],
  out porcentajes_de_obligacion integer[],
  out bases text[],
  out diezmo_en integer,
  out diezmo_bp integer,
  out tesoros uuid[],
  out clases text[],
  out objetivos bigint[],
  out por_mes boolean[],
  out modos text[],
  out hasta_la_meta boolean[],
  out tesoros_del_reparto uuid[],
  out porcentajes integer[],
  out hasta_la_meta_del_reparto boolean[],
  out superavit uuid
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_perdido boolean;
  v_por_trabajo boolean;
  v_elemento jsonb;
  v_superavit uuid;
  v_lugar integer := 0;
begin
  if num_nulls(p_destino, p_fila, p_perdido_con_sueldo, p_perdido_con_diezmo, p_diezmo, p_maun) > 0 then
    raise exception 'El plan del reparto necesita todos sus parámetros' using errcode = '22004';
  end if;
  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se reparte al cobrar o al dar por perdido' using errcode = '22023';
  end if;

  v_perdido := p_destino = 'perdido';
  v_por_trabajo := (p_fila ->> 'sueldoPorTrabajo')::boolean;
  obligaciones := '{}';
  porcentajes_de_obligacion := '{}';
  bases := '{}';
  tesoros := '{}';
  clases := '{}';
  objetivos := '{}';
  por_mes := '{}';
  modos := '{}';
  hasta_la_meta := '{}';
  tesoros_del_reparto := '{}';
  porcentajes := '{}';
  hasta_la_meta_del_reparto := '{}';

  -- Las obligaciones: sin la clave, la de siempre, el diezmo al 10% sobre el ingreso. El diezmo es la
  -- primera con el tesoro del diezmo; en un perdido sin diezmo va en cero, y las demás van igual.
  for v_elemento in
    select value
    from jsonb_array_elements(
      case
        when p_fila ? 'obligaciones' then p_fila -> 'obligaciones'
        else jsonb_build_array(jsonb_build_object('tesoro', p_diezmo, 'porcentaje', 1000, 'base', 'ingreso'))
      end
    ) with ordinality
    order by ordinality
  loop
    v_lugar := v_lugar + 1;
    obligaciones := obligaciones || (v_elemento ->> 'tesoro')::uuid;
    bases := bases || (v_elemento ->> 'base');
    if diezmo_en is null and (v_elemento ->> 'tesoro')::uuid = p_diezmo then
      diezmo_en := v_lugar;
      porcentajes_de_obligacion := porcentajes_de_obligacion || case
        when v_perdido and not p_perdido_con_diezmo then 0
        else private.entero_de_json(v_elemento -> 'porcentaje')::integer
      end;
    else
      porcentajes_de_obligacion := porcentajes_de_obligacion
        || private.entero_de_json(v_elemento -> 'porcentaje')::integer;
    end if;
  end loop;
  diezmo_bp := case when diezmo_en is null then 0 else porcentajes_de_obligacion[diezmo_en] end;

  for v_elemento in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    tesoros := tesoros || (v_elemento ->> 'tesoro')::uuid;
    clases := clases || (v_elemento ->> 'clase');
    objetivos := objetivos || case
      when v_perdido and v_elemento ->> 'clase' = 'sueldo' and not p_perdido_con_sueldo then 0::bigint
      else private.entero_de_json(v_elemento -> 'tope')
    end;
    por_mes := por_mes || not (v_elemento ->> 'clase' = 'sueldo' and v_por_trabajo);
    modos := modos || coalesce(v_elemento ->> 'modo', 'mes');
    hasta_la_meta := hasta_la_meta || coalesce((v_elemento ->> 'hastaLaMeta')::boolean, false);
  end loop;

  for v_elemento in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    tesoros_del_reparto := tesoros_del_reparto || (v_elemento ->> 'tesoro')::uuid;
    porcentajes := porcentajes || private.entero_de_json(v_elemento -> 'porcentaje')::integer;
    hasta_la_meta_del_reparto := hasta_la_meta_del_reparto
      || coalesce((v_elemento ->> 'hastaLaMeta')::boolean, false);
  end loop;

  -- Maun no lleva fila de repartos: lo que sobra ya está ahí.
  v_superavit := coalesce((p_fila ->> 'superavit')::uuid, p_maun);
  superavit := case when v_superavit = p_maun then null else v_superavit end;
end;
$$;

comment on function private.plan_del_reparto(text, jsonb, boolean, boolean, uuid, uuid) is
  'Con qué obligaciones, qué pasos y qué partes se reparte un cobro o un perdido según la fila: la posición del diezmo entre las obligaciones y su porcentaje (en cero en un perdido sin diezmo), el objetivo de cada paso (el sueldo en cero en un perdido sin sueldo), si descuenta lo que ya tiene, cómo se llena, si va hasta la meta, y el superávit (null si es Maun). Completa lo que falta de una fila del primer pedido como leerLaFila. Gemela de planDelReparto en fila.ts. Recibe una fila ya validada (ADR 0078).';
revoke all on function private.plan_del_reparto(text, jsonb, boolean, boolean, uuid, uuid) from public, anon, authenticated;


-- El previo de cada paso y el tope de cada parte ---------------------------------------------------------------

create function private.previo_del_mes(
  p_tesoros uuid[],
  p_objetivos bigint[],
  p_modos text[],
  p_hasta_la_meta boolean[],
  p_tesoros_del_reparto uuid[],
  p_hasta_la_meta_del_reparto boolean[],
  p_del_mes jsonb,
  p_saldos jsonb,
  p_metas jsonb,
  out previos bigint[],
  out topes bigint[]
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  c_maximo constant bigint := 9007199254740991;
  v_tesoro text;
  v_lleva bigint;
  v_meta bigint;
  v_falta bigint;
  i integer;
begin
  if num_nulls(
    p_tesoros, p_objetivos, p_modos, p_hasta_la_meta, p_tesoros_del_reparto,
    p_hasta_la_meta_del_reparto, p_del_mes, p_saldos, p_metas
  ) > 0 then
    raise exception 'El previo necesita todos sus parámetros' using errcode = '22004';
  end if;
  if cardinality(p_objetivos) <> cardinality(p_tesoros)
    or cardinality(p_modos) <> cardinality(p_tesoros)
    or cardinality(p_hasta_la_meta) <> cardinality(p_tesoros)
    or cardinality(p_hasta_la_meta_del_reparto) <> cardinality(p_tesoros_del_reparto)
  then
    raise exception 'Cada paso lleva su objetivo, cómo se llena y si va hasta la meta' using errcode = '22023';
  end if;
  if array_position(p_tesoros, null) is not null
    or array_position(p_objetivos, null) is not null
    or array_position(p_modos, null) is not null
    or array_position(p_hasta_la_meta, null) is not null
    or array_position(p_tesoros_del_reparto, null) is not null
    or array_position(p_hasta_la_meta_del_reparto, null) is not null
  then
    raise exception 'Un paso o una parte no pueden tener datos vacíos' using errcode = '22004';
  end if;

  previos := '{}';
  topes := '{}';

  -- Cada paso arranca con lo que lleva según su modo: lo del mes, su saldo (nunca menos de cero) o
  -- nada. Si va hasta la meta y su tesoro tiene meta, el previo nunca es menos que su monto menos lo
  -- que le falta para la meta: así su tope es lo menor entre las dos cosas.
  for i in 1 .. cardinality(p_tesoros) loop
    v_tesoro := p_tesoros[i]::text;
    v_lleva := case p_modos[i]
      when 'saldo' then greatest(0, coalesce((p_saldos ->> v_tesoro)::bigint, 0))
      when 'trabajo' then 0
      else coalesce((p_del_mes ->> v_tesoro)::bigint, 0)
    end;
    v_falta := null;
    v_meta := coalesce((p_metas ->> v_tesoro)::bigint, 0);
    if p_hasta_la_meta[i] and v_meta > 0 then
      v_falta := v_meta - coalesce((p_saldos ->> v_tesoro)::bigint, 0);
      if abs(v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
      v_falta := greatest(0, v_falta);
      if abs(p_objetivos[i] - v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
    end if;
    previos := previos || case
      when v_falta is null then v_lleva
      else greatest(v_lleva, p_objetivos[i] - v_falta)
    end;
  end loop;

  -- Cada parte que va hasta la meta, con meta, no recibe más que lo que le falta; las demás, sin tope.
  for i in 1 .. cardinality(p_tesoros_del_reparto) loop
    v_tesoro := p_tesoros_del_reparto[i]::text;
    v_falta := null;
    v_meta := coalesce((p_metas ->> v_tesoro)::bigint, 0);
    if p_hasta_la_meta_del_reparto[i] and v_meta > 0 then
      v_falta := v_meta - coalesce((p_saldos ->> v_tesoro)::bigint, 0);
      if abs(v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
      v_falta := greatest(0, v_falta);
    end if;
    topes := topes || v_falta;
  end loop;
end;
$$;

comment on function private.previo_del_mes(uuid[], bigint[], text[], boolean[], uuid[], boolean[], jsonb, jsonb, jsonb) is
  'Con qué previo entra cada paso a la cuenta y qué tope lleva cada parte, con lo del mes, los saldos y las metas de los tesoros como {tesoro_id: centavos}: por mes, lo del mes; se renueva o se repone, su saldo, nunca menos de cero; por trabajo, cero. Un paso que va hasta la meta nunca arranca con menos que su monto menos lo que le falta para la meta, y una parte que va hasta la meta lleva de tope lo que le falta (null si junta sin fin). Gemela de previoDelMes en fila.ts (ADR 0078).';
revoke all on function private.previo_del_mes(uuid[], bigint[], text[], boolean[], uuid[], boolean[], jsonb, jsonb, jsonb) from public, anon, authenticated;


-- Lo que vio la app ------------------------------------------------------------------------------------------

create function private.lo_del_mes_es_otro(p_pasos uuid[], p_partes uuid[], p_visto jsonb, p_base jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_visto is not null
    and jsonb_typeof(p_visto) <> 'null'
    and (
      exists (
        select 1
        from unnest(coalesce(p_pasos, '{}')) as u (tesoro)
        where coalesce(private.entero_de_json(case when jsonb_typeof(p_visto) = 'object' then p_visto -> u.tesoro::text end), 0)
          <> coalesce(private.entero_de_json(case when jsonb_typeof(p_base) = 'object' then p_base -> u.tesoro::text end), 0)
      )
      or exists (
        select 1
        from unnest(coalesce(p_partes, '{}')) as u (tesoro)
        where private.entero_de_json(case when jsonb_typeof(p_visto) = 'object' then p_visto -> u.tesoro::text end)
          is distinct from private.entero_de_json(case when jsonb_typeof(p_base) = 'object' then p_base -> u.tesoro::text end)
      )
    )
$$;

comment on function private.lo_del_mes_es_otro(uuid[], uuid[], jsonb, jsonb) is
  'Si lo que la app vio, {tesoro_id: centavos}, no es lo que calculó la base: algún paso con otro previo (el que falta cuenta como cero) o alguna parte con tope en uno y sin tope en el otro, o con otro tope. Las claves que no son de los pasos ni de las partes no se miran. Null en lo visto es que la app no lo mandó: no hay nada con qué ajustar. Gemela de loVistoEsOtro en fila.ts (ADR 0078).';
revoke all on function private.lo_del_mes_es_otro(uuid[], uuid[], jsonb, jsonb) from public, anon, authenticated;
