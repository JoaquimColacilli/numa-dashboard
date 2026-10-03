import { esDeLaMoneda, MONEDA_DEL_TALLER, plata, type Money, type Plata } from '@maun/domain';

import type { TesoroDelTaller } from './tesoros';

export function esDeLaMonedaDelTaller(tesoro: Pick<TesoroDelTaller, 'moneda'>): boolean {
  return tesoro.moneda === MONEDA_DEL_TALLER;
}

export function sumaEnLaMismaMoneda(a: Plata, b: Plata): Plata | null {
  return a.moneda === b.moneda ? plata(a.moneda, a.importe + b.importe) : null;
}

export function metaEnPesos(tesoro: Pick<TesoroDelTaller, 'meta'>): Money | null {
  const { meta } = tesoro;
  return meta !== null && esDeLaMoneda(meta, MONEDA_DEL_TALLER) && meta.importe > 0
    ? meta.importe
    : null;
}

export function saldoEnPesos(tesoro: Pick<TesoroDelTaller, 'saldo'>): Money | null {
  return esDeLaMoneda(tesoro.saldo, MONEDA_DEL_TALLER) ? tesoro.saldo.importe : null;
}

export function enOtraMoneda<T extends Pick<TesoroDelTaller, 'moneda' | 'archivado'>>(
  tesoros: readonly T[],
): T[] {
  return tesoros.filter((tesoro) => !tesoro.archivado && !esDeLaMonedaDelTaller(tesoro));
}
