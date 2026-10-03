import type { Centinelas } from '../centinelas';

const DOS_LADOS = ['«DESDE»', '«QUEDA DESDE»', '«HACIA»', '«QUEDA HACIA»'] as const;

export const centinelas: Centinelas = {
  'movimiento.ayuda.gastoTesoro': {
    llamar: (m) => m.movimiento.ayuda.gastoTesoro('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'movimiento.ayuda.entreTesoros': {
    llamar: (m) => m.movimiento.ayuda.entreTesoros('«DESDE»', '«HACIA»'),
    tieneQueDecir: ['«DESDE»', '«HACIA»'],
  },
  'movimiento.ayuda.elHogarQueda': {
    llamar: (m) => m.movimiento.ayuda.elHogarQueda('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.elHogarQuedaEnNegativo': {
    llamar: (m) => m.movimiento.ayuda.elHogarQuedaEnNegativo('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.elTallerQueda': {
    llamar: (m) => m.movimiento.ayuda.elTallerQueda('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.elTallerQuedaEnNegativo': {
    llamar: (m) => m.movimiento.ayuda.elTallerQuedaEnNegativo('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.cocosQueda': {
    llamar: (m) => m.movimiento.ayuda.cocosQueda('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.cocosQuedaEnNegativo': {
    llamar: (m) => m.movimiento.ayuda.cocosQuedaEnNegativo('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.cocosQuedaDeLaMeta': {
    llamar: (m) => m.movimiento.ayuda.cocosQuedaDeLaMeta('«SALDO»', '«META»'),
    tieneQueDecir: ['«SALDO»', '«META»'],
  },
  'movimiento.ayuda.teVanAQuedarPorPagar': {
    llamar: (m) => m.movimiento.ayuda.teVanAQuedarPorPagar('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'movimiento.ayuda.tePasas': {
    llamar: (m) => m.movimiento.ayuda.tePasas('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
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
  'movimiento.diezmo.debesElImporte': {
    llamar: (m) => m.movimiento.diezmo.debesElImporte('«IMPORTE»'),
    tieneQueDecir: ['«IMPORTE»'],
  },
  'movimiento.diezmo.pagasteElImporteDeMas': {
    llamar: (m) => m.movimiento.diezmo.pagasteElImporteDeMas('«IMPORTE»'),
    tieneQueDecir: ['«IMPORTE»'],
  },
  'movimiento.ficha.verElTrabajo': {
    llamar: (m) => m.movimiento.ficha.verElTrabajo('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
  'movimiento.libro.conElDolarA': {
    llamar: (m) => m.movimiento.libro.conElDolarA('«DÓLAR»'),
    tieneQueDecir: ['«DÓLAR»'],
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
