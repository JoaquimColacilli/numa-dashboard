import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'whatsappDeLaEncuesta.pedido': {
    llamar: (m) => m.whatsappDeLaEncuesta.pedido('«NOMBRE»', 'escritorio', '«ENLACE»'),
    tieneQueDecir: ['«NOMBRE»', 'escritorio', '«ENLACE»'],
  },
  'whatsappDeLaEncuesta.recordatorio': {
    llamar: (m) => m.whatsappDeLaEncuesta.recordatorio('«NOMBRE»', 'escritorio', '«ENLACE»'),
    tieneQueDecir: ['«NOMBRE»', 'escritorio', '«ENLACE»'],
  },
};
