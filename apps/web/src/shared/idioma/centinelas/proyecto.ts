import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'proyecto.consultas.irARelevarEl': {
    llamar: (m) => m.proyecto.consultas.irARelevarEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'proyecto.consultas.visitaDentroDe': {
    llamar: (m) => m.proyecto.consultas.visitaDentroDe('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.estimativoSinRespuesta': {
    llamar: (m) => m.proyecto.consultas.estimativoSinRespuesta('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.relevamientoSinFecha': {
    llamar: (m) => m.proyecto.consultas.relevamientoSinFecha('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.laVisitaFue': {
    llamar: (m) => m.proyecto.consultas.laVisitaFue('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.aPresupuestarDesde': {
    llamar: (m) => m.proyecto.consultas.aPresupuestarDesde('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.faltaPresupuestarConTareas': {
    llamar: (m) => m.proyecto.consultas.faltaPresupuestarConTareas(2, 7),
    tieneQueDecir: ['2', '7'],
  },
  'proyecto.consultas.valiaHasta': {
    llamar: (m) => m.proyecto.consultas.valiaHasta('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'proyecto.consultas.presupuestoSinRespuesta': {
    llamar: (m) => m.proyecto.consultas.presupuestoSinRespuesta('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.consultas.contactoSinVisita': {
    llamar: (m) => m.proyecto.consultas.contactoSinVisita('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.corte.sinCorte': {
    llamar: (m) => m.proyecto.corte.sinCorte('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'proyecto.corte.sinNadaCobrado': {
    llamar: (m) => m.proyecto.corte.sinNadaCobrado(4, '«MES»'),
    tieneQueDecir: ['4', '«MES»'],
  },
  'proyecto.corte.sinIngreso': {
    llamar: (m) => m.proyecto.corte.sinIngreso(4, '«MES»'),
    tieneQueDecir: ['4', '«MES»'],
  },
  'proyecto.corte.repartido': {
    llamar: (m) => m.proyecto.corte.repartido(4, '«MES»', '«PARTES»'),
    tieneQueDecir: ['4', '«MES»', '«PARTES»'],
  },
  'proyecto.corte.repartidoConGastos': {
    llamar: (m) => m.proyecto.corte.repartidoConGastos(4, '«MES»', '«PARTES»'),
    tieneQueDecir: ['4', '«MES»', '«PARTES»'],
  },
  'proyecto.corte.alHogar': {
    llamar: (m) => m.proyecto.corte.alHogar('«PARTE»'),
    tieneQueDecir: ['«PARTE»'],
  },
  'proyecto.corte.alTaller': {
    llamar: (m) => m.proyecto.corte.alTaller('«PARTE»'),
    tieneQueDecir: ['«PARTE»'],
  },
  'proyecto.corte.alDiezmo': {
    llamar: (m) => m.proyecto.corte.alDiezmo('«PARTE»'),
    tieneQueDecir: ['«PARTE»'],
  },
  'proyecto.corte.aOtroTesoro': {
    llamar: (m) => m.proyecto.corte.aOtroTesoro('«PARTE»', '«TESORO»'),
    tieneQueDecir: ['«PARTE»', '«TESORO»'],
  },
  'proyecto.despiece.diezmo': {
    llamar: (m) => m.proyecto.despiece.diezmo('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.despiece.diezmoSobreLoCobrado': {
    llamar: (m) => m.proyecto.despiece.diezmoSobreLoCobrado('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.despiece.diezmoSobreElIngreso': {
    llamar: (m) => m.proyecto.despiece.diezmoSobreElIngreso('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.despiece.obligacion': {
    llamar: (m) => m.proyecto.despiece.obligacion('«TESORO»', '«PORCENTAJE»'),
    tieneQueDecir: ['«TESORO»', '«PORCENTAJE»'],
  },
  'proyecto.despiece.obligacionSobreLoCobrado': {
    llamar: (m) => m.proyecto.despiece.obligacionSobreLoCobrado('«TESORO»', '«PORCENTAJE»'),
    tieneQueDecir: ['«TESORO»', '«PORCENTAJE»'],
  },
  'proyecto.despiece.obligacionSobreElIngreso': {
    llamar: (m) => m.proyecto.despiece.obligacionSobreElIngreso('«TESORO»', '«PORCENTAJE»'),
    tieneQueDecir: ['«TESORO»', '«PORCENTAJE»'],
  },
  'proyecto.despiece.deLoQueSobra': {
    llamar: (m) => m.proyecto.despiece.deLoQueSobra('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.distribucion.aTesoro': {
    llamar: (m) => m.proyecto.distribucion.aTesoro('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'proyecto.distribucion.detalle': {
    llamar: (m) => m.proyecto.distribucion.detalle('«ETIQUETA»', '«MONTO»'),
    tieneQueDecir: ['«ETIQUETA»', '«MONTO»'],
  },
  'proyecto.distribucion.detalleATesoro': {
    llamar: (m) => m.proyecto.distribucion.detalleATesoro('«ETIQUETA»', '«TESORO»', '«MONTO»'),
    tieneQueDecir: ['«ETIQUETA»', '«TESORO»', '«MONTO»'],
  },
  'proyecto.distribucion.faltan': {
    llamar: (m) => m.proyecto.distribucion.faltan('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'proyecto.distribucion.cobradosMenosGastos': {
    llamar: (m) => m.proyecto.distribucion.cobradosMenosGastos('«COBRADO»', '«GASTOS»'),
    tieneQueDecir: ['«COBRADO»', '«GASTOS»'],
  },
  'proyecto.entrega.conFranja.manana': {
    llamar: (m) => m.proyecto.entrega.conFranja.manana('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'proyecto.entrega.conFranja.tarde': {
    llamar: (m) => m.proyecto.entrega.conFranja.tarde('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'proyecto.entrega.vencida': {
    llamar: (m) => m.proyecto.entrega.vencida('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.entrega.enDias': {
    llamar: (m) => m.proyecto.entrega.enDias(9),
    tieneQueDecir: ['9'],
  },
  'proyecto.entrega.conFranjaComprometida': {
    llamar: (m) => m.proyecto.entrega.conFranjaComprometida('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'proyecto.formulario.demasiadoLargo': {
    llamar: (m) => m.proyecto.formulario.demasiadoLargo(200),
    tieneQueDecir: ['200'],
  },
  'proyecto.insumos.tallerPuso': {
    llamar: (m) => m.proyecto.insumos.tallerPuso('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'proyecto.liquidacion.diferencia': {
    llamar: (m) => m.proyecto.liquidacion.diferencia('«TESORO»', '«ESPERADO»', '«QUEDÓ»'),
    tieneQueDecir: ['«TESORO»', '«ESPERADO»', '«QUEDÓ»'],
  },
  'proyecto.liquidacion.diferenciaPorLoQueTenia': {
    llamar: (m) =>
      m.proyecto.liquidacion.diferenciaPorLoQueTenia(
        '«TESORO»',
        '«ESPERADO»',
        '«QUEDÓ»',
        '«TENÍA»',
      ),
    tieneQueDecir: ['«TESORO»', '«ESPERADO»', '«QUEDÓ»', '«TENÍA»'],
  },
  'proyecto.liquidacion.diferenciaPorElMes': {
    llamar: (m) =>
      m.proyecto.liquidacion.diferenciaPorElMes('«TESORO»', '«ESPERADO»', '«QUEDÓ»', '«LLEVABA»'),
    tieneQueDecir: ['«TESORO»', '«ESPERADO»', '«QUEDÓ»', '«LLEVABA»'],
  },
  'proyecto.liquidacion.quedoEnElTaller': {
    llamar: (m) => m.proyecto.liquidacion.quedoEnElTaller('«QUEDÓ»', '«ESPERADO»'),
    tieneQueDecir: ['«QUEDÓ»', '«ESPERADO»'],
  },
  'proyecto.liquidacion.quedoEnElRemanente': {
    llamar: (m) => m.proyecto.liquidacion.quedoEnElRemanente('«QUEDÓ»', '«ESPERADO»'),
    tieneQueDecir: ['«QUEDÓ»', '«ESPERADO»'],
  },
  'proyecto.necesidades.material.casilla': {
    llamar: (m) => m.proyecto.necesidades.material.casilla('«NECESIDAD»'),
    tieneQueDecir: ['«NECESIDAD»'],
  },
  'proyecto.necesidades.material.cuantosListos': {
    llamar: (m) => m.proyecto.necesidades.material.cuantosListos(2, 7),
    tieneQueDecir: ['2', '7'],
  },
  'proyecto.necesidades.herraje.casilla': {
    llamar: (m) => m.proyecto.necesidades.herraje.casilla('«NECESIDAD»'),
    tieneQueDecir: ['«NECESIDAD»'],
  },
  'proyecto.necesidades.herraje.cuantosListos': {
    llamar: (m) => m.proyecto.necesidades.herraje.cuantosListos(2, 7),
    tieneQueDecir: ['2', '7'],
  },
  'proyecto.necesidades.herramienta.casilla': {
    llamar: (m) => m.proyecto.necesidades.herramienta.casilla('«NECESIDAD»'),
    tieneQueDecir: ['«NECESIDAD»'],
  },
  'proyecto.necesidades.herramienta.cuantosListos': {
    llamar: (m) => m.proyecto.necesidades.herramienta.cuantosListos(2, 7),
    tieneQueDecir: ['2', '7'],
  },
  'proyecto.obra.entregaComprometida': {
    llamar: (m) => m.proyecto.obra.entregaComprometida('«FECHA»', '«CUÁNDO»'),
    tieneQueDecir: ['«FECHA»', '«CUÁNDO»'],
  },
  'proyecto.obra.listoDesde': {
    llamar: (m) => m.proyecto.obra.listoDesde('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'proyecto.obra.entregaEstimada': {
    llamar: (m) => m.proyecto.obra.entregaEstimada('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'proyecto.obra.faltaCobrar': {
    llamar: (m) => m.proyecto.obra.faltaCobrar('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'proyecto.obra.entregadoEl': {
    llamar: (m) => m.proyecto.obra.entregadoEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'proyecto.sena.delTrabajo': {
    llamar: (m) => m.proyecto.sena.delTrabajo('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.sena.delTaller': {
    llamar: (m) => m.proyecto.sena.delTaller('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'proyecto.sena.cubiertaDeMas': {
    llamar: (m) => m.proyecto.sena.cubiertaDeMas('«DE MÁS»'),
    tieneQueDecir: ['«DE MÁS»'],
  },
  'proyecto.costosDeCotizar.cargadas': {
    llamar: (m) => m.proyecto.costosDeCotizar.cargadas(2, 7),
    tieneQueDecir: ['2', '7'],
  },
  'proyecto.liquidacionesSinConfirmar.cuentan': {
    llamar: (m) => m.proyecto.liquidacionesSinConfirmar.cuentan(3),
    tieneQueDecir: ['3'],
  },
  'proyecto.insumos.enOtroTesoro': {
    llamar: (m) => m.proyecto.insumos.enOtroTesoro('«MONTO»', '«TESORO»'),
    tieneQueDecir: ['«MONTO»', '«TESORO»'],
  },
  'proyecto.plata.conSuValorEnPesos': {
    llamar: (m) => m.proyecto.plata.conSuValorEnPesos('«PAGADO»', '«EN PESOS»'),
    tieneQueDecir: ['«PAGADO»', '«EN PESOS»'],
  },
  'proyecto.pago.entraAlTesoro': {
    llamar: (m) => m.proyecto.pago.entraAlTesoro('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'proyecto.pago.descuenta': {
    llamar: (m) => m.proyecto.pago.descuenta('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'proyecto.pago.vale': {
    llamar: (m) => m.proyecto.pago.vale('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'proyecto.pago.descontoConElDolar': {
    llamar: (m) => m.proyecto.pago.descontoConElDolar('«MONTO»', '«DÓLAR»'),
    tieneQueDecir: ['«MONTO»', '«DÓLAR»'],
  },
  'proyecto.pago.valioConElDolar': {
    llamar: (m) => m.proyecto.pago.valioConElDolar('«MONTO»', '«DÓLAR»'),
    tieneQueDecir: ['«MONTO»', '«DÓLAR»'],
  },
};
