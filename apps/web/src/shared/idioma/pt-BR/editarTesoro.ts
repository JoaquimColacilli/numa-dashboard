import type { Mensajes } from '../es';

export const editarTesoro = {
  moneda: {
    pregunta: 'Em qual moeda?',
    pesos: 'Pesos',
    dolares: 'Dólares',
    nota: 'Depois não dá para mudar a moeda. Uma caixinha em dólares vai para a estante: a fila só divide pesos.',
    enPesos: 'Em pesos',
    enDolares: 'Em dólares',
  },
  archivar: {
    conDolaresSinDestino:
      'Para arquivar, venda os dólares ou passe para outra caixinha em dólares.',
    debeDolaresSinOrigen:
      'Para arquivar, compre os dólares que faltam ou traga de outra caixinha em dólares.',
  },
} satisfies Mensajes['editarTesoro'];
