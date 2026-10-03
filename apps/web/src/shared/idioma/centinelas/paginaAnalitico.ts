import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'paginaAnalitico.dias': {
    llamar: (m) => m.paginaAnalitico.dias(2, '«DOS»'),
    tieneQueDecir: ['«DOS»'],
  },
  'paginaAnalitico.diasDespues': {
    llamar: (m) => m.paginaAnalitico.diasDespues(2, '«DOS»'),
    tieneQueDecir: ['«DOS»'],
  },
  'paginaAnalitico.diasAntes': {
    llamar: (m) => m.paginaAnalitico.diasAntes(2, '«DOS»'),
    tieneQueDecir: ['«DOS»'],
  },
  'paginaAnalitico.trabajos': {
    llamar: (m) => m.paginaAnalitico.trabajos(3),
    tieneQueDecir: ['3'],
  },
  'paginaAnalitico.enLaMediana': {
    llamar: (m) => m.paginaAnalitico.enLaMediana('«DESVÍO»'),
    tieneQueDecir: ['«DESVÍO»'],
  },
  'paginaAnalitico.medianaDeLosDias': {
    llamar: (m) => m.paginaAnalitico.medianaDeLosDias('«MEDIANA»', '«MÍNIMO»', '«MÁXIMO»'),
    tieneQueDecir: ['«MEDIANA»', '«MÍNIMO»', '«MÁXIMO»'],
  },
  'paginaAnalitico.variosDias': {
    llamar: (m) => m.paginaAnalitico.variosDias('«LISTA»'),
    tieneQueDecir: ['«LISTA»'],
  },
  'paginaAnalitico.precision.pocos': {
    llamar: (m) => m.paginaAnalitico.precision.pocos(4),
    tieneQueDecir: ['4'],
  },
  'paginaAnalitico.precision.despues': {
    llamar: (m) => m.paginaAnalitico.precision.despues(2, '«DOS»'),
    tieneQueDecir: ['«DOS»'],
  },
  'paginaAnalitico.precision.antes': {
    llamar: (m) => m.paginaAnalitico.precision.antes(2, '«DOS»'),
    tieneQueDecir: ['«DOS»'],
  },
  'paginaAnalitico.precision.extremos': {
    llamar: (m) => m.paginaAnalitico.precision.extremos('«ADELANTADO»', '«ATRASADO»'),
    tieneQueDecir: ['«ADELANTADO»', '«ATRASADO»'],
  },
  'paginaAnalitico.precision.aciertos': {
    llamar: (m) => m.paginaAnalitico.precision.aciertos('«ACERTADOS»', '«TOTAL»'),
    tieneQueDecir: ['«ACERTADOS»', '«TOTAL»'],
  },
  'paginaAnalitico.precision.aciertosConPorcentaje': {
    llamar: (m) =>
      m.paginaAnalitico.precision.aciertosConPorcentaje('«ACERTADOS»', '«TOTAL»', '«PORCENTAJE»'),
    tieneQueDecir: ['«ACERTADOS»', '«TOTAL»', '«PORCENTAJE»'],
  },
  'paginaAnalitico.precision.acertarEs': {
    llamar: (m) => m.paginaAnalitico.precision.acertarEs(3),
    tieneQueDecir: ['3'],
  },
  'paginaAnalitico.precision.cumplidas': {
    llamar: (m) => m.paginaAnalitico.precision.cumplidas('«CUMPLIDAS»', '«TOTAL»'),
    tieneQueDecir: ['«CUMPLIDAS»', '«TOTAL»'],
  },
  'paginaAnalitico.precision.cumplidasConPorcentaje': {
    llamar: (m) =>
      m.paginaAnalitico.precision.cumplidasConPorcentaje('«CUMPLIDAS»', '«TOTAL»', '«PORCENTAJE»'),
    tieneQueDecir: ['«CUMPLIDAS»', '«TOTAL»', '«PORCENTAJE»'],
  },
  'paginaAnalitico.precision.importadas': {
    llamar: (m) => m.paginaAnalitico.precision.importadas(2),
    tieneQueDecir: ['2'],
  },
  'paginaAnalitico.porTipo.bajada': {
    llamar: (m) => m.paginaAnalitico.porTipo.bajada(5),
    tieneQueDecir: ['5'],
  },
  'paginaAnalitico.porTipo.sinTipo': {
    llamar: (m) => m.paginaAnalitico.porTipo.sinTipo(2),
    tieneQueDecir: ['2'],
  },
  'paginaAnalitico.porCarga.entre': {
    llamar: (m) => m.paginaAnalitico.porCarga.entre('«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
  'paginaAnalitico.porCarga.oMas': {
    llamar: (m) => m.paginaAnalitico.porCarga.oMas('«DESDE»'),
    tieneQueDecir: ['«DESDE»'],
  },
  'paginaAnalitico.trabajoPorTrabajo.bajada': {
    llamar: (m) => m.paginaAnalitico.trabajoPorTrabajo.bajada(6),
    tieneQueDecir: ['6'],
  },
  'paginaAnalitico.trabajoPorTrabajo.entregadoConDesvio': {
    llamar: (m) => m.paginaAnalitico.trabajoPorTrabajo.entregadoConDesvio('«FECHA»', '«DESVÍO»'),
    tieneQueDecir: ['«FECHA»', '«DESVÍO»'],
  },
  'paginaAnalitico.trabajoPorTrabajo.cumplida': {
    llamar: (m) => m.paginaAnalitico.trabajoPorTrabajo.cumplida('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaAnalitico.trabajoPorTrabajo.noCumplida': {
    llamar: (m) => m.paginaAnalitico.trabajoPorTrabajo.noCumplida('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaAnalitico.trabajoPorTrabajo.sinDiaDeEntrega': {
    llamar: (m) => m.paginaAnalitico.trabajoPorTrabajo.sinDiaDeEntrega(2),
    tieneQueDecir: ['2'],
  },
};
