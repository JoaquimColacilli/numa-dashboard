import {
  centavosEn,
  MONEDA_DEL_TALLER,
  MONEDAS,
  sumar,
  type Moneda,
  type MonedaDelTaller,
  type Money,
} from './money.ts';

export interface PlataEn<M extends Moneda> {
  readonly importe: Money<M>;
  readonly moneda: M;
}

export type Plata = { [M in Moneda]: PlataEn<M> }[Moneda];

export interface TotalDeUnaMoneda {
  total: Plata;
  cuantas: number;
}

export function plataEn<M extends Moneda>(moneda: M, importe: number): PlataEn<M> {
  return { importe: centavosEn(moneda, importe), moneda };
}

export function plata(moneda: Moneda, importe: number): Plata {
  return plataEn(moneda, importe) as Plata;
}

export function enPesos(importe: Money): PlataEn<MonedaDelTaller> {
  return { importe, moneda: MONEDA_DEL_TALLER };
}

export function esDeLaMoneda<M extends Moneda>(una: Plata, moneda: M): una is PlataEn<M> & Plata {
  return una.moneda === moneda;
}

export function deLaMoneda<M extends Moneda>(platas: Iterable<Plata>, moneda: M): PlataEn<M>[] {
  const elegidas: PlataEn<M>[] = [];
  for (const una of platas) if (esDeLaMoneda(una, moneda)) elegidas.push(una);
  return elegidas;
}

export function sumarPlata<M extends Moneda>(a: PlataEn<M>, b: PlataEn<NoInfer<M>>): PlataEn<M> {
  return { importe: sumar(a.importe, b.importe), moneda: a.moneda };
}

export function totalesPorMoneda(platas: Iterable<Plata>): TotalDeUnaMoneda[] {
  const totales = new Map<Moneda, TotalDeUnaMoneda>();
  for (const una of platas) {
    const anterior = totales.get(una.moneda);
    totales.set(una.moneda, {
      total: plata(una.moneda, (anterior?.total.importe ?? 0) + una.importe),
      cuantas: (anterior?.cuantas ?? 0) + 1,
    });
  }
  return MONEDAS.flatMap((moneda) => {
    const total = totales.get(moneda);
    return total === undefined ? [] : [total];
  });
}
