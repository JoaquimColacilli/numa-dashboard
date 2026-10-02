import type { Mensajes } from '../es';

export const finanzas = {
  cambio: (sale, entra, cotizacion) => `${sale} → ${entra} · a ${cotizacion}`,
} satisfies Mensajes['finanzas'];
