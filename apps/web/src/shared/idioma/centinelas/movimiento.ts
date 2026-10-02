import type { Centinelas } from '../centinelas';

const DOS_LADOS = ['«DESDE»', '«QUEDA DESDE»', '«HACIA»', '«QUEDA HACIA»'] as const;

export const centinelas: Centinelas = {
  'movimiento.ayuda.quedan': {
    llamar: (m) => m.movimiento.ayuda.quedan(...DOS_LADOS),
    tieneQueDecir: DOS_LADOS,
  },
  'movimiento.ayuda.quedanConElPrimeroEnNegativo': {
    llamar: (m) => m.movimiento.ayuda.quedanConElPrimeroEnNegativo(...DOS_LADOS),
    tieneQueDecir: DOS_LADOS,
  },
  'movimiento.ayuda.entraA': {
    llamar: (m) => m.movimiento.ayuda.entraA('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'movimiento.ayuda.queda': {
    llamar: (m) => m.movimiento.ayuda.queda('«TESORO»', '«SALDO»'),
    tieneQueDecir: ['«TESORO»', '«SALDO»'],
  },
  'movimiento.ayuda.quedaEnNegativo': {
    llamar: (m) => m.movimiento.ayuda.quedaEnNegativo('«TESORO»', '«SALDO»'),
    tieneQueDecir: ['«TESORO»', '«SALDO»'],
  },
  'movimiento.cambioEnElLibro': {
    llamar: (m) => m.movimiento.cambioEnElLibro('«SALE»', '«ENTRA»', '«DÓLAR»'),
    tieneQueDecir: ['«SALE»', '«ENTRA»', '«DÓLAR»'],
  },
  'movimiento.equivalenteDeLaCompra': {
    llamar: (m) => m.movimiento.equivalenteDeLaCompra('«PESOS»', '«DÓLAR»', '«FECHA»'),
    tieneQueDecir: ['«PESOS»', '«DÓLAR»', '«FECHA»'],
  },
  'movimiento.equivalenteDeLaVenta': {
    llamar: (m) => m.movimiento.equivalenteDeLaVenta('«PESOS»', '«DÓLAR»', '«FECHA»'),
    tieneQueDecir: ['«PESOS»', '«DÓLAR»', '«FECHA»'],
  },
};
