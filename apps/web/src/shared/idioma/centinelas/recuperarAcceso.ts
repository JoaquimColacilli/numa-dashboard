import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'recuperarAcceso.contrasenaCorta': {
    llamar: (m) => m.recuperarAcceso.contrasenaCorta({ minimo: 6 }),
    tieneQueDecir: ['6'],
  },
  'recuperarAcceso.alMenos': {
    llamar: (m) => m.recuperarAcceso.alMenos({ minimo: 6 }),
    tieneQueDecir: ['6'],
  },
};
