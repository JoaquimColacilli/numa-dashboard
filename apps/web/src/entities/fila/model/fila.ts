import {
  calcularPorLaFila,
  maximo,
  restar,
  filaDelMes,
  tesorosDeLaFila,
  type AjustesDelReparto,
  type Fila,
  type FilaDelMes,
  type LiquidacionPorLaFila,
  type Money,
  type PasoDelMes,
} from '@maun/domain';

import {
  ajustesDe,
  datosDelMesDeLaReplica,
  filaDelTaller,
  sistemaDeLaReplica,
  type Replica,
} from '@/shared/api';

export function ajustesDelReparto(replica: Replica): AjustesDelReparto {
  const ajustes = ajustesDe(replica);
  return {
    perdidoConSueldo: ajustes?.perdido_con_sueldo ?? false,
    perdidoConDiezmo: ajustes?.perdido_con_diezmo ?? true,
  };
}

export function filaDelMesDelTaller(
  replica: Replica,
  mes: string,
  fila: Fila = filaDelTaller(replica).fila,
): FilaDelMes {
  return filaDelMes(fila, sistemaDeLaReplica(replica), datosDelMesDeLaReplica(replica), mes);
}

export interface PruebaDeUnCobro {
  monto: Money;
  cobrado?: Money | null;
  enCero: boolean;
  hoy: string;
}

export interface CobradoYGastos {
  cobrado: Money;
  gastos: Money;
}

export function cobradoYGastosDeLaPrueba(deja: Money, cobrado?: Money | null): CobradoYGastos {
  const total = cobrado === null || cobrado === undefined ? deja : maximo(cobrado, deja);
  return { cobrado: total, gastos: restar(total, deja) };
}

export function pruebaDeUnCobro(
  replica: Replica,
  fila: Fila,
  { monto, cobrado, enCero, hoy }: PruebaDeUnCobro,
): LiquidacionPorLaFila {
  const datos = datosDelMesDeLaReplica(replica);
  return calcularPorLaFila({
    destino: 'cobrado',
    fecha: hoy,
    ...cobradoYGastosDeLaPrueba(monto, cobrado),
    fila,
    sistema: sistemaDeLaReplica(replica),
    ajustes: ajustesDelReparto(replica),
    liquidaciones: enCero ? [] : datos.liquidaciones,
    coberturas: enCero ? [] : datos.coberturas,
    saldos: enCero ? new Map<string, Money>() : datos.saldos,
    metas: datos.metas,
  });
}

interface TesoroDelEstante {
  id: string;
  archivado: boolean;
}

export function estanteDe<T extends TesoroDelEstante>(fila: Fila, tesoros: readonly T[]): T[] {
  const enLaFila = new Set(tesorosDeLaFila(fila));
  return tesoros.filter((tesoro) => !tesoro.archivado && !enLaFila.has(tesoro.id));
}

export function faltantesDeGastosFijos(mes: FilaDelMes): PasoDelMes[] {
  return mes.pasos.filter(
    (paso) => paso.clase === 'fijos' && paso.falta !== null && paso.falta > 0,
  );
}
