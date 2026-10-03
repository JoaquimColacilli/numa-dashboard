import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'editarLaEncuesta.deTantas': {
    llamar: (m) => m.editarLaEncuesta.deTantas(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'editarLaEncuesta.version': {
    llamar: (m) => m.editarLaEncuesta.version(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.dejasteDePreguntarla': {
    llamar: (m) => m.editarLaEncuesta.dejasteDePreguntarla('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'editarLaEncuesta.yaPreguntasElTope': {
    llamar: (m) => m.editarLaEncuesta.yaPreguntasElTope(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.llegasteAlTope': {
    llamar: (m) => m.editarLaEncuesta.llegasteAlTope(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.editor.opcion': {
    llamar: (m) => m.editarLaEncuesta.editor.opcion(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.editor.borrarLaOpcion': {
    llamar: (m) => m.editarLaEncuesta.editor.borrarLaOpcion(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.editor.yaLaContestaron': {
    llamar: (m) => m.editarLaEncuesta.editor.yaLaContestaron(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.editor.empezarDeCeroDetalle': {
    llamar: (m) => m.editarLaEncuesta.editor.empezarDeCeroDetalle(37),
    tieneQueDecir: ['37'],
  },
  'editarLaEncuesta.avisos.dejasteDePreguntar': {
    llamar: (m) => m.editarLaEncuesta.avisos.dejasteDePreguntar('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
};
