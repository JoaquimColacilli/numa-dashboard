import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'ui.mail.reenviarEn': {
    llamar: (m) => m.ui.mail.reenviarEn('«0:42»'),
    tieneQueDecir: ['«0:42»'],
  },
  'ui.mail.mandadoDeNuevo': {
    llamar: (m) => m.ui.mail.mandadoDeNuevo('«MAIL»'),
    tieneQueDecir: ['«MAIL»'],
  },
  'ui.rotulo.numero': {
    llamar: (m) => m.ui.rotulo.numero('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'ui.visor.cuenta': {
    llamar: (m) => m.ui.visor.cuenta('«ESTA»', '«TODAS»'),
    tieneQueDecir: ['«ESTA»', '«TODAS»'],
  },
};
