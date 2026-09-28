-- El cobro por la fila (ADR 0078): cada liquidación reparte su ganancia por la fila del taller y
-- congela una fila de public.repartos por paso y por parte.
--
-- private.liquidar(), public.cobrar_proyecto() y public.cerrar_perdido() suman tres parámetros al
-- final, todos con default null: la revisión de la fila que vio la app, sus repartos con los ids y lo
-- que cada tesoro llevaba del mes según la app. Cambiar la firma es drop y create (packages/db/CLAUDE.md),
-- con sus revokes y grants otra vez. private.revertir_liquidacion() no cambia de firma: or replace.
--
-- Tres caminos, y antes de elegir se reconoce el reenvío:
--   · el de antes, sin revisión y sin fila guardada: lo que manda una app sin actualizar. Hace lo de
--     siempre, salvo que lo del mes suma también los repartos vivos del mes, así una app vieja que
--     cobra después de una nueva no paga dos veces el sueldo;
--   · MN025, sin revisión y con fila guardada, o al volver a cobrar un reabierto que se cobró por la
--     fila;
--   · por la fila, en todos los demás casos. Las columnas de siempre se escriben con lo que da
--     columnasDeSiempre de @maun/domain, así los checks de proyectos siguen valiendo sin cambiarlos.
--
-- Un bundle de antes sigue andando mientras el taller no guarde su fila: llama con los parámetros de
-- siempre y cae en el camino de antes.


-- Lo del mes que vio la app -------------------------------------------------------------------------------

