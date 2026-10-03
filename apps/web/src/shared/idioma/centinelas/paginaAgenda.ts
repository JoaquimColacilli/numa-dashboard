import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'paginaAgenda.hoyEs': {
    llamar: (m) => m.paginaAgenda.hoyEs('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaAgenda.anotarAlgoPara': {
    llamar: (m) => m.paginaAgenda.anotarAlgoPara('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaAgenda.verElDia': {
    llamar: (m) => m.paginaAgenda.verElDia('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaAgenda.hastaAca': {
    llamar: (m) => m.paginaAgenda.hastaAca('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'paginaAgenda.elDia': {
    llamar: (m) => m.paginaAgenda.elDia('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
};
