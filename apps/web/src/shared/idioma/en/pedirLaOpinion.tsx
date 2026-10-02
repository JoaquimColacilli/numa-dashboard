import type { Mensajes } from '../es';
import { plural } from './plural';

function preguntas(cuantas: number): string {
  return plural(cuantas, { one: 'one question', other: '# questions' });
}

function comentarios(cuantos: number): string {
  return plural(cuantos, { one: 'a comment', other: '# comments' });
}

function loQueTiene(cuantasPreguntas: number, cuantosComentarios: number): string {
  if (cuantasPreguntas > 0 && cuantosComentarios > 0) {
    return `It has ${preguntas(cuantasPreguntas)} and ${comentarios(cuantosComentarios)}`;
  }
  if (cuantasPreguntas > 0) return `It has ${preguntas(cuantasPreguntas)}`;
  if (cuantosComentarios > 0) return `It has ${comentarios(cuantosComentarios)}`;
  return 'It has no questions';
}

export const pedirLaOpinion = {
  sinSenal: "You need to be online to create the survey link. Tap again when you're back online.",
  enlaceCopiado: 'Link copied.',
  copiado: 'Copied',
  copiarElEnlace: 'Copy link',
  darDeBaja: {
    abrir: 'Turn off this link',
    titulo: 'Turn off the link?',
    texto: (nombre) =>
      nombre === null
        ? "The link you sent your client will stop working: if they open it, they'll see it no longer works. You can send them a new one from here afterward."
        : `The link you sent ${nombre} will stop working: if they open it, they'll see it no longer works. You can send them a new one from here afterward.`,
    sinSenal: 'You need to be online to turn it off.',
    confirmar: 'Turn off',
    cancelar: 'Cancel',
  },
  pie: (Enlace) => (
    <>
      The survey they get comes from <Enlace>Feedback › Questions</Enlace>, plus anything you add
      here.
    </>
  ),
  contestada: {
    titulo: (nombre) =>
      nombre === null ? 'Your client already answered' : `${nombre} already answered`,
    chip: 'answered',
    contestoLaEncuesta: 'They answered the survey.',
    contestoEl: (dia, diasDespues) => {
      if (diasDespues === null) return `Answered on ${dia}.`;
      if (diasDespues === 0) return `Answered on ${dia}, the same day as the delivery.`;
      return `Answered on ${dia}, ${plural(diasDespues, { one: 'one day', other: '# days' })} after the delivery.`;
    },
    verLoQueContesto: 'See their answers',
    comentario: (texto) => `“${texto}”`,
    verTodas: 'See all feedback',
  },
  mandada: {
    titulo: 'You asked for feedback',
    chip: 'no answer yet',
    bajada: "The link went out on WhatsApp. When they answer, it'll show up here and in Feedback.",
    leLlego: (cuando) => `They got it ${cuando} and haven't answered yet`,
    recordarselo: 'Remind them once',
    yaLeRecordaste: (dia) =>
      `You already reminded them once, on ${dia}. There's no second reminder: with a client who already paid you, a second nudge does more harm than good.`,
    unRecordatorio:
      "One reminder and that's it. If they don't answer after that, leave it there, and that's fine.",
  },
  sinMandar: {
    titulo: (nombre) =>
      nombre === null ? 'Ask your client for feedback' : `Ask ${nombre} for feedback`,
    sinPreguntas:
      "The survey doesn't have any questions yet. Add some in Feedback › Questions before you ask.",
    queTiene: (cuantasPreguntas, cuantosComentarios, minutos) =>
      `${loQueTiene(cuantasPreguntas, cuantosComentarios)}. They get a link, open it without an account, and answer in less than ${plural(minutos, { one: 'a minute', other: '# minutes' })}.`,
    pedirsela: 'Ask via WhatsApp',
    noSeCreo: (motivo) =>
      `Couldn't create the link. ${motivo} If you already sent the message, tap Try again: the link they got will start working without sending anything else.`,
    reintentar: 'Try again',
    elMismoDia:
      'Asking on the day you deliver gets far more answers than asking a week later. If you can, send it now.',
  },
  propias: {
    titulo: 'Something specific to this job',
    cuantas: (propias, tope) =>
      propias === 0 ? 'none yet' : `${String(propias)} of ${String(tope)}`,
    detalle:
      "It's only added to this client's survey. It doesn't count toward the overall average.",
    sacar: (texto) => `Remove the question “${texto}”`,
    queLePreguntas: (nombre) =>
      nombre === null ? 'What do you want to ask your client' : `What do you want to ask ${nombre}`,
    ejemplo: 'Is the wall cabinet at a comfortable height?',
    comoContesta: 'How they answer',
    agregarla: 'Add it to this survey',
    cancelar: 'Cancel',
    agregarUna: 'Add a question for this job',
    yaContesto: (nombre) =>
      nombre === null
        ? 'Your client already answered, so these questions stay as they are. To ask something new, send them a message.'
        : `${nombre} already answered, so these questions stay as they are. To ask something new, send them a message.`,
    problemas: {
      'sin-texto': 'Write the question.',
      'texto-largo': 'The question is too long: it has to fit in 300 characters.',
    },
  },
  avisos: {
    laSumamos: "Added to this job's survey.",
    sacaste: 'You removed the question.',
    deshacer: 'Undo',
  },
} satisfies Mensajes['pedirLaOpinion'];
