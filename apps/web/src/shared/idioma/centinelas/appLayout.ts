import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'appLayout.rechazado': {
    llamar: (m) => m.appLayout.rechazado({ operacion: '«OPERACIÓN»', sujeto: '«SUJETO»' }),
    tieneQueDecir: ['«OPERACIÓN»', '«SUJETO»'],
  },
};
