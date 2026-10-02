import type { TextosDeLasEscalas, TipoDePregunta } from '@maun/domain';

export const opinion = {
  tipos: {
    escala5: { etiqueta: 'Escala de cinco', descripcion: 'Cinco caritas con su palabra' },
    sitalvezno: { etiqueta: 'Sí / tal vez / no', descripcion: 'Tres botones' },
    una: { etiqueta: 'Una sola opción', descripcion: 'Elige una entre varias' },
    varias: { etiqueta: 'Varias opciones', descripcion: 'Puede elegir más de una' },
    texto: { etiqueta: 'Texto libre', descripcion: 'Escribe lo que quiera' },
  } satisfies Readonly<Record<TipoDePregunta, { etiqueta: string; descripcion: string }>>,
  cuantasRespuestas: (cantidad: number): string =>
    cantidad === 1 ? '1 respuesta' : `${String(cantidad)} respuestas`,
  preguntaPropia: 'Pregunta propia de este trabajo',
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
