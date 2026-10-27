-- Los compromisos de Eliseo (los tipos de tesoro): cada compromiso por mes puede llevar un día de pago,
-- y su ciclo va de un vencimiento al siguiente; lo que junta, y lo que se le pasa a mano para cubrirlo,
-- cuenta por ciclo. «Se paga sola» pide el día y lleva desde cuándo, que pone la base al guardar. Una
-- obligación puede llevarse un monto fijo de cada cobro en lugar del porcentaje, nunca más de lo que
-- llega. Una fila guardada con la forma de antes se lee como siempre: sin día, el ciclo es el mes del
-- calendario, y sin monto fijo, el porcentaje; el reparto da exactamente lo mismo.
--
-- Lo autorizado aunque la regla del repo lo cuente como destructivo, porque no cambia ningún dato:
-- create or replace de problema_de_la_fila, liquidar y guardar_la_fila con la misma firma; drop y
-- create de plan_del_reparto (suma dos columnas de salida) y de repartir_por_la_fila (suma un
-- parámetro con default null), con sus revokes; y el check de cubre_el_mes con el rito del ADR 0078.

create function private.dia_del_mes(p_mes date, p_dia integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select p_mes + (least(p_dia, extract(day from (p_mes + interval '1 month' - interval '1 day'))::integer) - 1)
$$;

revoke all on function private.dia_del_mes(date, integer) from public, anon, authenticated;

comment on function private.dia_del_mes(date, integer) is 'El día del mes de p_mes (su primer día) con el número p_dia, o el último si el mes no lo tiene. Gemela de diaDelMes de @maun/domain.';

create function private.ciclo_de_la_fecha(p_fecha date, p_dia integer, out desde date, out hasta date)
returns record
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_mes date := date_trunc('month', p_fecha)::date;
  v_vence date;
begin
  v_vence := private.dia_del_mes(v_mes, p_dia);
  if p_fecha < v_vence then
    desde := private.dia_del_mes((v_mes - interval '1 month')::date, p_dia);
    hasta := v_vence;
  else
    desde := v_vence;
    hasta := private.dia_del_mes((v_mes + interval '1 month')::date, p_dia);
  end if;
end;
$$;

revoke all on function private.ciclo_de_la_fecha(date, integer) from public, anon, authenticated;

comment on function private.ciclo_de_la_fecha(date, integer) is 'El ciclo que contiene p_fecha de un compromiso que vence el día p_dia de cada mes (el último si el mes no lo tiene): desde el vencimiento anterior, incluido, hasta el siguiente, sin incluir. Con el día 1 es el mes del calendario. Gemela de cicloDeLaFecha de @maun/domain.';

create function private.con_el_paga_sola_desde(p_guardada jsonb, p_fila jsonb, p_hoy date)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_fila) is distinct from 'object' or jsonb_typeof(p_fila -> 'pasos') is distinct from 'array'
      then p_fila
    else jsonb_set(p_fila, '{pasos}', coalesce((
      select jsonb_agg(
        case
          when jsonb_typeof(e.paso) = 'object' and e.paso -> 'pagaSola' = 'true'::jsonb then
            e.paso || jsonb_build_object('pagaSolaDesde', coalesce(
              (
                select g.paso ->> 'pagaSolaDesde'
                from jsonb_array_elements(
                  case when jsonb_typeof(p_guardada -> 'pasos') = 'array' then p_guardada -> 'pasos' else '[]'::jsonb end
                ) as g (paso)
                where g.paso ->> 'tesoro' = e.paso ->> 'tesoro'
                  and g.paso -> 'pagaSola' = 'true'::jsonb
                  and jsonb_typeof(g.paso -> 'pagaSolaDesde') = 'string'
                limit 1
              ),
              p_hoy::text
            ))
          when jsonb_typeof(e.paso) = 'object' and e.paso ? 'pagaSolaDesde' then
            e.paso || '{"pagaSolaDesde": null}'::jsonb
          else e.paso
        end
        order by e.n
      )
      from jsonb_array_elements(p_fila -> 'pasos') with ordinality as e (paso, n)
    ), '[]'::jsonb))
  end
$$;

revoke all on function private.con_el_paga_sola_desde(jsonb, jsonb, date) from public, anon, authenticated;

comment on function private.con_el_paga_sola_desde(jsonb, jsonb, date) is 'La fila con desde cuándo se paga sola cada compromiso: el que ya tenía en la fila guardada si ya se pagaba solo, o p_hoy si pasa a pagarse solo ahora; los que no se pagan solos, sin esa fecha. Gemela de conElPagaSolaDesde de @maun/domain; la usa guardar_la_fila, así ningún pago automático es de un vencimiento anterior a que el dueño lo decidió.';

