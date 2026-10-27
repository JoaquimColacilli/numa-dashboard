import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const presupuesto = {
  titulo: 'Quote',
  tituloDelEstimativo: 'Estimate',
  esUnNumeroEstimado: "It's an estimate: the final quote comes after the site measure.",
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
    entrega: 'Estimated delivery',
    senaAntesDel: 'Deposit by',
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
  aprobar: {
    aprobarEstaOpcion: 'Approve this option',
    aprobar: 'Approve',
    tituloDeLaOpcion: (letra) => `Approve option ${letra}`,
    tituloDelPresupuesto: 'Approve the quote',
    tituloDelEstimativo: 'Approve the estimate',
    loQueAprobas: "What you're approving",
    queDia: 'What day works for us to come measure?',
    queHorario: 'What time of day?',
    franjas: {
      manana: 'Morning',
      tarde: 'Afternoon',
      me_da_igual: "Doesn't matter",
    },
    algoQueTengamosQueSaber: 'Anything we should know',
    opcional: '(optional)',
    loLee: (taller) => `What you write here is read by ${taller} to set up the visit.`,
    contador: (usados, maximo) => `${String(usados)} of ${String(maximo)}`,
    cancelar: 'Cancel',
    mandando: 'Sending…',
    aprobasteLaOpcion: (letra, fecha) => `You approved option ${letra} on ${fecha}.`,
    loAprobaste: (fecha) => `You approved it on ${fecha}.`,
    propusiste: {
      manana: (dia, taller) =>
        `You suggested ${dia}, in the morning, for the site measure. ${taller} will message you to confirm.`,
      tarde: (dia, taller) =>
        `You suggested ${dia}, in the afternoon, for the site measure. ${taller} will message you to confirm.`,
      me_da_igual: (dia, taller) =>
        `You suggested ${dia} for the site measure. ${taller} will message you to confirm.`,
    },
    laSenaVaAntesDel: (fecha) => `To confirm the dates, the deposit is due by ${fecha}.`,
    comoPagar: 'How to pay',
    estoLeAvisa: 'This lets the shop know what you chose. The quote is confirmed with the deposit.',
    estoLeAvisaDelEstimativo: 'This lets the shop know what you chose.',
    teEquivocaste: (taller) => `Made a mistake? Message ${taller}`,
    motivos: {
      forma: "The page sent something we didn't expect. Reload it and try again.",
      opcion: "That option isn't on the quote anymore. Reload the page.",
      dia: 'Pick the day that works for us to come measure.',
      fuera: "That day can't be picked anymore. Pick another one.",
      franja: "Pick morning, afternoon or doesn't matter.",
      largo: 'What you wrote is over 300 characters.',
      revision: 'The shop sent you a new revision. Reload the page to see it.',
      respondida: 'This quote already has your answer. Reload the page.',
      'sin-senal':
        "Couldn't send it: the connection dropped. What you picked is still here; try again when you're back online.",
      'no-se-pudo': "We couldn't send it. Try again in a bit.",
    },
  },
  mensajeAlTaller: {
    numero: (numero) => `Hi, I'm writing about quote No. ${numero}.`,
    conRevision: (numero, revision) =>
      `Hi, I'm writing about quote No. ${numero} Rev. ${String(revision)}.`,
  },
} satisfies MensajesDelCliente['presupuesto'];
