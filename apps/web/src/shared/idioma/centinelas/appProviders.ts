import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'appProviders.seGuardaronLasAnotadas': {
    llamar: (m) => m.appProviders.seGuardaronLasAnotadas({ veces: 7 }),
    tieneQueDecir: ['7'],
  },
  'appProviders.anotadasSinSenal': {
    llamar: (m) => m.appProviders.anotadasSinSenal({ veces: 7 }),
    tieneQueDecir: ['7'],
  },
  'appProviders.estabaAnotadoSinSenal': {
    llamar: (m) => m.appProviders.estabaAnotadoSinSenal({ hecho: '«HECHO»' }),
    tieneQueDecir: ['«HECHO»'],
  },
};
