import type { MensajesDelCliente } from '../es';

export const whatsappDeLaEncuesta = {
  pedido: (nombre, trabajo, enlace) =>
    nombre === null
      ? `Oi, terminamos o projeto “${trabajo}”. Pode nos contar em um minuto como foi? ${enlace}`
      : `Oi ${nombre}, terminamos o projeto “${trabajo}”. Pode nos contar em um minuto como foi? ${enlace}`,
  recordatorio: (nombre, trabajo, enlace) =>
    nombre === null
      ? `Oi, estou escrevendo de novo caso você não tenha visto: pode nos contar como foi o projeto “${trabajo}”? É só um minuto. ${enlace}`
      : `Oi ${nombre}, estou escrevendo de novo caso você não tenha visto: pode nos contar como foi o projeto “${trabajo}”? É só um minuto. ${enlace}`,
} satisfies MensajesDelCliente['whatsappDeLaEncuesta'];
