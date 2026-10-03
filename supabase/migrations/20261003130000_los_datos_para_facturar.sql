-- La factura con ARCA (ADR 0085): los datos del taller para facturar, la conexión con ARCA y el DNI del
-- cliente.
--
-- Aditiva. Nueve columnas de ajustes y una de clientes, todas nuevas y con su valor por defecto, así que
-- ninguna fila existente cambia y los checks valen desde el primer día. De ajustes, la app escribe solo
-- las cuatro que son del dueño (el concepto, la categoría, Ingresos Brutos y el inicio de actividades):
-- la conexión (el ambiente, el CUIT, el punto de venta y desde cuándo) y las alertas no tienen grant de
-- escritura, porque deciden a nombre de quién se factura en ARCA. Las escriben las funciones de la
-- migración 20261003130400.


-- La conexión con ARCA y los datos que completa el dueño -------------------------------------------------

alter table public.ajustes
  add column facturacion_ambiente text,
  add column facturacion_cuit text not null default '',
  add column facturacion_punto_de_venta integer,
  add column facturacion_desde date,
  add column facturacion_concepto smallint not null default 1,
  add column facturacion_categoria text,
  add column facturacion_ingresos_brutos text not null default '',
  add column facturacion_inicio_de_actividades date,
  add column facturacion_alertas jsonb not null default '[]'::jsonb;

alter table public.ajustes
  add constraint ajustes_facturacion_ambiente_valido check (
    facturacion_ambiente is null or facturacion_ambiente in ('homologacion', 'produccion')
  ),
  add constraint ajustes_facturacion_cuit_formato check (
    facturacion_cuit = '' or facturacion_cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'
  ),
  add constraint ajustes_facturacion_punto_de_venta_valido check (
    facturacion_punto_de_venta is null or facturacion_punto_de_venta between 1 and 99998
  ),
  -- La conexión va entera o no va: sin ambiente, el CUIT vacío y el punto de venta y la fecha en null.
  add constraint ajustes_facturacion_completa check (
    case
      when facturacion_ambiente is null then
        facturacion_cuit = '' and facturacion_punto_de_venta is null and facturacion_desde is null
      else
        facturacion_cuit <> '' and facturacion_punto_de_venta is not null and facturacion_desde is not null
    end
  ),
  add constraint ajustes_facturacion_concepto_valido check (facturacion_concepto in (1, 2, 3)),
  add constraint ajustes_facturacion_categoria_valida check (
    facturacion_categoria is null
    or facturacion_categoria in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')
  ),
  add constraint ajustes_facturacion_ingresos_brutos_largo check (char_length(facturacion_ingresos_brutos) <= 40),
  add constraint ajustes_facturacion_alertas_es_un_arreglo check (jsonb_typeof(facturacion_alertas) = 'array');

-- Dos talleres no comparten numeración: el punto de venta de un CUIT en un ambiente es de uno solo.
create unique index ajustes_facturacion_un_taller_por_punto_de_venta
  on public.ajustes (facturacion_ambiente, facturacion_cuit, facturacion_punto_de_venta)
  where facturacion_ambiente is not null;

comment on column public.ajustes.facturacion_ambiente is
  'Con qué ambiente de ARCA factura el taller: homologacion (el de prueba, sin efecto fiscal) o produccion, o null si la facturación no está conectada. Sin grant de escritura para la app: lo escribe solo private.conectar_la_facturacion(), desde el script db:facturacion (solo homologación, solo el taller de la cuenta de los e2e) o desde public.facturacion_conectar(), que la función de borde llama recién después de entrar a ARCA con el certificado propio del taller (ADR 0085).';
comment on column public.ajustes.facturacion_cuit is
  'El CUIT con el que el taller factura en ARCA (NN-NNNNNNNN-N), o vacío sin conexión. En producción es el del certificado del taller; en homologación, uno inventado (20-11111111-2): el CUIT del certificado de prueba no se guarda en ningún lado. Lo escribe la misma función que el ambiente.';
comment on column public.ajustes.facturacion_punto_de_venta is
  'El punto de venta de ARCA, de 1 a 99998, exclusivo de NUMA, o null sin conexión. Lo escribe la misma función que el ambiente.';
comment on column public.ajustes.facturacion_desde is
  'Desde cuándo factura con NUMA, o null sin conexión: es el día desde el que cuentan los «Cobros sin facturar» de Finanzas. Lo escribe la misma función que el ambiente.';
comment on column public.ajustes.facturacion_concepto is
  'Qué factura el taller, el concepto de ARCA: 1 productos (el de siempre), 2 servicios o 3 productos y servicios. Lo define el contador y lo elige el dueño en Ajustes: cambia la ventana de fechas que acepta ARCA y los campos de la factura. Cada comprobante lo copia al pedirse.';
comment on column public.ajustes.facturacion_categoria is
  'La categoría del monotributo del taller, de la A a la K, o null si el dueño no la eligió. Solo sirve para mostrar en Finanzas cuánto le falta para el tope: la escala vive en @maun/domain (monotributo.ts).';
comment on column public.ajustes.facturacion_ingresos_brutos is
  'El número de Ingresos Brutos del taller, como lo escribe el dueño, o vacío. Sale en cada factura; sin él no se factura (LO_QUE_FALTA_PARA_FACTURAR).';
comment on column public.ajustes.facturacion_inicio_de_actividades is
  'La fecha de inicio de actividades del taller, o null. Sale en cada factura; sin ella no se factura.';
comment on column public.ajustes.facturacion_alertas is
  'Las alertas de la facturación que muestra Inicio: un arreglo de objetos con su codigo (fuera-de-numa, a-revisar, certificado-por-vencer o sin-acceso) y sus datos. Las escriben la función de borde (el control diario y el login) y public.descartar_la_alerta_de_facturacion(); la app no tiene grant de escritura.';

grant update (
  facturacion_concepto, facturacion_categoria, facturacion_ingresos_brutos, facturacion_inicio_de_actividades
) on public.ajustes to authenticated;


-- El DNI del cliente ----------------------------------------------------------------------------------------

alter table public.clientes
  add column dni text not null default '',
  add constraint clientes_dni_formato check (dni = '' or dni ~ '^[0-9]{7,8}$');

comment on column public.clientes.dni is
  'El DNI del cliente, de 7 u 8 dígitos sin puntos, o vacío. ARCA lo pide para facturarle a un consumidor final un trabajo de $ 10.000.000 o más (RG 5866): es la identificación del consumidor final cuando no da su CUIT (ADR 0085).';

grant insert (dni), update (dni) on public.clientes to authenticated;
