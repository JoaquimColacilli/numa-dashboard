export const registrarMovimiento = {
  cambio: {
    salenDe: 'Salen de',
    entranA: 'Entran a',
    pagaste: 'Pagaste',
    vendiste: 'Vendiste',
    recibiste: 'Recibiste',
    queDolar: 'Qué dólar',
    teQuedoA: (cotizacion: string) => `Te quedó a ${cotizacion} por dólar.`,
    teLoPagaronA: (cotizacion: string) => `Te lo pagaron a ${cotizacion} por dólar.`,
    faltaLoQuePagaste: 'Escribí cuánto pagaste.',
    faltaLoQueVendiste: 'Escribí cuánto vendiste.',
    faltaLoQueRecibiste: 'Escribí cuánto recibiste.',
  },
} as const;
