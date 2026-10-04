import { esTipoDeComprobante, nombreDelComprobante, numeroDelComprobante } from '@maun/domain';

import { mensajes } from '@/shared/idioma';

import type { Comprobante } from './situacion';

export function numeroDe(comprobante: Comprobante): string {
  return comprobante.numero === null
    ? ''
    : numeroDelComprobante(comprobante.punto_de_venta, comprobante.numero);
}

export function nombreDe(comprobante: Comprobante): string {
  if (comprobante.numero === null || !esTipoDeComprobante(comprobante.tipo)) {
    return mensajes().facturacion.facturar.facturaC;
  }
  return nombreDelComprobante(comprobante.tipo, comprobante.punto_de_venta, comprobante.numero);
}
