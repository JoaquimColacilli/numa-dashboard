export { lineaDeLaReferencia, referenciaDelDocumento } from './armado';
export { descargarElArchivo, sePuedenCompartirArchivos } from './entregar';
export { IDIOMA_DE_LA_LEYENDA, LETRA_DE_ARCA, LEYENDA_DE_ARCA_EN_UNA_FRASE } from './leyenda';
export { useTextosDelPdf, type TextosDelPdf } from './textos';
export type {
  AceptacionEnPdf,
  EmisorEnPdf,
  FacturaEnPdf,
  PresupuestoEnPdf,
  ReceptorEnPdf,
} from './tipos';
export {
  DEMORA_PARA_PREPARAR_MS,
  olvidarLosPdfGuardados,
  usePdfDelPresupuesto,
  type BotonDelPdf,
  type EstadoDelPdf,
  type OpcionesDelPdf,
  type PdfDelPresupuesto,
} from './usePdf';
export {
  nombreDelArchivoDe as nombreDelArchivoDeLaFacturaEnPdf,
  olvidarLasFacturasGuardadas,
  usePdfDeLaFactura,
  type OpcionesDelPdfDeLaFactura,
  type PdfDeLaFactura,
} from './usePdfDeLaFactura';
