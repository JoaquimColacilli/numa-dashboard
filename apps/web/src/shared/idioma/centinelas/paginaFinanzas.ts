import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'paginaFinanzas.contra': {
    llamar: (m) => m.paginaFinanzas.contra('«ACTUAL»', '«PREVIO»'),
    tieneQueDecir: ['«ACTUAL»', '«PREVIO»'],
  },
  'paginaFinanzas.mesYAnio': {
    llamar: (m) => m.paginaFinanzas.mesYAnio('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
};
