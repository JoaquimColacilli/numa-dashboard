-- La factura con ARCA (ADR 0085): lo facturado de verdad no se toca por abajo. Un pago con una factura de
-- producción viva no cambia lo que la factura dice de él, y un trabajo con comprobantes de producción no se
-- borra (MN043).
--
-- Aditiva. Un trigger nuevo en pagos y un create or replace de private.validar_proyecto() con la misma
-- firma, copiada entera desde su cuerpo vigente, que suma la guarda junto al MN001. Hoy no hay ningún
-- comprobante de producción, así que ninguna fila existente queda trabada: cambia lo que se puede hacer
-- desde ahora. Lo de homologación no traba nada.


-- El pago facturado de verdad --------------------------------------------------------------------------------

create function private.cuidar_los_pagos_facturados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- El concepto sí cambia: la factura ya congeló su detalle. Y el reenvío idéntico pasa.
  if (
    new.monto_centavos, new.fecha, new.moneda, new.cotizacion_centavos, new.tesoro_id, new.proyecto_id,
    new.deleted_at
  ) is not distinct from (
    old.monto_centavos, old.fecha, old.moneda, old.cotizacion_centavos, old.tesoro_id, old.proyecto_id,
    old.deleted_at
  ) then
    return new;
  end if;

  if exists (
    select 1
    from public.comprobantes c
    where c.household_id = old.household_id
      and c.pago_id = old.id
      and c.tipo = 'factura_c'
      and c.ambiente = 'produccion'
      and c.deleted_at is null
      and c.estado in ('pedida', 'emitiendo', 'autorizada', 'a_revisar')
  ) then
    raise exception 'Tiene una factura de ARCA: para cambiarlo, anulala primero'
      using errcode = 'MN043',
            detail = 'pago',
            hint = 'Anulá la factura con una nota de crédito y después cambiá el pago.';
  end if;

  return new;
end;
$$;

comment on function private.cuidar_los_pagos_facturados() is
  'Trigger BEFORE UPDATE de pagos: un pago con una factura de producción pedida, en camino, autorizada o a revisar no cambia su importe, su fecha, su moneda, su cotización, su tesoro, su trabajo ni su baja (MN043): ARCA ya tiene, o puede tener, una factura por eso. El concepto sí, porque la factura congeló su detalle, y el reenvío idéntico pasa. Una factura anulada o rechazada no traba, y una de homologación tampoco (ADR 0085).';

revoke all on function private.cuidar_los_pagos_facturados() from public, anon, authenticated;

create trigger cuidar_los_pagos_facturados
  before update on public.pagos
  for each row execute function private.cuidar_los_pagos_facturados();


-- El trabajo facturado de verdad ------------------------------------------------------------------------------

