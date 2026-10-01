import { fechaDelRotulo } from '@/shared/lib';

import type { CasillaDelRotulo } from './plano';

export const SIN_NUMERO_TODAVIA = 'Sin número todavía';

export interface AceptacionDelRotulo {
  el: string | null;
  letra: string | null;
}

export interface DatosDelRotulo {
  numero: string | null;
  revision: number;
  emitido: string | null;
  valeHasta?: string | null;
  vencido?: boolean;
  aceptado?: AceptacionDelRotulo | null;
}

export function casillasDelPresupuesto({
  numero,
  revision,
  emitido,
  valeHasta,
  vencido = false,
  aceptado = null,
}: DatosDelRotulo): CasillaDelRotulo[] {
  const casillas: CasillaDelRotulo[] = [
    { titulo: 'Presupuesto', valor: numero === null ? SIN_NUMERO_TODAVIA : `Nº ${numero}` },
    { titulo: 'Rev.', valor: String(revision) },
  ];
  if (emitido !== null) casillas.push({ titulo: 'Emitido', valor: fechaDelRotulo(emitido) });
  if (aceptado !== null) {
    if (aceptado.letra !== null) casillas.push({ titulo: 'Opción', valor: aceptado.letra });
    if (aceptado.el !== null) {
      casillas.push({ titulo: 'Aceptado', valor: fechaDelRotulo(aceptado.el), tono: 'hecho' });
    }
    return casillas;
  }
  if (valeHasta === undefined) return casillas;
  if (valeHasta === null) {
    casillas.push({ titulo: 'Vale hasta', valor: 'Sin vencimiento' });
  } else if (vencido) {
    casillas.push({ titulo: 'Venció', valor: fechaDelRotulo(valeHasta), tono: 'atencion' });
  } else {
    casillas.push({ titulo: 'Vale hasta', valor: fechaDelRotulo(valeHasta) });
  }
  return casillas;
}
