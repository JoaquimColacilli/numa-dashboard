import type { Mensajes } from '../es';
import { plural } from './plural';

export const editarLaEncuesta = {
  intro:
    "This is what every client is asked when you finish a job. It's already written: change whatever you want or leave it as it is.",
  notasDelLargo: {
    ok: "It's a length people answer without thinking twice.",
    atencion: "It's getting long. Past three minutes, people start dropping out.",
    alerta: 'Too long. At this length, half of people quit halfway through.',
  },
  deTantas: (preguntas, tope) => `${String(preguntas)} of ${String(tope)}`,
  loQueSePregunta: "What's asked",
  subir: 'Move up',
  bajar: 'Move down',
  editar: 'Edit',
  dejarDePreguntarla: 'Stop asking it',
  obligatoria: 'Required',
  version: (numero) => `version ${String(numero)}`,
  sinRespuestas: 'no answers',
  dejasteDePreguntarla: (cuando) => `you stopped asking it ${cuando}`,
  verRespuestas: 'See answers',
  volverAPreguntarla: 'Ask it again',
  yaPreguntasElTope: (tope) =>
    `You already ask ${String(tope)}: to ask this one again, remove another.`,
  preguntaNueva: 'New question, not written yet',
  noPreguntasNada:
    "For now you're not asking anyone anything. Add a question or ask one of the ones below again.",
  agregarUnaPregunta: 'Add a question',
  verlaComoElCliente: 'See it as your client does',
  llegasteAlTope: (tope) =>
    `You've reached ${String(tope)} questions. That's as long as people will answer without dropping out: to add one, remove another.`,
  lasQueYaNo: 'Questions you no longer ask',
  lasQueYaNoDetalle:
    "They're not asked anymore, but the answers are kept and you can see them in Results.",
  deUnTrabajo: 'Questions for a specific job',
  deUnTrabajoDetalle:
    "They're added from the job, not from here, and only go into that survey. They don't count toward the overall average: a question one person answered isn't a statistic.",
  editor: {
    queSePregunta: 'What to ask',
    comoContesta: 'How they answer',
    lasOpciones: 'Options',
    opcion: (numero) => `Option ${String(numero)}`,
    borrarLaOpcion: (numero) => `Delete option ${String(numero)}`,
    agregarUnaOpcion: 'Add an option',
    queTengaQueContestarla: 'Make it required',
    siNoPuedeSaltearla: 'If not, they can skip it',
    yaLaContestaron: (personas) =>
      plural(personas, {
        one: '# person already answered this question',
        other: '# people already answered this question',
      }),
    cambiasteComoSeContesta:
      "You changed how it's answered, so those answers can't be added to the new ones. They're kept separately, with the wording they had, and the count starts from zero.",
    siLeCambiasElSentido:
      "If you change its meaning, those answers were answering something else and can't be added to the new ones. We can keep the old ones separately and start counting from zero with the new wording.",
    queHacemos: 'What to do with the old answers',
    empezarDeCero: 'Start counting from zero',
    empezarDeCeroDetalle: (respuestas) =>
      plural(respuestas, {
        one: 'The old answer is kept separately, with the wording it had. In Results it shows up on its own.',
        other:
          'The # old answers are kept separately, with the wording they had. In Results they show up on their own.',
      }),
    esLaMisma: "It's the same question, I just reworded it",
    esLaMismaDetalle: 'The old answers keep adding up with the new ones.',
    guardar: 'Save question',
    cancelar: 'Cancel',
    problemas: {
      'sin-texto': 'Write the question.',
      'texto-largo': 'The question is too long: it has to fit in 300 characters.',
      'opcion-vacia': "There's an empty option: fill it in or remove it.",
      'pocas-opciones': 'It needs at least two options.',
      'muchas-opciones': 'It can have eight options at most.',
      'opcion-larga': 'An option is too long: it has to fit in 120 characters.',
      'opciones-repetidas': 'Two options are the same.',
    },
  },
  vistaPrevia: {
    titulo: 'What your client sees',
    bajada: 'Nothing you do here is saved',
  },
  avisos: {
    deshacer: 'Undo',
    guardada: 'Question saved.',
    versionNueva: 'Saved as a new version. The old answers are kept separately.',
    dejasteDePreguntar: (texto) => `You stopped asking “${texto}”.`,
    volvisteAPreguntarla: "You're asking it again.",
  },
} satisfies Mensajes['editarLaEncuesta'];
