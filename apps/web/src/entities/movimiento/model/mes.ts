import {
  asientosDelMes,
  enLaMonedaDelTaller,
  entradasYSalidas,
  sumarTodos,
  type Asiento,
  type Money,
} from '@maun/domain';

export interface ResumenMensual {
  entroHogar: Money;
  gastoHogar: Money;
  facturoTaller: Money;
}

function esUnPaseEntreTesoros(asiento: Asiento): boolean {
  return asiento.origen === 'manual' && asiento.contrapartidaId !== null;
}

export function resumenMensual(asientos: readonly Asiento[], mes: string): ResumenMensual {
  const delMes = asientosDelMes(asientos, mes).filter(
    (asiento) => asiento.concepto !== 'ajuste' && !esUnPaseEntreTesoros(asiento),
  );
  const hogar = entradasYSalidas(delMes, 'hogar');
  return {
    entroHogar: hogar.entro,
    gastoHogar: hogar.salio,
    facturoTaller: sumarTodos(
      delMes.flatMap((asiento) => {
        const enPesos = asiento.origen === 'pago' ? enLaMonedaDelTaller(asiento) : null;
        return enPesos === null ? [] : [enPesos];
      }),
    ),
  };
}
