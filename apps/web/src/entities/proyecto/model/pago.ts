import {
  loQueDescuenta,
  MONEDA_DEL_TALLER,
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
