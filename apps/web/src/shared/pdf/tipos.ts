import type {
  CondicionDelReceptor,
  DocumentoDelPresupuesto,
  Idioma,
  Moneda,
  Money,
  TipoDeComprobante,
  TipoDeDocumento,
} from '@maun/domain';

export interface AceptacionEnPdf {
  el: string | null;
  letra: string | null;
  acordado: Money<Moneda> | null;
}

export interface PresupuestoEnPdf {
  documento: DocumentoDelPresupuesto;
  idioma: Idioma;
  numero: string | null;
  revision: number;
  mandadoEl: string | null;
  valeHasta: string | null;
  queCambio: string | null;
  aceptado: AceptacionEnPdf | null;
  borrador: boolean;
}

export interface EmisorEnPdf {
  nombreDelTaller: string;
  razonSocial: string;
  domicilio: string;
  cuit: string;
  ingresosBrutos: string;
  inicioDeActividades: string | null;
}

export interface ReceptorEnPdf {
  nombre: string;
  condicion: CondicionDelReceptor;
  docTipo: TipoDeDocumento;
  docNro: string;
  domicilio: string;
}

export interface FacturaEnPdf {
  tipo: TipoDeComprobante;
  prueba: boolean;
  puntoDeVenta: number;
  numero: number;
  fecha: string;
  cae: string;
  caeVence: string;
  importe: Money;
  detalle: string;
  emisor: EmisorEnPdf;
  receptor: ReceptorEnPdf;
  anulaA: { puntoDeVenta: number; numero: number; fecha: string } | null;
}

export type PedidoAlTrabajador =
  { id: number; presupuesto: PresupuestoEnPdf } | { id: number; factura: FacturaEnPdf };

export type RespuestaDelTrabajador =
  { id: number; listo: true; bytes: ArrayBuffer } | { id: number; listo: false; motivo: string };
