declare const marcaMoney: unique symbol;
declare const marcaPuntosBasicos: unique symbol;

export const MONEDAS = ['ARS', 'USD'] as const;

export type Moneda = (typeof MONEDAS)[number];

export const MONEDA_DEL_TALLER = 'ARS' satisfies Moneda;

export type MonedaDelTaller = typeof MONEDA_DEL_TALLER;

export type Money<M extends Moneda = MonedaDelTaller> = number & { readonly [marcaMoney]: M };

export type PuntosBasicos = number & { readonly [marcaPuntosBasicos]: 'PuntosBasicos' };

export const BASE_PUNTOS_BASICOS = 10_000;

type EsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never;

type UnaMoneda<M extends Moneda> = true extends EsUnion<M> ? never : M;

function entero(valor: number): number {
  if (!Number.isSafeInteger(valor)) {
    throw new RangeError(`Un importe es un entero de centavos: ${String(valor)} no lo es.`);
  }
  return valor;
}

export function esMoneda(valor: unknown): valor is Moneda {
  return typeof valor === 'string' && (MONEDAS as readonly string[]).includes(valor);
}

export function monedaLeida(valor: unknown): Moneda {
  return esMoneda(valor) ? valor : MONEDA_DEL_TALLER;
}

export function centavos(valor: number): Money {
  return entero(valor) as Money;
}

export function centavosEn<M extends Moneda>(_moneda: M, valor: number): Money<M> {
  return entero(valor) as Money<M>;
}

export const CERO: Money = centavos(0);

export function importeDelTaller(importe: Money<Moneda>): Money {
  return entero(importe) as Money;
}

export function sumar<M extends Moneda>(a: Money<M>, b: Money<NoInfer<M>>): Money<M> {
  return entero(a + b) as Money<M>;
}

export function restar<M extends Moneda>(a: Money<M>, b: Money<NoInfer<M>>): Money<M> {
  return entero(a - b) as Money<M>;
}

export function negar<M extends Moneda>(importe: Money<M>): Money<M> {
  return entero(0 - importe) as Money<M>;
}

export function sumarTodos<M extends Moneda = MonedaDelTaller>(
  importes: Iterable<Money<UnaMoneda<M>>>,
): Money<M> {
  let total = 0;
  for (const importe of importes) total = entero(total + importe);
  return total as Money<M>;
}

export function minimo<M extends Moneda>(a: Money<M>, b: Money<NoInfer<M>>): Money<M> {
  return a <= b ? a : b;
}

export function maximo<M extends Moneda>(a: Money<M>, b: Money<NoInfer<M>>): Money<M> {
  return a >= b ? a : b;
}

export function esNegativo(importe: Money<Moneda>): boolean {
  return importe < 0;
}

export function puntosBasicos(valor: number): PuntosBasicos {
  if (!Number.isInteger(valor) || valor < 0 || valor > BASE_PUNTOS_BASICOS) {
    throw new RangeError(
      `Un porcentaje va en puntos básicos enteros entre 0 y ${String(BASE_PUNTOS_BASICOS)}: ${String(valor)} no lo es.`,
    );
  }
  return valor as PuntosBasicos;
}

export function aplicarPorcentaje<M extends Moneda>(
  importe: Money<M>,
  porcentaje: PuntosBasicos,
): Money<M> {
  if (esNegativo(importe)) {
    throw new RangeError('Un porcentaje se aplica sobre un importe no negativo.');
  }
  const numerador = importe * porcentaje + BASE_PUNTOS_BASICOS / 2;
  if (!Number.isSafeInteger(numerador)) {
    throw new RangeError(
      'El importe es demasiado grande para aplicarle un porcentaje con exactitud.',
    );
  }
  return Math.floor(numerador / BASE_PUNTOS_BASICOS) as Money<M>;
}
