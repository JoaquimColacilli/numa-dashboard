import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'fila.ayudas.monto.texto': {
    llamar: (m) => m.fila.ayudas.monto.texto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'fila.ayudas.reparto.conEjemplo': {
    llamar: (m) => m.fila.ayudas.reparto.conEjemplo('«PORCENTAJE»', '«SOBRANTE»', '«PARTE»'),
    tieneQueDecir: ['«PORCENTAJE»', '«SOBRANTE»', '«PARTE»'],
  },
};
