import type { Fila } from '@maun/domain';

import { borradorDeLaFila, cambiarElBorrador, empezarElBorrador } from './borrador';
import type { VistaDeLaFila } from './vista';

type LoQueSeEdita = Pick<VistaDeLaFila, 'ajustesId' | 'delTaller' | 'sincronizados'>;

export function sePuedeEditar(vista: LoQueSeEdita): boolean {
  return vista.ajustesId !== null && vista.sincronizados;
}

export function empezarAEditar(vista: LoQueSeEdita): boolean {
  if (borradorDeLaFila()?.ajustesId === vista.ajustesId) return true;
  if (vista.ajustesId === null || !sePuedeEditar(vista)) return false;
  empezarElBorrador(vista.ajustesId, vista.delTaller.version, vista.delTaller.fila);
  return true;
}

export function editarLaFila(
  vista: LoQueSeEdita,
  cambio: (fila: Fila) => Fila,
  clave: string | null = null,
): void {
  if (!empezarAEditar(vista)) return;
  const actual = borradorDeLaFila();
  if (actual === null) return;
  cambiarElBorrador(cambio(actual.fila), clave);
}
