import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'lib.sync.sinConexion': {
    llamar: (m) => m.lib.sync.sinConexion(7),
    tieneQueDecir: ['7'],
  },
  'lib.sync.sincronizando': {
    llamar: (m) => m.lib.sync.sincronizando(7),
    tieneQueDecir: ['7'],
  },
  'lib.sync.rechazados': {
    llamar: (m) => m.lib.sync.rechazados(7),
    tieneQueDecir: ['7'],
  },
};
