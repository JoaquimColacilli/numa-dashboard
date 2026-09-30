-- El reabierto cobra por mes (ADR 0079): un cobro que se había congelado con el sueldo por trabajo y
-- se reabre después de que el taller pasó a repartir el sueldo por mes (ADR 0072) se vuelve a cobrar
-- con la fecha, los objetivos y la fila de su foto, como hasta ahora, pero el sueldo va por mes si la
-- foto o el taller van por mes. El taller va por mes con ajustes.sueldo_tope_mensual o con su fila
-- guardada. El sueldo por trabajo queda solo cuando la foto y el taller son por trabajo, como en el
-- seed, y vale también para un reabierto de un mes anterior, que se cuenta contra el sueldo de su mes.
--
-- private.liquidar() con create or replace: la misma firma y el cuerpo copiado del estado vivo
-- (supabase/esquema.sql), con tres cambios, uno por camino:
--   · por la fila, un reabierto con reapertura_fila que trae el sueldo por trabajo lo pasa a por mes
--     si el taller va por mes;
--   · por la fila, la fila de siempre armada con la foto va por mes si la foto o el taller van por mes;
--   · por el camino de antes, el de una app anterior a la fila, la misma regla (ahí la fila guardada
--     no llega: rebota antes con MN025).
-- Sus gemelas cambian en el mismo PR: filaParaLiquidar de @maun/db y planDeLiquidacion de
-- @maun/domain. No toca datos: reapertura_* y reapertura_fila quedan como están, y la regla se aplica
-- al volver a cobrar. Lo ya congelado no se reescribe (ADR 0003): se corrige reabriéndolo y
-- volviéndolo a cobrar. Una app sin actualizar que vuelva a cobrar uno de estos trabajos rebota con
-- MN008 (MN006 por el camino de antes) sin mover plata.

create or replace function private.liquidar(
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

  -- Lo que cada tesoro ya recibió en el mes, en una sentencia posterior al lock de ajustes: el sueldo
  -- y los fijos de las liquidaciones de antes (a Hogar y a Maun), las filas vivas de repartos de los
  -- cobros por la fila, de cualquier tipo, y lo que se le pasó para cubrir el mes. Gemela de loDelMes.
  -- No se guarda en ningún lado salvo en la foto de dist_previo.
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

  -- El saldo de cada tesoro de la fila, como lo cuenta el libro, y su meta: la de Cocos es la de
  -- ajustes. También después del lock: todo movimiento, toda liquidación y toda reversión lo toman,
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
    select t.id, case when t.clave = 'cocos' then v_ajustes.meta_cocos_centavos else t.meta_centavos end as meta
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
    v_plan.porcentajes, v_topes_vistos_de_las_partes
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
      v_plan.porcentajes, v_topes_de_las_partes
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
$$;

comment on function private.liquidar(public.estado_proyecto, uuid, integer, date, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, integer, bigint, bigint, boolean, integer, jsonb, jsonb) is 'Liquida un proyecto hacia cobrado o perdido y congela su distribución con la fecha que manda la app, también al volver a cobrar un reabierto (ADR 0063). Rechaza sin fecha (MN016), con una fecha que todavía no llegó (MN017) y un reparto marcado como ya incluido en la apertura con una fecha que no es anterior a ella (MN018). Bloquea el proyecto y después los ajustes. Reconoce el reenvío, ajustado o no, antes de elegir el camino. Sin p_fila_version y sin fila guardada va por el camino de antes (la cascada, con lo del mes que suma también los repartos vivos); sin p_fila_version y con fila guardada, o al volver a cobrar un reabierto que se cobró por la fila, rechaza con MN025; con p_fila_version reparte por la fila (la de su reapertura, la de siempre armada con su foto, o la de los ajustes; en un reabierto el sueldo va por mes si la foto o el taller van por mes, sueldo_tope_mensual o la fila guardada, y lo mismo por el camino de antes), rechaza con MN006 si la revisión no es esa, calcula el previo de cada paso según su modo (lo del mes, su saldo en libro_mayor o nada) con el piso de su meta y el tope de cada parte que va hasta la meta, congela el diezmo (la obligación del tesoro del diezmo) y las columnas de siempre con columnasDeSiempre, la fila en dist_fila y lo que vio en dist_previo, y escribe una fila de public.repartos por cada otra obligación, por paso, por parte y por el superávit si no es Maun, con los ids que manda la app. En los dos caminos: MN006 si la versión, los totales o el diezmo no son los que vio el cliente, MN008 si la distribución no es la de la base, y si lo que vio la app no es lo de la base, se congela con lo de la base en vez de rechazar (ADR 0016, 0078 y 0079).';

comment on column public.proyectos.reapertura_sueldo_mensual is 'Modo del sueldo del cobro que se reabrió. El próximo cobro lo usa si el taller sigue repartiendo el sueldo por trabajo; si ya lo reparte por mes (sueldo_tope_mensual o su fila guardada), el sueldo va por mes igual y cuenta lo que el mes ya recibió (ADR 0079).';

comment on column public.proyectos.reapertura_fila is 'La fila del cobro por la fila que se reabrió, {version, fila}. Volver a cobrarlo reparte con ella y no con la fila de hoy (ADR 0003), salvo el sueldo: si la foto lo traía por trabajo y el taller ya lo reparte por mes, va por mes (ADR 0079). Una app sin actualizar no puede volver a cobrarlo (MN025). La limpia la liquidación siguiente.';
