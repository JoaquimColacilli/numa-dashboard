import type { FacturaDelCliente } from '@maun/domain';

import type { FacturaEnPdf } from '@/shared/pdf';

export function facturaEnPdf(factura: FacturaDelCliente): FacturaEnPdf {
  const { emisor, receptor, anulaA } = factura;
  return {
    tipo: factura.tipo,
    prueba: factura.prueba,
    puntoDeVenta: factura.puntoDeVenta,
    numero: factura.numero,
    fecha: factura.fecha,
    cae: factura.cae,
    caeVence: factura.caeVence,
    importe: factura.importe,
    detalle: factura.detalle,
    emisor: {
      nombreDelTaller: emisor.nombreDelTaller,
      razonSocial: emisor.razonSocial,
      domicilio: emisor.domicilio,
      cuit: emisor.cuit,
      ingresosBrutos: emisor.ingresosBrutos,
      inicioDeActividades: emisor.inicioDeActividades,
    },
    receptor: {
      nombre: receptor.nombre,
      condicion: receptor.condicion,
      docTipo: receptor.docTipo,
      docNro: receptor.docNro,
      domicilio: receptor.domicilio,
    },
    anulaA:
      factura.tipo === 'nota_de_credito_c' && anulaA !== null
        ? { puntoDeVenta: anulaA.puntoDeVenta, numero: anulaA.numero, fecha: anulaA.fecha }
        : null,
  };
}
