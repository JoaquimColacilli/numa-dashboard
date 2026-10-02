import type { Mensajes } from '../es';

import { plural } from './plural';

export const avanzarLaConsulta = {
  conceptos: {
    senaDeLaVisita: 'Site visit deposit',
    senaAlAprobar: 'Deposit',
  },
  avance: {
    queFalta: 'To do',
    etapa: 'Stage',
  },
  tareas: {
    paraElPresupuesto: 'For the quote',
    hechasDe: (hechas, total) => `${hechas} of ${total}`,
  },
  paso: {
    queDiaFuiste: 'Day you went',
    entregarElPresupuestoAntesDel: 'Send the quote by',
    ayudaDelVencimiento: 'One work week from the visit. Change it if you promised another day.',
    cuantoTePagoLaVisita: 'What they paid for the visit',
    opcional: 'Optional',
    ayudaDelPagoDeLaVisita:
      "If they didn't pay for it, the next step is an estimate. You can still send a quote.",
    anotarElRelevamiento: 'Log the site measure',
    todaviaNo: 'Not yet',
    cuantoPresupuestaste: 'How much you quoted',
    ayudaDelPresupuesto: "If you leave it blank, you'll add it when they approve.",
    marcarComoEnviado: 'Mark as sent',
    cuantoTePago: 'What they paid',
    ayudaDelPago: "If they haven't paid yet and you're quoting anyway, leave it blank.",
    queDiaTePago: 'Day they paid',
    pasarAPresupuestar: 'Start quoting',
    errores: {
      sinDia: 'Enter the day you did the site measure.',
      diaQueNoLlego:
        "That day hasn't come yet. If the visit is later on, change the date with Edit.",
    },
  },
  contacto: {
    titulo: {
      nuevo: 'Add inquiry',
      editar: 'Edit inquiry',
    },
    telefono: 'Phone',
    ayudaDelTelefono: "It's saved on the client: Call and WhatsApp use it.",
    quePide: 'What they want',
    ejemploDeQuePide: 'Closet, kitchen, bookcase…',
    visita: {
      relevada: 'Site measure date',
      agendada: 'Visit',
    },
    ayudaDeLaVisita:
      "If you already went, it moves to quoting; if it's later on, it stays scheduled.",
    horaDeLaVisita: 'Visit time',
    ayudaDeLaHora: 'Optional. With a time, the visit shows up at that hour in the calendar.',
    senaCobrada: 'Deposit received',
    variosPagos: (cantidad) =>
      plural(cantidad, {
        one: "There's # payment: edit it in the job details.",
        other: 'There are # payments: edit them in the job details.',
      }),
    ayudaDeLaSena: "What they left you at the visit. It goes into the shop's cash.",
    diaDeLaSena: 'Deposit date',
    ayudaDelDiaDeLaSena:
      "The visit's date if it already happened, otherwise today. Change it if they paid on another day.",
    yaFuiARelevar: 'I did the site measure',
    ayudaDeYaFui:
      "The visit is crossed out in the calendar. If you didn't go, uncheck it and it's pending again.",
    entregarElPresupuestoAntesDel: 'Send the quote by',
    ayudaDelVencimientoAPresupuestar:
      'It shows in the calendar until you send it. If you change the site measure day, it moves on its own, unless you set it by hand.',
    ayudaDelVencimiento: 'It shows in the calendar until you mark it as sent.',
    valeHasta: 'Quote valid until',
    ayudaDeValeHasta:
      "Your client sees it on their page: if they pay the deposit before that day, it tells them when it could be ready. After that day, it tells them it expired. With no date, it doesn't promise one.",
    notas: 'Notes',
    ejemploDeNotas: 'What they told you on the phone, measurements, how to get there…',
    cancelar: 'Cancel',
    guardar: {
      nuevo: 'Save inquiry',
      editar: 'Save changes',
    },
    errores: {
      cliente: 'Choose a client, or type a name to add a new one.',
      titulo: 'Say what they want, even in a couple of words.',
      largo: (caracteres) =>
        plural(caracteres, {
          one: "It can't be longer than # character.",
          other: "It can't be longer than # characters.",
        }),
      notas: 'The notes are too long.',
    },
  },
  pasaje: {
    volverSinAprobar: 'Back without approving',
    consultas: 'Inquiries',
    activos: 'Active',
    titulo: (trabajo) => `Move “${trabajo}” to Jobs`,
    bajada:
      "They approved it: now the job details go in. What you've already collected isn't added again; it's still the same payment.",
    queOpcionAprobo: 'Which option they approved',
    opcionSinDetalle: 'Option with no details',
    corregirLaOpcion: (Enlace) => (
      <>
        The job's quote is the amount of the option you choose. If they approved a different amount,{' '}
        <Enlace>fix the option</Enlace> before moving it.
      </>
    ),
    presupuestoAprobado: 'Approved quote',
    senaQueCobrasAhora: "Deposit you're collecting now",
    porcentajeDelPresupuesto: (porcentaje) => `${porcentaje}% of the quote`,
    senaCubierta:
      "What you've already collected covers the deposit. Leave it blank if you're not collecting anything else today.",
    senaComoPago:
      "It goes in as a payment on the job, with the day they gave it to you and the payment method from here. If you haven't collected it yet, leave it blank.",
    diaEnQueEntroLaSena: 'Day the deposit came in',
    yaCobradoAntes: 'Already collected',
    cobradoEnTotal: 'Collected in total',
    saldoACobrar: 'Balance due',
    gastosYaCargados: 'Expenses already added',
    formaDePago: 'Payment method',
    fechaDeInicio: 'Start date',
    entregaEstimada: 'Estimated delivery',
    ayudaDeLaEntrega: (dias) =>
      plural(dias, {
        one: 'Calculated as # business day from the start.',
        other: 'Calculated as # business days from the start.',
      }),
    ayudaDeLaEntregaDelPresupuesto: (dias) =>
      plural(dias, {
        one: "Calculated as # business day from the start, the quote's lead time.",
        other: "Calculated as # business days from the start, the quote's lead time.",
      }),
    direccionDeEntrega: 'Delivery address',
    ejemploDeDireccion: 'Street and number, city',
    comprobanteAEmitir: 'Invoice to issue',
    pasarAProyectos: 'Move to Jobs',
    errores: {
      opcion: 'Choose the option they approved.',
      presupuesto: 'Enter the quote they approved, in pesos.',
    },
    acordado: {
      noEstaEnElQueLeMandaste: "That amount isn't in the quote you sent.",
      noEstaEn: (numero) => `That amount isn't in quote ${numero}.`,
      elQueLeMandasteDice: (importe) => `The quote you sent says ${importe}.`,
      dice: (numero, importe) => `Quote ${numero} says ${importe}.`,
      siLoApruebasAsi: (acordado) =>
        `If you approve it like this, their page, the job page, and the PDF will add “Agreed on approval: ${acordado}.”`,
    },
  },
} satisfies Mensajes['avanzarLaConsulta'];
