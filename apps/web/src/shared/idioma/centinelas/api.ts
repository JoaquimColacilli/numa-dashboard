import type { Centinelas } from '../centinelas';

const TRABAJO = ['«TRABAJO»'] as const;

export const centinelas: Centinelas = {
  'api.accesoConCodigo': {
    llamar: (m) => m.api.accesoConCodigo('«CÓDIGO»'),
    tieneQueDecir: ['«CÓDIGO»'],
  },
  'api.rechazos.trabajo': {
    llamar: (m) => m.api.rechazos.trabajo('«TÍTULO»'),
    tieneQueDecir: ['«TÍTULO»'],
  },
  'api.rechazos.MN001.cobro.cobrado': {
    llamar: (m) => m.api.rechazos.MN001.cobro.cobrado(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN001.cobro.perdido': {
    llamar: (m) => m.api.rechazos.MN001.cobro.perdido(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN001.baja.cobrado': {
    llamar: (m) => m.api.rechazos.MN001.baja.cobrado(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN001.baja.perdido': {
    llamar: (m) => m.api.rechazos.MN001.baja.perdido(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN001.otro.cobrado': {
    llamar: (m) => m.api.rechazos.MN001.otro.cobrado(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN001.otro.perdido': {
    llamar: (m) => m.api.rechazos.MN001.otro.perdido(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN002.titulo': {
    llamar: (m) => m.api.rechazos.MN002.titulo(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN003.titulo': {
    llamar: (m) => m.api.rechazos.MN003.titulo('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'api.rechazos.MN006.cambio': {
    llamar: (m) => m.api.rechazos.MN006.cambio(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN007.cobro.titulo': {
    llamar: (m) => m.api.rechazos.MN007.cobro.titulo(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN007.cierre.titulo': {
    llamar: (m) => m.api.rechazos.MN007.cierre.titulo(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN007.reapertura': {
    llamar: (m) => m.api.rechazos.MN007.reapertura(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN007.reactivacion': {
    llamar: (m) => m.api.rechazos.MN007.reactivacion(...TRABAJO),
    tieneQueDecir: TRABAJO,
  },
  'api.rechazos.MN021.noSeGuardoNada': {
    llamar: (m) => m.api.rechazos.MN021.noSeGuardoNada('«LO QUE DICE LA BASE»'),
    tieneQueDecir: ['«LO QUE DICE LA BASE»'],
  },
  'api.rechazos.MN024.titulo': {
    llamar: (m) => m.api.rechazos.MN024.titulo('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
};
