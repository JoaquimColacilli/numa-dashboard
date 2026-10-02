import type { Mensajes } from '../es';

export const editarTesoro = {
  moneda: {
    pregunta: 'Which currency?',
    pesos: 'Pesos',
    dolares: 'Dollars',
    nota: "You can't change the currency later. A dollar bucket goes on the shelf: the waterfall only splits pesos.",
    enPesos: 'In pesos',
    enDolares: 'In dollars',
  },
  archivar: {
    conDolaresSinDestino: 'To archive it, sell the dollars or move them to another dollar bucket.',
    debeDolaresSinOrigen:
      "To archive it, buy the dollars it's missing or bring them from another dollar bucket.",
  },
} satisfies Mensajes['editarTesoro'];
