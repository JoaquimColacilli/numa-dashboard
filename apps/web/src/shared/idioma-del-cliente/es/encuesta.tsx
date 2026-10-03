import {
  elMueble,
  enPalabras,
  type Genero,
  type MotivoDelRechazo,
  type TextosDeLasEscalas,
} from '@maun/domain';
import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

function cuantas(n: number, singular: string, plural: string, genero: Genero): string {
  return `${enPalabras(n, genero)} ${n === 1 ? singular : plural}`;
}

function queTiene(preguntas: number, comentarios: number): string {
  if (preguntas > 0) {
    return `${preguntas === 1 ? 'Es' : 'Son'} ${cuantas(preguntas, 'pregunta', 'preguntas', 'femenino')}`;
  }
  if (comentarios > 0) {
    return `${comentarios === 1 ? 'Es' : 'Son'} ${cuantas(comentarios, 'comentario', 'comentarios', 'masculino')}`;
  }
  return 'No tiene preguntas';
}

export const encuesta = {
  pestana: 'Encuesta',
  pestanaDe: (taller: string): string => `Encuesta de ${taller}`,
  abriendo: 'Abriendo la encuesta',
  sinSenal: {
    titulo: 'Sin conexión',
    texto: 'Necesitás señal para abrir la encuesta. Probá de nuevo cuando vuelva.',
  },
  error: {
    titulo: 'No pudimos abrir la encuesta',
    texto: 'Se cortó la conexión. El enlace sigue siendo válido, probá de nuevo.',
    reintentar: 'Probar de nuevo',
  },
  muerto: {
    titulo: 'Este enlace ya no funciona',
    texto:
      'Los enlaces que manda el taller duran un tiempo y después se dan de baja. Si querés dejar tu opinión, pedile uno nuevo a quien te lo pasó.',
  },
  alMandar: {
    sinSenal:
      'No se pudo mandar: se cortó la conexión. Lo que marcaste sigue acá; probá de nuevo cuando vuelva la señal.',
    noSeGuardo: 'No pudimos guardar tu opinión. Probá de nuevo en un rato.',
    cambioLaEncuesta:
      'Mientras contestabas, el taller cambió una de las preguntas. Ya está al día: revisá lo que marcaste y mandala de nuevo.',
    motivos: {
      forma: 'La respuesta no tiene la forma que espera la encuesta',
      ajena: 'Vino una respuesta a una pregunta que no es de esta encuesta',
      repetida: 'Vino dos veces la respuesta a la misma pregunta',
      tipo: 'Una respuesta no es del tipo que pide su pregunta',
      rango: 'Una respuesta está fuera de las opciones de su pregunta',
      vacio: 'Vino una respuesta vacía',
      largo: 'Un texto pasa de los 2000 caracteres que acepta la encuesta',
      obligatoria: 'Falta contestar una pregunta obligatoria',
    } satisfies Readonly<Record<MotivoDelRechazo, string>>,
  },
  formulario: {
    lema: 'Muebles a medida',
    titulo: (Trabajo: Envoltorio, trabajo: string): ReactNode => (
      <>
        ¿Cómo te fue con tu <Trabajo>{elMueble(trabajo)}</Trabajo>?
      </>
    ),
    bajada: (preguntas: number, comentarios: number, minutos: number): string =>
      `${queTiene(preguntas, comentarios)} y te lleva menos de ${cuantas(minutos, 'minuto', 'minutos', 'masculino')}. Lo lee el dueño del taller.`,
    avisoDeFirma:
      'Como el enlace es de tu trabajo, el taller va a saber que esto lo contestaste vos. Contá lo que pensás igual: para eso lo mandamos.',
    ayudaDelComentario: 'Es opcional, pero es lo que más nos sirve.',
    loQueSeTeOcurra: 'Lo que se te ocurra. Si no, dejalo vacío y mandá igual.',
    faltaEscribir: 'Falta esta. Escribí algo para seguir.',
    faltaElegir: 'Falta esta. Tocá una opción para seguir.',
    faltan: (preguntas: number): string =>
      preguntas === 1
        ? 'Te falta una pregunta, está marcada más arriba.'
        : `Te faltan ${String(preguntas)} preguntas, están marcadas más arriba.`,
    nombre: 'Encuesta',
    mandando: 'Mandando…',
    mandar: 'Mandar mi opinión',
    unaSolaVez: 'Se manda una sola vez y no se puede editar después.',
  },
  gracias: {
    titulo: 'Gracias',
    conElNombre: (Nombre: Envoltorio, nombre: string): ReactNode => (
      <>
        Gracias, <Nombre>{nombre}</Nombre>
      </>
    ),
    texto:
      'Lo leemos nosotros, no un sistema. Lo que nos marcaste nos sirve para el próximo mueble.',
    resena: {
      pregunta: '¿Nos dejás la misma reseña en Google?',
      texto:
        'Se lo pedimos a todos los clientes, contesten lo que contesten. A un taller chico le cambia bastante.',
      dejarla: 'Dejar una reseña',
    },
  },
  yaContestaste: {
    titulo: 'Ya nos contaste, gracias',
    texto: (fecha: string): string =>
      `Contestaste el ${fecha}. Esto es lo que pusiste. No se puede cambiar, pero si te quedó algo en el tintero, escribinos.`,
  },
  escalas: {
    conformidad: {
      1: { etiqueta: 'Nada conforme', corta: 'Nada' },
      2: { etiqueta: 'Poco conforme', corta: 'Poco' },
      3: { etiqueta: 'Ni bien ni mal', corta: 'Así nomás' },
      4: { etiqueta: 'Conforme', corta: 'Conforme' },
      5: { etiqueta: 'Muy conforme', corta: 'Muy conforme' },
    },
    tiempos: {
      1: { etiqueta: 'Llegó muy tarde', corta: 'Muy tarde' },
      2: { etiqueta: 'Se atrasó', corta: 'Se atrasó' },
      3: { etiqueta: 'Más o menos a tiempo', corta: 'Más o menos' },
      4: { etiqueta: 'Llegó cuando dijeron', corta: 'A tiempo' },
      5: { etiqueta: 'Llegó antes de lo pautado', corta: 'Antes' },
    },
    trato: {
      1: { etiqueta: 'Costaba mucho', corta: 'Costaba' },
      2: { etiqueta: 'Costaba un poco', corta: 'Un poco' },
      3: { etiqueta: 'Ni bien ni mal', corta: 'Ni bien ni mal' },
      4: { etiqueta: 'Fácil', corta: 'Fácil' },
      5: { etiqueta: 'Muy fácil', corta: 'Muy fácil' },
    },
    sitalvezno: {
      1: { etiqueta: 'No', corta: 'No' },
      2: { etiqueta: 'Tal vez', corta: 'Tal vez' },
      3: { etiqueta: 'Sí, sin dudarlo', corta: 'Sí' },
    },
  } satisfies TextosDeLasEscalas,
} as const;
