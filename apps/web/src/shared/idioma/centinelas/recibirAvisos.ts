import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'recibirAvisos.diasAntes': {
    llamar: (m) => m.recibirAvisos.diasAntes({ dias: 3 }),
    tieneQueDecir: ['3'],
  },
  'recibirAvisos.salioHoy': {
    llamar: (m) => m.recibirAvisos.salioHoy({ hora: '«HORA»' }),
    tieneQueDecir: ['«HORA»'],
  },
  'recibirAvisos.salioAyer': {
    llamar: (m) => m.recibirAvisos.salioAyer({ hora: '«HORA»' }),
    tieneQueDecir: ['«HORA»'],
  },
  'recibirAvisos.salioElDia': {
    llamar: (m) => m.recibirAvisos.salioElDia({ fecha: '«FECHA»', hora: '«HORA»' }),
    tieneQueDecir: ['«FECHA»', '«HORA»'],
  },
  'recibirAvisos.tambienLlegan': {
    llamar: (m) => m.recibirAvisos.tambienLlegan({ otros: 4 }),
    tieneQueDecir: ['4'],
  },
  'recibirAvisos.zonaConDesfase': {
    llamar: (m) => m.recibirAvisos.zonaConDesfase({ lugar: '«LUGAR»', desfase: '«DESFASE»' }),
    tieneQueDecir: ['«LUGAR»', '«DESFASE»'],
  },
  'recibirAvisos.aLasTeLlega': {
    llamar: (m) => m.recibirAvisos.aLasTeLlega({ hora: '«HORA»' }),
    tieneQueDecir: ['«HORA»'],
  },
  'recibirAvisos.anticipacionDe': {
    llamar: (m) => m.recibirAvisos.anticipacionDe({ aviso: '«AVISO»' }),
    tieneQueDecir: ['«AVISO»'],
  },
};
