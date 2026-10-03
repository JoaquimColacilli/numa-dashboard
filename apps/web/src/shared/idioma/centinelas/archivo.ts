import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'archivo.noSePuedeSubir': {
    llamar: (m) => m.archivo.noSePuedeSubir('«NOMBRE»', '«QUÉ SE SUBE»'),
    tieneQueDecir: ['«NOMBRE»', '«QUÉ SE SUBE»'],
  },
  'archivo.pdfMuyPesado': {
    llamar: (m) => m.archivo.pdfMuyPesado('«NOMBRE»', '«PESO»'),
    tieneQueDecir: ['«NOMBRE»', '«PESO»'],
  },
  'archivo.conElNombre': {
    llamar: (m) => m.archivo.conElNombre('«NOMBRE»', '«MOTIVO»'),
    tieneQueDecir: ['«NOMBRE»', '«MOTIVO»'],
  },
  'archivo.noSeSubio': {
    llamar: (m) => m.archivo.noSeSubio('«NOMBRE»', '«MOTIVO»'),
    tieneQueDecir: ['«NOMBRE»', '«MOTIVO»'],
  },
};
