import { ETIQUETAS_DE_IDIOMA } from '@maun/domain';

import type { TextosDelMensajeAlCliente } from '@/shared/lib';

function enLaFrase(trabajo: string): string {
  return trabajo.toLocaleLowerCase(ETIQUETAS_DE_IDIOMA.es);
}

export const whatsapp = {
  comoVa: {
    conNombre: (nombre: string, trabajo: string, url: string) =>
      `Hola ${nombre}, acá podés ver cómo va tu ${enLaFrase(trabajo)}: ${url}`,
    sinNombre: (trabajo: string, url: string) =>
      `Hola, acá podés ver cómo va tu ${enLaFrase(trabajo)}: ${url}`,
  },
  comoVaYComoPagarlo: {
    conNombre: (nombre: string, trabajo: string, url: string) =>
      `Hola ${nombre}, acá podés ver cómo va y cómo pagarlo tu ${enLaFrase(trabajo)}: ${url}`,
    sinNombre: (trabajo: string, url: string) =>
      `Hola, acá podés ver cómo va y cómo pagarlo tu ${enLaFrase(trabajo)}: ${url}`,
  },
} as const satisfies TextosDelMensajeAlCliente;
