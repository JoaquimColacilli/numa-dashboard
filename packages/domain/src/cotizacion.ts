import { centavosEn, MONEDA_DEL_TALLER, type Moneda, type Money } from './money.ts';

declare const marcaCotizacion: unique symbol;

export type Cotizacion = number & { readonly [marcaCotizacion]: 'Cotizacion' };

export const RANGO_DE_LA_COTIZACION = { desde: 100, hasta: 10_000_000 } as const;

export type ImporteDeUnPago = {
  [M in Moneda]: {
    readonly moneda: M;
    readonly monto: Money<M>;
    readonly cotizacion: Cotizacion | null;
  };
}[Moneda];

function dividirHaciaAbajo(numerador: number, divisor: number): number {
  if (!Number.isSafeInteger(numerador)) {
    throw new RangeError('El importe es demasiado grande para convertirlo con exactitud.');
  }
  return (numerador - (numerador % divisor)) / divisor;
}

function exigirNoNegativo(importe: number): void {
  if (importe < 0) throw new RangeError('Se convierte un importe no negativo.');
}

export function esCotizacion(valor: unknown): valor is Cotizacion {
  return (
    typeof valor === 'number' &&
    Number.isSafeInteger(valor) &&
    valor >= RANGO_DE_LA_COTIZACION.desde &&
    valor <= RANGO_DE_LA_COTIZACION.hasta
  );
}

export function cotizacion(valor: number): Cotizacion {
  if (!esCotizacion(valor)) {
    throw new RangeError(
      `Una cotización va de ${String(RANGO_DE_LA_COTIZACION.desde)} a ${String(RANGO_DE_LA_COTIZACION.hasta)} centavos de peso por dólar: ${String(valor)} no.`,
    );
  }
  return valor;
}

export function cotizacionLeida(valor: unknown): Cotizacion | null {
  return esCotizacion(valor) ? valor : null;
}

export function cotizacionDelCambio(pesos: Money, dolares: Money<'USD'>): Cotizacion | null {
  const numerador = 200 * pesos + dolares;
  if (pesos <= 0 || dolares <= 0 || !Number.isSafeInteger(numerador)) return null;
  const derivada = dividirHaciaAbajo(numerador, 2 * dolares);
  return derivada < 1 ? null : (derivada as Cotizacion);
}

export function pesosDeDolares(dolares: Money<'USD'>, valor: Cotizacion): Money {
  exigirNoNegativo(dolares);
  return centavosEn(MONEDA_DEL_TALLER, dividirHaciaAbajo(dolares * valor + 50, 100));
}

export function dolaresDePesos(pesos: Money, valor: Cotizacion): Money<'USD'> {
  exigirNoNegativo(pesos);
  return centavosEn('USD', dividirHaciaAbajo(200 * pesos + valor, 2 * valor));
}

function laCotizacion(pago: ImporteDeUnPago): Cotizacion {
  if (pago.cotizacion === null) {
    throw new RangeError('A un pago en otra moneda que la del trabajo le falta su cotización.');
  }
  return pago.cotizacion;
}

export function necesitaCotizacion(moneda: Moneda, monedaDelTrabajo: Moneda): boolean {
  return moneda !== MONEDA_DEL_TALLER || monedaDelTrabajo !== MONEDA_DEL_TALLER;
}

export function valorEnPesos(pago: ImporteDeUnPago): Money {
  if (pago.moneda === MONEDA_DEL_TALLER) return pago.monto;
  return pesosDeDolares(pago.monto, laCotizacion(pago));
}

export function loQueDescuenta<M extends Moneda>(
  pago: ImporteDeUnPago,
  monedaDelTrabajo: M,
): Money<M> {
  if (pago.moneda === monedaDelTrabajo) return centavosEn(monedaDelTrabajo, pago.monto);
  const convertido =
    pago.moneda === MONEDA_DEL_TALLER
      ? dolaresDePesos(pago.monto, laCotizacion(pago))
      : pesosDeDolares(pago.monto, laCotizacion(pago));
  return centavosEn(monedaDelTrabajo, convertido);
}

export function totalEnPesos(pagos: Iterable<ImporteDeUnPago>): Money {
  let total = 0;
  for (const pago of pagos) total += valorEnPesos(pago);
  return centavosEn(MONEDA_DEL_TALLER, total);
}

export function totalQueDescuenta<M extends Moneda>(
  pagos: Iterable<ImporteDeUnPago>,
  monedaDelTrabajo: M,
): Money<M> {
  let total = 0;
  for (const pago of pagos) total += loQueDescuenta(pago, monedaDelTrabajo);
  return centavosEn(monedaDelTrabajo, total);
}
