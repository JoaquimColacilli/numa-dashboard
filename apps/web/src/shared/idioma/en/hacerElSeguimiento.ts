import type { Mensajes } from '../es';

import { plural } from './plural';

export const hacerElSeguimiento = {
  plazos: {
    una_semana: 'In a week',
    un_mes: 'In a month',
    tres_meses: 'In three months',
  },
  cuandoLeVolvesAEscribir: 'When will you write to them again?',
  otroDia: 'Another day',
  errores: {
    sinProximoContacto: "Choose the day you'll write to them again.",
    proximoContactoQuePaso: 'That day has passed: choose today or later.',
    sinDiaQueLeEscribiste: 'Enter the day you wrote to them.',
    diaQueNoLlego: "That day hasn't come yet: it has to be today or earlier.",
    notaLarga: (caracteres) =>
      plural(caracteres, {
        one: "It can't be longer than # character.",
        other: "It can't be longer than # characters.",
      }),
    queSigue: 'Choose what happened.',
  },
  ponerEnSeguimiento: {
    titulo: 'Not for now',
    explicacion:
      "They didn't say no: they said not now. It moves to Follow-up, leaves your inquiries, and the calendar reminds you on the day you'll write to them again.",
    nota: 'Note',
    ejemploDeNota: 'After the holidays, when they get their year-end bonus…',
    opcional: 'Optional.',
    cancelar: 'Cancel',
    pasarASeguimiento: 'Move to Follow-up',
  },
  registrarElContacto: {
    titulo: 'Log the follow-up',
    contactarA: (nombre) => `Contact ${nombre}`,
    leTocabaEl: (fecha) => `It was due on ${fecha}.`,
    leTocabaElConNota: (fecha, nota) => `It was due on ${fecha}. ${nota}.`,
    queDiaLeEscribiste: 'Day you wrote to them',
    queTeContesto: 'What they replied',
    ejemploDeRespuesta: 'To write after the end of the month, that they found it cheaper…',
    opcional: 'Optional.',
    yAhora: 'What now?',
    opciones: {
      vuelve: {
        titulo: "It's back on",
        detalle: "They're interested again: it goes back to inquiries.",
      },
      otra_fecha: {
        titulo: 'Not yet',
        detalle: "Still in follow-up: you'll write to them another day.",
      },
      no_va: {
        titulo: "It's a no",
        detalle: "It's marked as lost, with the usual closing.",
      },
    },
    vuelveA: 'Goes back to',
    ayudaDeLaEtapa: 'The stage it was in when you agreed to wait. Change it if another one fits.',
    notaParaLaProxima: 'Note for next time',
    elCierre:
      "The usual closing opens: if they left a deposit, it's settled as shop income, and the job moves to History. It can be reactivated.",
    cancelar: 'Cancel',
    registrar: 'Save',
    botones: {
      vuelve: 'Back to inquiries',
      otra_fecha: 'Save the new date',
      no_va: 'Go to closing',
    },
  },
} satisfies Mensajes['hacerElSeguimiento'];
