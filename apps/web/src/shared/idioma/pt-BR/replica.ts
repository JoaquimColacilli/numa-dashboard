import type { Mensajes } from '../es';

export const replica = {
  noSeSincronizo: (detalle) => `Não foi possível sincronizar. ${detalle}`,
  sinRespuesta: 'O servidor está demorando para responder. O app continua tentando sozinho.',
} satisfies Mensajes['replica'];
