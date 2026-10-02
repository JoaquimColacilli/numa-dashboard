export const movimiento = {
  dolares: 'Dólares',
  clases: {
    compraDeDolares: {
      etiqueta: 'Compra de dólares',
      corta: 'Compra',
      ejemplo: 'El ahorro del mes',
    },
    ventaDeDolares: {
      etiqueta: 'Venta de dólares',
      corta: 'Venta',
      ejemplo: 'Para pagar el alquiler',
    },
    ingresoEnDolares: {
      etiqueta: 'Ingreso en dólares',
      corta: 'Ingreso',
      ejemplo: 'Los que tenía guardados',
    },
  },
  categorias: {
    Oficial: 'Oficial',
    MEP: 'MEP',
    Blue: 'Blue',
    Cripto: 'Cripto',
    'Ahorro previo': 'Ahorro previo',
    'Cobro suelto': 'Cobro suelto',
    Regalo: 'Regalo',
    Otro: 'Otro',
  },
  ayuda: {
    compra: 'Cambia pesos por dólares: la plata no se va, cambia de moneda.',
    venta: 'Cambia dólares por pesos: la plata no se va, cambia de moneda.',
    quedan: (desde: string, quedaDesde: string, hacia: string, quedaHacia: string) =>
      `${desde} queda en ${quedaDesde}, y ${hacia} en ${quedaHacia}.`,
    quedanConElPrimeroEnNegativo: (
      desde: string,
      quedaDesde: string,
      hacia: string,
      quedaHacia: string,
    ) => `${desde} queda en ${quedaDesde}, o sea en negativo, y ${hacia} en ${quedaHacia}.`,
    ingresoEnDolares:
      'Entra al tesoro en dólares que elijas y no pasa por el taller ni por el diezmo.',
    entraA: (tesoro: string) => `Entra a ${tesoro} y no pasa por el taller ni por el diezmo.`,
    queda: (tesoro: string, saldo: string) => `${tesoro} queda en ${saldo}.`,
    quedaEnNegativo: (tesoro: string, saldo: string) =>
      `${tesoro} queda en ${saldo}, o sea en negativo.`,
  },
  cambioEnElLibro: (sale: string, entra: string, cotizacion: string) =>
    `${sale} → ${entra} · a ${cotizacion}`,
  equivalenteDeLaCompra: (pesos: string, cotizacion: string, fecha: string) =>
    `≈ ${pesos} a ${cotizacion}, tu última compra (${fecha})`,
  equivalenteDeLaVenta: (pesos: string, cotizacion: string, fecha: string) =>
    `≈ ${pesos} a ${cotizacion}, tu última venta (${fecha})`,
  comprarDolares: 'Comprar dólares',
  venderDolares: 'Vender dólares',
} as const;
