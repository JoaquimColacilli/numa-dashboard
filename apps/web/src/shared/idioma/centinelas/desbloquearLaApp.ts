import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'desbloquearLaApp.holaConNombre': {
    llamar: (m) => m.desbloquearLaApp.holaConNombre({ nombre: '«NOMBRE»' }),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'desbloquearLaApp.teMandamosUnEnlace': {
    llamar: (m) => m.desbloquearLaApp.teMandamosUnEnlace({ email: '«MAIL»' }),
    tieneQueDecir: ['«MAIL»'],
  },
};
