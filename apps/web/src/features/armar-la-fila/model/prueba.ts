import { centavos, type Money } from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';

export const ATAJOS_DE_LA_PRUEBA: readonly Money[] = [
  centavos(50_000_000),
  centavos(100_000_000),
  centavos(200_000_000),
];

export const COBRO_DE_EJEMPLO: Money = centavos(200_000_000);

export function llegoALaMeta(): string {
  return mensajes().armarLaFila.prueba.llegoALaMeta;
}

export function notaDelPasoEnLaPrueba(paso: {
  tope: Money;
  falta: Money;
  llegaALaMeta?: boolean;
}): string {
  const textos = mensajes().armarLaFila.prueba;
  if (paso.llegaALaMeta === true) return textos.llegoALaMeta;
  if (paso.tope <= 0) return textos.yaEstabaCompleto;
  if (paso.falta <= 0) return textos.completaElMonto;
  return textos.leFaltan(formatearPesos(paso.falta));
}

export function notaDeLaParteEnLaPrueba(parte: { llegaALaMeta: boolean }): string | null {
  return parte.llegaALaMeta ? llegoALaMeta() : null;
}
