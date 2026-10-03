import type { MensajesDelCliente } from '../es';

export const ui = {
  hoja: {
    cerrar: 'Close',
    cerrarSinGuardar: 'Close without saving?',
    seVaAPerder: "What you added hasn't been saved yet, and if you close, it'll be lost.",
    seguirEditando: 'Keep editing',
    descartar: 'Discard',
  },
  copiar: {
    copiar: 'Copy',
    copiado: 'Copied',
    seleccionado: 'Selected: press and hold, then choose Copy',
    noSePudo: "Couldn't copy. Select it with your finger and copy it from your phone's menu.",
  },
  rotulo: {
    etiqueta: 'Quote title block',
    presupuesto: 'Quote',
    numero: (numero) => `No. ${numero}`,
    sinNumero: 'No number yet',
    revision: 'Rev.',
    emitido: 'Issued',
    opcion: 'Option',
    aceptado: 'Accepted',
    valeHasta: 'Valid until',
    sinVencimiento: 'No expiration',
    vencio: 'Expired',
  },
  visor: {
    anterior: 'Previous',
    siguiente: 'Next',
    abrirAparte: 'Open in a new tab',
    cuenta: (actual, total) => `${actual} of ${total}`,
  },
} satisfies MensajesDelCliente['ui'];