create or replace function private.validar_proyecto()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cliente_borrado timestamptz;
begin
  if tg_op = 'INSERT' then
    -- Upsert que choca contra una fila existente: decide la rama UPDATE, que ve la fila vieja.
    perform 1 from public.proyectos where id = new.id;
    if found then
      return new;
    end if;

    -- Un proyecto no nace liquidado: cobrar y cerrar como perdido son operaciones, no datos.
    if new.estado in ('cobrado', 'perdido') and new.fecha_cobro is null then
      raise exception 'Un proyecto no se crea %: se cobra con cobrar_proyecto y se pierde con cerrar_perdido', new.estado
        using errcode = 'MN007';
    end if;
  elsif private.es_reenvio(to_jsonb(old), to_jsonb(new)) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Lo congelado solo se mueve revirtiendo, y la reversión limpia fecha_cobro. Sin esta guarda,
    -- una edición encolada con el estado viejo rebotaría contra un check con un 23514 genérico.
    if old.estado in ('cobrado', 'perdido') and new.fecha_cobro is not null and new.estado <> old.estado then
      raise exception 'El proyecto está % y su distribución congelada: su estado no cambia editándolo', old.estado
        using errcode = 'MN001',
              hint = case old.estado
                when 'cobrado' then 'Para corregirlo hay que reabrir el proyecto o registrar un ajuste.'
                else 'Un perdido vuelve al seguimiento con reactivar_perdido.'
              end;
    end if;

    -- Borrar un proyecto borra sus pagos y gastos: si está liquidado y movió plata, eso la sacaría
    -- del libro mayor. Un liquidado sin pagos ni gastos (el lead perdido sin seña) sí se borra.
    if old.fecha_cobro is not null and old.deleted_at is null and new.deleted_at is not null and (
      exists (
        select 1 from public.pagos g
        where g.household_id = old.household_id and g.proyecto_id = old.id and g.deleted_at is null
      )
      or exists (
        select 1 from public.gastos g
        where g.household_id = old.household_id and g.proyecto_id = old.id and g.deleted_at is null
      )
    ) then
      raise exception 'Un proyecto % con pagos o gastos no se borra: tiene la distribución congelada', old.estado
        using errcode = 'MN001';
    end if;

    -- Un trabajo con comprobantes de producción no se borra: lo que ARCA autorizó no desaparece con él, y
    -- uno que está en camino puede quedar autorizado. Uno rechazado no traba: ARCA no lo tiene. Los de
    -- homologación se van con el trabajo (ADR 0085).
    if old.deleted_at is null and new.deleted_at is not null and exists (
      select 1 from public.comprobantes c
      where c.household_id = old.household_id
        and c.proyecto_id = old.id
        and c.ambiente = 'produccion'
        and c.estado <> 'rechazada'
    ) then
      raise exception 'Este trabajo tiene facturas de ARCA y no se puede borrar'
        using errcode = 'MN043',
              detail = 'trabajo',
              hint = 'Si no sigue, dalo por perdido.';
    end if;

    -- La baja se lleva los pagos y gastos, y des-borrar no los trae de vuelta: un proyecto
    -- borrado se queda borrado. Evita que una edición vieja encolada lo resucite vacío.
    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'El proyecto está borrado'
        using errcode = 'MN002';
    end if;

    if new.estado is distinct from old.estado then
      if new.estado in ('cobrado', 'perdido') then
        -- Solo private.liquidar llega acá con la distribución congelada: el cliente no tiene grant
        -- sobre fecha_cobro.
        if new.fecha_cobro is null or not private.liquidacion_valida(old.estado, new.estado) then
          raise exception 'Un proyecto no pasa de % a % editando el estado: se cobra con cobrar_proyecto y se pierde con cerrar_perdido', old.estado, new.estado
            using errcode = 'MN007';
        end if;
      elsif old.estado in ('cobrado', 'perdido') then
        -- Solo private.revertir_liquidacion llega acá, porque es la única que limpia fecha_cobro.
        if not private.reversion_valida(old.estado, new.estado) then
          raise exception 'Un proyecto % no vuelve a %', old.estado, new.estado
            using errcode = 'MN007';
        end if;
      elsif not private.transicion_valida(old.estado, new.estado) then
        raise exception 'Un proyecto no pasa de % a %', old.estado, new.estado
          using errcode = 'MN007';
      end if;
    end if;
  end if;

  if new.deleted_at is null and (tg_op = 'INSERT' or new.cliente_id is distinct from old.cliente_id) then
    select c.deleted_at into v_cliente_borrado
    from public.clientes c
    where c.household_id = new.household_id
      and c.id = new.cliente_id
    for share;

    if v_cliente_borrado is not null then
      raise exception 'El cliente está borrado'
        using errcode = 'MN005';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.validar_proyecto() is
  'Guarda de proyectos: un liquidado (cobrado o perdido) no cambia de estado editándolo, y con pagos o gastos no se borra (MN001); un trabajo con comprobantes de producción que no estén rechazados no se borra (MN043, ADR 0085); un borrado no revive (MN002); un proyecto vivo no cuelga de un cliente borrado (MN005); el estado solo sigue transiciones válidas (MN007). Deja pasar el reenvío idéntico de la cola.';
