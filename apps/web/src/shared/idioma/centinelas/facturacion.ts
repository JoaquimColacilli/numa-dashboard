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
};
