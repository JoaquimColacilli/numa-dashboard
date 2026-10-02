import { fechaConAnio } from '@/shared/lib';

import type { Mensajes } from '../es';

export const verNovedades = {
  titulo: "What's new",
  cerrar: "Close what's new",
  verLasNovedades: "See what's new",
  sinFecha: 'Undated version',
  version: (fecha, vez) =>
    `Version of ${fechaConAnio(fecha, 'en')}${vez > 1 ? ` (${String(vez)})` : ''}`,
} satisfies Mensajes['verNovedades'];