create function private.lo_del_mes_es_otro(p_visto jsonb, p_base jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_visto is not null and exists (
    select 1
    from jsonb_each_text(coalesce(p_base, '{}'::jsonb)) as b (tesoro, monto)
    where coalesce(private.entero_de_json(p_visto -> b.tesoro), 0) <> b.monto::bigint
  )
$$;

comment on function private.lo_del_mes_es_otro(jsonb, jsonb) is
  'Si lo que la app vio del mes, {tesoro_id: centavos}, no es lo que suma la base para los tesoros de los pasos. Un tesoro que la app no manda cuenta como cero, y los que no son pasos no se miran. Null en lo visto es que la app no mandó lo del mes: no hay nada con qué ajustar (ADR 0078).';

revoke all on function private.lo_del_mes_es_otro(jsonb, jsonb) from public, anon, authenticated;


-- Liquidar -------------------------------------------------------------------------------------------------

drop function public.cobrar_proyecto(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean);
drop function public.cerrar_perdido(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean);
drop function private.liquidar(public.estado_proyecto, uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean);

create function private.liquidar(
  p_destino public.estado_proyecto,
  p_proyecto_id uuid,
  p_version integer,
  p_fecha date,
  p_cobrado_centavos bigint,
  p_gastos_centavos bigint,
  p_tope_sueldo_centavos bigint,
  p_tope_fijos_centavos bigint,
  p_diezmo_centavos bigint,
  p_sueldo_centavos bigint,
  p_fijos_centavos bigint,
  p_remanente_centavos bigint,
  p_diezmo_bp integer,
  p_sueldo_previo_centavos bigint default null,
  p_fijos_previo_centavos bigint default null,
  p_ya_en_la_apertura boolean default false,
  p_fila_version integer default null,
  p_repartos jsonb default null,
  p_previo jsonb default null
)
returns public.proyectos
language plpgsql
security definer
set search_path = ''
as $$
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
  v_gastos bigint;
  v_dist record;
  v_dist_vista record;
  v_apertura date;
  v_hogar uuid;
  v_maun uuid;
  v_fila jsonb;
  v_fila_version integer;
  v_plan record;
  v_mes jsonb;
  v_previos bigint[];
  v_previos_vistos bigint[];
  v_previo_base jsonb;
  v_reparto record;
  v_reparto_visto record;
  v_pasos integer;
  v_partes integer;
  v_elemento jsonb;
  v_posicion integer;
  v_tesoro uuid;
  v_monto bigint;
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

  -- La revisión de la fila viaja con sus repartos, y lo del mes que vio la app solo con ellos.
  if (p_fila_version is null) <> (p_repartos is null)
    or (p_fila_version is null and p_previo is not null)
  then
    raise exception 'La fila del cobro va con sus repartos' using errcode = '22004';
  end if;

  if p_repartos is not null and jsonb_typeof(p_repartos) <> 'array' then
    raise exception 'Los repartos van en una lista' using errcode = '22023';
  end if;
  if p_previo is not null and jsonb_typeof(p_previo) <> 'object' then
    raise exception 'Lo del mes va como {tesoro: centavos}' using errcode = '22023';
  end if;

  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se liquida hacia cobrado o perdido' using errcode = '22023';
  end if;

  -- El diezmo de un perdido es un dato (ajustes.perdido_con_diezmo), no una regla: la app manda el
  -- que vio, y si cambió es MN006. En un cobro es la regla (DIEZMO) y no se manda: si cambia, MN008.
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
  -- liquidación haya salido ajustada, que es cuando lo del mes que vio la app no es el congelado.
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
          and not private.lo_del_mes_es_otro(p_previo, v_proyecto.dist_previo)
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
  -- y cubrir un mes la toman, así que se serializan y la segunda suma el mes después de que la primera
  -- commiteó. for no key update: choca con otra liquidación y con una edición de los ajustes, no con
  -- las foreign keys. Es por household, más grueso que por mes (ADR 0011).
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

  select coalesce(sum(g.monto_centavos), 0) into v_cobrado
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
      -- reescribe el sueldo con los ajustes de hoy (ADR 0003).
      v_diezmo_bp := c_diezmo_bp;
      v_objetivo_sueldo := v_proyecto.reapertura_objetivo_sueldo_centavos;
      v_objetivo_fijos := v_proyecto.reapertura_objetivo_fijos_centavos;
      v_sueldo_mensual := v_proyecto.reapertura_sueldo_mensual;
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
  -- la foto de una reapertura, la de los ajustes.
  if p_destino = 'cobrado' and v_proyecto.reapertura_fila is not null then
    v_fila := v_proyecto.reapertura_fila -> 'fila';
    v_fila_version := (v_proyecto.reapertura_fila ->> 'version')::integer;
  elsif p_destino = 'cobrado' and v_proyecto.reapertura_fecha_cobro is not null then
    v_fila := private.fila_de_siempre(
      v_proyecto.reapertura_objetivo_sueldo_centavos,
      v_proyecto.reapertura_objetivo_fijos_centavos,
      v_proyecto.reapertura_sueldo_mensual,
      v_hogar,
      v_maun
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
        v_maun
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
    p_destino::text, v_fila, v_ajustes.perdido_con_sueldo, v_ajustes.perdido_con_diezmo
  );
  v_diezmo_bp := v_plan.diezmo_bp;
  v_pasos := cardinality(v_plan.tesoros);
  v_partes := cardinality(v_plan.tesoros_del_reparto);

  -- Lo que cada tesoro ya recibió en el mes, en una sentencia posterior al lock de ajustes: el sueldo
  -- y los fijos de las liquidaciones de antes (a Hogar y a Maun), los repartos vivos de los cobros por
  -- la fila y lo que se le pasó para cubrir el mes. Gemela de previoDelMes. No se guarda en ningún
  -- lado salvo la foto de dist_previo.
  select coalesce(jsonb_object_agg(x.tesoro_id::text, x.monto), '{}'::jsonb)
  into v_mes
  from (
    select todo.tesoro_id, sum(todo.monto)::bigint as monto
    from (
      select v_hogar as tesoro_id, p.dist_sueldo_centavos as monto
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro >= v_inicio_mes
        and p.fecha_cobro < v_fin_mes
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_sueldo_centavos <> 0
      union all
      select v_maun, p.dist_fijos_centavos
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro >= v_inicio_mes
        and p.fecha_cobro < v_fin_mes
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_fijos_centavos <> 0
      union all
      select r.tesoro_id, r.monto_centavos
      from public.repartos r
      join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
      where r.household_id = v_proyecto.household_id
        and r.deleted_at is null
        and r.fecha >= v_inicio_mes
        and r.fecha < v_fin_mes
        and p.deleted_at is null
        and p.estado in ('cobrado', 'perdido')
        and p.id <> v_proyecto.id
      union all
      select m.hacia_id, m.monto_centavos
      from public.movimientos m
      where m.household_id = v_proyecto.household_id
        and m.deleted_at is null
        and m.cubre_el_mes = v_inicio_mes
        and m.hacia_id is not null
    ) as todo
    group by todo.tesoro_id
  ) as x;

  -- Solo los pasos miran lo del mes. dist_previo guarda uno por paso, también los que están en cero.
  select
    coalesce(array_agg(coalesce((v_mes ->> u.t::text)::bigint, 0) order by u.n), '{}'),
    coalesce(jsonb_object_agg(u.t::text, coalesce((v_mes ->> u.t::text)::bigint, 0)), '{}'::jsonb)
  into v_previos, v_previo_base
  from unnest(v_plan.tesoros) with ordinality as u (t, n);

  v_ajustada := private.lo_del_mes_es_otro(p_previo, v_previo_base);

  if v_ajustada then
    select coalesce(
      array_agg(coalesce(private.entero_de_json(p_previo -> u.t::text), 0) order by u.n),
      '{}'
    )
    into v_previos_vistos
    from unnest(v_plan.tesoros) with ordinality as u (t, n);
  else
    v_previos_vistos := v_previos;
  end if;

  -- Los totales y el diezmo tienen que ser los que vio el usuario, como en el camino de antes.
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
    v_cobrado, v_gastos, v_diezmo_bp, v_plan.objetivos, v_previos_vistos, v_plan.por_mes,
    v_plan.porcentajes
  );

  if jsonb_array_length(p_repartos) <> v_pasos + v_partes then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format('la fila tiene %s pasos y %s partes', v_pasos, v_partes);
  end if;

  for v_elemento, v_posicion in
    select e.value, e.n::integer from jsonb_array_elements(p_repartos) with ordinality as e (value, n)
  loop
    if v_posicion <= v_pasos then
      v_tesoro := v_plan.tesoros[v_posicion];
      v_monto := v_reparto_visto.montos[v_posicion];
    else
      v_tesoro := v_plan.tesoros_del_reparto[v_posicion - v_pasos];
      v_monto := v_reparto_visto.partes[v_posicion - v_pasos];
    end if;

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

  -- Las columnas de siempre viajan con lo que da columnasDeSiempre: el diezmo, los topes y los
  -- escalones en cero y el remanente con lo que pasa por Maun antes del reparto.
  if (
      p_tope_sueldo_centavos, p_tope_fijos_centavos, p_sueldo_centavos, p_fijos_centavos,
      p_diezmo_centavos, p_remanente_centavos,
      coalesce(p_sueldo_previo_centavos, 0), coalesce(p_fijos_previo_centavos, 0)
    ) is distinct from (
      0::bigint, 0::bigint, 0::bigint, 0::bigint,
      v_reparto_visto.diezmo_centavos, v_reparto_visto.neta_centavos - v_reparto_visto.diezmo_centavos,
      0::bigint, 0::bigint
    )
  then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format(
              'diezmo %s, remanente %s, y los topes, el sueldo, los fijos y lo del mes en cero',
              v_reparto_visto.diezmo_centavos,
              v_reparto_visto.neta_centavos - v_reparto_visto.diezmo_centavos
            );
  end if;

  -- Recién acá se congela con lo del mes de la base. Cuando no hubo ajuste, es exactamente la misma
  -- cuenta que acaba de pasar el MN008.
  if v_ajustada then
    select * into v_reparto
    from private.repartir_por_la_fila(
      v_cobrado, v_gastos, v_diezmo_bp, v_plan.objetivos, v_previos, v_plan.por_mes,
      v_plan.porcentajes
    );
  else
    v_reparto := v_reparto_visto;
  end if;

  update public.proyectos set
    estado = p_destino,
    fecha_cobro = v_fecha,
    dist_cobrado_centavos = v_cobrado,
    dist_gastos_centavos = v_gastos,
    dist_diezmo_bp = v_diezmo_bp,
    dist_tope_sueldo_centavos = 0,
    dist_tope_fijos_centavos = 0,
    dist_diezmo_centavos = v_reparto.diezmo_centavos,
    dist_sueldo_centavos = 0,
    dist_fijos_centavos = 0,
    dist_remanente_centavos = v_reparto.neta_centavos - v_reparto.diezmo_centavos,
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

  -- Una fila de repartos por paso y por parte, con los ids de la app y los montos de la base.
  for v_posicion in 1 .. v_pasos loop
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'paso', v_plan.clases[v_posicion], v_plan.objetivos[v_posicion],
      v_previos[v_posicion], v_reparto.topes[v_posicion], v_plan.por_mes[v_posicion], null,
      v_reparto.montos[v_posicion], v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros[v_posicion];
  end loop;

  for v_posicion in 1 .. v_partes loop
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_pasos + v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id,
      v_proyecto.id, v_pasos + v_posicion, t.id, t.nombre, 'parte', null, null, null, null, null,
      v_plan.porcentajes[v_posicion], v_reparto.partes[v_posicion], v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros_del_reparto[v_posicion];
  end loop;

  return v_proyecto;
