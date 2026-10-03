import type { ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

const cita = ({ children }: { children: ReactNode }): ReactNode => children;

export const centinelas: Centinelas = {
  'paginaOpiniones.sinEnviar.detalleConTerminados': {
    llamar: (m) => m.paginaOpiniones.sinEnviar.detalleConTerminados(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.sinRespuestas.preguntaste': {
    llamar: (m) => m.paginaOpiniones.sinRespuestas.preguntaste(37, '«CUÁNDO»'),
    tieneQueDecir: ['37', '«CUÁNDO»'],
  },
  'paginaOpiniones.titular.promedioDe': {
    llamar: (m) => m.paginaOpiniones.titular.promedioDe(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.titular.contestaron': {
    llamar: (m) => m.paginaOpiniones.titular.contestaron('«TASA»'),
    tieneQueDecir: ['«TASA»'],
  },
  'paginaOpiniones.titular.variosPuntosConTope': {
    llamar: (m) => m.paginaOpiniones.titular.variosPuntosConTope(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.porcentaje': {
    llamar: (m) => m.paginaOpiniones.porcentaje(37, 59, 83),
    tieneQueDecir: ['37', '59', '83'],
  },
  'paginaOpiniones.comentarios.escribieronAlgo': {
    llamar: (m) => m.paginaOpiniones.comentarios.escribieronAlgo(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'paginaOpiniones.preguntas.deAUna': {
    llamar: (m) => m.paginaOpiniones.preguntas.deAUna(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.preguntas.mezcladas': {
    llamar: (m) => m.paginaOpiniones.preguntas.mezcladas(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.preguntas.antesDecia': {
    llamar: (m) => m.paginaOpiniones.preguntas.antesDecia(cita, '«TEXTO»', 37, '«HASTA»'),
    tieneQueDecir: ['«TEXTO»', '37', '«HASTA»'],
  },
  'paginaOpiniones.enElTiempo.sinEvolucion': {
    llamar: (m) => m.paginaOpiniones.enElTiempo.sinEvolucion(37),
    tieneQueDecir: ['37'],
  },
  'paginaOpiniones.enElTiempo.tira': {
    llamar: (m) => m.paginaOpiniones.enElTiempo.tira(37, '«DESDE»', '«HASTA»'),
    tieneQueDecir: ['37', '«DESDE»', '«HASTA»'],
  },
  'paginaOpiniones.trabajos.contesto': {
    llamar: (m) => m.paginaOpiniones.trabajos.contesto('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaOpiniones.trabajos.leMandaste': {
    llamar: (m) => m.paginaOpiniones.trabajos.leMandaste('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaOpiniones.trabajos.propias': {
    llamar: (m) => m.paginaOpiniones.trabajos.propias(37),
    tieneQueDecir: ['37'],
  },
};
