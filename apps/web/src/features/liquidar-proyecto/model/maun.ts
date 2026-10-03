import { centavos, centavosEn, MONEDA_DEL_TALLER, type Money } from '@maun/domain';

import { loQueRecibeCadaTesoro, type Despiece, type ValorDelPago } from '@/entities/proyecto';
import {
  idDeLaClave,
  saldosEnLaMonedaDelTaller,
  type EnUnTesoroEnDolares,
  type Replica,
} from '@/shared/api';

export interface MaunDespuesDelCobro {
  maun: string;
  saldo: Money;
}

export function maunDespuesDelCobro(
  replica: Replica,
  despiece: Despiece,
  entraAMaun: number,
): MaunDespuesDelCobro {
  const maun = idDeLaClave(replica, 'maun');
  const hoy = saldosEnLaMonedaDelTaller(replica).get(maun) ?? centavos(0);
  const sale = loQueRecibeCadaTesoro(despiece)
    .filter((tesoro) => tesoro.tesoro !== maun)
    .reduce((suma, tesoro) => suma + tesoro.monto, 0);
  return { maun, saldo: centavos(hoy + entraAMaun - sale) };
}

export function dolaresDelTrabajo(
  enDolares: readonly EnUnTesoroEnDolares[],
  pagoFinal: ValorDelPago | null,
): EnUnTesoroEnDolares[] {
  const juntos = new Map<string, number>(enDolares.map((uno) => [uno.tesoroId, uno.monto]));
  const suyo = pagoFinal?.tesoroId ?? null;
  if (pagoFinal !== null && pagoFinal.moneda !== MONEDA_DEL_TALLER && suyo !== null) {
    juntos.set(suyo, (juntos.get(suyo) ?? 0) + (pagoFinal.monto ?? 0));
  }
  return [...juntos]
    .filter(([, monto]) => monto > 0)
    .map(([tesoroId, monto]) => ({ tesoroId, monto: centavosEn('USD', monto) }));
}
