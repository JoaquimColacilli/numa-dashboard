import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'editarTesoro.archivar.deSiempre': {
    llamar: (m) => m.editarTesoro.archivar.deSiempre('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.enLaFila': {
    llamar: (m) => m.editarTesoro.archivar.enLaFila('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.enUnCobroReabierto': {
    llamar: (m) => m.editarTesoro.archivar.enUnCobroReabierto('«TESORO»', '«TRABAJO»'),
    tieneQueDecir: ['«TESORO»', '«TRABAJO»'],
  },
  'editarTesoro.archivar.loQueTenia': {
    llamar: (m) => m.editarTesoro.archivar.loQueTenia('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.loQueLeFaltaba': {
    llamar: (m) => m.editarTesoro.archivar.loQueLeFaltaba('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.titulo': {
    llamar: (m) => m.editarTesoro.archivar.titulo('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.tiene': {
    llamar: (m) => m.editarTesoro.archivar.tiene('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'editarTesoro.archivar.todaviaNo': {
    llamar: (m) => m.editarTesoro.archivar.todaviaNo('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.sinPlata': {
    llamar: (m) => m.editarTesoro.archivar.sinPlata('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.conPlata': {
    llamar: (m) => m.editarTesoro.archivar.conPlata('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.debe': {
    llamar: (m) => m.editarTesoro.archivar.debe('«MONTO»', '«TESORO»'),
    tieneQueDecir: ['«MONTO»', '«TESORO»'],
  },
  'editarTesoro.archivar.quedaEn': {
    llamar: (m) => m.editarTesoro.archivar.quedaEn('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'editarTesoro.archivar.tieneEnLaLista': {
    llamar: (m) => m.editarTesoro.archivar.tieneEnLaLista('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'editarTesoro.archivar.archivar': {
    llamar: (m) => m.editarTesoro.archivar.archivar('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.archivar.pasarA': {
    llamar: (m) => m.editarTesoro.archivar.pasarA('«MONTO»', '«DESTINO»'),
    tieneQueDecir: ['«MONTO»', '«DESTINO»'],
  },
  'editarTesoro.archivar.pasarDesde': {
    llamar: (m) => m.editarTesoro.archivar.pasarDesde('«MONTO»', '«ORIGEN»'),
    tieneQueDecir: ['«MONTO»', '«ORIGEN»'],
  },
  'editarTesoro.campos.tambienLaUsa': {
    llamar: (m) => m.editarTesoro.campos.tambienLaUsa('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.errores.nombre': {
    llamar: (m) => m.editarTesoro.errores.nombre(37),
    tieneQueDecir: ['37'],
  },
  'editarTesoro.errores.descripcion': {
    llamar: (m) => m.editarTesoro.errores.descripcion(37),
    tieneQueDecir: ['37'],
  },
  'editarTesoro.errores.porcentajeDeLaObligacion': {
    llamar: (m) => m.editarTesoro.errores.porcentajeDeLaObligacion('«MÍNIMO»', '«MÁXIMO»'),
    tieneQueDecir: ['«MÍNIMO»', '«MÁXIMO»'],
  },
  'editarTesoro.errores.porcentajeDelReparto': {
    llamar: (m) => m.editarTesoro.errores.porcentajeDelReparto('«MÍNIMO»', '«LIBRE»'),
    tieneQueDecir: ['«MÍNIMO»', '«LIBRE»'],
  },
  'editarTesoro.lugar.obligacionesLlenas': {
    llamar: (m) => m.editarTesoro.lugar.obligacionesLlenas(37),
    tieneQueDecir: ['37'],
  },
  'editarTesoro.lugar.pasosLlenos': {
    llamar: (m) => m.editarTesoro.lugar.pasosLlenos(37),
    tieneQueDecir: ['37'],
  },
  'editarTesoro.lugar.repartoLleno': {
    llamar: (m) => m.editarTesoro.lugar.repartoLleno(37),
    tieneQueDecir: ['37'],
  },
  'editarTesoro.lugar.superavit': {
    llamar: (m) => m.editarTesoro.lugar.superavit('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.lugar.despuesDe': {
    llamar: (m) => m.editarTesoro.lugar.despuesDe('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'editarTesoro.lugar.libre': {
    llamar: (m) => m.editarTesoro.lugar.libre('«LIBRE»'),
    tieneQueDecir: ['«LIBRE»'],
  },
  'editarTesoro.lugar.libreHastaCien': {
    llamar: (m) => m.editarTesoro.lugar.libreHastaCien('«LIBRE»', '«PORCENTAJE»'),
    tieneQueDecir: ['«LIBRE»', '«PORCENTAJE»'],
  },
  'editarTesoro.lugar.libreConResto': {
    llamar: (m) =>
      m.editarTesoro.lugar.libreConResto('«LIBRE»', '«PORCENTAJE»', '«TESORO»', '«RESTO»'),
    tieneQueDecir: ['«LIBRE»', '«PORCENTAJE»', '«TESORO»', '«RESTO»'],
  },
};
