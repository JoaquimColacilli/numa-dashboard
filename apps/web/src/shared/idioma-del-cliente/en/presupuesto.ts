import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const presupuesto = {
  titulo: 'Quote',
  elQueAceptaste: 'The quote you accepted',
  borrador: 'Draft',
  verElDetalle: 'See the details',
  vencido: {
    cuando: (fecha) => `Expired on ${fecha}.`,
    queHacer: 'Message the shop to update it.',
  },
  queCambio: (revision) => `What changed in revision ${String(revision)}`,
  secciones: {
    detalle: 'Details',
    herrajes: 'Hardware',
    aTenerEnCuenta: 'Good to know',
    incluye: "What's included",
    valores: 'Prices',
    avisos: 'Notices',
    condiciones: 'Conditions',
    garantia: 'Warranty',
  },
  valores: {
    total: 'Total',
    opcion: (letra) => `Option ${letra}`,
    sena: (porcentaje) => `Deposit (${porcentaje}%)`,
    acordado: (monto) => `Agreed on approval: ${monto}`,
    yaPagaste: "You've paid",
    teFaltaParaLaSena: 'Still needed for the deposit',
    laSenaEstaCubierta: 'The deposit is covered',
    despuesElSaldo: 'Then, the balance',
    elegiLaOpcion: 'Choose the option you prefer and let the shop know.',
    referencia: (pesos, dolar, fecha) =>
      `That's ${pesos} at ${dolar} per dollar, the rate for payments made on ${fecha}.`,
    referenciaConLaSena: (pesos, sena, dolar, fecha) =>
      `That's ${pesos}, and the deposit ${sena}, at ${dolar} per dollar, the rate for payments made on ${fecha}.`,
  },
  definiciones: {
    formaDePago: 'Payment terms',
    moneda: 'Currency',
    plazo: 'Lead time',
    validez: 'Validity',
  },
  diasHabiles: (dias) => plural(dias, { one: '# business day', other: '# business days' }),
  validez: {
    vencio: (fecha) => `Expired on ${fecha}`,
    sinVencimiento: 'No expiration',
    hasta: (fecha) => `Until ${fecha}`,
  },
  meses: (meses) => plural(meses, { one: '# month', other: '# months' }),
  acciones: {
    descargar: 'Download PDF',
    compartir: 'Share',
    compartirElPdf: 'Share PDF',
    escribirle: 'Message the shop',
    comoDejarLaSena: 'How to pay the deposit',
  },
  pdf: {
    preparando: 'Preparing the PDF…',
    listo: 'The PDF is ready.',
    noSePudo: "We couldn't create the PDF. Tap again to try once more.",
  },
  mensajeAlTaller: {
    numero: (numero) => `Hi, I'm writing about quote No. ${numero}.`,
    conRevision: (numero, revision) =>
      `Hi, I'm writing about quote No. ${numero} Rev. ${String(revision)}.`,
  },
} satisfies MensajesDelCliente['presupuesto'];
