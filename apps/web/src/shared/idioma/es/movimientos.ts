export const movimientos = {
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
  cambio: {
    salenDe: 'Salen de',
    entranA: 'Entran a',
    pagaste: 'Pagaste',
    vendiste: 'Vendiste',
    recibiste: 'Recibiste',
    queDolar: 'Qué dólar',
    teQuedoA: (cotizacion: string) => `Te quedó a ${cotizacion} por dólar.`,
    teLoPagaronA: (cotizacion: string) => `Te lo pagaron a ${cotizacion} por dólar.`,
    faltaLoQuePagaste: 'Escribí cuánto pagaste.',
    faltaLoQueVendiste: 'Escribí cuánto vendiste.',
    faltaLoQueRecibiste: 'Escribí cuánto recibiste.',
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
} as const;
