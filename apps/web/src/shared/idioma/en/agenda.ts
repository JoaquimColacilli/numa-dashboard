import type { Mensajes } from '../es';
import { plural } from './plural';

const cosas = (cantidad: number): string => plural(cantidad, { one: '# thing', other: '# things' });

const hechas = (cantidad: number): string => plural(cantidad, { other: '# done' });

export const agenda = {
  categorias: {
    entrega: 'Delivery',
    presupuesto: 'Quote',
    visita: 'Site measure',
    seguimiento: 'Follow-up',
    vencimiento: 'Due date',
    materiales: 'Materials',
    taller: 'Shop',
  },
  ayudaDeLaPropia: {
    materiales: 'buy, order, pick up',
    taller: 'work, errands, payments',
  },
  derivadas: {
    entrega: {
      accion: 'Deliver',
      nombre: (titulo) => `Deliver: ${titulo}`,
      corto: (titulo) => `Delivery: ${titulo}`,
      origen: "Comes from the job's estimated delivery.",
      abrir: 'Open the job',
      abrirUno: (titulo) => `Open the job: ${titulo}`,
      hecha: 'delivered',
    },
    visita: {
      accion: 'Site measure',
      nombre: (titulo) => `Site measure: ${titulo}`,
      corto: (titulo) => `Site measure: ${titulo}`,
      origen: "Comes from the inquiry's site measure date.",
      abrir: 'Open the inquiry',
      abrirUno: (titulo) => `Open the inquiry: ${titulo}`,
      hecha: 'visited',
    },
    presupuesto: {
      accion: 'Send quote',
      nombre: (titulo) => `Send quote: ${titulo}`,
      corto: (titulo) => `Quote: ${titulo}`,
      origen: "Comes from the inquiry's quote deadline.",
      abrir: 'Open the inquiry',
      abrirUno: (titulo) => `Open the inquiry: ${titulo}`,
      hecha: 'sent',
    },
    seguimiento: {
      accion: 'Follow up with',
      nombre: (nombre) => `Follow up with ${nombre}`,
      corto: (nombre) => `Write to ${nombre}`,
      origen: "Comes from the job's follow-up.",
      abrir: 'Open the follow-up',
      abrirUno: (nombre) => `Open the follow-up: ${nombre}`,
      hecha: 'followed up',
    },
  },
  vencimiento: {
    accion: 'Due',
    nombre: (renglon) => `Due: ${renglon}`,
    corto: (renglon) => `Due: ${renglon}`,
    origen: 'Comes from the payment day of a bill in the waterfall.',
    masAdelante: "The payment can be recorded starting the month it's due.",
    hecha: 'paid',
    pagado: 'Paid',
    registrar: 'Record the payment',
    verEnTesoros: 'See in Buckets',
    monto: (monto, tesoro) => `${monto} from ${tesoro}`,
  },
  propiaHecha: 'done',
  estaComprometida: "It's confirmed with the client. To change it, open the job.",
  comoSeMueve: {
    seguimiento:
      "When you write to them, log it: that's where you choose whether the job comes back, gets another date or is off.",
    arrastrando: 'Drag it on the month to move it, or change the date there.',
    conLaFecha: 'To move it, change the date there.',
  },
  franjas: {
    manana: 'in the morning',
    tarde: 'in the afternoon',
  },
  registrarElContacto: 'Log the follow-up',
  marcarComoImportante: 'Mark as important',
  sacarLaMarca: 'Remove the important mark',
  borrar: (texto) => `Delete “${texto}”`,
  urgencia: {
    vencio: (cuando) => `was due ${cuando}`,
    atrasada: (cuando) => `overdue (${cuando})`,
    hoy: 'today',
    manana: 'tomorrow',
  },
  etiquetasDelDia: {
    hoy: 'today',
    manana: 'tomorrow',
    ayer: 'yesterday',
  },
  mesConAnio: (mes, anio) => `${mes} ${anio}`,
  cuentas: {
    citas: (cantidad) => plural(cantidad, { one: '# appointment', other: '# appointments' }),
    vencimientos: (cantidad) => plural(cantidad, { one: '# due date', other: '# due dates' }),
    anotaciones: (cantidad) => plural(cantidad, { one: '# note', other: '# notes' }),
    cosasAnotadas: (cantidad) => plural(cantidad, { one: '# note', other: '# notes' }),
    hechas,
    cosas,
    cosasYHechas: (pendientes, listas) => `${cosas(pendientes)} and ${hechas(listas)}`,
  },
  nadaEnElMes: 'nothing scheduled',
  nadaEnElDia: 'Nothing scheduled',
  nadaAgendado: 'nothing scheduled',
  caminos: {
    explicacion:
      "Site measures and deliveries aren't added by hand: they come from the inquiry and the job, and show up on your calendar by themselves.",
    cargarUnaConsulta: 'Add an inquiry',
    conLaVisita: 'with the site measure that day',
    cargarUnProyecto: 'Add a job',
    conLaEntrega: 'with the estimated delivery that day',
  },
  dia: {
    cerrar: 'Close the day',
    libre: 'This day is free',
    libreDetalle:
      "No deliveries or site measures, and you haven't added anything yet. If you need to buy something or get something ready, add it.",
    anotar: 'Add something for this day',
    todoElDia: 'All day',
    nadaPendiente: 'Nothing left to do for this day.',
    pendienteDel: (dia) => `To do on ${dia}`,
    hecho: 'Done',
    nadaSinHora: 'Nothing without a time for this day.',
    soloElHorario: 'Show shop hours only',
    lasDemasHoras: 'Show the other hours',
  },
  grilla: {
    ayudaDelArrastre:
      'Move it to another day by dragging it, or by picking it up with the space bar, moving it with the arrow keys and dropping it with Enter. Escape leaves it where it was. You can also change the date by opening it.',
    celda: (dia, cuenta) => `${dia}: ${cuenta}`,
    celdaDeHoy: (dia, cuenta) => `${dia}, today: ${cuenta}`,
    celdaMarcada: (dia, cuenta) => `${dia}: ${cuenta}, with something marked`,
    celdaDeHoyMarcada: (dia, cuenta) => `${dia}, today: ${cuenta}, with something marked`,
    verTodas: (cantidad, dia) =>
      plural(cantidad, { one: `See the # thing on ${dia}`, other: `See all # things on ${dia}` }),
    mas: (cantidad) => plural(cantidad, { other: '+# more' }),
  },
  tira: {
    diasDelMes: 'Days of the month',
    dia: (dia, cuenta) => `${dia}, ${cuenta}`,
    diaMarcado: (dia, cuenta) => `${dia}, ${cuenta}, with something marked`,
  },
  arrastre: {
    loDejaste: (dia) => `You left it where it was, on ${dia}.`,
    moviste: (nombre, dia) => `You moved ${nombre} to ${dia}. You can undo it from the notice.`,
    agarrasteConTeclado: (nombre, dia) =>
      `You picked up ${nombre}, from ${dia}. Move it with the arrow keys, drop it with Enter and cancel with Escape.`,
    agarraste: (nombre, dia) => `You picked up ${nombre}, from ${dia}.`,
    sobre: (nombre, dia) => `${nombre}, over ${dia}.`,
    sinDia: "There's no day that way.",
  },
} satisfies Mensajes['agenda'];
