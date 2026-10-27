import type { Mensajes } from '../es';

export const atenderLaRespuesta = {
  titulo: "Your client's reply",
  aproboLaOpcion: (nombre, letra) => `${nombre} approved option ${letra}`,
  aproboElEstimativo: (nombre) => `${nombre} approved the estimate`,
  aproboElPresupuesto: (nombre) => `${nombre} approved the quote`,
  tuCliente: 'Your client',
  respondioEl: (fecha) => `Approved it from their page on ${fecha}.`,
  propone: {
    manana: (dia) => `Suggests ${dia}, in the morning, for the site measure.`,
    tarde: (dia) => `Suggests ${dia}, in the afternoon, for the site measure.`,
    me_da_igual: (dia) => `Suggests ${dia} for the site measure. Any time works.`,
  },
  nota: 'What they left you',
  agendarElRelevamiento: 'Schedule the site measure',
  aprobarConLaSena: 'Approve with the deposit',
  reactivar: 'Reactivate',
  escribirle: 'Message them',
  listo: 'Done, we talked it over',
} satisfies Mensajes['atenderLaRespuesta'];
