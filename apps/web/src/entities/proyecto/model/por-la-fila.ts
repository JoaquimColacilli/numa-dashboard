import {
  aportesDelReparto,
  calcularPorLaFila,
  columnasDeSiempre,
  repartir,
  sumar,
  type EstadoLiquidado,
  type Fila,
  type LiquidacionPorLaFila,
  type Money,
  type PlanDelReparto,
} from '@maun/domain';

import {
  ajustesDe,
  coberturasDeLaReplica,
  dinero,
  filaParaLiquidar,
  liquidacionesDelMesDeLaReplica,
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
  const { cobrado, gastos } = totalesDelProyecto(replica, proyecto.id);
  const { fila, version } = filaParaLiquidar(replica, proyecto, destino);
  const ajustes = ajustesDe(replica);
  const liquidacion = calcularPorLaFila({
    destino,
    fecha,
    cobrado: sumar(cobrado, pagoExtra),
    gastos,
    fila,
    ajustes: {
      perdidoConSueldo: ajustes?.perdido_con_sueldo ?? false,
      perdidoConDiezmo: ajustes?.perdido_con_diezmo ?? true,
    },
    liquidaciones: liquidacionesDelMesDeLaReplica(replica, proyecto.id),
    coberturas: coberturasDeLaReplica(replica),
  });
  return { liquidacion, fila, version };
}

export function planDelCobro(liquidacion: LiquidacionPorLaFila): PlanDelReparto {
  return {
    diezmoBp: liquidacion.diezmoBp,
    pasos: liquidacion.pasos.map(({ tesoro, clase, objetivo, porMes }) => ({
      tesoro,
      clase,
      objetivo,
      porMes,
    })),
    reparto: liquidacion.reparto.map(({ tesoro, porcentaje }) => ({ tesoro, porcentaje })),
  };
}

export function loDelMesQueVio(liquidacion: LiquidacionPorLaFila): Record<string, number> {
  return Object.fromEntries(liquidacion.pasos.map((paso) => [paso.tesoro, paso.previo]));
}

export function pedidoPorLaFila(
  proyecto: Proyecto,
  { liquidacion, version }: CobroPorLaFila,
  ids: readonly string[],
  yaEnLaApertura = false,
): PedidoDeLiquidacion {
  const columnas = columnasDeSiempre(liquidacion);
  const aportes = aportesDelReparto(liquidacion);
  if (ids.length !== aportes.length) {
    throw new RangeError(
      `El cobro lleva ${String(aportes.length)} repartos y vinieron ${String(ids.length)} ids.`,
    );
  }
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
    porLaFila: {
      version,
      repartos: aportes.map((aporte, indice) => ({
        id: ids[indice] as string,
        posicion: indice + 1,
        tesoro_id: aporte.tesoro,
        monto_centavos: aporte.monto,
      })),
      previo: loDelMesQueVio(liquidacion),
    },
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
    dist_previo: loDelMesQueVio(liquidacion),
    reparto_ya_en_la_apertura: yaEnLaApertura,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fecha_cobro: null,
    reapertura_fila: null,
  };
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
  const comun = {
    household_id: proyecto.household_id,
    proyecto_id: proyecto.id,
    fecha: liquidacion.fecha,
    ya_en_la_apertura: pedido.yaEnLaApertura ?? false,
    created_at: liquidadaEn,
    updated_at: liquidadaEn,
    deleted_at: null,
    version: 1,
  };
  const pasos = liquidacion.pasos.map((paso, indice) => ({
    ...comun,
    id: ids[indice] as string,
    posicion: indice + 1,
    tesoro_id: paso.tesoro,
    nombre: nombres.get(paso.tesoro) ?? '',
    tipo: 'paso',
    clase: paso.clase,
    objetivo_centavos: paso.objetivo,
    previo_centavos: paso.previo,
    tope_centavos: paso.tope,
    por_mes: paso.porMes,
    porcentaje_bp: null,
    monto_centavos: paso.monto,
  }));
  const partes = liquidacion.reparto.map((parte, indice) => ({
    ...comun,
    id: ids[liquidacion.pasos.length + indice] as string,
    posicion: liquidacion.pasos.length + indice + 1,
    tesoro_id: parte.tesoro,
    nombre: nombres.get(parte.tesoro) ?? '',
    tipo: 'parte',
    clase: null,
    objetivo_centavos: null,
    previo_centavos: null,
    tope_centavos: null,
    por_mes: null,
    porcentaje_bp: parte.porcentaje,
    monto_centavos: parte.monto,
  }));
  return [...pasos, ...partes] satisfies FilaDe<'repartos'>[];
}

function previoGuardado(valor: unknown): Map<string, Money> {
  const previo = new Map<string, Money>();
  if (typeof valor !== 'object' || valor === null) return previo;
  for (const [tesoro, monto] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof monto === 'number' && Number.isSafeInteger(monto)) previo.set(tesoro, dinero(monto));
  }
  return previo;
}

export interface DiferenciaDelReparto {
  tesoro: string;
  nombre: string;
  esperado: Money;
  quedo: Money;
  yaLlevabaElMes: Money;
}

export interface AjusteDelReparto {
  diferencias: readonly DiferenciaDelReparto[];
  remanenteEsperado: Money;
  remanenteQuedo: Money;
}

export function ajusteDelReparto(
  fila: FilaDe<'proyectos'>,
  pedido: PedidoDeLiquidacion,
  plan: PlanDelReparto,
  nombres: ReadonlyMap<string, string>,
): AjusteDelReparto | undefined {
  const enviado = pedido.porLaFila;
  if (enviado === undefined || !porLaFila(fila)) return undefined;
  const base = previoGuardado((fila as Partial<FilaDe<'proyectos'>>).dist_previo);
  const cambio = [...base].some(([tesoro, monto]) => (enviado.previo[tesoro] ?? 0) !== monto);
  if (!cambio) return undefined;

  const esperado = repartir({
    ...plan,
    cobrado: dinero(pedido.cobradoCentavos),
    gastos: dinero(pedido.gastosCentavos),
    previo: new Map(
      Object.entries(enviado.previo).map(([tesoro, monto]) => [tesoro, dinero(monto)]),
    ),
  });
  const quedo = repartir({
    ...plan,
    cobrado: dinero(pedido.cobradoCentavos),
    gastos: dinero(pedido.gastosCentavos),
    previo: base,
  });

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
      yaLlevabaElMes: base.get(aporte.tesoro) ?? dinero(0),
    });
  }
  if (diferencias.length === 0) return undefined;

  return {
    diferencias,
    remanenteEsperado: esperado.remanente,
    remanenteQuedo: quedo.remanente,
  };
}
