import { nombreDelComprobante } from '@maun/domain';

import { sinEspaciosFinos } from '../lengua';
import type { FacturaEnPdf, ReceptorEnPdf } from '../tipos';
import { TEXTOS_DE_LA_FACTURA as t } from './textos';

export const IDIOMA_DE_LA_FACTURA = 'es-AR';

const PESOS = new Intl.NumberFormat(IDIOMA_DE_LA_FACTURA, {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function pesosDeLaFactura(centavos: number): string {
  return sinEspaciosFinos(PESOS.format(centavos / 100));
}

export function fechaDeLaFactura(fecha: string): string {
  const [anio = '', mes = '', dia = ''] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

function cuitConGuiones(digitos: string): string {
  return digitos.length === 11
    ? `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`
    : digitos;
}

export function documentoDelReceptorEnPdf(receptor: ReceptorEnPdf): string {
  if (receptor.docTipo === 80) {
    return `${t.documentoDelReceptor[80]} ${cuitConGuiones(receptor.docNro)}`;
  }
  if (receptor.docTipo === 96) return `${t.documentoDelReceptor[96]} ${receptor.docNro}`;
  return t.sinDato;
}

export function tituloDeLaFactura(
  factura: Pick<FacturaEnPdf, 'tipo' | 'puntoDeVenta' | 'numero'>,
): string {
  return nombreDelComprobante(factura.tipo, factura.puntoDeVenta, factura.numero);
}
