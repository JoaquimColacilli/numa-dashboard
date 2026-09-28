import { centavos, type Money } from '@maun/domain';

import { formatearPesos } from '@/shared/lib';

export const ATAJOS_DE_LA_PRUEBA: readonly Money[] = [
  centavos(50_000_000),
  centavos(100_000_000),
  centavos(200_000_000),
];

export const COBRO_DE_EJEMPLO: Money = centavos(200_000_000);

export const LLEGO_A_LA_META = 'llegó a la meta';

export function notaDelPasoEnLaPrueba(paso: {
  tope: Money;
  falta: Money;
  llegaALaMeta?: boolean;
}): string {
  if (paso.llegaALaMeta === true) return LLEGO_A_LA_META;
  if (paso.tope <= 0) return 'ya estaba completo';
  if (paso.falta <= 0) return 'completa el monto';
  return `le faltan ${formatearPesos(paso.falta)}`;
}

export function notaDeLaParteEnLaPrueba(parte: { llegaALaMeta: boolean }): string | null {
  return parte.llegaALaMeta ? LLEGO_A_LA_META : null;
}
