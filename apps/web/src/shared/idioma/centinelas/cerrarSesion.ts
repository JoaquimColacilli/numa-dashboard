import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'cerrarSesion.hayCambiosSinSincronizar': {
    llamar: (m) => m.cerrarSesion.hayCambiosSinSincronizar({ cantidad: 7 }),
    tieneQueDecir: ['7'],
  },
  'cerrarSesion.hayCambiosDeEsteTelefono': {
    llamar: (m) => m.cerrarSesion.hayCambiosDeEsteTelefono({ cantidad: 7 }),
    tieneQueDecir: ['7'],
  },
  'cerrarSesion.siEntrasConOtraCuenta': {
    llamar: (m) => m.cerrarSesion.siEntrasConOtraCuenta({ cantidad: 7 }),
    tieneQueDecir: [],
  },
  'cerrarSesion.paraNoPerderlosSinSenal': {
    llamar: (m) => m.cerrarSesion.paraNoPerderlosSinSenal({ cantidad: 7 }),
    tieneQueDecir: [],
  },
  'cerrarSesion.paraNoPerderlosConSenal': {
    llamar: (m) => m.cerrarSesion.paraNoPerderlosConSenal({ cantidad: 7 }),
    tieneQueDecir: [],
  },
  'cerrarSesion.borrarYSalir': {
    llamar: (m) => m.cerrarSesion.borrarYSalir({ cantidad: 7 }),
    tieneQueDecir: ['7'],
  },
};
