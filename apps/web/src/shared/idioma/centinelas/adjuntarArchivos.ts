import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'adjuntarArchivos.queVeElCliente': {
    llamar: (m) => m.adjuntarArchivos.queVeElCliente(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'adjuntarArchivos.queVeElClienteTodos': {
    llamar: (m) => m.adjuntarArchivos.queVeElClienteTodos(37),
    tieneQueDecir: ['37'],
  },
  'adjuntarArchivos.ver': {
    llamar: (m) => m.adjuntarArchivos.ver('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'adjuntarArchivos.borrarUno': {
    llamar: (m) => m.adjuntarArchivos.borrarUno('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'adjuntarArchivos.subiendo': {
    llamar: (m) => m.adjuntarArchivos.subiendo(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'adjuntarArchivos.subidos': {
    llamar: (m) => m.adjuntarArchivos.subidos(37),
    tieneQueDecir: ['37'],
  },
  'adjuntarArchivos.borraste': {
    llamar: (m) => m.adjuntarArchivos.borraste('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
};
