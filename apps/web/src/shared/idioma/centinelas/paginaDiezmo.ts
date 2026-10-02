import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const IMPORTE: Envoltorio = ({ children }) => children;

export const centinelas: Centinelas = {
  'paginaDiezmo.debesElImporte': {
    llamar: (m) => m.paginaDiezmo.debesElImporte('«IMPORTE»', IMPORTE),
    tieneQueDecir: ['«IMPORTE»'],
  },
  'paginaDiezmo.pagasteElImporteDeMas': {
    llamar: (m) => m.paginaDiezmo.pagasteElImporteDeMas('«IMPORTE»', IMPORTE),
    tieneQueDecir: ['«IMPORTE»'],
  },
  'paginaDiezmo.yaEstaPagado': {
    llamar: (m) => m.paginaDiezmo.yaEstaPagado(7),
    tieneQueDecir: ['7'],
  },
  'paginaDiezmo.regla.cobrado': {
    llamar: (m) => m.paginaDiezmo.regla.cobrado('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaDiezmo.regla.ingreso': {
    llamar: (m) => m.paginaDiezmo.regla.ingreso('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaDiezmo.todaviaSinDiezmo.cobrado': {
    llamar: (m) => m.paginaDiezmo.todaviaSinDiezmo.cobrado('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaDiezmo.todaviaSinDiezmo.ingreso': {
    llamar: (m) => m.paginaDiezmo.todaviaSinDiezmo.ingreso('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
};
