import {
  idiomaLeido,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Moneda,
  type Money,
  type OpcionDelDocumento,
} from '@maun/domain';

import { NUMERO_PENDIENTE } from '@/entities/presupuesto';
import type { PresupuestoEnPdf } from '@/shared/pdf';

import type { EstadoDeLaTarjeta, RevisionLeida } from './tarjeta';

export function pdfDelBorrador(
  documento: DocumentoDelPresupuesto,
  numero: string | null,
  revision: number,
  idioma: Idioma,
): PresupuestoEnPdf {
  return {
    documento,
    idioma,
    numero,
    revision,
    mandadoEl: null,
    valeHasta: null,
    queCambio: null,
    aceptado: null,
    borrador: true,
  };
}

export function numeroDeLaRevision({ fila }: RevisionLeida): string | null {
  return fila.numero === NUMERO_PENDIENTE ? null : fila.numero;
}

function idiomaDeLaRevision({ fila }: RevisionLeida): Idioma {
  return idiomaLeido(fila.idioma);
}

export function pdfDeLaRevision(
  revision: RevisionLeida,
  valeHasta: string | null,
): PresupuestoEnPdf {
  const numero = numeroDeLaRevision(revision);
  return {
    documento: revision.documento,
    idioma: idiomaDeLaRevision(revision),
    numero,
    revision: revision.fila.revision,
    mandadoEl: revision.fila.mandado_el,
    valeHasta,
    queCambio: revision.fila.que_cambio,
    aceptado: null,
    borrador: numero === null,
  };
}

export function pdfDelAceptado(
  revision: RevisionLeida,
  documento: DocumentoDelPresupuesto,
  aceptadoEl: string | null,
  opcion: OpcionDelDocumento<Moneda> | null,
  acordado: Money<Moneda> | null,
): PresupuestoEnPdf {
  return {
    documento,
    idioma: idiomaDeLaRevision(revision),
    numero: numeroDeLaRevision(revision),
    revision: revision.fila.revision,
    mandadoEl: revision.fila.mandado_el,
    valeHasta: null,
    queCambio: null,
    aceptado: { el: aceptadoEl, letra: opcion?.letra ?? null, acordado },
    borrador: false,
  };
}

export function pdfDeLaTarjeta(estado: EstadoDeLaTarjeta): PresupuestoEnPdf | null {
  switch (estado.cual) {
    case 'sin-borrador':
      return null;
    case 'borrador':
      return pdfDelBorrador(estado.documento, estado.presupuesto.numero, 1, estado.idioma);
    case 'mandado':
      return pdfDeLaRevision(estado.ultima, estado.valeHasta);
    case 'aceptado':
      return pdfDelAceptado(
        estado.ultima,
        estado.documento,
        estado.aceptadoEl,
        estado.opcion,
        estado.acordado,
      );
  }
}
