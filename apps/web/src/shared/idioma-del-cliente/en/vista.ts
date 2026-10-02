import type { MensajesDelCliente } from '../es';

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
    sigueConElPresupuestoVencido: 'Next, message the shop to update it.',
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
        sena: 'The deposit is paid in cash, in person. Arrange it with the shop.',
        saldo: 'The balance is paid in cash, in person. Arrange it with the shop.',
      },
      tambienEfectivo: {
        sena: 'You can also pay the deposit in cash, in person, by arranging it with the shop.',
        saldo: 'You can also pay the balance in cash, in person, by arranging it with the shop.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: "Once you approve it and pay the deposit, we'll set the delivery date.",
      coordinamosLaEntregaAlAprobar: "Once you approve it, we'll set the delivery date.",
      vencio: (fecha) => `This quote expired on ${fecha}. Talk to the shop to update it.`,
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
      "To pay by transfer, ask the shop for its account details: they haven't been added yet.",
  },
} satisfies MensajesDelCliente['vista'];
