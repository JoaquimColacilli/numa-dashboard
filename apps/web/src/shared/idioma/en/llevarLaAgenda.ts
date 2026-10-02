import type { Mensajes } from '../es';
import { plural } from './plural';

export const llevarLaAgenda = {
  deshacer: 'Undo',
  marcada: 'Marked as important.',
  desmarcada: 'You removed the mark.',
  anotado: (dia) => `Added for ${dia}.`,
  listo: (texto) => `Done: ${texto}.`,
  borraste: (texto) => `You deleted “${texto}”.`,
  movida: {
    entrega: (nombre, dia) =>
      `${nombre}: moved to ${dia}. You changed the job's estimated delivery.`,
    visita: (nombre, dia) => `${nombre}: moved to ${dia}. You changed the site measure date.`,
    presupuesto: (nombre, dia) => `${nombre}: moved to ${dia}. You changed the quote deadline.`,
    seguimiento: (nombre, dia) =>
      `${nombre}: moved to ${dia}. You changed the day you'll write to them again.`,
  },
  pasoAl: (nombre, dia) => `${nombre} moved to ${dia}.`,
  errores: {
    faltaElTexto: 'Write what needs to be done.',
    largoMaximo: (maximo) =>
      plural(maximo, {
        one: "Can't be longer than # character.",
        other: "Can't be longer than # characters.",
      }),
    faltaElDia: 'Choose the day.',
  },
  hoja: {
    titulo: 'Add something',
    queHayQueHacer: 'What needs doing',
    ejemplo: 'Buy melamine, pick up the hardware, paint the dresser…',
    queEs: 'What it is',
    cuando: 'When',
    hoy: 'Today',
    manana: 'Tomorrow',
    elDiaElegido: 'Chosen day',
    otroDia: 'Another day',
    hora: 'Time',
    horaOpcional: 'Optional: the day is what counts.',
    trabajo: 'Job',
    sinTrabajo: 'No job',
    opcional: 'Optional.',
    marcarlo: 'Mark it as important',
    comoElCirculo: 'Like the circle in your notebook: what matters this week.',
    anotarlo: 'Add it',
  },
} satisfies Mensajes['llevarLaAgenda'];
