import { conLaFormaNueva, esDeLaFormaDeAntes, type Fila } from '@maun/domain';

import { borradorDeLaFila, cambiarElBorrador, empezarElBorrador } from './borrador';
import type { VistaDeLaFila } from './vista';

type LoQueSeEdita = Pick<VistaDeLaFila, 'ajustesId' | 'delTaller' | 'sincronizados'>;

export type PropuestaDeLaFormaNueva = 'propuesta' | 'nada-que-proponer' | 'todavia-no';

export function proponerLaFormaNueva(
  vista: LoQueSeEdita & Pick<VistaDeLaFila, 'sistema'>,
  hoy: string,
): PropuestaDeLaFormaNueva {
  const guardada = vista.delTaller.fila;
  const maun = vista.sistema.maun;
  if (!vista.delTaller.guardada) return 'nada-que-proponer';
  if (!guardada.pasos.some((paso) => esDeLaFormaDeAntes(paso, maun))) return 'nada-que-proponer';
  if (borradorDeLaFila() !== null || !sePuedeEditar(vista) || vista.ajustesId === null) {
    return 'todavia-no';
  }
  empezarElBorrador(vista.ajustesId, vista.delTaller.version, guardada);
  cambiarElBorrador(conLaFormaNueva(guardada, maun, hoy));
  return 'propuesta';
}

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
