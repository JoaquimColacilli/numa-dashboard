import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'replica.noSeSincronizo': {
    llamar: (m) => m.replica.noSeSincronizo('«DETALLE»'),
    tieneQueDecir: ['«DETALLE»'],
  },
};
