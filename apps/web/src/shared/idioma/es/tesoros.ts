export const tesoros = {
  moneda: {
    pregunta: '¿En qué moneda?',
    pesos: 'Pesos',
    dolares: 'Dólares',
    nota: 'La moneda no se cambia después. Un tesoro en dólares va al estante: la fila reparte pesos.',
    enPesos: 'En pesos',
    enDolares: 'En dólares',
  },
  laFilaRepartePesos: 'La fila reparte pesos: un tesoro en dólares queda en el estante.',
  equivalenteDeLaCompra: (pesos: string, cotizacion: string, fecha: string) =>
    `≈ ${pesos} a ${cotizacion}, tu última compra (${fecha})`,
  equivalenteDeLaVenta: (pesos: string, cotizacion: string, fecha: string) =>
    `≈ ${pesos} a ${cotizacion}, tu última venta (${fecha})`,
  comprarDolares: 'Comprar dólares',
  venderDolares: 'Vender dólares',
  archivar: {
    conDolaresSinDestino: 'Para archivarlo, vendé los dólares o pasalos a otro tesoro en dólares.',
    debeDolaresSinOrigen:
      'Para archivarlo, comprá los dólares que le faltan o traelos de otro tesoro en dólares.',
  },
} as const;
