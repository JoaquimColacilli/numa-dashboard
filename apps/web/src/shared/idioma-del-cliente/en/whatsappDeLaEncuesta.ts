import type { MensajesDelCliente } from '../es';

export const whatsappDeLaEncuesta = {
  pedido: (nombre, trabajo, enlace) =>
    nombre === null
      ? `Hi, we've finished your “${trabajo}.” Could you take a minute to tell us how it went? ${enlace}`
      : `Hi ${nombre}, we've finished your “${trabajo}.” Could you take a minute to tell us how it went? ${enlace}`,
  recordatorio: (nombre, trabajo, enlace) =>
    nombre === null
      ? `Hi, I'm writing again in case you missed it: could you tell us how it went with your “${trabajo}”? It only takes a minute. ${enlace}`
      : `Hi ${nombre}, I'm writing again in case you missed it: could you tell us how it went with your “${trabajo}”? It only takes a minute. ${enlace}`,
} satisfies MensajesDelCliente['whatsappDeLaEncuesta'];
