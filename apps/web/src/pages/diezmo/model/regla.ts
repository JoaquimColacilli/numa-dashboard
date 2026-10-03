import type { Fila, ObligacionDeLaFila } from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { formatearPorcentaje } from '@/shared/lib';

export function obligacionDelDiezmo(
  fila: Pick<Fila, 'obligaciones'>,
  diezmo: string,
): ObligacionDeLaFila | null {
  return fila.obligaciones.find((obligacion) => obligacion.tesoro === diezmo) ?? null;
}

export function reglaDelDiezmo(
  obligacion: Pick<ObligacionDeLaFila, 'porcentaje' | 'base'>,
): string {
  return mensajes().paginaDiezmo.regla[obligacion.base](formatearPorcentaje(obligacion.porcentaje));
}

export function todaviaSinDiezmo(obligacion: ObligacionDeLaFila | null): string {
  const textos = mensajes().paginaDiezmo;
  if (obligacion === null) return textos.todaviaSinDiezmoNiRegla;
  return textos.todaviaSinDiezmo[obligacion.base](formatearPorcentaje(obligacion.porcentaje));
}
