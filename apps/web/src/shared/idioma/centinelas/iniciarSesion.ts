import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'iniciarSesion.teMandamosElEnlaceDeNuevo': {
    llamar: (m) => m.iniciarSesion.teMandamosElEnlaceDeNuevo({ email: '«MAIL»' }),
    tieneQueDecir: ['«MAIL»'],
  },
};
