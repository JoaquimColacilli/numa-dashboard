import type { Centinelas, LlamadaCentinela } from '../centinelas';

const FRANJAS = ['manana', 'tarde', 'me_da_igual'] as const;

const DE_LAS_FRANJAS: Centinelas = Object.fromEntries(
  FRANJAS.map((franja): [string, LlamadaCentinela] => [
    `atenderLaRespuesta.propone.${franja}`,
    {
      llamar: (m) => m.atenderLaRespuesta.propone[franja]('«DÍA»'),
      tieneQueDecir: ['«DÍA»'],
    },
  ]),
);

export const centinelas: Centinelas = {
  ...DE_LAS_FRANJAS,
  'atenderLaRespuesta.aproboLaOpcion': {
    llamar: (m) => m.atenderLaRespuesta.aproboLaOpcion('«NOMBRE»', '«LETRA»'),
    tieneQueDecir: ['«NOMBRE»', '«LETRA»'],
  },
  'atenderLaRespuesta.aproboElEstimativo': {
    llamar: (m) => m.atenderLaRespuesta.aproboElEstimativo('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'atenderLaRespuesta.aproboElPresupuesto': {
    llamar: (m) => m.atenderLaRespuesta.aproboElPresupuesto('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'atenderLaRespuesta.respondioEl': {
    llamar: (m) => m.atenderLaRespuesta.respondioEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
};
