export const finanzas = {
  cambio: (sale: string, entra: string, cotizacion: string) =>
    `${sale} → ${entra} · a ${cotizacion}`,
} as const;
