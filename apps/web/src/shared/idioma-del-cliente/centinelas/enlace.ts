import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'enlace.encuestaDe': {
    llamar: (m) => m.enlace.encuestaDe('«TALLER»'),
    tieneQueDecir: ['«TALLER»'],
  },
};
