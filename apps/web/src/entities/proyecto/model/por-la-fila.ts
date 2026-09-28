import {
  aportesDelReparto,
  calcularPorLaFila,
  columnasDeSiempre,
  loVistoEsOtro,
  previoDeLoVisto,
  previoQueVio,
  repartir,
  repartosDelCobro,
  sumar,
  type EstadoLiquidado,
  type Fila,
  type LiquidacionPorLaFila,
  type ModoDePaso,
  type Money,
  type PlanDelReparto,
  type RepartoDelCobro,
} from '@maun/domain';

import {
  dinero,
  entradaDeLaLiquidacion,
  pedidoDeLaFila,
  porLaFila,
  tesorosDeLaReplica,
  totalesDelProyecto,
  type FilaDe,
  type PedidoDeLiquidacion,
  type Replica,
} from '@/shared/api';

import type { Proyecto } from './catalogos';

export interface CobroPorLaFila {
  liquidacion: LiquidacionPorLaFila;
  fila: Fila;
  version: number;
}

export interface OpcionesDelCobro {
  destino?: EstadoLiquidado;
  pagoExtra?: Money;
}

export function cobroPorLaFila(
  replica: Replica,
  proyecto: Proyecto,
  fecha: string,
  { destino = 'cobrado', pagoExtra = dinero(0) }: OpcionesDelCobro = {},
): CobroPorLaFila {
  const { cobrado } = totalesDelProyecto(replica, proyecto.id);
  const { entrada, version } = entradaDeLaLiquidacion(replica, proyecto, {
    destino,
    fecha,
    cobrado: sumar(cobrado, pagoExtra),
  });
  return { liquidacion: calcularPorLaFila(entrada), fila: entrada.fila, version };
}

export function cuantosRepartos(liquidacion: LiquidacionPorLaFila): number {
  return repartosDelCobro(liquidacion).length;
}

export function pedidoPorLaFila(
  proyecto: Proyecto,
  { liquidacion, version }: CobroPorLaFila,
  ids: readonly string[],
  yaEnLaApertura = false,
): PedidoDeLiquidacion {
  const columnas = columnasDeSiempre(liquidacion);
  return {
    proyectoId: proyecto.id,
    version: proyecto.version,
    destino: liquidacion.destino,
    fecha: liquidacion.fecha,
    cobradoCentavos: liquidacion.cobrado,
    gastosCentavos: liquidacion.gastos,
    topeSueldoCentavos: columnas.topeSueldo,
    topeFijosCentavos: columnas.topeFijos,
    diezmoBp: columnas.diezmoBp,
    diezmoCentavos: columnas.diezmo,
    sueldoCentavos: columnas.sueldo,
    fijosCentavos: columnas.fijos,
    remanenteCentavos: columnas.remanente,
    sueldoPrevioCentavos: columnas.sueldoPrevio,
    fijosPrevioCentavos: columnas.fijosPrevio,
    yaEnLaApertura,
    porLaFila: pedidoDeLaFila(liquidacion, version, ids),
  };
}

export function proyectoLiquidadoPorLaFila(
  proyecto: Proyecto,
  { liquidacion, fila, version }: CobroPorLaFila,
  liquidadaEn: string,
  yaEnLaApertura = false,
): Proyecto {
  const columnas = columnasDeSiempre(liquidacion);
  return {
    ...proyecto,
    estado: liquidacion.destino,
    version: proyecto.version + 1,
    updated_at: liquidadaEn,
    fecha_cobro: liquidacion.fecha,
    dist_cobrado_centavos: liquidacion.cobrado,
    dist_gastos_centavos: liquidacion.gastos,
    dist_diezmo_bp: columnas.diezmoBp,
    dist_tope_sueldo_centavos: columnas.topeSueldo,
    dist_tope_fijos_centavos: columnas.topeFijos,
    dist_diezmo_centavos: columnas.diezmo,
    dist_sueldo_centavos: columnas.sueldo,
    dist_fijos_centavos: columnas.fijos,
    dist_remanente_centavos: columnas.remanente,
    dist_objetivo_sueldo_centavos: columnas.objetivoSueldo,
    dist_objetivo_fijos_centavos: columnas.objetivoFijos,
    dist_sueldo_mensual: columnas.sueldoMensual,
    dist_sueldo_previo_centavos: columnas.sueldoPrevio,
    dist_fijos_previo_centavos: columnas.fijosPrevio,
    dist_liquidado_at: liquidadaEn,
    dist_fila_version: version,
    dist_fila: fila as unknown as Proyecto['dist_fila'],
    dist_previo: previoQueVio(liquidacion),
    reparto_ya_en_la_apertura: yaEnLaApertura,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fecha_cobro: null,
    reapertura_fila: null,
  };
}

type ColumnasDelTipo = Pick<
  FilaDe<'repartos'>,
  | 'clase'
  | 'modo'
  | 'base'
  | 'objetivo_centavos'
  | 'previo_centavos'
  | 'tope_centavos'
  | 'por_mes'
  | 'porcentaje_bp'
