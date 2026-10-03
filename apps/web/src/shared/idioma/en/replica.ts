import type { Mensajes } from '../es';

export const replica = {
  noSeSincronizo: (detalle) => `Couldn't sync. ${detalle}`,
  sinRespuesta: 'The server is taking a while to respond. The app keeps trying on its own.',
} satisfies Mensajes['replica'];
