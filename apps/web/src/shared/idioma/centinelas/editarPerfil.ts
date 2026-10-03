import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'editarPerfil.hastaTantasLetras': {
    llamar: (m) => m.editarPerfil.hastaTantasLetras({ maximo: 60 }),
    tieneQueDecir: ['60'],
  },
};
