import { correrMes, esMes, mesesEntre } from './fechas.ts';
import { centavos, type Money } from './money.ts';

export const MESES_SIN_PUBLICAR = 2;

export interface IndiceDePrecios {
  readonly fuente: string;
  readonly desde: string;
  readonly hasta: string;
  readonly valores: readonly number[];
}

export interface MontoDelMes {
  readonly mes: string;
  readonly monto: Money;
}

export type SentidoDelCambio = 'mas' | 'menos' | 'igual';

export interface CambioReal {
  readonly actual: Money;
  readonly anterior: Money;
  readonly porcentaje: number;
  readonly sentido: SentidoDelCambio;
}

export function valorDelIndice(indice: IndiceDePrecios, mes: string): number | null {
  if (!esMes(mes) || mes < indice.desde || mes > indice.hasta) return null;
  return indice.valores[mesesEntre(indice.desde, mes)] ?? null;
}

export function indiceAlDia(indice: IndiceDePrecios, mesEnCurso: string): boolean {
  return indice.hasta >= correrMes(mesEnCurso, -MESES_SIN_PUBLICAR);
}

export function factorDePesosDeHoy(
  indice: IndiceDePrecios,
  mes: string,
  mesEnCurso: string,
): number | null {
  if (!indiceAlDia(indice, mesEnCurso)) return null;
  const delMes = valorDelIndice(indice, mes);
  const base = valorDelIndice(indice, indice.hasta);
  if (delMes === null || base === null) return null;
  return base / delMes;
}

export function alPeso(centavosConDecimales: number): Money {
  const pesos = Math.round(Math.abs(centavosConDecimales) / 100) * 100;
  return centavos(centavosConDecimales < 0 && pesos !== 0 ? -pesos : pesos);
}

export function aPesosDeHoy(
  monto: Money,
  mes: string,
  indice: IndiceDePrecios,
  mesEnCurso: string,
): Money {
  const factor = factorDePesosDeHoy(indice, mes, mesEnCurso);
  return factor === null ? monto : alPeso(monto * factor);
}

export function totalEnPesosDeHoy(
  montos: readonly MontoDelMes[],
  indice: IndiceDePrecios,
  mesEnCurso: string,
): Money {
  let total = 0;
  for (const { mes, monto } of montos) total += aPesosDeHoy(monto, mes, indice, mesEnCurso);
  return centavos(total);
}

export function porcentajeEntero(parte: number, total: number): number {
  const redondeado = Math.round(Math.abs((parte * 100) / total));
  return parte < 0 !== total < 0 && redondeado !== 0 ? -redondeado : redondeado;
}

export function cambioReal(
  actual: readonly MontoDelMes[],
  anterior: readonly MontoDelMes[],
  indice: IndiceDePrecios,
  mesEnCurso: string,
): CambioReal | null {
  const hoyActual = totalEnPesosDeHoy(actual, indice, mesEnCurso);
  const hoyAnterior = totalEnPesosDeHoy(anterior, indice, mesEnCurso);
  if (hoyAnterior <= 0) return null;
  const porcentaje = Math.abs(porcentajeEntero(hoyActual - hoyAnterior, hoyAnterior));
  return {
    actual: hoyActual,
    anterior: hoyAnterior,
    porcentaje,
    sentido: porcentaje === 0 ? 'igual' : hoyActual > hoyAnterior ? 'mas' : 'menos',
  };
}
