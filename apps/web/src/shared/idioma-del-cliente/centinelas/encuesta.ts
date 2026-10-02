import type { ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

const envoltorio = ({ children }: { children: ReactNode }): ReactNode => children;

export const centinelas: Centinelas = {
  'encuesta.pestanaDe': {
    llamar: (m) => m.encuesta.pestanaDe('«TALLER»'),
    tieneQueDecir: ['«TALLER»'],
  },
  'encuesta.formulario.titulo': {
    llamar: (m) => m.encuesta.formulario.titulo(envoltorio, 'escritorio'),
    tieneQueDecir: ['escritorio'],
  },
  'encuesta.formulario.bajada': {
    llamar: (m) => m.encuesta.formulario.bajada(37, 41, 59),
    tieneQueDecir: ['37', '59'],
  },
  'encuesta.formulario.faltan': {
    llamar: (m) => m.encuesta.formulario.faltan(37),
    tieneQueDecir: ['37'],
  },
  'encuesta.gracias.conElNombre': {
    llamar: (m) => m.encuesta.gracias.conElNombre(envoltorio, '«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'encuesta.yaContestaste.texto': {
    llamar: (m) => m.encuesta.yaContestaste.texto('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
};
