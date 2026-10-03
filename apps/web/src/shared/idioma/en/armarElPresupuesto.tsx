import type { Mensajes } from '../es';
import { plural } from './plural';

export const armarElPresupuesto = {
  titulo: 'Quote',
  cerrar: 'Close',
  pestanas: {
    queMirar: 'What to view',
    armarlo: 'Build it',
    comoLoVe: 'See what your client sees',
  },
  guardado: {
    seGuardaSolo: 'Saves on its own as you build it',
    hoy: 'Saved today',
    el: (fecha) => `Saved on ${fecha}`,
  },
  asiLoVeria:
    "This is what your client would see if you sent it today. Their page doesn't change until you send it.",
  verElPdf: 'View PDF',
  pdf: 'PDF',
  mandarElPresupuesto: 'Send quote',
  mandarLaRevision: (revision) => `Send revision ${String(revision)}`,
  seNumeraCuandoVuelvaLaSenal: "It gets its number when you're back online.",
  opcion: (letra) => `Option ${letra}`,
  encabezado: {
    titulo: 'Header',
    bajada:
      'The number, the date and your client fill in on their own. The title and the job site go at the very top.',
    numero: 'Number',
    seAsignaAlMandarlo: 'Assigned when you send it',
    numeroYProxima: (numero, revision) => `No. ${numero} · next: Rev. ${String(revision)}`,
    llevaElDia: (ejemplo) => `It'll carry the date you send it, like ${ejemplo}.`,
    elNumeroNoCambia: "The number doesn't change: each time you send it, the revision goes up.",
    cliente: 'Client',
    sinCliente: 'No client',
    saleDeSuFicha: "From the client's profile.",
    tituloDelTrabajo: 'Title',
    ejemploDelTitulo: 'Kitchen, bedroom closet…',
    obra: 'Job site',
    ejemploDeLaObra: 'Street and number, neighborhood',
    plazo: 'Lead time',
    diasHabiles: 'business days',
    ayudaDelPlazo:
      'Counted from when the deposit clears. The lead-time notice and the estimated delivery use it.',
  },
  validez: {
    titulo: 'Valid for',
    dias: (dias) => plural(dias, { one: '# day', other: '# days' }),
    otro: 'Other',
    sinVencimiento: 'No expiry',
    cuantosDias: 'How many days',
    diasCorridos: 'calendar days',
    sinFechaLimite: "Your client won't see a deadline.",
    valeHasta: (fecha) => `If you send it today, it's valid until ${fecha}.`,
    salenDeAjustes: (dias) =>
      plural(dias, {
        one: 'The # day comes from Settings.',
        other: 'The # days come from Settings.',
      }),
  },
  detalle: {
    titulo: 'Details',
    bajada:
      'Each piece with its name and technical description, in the order your client will read them.',
    cuantos: (cuantos) => plural(cuantos, { one: '# piece', other: '# pieces' }),
    descripcionGeneral: 'General description',
    opcional: '(optional)',
    ejemploGeneral: 'What applies to the whole job: the style, the materials, how the fronts open…',
    muebles: 'Pieces',
    todosConDescripcion: 'all with a description',
    conDescripcion: (conDescripcion, total) =>
      `${String(conDescripcion)} of ${String(total)} with a description`,
    sinMuebles: 'No pieces. Add at least one with its description so you can send it.',
    quiteElMueble: 'Piece removed.',
    quiteElMuebleLlamado: (nombre) => `“${nombre}” removed.`,
    agregarUnMueble: 'Add a piece',
    mueble: {
      nombre: (numero) => `Name of piece ${String(numero)}`,
      ejemploDelNombre: 'Base cabinet, wall cabinet, closet…',
      descripcionTecnica: 'Technical description',
      ejemploDeLaDescripcion:
        'L-shaped base cabinet 2.07 x 1.83, 880 mm high, white melamine on 18 mm particleboard…',
      queLleva: 'Measurements, material and thickness, color and brand of the board.',
      subir: (numero) => `Move piece ${String(numero)} up`,
      subirLlamado: (nombre) => `Move “${nombre}” up`,
      bajar: (numero) => `Move piece ${String(numero)} down`,
      bajarLlamado: (nombre) => `Move “${nombre}” down`,
      quitar: (numero) => `Remove piece ${String(numero)}`,
      quitarLlamado: (nombre) => `Remove “${nombre}”`,
    },
  },
  herrajes: {
    titulo: 'Hardware',
    bajada:
      "One per line, with its specs. You can bring in the ones from “What's needed”: they come without the quantities.",
    cuantos: (cuantos) => plural(cuantos, { one: '# hardware item', other: '# hardware items' }),
    cuantosSinMostrar: (cuantos) =>
      plural(cuantos, {
        one: '# hardware item · hidden',
        other: '# hardware items · hidden',
      }),
    mostrarlos: 'Show them on the quote',
    noVan: "They're not on the quote. The list stays saved in case you show them again.",
    todaviaNoHay: "No hardware yet. Bring it in from “What's needed” or type it below.",
    herraje: (numero) => `Hardware item ${String(numero)}`,
    sacarElHerraje: (numero) => `Remove hardware item ${String(numero)}`,
    traje: (cuantos) =>
      plural(cuantos, {
        one: "Brought in # hardware item from “What's needed”.",
        other: "Brought in # hardware items from “What's needed”.",
      }),
    yaEstanTodos: "All the hardware from “What's needed” is already here.",
    agregarUnHerraje: 'Add hardware',
    ejemploDelHerraje: 'Drawer slides, hinges, gas struts…',
    traer: "Bring in from “What's needed”",
  },
  casillas: {
    aTenerEnCuenta: {
      titulo: 'Good to know',
      bajada: "What this job doesn't include. Check what your client needs to know.",
      ejemplo: "Doesn't include removing the existing furniture.",
      propia: (numero) => `Good to know: custom item ${String(numero)}`,
      sacarLaPropia: (numero) => `Remove custom item ${String(numero)} from Good to know`,
    },
    incluye: {
      titulo: "What's included",
      bajada: 'What does go in. The usual ones come checked.',
      ejemplo: 'Removal of installation leftovers.',
      propia: (numero) => `What's included: custom item ${String(numero)}`,
      sacarLaPropia: (numero) => `Remove custom item ${String(numero)} from What's included`,
    },
    avisos: {
      titulo: 'Notices',
      bajada: "Your usual texts, with this quote's numbers.",
      ejemplo: "The production date is booked according to the shop's schedule…",
      propia: (numero) => `Notices: custom item ${String(numero)}`,
      sacarLaPropia: (numero) => `Remove custom item ${String(numero)} from Notices`,
    },
    condiciones: {
      titulo: 'Conditions',
      bajada: 'What your client has to make sure of for the installation.',
      ejemplo: 'The building must allow use of the elevator…',
      propia: (numero) => `Conditions: custom item ${String(numero)}`,
      sacarLaPropia: (numero) => `Remove custom item ${String(numero)} from Conditions`,
    },
    van: (van, total) => `${String(van)} of ${String(total)} on the quote`,
    apareceCuandoPague:
      "Shows up once your client pays something: it says how much they've already paid.",
    soloEnEste: 'Only in this quote',
    agregarOtra: 'Add another',
  },
  sena: {
    conElTotal: {
      taller: (porcentaje) =>
        `Once there's a total, you'll see the shop's ${porcentaje} deposit here.`,
      trabajo: (porcentaje) =>
        `Once there's a total, you'll see this job's ${porcentaje} deposit here.`,
    },
    conElTotalYLoPagado: {
      taller: (porcentaje, pagado) =>
        `Once there's a total, you'll see the shop's ${porcentaje} deposit here, and what they've already paid (${pagado}).`,
      trabajo: (porcentaje, pagado) =>
        `Once there's a total, you'll see this job's ${porcentaje} deposit here, and what they've already paid (${pagado}).`,
    },
    laQueLeVasAPedir: "The deposit you'll ask for",
    senaDel: {
      taller: (porcentaje) => `Shop's ${porcentaje} deposit`,
      trabajo: (porcentaje) => `This job's ${porcentaje} deposit`,
    },
    yaPago: 'Already paid',
    leFaltaParaLaSena: 'Still needed for the deposit',
    segunLaQueElija: {
      taller: (porcentaje) =>
        `The shop's ${porcentaje} deposit, depending on the option they choose`,
      trabajo: (porcentaje) =>
        `This job's ${porcentaje} deposit, depending on the option they choose`,
    },
    yaPagoSeDescuenta: (Monto, monto) => (
      <>
        They've already paid <Monto>{monto}</Monto>: it comes off the deposit of the option they
        choose.
      </>
    ),
  },
  valores: {
    titulo: 'Prices',
    bajada:
      "This is the job's quoted price: if you change it here, it changes on the job page too. The app works out the deposit.",
    opciones: (cuantas) => plural(cuantas, { one: '# option', other: '# options' }),
    queIncluye: (letra) => `What option ${letra} includes`,
    ejemploDeLaOpcion: 'What makes it different: fronts, material, one more piece…',
    laAprobo: 'Client approved',
    importe: (letra) => `Amount for option ${letra}`,
    quitar: (letra) => `Remove option ${letra}`,
    agregarUnaOpcion: 'Add an option',
    total: 'Quote total',
    masDeUnaOpcion: 'Offer more than one option',
  },
  abonado: {
    titulo: "What they've already paid, in the site measure notice",
    enDolares: (monto) => `In dollars: ${monto}`,
    enPesos: (monto) => `In pesos: ${monto}`,
    ayudaEnDolares: "It's what came off the price. The PDF takes it off the deposit.",
    ayudaEnPesos:
      "It's what they paid, at its value in pesos. The PDF doesn't take it off the deposit in dollars: the notice mentions it.",
  },
  modificacion: {
    etiqueta: 'Price of each extra modification',
    ayuda:
      'The modifications notice shows it. It starts with the one in Settings, and you can set it in pesos or in dollars.',
  },
  moneda: {
    loQueDice: 'What it says about the currency, for this job',
    deDondeSale:
      'It goes below the payment terms. It comes from “Your quote” in Settings, depending on the currency of the price and the one your client pays in.',
    retocada: 'Tweaked for this job. The default stays the same in Settings.',
    volverALaDeSiempre: 'Back to the default',
  },
  formaDePago: {
    titulo: 'Payment terms',
    bajada:
      "Pick one of your usual payment options and tweak the text for this job. It doesn't change how your client pays you on their page.",
    noMostrarla: "Don't show it",
    noVa: "The payment terms aren't on this quote. Your client still sees on their page how to pay you the deposit.",
    loQueDice: 'What it says, for this job',
    volverAlDeSiempre: 'Back to the default',
    retocado: 'Tweaked for this job. The default stays the same in Settings.',
    laSenaDeEsteTrabajo: (sena) => `This job's deposit is ${sena}.`,
  },
  garantia: {
    titulo: 'Warranty',
    bajada: 'Always included: the law requires at least 6 months on new furniture.',
    meses: (meses) => plural(meses, { one: '# month', other: '# months' }),
    seCambiaEnAjustes: 'Change it in Settings',
  },
  mandar: {
    campos: {
      titulo: 'Title',
      muebles: 'Details',
      valores: 'Prices',
      queCambio: 'What changed',
    },
    loQueFalta: {
      titulo: 'Give the job a title.',
      muebles: 'Describe at least one piece.',
      total: 'Enter the quote total.',
      opciones: 'Each option needs its amount.',
      queCambio: 'Tell your client what changed.',
      queCambioLargo: 'What changed has to fit in 280 characters.',
    },
    leFaltaAlgo: "Something's missing before you can send it",
    noSePudoMandar: "Couldn't send the quote.",
    numeroYCliente: (numero, cliente) => `No. ${numero} · ${cliente}`,
    quePasa: 'What happens when you send it',
    loVeYLoPuedeBajar:
      "Your client sees it on their page with the number and today's date, and can download it as a PDF.",
    loVeArribaDeLoQueCambio:
      "Your client sees it on their page with the number and today's date, with what changed at the top.",
    noVence: "It doesn't expire: we don't show them a deadline.",
    valeHasta: (fecha) => `It's valid until ${fecha}.`,
    pasaA: (estado) => <>Moves to {estado}</>,
    seTilda: '“Build the quote” gets checked off in To do.',
    quedaGuardada: (revision) =>
      `Revision ${String(revision)} stays saved on the job page, with its PDF.`,
    conLaReferencia: (dolar) =>
      `Each total in dollars shows its pesos at today's rate of ${dolar} per dollar, and it's never recalculated.`,
    conElDolarDeHoy:
      "Each total in dollars shows its pesos at today's dollar rate, and it's never recalculated.",
    dolar: {
      pregunta: "What's today's dollar rate for this quote?",
      ayuda:
        "You need it to send it: each total in dollars shows its pesos at this rate. It's saved as today's dollar rate and won't change on this quote.",
    },
    queCambio: 'What changed',
    contador: (usados, maximo) => `${String(usados)} of ${String(maximo)}`,
    ejemploDeQueCambio: 'We switched the wall cabinet to Graphite Gray and added…',
    loLeeTuCliente:
      "Your client reads it at the top of the quote. It's required to send a revision.",
    cancelar: 'Cancel',
    mandando: 'Sending…',
    mandar: 'Send',
    guardando: 'Saving…',
    listo: {
      titulo: 'Sent',
      numero: (numero) => `No. ${numero}`,
      numeroYRevision: (numero, revision) => `No. ${numero} · Rev. ${String(revision)}`,
      yaLoPuedeVer: (nombre) => `${nombre} can see it on their page now.`,
      tuClienteYaLoPuedeVer: 'Your client can see it on their page now.',
      yaVeLaRevision: (nombre, revision) =>
        `${nombre} can see revision ${String(revision)} on their page now.`,
      tuClienteYaVeLaRevision: (revision) =>
        `Your client can see revision ${String(revision)} on their page now.`,
      avisale: 'Let them know on WhatsApp',
      conElEnlace: (Mensaje, mensaje) => (
        <>
          “<Mensaje>{mensaje}</Mensaje>” followed by the link to their page.
        </>
      ),
      sinEnlace: "There's no link yet: tapping creates one and adds it to the message.",
      mandarleElLink: 'Send the link on WhatsApp',
      descargarElPdf: 'Download PDF',
    },
    anotado: {
      titulo: 'Saved offline',
      elPresupuesto: 'The quote',
      laRevision: (revision) => `Revision ${String(revision)}`,
      quedoEnLaCola: (nombre) =>
        `Queued: as soon as you're back online it's sent on its own, with its number, and ${nombre} sees it on their page. You'll have the WhatsApp link on the quote card once it's sent.`,
      quedoEnLaColaTuCliente:
        "Queued: as soon as you're back online it's sent on its own, with its number, and your client sees it on their page. You'll have the WhatsApp link on the quote card once it's sent.",
      listo: 'Done',
    },
  },
  tarjeta: {
    todaviaSinTotal: 'No total yet.',
    total: 'Total',
    acordadoAlAprobar: (monto) => `Agreed on approval: ${monto}`,
    todaviaSinMuebles: 'No pieces yet.',
    muebles: 'Pieces',
    sinNombre: 'Unnamed',
    rev: (revision) => `Rev. ${String(revision)}`,
    laPrimera: 'The first one you sent them.',
    revisionesAnteriores: 'Earlier revisions',
    armaloAca:
      "Build it here and your client sees it on their page: the details, what's included, the conditions and the total. They can also download it as a PDF.",
    armarElPresupuesto: 'Build the quote',
    borrador: 'Draft',
    sinTituloTodavia: 'No title yet',
    guardadoHoySinNumero: 'Saved today · No number yet',
    guardadoElSinNumero: (fecha) => `Saved on ${fecha} · No number yet`,
    seguirArmandolo: 'Keep building it',
    mandado: (cuando) => `Sent ${cuando}`,
    vencio: (fecha) => `Expired on ${fecha}. Send a revision or change the date.`,
    queCambioEnLaRevision: (revision) => `What changed in revision ${String(revision)}`,
    cambiosSinMandar: (revision) =>
      `You have unsent changes: your client still sees revision ${String(revision)}.`,
    hacerCambios: 'Make changes',
    aceptado: 'Accepted',
    loAcepto: (fecha) => `Accepted on ${fecha}: it's the job's quote.`,
    loAceptoConLaOpcion: (fecha, letra) =>
      `Accepted on ${fecha}, with option ${letra}: it's the job's quote.`,
  },
} satisfies Mensajes['armarElPresupuesto'];
