import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'ui.rotulo.numero': {
    llamar: (m) => m.ui.rotulo.numero('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'ui.visor.cuenta': {
    llamar: (m) => m.ui.visor.cuenta('«ACTUAL»', '«TOTAL»'),
    tieneQueDecir: ['«ACTUAL»', '«TOTAL»'],
  },
};
