import {
  asientosDelMes,
  enLaMonedaDelTaller,
  entradasYSalidas,
  sumarTodos,
  type Asiento,
  type Money,
} from '@maun/domain';

import { filasDe, importeDelPago, valorEnPesosDelPago, type Replica } from '@/shared/api';

export interface ResumenMensual {
  entroHogar: Money;
  gastoHogar: Money;
  facturoTaller: Money;
}

function esUnPaseEntreTesoros(asiento: Asiento): boolean {
  return asiento.origen === 'manual' && asiento.contrapartidaId !== null;
}

export function valoresEnPesosDeLosPagos(replica: Replica): ReadonlyMap<string, Money> {
  return new Map(
    filasDe(replica, 'pagos').map((pago) => [pago.id, valorEnPesosDelPago(importeDelPago(pago))]),
  );
}

export function resumenMensual(
  asientos: readonly Asiento[],
  mes: string,
  valoresDeLosPagos: ReadonlyMap<string, Money> = new Map(),
): ResumenMensual {
  const delMes = asientosDelMes(asientos, mes).filter(
    (asiento) => asiento.concepto !== 'ajuste' && !esUnPaseEntreTesoros(asiento),
  );
  const hogar = entradasYSalidas(delMes, 'hogar');
  return {
    entroHogar: hogar.entro,
    gastoHogar: hogar.salio,
    facturoTaller: sumarTodos(
      delMes.flatMap((asiento) => {
        if (asiento.origen !== 'pago') return [];
        const enPesos = valoresDeLosPagos.get(asiento.asientoId) ?? enLaMonedaDelTaller(asiento);
        return enPesos === null ? [] : [enPesos];
      }),
    ),
  };
}