>;

const SIN_COLUMNAS_DEL_TIPO: ColumnasDelTipo = {
  clase: null,
  modo: null,
  base: null,
  objetivo_centavos: null,
  previo_centavos: null,
  tope_centavos: null,
  por_mes: null,
  porcentaje_bp: null,
};

function columnasDelTipo(reparto: RepartoDelCobro): ColumnasDelTipo {
  switch (reparto.tipo) {
    case 'obligacion':
      return { ...SIN_COLUMNAS_DEL_TIPO, base: reparto.base, porcentaje_bp: reparto.porcentaje };
    case 'paso':
      return {
        ...SIN_COLUMNAS_DEL_TIPO,
        clase: reparto.clase,
        modo: reparto.modo,
        objetivo_centavos: reparto.objetivo,
        previo_centavos: reparto.previo,
        tope_centavos: reparto.tope,
        por_mes: reparto.porMes,
      };
    case 'parte':
      return {
        ...SIN_COLUMNAS_DEL_TIPO,
        tope_centavos: reparto.tope,
        porcentaje_bp: reparto.porcentaje,
      };
    case 'superavit':
      return SIN_COLUMNAS_DEL_TIPO;
  }
}

export function repartosLiquidados(
  replica: Replica,
  proyecto: Proyecto,
  { liquidacion }: CobroPorLaFila,
  pedido: PedidoDeLiquidacion,
  liquidadaEn: string,
): FilaDe<'repartos'>[] {
  const nombres = new Map(tesorosDeLaReplica(replica).map((tesoro) => [tesoro.id, tesoro.nombre]));
  const ids = (pedido.porLaFila?.repartos ?? []).map((reparto) => reparto.id);
  return repartosDelCobro(liquidacion).map(
    (reparto, indice) =>
      ({
        household_id: proyecto.household_id,
        proyecto_id: proyecto.id,
        fecha: liquidacion.fecha,
        ya_en_la_apertura: pedido.yaEnLaApertura ?? false,
        created_at: liquidadaEn,
        updated_at: liquidadaEn,
        deleted_at: null,
        version: 1,
        id: ids[indice] as string,
        posicion: indice + 1,
        tesoro_id: reparto.tesoro,
        nombre: nombres.get(reparto.tesoro) ?? '',
        tipo: reparto.tipo,
        ...columnasDelTipo(reparto),
        monto_centavos: reparto.monto,
      }) satisfies FilaDe<'repartos'>,
  );
}

export interface DiferenciaDelReparto {
  tesoro: string;
  nombre: string;
  esperado: Money;
  quedo: Money;
  yaLlevabaElMes: Money;
  modo: ModoDePaso | null;
}

export interface AjusteDelReparto {
  diferencias: readonly DiferenciaDelReparto[];
  remanenteEsperado: Money;
  remanenteQuedo: Money;
  superavit: string | null;
}

export function ajusteDelReparto(
  fila: FilaDe<'proyectos'>,
  pedido: PedidoDeLiquidacion,
  plan: PlanDelReparto,
  nombres: ReadonlyMap<string, string>,
): AjusteDelReparto | undefined {
  const enviado = pedido.porLaFila;
  if (enviado === undefined || !porLaFila(fila)) return undefined;
  const base = (fila as Partial<FilaDe<'proyectos'>>).dist_previo ?? null;
  if (!loVistoEsOtro(plan, enviado.previo, base)) return undefined;

  const conLoVisto = (visto: unknown) =>
    repartir({
      ...plan,
      ...previoDeLoVisto(plan, visto),
      cobrado: dinero(pedido.cobradoCentavos),
      gastos: dinero(pedido.gastosCentavos),
    });
  const esperado = conLoVisto(enviado.previo);
  const quedo = conLoVisto(base);
  const deLaBase = previoDeLoVisto(plan, base).previo;
  const modos = new Map(plan.pasos.map((paso) => [paso.tesoro, paso.modo]));

  const diferencias: DiferenciaDelReparto[] = [];
  const montosQueQuedaron = new Map(aportesDelReparto(quedo).map((uno) => [uno.tesoro, uno.monto]));
  for (const aporte of aportesDelReparto(esperado)) {
    const monto = montosQueQuedaron.get(aporte.tesoro) ?? dinero(0);
    if (monto === aporte.monto) continue;
    diferencias.push({
      tesoro: aporte.tesoro,
      nombre: nombres.get(aporte.tesoro) ?? '',
      esperado: aporte.monto,
      quedo: monto,
      yaLlevabaElMes: deLaBase.get(aporte.tesoro) ?? dinero(0),
      modo: modos.get(aporte.tesoro) ?? null,
    });
  }
  if (diferencias.length === 0) return undefined;

  return {
    diferencias,
    remanenteEsperado: esperado.remanente,
    remanenteQuedo: quedo.remanente,
    superavit: plan.superavit,
  };
}