end;
$$;

revoke all on function private.liquidar(public.estado_proyecto, uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.liquidar(public.estado_proyecto, uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) to authenticated;

comment on function private.liquidar(public.estado_proyecto, uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) is
  'Liquida un proyecto hacia cobrado o perdido y congela su distribución con la fecha que manda la app, también al volver a cobrar un reabierto (ADR 0063). Rechaza sin fecha (MN016), con una fecha que todavía no llegó (MN017) y un reparto marcado como ya incluido en la apertura con una fecha que no es anterior a ella (MN018). Bloquea el proyecto y después los ajustes. Reconoce el reenvío, ajustado o no, antes de elegir el camino. Sin p_fila_version y sin fila guardada va por el camino de antes (la cascada, con lo del mes que suma también los repartos vivos); sin p_fila_version y con fila guardada, o al volver a cobrar un reabierto que se cobró por la fila, rechaza con MN025; con p_fila_version reparte por la fila (la de su reapertura, la de siempre armada con su foto, o la de los ajustes), rechaza con MN006 si la revisión no es esa, congela las columnas de siempre con columnasDeSiempre, la fila en dist_fila y lo del mes en dist_previo, y escribe una fila de public.repartos por paso y por parte con los ids que manda la app. En los dos caminos: MN006 si la versión, los totales o el diezmo no son los que vio el cliente, MN008 si la distribución no es la de la base, y si lo del mes que vio la app no es el de la base, se congela con el de la base en vez de rechazar (ADR 0016 y 0078).';

create function public.cobrar_proyecto(
  p_proyecto_id uuid,
  p_version integer,
  p_fecha_cobro date,
  p_cobrado_centavos bigint,
  p_gastos_centavos bigint,
  p_tope_sueldo_centavos bigint,
  p_tope_fijos_centavos bigint,
  p_diezmo_centavos bigint,
  p_sueldo_centavos bigint,
  p_fijos_centavos bigint,
  p_remanente_centavos bigint,
  p_sueldo_previo_centavos bigint default null,
  p_fijos_previo_centavos bigint default null,
  p_ya_en_la_apertura boolean default false,
  p_fila_version integer default null,
  p_repartos jsonb default null,
  p_previo jsonb default null
)
returns public.proyectos
language sql
set search_path = ''
as $$
  select *
  from private.liquidar(
    'cobrado', p_proyecto_id, p_version, p_fecha_cobro, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, null,
    p_sueldo_previo_centavos, p_fijos_previo_centavos, p_ya_en_la_apertura,
    p_fila_version, p_repartos, p_previo
  )
$$;

revoke all on function public.cobrar_proyecto(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.cobrar_proyecto(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, integer, jsonb, jsonb) to authenticated;

comment on function public.cobrar_proyecto(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, integer, jsonb, jsonb) is
  'RPC de cobro de un proyecto entregado. La app manda la versión del proyecto, los totales, la fecha del cobro (la del último pago por defecto, o la del cobro original si fue reabierto), la distribución que le mostró al usuario, lo del mes que vio y si ese reparto ya estaba en los saldos de la apertura. Una app actualizada manda además la revisión de la fila, sus repartos con los ids y lo que cada tesoro llevaba del mes, y los parámetros de siempre con columnasDeSiempre. Si lo del mes no es el de la base, la liquidación se congela con el de la base y la app lo ve comparando dist_previo (o dist_sueldo_previo_centavos, por el camino de antes) contra lo que mandó. Ver private.liquidar() (ADR 0078).';

create function public.cerrar_perdido(
  p_proyecto_id uuid,
  p_version integer,
  p_fecha date,
  p_cobrado_centavos bigint,
  p_gastos_centavos bigint,
  p_tope_sueldo_centavos bigint,
  p_tope_fijos_centavos bigint,
  p_diezmo_centavos bigint,
  p_sueldo_centavos bigint,
  p_fijos_centavos bigint,
  p_remanente_centavos bigint,
  p_diezmo_bp integer,
  p_sueldo_previo_centavos bigint default null,
  p_fijos_previo_centavos bigint default null,
  p_ya_en_la_apertura boolean default false,
  p_fila_version integer default null,
  p_repartos jsonb default null,
  p_previo jsonb default null
)
returns public.proyectos
language sql
set search_path = ''
as $$
  select *
  from private.liquidar(
    'perdido', p_proyecto_id, p_version, p_fecha, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, p_diezmo_bp,
    p_sueldo_previo_centavos, p_fijos_previo_centavos, p_ya_en_la_apertura,
    p_fila_version, p_repartos, p_previo
  )
$$;

revoke all on function public.cerrar_perdido(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.cerrar_perdido(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) to authenticated;

comment on function public.cerrar_perdido(uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) is
  'RPC de cierre como perdido de un lead o de una obra que se cayó. Liquida la seña retenida como un cobro, con la fecha del cierre que manda la app. Los mismos parámetros que cobrar_proyecto, más el diezmo que vio el usuario: en un perdido es un dato de los ajustes, no una regla. Un perdido reparte con la fila de los ajustes, nunca con la foto de una reapertura. Ver private.liquidar() (ADR 0078).';


-- Revertir: los repartos se borran y la fila queda en la foto -----------------------------------------------

create or replace function private.revertir_liquidacion(
  p_proyecto_id uuid,
  p_version integer,
  p_desde public.estado_proyecto,
  p_hacia public.estado_proyecto
)
returns public.proyectos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proyecto public.proyectos;
begin
  if num_nulls(p_proyecto_id, p_version, p_desde, p_hacia) > 0 then
    raise exception 'La reversión necesita todos sus parámetros' using errcode = '22004';
  end if;

  select p.* into v_proyecto
  from public.proyectos p
  where p.id = p_proyecto_id
    and p.household_id = any (array(select private.user_household_ids()))
  for update;

  if not found then
    raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El reenvío de la cola: esta misma reversión ya se aplicó y la respuesta se perdió. Reabrir un
  -- cobro deja la foto de la reapertura; reactivar un perdido no deja ninguna.
  if v_proyecto.estado = p_hacia
    and v_proyecto.fecha_cobro is null
    and v_proyecto.version = p_version + 1
    and (p_desde = 'cobrado') = (v_proyecto.reapertura_fecha_cobro is not null)
  then
    return v_proyecto;
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  if v_proyecto.estado <> p_desde or not private.reversion_valida(p_desde, p_hacia) then
    raise exception '%', case p_desde
        when 'cobrado' then format('Solo se reabre un proyecto cobrado, y este está en %s', v_proyecto.estado)
        else format('Solo se reactiva un perdido, a un estado de seguimiento: este está en %s y el destino es %s', v_proyecto.estado, p_hacia)
      end
      using errcode = 'MN007';
  end if;

  if v_proyecto.version <> p_version then
    raise exception 'El proyecto cambió desde que lo viste'
      using errcode = 'MN006',
            detail = format('versión vista %s, versión actual %s', p_version, v_proyecto.version);
  end if;

  -- El mismo segundo lock que la liquidación: una liquidación del mismo mes que corre en paralelo
  -- ve el mes con este proyecto adentro o afuera, nunca a medias.
  perform 1
  from public.ajustes a
  where a.household_id = v_proyecto.household_id
  for no key update;

  -- Los repartos del cobro dejan de valer: salen del libro y de lo del mes, y el delta se los lleva.
  update public.repartos r set
    deleted_at = clock_timestamp()
  where r.household_id = v_proyecto.household_id
    and r.proyecto_id = v_proyecto.id
    and r.deleted_at is null;

  -- Reabrir un cobro guarda la fecha, los objetivos y el modo del original para el cobro
  -- siguiente (ADR 0003), y conserva si su reparto ya estaba en la apertura: volver a cobrarlo
  -- propone lo mismo. Si se cobró por la fila, guarda además la fila con su revisión, y volver a
  -- cobrarlo reparte con ella. Reactivar un perdido no guarda nada: un lead que revive es un lead
  -- vivo otra vez, y un cierre posterior es un evento nuevo con su fecha.
  update public.proyectos set
    estado = p_hacia,
    reapertura_objetivo_sueldo_centavos = case when p_desde = 'cobrado' then dist_objetivo_sueldo_centavos end,
    reapertura_objetivo_fijos_centavos = case when p_desde = 'cobrado' then dist_objetivo_fijos_centavos end,
    reapertura_sueldo_mensual = case when p_desde = 'cobrado' then dist_sueldo_mensual end,
    reapertura_fecha_cobro = case when p_desde = 'cobrado' then fecha_cobro end,
    reapertura_fila = case
      when p_desde = 'cobrado' and dist_fila_version is not null
        then jsonb_build_object('version', dist_fila_version, 'fila', dist_fila)
    end,
    reparto_ya_en_la_apertura = case when p_desde = 'cobrado' then reparto_ya_en_la_apertura else false end,
    fecha_cobro = null,
    dist_cobrado_centavos = null,
    dist_gastos_centavos = null,
    dist_diezmo_bp = null,
    dist_tope_sueldo_centavos = null,
    dist_tope_fijos_centavos = null,
    dist_diezmo_centavos = null,
    dist_sueldo_centavos = null,
    dist_fijos_centavos = null,
    dist_remanente_centavos = null,
    dist_objetivo_sueldo_centavos = null,
    dist_objetivo_fijos_centavos = null,
    dist_sueldo_mensual = null,
    dist_sueldo_previo_centavos = null,
    dist_fijos_previo_centavos = null,
    dist_liquidado_at = null,
    dist_fila_version = null,
    dist_fila = null,
    dist_previo = null
  where id = v_proyecto.id
  returning * into v_proyecto;

  return v_proyecto;
end;
$$;

comment on function private.revertir_liquidacion(uuid, integer, public.estado_proyecto, public.estado_proyecto) is
  'Descongela la distribución de un proyecto liquidado: borra lógicamente sus repartos y reabre un cobrado a entregado guardando la foto del cobro (con la fila y su revisión si se cobró por la fila, en reapertura_fila), o reactiva un perdido a un estado de seguimiento sin foto. Los demás proyectos del mes no se recalculan. Rechaza con MN006 si el proyecto cambió. Reconoce el reenvío idéntico (ADR 0003 y 0078).';
