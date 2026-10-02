import type { Mensajes } from '../es';

export const movimientos = {
  dolares: 'Dollars',
  clases: {
    compraDeDolares: {
      etiqueta: 'Dollar purchase',
      corta: 'Buy',
      ejemplo: "This month's savings",
    },
    ventaDeDolares: {
      etiqueta: 'Dollar sale',
      corta: 'Sell',
      ejemplo: 'To pay the rent',
    },
    ingresoEnDolares: {
      etiqueta: 'Dollar income',
      corta: 'Income',
      ejemplo: 'Dollars I already had',
    },
  },
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
  categorias: {
    Oficial: 'Official',
    MEP: 'MEP',
    Blue: 'Blue',
    Cripto: 'Crypto',
    'Ahorro previo': 'Earlier savings',
    'Cobro suelto': 'One-off payment',
    Regalo: 'Gift',
    Otro: 'Other',
  },
  ayuda: {
    compra: "Swaps pesos for dollars: the money doesn't leave, it just changes currency.",
    venta: "Swaps dollars for pesos: the money doesn't leave, it just changes currency.",
    quedan: (desde, quedaDesde, hacia, quedaHacia) =>
      `${desde} will be at ${quedaDesde}, and ${hacia} at ${quedaHacia}.`,
    quedanConElPrimeroEnNegativo: (desde, quedaDesde, hacia, quedaHacia) =>
      `${desde} will be at ${quedaDesde}, in the red, and ${hacia} at ${quedaHacia}.`,
    ingresoEnDolares:
      'Goes into the dollar bucket you pick, without going through the shop or the tithe.',
    entraA: (tesoro) => `Goes into ${tesoro}, without going through the shop or the tithe.`,
    queda: (tesoro, saldo) => `${tesoro} will be at ${saldo}.`,
    quedaEnNegativo: (tesoro, saldo) => `${tesoro} will be at ${saldo}, in the red.`,
  },
} satisfies Mensajes['movimientos'];
