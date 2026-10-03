import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'verNovedades.version': {
    llamar: (m) => m.verNovedades.version('2031-07-19', 3),
    tieneQueDecir: ['2031', '19', '(3)'],
  },
};
