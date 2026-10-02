import type { Mensajes } from '../es';

import { plural } from './plural';

export const paginaAnalitico = {
  volver: 'History',
  titulo: 'Delivery insights',
  bajada:
    "How close you land to the date you estimate and how long each type of furniture takes you. It won't show numbers the data can't back up yet.",
  vacio: {
    titulo: 'No deliveries to compare yet',
    detalle:
      "When you deliver a job with its estimated date, you'll see here how close you got and how long each job type takes you.",
  },
  dias: (valor, numero) => plural(valor, { one: `${numero} day`, other: `${numero} days` }),
  diasDespues: (valor, numero) =>
    plural(valor, { one: `${numero} day late`, other: `${numero} days late` }),
  diasAntes: (valor, numero) =>
    plural(valor, { one: `${numero} day early`, other: `${numero} days early` }),
  elMismoDia: 'on the estimated day',
  trabajos: (cantidad) => plural(cantidad, { one: '# job', other: '# jobs' }),
  sinDatos: 'No data yet',
  sinFechaEstimada: 'No estimated date to compare',
  enLaMediana: (desvio) => `${desvio} (median)`,
  medianaDeLosDias: (mediana, minimo, maximo) => `${mediana} (median), from ${minimo} to ${maximo}`,
  variosDias: (lista) => `${lista} days`,
  precision: {
    titulo: 'How accurate your estimates are',
    bajada: "Each job's first estimated date against the day you delivered it.",
    sinEntregas: "You haven't delivered any job with an estimated date to compare yet.",
    pocos: (cantidad) =>
      plural(cantidad, {
        one: 'One job is still too few to work anything out: look at it on its own.',
        other: '# jobs are still too few to work anything out: look at them one by one.',
      }),
    elMismoDia: 'In the median, you deliver on the day you estimated.',
    despues: (valor, numero) =>
      plural(valor, {
        one: `In the median, you deliver ${numero} day after your estimate.`,
        other: `In the median, you deliver ${numero} days after your estimate.`,
      }),
    antes: (valor, numero) =>
      plural(valor, {
        one: `In the median, you deliver ${numero} day before your estimate.`,
        other: `In the median, you deliver ${numero} days before your estimate.`,
      }),
    extremos: (adelantado, atrasado) => `Earliest: ${adelantado}; latest: ${atrasado}.`,
    aciertos: (acertados, total) => `You got ${acertados} of ${total} right.`,
    aciertosConPorcentaje: (acertados, total, porcentaje) =>
      `You got ${acertados} of ${total} right (${porcentaje}%).`,
    acertarEs: (margen) =>
      plural(margen, {
        one: 'Getting it right means delivering up to # day early or late.',
        other: 'Getting it right means delivering up to # days early or late.',
      }),
    cumplidas: (cumplidas, total) => `You kept ${cumplidas} of ${total} confirmed delivery dates.`,
    cumplidasConPorcentaje: (cumplidas, total, porcentaje) =>
      `You kept ${cumplidas} of ${total} confirmed delivery dates (${porcentaje}%).`,
    importadas: (cantidad) =>
      plural(cantidad, {
        one: 'For # job, the estimate is the one it had when the app started keeping date history, not necessarily the first one you gave.',
        other:
          'For # jobs, the estimate is the one they had when the app started keeping date history, not necessarily the first one you gave.',
      }),
  },
  porTipo: {
    titulo: 'How long you take by job type',
    bajada: (umbral) =>
      plural(umbral, {
        one: 'With fewer than # job of a type, you see each one; from there on, the median.',
        other: 'With fewer than # jobs of a type, you see each one; from there on, the median.',
      }),
    ninguno:
      "No delivered job has a job type. Add it on the job page with Edit, and you'll see them grouped here.",
    sinTipo: (cantidad) =>
      plural(cantidad, {
        one: '# job has no type: add it on its job page so it counts here.',
        other: '# jobs have no type: add it on their job pages so they count here.',
      }),
    delArranqueALaEntrega: 'Start to delivery',
    delArranqueAListo: 'Start to ready',
    contraLoEstimado: 'Against the estimate',
  },
  porCarga: {
    titulo: 'By how many jobs you had in progress',
    bajada: 'Start to delivery, by how many other jobs were in the shop when you approved it.',
    entre: (desde, hasta) => `${desde} or ${hasta} in progress`,
    oMas: (desde) => `${desde} or more in progress`,
  },
  trabajoPorTrabajo: {
    titulo: 'Job by job',
    bajada: (cantidad) =>
      plural(cantidad, {
        one: '# job delivered, newest first.',
        other: '# jobs delivered, newest first.',
      }),
    esconder: 'Hide the numbers',
    ver: 'Show the numbers',
    sinTipo: 'No type',
    estimada: 'Estimated',
    sinFecha: 'No date',
    entregado: 'Delivered',
    entregadoConDesvio: (fecha, desvio) => `${fecha}, ${desvio}`,
    comprometida: 'Confirmed',
    cumplida: (fecha) => `${fecha}, kept`,
    noCumplida: (fecha) => `${fecha}, missed`,
    tardo: 'Took',
    sinDiaDeEntrega: (cantidad) =>
      plural(cantidad, {
        one: "# delivered job without a delivery date isn't counted.",
        other: "# delivered jobs without a delivery date aren't counted.",
      }),
  },
} satisfies Mensajes['paginaAnalitico'];
