import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'crearCuenta.contrasenaCorta': {
    llamar: (m) => m.crearCuenta.contrasenaCorta({ minimo: 6 }),
    tieneQueDecir: ['6'],
  },
  'crearCuenta.alMenos': {
    llamar: (m) => m.crearCuenta.alMenos({ minimo: 6 }),
    tieneQueDecir: ['6'],
  },
};
