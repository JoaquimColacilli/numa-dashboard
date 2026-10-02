import type { Mensajes } from '../es';

export const movimiento = {
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
  cambioEnElLibro: (sale, entra, cotizacion) => `${sale} → ${entra} · a ${cotizacion}`,
  equivalenteDeLaCompra: (pesos, cotizacion, fecha) =>
    `≈ ${pesos} a ${cotizacion}, sua última compra de dólares (${fecha})`,
  equivalenteDeLaVenta: (pesos, cotizacion, fecha) =>
    `≈ ${pesos} a ${cotizacion}, sua última venda de dólares (${fecha})`,
  comprarDolares: 'Comprar dólares',
  venderDolares: 'Vender dólares',
} satisfies Mensajes['movimiento'];
