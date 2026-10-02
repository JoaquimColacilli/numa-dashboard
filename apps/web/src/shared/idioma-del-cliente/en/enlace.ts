import type { MensajesDelCliente } from '../es';

export const enlace = {
  descripcionDeLaVista:
    "See how your furniture is coming along: where it's at, what you've paid, and what's left.",
  descripcionDeLaEncuesta:
    'Tell us how the job went. It only takes a couple of minutes, and the shop owner reads it.',
  encuestaDe: (taller) => `Survey from ${taller}`,
  unaEncuestaDelTaller: 'A survey from the shop',
} satisfies MensajesDelCliente['enlace'];
