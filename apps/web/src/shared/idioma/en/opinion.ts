import type { Mensajes } from '../es';
import { plural } from './plural';

export const opinion = {
  tipos: {
    escala5: { etiqueta: 'Five-point scale', descripcion: 'Five faces, each with its word' },
    sitalvezno: { etiqueta: 'Yes / maybe / no', descripcion: 'Three buttons' },
    una: { etiqueta: 'Single choice', descripcion: 'They pick one of several' },
    varias: { etiqueta: 'Multiple choice', descripcion: 'They can pick more than one' },
    texto: { etiqueta: 'Free text', descripcion: 'They write whatever they want' },
  },
  cuantasRespuestas: (cantidad) => plural(cantidad, { one: '# answer', other: '# answers' }),
  preguntaPropia: 'Custom question for this job',
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
} satisfies Mensajes['opinion'];
