import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'facturas.anulaA': {
    llamar: (m) => m.facturas.anulaA('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»'],
  },
};
