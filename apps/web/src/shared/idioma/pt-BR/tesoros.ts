import type { Mensajes } from '../es';

export const tesoros = {
  moneda: {
    pregunta: 'Em qual moeda?',
    pesos: 'Pesos',
    dolares: 'Dólares',
    nota: 'Depois não dá para mudar a moeda. Uma caixinha em dólares vai para a estante: a fila só divide pesos.',
    enPesos: 'Em pesos',
    enDolares: 'Em dólares',
  },
  laFilaRepartePesos: 'A fila só divide pesos: uma caixinha em dólares fica na estante.',
  equivalenteDeLaCompra: (pesos, cotizacion, fecha) =>
    `≈ ${pesos} a ${cotizacion}, sua última compra de dólares (${fecha})`,
  equivalenteDeLaVenta: (pesos, cotizacion, fecha) =>
    `≈ ${pesos} a ${cotizacion}, sua última venda de dólares (${fecha})`,
  comprarDolares: 'Comprar dólares',
  venderDolares: 'Vender dólares',
  archivar: {
    conDolaresSinDestino:
      'Para arquivar, venda os dólares ou passe para outra caixinha em dólares.',
    debeDolaresSinOrigen:
      'Para arquivar, compre os dólares que faltam ou traga de outra caixinha em dólares.',
  },
} satisfies Mensajes['tesoros'];
