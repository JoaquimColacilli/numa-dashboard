import { loQueVeElCliente, type Archivo } from '@/entities/archivo';
import type { Enlace } from '@/entities/enlace';
import { enlaceDelCliente, tokenDelEnlace } from '@/shared/lib';

export type ComoSeVeElEnlace =
  | { como: 'sin_enlace' }
  | { como: 'de_baja' }
  | { como: 'activo'; url: string; aRellenar: string | null }
  | { como: 'activo_sin_la_direccion' };

export function comoSeVeElEnlace(
  enlace: Enlace | undefined,
  huboAlguno: boolean,
): ComoSeVeElEnlace {
  if (enlace === undefined) return huboAlguno ? { como: 'de_baja' } : { como: 'sin_enlace' };
  if (enlace.token !== null) {
    return { como: 'activo', url: enlaceDelCliente(enlace.token), aRellenar: null };
  }
  const guardado = tokenDelEnlace(enlace.id);
  if (guardado === undefined) return { como: 'activo_sin_la_direccion' };
  return { como: 'activo', url: enlaceDelCliente(guardado), aRellenar: guardado };
}

// Lo mismo que arma la función de borde para la vista previa. Si divergen, el dueño ve una cosa
// acá y su cliente otra en el chat (ADR 0049).
export function comoSeVeEnWhatsapp(trabajo: string, taller: string): string {
  const limpio = trabajo.trim();
  const delTaller = taller.trim();
  if (limpio === '') return delTaller === '' ? 'MAUN' : delTaller;
  return delTaller === '' ? limpio : `${limpio} · ${delTaller}`;
}

export function cuantosVeElCliente(archivos: readonly Archivo[]): string {
  const { compartidos, total } = loQueVeElCliente(archivos);
  return `${String(compartidos)} de ${String(total)} compartidos`;
}
