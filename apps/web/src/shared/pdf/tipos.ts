import type { DocumentoDelPresupuesto, Moneda, Money } from '@maun/domain';

export interface AceptacionEnPdf {
  el: string | null;
  letra: string | null;
  acordado: Money<Moneda> | null;
}

export interface PresupuestoEnPdf {
  documento: DocumentoDelPresupuesto;
  numero: string | null;
  revision: number;
  mandadoEl: string | null;
  valeHasta: string | null;
  queCambio: string | null;
  aceptado: AceptacionEnPdf | null;
  borrador: boolean;
}

export interface PedidoAlTrabajador {
  id: number;
  presupuesto: PresupuestoEnPdf;
}

export type RespuestaDelTrabajador =
  { id: number; listo: true; bytes: ArrayBuffer } | { id: number; listo: false; motivo: string };
