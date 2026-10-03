import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'registrarMovimiento.cubreElMes': {
    llamar: (m) => m.registrarMovimiento.cubreElMes('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'registrarMovimiento.seVaABorrar': {
    llamar: (m) => m.registrarMovimiento.seVaABorrar('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'registrarMovimiento.cambio.teQuedoA': {
    llamar: (m) => m.registrarMovimiento.cambio.teQuedoA('«DÓLAR»'),
    tieneQueDecir: ['«DÓLAR»'],
  },
  'registrarMovimiento.cambio.teLoPagaronA': {
    llamar: (m) => m.registrarMovimiento.cambio.teLoPagaronA('«DÓLAR»'),
    tieneQueDecir: ['«DÓLAR»'],
  },
};
