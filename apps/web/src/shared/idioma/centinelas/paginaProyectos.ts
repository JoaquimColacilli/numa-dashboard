import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'paginaProyectos.comun.contactarA': {
    llamar: (m) => m.paginaProyectos.comun.contactarA('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'paginaProyectos.comun.fechaYCuando': {
    llamar: (m) => m.paginaProyectos.comun.fechaYCuando('«FECHA»', '«CUÁNDO»'),
    tieneQueDecir: ['«FECHA»', '«CUÁNDO»'],
  },
  'paginaProyectos.ficha.cobrarElSaldo': {
    llamar: (m) => m.paginaProyectos.ficha.cobrarElSaldo('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'paginaProyectos.ficha.cuantosPagos': {
    llamar: (m) => m.paginaProyectos.ficha.cuantosPagos(3),
    tieneQueDecir: ['3'],
  },
  'paginaProyectos.ficha.cuantosGastos': {
    llamar: (m) => m.paginaProyectos.ficha.cuantosGastos(3),
    tieneQueDecir: ['3'],
  },
  'paginaProyectos.contacto.vencioEl': {
    llamar: (m) => m.paginaProyectos.contacto.vencioEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaProyectos.contacto.siNoSaleConSena': {
    llamar: (m) => m.paginaProyectos.contacto.siNoSaleConSena('«SEÑA»'),
    tieneQueDecir: ['«SEÑA»'],
  },
  'paginaProyectos.seguimiento.leTocaba': {
    llamar: (m) => m.paginaProyectos.seguimiento.leTocaba('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaProyectos.seguimiento.leVolvesAEscribir': {
    llamar: (m) => m.paginaProyectos.seguimiento.leVolvesAEscribir('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaProyectos.seguimiento.siNoSaleConSena': {
    llamar: (m) => m.paginaProyectos.seguimiento.siNoSaleConSena('«SEÑA»'),
    tieneQueDecir: ['«SEÑA»'],
  },
  'paginaProyectos.lista.ningunoCoincide': {
    llamar: (m) => m.paginaProyectos.lista.ningunoCoincide('«BÚSQUEDA»'),
    tieneQueDecir: ['«BÚSQUEDA»'],
  },
  'paginaProyectos.consultas.ningunoCoincide': {
    llamar: (m) => m.paginaProyectos.consultas.ningunoCoincide('«BÚSQUEDA»'),
    tieneQueDecir: ['«BÚSQUEDA»'],
  },
  'paginaProyectos.listaDeSeguimiento.atrasado': {
    llamar: (m) => m.paginaProyectos.listaDeSeguimiento.atrasado('«FECHA»', '«CUÁNDO»'),
    tieneQueDecir: ['«FECHA»', '«CUÁNDO»'],
  },
  'paginaProyectos.listaDeSeguimiento.elDia': {
    llamar: (m) => m.paginaProyectos.listaDeSeguimiento.elDia('«FECHA»', '«CUÁNDO»'),
    tieneQueDecir: ['«FECHA»', '«CUÁNDO»'],
  },
  'paginaProyectos.listaDeSeguimiento.nadieCoincide': {
    llamar: (m) => m.paginaProyectos.listaDeSeguimiento.nadieCoincide('«BÚSQUEDA»'),
    tieneQueDecir: ['«BÚSQUEDA»'],
  },
  'paginaProyectos.vistaCliente.volverA': {
    llamar: (m) => m.paginaProyectos.vistaCliente.volverA('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
};