CREATE OR REPLACE FUNCTION private.problema_de_la_fila(p_fila jsonb, p_tesoros jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
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
  v_monto_fijo bigint;
  v_dia_de_pago bigint;
  v_paga_sola boolean;
  v_paga_sola_desde text;
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
      -- El monto fijo puede faltar o ir en null; si está, es un entero.
      if coalesce(jsonb_typeof(v_obligacion -> 'montoFijo'), 'null') <> 'null'
        and private.entero_de_json(v_obligacion -> 'montoFijo') is null
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
      or (v_paso ? 'pagaSola' and jsonb_typeof(v_paso -> 'pagaSola') is distinct from 'boolean')
      or coalesce(jsonb_typeof(v_paso -> 'pagaSolaDesde'), 'null') not in ('null', 'string')
      or (
        coalesce(jsonb_typeof(v_paso -> 'dia'), 'null') <> 'null'
        and private.entero_de_json(v_paso -> 'dia') is null
      )
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
    -- En lugar del porcentaje, un monto fijo de cada cobro: nunca el diezmo, que en proyectos es un
    -- porcentaje, y entre un centavo y el máximo de la fila.
    v_monto_fijo := private.entero_de_json(v_obligacion -> 'montoFijo');
    if v_monto_fijo is not null then
      if v_clave = 'diezmo' then
        return 'diezmo-por-monto';
      end if;
      if v_monto_fijo <= 0 or v_monto_fijo > c_maximo then
        return 'monto-fijo-invalido';
      end if;
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

    -- El día de pago de un compromiso por mes (del 1 al 31, sin días en sus renglones) y «se paga
    -- sola», que pide el día, no va en Maun y lleva desde cuándo; sin ella, sin esa fecha.
    v_dia_de_pago := private.entero_de_json(v_paso -> 'dia');
    v_paga_sola := coalesce((v_paso ->> 'pagaSola')::boolean, false);
    v_paga_sola_desde := v_paso ->> 'pagaSolaDesde';
    if v_dia_de_pago is not null then
      if v_dia_de_pago < 1 or v_dia_de_pago > 31 then
        return 'dia-de-pago-invalido';
      end if;
      if v_clase = 'prioridad' or v_modo <> 'mes' then
        return 'dia-de-pago-fuera-de-compromiso';
      end if;
      if exists (
        select 1 from jsonb_array_elements(v_paso -> 'renglones') as r (valor)
        where private.entero_de_json(r.valor -> 'dia') is not null
      ) then
        return 'dias-en-los-renglones';
      end if;
    end if;
    if not v_paga_sola then
      if v_paga_sola_desde is not null then
        return 'paga-sola-desde-invalido';
      end if;
    else
      if v_dia_de_pago is null then
        return 'paga-sola-sin-dia';
      end if;
      if v_clave is not distinct from 'maun' then
        return 'paga-sola-en-maun';
      end if;
      if v_paga_sola_desde is null or not private.es_fecha_que_existe(v_paga_sola_desde) then
        return 'paga-sola-desde-invalido';
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

comment on function private.problema_de_la_fila(jsonb,jsonb) is 'El primer problema que impide guardar una fila, con el mismo código y en el mismo orden que problemasDeLaFila en fila.ts, o null si se puede guardar. Lee la forma del primer pedido completando lo que falta con lo de siempre, como leerLaFila, con los ids del diezmo y de Maun sacados de los tesoros. Recibe los tesoros del taller como un arreglo de {id, clave, archivado, meta, moneda}: la meta de Cocos es la de ajustes, un tesoro tiene meta si es mayor que cero, y uno que no es de la moneda del taller (ARS si la moneda falta) no entra en la fila: tesoro-en-otra-moneda (ADR 0081). Mira también lo de los tipos de tesoro de Eliseo: el monto fijo de una obligación (diezmo-por-monto, monto-fijo-invalido), el día de pago de un compromiso por mes (dia-de-pago-invalido, dia-de-pago-fuera-de-compromiso, dias-en-los-renglones) y «se paga sola» (paga-sola-sin-dia, paga-sola-en-maun, paga-sola-desde-invalido). Gemela de primerProblemaDeLaFila (ADR 0078).';

drop function private.plan_del_reparto(text, jsonb, boolean, boolean, uuid, uuid);

CREATE OR REPLACE FUNCTION private.plan_del_reparto(p_destino text, p_fila jsonb, p_perdido_con_sueldo boolean, p_perdido_con_diezmo boolean, p_diezmo uuid, p_maun uuid, OUT obligaciones uuid[], OUT porcentajes_de_obligacion integer[], OUT bases text[], OUT diezmo_en integer, OUT diezmo_bp integer, OUT tesoros uuid[], OUT clases text[], OUT objetivos bigint[], OUT por_mes boolean[], OUT modos text[], OUT hasta_la_meta boolean[], OUT tesoros_del_reparto uuid[], OUT porcentajes integer[], OUT hasta_la_meta_del_reparto boolean[], OUT superavit uuid, OUT montos_fijos bigint[], OUT dias integer[])
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
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
  montos_fijos := '{}';
  dias := '{}';

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
      montos_fijos := montos_fijos || null::bigint;
    else
      porcentajes_de_obligacion := porcentajes_de_obligacion
        || private.entero_de_json(v_elemento -> 'porcentaje')::integer;
      montos_fijos := montos_fijos || private.entero_de_json(v_elemento -> 'montoFijo');
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
    -- El día de pago cuenta solo en un compromiso por mes: corta su ciclo.
    dias := dias || case
      when v_elemento ->> 'clase' in ('sueldo', 'fijos') and coalesce(v_elemento ->> 'modo', 'mes') = 'mes'
        then private.entero_de_json(v_elemento -> 'dia')::integer
    end;
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
$function$;

revoke all on function private.plan_del_reparto(text, jsonb, boolean, boolean, uuid, uuid) from public, anon, authenticated;

comment on function private.plan_del_reparto(text,jsonb,boolean,boolean,uuid,uuid) is 'Con qué obligaciones, qué pasos y qué partes se reparte un cobro o un perdido según la fila: la posición del diezmo entre las obligaciones y su porcentaje (en cero en un perdido sin diezmo), el objetivo de cada paso (el sueldo en cero en un perdido sin sueldo), si descuenta lo que ya tiene, cómo se llena, si va hasta la meta, y el superávit (null si es Maun); el monto fijo de cada obligación (null si va por porcentaje, y siempre en el diezmo) y el día de pago de cada paso (solo en un compromiso por mes; null es el mes del calendario). Completa lo que falta de una fila del primer pedido como leerLaFila. Gemela de planDelReparto en fila.ts. Recibe una fila ya validada (ADR 0078).';

drop function private.repartir_por_la_fila(bigint, bigint, integer[], text[], bigint[], bigint[], boolean[], integer[], bigint[]);

CREATE OR REPLACE FUNCTION private.repartir_por_la_fila(p_cobrado_centavos bigint, p_gastos_centavos bigint, p_obligaciones integer[], p_bases text[], p_objetivos bigint[], p_previos bigint[], p_por_mes boolean[], p_porcentajes integer[], p_topes bigint[], p_montos_fijos bigint[] DEFAULT NULL::bigint[], OUT neta_centavos bigint, OUT obligaciones bigint[], OUT libre_centavos bigint, OUT topes bigint[], OUT montos bigint[], OUT sobrante_centavos bigint, OUT partes bigint[], OUT remanente_centavos bigint)
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
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
  if p_montos_fijos is not null and cardinality(p_montos_fijos) <> v_obligaciones then
    raise exception 'Cada obligación lleva su monto fijo, o null si va por porcentaje' using errcode = '22023';
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
    if p_montos_fijos is not null and p_montos_fijos[i] < 0 then
      raise exception 'El monto fijo de una obligación no puede ser negativo' using errcode = '22023';
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

  -- Las obligaciones, en su orden: su monto fijo, o su porcentaje de lo cobrado o de lo que les llega,
  -- redondeado como el diezmo (mitad hacia arriba), y nunca más que lo que llega. Con un ingreso que
  -- no es positivo no se aparta nada.
  for i in 1 .. v_obligaciones loop
    if neta_centavos > 0 and p_montos_fijos is not null and p_montos_fijos[i] is not null then
      v_monto := least(p_montos_fijos[i], v_resto);
    elsif neta_centavos > 0 then
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
$function$;

revoke all on function private.repartir_por_la_fila(bigint, bigint, integer[], text[], bigint[], bigint[], boolean[], integer[], bigint[], bigint[]) from public, anon, authenticated;

comment on function private.repartir_por_la_fila(bigint,bigint,integer[],text[],bigint[],bigint[],boolean[],integer[],bigint[],bigint[]) is 'Reparte el ingreso de un cobro por la fila: las obligaciones en su orden (su monto fijo, o su porcentaje de lo cobrado o de lo que les llega, redondeado como el diezmo; nunca más que lo que llega), cada paso hasta lo que le falta y lo que sobra por porcentajes, cada parte redondeada hacia abajo y sin pasar su tope; el resto y los centavos son del superávit. p_montos_fijos tiene uno por obligación, null si va por porcentaje; sin él, todas por porcentaje. Rechaza con 22004, 22023 y 22003 donde repartir tira RangeError. Gemela de repartir en fila.ts (ADR 0078).';

CREATE OR REPLACE FUNCTION private.liquidar(p_destino estado_proyecto, p_proyecto_id uuid, p_version integer, p_fecha date, p_cobrado_centavos bigint, p_gastos_centavos bigint, p_tope_sueldo_centavos bigint, p_tope_fijos_centavos bigint, p_diezmo_centavos bigint, p_sueldo_centavos bigint, p_fijos_centavos bigint, p_remanente_centavos bigint, p_diezmo_bp integer, p_sueldo_previo_centavos bigint DEFAULT NULL::bigint, p_fijos_previo_centavos bigint DEFAULT NULL::bigint, p_ya_en_la_apertura boolean DEFAULT false, p_fila_version integer DEFAULT NULL::integer, p_repartos jsonb DEFAULT NULL::jsonb, p_previo jsonb DEFAULT NULL::jsonb)
 RETURNS proyectos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  -- DIEZMO de @maun/domain.
  c_diezmo_bp constant integer := 1000;
  c_formato_id constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_proyecto public.proyectos;
  v_ajustes public.ajustes;
  v_fecha date;
  v_inicio_mes date;
  v_fin_mes date;
  v_diezmo_bp integer;
  v_objetivo_sueldo bigint;
  v_objetivo_fijos bigint;
  v_sueldo_mensual boolean;
  v_sueldo_previo bigint;
  v_fijos_previo bigint;
  v_topes record;
  v_topes_vistos record;
  v_ajustada boolean := false;
  v_cobrado bigint;
  v_cobrado_crudo bigint;
  v_gastos bigint;
  v_dist record;
  v_dist_vista record;
  v_apertura date;
  v_hogar uuid;
  v_maun uuid;
  v_diezmo uuid;
  v_fila jsonb;
  v_fila_version integer;
  v_plan record;
  v_mes jsonb;
  v_saldos jsonb;
  v_metas jsonb;
  v_previo record;
  v_previos bigint[];
  v_topes_de_las_partes bigint[];
  v_previos_vistos bigint[];
  v_topes_vistos_de_las_partes bigint[];
  v_previo_base jsonb;
  v_reparto record;
  v_reparto_visto record;
  v_obligaciones integer;
  v_pasos integer;
  v_partes integer;
  v_esperados_tesoros uuid[];
  v_esperados_montos bigint[];
  v_diezmo_visto bigint;
  v_diezmo_monto bigint;
  v_elemento jsonb;
  v_posicion integer;
  v_tesoro uuid;
  v_monto bigint;
  i integer;
begin
  -- La fecha la manda la app, que es la que sabe qué día pasó. Sin fecha no se liquida: la base no
  -- la inventa.
  if p_fecha is null then
    raise exception 'La liquidación necesita su fecha'
      using errcode = 'MN016',
            hint = 'Poné el día del cobro, o del cierre si lo das por perdido.';
  end if;

  if num_nulls(
    p_destino, p_proyecto_id, p_version, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, p_ya_en_la_apertura
  ) > 0 then
    raise exception 'La liquidación necesita todos sus parámetros' using errcode = '22004';
  end if;

  -- El acumulado del mes son dos números o ninguno: con uno solo no se puede saber si la app vio
  -- lo mismo que la base.
  if num_nulls(p_sueldo_previo_centavos, p_fijos_previo_centavos) = 1 then
    raise exception 'El acumulado del mes va entero o no va' using errcode = '22004';
  end if;

  -- La revisión de la fila viaja con sus repartos, y lo que vio la app solo con ellos.
  if (p_fila_version is null) <> (p_repartos is null)
    or (p_fila_version is null and p_previo is not null)
  then
    raise exception 'La fila del cobro va con sus repartos' using errcode = '22004';
  end if;

  if p_repartos is not null and jsonb_typeof(p_repartos) <> 'array' then
    raise exception 'Los repartos van en una lista' using errcode = '22023';
  end if;
  if p_previo is not null and jsonb_typeof(p_previo) <> 'object' then
    raise exception 'Lo que vio la app va como {tesoro: centavos}' using errcode = '22023';
  end if;

  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se liquida hacia cobrado o perdido' using errcode = '22023';
  end if;

  -- El diezmo de un perdido es un dato (ajustes.perdido_con_diezmo y, por la fila, su porcentaje), no
  -- una regla: la app manda el que vio, y si cambió es MN006. En un cobro no se manda: si cambia, MN008.
  if p_destino = 'perdido' and p_diezmo_bp is null then
    raise exception 'El cierre de un perdido necesita el diezmo que vio el usuario' using errcode = '22004';
  end if;

  -- Primer lock: el proyecto. La guarda de pagos y gastos toma for share sobre esta misma fila, así
  -- que un pago que llega en el mismo instante espera a que la liquidación termine (y entonces lo
  -- ve liquidado), o la liquidación espera a que el pago termine (y entonces lo suma).
  select p.* into v_proyecto
  from public.proyectos p
  where p.id = p_proyecto_id
    and p.household_id = any (array(select private.user_household_ids()))
  for update;

  if not found then
    raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El reenvío de la cola se reconoce antes de elegir el camino: esta misma liquidación ya se aplicó
  -- (la versión subió exactamente uno) y la respuesta se perdió. Se devuelve la fila tal cual, sin
  -- rechazar algo que salió bien. Va antes de mirar la fecha contra hoy: un reenvío que llega días
  -- después sigue siendo el mismo cobro. Un cobro de antes que se reenvía después de guardar la fila
  -- entra acá y no sale MN025.
  if p_fila_version is null
    and v_proyecto.dist_fila_version is null
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.dist_tope_sueldo_centavos, v_proyecto.dist_tope_fijos_centavos,
      v_proyecto.dist_diezmo_centavos, v_proyecto.dist_sueldo_centavos,
      v_proyecto.dist_fijos_centavos, v_proyecto.dist_remanente_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_tope_sueldo_centavos,
      p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos, p_fijos_centavos,
      p_remanente_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
  then
    return v_proyecto;
  end if;

  -- El reenvío de una liquidación de antes que salió ajustada. Los topes y los cuatro escalones
  -- congelados no son los que mandó la app —ese es justamente el ajuste—, así que el reenvío se
  -- reconoce por las entradas que la app sí controla. La última condición es la guarda: esta rama
  -- solo vale cuando el acumulado que vio la app no es el que quedó congelado, que es la definición
  -- de ajustada. Es lo que recibe una app vieja que cobra después de una nueva en el mismo mes.
  if p_fila_version is null
    and p_sueldo_previo_centavos is not null
    and v_proyecto.dist_fila_version is null
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
    and (v_proyecto.dist_sueldo_previo_centavos, v_proyecto.dist_fijos_previo_centavos)
      is distinct from (p_sueldo_previo_centavos, p_fijos_previo_centavos)
  then
    return v_proyecto;
  end if;

  -- El reenvío de un cobro por la fila, ajustado o no: la misma revisión, las mismas entradas y los
  -- mismos ids de repartos en el mismo lugar. Los montos tienen que ser los mismos salvo que la
  -- liquidación haya salido ajustada, que es cuando lo que vio la app no es lo congelado: los pasos y
  -- las partes de la fila son los de los repartos congelados.
  if p_fila_version is not null
    and v_proyecto.dist_fila_version = p_fila_version
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
    and not exists (
      select 1
      from (
        select r.id::text as id, r.posicion::integer as posicion, r.monto_centavos as monto
        from public.repartos r
        where r.household_id = v_proyecto.household_id
          and r.proyecto_id = v_proyecto.id
          and r.deleted_at is null
      ) as congelado
      full join (
        select e.value ->> 'id' as id, e.n::integer as posicion,
          private.entero_de_json(e.value -> 'monto_centavos') as monto
        from jsonb_array_elements(p_repartos) with ordinality as e (value, n)
      ) as pedido on pedido.posicion = congelado.posicion
      where congelado.id is distinct from pedido.id
        or (
          congelado.monto is distinct from pedido.monto
          and not private.lo_del_mes_es_otro(
            array(
              select r.tesoro_id from public.repartos r
              where r.household_id = v_proyecto.household_id and r.proyecto_id = v_proyecto.id
                and r.deleted_at is null and r.tipo = 'paso'
              order by r.posicion
            ),
            array(
              select r.tesoro_id from public.repartos r
              where r.household_id = v_proyecto.household_id and r.proyecto_id = v_proyecto.id
                and r.deleted_at is null and r.tipo = 'parte'
              order by r.posicion
            ),
            p_previo,
            v_proyecto.dist_previo
          )
        )
    )
  then
    return v_proyecto;
  end if;

  if p_fecha > private.hoy_en_el_taller() then
    raise exception 'La fecha es de un día que todavía no llegó'
      using errcode = 'MN017',
            detail = format('fecha %s, hoy %s', p_fecha, private.hoy_en_el_taller()),
            hint = 'Poné el día en que pasó: hoy o antes.';
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  if v_proyecto.estado in ('cobrado', 'perdido') then
    raise exception 'El proyecto ya está %', v_proyecto.estado using errcode = 'MN001';
  end if;

  if not private.liquidacion_valida(v_proyecto.estado, p_destino) then
    raise exception '%', case p_destino
        when 'cobrado' then format('Solo se cobra un proyecto entregado, y este está en %s', v_proyecto.estado)
        else 'Lo entregado no se da por perdido: se cobra'
      end
      using errcode = 'MN007';
  end if;

  if v_proyecto.version <> p_version then
    raise exception 'El proyecto cambió desde que lo viste'
      using errcode = 'MN006',
            detail = format('versión vista %s, versión actual %s', p_version, v_proyecto.version);
  end if;

  -- Un reparto que ya estaba en los saldos de arranque tiene que ser de antes de la apertura. Si no,
  -- esa plata desaparecería de los tesoros sin que nadie la haya contado.
  if p_ya_en_la_apertura then
    v_apertura := private.fecha_de_apertura(v_proyecto.household_id);
    if v_apertura is null or p_fecha >= v_apertura then
      raise exception 'Ese cobro no es de antes de que empezaras con la app'
        using errcode = 'MN018',
              detail = format('fecha %s, apertura %s', p_fecha, coalesce(v_apertura::text, 'ninguna')),
              hint = 'Solo la plata de antes de la apertura puede estar en los saldos con los que arrancaste.';
    end if;
  end if;

  -- Segundo lock: la fila de ajustes del household. Toda liquidación, toda reversión, guardar la fila
  -- y todo movimiento la toman, así que se serializan y la segunda suma el mes y lee los saldos
  -- después de que la primera commiteó. for no key update: choca con otra liquidación y con una
  -- edición de los ajustes, no con las foreign keys. Es por household, más grueso que por mes
  -- (ADR 0011).
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_proyecto.household_id
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  v_fecha := p_fecha;
  v_inicio_mes := make_date(extract(year from v_fecha)::integer, extract(month from v_fecha)::integer, 1);
  v_fin_mes := (v_inicio_mes + interval '1 month')::date;

  select t.id into v_hogar
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'hogar';

  select t.id into v_maun
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'maun';

  select t.id into v_diezmo
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'diezmo';

  -- Lo cobrado es la suma del valor en pesos de cada pago: uno en dólares vale sus pesos a su
  -- cotización. La suma cruda de los importes es la que hace una app sin actualizar (ADR 0081).
  select
    coalesce(sum(private.valor_en_pesos(g.moneda, g.monto_centavos, g.cotizacion_centavos)), 0),
    coalesce(sum(g.monto_centavos), 0)
  into v_cobrado, v_cobrado_crudo
  from public.pagos g
  where g.household_id = v_proyecto.household_id
    and g.proyecto_id = v_proyecto.id
    and g.deleted_at is null;

  select coalesce(sum(g.monto_centavos), 0) into v_gastos
  from public.gastos g
  where g.household_id = v_proyecto.household_id
    and g.proyecto_id = v_proyecto.id
    and g.deleted_at is null;

  if p_fila_version is null then
    -- Una app sin actualizar no conoce la fila: con la fila guardada, o al volver a cobrar un reabierto
    -- que se había cobrado por la fila, repartir por el camino de antes sería repartir distinto de lo
    -- que el dueño armó.
    if v_ajustes.fila is not null
      or (p_destino = 'cobrado' and v_proyecto.reapertura_fila is not null)
    then
      raise exception 'Actualizá la app para cobrar con tu fila.' using errcode = 'MN025';
    end if;

    -- El camino de antes. Con qué fecha, diezmo y objetivos se liquida: gemela de planDeLiquidacion.
    if p_destino = 'perdido' then
      -- Un cierre como perdido es un evento nuevo: no usa la foto de una reapertura. El sueldo del
      -- perdido es un objetivo en cero cuando perdido_con_sueldo está apagado, no otra cascada.
      v_diezmo_bp := case when v_ajustes.perdido_con_diezmo then c_diezmo_bp else 0 end;
      v_objetivo_sueldo := case when v_ajustes.perdido_con_sueldo then v_ajustes.sueldo_mensual_centavos else 0 end;
      v_objetivo_fijos := v_ajustes.costos_fijos_centavos;
      v_sueldo_mensual := v_ajustes.sueldo_tope_mensual;
    elsif v_proyecto.reapertura_fecha_cobro is not null then
      -- Un cobro reabierto se vuelve a cobrar con los objetivos del original: corregir un gasto no
      -- reescribe el sueldo con los ajustes de hoy (ADR 0003). El sueldo va por mes si el original se
      -- cobró por mes o si el taller ya reparte por mes: un cobro de antes del sueldo por mes, reabierto
      -- después, cuenta contra lo que el sueldo de su mes ya recibió (ADR 0079). Con la fila guardada
      -- no se llega acá: rebota antes con MN025.
      v_diezmo_bp := c_diezmo_bp;
      v_objetivo_sueldo := v_proyecto.reapertura_objetivo_sueldo_centavos;
      v_objetivo_fijos := v_proyecto.reapertura_objetivo_fijos_centavos;
      v_sueldo_mensual := v_proyecto.reapertura_sueldo_mensual or v_ajustes.sueldo_tope_mensual;
    else
      v_diezmo_bp := c_diezmo_bp;
      v_objetivo_sueldo := v_ajustes.sueldo_mensual_centavos;
      v_objetivo_fijos := v_ajustes.costos_fijos_centavos;
      v_sueldo_mensual := v_ajustes.sueldo_tope_mensual;
    end if;

    -- Lo que el mes ya lleva liquidado por otros proyectos, en una sentencia posterior al lock de
    -- ajustes. Gemela de liquidadoDelMes. No se guarda en ningún lado: reabrir un proyecto lo saca
    -- de esta suma por el solo hecho de descongelarlo.
    select coalesce(sum(p.dist_sueldo_centavos), 0), coalesce(sum(p.dist_fijos_centavos), 0)
    into v_sueldo_previo, v_fijos_previo
    from public.proyectos p
    where p.household_id = v_proyecto.household_id
      and p.fecha_cobro >= v_inicio_mes
      and p.fecha_cobro < v_fin_mes
      and p.deleted_at is null
      and p.id <> v_proyecto.id;

    -- Y lo que repartieron en el mes los cobros por la fila: el sueldo que llevó Hogar y los gastos
    -- fijos que quedaron en Maun. Sin esto, una app vieja que cobra después de una nueva en el mismo
    -- mes paga el sueldo dos veces.
    select
      v_sueldo_previo + coalesce(sum(r.monto_centavos) filter (where r.clase = 'sueldo'), 0),
      v_fijos_previo + coalesce(sum(r.monto_centavos) filter (where r.clase = 'fijos' and r.tesoro_id = v_maun), 0)
    into v_sueldo_previo, v_fijos_previo
    from public.repartos r
    join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
    where r.household_id = v_proyecto.household_id
      and r.deleted_at is null
      and r.tipo = 'paso'
      and r.fecha >= v_inicio_mes
      and r.fecha < v_fin_mes
      and p.deleted_at is null
      and p.estado in ('cobrado', 'perdido')
      and p.id <> v_proyecto.id;

    select * into v_topes
    from private.topes_de_la_liquidacion(
      v_objetivo_sueldo, v_objetivo_fijos, v_sueldo_mensual, v_sueldo_previo, v_fijos_previo
    );

    -- La liquidación sale ajustada cuando la app mandó el acumulado del mes y no es el de la base.
    -- Es lo único que la app no podía conocer: otra liquidación del mismo mes hecha en otro
    -- dispositivo, o una reapertura que todavía no replicó.
    v_ajustada := p_sueldo_previo_centavos is not null
      and (p_sueldo_previo_centavos, p_fijos_previo_centavos)
        is distinct from (v_sueldo_previo, v_fijos_previo);

    if v_ajustada then
      select * into v_topes_vistos
      from private.topes_de_la_liquidacion(
        v_objetivo_sueldo, v_objetivo_fijos, v_sueldo_mensual,
        p_sueldo_previo_centavos, p_fijos_previo_centavos
      );
    else
      v_topes_vistos := v_topes;
    end if;

    -- Lo que se congela tiene que salir de lo que el usuario vio. Un tope distinto quiere decir que
    -- la app no veía otra liquidación del mes (o una reapertura), o que cambiaron los ajustes. Con el
    -- acumulado a la vista eso deja de ser una adivinanza: si el acumulado coincide, un tope distinto
    -- solo puede venir de los objetivos, y sigue siendo MN006.
    -- Una app sin actualizar suma los importes crudos, sin mirar la moneda de cada pago: con plata en
    -- dólares no cobra, y no le sirve que le digan que cambiaron los pagos (ADR 0081).
    if p_cobrado_centavos = v_cobrado_crudo and p_cobrado_centavos <> v_cobrado then
      raise exception 'Este trabajo tiene plata en dólares'
        using errcode = 'MN038',
              detail = 'cobro',
              hint = 'Actualizá la app y volvé a hacerlo.';
    end if;

    if v_cobrado <> p_cobrado_centavos
      or v_gastos <> p_gastos_centavos
      or v_diezmo_bp <> coalesce(p_diezmo_bp, v_diezmo_bp)
      or (
        not v_ajustada
        and (
          v_topes.tope_sueldo_centavos <> p_tope_sueldo_centavos
          or v_topes.tope_fijos_centavos <> p_tope_fijos_centavos
        )
      )
    then
      raise exception 'Los pagos, los gastos, los topes o el diezmo cambiaron desde que viste la distribución'
        using errcode = 'MN006',
              detail = format(
                'cobrado %s, gastos %s, tope de sueldo %s, tope de fijos %s, diezmo %s bp, fecha %s; el mes ya llevaba %s de sueldo y %s de fijos',
                v_cobrado, v_gastos, v_topes.tope_sueldo_centavos, v_topes.tope_fijos_centavos, v_diezmo_bp,
                v_fecha, v_sueldo_previo, v_fijos_previo
              );
    end if;

    -- Una liquidación ajustada no afloja el MN008: la app tiene que haber aplicado bien la regla de
    -- los topes contra su propio acumulado. Si ni eso cierra, no es que vio otro mes: es que está
    -- calculando distinto. Va antes de la cascada porque un tope negativo la cortaría con un 22023.
    if v_ajustada
      and (
        v_topes_vistos.tope_sueldo_centavos <> p_tope_sueldo_centavos
        or v_topes_vistos.tope_fijos_centavos <> p_tope_fijos_centavos
      )
    then
      raise exception 'Los topes que viste no son los que salen de ese acumulado: actualizá la app'
        using errcode = 'MN008',
              detail = format(
                'con el mes en %s de sueldo y %s de fijos, los topes son %s y %s',
                p_sueldo_previo_centavos, p_fijos_previo_centavos,
                v_topes_vistos.tope_sueldo_centavos, v_topes_vistos.tope_fijos_centavos
              );
    end if;

    -- Y la distribución que se le mostró tiene que ser la que calcula la base con las entradas que la
    -- app tenía. Si no, la app y la base están aplicando reglas distintas (una versión vieja de la
    -- app, o un bug): mejor un rechazo visible que congelar otra cosa.
    select * into v_dist_vista
    from private.cascada(v_cobrado, v_gastos, v_diezmo_bp, p_tope_sueldo_centavos, p_tope_fijos_centavos);

    if (v_dist_vista.diezmo_centavos, v_dist_vista.sueldo_centavos, v_dist_vista.fijos_centavos, v_dist_vista.remanente_centavos)
      is distinct from (p_diezmo_centavos, p_sueldo_centavos, p_fijos_centavos, p_remanente_centavos)
    then
      raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
        using errcode = 'MN008',
              detail = format(
                'diezmo %s, sueldo %s, fijos %s, remanente %s',
                v_dist_vista.diezmo_centavos, v_dist_vista.sueldo_centavos,
                v_dist_vista.fijos_centavos, v_dist_vista.remanente_centavos
              );
    end if;

    -- Recién acá se congela con el acumulado de la base. Cuando no hubo ajuste, es exactamente la
    -- misma cuenta que acaba de pasar el MN008.
    if v_ajustada then
      select * into v_dist
      from private.cascada(v_cobrado, v_gastos, v_diezmo_bp, v_topes.tope_sueldo_centavos, v_topes.tope_fijos_centavos);
    else
      v_dist := v_dist_vista;
    end if;

    update public.proyectos set
      estado = p_destino,
      fecha_cobro = v_fecha,
      dist_cobrado_centavos = v_cobrado,
      dist_gastos_centavos = v_gastos,
      dist_diezmo_bp = v_diezmo_bp,
      dist_tope_sueldo_centavos = v_topes.tope_sueldo_centavos,
      dist_tope_fijos_centavos = v_topes.tope_fijos_centavos,
      dist_diezmo_centavos = v_dist.diezmo_centavos,
      dist_sueldo_centavos = v_dist.sueldo_centavos,
      dist_fijos_centavos = v_dist.fijos_centavos,
      dist_remanente_centavos = v_dist.remanente_centavos,
      dist_objetivo_sueldo_centavos = v_objetivo_sueldo,
      dist_objetivo_fijos_centavos = v_objetivo_fijos,
      dist_sueldo_mensual = v_sueldo_mensual,
      dist_sueldo_previo_centavos = v_sueldo_previo,
      dist_fijos_previo_centavos = v_fijos_previo,
      dist_liquidado_at = clock_timestamp(),
      reparto_ya_en_la_apertura = p_ya_en_la_apertura,
      reapertura_objetivo_sueldo_centavos = null,
      reapertura_objetivo_fijos_centavos = null,
      reapertura_sueldo_mensual = null,
      reapertura_fecha_cobro = null,
      reapertura_fila = null
    where id = v_proyecto.id
    returning * into v_proyecto;

    return v_proyecto;
  end if;

  -- Por la fila. Con qué fila y qué revisión se reparte, con las mismas reglas que la app: al volver a
  -- cobrar un reabierto, la del cobro original (ADR 0003), o la de siempre armada con su foto si se
  -- había cobrado por el camino de antes; en los demás casos, y siempre en un perdido, que nunca usa
  -- la foto de una reapertura, la de los ajustes. Una fila guardada antes de los tipos de tesoro se
  -- lee con lo de siempre en lo que le falta. En un reabierto, el sueldo va por mes si la foto o el
  -- taller van por mes (sueldo_tope_mensual o la fila guardada): por trabajo queda solo cuando los dos
  -- son por trabajo, como en el seed (ADR 0079).
  if p_destino = 'cobrado' and v_proyecto.reapertura_fila is not null then
    v_fila := v_proyecto.reapertura_fila -> 'fila';
    if v_ajustes.sueldo_tope_mensual or v_ajustes.fila is not null then
      v_fila := jsonb_set(v_fila, '{sueldoPorTrabajo}', 'false'::jsonb);
    end if;
    v_fila_version := (v_proyecto.reapertura_fila ->> 'version')::integer;
  elsif p_destino = 'cobrado' and v_proyecto.reapertura_fecha_cobro is not null then
    v_fila := private.fila_de_siempre(
      v_proyecto.reapertura_objetivo_sueldo_centavos,
      v_proyecto.reapertura_objetivo_fijos_centavos,
      v_proyecto.reapertura_sueldo_mensual or v_ajustes.sueldo_tope_mensual or v_ajustes.fila is not null,
      v_hogar,
      v_maun,
      v_diezmo
    );
    v_fila_version := 0;
  else
    v_fila := coalesce(
      v_ajustes.fila,
      private.fila_de_siempre(
        v_ajustes.sueldo_mensual_centavos,
        v_ajustes.costos_fijos_centavos,
        v_ajustes.sueldo_tope_mensual,
        v_hogar,
        v_maun,
        v_diezmo
      )
    );
    v_fila_version := v_ajustes.fila_version;
  end if;

  if p_fila_version <> v_fila_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión de la fila %s', p_fila_version, v_fila_version);
  end if;

  select * into v_plan
  from private.plan_del_reparto(
    p_destino::text, v_fila, v_ajustes.perdido_con_sueldo, v_ajustes.perdido_con_diezmo, v_diezmo, v_maun
  );
  v_diezmo_bp := v_plan.diezmo_bp;
  v_obligaciones := cardinality(v_plan.obligaciones);
  v_pasos := cardinality(v_plan.tesoros);
  v_partes := cardinality(v_plan.tesoros_del_reparto);

  -- Lo que cada paso ya recibió en su ciclo, en una sentencia posterior al lock de ajustes: el ciclo de
  -- su día de pago que contiene la fecha del cobro, o el mes del calendario si no tiene día (un ciclo
  -- con el día 1), como loDeLosPasos. Suma el sueldo y los fijos de las liquidaciones de antes (a
  -- Hogar y a Maun), las filas vivas de repartos de los cobros por la fila, de cualquier tipo, y lo que
  -- se le pasó para cubrir el ciclo (cubre_el_mes, el día en que arranca el ciclo que cubre). No se
  -- guarda en ningún lado salvo en la foto de dist_previo.
  select coalesce(jsonb_object_agg(x.tesoro_id::text, x.monto), '{}'::jsonb)
  into v_mes
  from (
    select w.tesoro as tesoro_id, sum(todo.monto)::bigint as monto
    from (
      select u.tesoro, c.desde, c.hasta
      from unnest(v_plan.tesoros, v_plan.dias) as u (tesoro, dia)
      cross join lateral private.ciclo_de_la_fecha(v_fecha, coalesce(u.dia, 1)) as c
    ) as w
    join (
      select v_hogar as tesoro_id, p.fecha_cobro as fecha, p.dist_sueldo_centavos as monto
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro is not null
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_sueldo_centavos <> 0
      union all
      select v_maun, p.fecha_cobro, p.dist_fijos_centavos
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro is not null
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_fijos_centavos <> 0
      union all
      select r.tesoro_id, r.fecha, r.monto_centavos
      from public.repartos r
      join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
      where r.household_id = v_proyecto.household_id
        and r.deleted_at is null
        and p.deleted_at is null
        and p.estado in ('cobrado', 'perdido')
        and p.id <> v_proyecto.id
      union all
      select m.hacia_id, m.cubre_el_mes, m.monto_centavos
      from public.movimientos m
      where m.household_id = v_proyecto.household_id
        and m.deleted_at is null
        and m.cubre_el_mes is not null
        and m.hacia_id is not null
    ) as todo on todo.tesoro_id = w.tesoro and todo.fecha >= w.desde and todo.fecha < w.hasta
    group by w.tesoro
  ) as x;

  -- El saldo de cada tesoro de la fila, como lo cuenta el libro, y su meta: la de Cocos es la suya, y
  -- mientras no la tenga, la de ajustes. También después del lock: todo movimiento, toda liquidación y toda reversión lo toman,
  -- así que el saldo que se lee es entero.
  select coalesce(jsonb_object_agg(s.tesoro_id::text, s.saldo), '{}'::jsonb)
  into v_saldos
  from (
    select l.tesoro_id, sum(l.monto_centavos)::bigint as saldo
    from public.libro_mayor l
    where l.household_id = v_proyecto.household_id
      and not l.ya_en_la_apertura
      and l.tesoro_id = any (v_plan.tesoros || v_plan.tesoros_del_reparto)
    group by l.tesoro_id
  ) as s;

  select coalesce(jsonb_object_agg(m.id::text, m.meta), '{}'::jsonb)
  into v_metas
  from (
    select t.id, case when t.clave = 'cocos' then coalesce(t.meta_centavos, v_ajustes.meta_cocos_centavos) else t.meta_centavos end as meta
    from public.tesoros t
    where t.household_id = v_proyecto.household_id
      and t.id = any (v_plan.tesoros || v_plan.tesoros_del_reparto)
  ) as m
  where coalesce(m.meta, 0) > 0;

  -- El previo de cada paso según su modo, con el piso de su meta, y el tope de cada parte que va hasta
  -- la meta. Gemela de previoDelMes. dist_previo guarda uno por paso, también los que están en cero, y
  -- uno por parte con tope: es previoQueVio.
  select * into v_previo
  from private.previo_del_mes(
    v_plan.tesoros, v_plan.objetivos, v_plan.modos, v_plan.hasta_la_meta,
    v_plan.tesoros_del_reparto, v_plan.hasta_la_meta_del_reparto, v_mes, v_saldos, v_metas
  );
  v_previos := v_previo.previos;
  v_topes_de_las_partes := v_previo.topes;

  select coalesce(jsonb_object_agg(x.tesoro, x.monto), '{}'::jsonb)
  into v_previo_base
  from (
    select u.t::text as tesoro, u.m as monto
    from unnest(v_plan.tesoros, v_previos) as u (t, m)
    union all
    select u.t::text, u.m
    from unnest(v_plan.tesoros_del_reparto, v_topes_de_las_partes) as u (t, m)
    where u.m is not null
  ) as x;

  v_ajustada := private.lo_del_mes_es_otro(v_plan.tesoros, v_plan.tesoros_del_reparto, p_previo, v_previo_base);

  -- Lo que vio la app, como previoDeLoVisto: un paso sin su número arranca en cero y una parte sin el
  -- suyo junta sin fin.
  if v_ajustada then
    select coalesce(
      array_agg(coalesce(private.entero_de_json(p_previo -> u.t::text), 0) order by u.n),
      '{}'
    )
    into v_previos_vistos
    from unnest(v_plan.tesoros) with ordinality as u (t, n);

    select coalesce(array_agg(private.entero_de_json(p_previo -> u.t::text) order by u.n), '{}')
    into v_topes_vistos_de_las_partes
    from unnest(v_plan.tesoros_del_reparto) with ordinality as u (t, n);
  else
    v_previos_vistos := v_previos;
    v_topes_vistos_de_las_partes := v_topes_de_las_partes;
  end if;

  -- Los totales y el diezmo tienen que ser los que vio el usuario, como en el camino de antes. En un
  -- perdido, el diezmo es el porcentaje del diezmo en la fila, o cero si no paga diezmo.
  -- Una app sin actualizar suma los importes crudos, sin mirar la moneda de cada pago: con plata en
  -- dólares no cobra, y no le sirve que le digan que cambiaron los pagos (ADR 0081).
  if p_cobrado_centavos = v_cobrado_crudo and p_cobrado_centavos <> v_cobrado then
    raise exception 'Este trabajo tiene plata en dólares'
      using errcode = 'MN038',
            detail = 'cobro',
            hint = 'Actualizá la app y volvé a hacerlo.';
  end if;

  if v_cobrado <> p_cobrado_centavos
    or v_gastos <> p_gastos_centavos
    or v_diezmo_bp <> coalesce(p_diezmo_bp, v_diezmo_bp)
  then
    raise exception 'Los pagos, los gastos, los topes o el diezmo cambiaron desde que viste la distribución'
      using errcode = 'MN006',
            detail = format(
              'cobrado %s, gastos %s, diezmo %s bp, fecha %s, revisión de la fila %s',
              v_cobrado, v_gastos, v_diezmo_bp, v_fecha, v_fila_version
            );
  end if;

  -- El reparto con lo que vio la app. Si lo que vio no es lo de la base, se ajusta sin rechazar, pero
  -- la cuenta de la app con lo que vio tiene que dar lo que mandó (MN008).
  select * into v_reparto_visto
  from private.repartir_por_la_fila(
    v_cobrado, v_gastos, v_plan.porcentajes_de_obligacion, v_plan.bases,
    v_plan.objetivos, v_previos_vistos, v_plan.por_mes,
    v_plan.porcentajes, v_topes_vistos_de_las_partes, v_plan.montos_fijos
  );

  -- Los repartos que tiene que mandar la app, en el orden de repartosDelCobro: las obligaciones que no
  -- son el diezmo, los pasos, las partes y el superávit si no es Maun, con lo que no alcanzó para el
  -- superávit en cero.
  v_esperados_tesoros := '{}';
  v_esperados_montos := '{}';
  for i in 1 .. v_obligaciones loop
    if i is distinct from v_plan.diezmo_en then
      v_esperados_tesoros := v_esperados_tesoros || v_plan.obligaciones[i];
      v_esperados_montos := v_esperados_montos || v_reparto_visto.obligaciones[i];
    end if;
  end loop;
  v_esperados_tesoros := v_esperados_tesoros || v_plan.tesoros || v_plan.tesoros_del_reparto;
  v_esperados_montos := v_esperados_montos || v_reparto_visto.montos || v_reparto_visto.partes;
  if v_plan.superavit is not null then
    v_esperados_tesoros := v_esperados_tesoros || v_plan.superavit;
    v_esperados_montos := v_esperados_montos || greatest(0, v_reparto_visto.remanente_centavos);
  end if;

  if jsonb_array_length(p_repartos) <> cardinality(v_esperados_tesoros) then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format(
              'la fila tiene %s obligaciones, %s pasos, %s partes y %s superávit aparte',
              v_obligaciones, v_pasos, v_partes, case when v_plan.superavit is null then 'ningún' else 'un' end
            );
  end if;

  for v_elemento, v_posicion in
    select e.value, e.n::integer from jsonb_array_elements(p_repartos) with ordinality as e (value, n)
  loop
    v_tesoro := v_esperados_tesoros[v_posicion];
    v_monto := v_esperados_montos[v_posicion];

    if jsonb_typeof(v_elemento) is distinct from 'object'
      or coalesce(v_elemento ->> 'id', '') !~ c_formato_id
      or private.entero_de_json(v_elemento -> 'posicion') is distinct from v_posicion::bigint
      or (v_elemento ->> 'tesoro_id') is distinct from v_tesoro::text
      or private.entero_de_json(v_elemento -> 'monto_centavos') is distinct from v_monto
    then
      raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
        using errcode = 'MN008',
              detail = format('en el lugar %s va %s a %s', v_posicion, v_monto, v_tesoro);
    end if;
  end loop;

  -- Las columnas de siempre viajan con lo que da columnasDeSiempre: el diezmo es la obligación del
  -- diezmo, los topes y los escalones en cero y el remanente con lo que pasa por Maun antes del
  -- reparto, el ingreso menos el diezmo.
  v_diezmo_visto := case
    when v_plan.diezmo_en is null then 0
    else v_reparto_visto.obligaciones[v_plan.diezmo_en]
  end;

  if (
      p_tope_sueldo_centavos, p_tope_fijos_centavos, p_sueldo_centavos, p_fijos_centavos,
      p_diezmo_centavos, p_remanente_centavos,
      coalesce(p_sueldo_previo_centavos, 0), coalesce(p_fijos_previo_centavos, 0)
    ) is distinct from (
      0::bigint, 0::bigint, 0::bigint, 0::bigint,
      v_diezmo_visto, v_reparto_visto.neta_centavos - v_diezmo_visto,
      0::bigint, 0::bigint
    )
  then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format(
              'diezmo %s, remanente %s, y los topes, el sueldo, los fijos y lo del mes en cero',
              v_diezmo_visto,
              v_reparto_visto.neta_centavos - v_diezmo_visto
            );
  end if;

  -- Recién acá se congela con lo de la base. Cuando no hubo ajuste, es exactamente la misma cuenta
  -- que acaba de pasar el MN008.
  if v_ajustada then
    select * into v_reparto
    from private.repartir_por_la_fila(
      v_cobrado, v_gastos, v_plan.porcentajes_de_obligacion, v_plan.bases,
      v_plan.objetivos, v_previos, v_plan.por_mes,
      v_plan.porcentajes, v_topes_de_las_partes, v_plan.montos_fijos
    );
  else
    v_reparto := v_reparto_visto;
  end if;

  v_diezmo_monto := case
    when v_plan.diezmo_en is null then 0
    else v_reparto.obligaciones[v_plan.diezmo_en]
  end;

  update public.proyectos set
    estado = p_destino,
    fecha_cobro = v_fecha,
    dist_cobrado_centavos = v_cobrado,
    dist_gastos_centavos = v_gastos,
    dist_diezmo_bp = v_diezmo_bp,
    dist_tope_sueldo_centavos = 0,
    dist_tope_fijos_centavos = 0,
    dist_diezmo_centavos = v_diezmo_monto,
    dist_sueldo_centavos = 0,
    dist_fijos_centavos = 0,
    dist_remanente_centavos = v_reparto.neta_centavos - v_diezmo_monto,
    dist_objetivo_sueldo_centavos = 0,
    dist_objetivo_fijos_centavos = 0,
    dist_sueldo_mensual = true,
    dist_sueldo_previo_centavos = 0,
    dist_fijos_previo_centavos = 0,
    dist_liquidado_at = clock_timestamp(),
    reparto_ya_en_la_apertura = p_ya_en_la_apertura,
    reapertura_objetivo_sueldo_centavos = null,
    reapertura_objetivo_fijos_centavos = null,
    reapertura_sueldo_mensual = null,
    reapertura_fecha_cobro = null,
    reapertura_fila = null,
    dist_fila_version = v_fila_version,
    dist_fila = v_fila,
    dist_previo = v_previo_base
  where id = v_proyecto.id
  returning * into v_proyecto;

  -- Una fila de repartos por cada obligación que no es el diezmo, por paso, por parte y por el
  -- superávit si no es Maun, con los ids de la app y los montos de la base.
  v_posicion := 0;

  for i in 1 .. v_obligaciones loop
    continue when i is not distinct from v_plan.diezmo_en;
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'obligacion', null, null, null, null, null, null,
      v_plan.porcentajes_de_obligacion[i], v_plan.bases[i], v_reparto.obligaciones[i], v_fecha,
      p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.obligaciones[i];
  end loop;

  for i in 1 .. v_pasos loop
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'paso', v_plan.clases[i], v_plan.modos[i], v_plan.objetivos[i],
      v_previos[i], v_reparto.topes[i], v_plan.por_mes[i], null, null, v_reparto.montos[i], v_fecha,
      p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros[i];
  end loop;

  for i in 1 .. v_partes loop
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'parte', null, null, null, null, v_topes_de_las_partes[i], null,
      v_plan.porcentajes[i], null, v_reparto.partes[i], v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros_del_reparto[i];
  end loop;

  if v_plan.superavit is not null then
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'superavit', null, null, null, null, null, null, null, null,
      greatest(0, v_reparto.remanente_centavos), v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.superavit;
  end if;

  return v_proyecto;
end;
$function$;

comment on function private.liquidar(estado_proyecto,uuid,integer,date,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,integer,bigint,bigint,boolean,integer,jsonb,jsonb) is 'Liquida un proyecto hacia cobrado o perdido y congela su distribución con la fecha que manda la app, también al volver a cobrar un reabierto (ADR 0063). Rechaza sin fecha (MN016), con una fecha que todavía no llegó (MN017) y un reparto marcado como ya incluido en la apertura con una fecha que no es anterior a ella (MN018). Bloquea el proyecto y después los ajustes. Lo cobrado es la suma del valor en pesos de los pagos (private.valor_en_pesos), y si lo que mandó la app es la suma cruda de los importes y no esa, rebota con MN038 antes de comparar (una app sin actualizar con plata en dólares, ADR 0081). Reconoce el reenvío, ajustado o no, antes de elegir el camino. Sin p_fila_version y sin fila guardada va por el camino de antes (la cascada, con lo del mes que suma también los repartos vivos); sin p_fila_version y con fila guardada, o al volver a cobrar un reabierto que se cobró por la fila, rechaza con MN025; con p_fila_version reparte por la fila (la de su reapertura, la de siempre armada con su foto, o la de los ajustes; en un reabierto el sueldo va por mes si la foto o el taller van por mes, sueldo_tope_mensual o la fila guardada, y lo mismo por el camino de antes), rechaza con MN006 si la revisión no es esa, calcula el previo de cada paso según su modo (lo de su ciclo, que es el del día de pago que contiene la fecha del cobro o, sin día, el mes del calendario; su saldo en libro_mayor o nada) con el piso de su meta y el tope de cada parte que va hasta la meta, congela el diezmo (la obligación del tesoro del diezmo) y las columnas de siempre con columnasDeSiempre, la fila en dist_fila y lo que vio en dist_previo, y escribe una fila de public.repartos por cada otra obligación, por paso, por parte y por el superávit si no es Maun, con los ids que manda la app. En los dos caminos: MN006 si la versión, los totales o el diezmo no son los que vio el cliente, MN008 si la distribución no es la de la base, y si lo que vio la app no es lo de la base, se congela con lo de la base en vez de rechazar (ADR 0016, 0078 y 0079).';

CREATE OR REPLACE FUNCTION private.guardar_la_fila(p_version integer, p_fila jsonb)
 RETURNS ajustes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ajustes public.ajustes;
  v_tesoros jsonb;
  v_problema text;
  v_fila jsonb;
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

  -- Desde cuándo se paga solo cada compromiso lo pone la base: el día del taller en que se guardó con
  -- «Se paga sola», o el que ya tenía si ya se pagaba solo. Así ningún pago es de un vencimiento
  -- anterior a que el dueño lo decidió, venga lo que venga de la app.
  v_fila := private.con_el_paga_sola_desde(v_ajustes.fila, p_fila, private.hoy_en_el_taller());

  -- El reenvío de la cola: esta misma fila ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.fila_version = p_version + 1 and v_ajustes.fila is not distinct from v_fila then
    return v_ajustes;
  end if;

  if v_ajustes.fila_version <> p_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_ajustes.fila_version);
  end if;

  -- Null vuelve a la fila de siempre. La pantalla no lo ofrece: lo usan los e2e para dejar sin fila
  -- el taller de prueba.
  if v_fila is not null then
    -- Los tesoros del taller con su meta y su moneda: la de Cocos es la suya, y mientras no la tenga,
    -- la de ajustes; la de los demás, en tesoros.
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'clave', t.clave,
          'archivado', t.archivado_at is not null,
          'meta', case when t.clave = 'cocos' then coalesce(t.meta_centavos, v_ajustes.meta_cocos_centavos) else t.meta_centavos end,
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
    v_problema := private.problema_de_la_fila(v_fila, v_tesoros);
    if v_problema is not null then
      raise exception 'La fila no se pudo guardar.'
        using errcode = 'MN023',
              detail = v_problema,
              hint = 'Revisala y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    fila = v_fila,
    fila_version = fila_version + 1,
    fila_guardada_at = clock_timestamp()
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$function$;

