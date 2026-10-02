import type { Mensajes } from '../es';

export const finanzas = {
  cambio: (sale, entra, cotizacion) => `${sale} → ${entra} · at ${cotizacion}`,
} satisfies Mensajes['finanzas'];
