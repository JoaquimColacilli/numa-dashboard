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
  'ui.dolar.usarElDelDia': {
    llamar: (m) => m.ui.dolar.usarElDelDia('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'ui.dolar.usarLaCompra': {
    llamar: (m) => m.ui.dolar.usarLaCompra('«CASA»', '«MONTO»'),
    tieneQueDecir: ['«CASA»', '«MONTO»'],
  },
  'ui.dolar.usarLaVenta': {
    llamar: (m) => m.ui.dolar.usarLaVenta('«CASA»', '«MONTO»'),
    tieneQueDecir: ['«CASA»', '«MONTO»'],
  },
  'ui.dolar.fueraDeRango': {
    llamar: (m) => m.ui.dolar.fueraDeRango('«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
};
