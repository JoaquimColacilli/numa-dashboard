import type { Mensajes } from '../es';

export const movimientos = {
  dolares: 'Dólares',
  clases: {
    compraDeDolares: {
      etiqueta: 'Compra de dólares',
      corta: 'Compra',
      ejemplo: 'Reserva do mês',
    },
    ventaDeDolares: {
      etiqueta: 'Venda de dólares',
      corta: 'Venda',
      ejemplo: 'Para pagar o aluguel',
    },
    ingresoEnDolares: {
      etiqueta: 'Receita em dólares',
      corta: 'Receita',
      ejemplo: 'Dólares que eu já tinha',
    },
  },
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
  categorias: {
    Oficial: 'Oficial',
    MEP: 'MEP',
    Blue: 'Blue',
    Cripto: 'Cripto',
    'Ahorro previo': 'Reserva anterior',
    'Cobro suelto': 'Recebimento avulso',
    Regalo: 'Presente',
    Otro: 'Outro',
  },
  ayuda: {
    compra: 'Troca pesos por dólares: o dinheiro não sai, só muda de moeda.',
    venta: 'Troca dólares por pesos: o dinheiro não sai, só muda de moeda.',
    quedan: (desde, quedaDesde, hacia, quedaHacia) =>
      `${desde} fica com ${quedaDesde}, e ${hacia} com ${quedaHacia}.`,
    quedanConElPrimeroEnNegativo: (desde, quedaDesde, hacia, quedaHacia) =>
      `${desde} fica com ${quedaDesde}, no vermelho, e ${hacia} com ${quedaHacia}.`,
    ingresoEnDolares:
      'Entra na caixinha em dólares que você escolher, sem passar pela marcenaria nem pelo dízimo.',
    entraA: (tesoro) => `Entra em ${tesoro}, sem passar pela marcenaria nem pelo dízimo.`,
    queda: (tesoro, saldo) => `${tesoro} fica com ${saldo}.`,
    quedaEnNegativo: (tesoro, saldo) => `${tesoro} fica com ${saldo}, no vermelho.`,
  },
} satisfies Mensajes['movimientos'];
