import type { MensajesDelCliente } from '../es';

import { plural } from './plural';

const MIRA_LAS_OPCIONES: readonly string[] = [
  '',
  'Take a look at the option in the quote and let us know.',
  'Look at both options in the quote and let us know which one you prefer.',
  'Look at all three options in the quote and let us know which one you prefer.',
  'Look at all four options in the quote and let us know which one you prefer.',
  'Look at all five options in the quote and let us know which one you prefer.',
  'Look at all six options in the quote and let us know which one you prefer.',
];

const DIAS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const MESES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const vista = {
  delDominio: {
    hitos: {
      estimativo: {
        etiqueta: 'We sent you an estimate',
        futuro: 'We sent you an estimate',
      },
      presupuesto: { etiqueta: 'Quote sent', futuro: "We'll send you the quote" },
      aprobado: {
        etiqueta: 'Approved, deposit received',
        futuro: 'Once you approve it and pay the deposit',
      },
      fabricacion: { etiqueta: 'In production', futuro: "We'll start building it" },
      entregado: { etiqueta: 'Delivered', futuro: 'We deliver and install it' },
      pagado: { etiqueta: 'Paid', futuro: "Once it's paid in full" },
    },
    aprobadoSinLaSena: 'Approved',
    cuandoLoApruebes: 'Once you approve it',
    cuandoDejesLaSena: 'Once you pay the deposit',
    yaEstaPagado: 'Already paid',
    enCurso: {
      estimativo: 'We sent you an estimate',
      presupuesto: "We're putting your quote together",
      aprobado: "We got your deposit and you're in our queue",
      fabricacion: "We're building it",
      entregado: "It's installed in your home",
      pagado: "All set, it's paid in full",
    },
    presupuestoMandado: 'We sent you the quote',
    titularDelAprobado: {
      cubierta: "We got your deposit and you're in our queue",
      falta: "You approved it. Once we get the deposit, you're in our queue",
      'sin-presupuesto': "You approved it and you're in our queue",
    },
    sigue: {
      estimativo: "If we move forward, the next thing you'll see here is the quote.",
      presupuesto: "The next thing you'll see here is the quote.",
      aprobado: "The next thing you'll see here is when we start building it.",
      fabricacion: "The next thing you'll see here is the delivery.",
      entregado: "The next thing you'll see here is the balance payment.",
    },
    titularListo: 'Your furniture is ready',
    listoParaEntregar: 'Ready for delivery',
    sigueListo: {
      'sin-pedido': "Next, we'll agree on a delivery day.",
      'un-dia': 'Next, let us know if that day works for you.',
      'sus-dias': 'Next, send us the days that work for you.',
      mandados: "Next, we'll confirm the day.",
    },
    sigueConLaComprometida: "The next thing you'll see here is the delivery.",
    sigueConElPresupuestoMandado: 'Next, approve it and pay the deposit.',
    sigueConLaSenaCubierta: 'Next, approve it.',
    sigueConElPresupuestoVencido: 'Next, message us to update it.',
    sigueFaltaLaSena: 'Next, pay the deposit.',
    sigueFaltaMedir: {
      estimativo: "If we move forward, next we'll come measure so we can send you the quote.",
      presupuesto: "Next, we'll come measure so we can send you the quote.",
    },
    relevamientoTecnico: 'Site measure',
    queEsElRelevamiento: [
      'The next step is the site measure. We visit to take exact measurements, check the installations, and settle the construction details so we can design your furniture to the millimeter.',
      "After the site measure, we'll send you the 3D design and the final quote.",
    ],
    eventos: {
      estimativo: 'We sent you an estimate',
      relevamiento: 'We took the measurements',
      presupuesto: 'We sent you the quote',
      pago: 'We received your payment',
      pagoQueSalda: "We received your payment and it's paid in full",
      saldoQueSalda: "We received the balance and it's paid in full",
      aprobado: 'You approved the quote',
      inicio: 'We started building it in the shop',
      listo: 'We finished your furniture',
      entregado: 'We delivered and installed it',
    },
    comoPagar: {
      titulo: 'How to pay',
      etiquetaDelImporte: { sena: 'Now, the deposit', saldo: 'Now, the balance' },
      nombre: { sena: 'the deposit', saldo: 'the balance' },
      porTransferenciaOEnEfectivo: 'by bank transfer or in cash',
      porTransferencia: 'by bank transfer',
      enEfectivo: 'in cash',
      pasosParaTransferir:
        'Copy the alias, paste it under Transfer in your bank or wallet app, enter the amount, and confirm.',
      soloEfectivo: {
        sena: 'The deposit is paid in cash, in person. Arrange it with us.',
        saldo: 'The balance is paid in cash, in person. Arrange it with us.',
      },
      tambienEfectivo: {
        sena: 'You can also pay the deposit in cash, in person, by arranging it with us.',
        saldo: 'You can also pay the balance in cash, in person, by arranging it with us.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: "Once you approve it and pay the deposit, we'll set the delivery date.",
      coordinamosLaEntregaAlAprobar: "Once you approve it, we'll set the delivery date.",
      vencio: (fecha) => `This quote expired on ${fecha}. Talk to us to update it.`,
      siLoAprobasAntesDel: (antesDe, listoPara) =>
        `If you approve it before ${antesDe}, we could have it ready by ${listoPara}.`,
      siDejasLaSenaAntesDel: (antesDe, listoPara) =>
        `If you pay the deposit before ${antesDe}, we could have it ready by ${listoPara}.`,
      vamosTomandoLosTrabajos: 'We take on jobs in the order the deposits come in.',
    },
    nota: {
      pendiente: {
        etiqueta: 'Why the number may still change',
        titulo: 'The number may still change',
      },
      hecho: {
        etiqueta: 'Where this number comes from',
        titulo: 'The number is based on the actual measurements',
      },
      yaFuimosAMedir: "We've already taken the measurements.",
      fuimosAMedirEl: (fecha) => `We took the measurements on ${fecha}.`,
      armamosElPresupuesto: 'We used those measurements to put together the final quote.',
      cerrandoElPresupuesto: "We're using those measurements to finalize the quote.",
      resumenYaFuimos: 'Measured',
      medidoEl: (fecha) => `Measured on ${fecha}`,
      faltaMedirDelEstimado: [
        'What we sent you is an estimate, based on what we talked about.',
        'To finalize it, we need to come to your home and take measurements.',
      ],
      sinFechaParaLaVisita: "We don't have a date for the visit yet.",
      quedamosEnIrEl: (fecha) => `We're scheduled to come on ${fecha}.`,
      resumenFaltaMedir: 'Estimated number, measurements pending',
    },
  },
  pantalla: {
    abriendo: 'Loading your furniture',
    sinSenal: {
      titulo: 'No connection',
      texto: "You need to be online to see the job. Try again when you're back online.",
    },
    error: {
      titulo: "We couldn't load the page",
      texto: 'The connection dropped before the data arrived. The link still works.',
      reintentar: 'Try again',
    },
    muerto: {
      enlace: {
        titulo: 'This link no longer works',
        texto:
          "The shop turns off the links it shares when needed. Ask whoever sent it to you for a new one and you'll be able to see everything again.",
      },
      trabajo: {
        titulo: "That job isn't here",
        texto: 'You may have deleted it, or the link points to a job from another shop.',
      },
    },
  },
  comoPagar: {
    oPorMercadoPago:
      'Or pay from Mercado Pago without copying anything: tap the button, enter the amount above, and confirm.',
    pedileLosDatos:
      "To pay by transfer, ask us for the account details: they haven't been added yet.",
    pagarConMercadoPago: 'Pay with Mercado Pago',
    despues: (nombre, comoSePaga) => `Then ${nombre}, ${comoSePaga}.`,
    despuesConElImporte: (nombre, importe, comoSePaga) =>
      `Then ${nombre}: ${importe}, ${comoSePaga}.`,
    vencio: (fecha) => `This quote expired on ${fecha}. Message us to update it before you pay.`,
    copiarElMonto: 'Copy amount',
    alias: 'Alias',
    copiarElAlias: 'Copy alias',
    cbu: 'CBU',
    copiarElCbu: 'Copy CBU',
    cvu: 'CVU',
    copiarElCvu: 'Copy CVU',
    titular: 'Account holder',
    copiarElTitular: 'Copy account holder',
    cuit: "Account holder's CUIT",
    copiarElCuit: 'Copy CUIT',
    fijateQueSeaEsta:
      "Before you confirm, your bank shows whose name the account is in: make sure it's this one.",
  },
  pagina: {
    tuMueble: 'Your furniture',
    enQueAnda: 'Where it stands',
    elCaminoDeTuMueble: 'Your furniture, step by step',
    loQueFuePasando: "What's happened so far",
    loQuePagaste: "What you've paid",
    fotosYPlanos: 'Photos and drawings',
    archivos: (cantidad) => plural(cantidad, { one: '# file', other: '# files' }),
    todaviaNoHayFotos: 'No photos yet',
    acaVanAAparecer:
      'The drawings, renders and photos we share will show up here, from design to delivery.',
    ver: (nombre) => `View ${nombre}`,
    tipos: {
      imagen: 'Image',
      pdf: 'PDF',
      otro: 'File',
    },
    pago: 'Payment',
    finDeLaVista:
      "We put this page together for you, and it updates on its own as your job moves along. If something doesn't match, message us.",
    buenasNoticias: (cuando) => `Good news! We're delivering on ${cuando}.`,
    cifras: {
      presupuesto: 'Quote',
      senaParaArrancar: 'Deposit to get started',
      pagaste: 'You paid',
      vale: 'Price',
    },
    opciones: (cantidad) => plural(cantidad, { one: '# option', other: '# options' }),
    miraLasOpciones: (cantidad) =>
      MIRA_LAS_OPCIONES[cantidad] ??
      'Look at all the options in the quote and let us know which one you prefer.',
    presupuestoVencido: (fecha) => `The quote expired on ${fecha}: message us to update it.`,
    valorDelRelevamiento: (valor) =>
      `The site measure costs ${valor}, and if you decide to go ahead, it counts toward the deposit for the job.`,
    quedaACuenta: "What you've paid goes toward the deposit.",
    teQuedanParaLaSena: (falta) =>
      `What you've paid goes toward the deposit: you still need ${falta} to complete it.`,
    laSenaYaEstaCubierta: "What you've paid already covers the deposit.",
    aCuentaDeLaSena: 'Toward the deposit',
    saldo: {
      faltaElPresupuesto: 'No quote yet',
      estaSaldado: 'Paid in full',
      teFaltaPagar: 'Left to pay',
    },
    datos: {
      titulo: 'Job details',
      direccion: 'Address',
      empezamos: 'We started',
      todaviaNo: 'Not yet',
      sena: 'Deposit',
      total: 'Total',
      aConfirmar: 'To be confirmed',
      senaPagada: (sena) => `${sena} · paid`,
      senaQueFalta: (sena, falta) => `${sena} · you still need ${falta}`,
      totalPagado: (total) => `${total} · paid`,
    },
    entrega: {
      estimada: 'Estimated delivery',
      confirmada: 'Confirmed delivery',
      entregado: 'Delivered',
      entrega: 'Delivery',
      aCoordinar: 'To be arranged',
      fechaEstimada: (fecha) => `Estimated delivery: ${fecha}`,
      entregadoEl: (fecha) => `Delivered on ${fecha}`,
      siNecesitasCambiarElDia: 'If you need to change the day, message us.',
      podemosEntregarlo: 'We can deliver it.',
    },
    paraCuando: 'When it could be ready',
    pagos: {
      sinPagosAprobado:
        "No payments recorded yet. The deposit comes first: as soon as we record it, you'll see it here.",
      losAnotaElTaller: 'Payments show up here when we record them, not the moment you transfer.',
      elPagoSeCoordina: "To pay, message us and we'll arrange it.",
      noQuedaNada: "Thank you. There's nothing left to pay.",
    },
  },
  coordinar: {
    titulo: "Let's set up the delivery",
    teProponemos: "Here's the day we're proposing:",
    meQuedaBien: 'Works for me',
    mandando: 'Sending…',
    noPuedoEseDia: "That day doesn't work",
    marcaLosDias: {
      'un-dia':
        "Mark the days that work for you and whether it's morning, afternoon or both. We deliver Monday through Saturday.",
      'sus-dias':
        "To set up the delivery, mark the days that work for you and whether it's morning, afternoon or both. We deliver Monday through Saturday.",
    },
    llegasteAlMaximo: "You've reached ten days, which is the maximum.",
    tusDias: 'Your days',
    horarioDel: (dia) => `Time of day for ${dia}`,
    franjas: {
      manana: 'Morning',
      tarde: 'Afternoon',
    },
    sacar: (dia) => `Remove ${dia}`,
    sacarEsteDia: 'Remove this day',
    algoQueTengamosQueSaber: 'Anything we should know?',
    porEjemplo:
      "For example, if there's a doorman, what floor it's on, or a time that doesn't work for you. If you don't mark any days, tell us here when works for you.",
    mandarMisDias: 'Send my days',
    volverAlDiaQueTePropusimos: 'Back to the day we proposed',
    dejarlosComoEstaban: 'Keep them as they were',
    cambiarMisDias: 'Change my days',
    quedoConfirmada: 'You told us that day works for you: the delivery is confirmed.',
    losDiasMandados: "You sent us these days. We'll pick one and confirm it on this page.",
    laNotaMandada: "You left us a note. We'll choose the day and confirm it on this page.",
    conFranja: {
      manana: (dia) => `${dia}, in the morning`,
      tarde: (dia) => `${dia}, in the afternoon`,
    },
    conLasDosFranjas: (dia) => `${dia}, in the morning or in the afternoon`,
    listoTusDias: "Done: we got your days. We'll confirm one.",
    listoElDia: 'Done: the delivery day is confirmed.',
    listoTeEsperamos: (cuando) => `Done: see you on ${cuando}.`,
    yaEstabaConfirmada: 'We already confirmed the delivery day: you can see it above.',
    cambioElPedido:
      "While you were choosing, we changed what we asked you for. The page is up to date: take a look at what's new.",
    motivos: {
      forma: "The page sent something we didn't expect. Reload it and try again.",
      propuesta: "That day can't be accepted anymore: we asked for your days. Reload the page.",
      vacia: 'Mark at least one day, or tell us when works for you.',
      demasiados: "That's more than ten days: remove some.",
      repetido: 'The same day came in twice. Reload the page and try again.',
      fuera:
        'One of the days is outside the ones you can choose. Reload the page and choose again.',
      domingo: "We don't deliver on Sundays. Remove that day.",
      franja: 'One of the days is missing morning or afternoon.',
      largo: 'The note is over 500 characters.',
      tope: "You've already replied many times. Message us instead.",
      'sin-senal':
        "Couldn't send: the connection dropped. What you marked is still here; try again when you're back online.",
      'no-se-pudo': "We couldn't send it. Try again in a little while.",
    },
    calendario: {
      iniciales: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      meses: MESES,
      dia: (diaDeLaSemana, dia, mes) =>
        `${DIAS[diaDeLaSemana] ?? ''}, ${MESES[mes] ?? ''} ${String(dia)}`,
    },
  },
  notaDelRelevamiento: {
    entendido: 'Got it',
  },
  vidriera: {
    masTrabajos: 'More of our work',
    enLasRedes: 'Find us on social media',
    fotosDeOtrosTrabajos: 'Photos of our other work',
    foto: (numero, total) => `Photo ${String(numero)} of ${String(total)}`,
    fotosAnteriores: 'Previous photos',
    fotosSiguientes: 'Next photos',
    enInstagram: (usuario) => `${usuario} on Instagram`,
    facebook: 'Our Facebook',
    tiktok: 'Our TikTok',
    compartir: 'Share',
    copiado: 'Copied',
    paraCompartir: 'To share, use this link',
    copiarElEnlace: 'Copy link',
  },
} satisfies MensajesDelCliente['vista'];
