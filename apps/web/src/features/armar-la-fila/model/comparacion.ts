import { CERO, sumar, type LiquidacionPorLaFila, type Money } from '@maun/domain';

export interface TesorosDelSistemaEnLaFila {
  maun: string;
  diezmo: string;
}

export function aportesPorTesoro(
  liquidacion: LiquidacionPorLaFila,
  sistema: TesorosDelSistemaEnLaFila,
): Map<string, Money> {
  const aportes = new Map<string, Money>();
  const sumarAl = (tesoro: string, monto: Money) => {
    aportes.set(tesoro, sumar(aportes.get(tesoro) ?? CERO, monto));
  };
  for (const obligacion of liquidacion.obligaciones) sumarAl(obligacion.tesoro, obligacion.monto);
  for (const paso of liquidacion.pasos) sumarAl(paso.tesoro, paso.monto);
  for (const parte of liquidacion.reparto) sumarAl(parte.tesoro, parte.monto);
  sumarAl(liquidacion.superavit ?? sistema.maun, liquidacion.remanente);
  return aportes;
}

export interface RenglonDeLaComparacion {
  tesoro: string;
  hoy: Money;
  conLosCambios: Money;
}

export function comparacionDeLaFila(
  hoy: LiquidacionPorLaFila,
  conLosCambios: LiquidacionPorLaFila,
  sistema: TesorosDelSistemaEnLaFila,
  orden: readonly string[],
): RenglonDeLaComparacion[] {
  const antes = aportesPorTesoro(hoy, sistema);
  const despues = aportesPorTesoro(conLosCambios, sistema);
  const tesoros = [...new Set([...orden, ...antes.keys(), ...despues.keys()])];
  return tesoros
    .map((tesoro) => ({
      tesoro,
      hoy: antes.get(tesoro) ?? CERO,
      conLosCambios: despues.get(tesoro) ?? CERO,
    }))
    .filter((renglon) => renglon.hoy !== renglon.conLosCambios);
}
