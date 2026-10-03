import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'editarCliente.condicionYComprobante': {
    llamar: (m) => m.editarCliente.condicionYComprobante('«CONDICIÓN»', '«COMPROBANTE»'),
    tieneQueDecir: ['«CONDICIÓN»', '«COMPROBANTE»'],
  },
};
