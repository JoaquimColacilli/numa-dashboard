import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'armarLaVidriera.botonDeSumar': {
    llamar: (m) => m.armarLaVidriera.botonDeSumar(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.sinCompartir': {
    llamar: (m) => m.armarLaVidriera.sinCompartir(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.exceso': {
    llamar: (m) => m.armarLaVidriera.exceso(59, 37),
    tieneQueDecir: ['59', '37'],
  },
  'armarLaVidriera.corteAlSumar': {
    llamar: (m) => m.armarLaVidriera.corteAlSumar(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.corteAlSubir': {
    llamar: (m) => m.armarLaVidriera.corteAlSubir(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.noSePudoCopiar': {
    llamar: (m) => m.armarLaVidriera.noSePudoCopiar('«MOTIVO»'),
    tieneQueDecir: ['«MOTIVO»'],
  },
  'armarLaVidriera.origen.deTrabajo': {
    llamar: (m) => m.armarLaVidriera.origen.deTrabajo('«TÍTULO»'),
    tieneQueDecir: ['«TÍTULO»'],
  },
  'armarLaVidriera.fotos.llena': {
    llamar: (m) => m.armarLaVidriera.fotos.llena(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.fotos.deTantas': {
    llamar: (m) => m.armarLaVidriera.fotos.deTantas(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.fotos.fotoDe': {
    llamar: (m) => m.armarLaVidriera.fotos.fotoDe(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.hoja.entranMas': {
    llamar: (m) => m.armarLaVidriera.hoja.entranMas(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.hoja.sumaste': {
    llamar: (m) => m.armarLaVidriera.hoja.sumaste(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.hoja.fotoDelTrabajo': {
    llamar: (m) => m.armarLaVidriera.hoja.fotoDelTrabajo(37, '«TÍTULO»'),
    tieneQueDecir: ['37', '«TÍTULO»'],
  },
  'armarLaVidriera.hoja.sumando': {
    llamar: (m) => m.armarLaVidriera.hoja.sumando(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.hoja.subiendo': {
    llamar: (m) => m.armarLaVidriera.hoja.subiendo(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'armarLaVidriera.hoja.elegisteTodas': {
    llamar: (m) => m.armarLaVidriera.hoja.elegisteTodas(37),
    tieneQueDecir: ['37'],
  },
  'armarLaVidriera.hoja.elegisteDe': {
    llamar: (m) => m.armarLaVidriera.hoja.elegisteDe(37, 59),
    tieneQueDecir: ['37', '59'],
  },
};
