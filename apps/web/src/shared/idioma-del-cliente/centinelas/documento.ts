import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'documento.modificaciones': {
    llamar: (m) => m.documento.modificaciones(7),
    tieneQueDecir: ['7'],
  },
  'documento.meses': {
    llamar: (m) => m.documento.meses(18),
    tieneQueDecir: ['18'],
  },
  'documento.senaAcordada': {
    llamar: (m) => m.documento.senaAcordada('«PORCENTAJE»', '«MONTO»'),
    tieneQueDecir: ['«PORCENTAJE»', '«MONTO»'],
  },
};
