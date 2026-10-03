export const documento = {
  modificaciones: (cantidad: number) =>
    `${String(cantidad)} ${cantidad === 1 ? 'modificación' : 'modificaciones'}`,
  meses: (cantidad: number) => `${String(cantidad)} ${cantidad === 1 ? 'mes' : 'meses'}`,
  lema: 'Muebles a medida',
  leyendaDeArca: {
    aclarar: false as boolean,
    aclaracion: 'No válido como factura.',
  },
} as const;
