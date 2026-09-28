import { centavos, type Money } from '@maun/domain';

import { formatearPesos } from '@/shared/lib';

export const ATAJOS_DE_LA_PRUEBA: readonly Money[] = [
  centavos(50_000_000),
  centavos(100_000_000),
  centavos(200_000_000),
];

export const COBRO_DE_EJEMPLO: Money = centavos(200_000_000);

export function notaDelPasoEnLaPrueba(paso: { tope: Money; falta: Money }): string {
  if (paso.tope <= 0) return 'ya estaba completo';
  if (paso.falta <= 0) return 'completa el tope';
  return `le faltan ${formatearPesos(paso.falta)}`;
}
