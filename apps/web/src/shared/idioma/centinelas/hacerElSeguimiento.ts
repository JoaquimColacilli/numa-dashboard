import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'hacerElSeguimiento.errores.notaLarga': {
    llamar: (m) => m.hacerElSeguimiento.errores.notaLarga(500),
    tieneQueDecir: ['500'],
  },
  'hacerElSeguimiento.registrarElContacto.contactarA': {
    llamar: (m) => m.hacerElSeguimiento.registrarElContacto.contactarA('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'hacerElSeguimiento.registrarElContacto.leTocabaEl': {
    llamar: (m) => m.hacerElSeguimiento.registrarElContacto.leTocabaEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'hacerElSeguimiento.registrarElContacto.leTocabaElConNota': {
    llamar: (m) => m.hacerElSeguimiento.registrarElContacto.leTocabaElConNota('«FECHA»', '«NOTA»'),
    tieneQueDecir: ['«FECHA»', '«NOTA»'],
  },
};
