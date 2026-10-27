import type { Mensajes } from '../es';

import { plural } from './plural';

export const editarTesoro = {
  moneda: {
    pregunta: 'Which currency?',
    pesos: 'Pesos',
    dolares: 'Dollars',
    nota: "You can't change the currency later. A dollar bucket goes on the shelf: the waterfall only splits pesos.",
    enPesos: 'In pesos',
    enDolares: 'In dollars',
  },
  ajustar: {
    boton: 'Adjust the balance',
    titulo: (nombre) => `Adjust the balance of ${nombre}`,
    bajada: 'So it matches what it really has.',
    tieneAhora: 'It has now',
    seSuman: (monto) => `${monto} is added`,
    seRestan: (monto) => `${monto} is taken out`,
    quedaIgual: 'Stays the same',
    porQue: 'Why (optional)',
    oEscribilo: 'Or write it',
    fecha: 'Date',
    fechaQueNoPaso: 'Choose today or a day that already passed.',
    ajustar: 'Adjust',
    volver: 'Back',
  },
  archivar: {
    conDolaresSinDestino: 'To archive it, sell the dollars or move them to another dollar bucket.',
    debeDolaresSinOrigen:
      "To archive it, buy the dollars it's missing or bring them from another dollar bucket.",
    queHacer:
      'Take it out of the waterfall, record the payment for the reopened job that uses it, and move its money to another bucket. Then archive it.',
    deSiempre: (nombre) => `${nombre} is one of the built-in buckets: it can't be archived.`,
    enLaFila: (nombre) => `${nombre} is in the waterfall: every payment sends it money.`,
    enUnCobroReabierto: (nombre, trabajo) =>
      `${nombre} is in the split for “${trabajo},” which you reopened: it gets money when that job is paid again.`,
    loQueTenia: (nombre) => `What ${nombre} had when it was archived`,
    loQueLeFaltaba: (nombre) => `What ${nombre} was short before it was archived`,
    titulo: (nombre) => `Archive ${nombre}`,
    tiene: (saldo) => `Balance: ${saldo}`,
    todaviaNo: (nombre) => `${nombre} can't be archived yet.`,
    sinPlata: (nombre) =>
      `${nombre} stops getting money and still shows up by name in the splits you already made.`,
    conPlata: (nombre) =>
      `Before archiving it, where should its money go? ${nombre} stops getting money and still shows up by name in the splits you already made.`,
    debe: (monto, nombre) =>
      `Before archiving it, it has to be at zero: it's short ${monto}. Which bucket does it come from? ${nombre} stops getting money and still shows up by name in the splits you already made.`,
    aDondePasa: 'Where the money goes',
    deDondeSale: 'Where the money comes from',
    quedaEn: (saldo) => `will be at ${saldo}`,
    tieneEnLaLista: (saldo) => `has ${saldo}`,
    entendido: 'Got it',
    noArchivar: "Don't archive",
    archivar: (nombre) => `Archive ${nombre}`,
    pasarA: (monto, destino) => `Move ${monto} to ${destino} and archive`,
    pasarDesde: (monto, origen) => `Move ${monto} from ${origen} and archive`,
  },
  campos: {
    sinNombre: 'No name',
    asiSeVe: 'How it looks',
    nombre: 'Name',
    paraQueEs: "What it's for",
    opcional: 'Optional',
    color: 'Color',
    tambienLaUsa: (nombre) => `${nombre} uses it too: you can tell them apart by name and icon.`,
    icono: 'Icon',
    meta: 'Goal',
    ayudaDeLaMeta:
      'Optional. If you set one, it collects until it gets there and Home shows how much is left.',
    objetivo: 'Goal',
    ayudaDelObjetivo: 'It collects until it gets there. Then its share keeps flowing down.',
    paraCuando: 'By when',
    ayudaDeLaFecha: 'Optional: an estimated date to get there.',
  },
  iconos: {
    receipt: 'Receipt',
    package: 'Package',
    'building-2': 'Building',
    wrench: 'Wrench',
    vault: 'Safe',
    landmark: 'Bank',
    coins: 'Coins',
    banknote: 'Banknotes',
    'trending-up': 'Rising arrow',
    'piggy-bank': 'Piggy bank',
    car: 'Car',
    truck: 'Truck',
    plane: 'Plane',
    'graduation-cap': 'Graduation cap',
    gift: 'Gift',
    shield: 'Shield',
    sprout: 'Sprout',
    house: 'House',
    hammer: 'Hammer',
    church: 'Church',
  },
  errores: {
    nombre: (maximo) =>
      plural(maximo, {
        one: 'Give it a name, up to # character.',
        other: 'Give it a name, up to # characters.',
      }),
    descripcion: (maximo) =>
      plural(maximo, { one: 'Up to # character.', other: 'Up to # characters.' }),
    meta: 'Enter the goal: how much it collects.',
    fechaSinMeta: 'To set a date, enter the goal first.',
    fechaDeLaMeta: 'The date goes from today on.',
    diaDePago: 'The payment day goes from 1 to 31.',
    monto: 'Enter the most it can get.',
    montoGrande: "The amount can't be that large.",
    porcentajeDeLaObligacion: (minimo, maximo) => `Enter a percentage from ${minimo} to ${maximo}.`,
    porcentajeDelReparto: (minimo, libre) =>
      `Enter a percentage from ${minimo} to ${libre}, what's still free.`,
  },
  bajada: {
    conMeta: 'Name, color, icon and goal',
    deSiempre: 'Name, color and icon',
  },
  lugar: {
    alEstante: 'To the shelf',
    estante: 'Gets nothing from payments: you add it to the waterfall later',
    obligacion: 'A percentage of every payment, like Ingresos Brutos (a provincial tax)',
    obligacionesLlenas: (tope) =>
      plural(tope, { one: 'Only # obligation fits.', other: 'Up to # obligations fit.' }),
    compromiso: 'Collects what you have to pay, like rent',
    ahorroFijo: 'A fixed amount you set aside from profit',
    pasosLlenos: (tope) =>
      plural(tope, {
        one: 'Only # bill or fixed savings fits.',
        other: 'Up to # bills and fixed savings fit.',
      }),
    repartoLleno: (tope) =>
      plural(tope, {
        one: 'The split takes only # bucket.',
        other: 'The split takes up to # buckets.',
      }),
    repartoEnCien: 'The split already adds up to 100%.',
    reparto: "A percentage of what's left",
    superavit: (nombre) => `Gets what's left, instead of ${nombre}`,
    alFinal: 'At the end of its kind',
    alPrincipio: 'At the start of its kind',
    despuesDe: (nombre) => `After ${nombre}`,
    elAnterior: 'the previous one',
    libre: (libre) => `${libre}% of the split is still free.`,
    libreHastaCien: (libre, porcentaje) =>
      `${libre}% of the split is still free: with ${porcentaje}%, the split reaches 100%.`,
    libreConResto: (libre, porcentaje, nombre, resto) =>
      `${libre}% of the split is still free: with ${porcentaje}%, ${nombre} keeps the other ${resto}%.`,
  },
  sugerencias: {
    stockDelTaller: 'Shop stock',
    maquinaria: 'Machinery',
    vehiculo: 'Vehicle',
    inmueble: 'Property',
    ingresosBrutos: 'Ingresos Brutos',
    gastosFijos: 'Fixed costs',
    sueldos: 'Wages',
    alquiler: 'Rent',
    cuotas: 'Installments',
    superavit: 'Surplus',
  },
  nuevo: {
    titulo: 'New bucket',
    bajada: 'One more place for your money',
    queEs: 'What is it?',
    otroTipo: 'Change',
    tipos: {
      caja: {
        titulo: 'Cash box',
        que: 'What a cash box is',
        ejemplo: 'Shop stock, petty cash',
        ayuda:
          "It collects with no cap. It doesn't come due or reset to zero on its own. Maun is the shop's main cash box.",
      },
      'deuda-destinada': {
        titulo: 'Obligation',
        que: 'What an obligation is',
        ejemplo: 'Gross income tax',
        ayuda:
          "It takes a share of each payment, as a percentage or a fixed amount. It's there to hand over until you log the payment.",
      },
      'deuda-obligatoria': {
        titulo: 'Bill',
        que: 'What a bill is',
        ejemplo: 'Rent, wages',
        ayuda:
          "It collects up to its cap between one due date and the next. On payment day it's paid and starts from zero. If it didn't reach the cap, Maun puts in what's missing.",
      },
      meta: {
        titulo: 'Goal',
        ejemplo: 'A machine, the workshop',
        que: 'What a goal is',
        ayuda:
          'It collects until it reaches the goal. Then it stops receiving and its share keeps flowing down.',
      },
    },
    enDolares: 'A dollar bucket is a cash box or a goal: the waterfall splits pesos.',
    comoRecibe: 'How does it get money?',
    seLleva: 'It takes',
    unPorcentaje: 'A percentage',
    unMontoFijo: 'A fixed amount',
    montoFijo: 'Amount from each payment',
    ayudaDelMontoFijo: 'Never more than what comes in.',
    tope: 'Cap',
    ayudaDelTope: 'What it collects between one payment day and the next.',
    diaDePago: 'Payment day',
    ayudaDelDiaDePago: "From 1 to 31. If the month doesn't have it, the last day.",
    seLaPaga: 'Pays itself',
    sobreQueSeCalcula: "What it's calculated on",
    nombresSugeridos: 'Suggested names',
    dondeVa: 'Where it goes',
    porcentaje: 'Percentage (%)',
    antesDelDiezmo: 'Before the tithe',
    monto: 'Amount',
    ayudaDelCompromiso:
      'Collects up to that and refills when you pay: when you record the payment, it starts collecting again.',
    ayudaDelAhorroFijo: 'Gets up to that per month. Anything over that keeps flowing down.',
    porcentajeDeLoQueSobra: "Percentage of what's left (%)",
    crear: 'Create bucket',
  },
  editar: {
    archivar: 'Archive',
    guardar: 'Save',
  },
} satisfies Mensajes['editarTesoro'];
