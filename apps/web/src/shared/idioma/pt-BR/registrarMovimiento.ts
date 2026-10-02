import type { Mensajes } from '../es';

export const registrarMovimiento = {
  cambio: {
    salenDe: 'Saem de',
    entranA: 'Entram em',
    pagaste: 'Você pagou',
    vendiste: 'Você vendeu',
    recibiste: 'Você recebeu',
    queDolar: 'Tipo de dólar',
    teQuedoA: (cotizacion) => `Saiu a ${cotizacion} por dólar.`,
    teLoPagaronA: (cotizacion) => `Você recebeu ${cotizacion} por dólar.`,
    faltaLoQuePagaste: 'Informe quanto você pagou.',
    faltaLoQueVendiste: 'Informe quanto você vendeu.',
    faltaLoQueRecibiste: 'Informe quanto você recebeu.',
  },
} satisfies Mensajes['registrarMovimiento'];
