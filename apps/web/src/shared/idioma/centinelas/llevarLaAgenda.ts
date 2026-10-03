import type { Centinelas } from '../centinelas';

const MOVIDAS = ['entrega', 'visita', 'presupuesto', 'seguimiento'] as const;

export const centinelas: Centinelas = {
  ...Object.fromEntries(
    MOVIDAS.map((categoria) => [
      `llevarLaAgenda.movida.${categoria}`,
      {
        llamar: (m) => m.llevarLaAgenda.movida[categoria]('«NOMBRE»', '«DÍA»'),
        tieneQueDecir: ['«NOMBRE»', '«DÍA»'],
      },
    ]),
  ),
  'llevarLaAgenda.anotado': {
    llamar: (m) => m.llevarLaAgenda.anotado('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'llevarLaAgenda.listo': {
    llamar: (m) => m.llevarLaAgenda.listo('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'llevarLaAgenda.borraste': {
    llamar: (m) => m.llevarLaAgenda.borraste('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'llevarLaAgenda.pasoAl': {
    llamar: (m) => m.llevarLaAgenda.pasoAl('«NOMBRE»', '«DÍA»'),
    tieneQueDecir: ['«NOMBRE»', '«DÍA»'],
  },
  'llevarLaAgenda.errores.largoMaximo': {
    llamar: (m) => m.llevarLaAgenda.errores.largoMaximo(37),
    tieneQueDecir: ['37'],
  },
};
