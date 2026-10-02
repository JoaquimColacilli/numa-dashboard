import {
  centavosEn,
  cotizacionLeida,
  loQueDescuenta,
  MONEDA_DEL_TALLER,
  necesitaCotizacion,
  plata,
  valorEnPesos,
  type Cotizacion,
  type ImporteDeUnPago,
  type Moneda,
  type Money,
  type Plata,
} from '@maun/domain';

import { importeDelPago } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos } from '@/shared/lib';
import { errorDelDolar } from '@/shared/ui';

import type { Pago } from './catalogos';

export type EfectoDelPago =
  | { tipo: 'descuenta'; monto: Plata; cotizacion: Cotizacion }
  | { tipo: 'vale'; monto: Money; cotizacion: Cotizacion };

export function plataDelPago(pago: Pago): Plata {
  const importe = importeDelPago(pago);
  return plata(importe.moneda, importe.monto);
}

export function efectoDelPago(
  importe: ImporteDeUnPago,
  monedaDelTrabajo: Moneda,
): EfectoDelPago | null {
  if (importe.cotizacion === null) return null;
  if (importe.moneda !== monedaDelTrabajo) {
    return {
      tipo: 'descuenta',
      monto: plata(monedaDelTrabajo, loQueDescuenta(importe, monedaDelTrabajo)),
      cotizacion: importe.cotizacion,
    };
  }
  if (importe.moneda === MONEDA_DEL_TALLER) return null;
  return { tipo: 'vale', monto: valorEnPesos(importe), cotizacion: importe.cotizacion };
}

export function loQueHaceElPago(efecto: EfectoDelPago): string {
  const textos = mensajes().proyecto.pago;
  return efecto.tipo === 'descuenta'
    ? textos.descuenta(formatearLaPlata(efecto.monto))
    : textos.vale(formatearPesos(efecto.monto));
}

export function loQueHizoElPago(efecto: EfectoDelPago): string {
  const textos = mensajes().proyecto.pago;
  const dolar = formatearPesos(efecto.cotizacion);
  return efecto.tipo === 'descuenta'
    ? textos.descontoConElDolar(formatearLaPlata(efecto.monto), dolar)
    : textos.valioConElDolar(formatearPesos(efecto.monto), dolar);
}

export interface ValorDelPago {
  moneda: Moneda;
  monto: number | null;
  cotizacion: number | null;
  tesoroId: string | null;
}

export interface TesoroQueRecibeDolares {
  id: string;
  nombre: string;
}

export interface ErroresDelPago {
  cotizacion?: string;
  tesoro?: string;
}

export function importeDelValor(valor: ValorDelPago): ImporteDeUnPago | null {
  if (valor.monto === null) return null;
  const cotizacion = cotizacionLeida(valor.cotizacion);
  return valor.moneda === 'USD'
    ? { moneda: 'USD', monto: centavosEn('USD', valor.monto), cotizacion }
    : { moneda: MONEDA_DEL_TALLER, monto: centavosEn(MONEDA_DEL_TALLER, valor.monto), cotizacion };
}

export function conOtraMoneda(
  valor: ValorDelPago,
  moneda: Moneda,
  tesoros: readonly TesoroQueRecibeDolares[],
): ValorDelPago {
  if (moneda === MONEDA_DEL_TALLER) return { ...valor, moneda, tesoroId: null };
  const unico = tesoros.length === 1 ? (tesoros[0]?.id ?? null) : null;
  return { ...valor, moneda, tesoroId: valor.tesoroId ?? unico };
}

export function ayudaDelDolarDelPago(moneda: Moneda, monedaDelTrabajo: Moneda): string {
  const { ayudaDelDolar } = mensajes().proyecto.pago;
  if (moneda === MONEDA_DEL_TALLER) return ayudaDelDolar.pesosDeUnTrabajoEnDolares;
  return monedaDelTrabajo === MONEDA_DEL_TALLER
    ? ayudaDelDolar.dolaresDeUnTrabajoEnPesos
    : ayudaDelDolar.dolaresDeUnTrabajoEnDolares;
}

export function erroresDelValorDelPago(
  valor: ValorDelPago,
  monedaDelTrabajo: Moneda,
  tesoros: readonly TesoroQueRecibeDolares[],
): ErroresDelPago {
  const errores: ErroresDelPago = {};
  if (necesitaCotizacion(valor.moneda, monedaDelTrabajo)) {
    const error = errorDelDolar(valor.cotizacion);
    if (error !== undefined) errores.cotizacion = error;
  }
  if (valor.moneda !== MONEDA_DEL_TALLER) {
    const vivo = tesoros.some((tesoro) => tesoro.id === valor.tesoroId);
    if (!vivo) errores.tesoro = mensajes().proyecto.pago.elegiElTesoro;
  }
  return errores;
}
