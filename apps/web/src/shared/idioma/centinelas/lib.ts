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
  'lib.loQueFaltaParaFacturar.clienteSinCuit': {
    llamar: (m) => m.lib.loQueFaltaParaFacturar.clienteSinCuit('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»', 'CUIT'],
  },
  'lib.loQueFaltaParaFacturar.clienteCuitInvalido': {
    llamar: (m) => m.lib.loQueFaltaParaFacturar.clienteCuitInvalido('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»', 'CUIT'],
  },
  'lib.loQueFaltaParaFacturar.clienteSinDomicilio': {
    llamar: (m) => m.lib.loQueFaltaParaFacturar.clienteSinDomicilio('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'lib.loQueFaltaParaFacturar.clienteSinDni': {
    llamar: (m) => m.lib.loQueFaltaParaFacturar.clienteSinDni('«UMBRAL»'),
    tieneQueDecir: ['«UMBRAL»', 'ARCA', 'DNI', 'CUIT'],
  },
  'lib.loQueFaltaParaFacturar.taller': {
    llamar: (m) => m.lib.loQueFaltaParaFacturar.taller('«LO QUE FALTA»'),
    tieneQueDecir: ['«LO QUE FALTA»'],
  },
};
