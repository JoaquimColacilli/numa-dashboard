import type { Mensajes } from '../es';
import { plural } from './plural';

export const paginaOpiniones = {
  opiniones: 'Feedback',
  secciones: {
    resultados: 'Results',
    preguntas: 'Questions',
  },
  sinConexion: "Offline. You're seeing what was last synced.",
  sinEnviar: {
    titulo: "You haven't asked anyone yet",
    detalle:
      'When you mark a job as delivered, a button to ask the client for feedback will show up right there. Their answers are collected here.',
    detalleConTerminados: (terminados) =>
      plural(terminados, {
        one: 'You have # finished job. When you mark one as delivered, a button to ask the client for feedback will show up right there. Their answers are collected here.',
        other:
          'You have # finished jobs. When you mark one as delivered, a button to ask the client for feedback will show up right there. Their answers are collected here.',
      }),
    pedirle: 'Ask a client for feedback',
    verQueSePregunta: "See what's asked",
  },
  sinRespuestas: {
    preguntaste: (enviadas, cuando) =>
      plural(enviadas, {
        one: `You asked one client ${cuando}`,
        other: `You asked # clients, the first one ${cuando}`,
      }),
    titulo: 'No one has answered yet',
    esNormal:
      "That's normal in the first few days. Out of every ten people asked, three to five usually answer, almost always within the first week.",
    verAQuien: 'See who you sent it to',
  },
  titular: {
    region: 'Headline',
    queTanConformes: 'How satisfied they were',
    deCinco: 'out of 5',
    nadieContesto: 'No one has answered this question yet.',
    promedioDe: (respuestas) =>
      plural(respuestas, {
        one: "It's the average of # answer",
        other: "It's the average of # answers, one per person",
      }),
    contestaron: (tasa) => `${tasa} answered`,
    unPunto: 'Each dot is a client you asked. The filled one answered.',
    variosPuntos: 'Each dot is a client. The filled ones answered.',
    variosPuntosConTope: (tope) =>
      `Each dot is a client. The filled ones answered. Showing the first ${String(tope)}.`,
  },
  porcentaje: (porcentaje, parte, total) =>
    `${String(porcentaje)}% (${String(parte)} of ${String(total)})`,
  comentarios: {
    titulo: 'What they wrote',
    escribieronAlgo: (escribieron, contestadas) =>
      `${String(escribieron)} of ${String(contestadas)} wrote something`,
    nadieEscribio:
      "No one has written anything yet. The comment is optional, so many people just answer the scales and that's it.",
    verLaRespuesta: 'See the answer',
  },
  preguntas: {
    titulo: 'Question by question',
    ocultarLosNumeros: 'Hide the numbers',
    verLosNumeros: 'Show the numbers',
    repartidas:
      'With this many answers it makes sense to see them spread out. The middle line is “neither good nor bad.”',
    deAUna: (umbral) =>
      `Each dot is a person. With fewer than ${String(umbral)} answers we don't show spread-out percentages: they read better one by one.`,
    mezcladas: (umbral) =>
      `With this many answers it makes sense to see them spread out. The middle line is “neither good nor bad.” Questions with fewer than ${String(umbral)} answers go one by one: each dot is a person.`,
    lasQueYaNo: 'Questions you no longer ask',
    noSePreguntanMas: "They're not asked anymore, but their answers stay here.",
    antesDecia: (Cita, texto, contestaron, hasta) => (
      <>
        This question used to say <Cita>“{texto}”</Cita>, and{' '}
        {plural(contestaron, { one: '# person', other: '# people' })} answered it until {hasta}.
        Those answers aren&apos;t counted here, because they were answering something else.
      </>
    ),
    ocultarLasDeAntes: 'Hide the earlier ones',
    verLasDeAntes: 'Show the earlier ones',
  },
  enElTiempo: {
    titulo: 'Over time',
    conEvolucion:
      'Each bar is an answer, from oldest to newest. The height shows how satisfied they were.',
    sinEvolucion: (umbral) =>
      `Each bar is an answer, in order. With ${String(umbral)} answers and six months of history we'll be able to show whether it's improving or getting worse; with less it would be making up a trend.`,
    tira: (respuestas, desde, hasta) =>
      plural(respuestas, {
        one: `# answer, from ${desde} to ${hasta}`,
        other: `# answers, from ${desde} to ${hasta}`,
      }),
    sinRespuestas: 'No answers',
  },
  trabajos: {
    titulo: 'Job by job',
    contesto: (cuando) => `Answered ${cuando}`,
    recordada: 'No answer yet, reminder sent',
    leMandaste: (cuando) => `Sent ${cuando}`,
    sinCliente: 'No client',
    propias: (propias) => plural(propias, { other: '+# custom' }),
  },
} satisfies Mensajes['paginaOpiniones'];
