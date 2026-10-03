import type { Mensajes } from '../es';

export const liquidarProyecto = {
  pantalla: {
    cobrado: {
      titulo: (trabajo) => `Collect “${trabajo}”`,
      verbo: 'Collect and split',
      verboConMonto: (monto) => `Collect and split ${monto}`,
      volver: 'Back without collecting',
      dia: 'Collection date',
      ayudaDelDia: (mes, anio) =>
        `The day the last of the money came in. The waterfall caps count toward ${mes} ${anio}.`,
      siTeEquivocaste:
        'If you made a mistake, you can reopen it from the job page and the split is undone.',
    },
    perdido: {
      titulo: (trabajo) => `Mark “${trabajo}” as lost`,
      verbo: 'Mark as lost and settle the deposit',
      verboConMonto: (monto) => `Mark as lost and settle ${monto}`,
      volver: 'Back without closing it',
      dia: 'Closing date',
      ayudaDelDia: (mes, anio) =>
        `The day the deposit becomes the shop's. The split counts toward ${mes} ${anio}.`,
      siTeEquivocaste:
        'If you made a mistake, you can reactivate it from the job page and the split is undone.',
    },
    trio: {
      presupuesto: 'Quote',
      cobrado: 'Collected',
      saldo: 'Balance',
      sinSaldo: 'No balance',
    },
    pagoFinal: 'Final payment',
    registrarElPagoFinalDe: (monto) => `Log the final payment of ${monto}`,
    ayudaDelPagoFinal:
      "It's added as one more payment on the job and goes into the math below. If the client still owes you, uncheck it and collect what came in.",
    concepto: 'Description',
    monto: 'Amount',
    fechaDelPago: 'Payment date',
    maunEnNegativo: (maun, saldo, tesoros) =>
      `After this, ${maun} will be at ${saldo}: part of what you collected is in ${tesoros}.`,
    entreComillas: (nombre) => `“${nombre}”`,
    venderDolares: 'Sell dollars',
    montoATesoro: (monto, tesoro) => `${tesoro} gets ${monto}`,
    vanACadaTesoro: (lista) => `${lista}.`,
    seReparteElIngreso: (monto) =>
      `This job's income gets split: ${monto} (what you collected minus expenses).`,
    quedaEnElLibro:
      "It's recorded in the ledger with its date, but it doesn't move the buckets: it was already in your balances.",
    seMuevenLosSaldos: 'Your bucket balances move with this.',
    noHayIngreso:
      "There's no income to split: no bucket moves, and the loss is recorded in the shop's cash.",
    trayendoLosTesoros:
      "Loading the shop's buckets. The split can't go through without them: the button turns on as soon as they arrive.",
    sena: {
      queLePasa: 'What happens to the deposit',
      titulo: "This moves money, even though the quote didn't go through",
      retenida: (monto) =>
        `The ${monto} deposit you're keeping stops being an advance and becomes shop income.`,
      diezmo: (monto) => `The tithe comes out of it: ${monto}.`,
      sinDiezmo: "This deposit doesn't pay tithe, based on your shop settings.",
      otrasObligaciones: (lista) => `The other obligations still come out: ${lista}.`,
      conSueldo: "It also covers owner's pay, based on your shop settings.",
      sinSueldo: "It doesn't cover owner's pay: a quote that didn't go through isn't a job.",
      loQueSobraQuedaEnElTaller:
        "The rest goes down the waterfall like any payment, and what's left stays in the shop.",
      loQueSobraVaA: (tesoro) =>
        `The rest goes down the waterfall like any payment, and what's left goes to ${tesoro}.`,
      sinSenaRetenida: "There's no deposit kept, so no money moves out of the buckets.",
      gastosComoPerdida: (monto) =>
        `The ${monto} in expenses you added stays as a loss for the shop.`,
      sePuedeDeshacer:
        'It can be undone: reactivating the quote sends it back to inquiries and the money comes back out of the buckets.',
    },
  },
  reversion: {
    cobro: {
      abrir: 'Reopen the payment',
      pregunta: 'Reopen the payment?',
      confirmar: 'Reopen and undo the split',
    },
    presupuesto: {
      abrir: 'Reactivate the quote',
      pregunta: 'Reactivate the quote?',
      confirmar: 'Reactivate and undo the split',
    },
    yaEnLaApertura:
      "This split was already in your balances when you started using the app, so undoing it doesn't move money in the buckets. Payments and expenses can be edited again.",
    seDeshaceElReparto: "The split is undone. This goes back from each bucket to the shop's cash:",
    loQueVuelve: "What goes back to the shop's cash",
    elMesDe: (fecha) =>
      `This settlement stops counting toward the month of ${fecha}, and whatever the waterfall caps are still missing shows up.`,
    sinTesoros:
      "This split didn't move any bucket, so undoing it doesn't move money either. Payments and expenses can be edited again.",
    vuelveAEntregado: (Negrita, fecha) => (
      <>
        It goes back to <Negrita>Delivered</Negrita>. When you collect it again, this payment's date
        ({fecha}) comes filled in and you can change it. It's collected again with this payment's
        waterfall: fixing an expense doesn't rewrite the caps or the split with today's waterfall.
      </>
    ),
    vuelveAEntregadoSinFecha: (Negrita) => (
      <>
        It goes back to <Negrita>Delivered</Negrita>. When you collect it again, this payment's date
        comes filled in and you can change it. It's collected again with this payment's waterfall:
        fixing an expense doesn't rewrite the caps or the split with today's waterfall.
      </>
    ),
    loQueSiMira:
      "What it does take into account is what your owner's pay already got that month, like a new payment.",
    vuelveALasConsultas: 'Goes back to inquiries, at the stage',
    noGuardaLaFecha: (Negrita) => (
      <>
        Unlike reopening a payment, this <Negrita>doesn't keep the date</Negrita>: a quote that
        comes back is alive again, and if you later mark it as lost again, it's a new closing, with
        the day you choose and that moment's waterfall.
      </>
    ),
    dejarloComoEsta: 'Leave it as is',
  },
} satisfies Mensajes['liquidarProyecto'];
