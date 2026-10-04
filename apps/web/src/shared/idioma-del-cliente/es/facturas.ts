export const facturas = {
  titulo: 'Tus facturas',
  descargar: 'Descargar',
  compartir: 'Compartir',
  anulada: 'Anulada',
  prueba: 'Prueba',
  anulaA: (numero: string) => `Anula la factura C ${numero}.`,
  preparando: 'Preparando el PDF…',
  listo: 'El PDF está listo.',
  noSePudo: 'No pudimos armar el PDF. Tocá de nuevo para probar otra vez.',
} as const;
