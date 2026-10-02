import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'registrarMovimiento.cambio.teQuedoA': {
    llamar: (m) => m.registrarMovimiento.cambio.teQuedoA('«DÓLAR»'),
    tieneQueDecir: ['«DÓLAR»'],
  },
  'registrarMovimiento.cambio.teLoPagaronA': {
    llamar: (m) => m.registrarMovimiento.cambio.teLoPagaronA('«DÓLAR»'),
    tieneQueDecir: ['«DÓLAR»'],
  },
};
