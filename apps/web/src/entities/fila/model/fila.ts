import {
  calcularPorLaFila,
  centavos,
  filaDelMes,
  tesorosDeLaFila,
  type AjustesDelReparto,
  type Fila,
  type FilaDelMes,
  type LiquidacionPorLaFila,
  type Money,
  type PasoDelMes,
  type Tesoro,
} from '@maun/domain';

import {
  ajustesDe,
  coberturasDeLaReplica,
  filaDelTaller,
  liquidacionesDelMesDeLaReplica,
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
  return filaDelMes(
    fila,
    liquidacionesDelMesDeLaReplica(replica),
    coberturasDeLaReplica(replica),
    mes,
  );
}

export interface PruebaDeUnCobro {
  monto: Money;
  mesEnCero: boolean;
  hoy: string;
}

export function pruebaDeUnCobro(
  replica: Replica,
  fila: Fila,
  { monto, mesEnCero, hoy }: PruebaDeUnCobro,
): LiquidacionPorLaFila {
  return calcularPorLaFila({
    destino: 'cobrado',
    fecha: hoy,
    cobrado: monto,
    gastos: centavos(0),
    fila,
    ajustes: ajustesDelReparto(replica),
    liquidaciones: mesEnCero ? [] : liquidacionesDelMesDeLaReplica(replica),
    coberturas: mesEnCero ? [] : coberturasDeLaReplica(replica),
  });
}

interface TesoroDelEstante {
  id: string;
  clave: Tesoro | null;
  archivado: boolean;
}

export function estanteDe<T extends TesoroDelEstante>(fila: Fila, tesoros: readonly T[]): T[] {
  const enLaFila = new Set(tesorosDeLaFila(fila));
  return tesoros.filter(
    (tesoro) =>
      !tesoro.archivado &&
      tesoro.clave !== 'diezmo' &&
      tesoro.clave !== 'maun' &&
      !enLaFila.has(tesoro.id),
  );
}

export function faltantesDeGastosFijos(mes: FilaDelMes): PasoDelMes[] {
  return mes.pasos.filter((paso) => paso.clase === 'fijos' && paso.falta > 0);
}
