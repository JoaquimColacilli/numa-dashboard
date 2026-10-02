export const editarTesoro = {
  moneda: {
    pregunta: '¿En qué moneda?',
    pesos: 'Pesos',
    dolares: 'Dólares',
    nota: 'La moneda no se cambia después. Un tesoro en dólares va al estante: la fila reparte pesos.',
    enPesos: 'En pesos',
    enDolares: 'En dólares',
  },
  archivar: {
    conDolaresSinDestino: 'Para archivarlo, vendé los dólares o pasalos a otro tesoro en dólares.',
    debeDolaresSinOrigen:
      'Para archivarlo, comprá los dólares que le faltan o traelos de otro tesoro en dólares.',
  },
} as const;
