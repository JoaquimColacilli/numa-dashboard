import type { Fila, ObligacionDeLaFila } from '@maun/domain';

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
  const cuanto = `El ${formatearPorcentaje(obligacion.porcentaje)}%`;
  return obligacion.base === 'cobrado'
    ? `${cuanto} de lo que cobrás de cada trabajo`
    : `${cuanto} del ingreso de cada trabajo (lo cobrado menos los gastos)`;
}

export function todaviaSinDiezmo(obligacion: ObligacionDeLaFila | null): string {
  const regla =
    obligacion === null
      ? 'Lo que corresponde al diezmo de cada trabajo'
      : reglaDelDiezmo(obligacion);
  return `Todavía no se generó diezmo. ${regla} se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.`;
}
