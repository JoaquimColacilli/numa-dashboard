import type { Mensajes } from '../es';

export const registrarMovimiento = {
  cambio: {
    salenDe: 'From',
    entranA: 'To',
    pagaste: 'You paid',
    vendiste: 'You sold',
    recibiste: 'You got',
    queDolar: 'Which rate',
    teQuedoA: (cotizacion) => `You paid ${cotizacion} per dollar.`,
    teLoPagaronA: (cotizacion) => `You got ${cotizacion} per dollar.`,
    faltaLoQuePagaste: 'Enter how much you paid.',
    faltaLoQueVendiste: 'Enter how much you sold.',
    faltaLoQueRecibiste: 'Enter how much you got.',
  },
} satisfies Mensajes['registrarMovimiento'];
