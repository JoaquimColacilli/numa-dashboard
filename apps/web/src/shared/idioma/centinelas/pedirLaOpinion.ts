import type { ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

const enlace = ({ children }: { children: ReactNode }): ReactNode => children;

export const centinelas: Centinelas = {
  'pedirLaOpinion.darDeBaja.texto': {
    llamar: (m) => m.pedirLaOpinion.darDeBaja.texto('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'pedirLaOpinion.pie': {
    llamar: (m) => m.pedirLaOpinion.pie(enlace),
    tieneQueDecir: [],
  },
  'pedirLaOpinion.contestada.titulo': {
    llamar: (m) => m.pedirLaOpinion.contestada.titulo('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'pedirLaOpinion.contestada.contestoEl': {
    llamar: (m) => m.pedirLaOpinion.contestada.contestoEl('«DÍA»', 37),
    tieneQueDecir: ['«DÍA»', '37'],
  },
  'pedirLaOpinion.contestada.comentario': {
    llamar: (m) => m.pedirLaOpinion.contestada.comentario('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'pedirLaOpinion.mandada.leLlego': {
    llamar: (m) => m.pedirLaOpinion.mandada.leLlego('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'pedirLaOpinion.mandada.yaLeRecordaste': {
    llamar: (m) => m.pedirLaOpinion.mandada.yaLeRecordaste('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'pedirLaOpinion.sinMandar.titulo': {
    llamar: (m) => m.pedirLaOpinion.sinMandar.titulo('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'pedirLaOpinion.sinMandar.queTiene': {
    llamar: (m) => m.pedirLaOpinion.sinMandar.queTiene(37, 41, 59),
    tieneQueDecir: ['37', '41', '59'],
  },
  'pedirLaOpinion.sinMandar.noSeCreo': {
    llamar: (m) => m.pedirLaOpinion.sinMandar.noSeCreo('«MOTIVO»'),
    tieneQueDecir: ['«MOTIVO»'],
  },
  'pedirLaOpinion.propias.cuantas': {
    llamar: (m) => m.pedirLaOpinion.propias.cuantas(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'pedirLaOpinion.propias.sacar': {
    llamar: (m) => m.pedirLaOpinion.propias.sacar('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'pedirLaOpinion.propias.queLePreguntas': {
    llamar: (m) => m.pedirLaOpinion.propias.queLePreguntas('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'pedirLaOpinion.propias.yaContesto': {
    llamar: (m) => m.pedirLaOpinion.propias.yaContesto('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
};
