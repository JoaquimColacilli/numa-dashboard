export const documento = {
  modificaciones: (cantidad: number) =>
    `${String(cantidad)} ${cantidad === 1 ? 'modificación' : 'modificaciones'}`,
  meses: (cantidad: number) => `${String(cantidad)} ${cantidad === 1 ? 'mes' : 'meses'}`,
  senaAcordada: (porcentaje: string, monto: string | null) =>
    monto === null ? `del ${porcentaje} de la opción que elijas` : `del ${porcentaje} (${monto})`,
  lema: 'Muebles a medida',
  leyendaDeArca: {
    aclarar: false as boolean,
    aclaracion: 'No válido como factura.',
  },
} as const;
