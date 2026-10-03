import type { MensajesDelCliente } from '../es';

export const whatsapp = {
  comoVa: {
    conNombre: (nombre, trabajo, url) =>
      `Olá, ${nombre}. Aqui você acompanha o andamento de ${trabajo}: ${url}`,
    sinNombre: (trabajo, url) => `Olá. Aqui você acompanha o andamento de ${trabajo}: ${url}`,
  },
  comoVaYComoPagarlo: {
    conNombre: (nombre, trabajo, url) =>
      `Olá, ${nombre}. Aqui você acompanha o andamento de ${trabajo} e vê como pagar: ${url}`,
    sinNombre: (trabajo, url) =>
      `Olá. Aqui você acompanha o andamento de ${trabajo} e vê como pagar: ${url}`,
  },
} satisfies MensajesDelCliente['whatsapp'];
