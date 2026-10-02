import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

function enMenosDe(minutos: number): string {
  return plural(minutos, { one: 'less than a minute', other: 'less than # minutes' });
}

export const encuesta = {
  pestana: 'Survey',
  pestanaDe: (taller) => `Survey · ${taller}`,
  abriendo: 'Loading the survey',
  sinSenal: {
    titulo: 'No connection',
    texto: "You need to be online to open the survey. Try again when you're back online.",
  },
  error: {
    titulo: "We couldn't open the survey",
    texto: 'The connection dropped. The link still works, so try again.',
    reintentar: 'Try again',
  },
  muerto: {
    titulo: 'This link no longer works',
    texto:
      "The links the shop sends last a while and then get turned off. If you'd like to share your feedback, ask whoever sent it to you for a new one.",
  },
  alMandar: {
    sinSenal:
      "Couldn't send it: the connection dropped. Your answers are still here, so try again when you're back online.",
    noSeGuardo: "We couldn't save your feedback. Try again in a little while.",
    cambioLaEncuesta:
      "While you were answering, we changed one of the questions. It's up to date now: check your answers and send it again.",
    motivos: {
      forma: "The answer isn't in the format the survey expects",
      ajena: "An answer came in for a question that isn't part of this survey",
      repetida: 'The same question was answered twice',
      tipo: "An answer isn't the kind its question asks for",
      rango: "An answer is outside its question's options",
      vacio: 'An answer came in empty',
      largo: 'A text is longer than the 2,000 characters the survey accepts',
      obligatoria: 'A required question is missing its answer',
    },
  },
  formulario: {
    lema: 'Custom furniture',
    titulo: (Trabajo, trabajo) =>
      trabajo.trim() === '' ? (
        'How did it go with your furniture?'
      ) : (
        <>
          How did it go with “<Trabajo>{trabajo}</Trabajo>”?
        </>
      ),
    bajada: (preguntas, comentarios, minutos) => {
      if (preguntas > 0) {
        return `This survey has ${plural(preguntas, { one: 'one question', other: '# questions' })} and takes ${enMenosDe(minutos)}. The shop's owner reads it.`;
      }
      if (comentarios > 0) {
        return `This survey asks for ${plural(comentarios, { one: 'one comment', other: '# comments' })} and takes ${enMenosDe(minutos)}. The shop's owner reads it.`;
      }
      return `This survey has no questions and takes ${enMenosDe(minutos)}. The shop's owner reads it.`;
    },
    avisoDeFirma:
      "Since this link is tied to your job, we'll know it was you who answered. Tell us what you think anyway: that's why we sent it.",
    ayudaDelComentario: "It's optional, but it's what helps us most.",
    loQueSeTeOcurra: 'Whatever comes to mind. If nothing does, leave it blank and send it anyway.',
    faltaEscribir: "This one's missing. Write something to continue.",
    faltaElegir: "This one's missing. Tap an option to continue.",
    faltan: (preguntas) =>
      plural(preguntas, {
        one: "One question is missing. It's marked above.",
        other: "# questions are missing. They're marked above.",
      }),
    nombre: 'Survey',
    mandando: 'Sending…',
    mandar: 'Send my feedback',
    unaSolaVez: "It's sent only once and can't be edited afterward.",
  },
  gracias: {
    titulo: 'Thank you',
    conElNombre: (Nombre, nombre) => (
      <>
        Thank you, <Nombre>{nombre}</Nombre>
      </>
    ),
    texto:
      'We read it ourselves, not a system. What you told us helps us with the next piece of furniture we make.',
    resena: {
      pregunta: 'Would you leave the same review on Google?',
      texto:
        'We ask every client, whatever their answers. For a small shop, it makes a big difference.',
      dejarla: 'Leave a review',
    },
  },
  yaContestaste: {
    titulo: "You've already told us, thank you",
    texto: (fecha) =>
      `You answered on ${fecha}. This is what you said. It can't be changed, but if you left anything out, write to us.`,
  },
  escalas: {
    conformidad: {
      1: { etiqueta: 'Not satisfied at all', corta: 'Not at all' },
      2: { etiqueta: 'Not very satisfied', corta: 'Not very' },
      3: { etiqueta: 'Neither good nor bad', corta: 'So-so' },
      4: { etiqueta: 'Satisfied', corta: 'Satisfied' },
      5: { etiqueta: 'Very satisfied', corta: 'Very satisfied' },
    },
    tiempos: {
      1: { etiqueta: 'It arrived very late', corta: 'Very late' },
      2: { etiqueta: 'It was delayed', corta: 'Delayed' },
      3: { etiqueta: 'More or less on time', corta: 'More or less' },
      4: { etiqueta: 'It arrived when promised', corta: 'On time' },
      5: { etiqueta: 'It arrived earlier than agreed', corta: 'Early' },
    },
    trato: {
      1: { etiqueta: 'Really hard', corta: 'Hard' },
      2: { etiqueta: 'A bit hard', corta: 'A bit hard' },
      3: { etiqueta: 'Neither good nor bad', corta: 'Neither good nor bad' },
      4: { etiqueta: 'Easy', corta: 'Easy' },
      5: { etiqueta: 'Very easy', corta: 'Very easy' },
    },
    sitalvezno: {
      1: { etiqueta: 'No', corta: 'No' },
      2: { etiqueta: 'Maybe', corta: 'Maybe' },
      3: { etiqueta: 'Yes, absolutely', corta: 'Yes' },
    },
  },
} satisfies MensajesDelCliente['encuesta'];
