import type { MensajesDelCliente } from '../es';

export const facturas = {
  titulo: 'Your invoices',
  descargar: 'Download',
  compartir: 'Share',
  anulada: 'Voided',
  prueba: 'Test',
  anulaA: (numero) => `Voids Factura C ${numero}.`,
  preparando: 'Preparing the PDF…',
  listo: 'The PDF is ready.',
  noSePudo: "We couldn't create the PDF. Tap again to try once more.",
} satisfies MensajesDelCliente['facturas'];
