import type { MensajesDelCliente } from '../es';

export const whatsapp = {
  comoVa: {
    conNombre: (nombre, trabajo, url) =>
      `Hi ${nombre}, you can see how ${trabajo} is coming along here: ${url}`,
    sinNombre: (trabajo, url) => `Hi, you can see how ${trabajo} is coming along here: ${url}`,
  },
  comoVaYComoPagarlo: {
    conNombre: (nombre, trabajo, url) =>
      `Hi ${nombre}, you can see how ${trabajo} is coming along and how to pay for it here: ${url}`,
    sinNombre: (trabajo, url) =>
      `Hi, you can see how ${trabajo} is coming along and how to pay for it here: ${url}`,
  },
} satisfies MensajesDelCliente['whatsapp'];
