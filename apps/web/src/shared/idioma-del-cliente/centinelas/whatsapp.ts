import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'whatsapp.comoVa.conNombre': {
    llamar: (m) => m.whatsapp.comoVa.conNombre('«NOMBRE»', '«trabajo»', '«URL»'),
    tieneQueDecir: ['«NOMBRE»', '«trabajo»', '«URL»'],
  },
  'whatsapp.comoVa.sinNombre': {
    llamar: (m) => m.whatsapp.comoVa.sinNombre('«trabajo»', '«URL»'),
    tieneQueDecir: ['«trabajo»', '«URL»'],
  },
  'whatsapp.comoVaYComoPagarlo.conNombre': {
    llamar: (m) => m.whatsapp.comoVaYComoPagarlo.conNombre('«NOMBRE»', '«trabajo»', '«URL»'),
    tieneQueDecir: ['«NOMBRE»', '«trabajo»', '«URL»'],
  },
  'whatsapp.comoVaYComoPagarlo.sinNombre': {
    llamar: (m) => m.whatsapp.comoVaYComoPagarlo.sinNombre('«trabajo»', '«URL»'),
    tieneQueDecir: ['«trabajo»', '«URL»'],
  },
};
