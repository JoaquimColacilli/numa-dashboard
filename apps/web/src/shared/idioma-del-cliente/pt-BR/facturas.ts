import type { MensajesDelCliente } from '../es';

export const facturas = {
  titulo: 'Suas notas fiscais',
  descargar: 'Baixar',
  compartir: 'Compartilhar',
  anulada: 'Anulada',
  prueba: 'Teste',
  anulaA: (numero) => `Anula a Factura C ${numero}.`,
  preparando: 'Preparando o PDF…',
  listo: 'O PDF está pronto.',
  noSePudo: 'Não foi possível gerar o PDF. Toque de novo para tentar outra vez.',
} satisfies MensajesDelCliente['facturas'];
