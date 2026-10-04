import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'facturacion.resumen.conectada': {
    llamar: (m) => m.facturacion.resumen.conectada('«PUNTO DE VENTA»'),
    tieneQueDecir: ['«PUNTO DE VENTA»', 'ARCA'],
  },
  'facturacion.conexion.anda': {
    llamar: (m) => m.facturacion.conexion.anda('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»', 'ARCA', 'NUMA'],
  },
  'facturacion.conexion.esperando': {
    llamar: (m) => m.facturacion.conexion.esperando('«HORA»'),
    tieneQueDecir: ['«HORA»', 'ARCA'],
  },
  'facturacion.conexion.vence': {
    llamar: (m) => m.facturacion.conexion.vence('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'facturacion.datos.ingresosBrutosLargo': {
    llamar: (m) => m.facturacion.datos.ingresosBrutosLargo(40),
    tieneQueDecir: ['40'],
  },
  'facturacion.concepto.muebles': {
    llamar: (m) => m.facturacion.concepto.muebles('«PRECIO»'),
    tieneQueDecir: ['«PRECIO»'],
  },
  'facturacion.categoria.opcion': {
    llamar: (m) => m.facturacion.categoria.opcion('«LETRA»', '«TOPE»'),
    tieneQueDecir: ['«LETRA»', '«TOPE»'],
  },
  'facturacion.cambios.cuantos': {
    llamar: (m) => m.facturacion.cambios.cuantos(7),
    tieneQueDecir: ['7'],
  },
  'facturacion.asistente.paso': {
    llamar: (m) => m.facturacion.asistente.paso(7),
    tieneQueDecir: ['7'],
  },
  'facturacion.asistente.subir.listo': {
    llamar: (m) => m.facturacion.asistente.subir.listo('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'facturacion.asistente.conectar.motivos.sin-punto-de-venta': {
    llamar: (m) => m.facturacion.asistente.conectar.motivos['sin-punto-de-venta']('«PUNTO»'),
    tieneQueDecir: ['«PUNTO»', 'ARCA'],
  },
  'facturacion.asistente.conectar.motivos.esperando': {
    llamar: (m) => m.facturacion.asistente.conectar.motivos.esperando('«HORA»'),
    tieneQueDecir: ['«HORA»', 'ARCA'],
  },
  'facturacion.renglon.facturarElPago': {
    llamar: (m) => m.facturacion.renglon.facturarElPago('«MONTO»', '«DÍA»'),
    tieneQueDecir: ['«MONTO»', '«DÍA»'],
  },
  'facturacion.renglon.anulando': {
    llamar: (m) => m.facturacion.renglon.anulando('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»'],
  },
  'facturacion.renglon.anulada': {
    llamar: (m) => m.facturacion.renglon.anulada('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'facturacion.renglon.noAnulo': {
    llamar: (m) => m.facturacion.renglon.noAnulo('«MOTIVO»'),
    tieneQueDecir: ['«MOTIVO»', 'ARCA'],
  },
  'facturacion.renglon.rechazada': {
    llamar: (m) => m.facturacion.renglon.rechazada('«MOTIVO»'),
    tieneQueDecir: ['«MOTIVO»', 'ARCA'],
  },
  'facturacion.motivos.deArca': {
    llamar: (m) => m.facturacion.motivos.deArca('«TEXTO»', '«CÓDIGO»'),
    tieneQueDecir: ['«TEXTO»', '«CÓDIGO»'],
  },
  'facturacion.anuncios.autorizada': {
    llamar: (m) => m.facturacion.anuncios.autorizada('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»'],
  },
  'facturacion.anuncios.anulada': {
    llamar: (m) => m.facturacion.anuncios.anulada('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»'],
  },
  'facturacion.anuncios.notaRechazada': {
    llamar: (m) => m.facturacion.anuncios.notaRechazada('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»', 'ARCA'],
  },
  'facturacion.facturar.hoy': {
    llamar: (m) => m.facturacion.facturar.hoy('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'facturacion.facturar.cuit': {
    llamar: (m) => m.facturacion.facturar.cuit('«CUIT»'),
    tieneQueDecir: ['CUIT «CUIT»'],
  },
  'facturacion.facturar.dni': {
    llamar: (m) => m.facturacion.facturar.dni('«DNI»'),
    tieneQueDecir: ['DNI «DNI»'],
  },
  'facturacion.facturar.queFacturas': {
    llamar: (m) => m.facturacion.facturar.queFacturas('«QUÉ»'),
    tieneQueDecir: ['«QUÉ»'],
  },
  'facturacion.facturar.conFechaDeHoy': {
    llamar: (m) => m.facturacion.facturar.conFechaDeHoy('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'facturacion.facturar.conEstaFactura': {
    llamar: (m) => m.facturacion.facturar.conEstaFactura('«LLEVÁS»', '«LETRA»', '«TOPE»'),
    tieneQueDecir: ['«LLEVÁS»', '«LETRA»', '«TOPE»', '12'],
  },
  'facturacion.facturar.emitir': {
    llamar: (m) => m.facturacion.facturar.emitir('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'facturacion.factura.anuladaCon': {
    llamar: (m) => m.facturacion.factura.anuladaCon('«NÚMERO»', '«DÍA»'),
    tieneQueDecir: ['«NÚMERO»', '«DÍA»'],
  },
  'facturacion.factura.aRevisar': {
    llamar: (m) => m.facturacion.factura.aRevisar('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»', 'ARCA', 'Mis Comprobantes › Emitidos'],
  },
  'facturacion.factura.notaARevisar': {
    llamar: (m) => m.facturacion.factura.notaARevisar('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»', 'ARCA', 'Mis Comprobantes › Emitidos'],
  },
  'facturacion.anular.pregunta': {
    llamar: (m) => m.facturacion.anular.pregunta('«NÚMERO»'),
    tieneQueDecir: ['C «NÚMERO»'],
  },
  'facturacion.anular.texto': {
    llamar: (m) => m.facturacion.anular.texto('«MONTO»', '«CLIENTE»'),
    tieneQueDecir: ['«MONTO»', '«CLIENTE»', 'ARCA'],
  },
  'facturacion.cobro.aNombreDe': {
    llamar: (m) => m.facturacion.cobro.aNombreDe('«NOMBRE»', '«CONDICIÓN»'),
    tieneQueDecir: ['«NOMBRE»', '«CONDICIÓN»'],
  },
  'facturacion.monotributo.cerca': {
    llamar: (m) => m.facturacion.monotributo.cerca('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'facturacion.monotributo.pasado': {
    llamar: (m) => m.facturacion.monotributo.pasado('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
};
