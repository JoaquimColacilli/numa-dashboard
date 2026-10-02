-- El presupuesto en dólares (ADR 0081): un documento forma 2 es un presupuesto en dólares, con su
-- moneda, la de lo abonado y su referencia en pesos (la cotización y su fecha), que se congela y no se
-- recalcula nunca. forma 1 sigue siendo pesos y suma dos claves opcionales, la cláusula de la moneda y
-- la combinación con que se armó, que una app sin actualizar ignora.
--
-- Las tres gemelas de forma (la plantilla, el borrador y el documento) suman las claves nuevas con sus
-- problemas, en el mismo orden que presupuesto.ts. mandar_el_presupuesto compara la moneda con la del
-- trabajo (MN029 con moneda en el detail), calcula lo pagado en la moneda de lo abonado y rechaza con
-- MN038 un documento en pesos de un trabajo en dólares, antes de la comparación de MN029.
--
-- Todas create or replace sin cambiar la firma: los grants quedan. Un borrador o una plantilla de antes
-- siguen pasando, y un documento en pesos de un trabajo en pesos se manda como siempre.

create or replace function private.problema_de_la_plantilla(p_plantilla jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $function$
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
  v_combinacion text;
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

  -- La moneda del valor de una modificación y las cláusulas de la moneda: pueden faltar (una plantilla
  -- de antes, que vale en pesos y con las de fábrica), y si están, con su forma (ADR 0081).
  if p_plantilla ? 'monedaDeLaModificacion'
    and (p_plantilla -> 'monedaDeLaModificacion') not in ('"ARS"'::jsonb, '"USD"'::jsonb)
  then
    return 'forma-invalida';
  end if;
  if p_plantilla ? 'clausulasDeLaMoneda' then
    if jsonb_typeof(p_plantilla -> 'clausulasDeLaMoneda') is distinct from 'object' then
      return 'forma-invalida';
    end if;
    foreach v_combinacion in array array['dolaresEnPesos', 'dolaresEnDolares', 'dolaresEnPesosODolares', 'pesosEnDolares', 'pesosEnPesosODolares'] loop
      if jsonb_typeof(p_plantilla -> 'clausulasDeLaMoneda' -> v_combinacion) is distinct from 'string' then
        return 'forma-invalida';
      end if;
    end loop;
  end if;

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

  -- Las cinco cláusulas de la moneda, en el orden de COMBINACIONES_DE_LA_MONEDA: ninguna vacía y de
  -- hasta 2000 caracteres.
  if p_plantilla ? 'clausulasDeLaMoneda' then
    foreach v_combinacion in array array['dolaresEnPesos', 'dolaresEnDolares', 'dolaresEnPesosODolares', 'pesosEnDolares', 'pesosEnPesosODolares'] loop
      v_texto := p_plantilla -> 'clausulasDeLaMoneda' ->> v_combinacion;
      if v_texto !~ '[^ \t\n\r\f\v]' then
        return 'clausula-de-la-moneda-vacia';
      end if;
      if char_length(v_texto) > 2000 then
        return 'clausula-de-la-moneda-larga';
      end if;
    end loop;
  end if;

  return null;
end;
$function$;

comment on function private.problema_de_la_plantilla(jsonb) is
  'El primer problema que impide guardar una plantilla del presupuesto, con el mismo código y en el mismo orden que problemaDeLaPlantilla en presupuesto.ts, o null si se puede guardar: la forma, los rangos de los números, hasta 20 cláusulas por grupo con ids únicos, títulos de hasta 120 caracteres y textos de hasta 2000 no vacíos, de 1 a 6 formas de pago con nombre de hasta 60, la garantía, y, si están, la moneda del valor de una modificación y las cinco cláusulas de la moneda, ninguna vacía y de hasta 2000 caracteres (ADR 0081). scripts/comparacion.ts las compara caso por caso (ADR 0080).';

create or replace function private.problema_del_presupuesto(p_contenido jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $function$
declare
  c_grupos constant text[] := array['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'];
  v_grupo text;
  v_elemento jsonb;
  v_vistos text[];
  v_id text;
  v_forma jsonb;
  v_plazo bigint;
  v_validez bigint;
  v_modificacion jsonb;
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

  -- La cláusula de la moneda retocada, el valor de una modificación en su moneda y la moneda de lo
  -- abonado: pueden faltar (un borrador de antes) o ir en null (ADR 0081).
  if coalesce(jsonb_typeof(p_contenido -> 'clausulaDeLaMoneda'), 'null') not in ('null', 'string') then
    return 'forma-invalida';
  end if;
  v_modificacion := p_contenido -> 'modificacion';
  if coalesce(jsonb_typeof(v_modificacion), 'null') <> 'null'
    and (
      jsonb_typeof(v_modificacion) <> 'object'
      or private.entero_de_json(v_modificacion -> 'importe') is null
      or (v_modificacion -> 'moneda') is distinct from '"ARS"'::jsonb
        and (v_modificacion -> 'moneda') is distinct from '"USD"'::jsonb
    )
  then
    return 'forma-invalida';
  end if;
  if coalesce(jsonb_typeof(p_contenido -> 'monedaDeLoAbonado'), 'null') <> 'null'
    and (p_contenido -> 'monedaDeLoAbonado') not in ('"ARS"'::jsonb, '"USD"'::jsonb)
  then
    return 'forma-invalida';
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

  if jsonb_typeof(p_contenido -> 'clausulaDeLaMoneda') = 'string'
    and char_length(p_contenido ->> 'clausulaDeLaMoneda') > 2000
  then
    return 'clausula-de-la-moneda-larga';
  end if;
  if jsonb_typeof(v_modificacion) = 'object'
    and private.entero_de_json(v_modificacion -> 'importe') not between 0 and 1000000000000
  then
    return 'modificacion-fuera-de-rango';
  end if;

  return null;
end;
$function$;

comment on function private.problema_del_presupuesto(jsonb) is
  'El primer problema que impide guardar un borrador del presupuesto, con el mismo código y en el mismo orden que problemaDelBorrador en presupuesto.ts, o null si se puede guardar. Es permisivo, porque un borrador puede estar a medio hacer: mira la forma y los topes (30 muebles, 40 herrajes, 20 tildadas y 20 propias por grupo, los largos de cada texto, ids únicos) y los rangos del plazo y de la vigencia; si están, la cláusula de la moneda retocada (hasta 2000 caracteres), el valor de una modificación con su moneda (de 0 a 1.000.000.000.000) y la moneda de lo abonado (ADR 0081). scripts/comparacion.ts las compara caso por caso (ADR 0080).';

create or replace function private.problema_del_documento(p_documento jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $function$
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
  v_referencia jsonb;
  v_fecha date;
begin
  -- forma 1 es en pesos y forma 2 en dólares, con su moneda y su referencia en pesos (ADR 0081).
  if jsonb_typeof(p_documento) is distinct from 'object'
    or (p_documento -> 'forma' is distinct from '1'::jsonb and p_documento -> 'forma' is distinct from '2'::jsonb)
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

  -- La cláusula de la moneda y la combinación con que se armó pueden faltar (un documento de antes).
  -- La combinación es una de las tres, en ese orden.
  if coalesce(jsonb_typeof(p_documento -> 'clausulaDeLaMoneda'), 'null') not in ('null', 'string') then
    return 'forma-invalida';
  end if;
  if p_documento ? 'cobraEn'
    and (p_documento -> 'cobraEn') not in ('["ARS"]'::jsonb, '["USD"]'::jsonb, '["ARS", "USD"]'::jsonb)
  then
    return 'forma-invalida';
  end if;

  -- En dólares: la moneda, la de lo abonado y la referencia en pesos, con una cotización entera y una
  -- fecha que existe, como esFechaQueExiste.
  if p_documento -> 'forma' = '2'::jsonb then
    v_referencia := p_documento -> 'referencia';
    if (p_documento -> 'moneda') is distinct from '"USD"'::jsonb
      or (p_documento -> 'monedaDeLoAbonado') not in ('"ARS"'::jsonb, '"USD"'::jsonb)
      or (p_documento -> 'monedaDeLoAbonado') is null
      or jsonb_typeof(v_referencia) is distinct from 'object'
      or private.entero_de_json(v_referencia -> 'cotizacion') is null
      or jsonb_typeof(v_referencia -> 'fecha') is distinct from 'string'
      or (v_referencia ->> 'fecha') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    then
      return 'forma-invalida';
    end if;
    begin
      v_fecha := (v_referencia ->> 'fecha')::date;
    exception
      when others then
        return 'forma-invalida';
    end;
    if to_char(v_fecha, 'YYYY-MM-DD') <> (v_referencia ->> 'fecha')
      or extract(year from v_fecha) < 100
    then
      return 'forma-invalida';
    end if;
  end if;

  if v_sena < 0 or v_sena > 10000 then
    return 'sena-fuera-de-rango';
  end if;
  if v_abonado < 0 or v_abonado > 1000000000000 then
    return 'abonado-fuera-de-rango';
  end if;
  if p_documento -> 'forma' = '2'::jsonb
    and private.entero_de_json(v_referencia -> 'cotizacion') not between 100 and 10000000
  then
    return 'cotizacion-fuera-de-rango';
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
      union all select coalesce(p_documento ->> 'clausulaDeLaMoneda', ''), 4000
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
$function$;

comment on function private.problema_del_documento(jsonb) is
  'El primer problema que impide congelar un documento del presupuesto, con el mismo código y en el mismo orden que problemaDelDocumento en presupuesto.ts, o null si sirve. forma 1 es en pesos y forma 2 en dólares, con su moneda, la de lo abonado y su referencia en pesos (una cotización de 100 a 10.000.000 y una fecha que existe); las dos pueden llevar la cláusula de la moneda (hasta 4000 caracteres) y la combinación con que se armó (ADR 0081). Mira la forma de cada campo, los rangos de la seña, de lo pagado, del plazo, de la vigencia, de la garantía y de los importes, los topes de las listas y el largo de cada texto. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

create or replace function private.mandar_el_presupuesto(p_presupuesto_id uuid, p_revision_id uuid, p_version integer, p_documento jsonb, p_que_cambio text, p_mandado_el date, p_vale_hasta date, p_idioma text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
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
  v_moneda_del_documento text;
  v_moneda_de_lo_abonado text;
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

  -- El idioma con el que la app armó el documento: uno de los tres. Sin él (una app sin actualizar),
  -- vale el de los clientes del taller.
  if p_idioma is not null and p_idioma not in ('es', 'en', 'pt-BR') then
    raise exception 'El presupuesto no se pudo mandar.'
      using errcode = 'MN031',
            detail = 'idioma',
            hint = 'Revisalo y probá de nuevo.';
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

  -- Un documento en pesos de un trabajo en dólares solo lo arma una app sin actualizar, y MN029 le
  -- diría que cambiaron los importes cuando no cambió nada (ADR 0081).
  if v_proyecto.moneda <> 'ARS' and p_documento -> 'forma' = '1'::jsonb then
    raise exception 'Este trabajo tiene plata en dólares'
      using errcode = 'MN038',
            detail = 'presupuesto',
            hint = 'Actualizá la app y volvé a hacerlo.';
  end if;

  v_moneda_del_documento := case
    when p_documento -> 'forma' = '2'::jsonb then p_documento ->> 'moneda'
    else 'ARS'
  end;
  v_moneda_de_lo_abonado := case
    when p_documento -> 'forma' = '2'::jsonb then p_documento ->> 'monedaDeLoAbonado'
    else 'ARS'
  end;

  if v_moneda_del_documento is distinct from v_proyecto.moneda then
    v_distintos := v_distintos || 'moneda'::text;
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

  -- Lo pagado hasta hoy en la moneda de lo abonado del documento: lo que descuenta cada pago si es la
  -- del trabajo, o su valor en pesos. Gemela de abonadoEn (ADR 0081).
  select coalesce(sum(
    case
      when v_moneda_de_lo_abonado = v_proyecto.moneda
        then private.lo_que_descuenta(g.moneda, g.monto_centavos, g.cotizacion_centavos, v_proyecto.moneda)
      else private.valor_en_pesos(g.moneda, g.monto_centavos, g.cotizacion_centavos)
    end
  ), 0) into v_pagado
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
    contenido, idioma
  ) values (
    p_revision_id, v_household, v_presupuesto.id, v_proyecto.id, v_siguiente, v_presupuesto.numero,
    p_mandado_el, p_vale_hasta,
    case
      when v_siguiente > 1 then regexp_replace(p_que_cambio, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    end,
    p_documento,
    coalesce(p_idioma, v_ajustes.idioma_de_los_clientes)
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
$function$;

comment on function private.mandar_el_presupuesto(uuid, uuid, integer, jsonb, text, date, date, text) is
  'Manda el presupuesto, en una transacción: bloquea el trabajo y después los ajustes del taller; si la revisión ya existe la devuelve (el reenvío); rechaza si el borrador cambió (MN026), si el trabajo está aprobado (MN028) o perdido (MN032), si el día del envío no llegó (MN033), si el idioma no es uno de los tres o el documento no tiene la forma (MN031), si le falta algo para mandarlo (MN027), si es un documento en pesos de un trabajo en dólares (MN038, lo arma solo una app sin actualizar) o si su moneda, sus importes, su seña o lo pagado no son los del trabajo (MN029; lo pagado, en la moneda de lo abonado del documento: lo que descuenta cada pago o su valor en pesos, ADR 0081); en el primer envío le pone número; congela la revisión siguiente con el idioma en que la app la armó (sin él, una app sin actualizar, el de los clientes del taller, ADR 0082) y pasa el trabajo a presupuesto enviado con la vigencia, el último contacto y la tarea tildada. Devuelve la revisión, el borrador, el trabajo y sus próximos contactos. Toda lectura filtra por el taller de la sesión, también la del reenvío (ADR 0080).';