comment on function private.guardar_la_fila(integer,jsonb) is 'Guarda la fila del taller: bloquea los ajustes, le pone a cada compromiso que se paga solo desde cuándo (private.con_el_paga_sola_desde, con el día del taller), compara la revisión que vio la app (MN006), valida la fila con private.problema_de_la_fila() contra los tesoros del taller con su meta (la de Cocos, de ajustes) y su moneda (MN023, con el código del problema en el detail; un tesoro en dólares no entra, ADR 0081), la guarda, suma una revisión y anota la fecha. Con la fila en null vuelve a la fila de siempre. Reconoce el reenvío idéntico: la misma fila con la revisión siguiente. Los cambios valen desde el próximo cobro: no toca ninguna liquidación hecha (ADR 0003 y 0078).';

-- cubre_el_mes pasa a ser el día en que arranca el ciclo que cubre: con el día 1 sigue siendo el primero
-- del mes, como todas las filas de hoy. El rito del ADR 0078: el nuevo, no válido y con nombre propio,
-- se valida, se saca el viejo y se le pone el nombre de siempre.
alter table public.movimientos
  add constraint movimientos_cubre_el_ciclo_valido
    check (cubre_el_mes is null or tipo = 'transferencia'::public.tipo_movimiento and tesoro_origen is distinct from 'diezmo'::public.tesoro)
    not valid;

alter table public.movimientos validate constraint movimientos_cubre_el_ciclo_valido;

alter table public.movimientos drop constraint movimientos_cubre_el_mes_valido;

alter table public.movimientos rename constraint movimientos_cubre_el_ciclo_valido to movimientos_cubre_el_mes_valido;

comment on column public.movimientos.cubre_el_mes is 'En una transferencia que cubre el faltante de un paso de la fila, el día en que arranca el ciclo que cubre (el vencimiento anterior del compromiso; sin día de pago, el primero del mes); si no, null. Esa plata cuenta para el tope de ese ciclo del tesoro que la recibe: el próximo cobro no la vuelve a llenar (ADR 0078 y los tipos de tesoro). No sale del diezmo.';
