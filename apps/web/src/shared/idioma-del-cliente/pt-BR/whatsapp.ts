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
  elEstimativo: {
    conNombre: (nombre, trabajo, url) =>
      `Olá, ${nombre}. Aqui está o orçamento estimativo de ${trabajo}: ${url}`,
    sinNombre: (trabajo, url) => `Olá. Aqui está o orçamento estimativo de ${trabajo}: ${url}`,
  },
} satisfies MensajesDelCliente['whatsapp'];
