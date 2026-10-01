import {
  NOMBRE_DE_LA_CONDICION,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
} from '@maun/domain';

import { fechaConAnio, fechaDelRotulo } from '@/shared/lib';

import { ANCHO_DE_LA_OPCION, ANCHO_DE_LA_REVISION } from './medidas';
import type { PresupuestoEnPdf } from './tipos';

export const LEYENDA_DE_ARCA = 'DOCUMENTO NO VÁLIDO COMO FACTURA';

export const LEMA_DEL_TALLER = 'Muebles a medida';

export function mediodiaEnElTaller(fecha: string): Date {
  return new Date(`${fecha}T12:00:00-03:00`);
}

export function fechaDeCreacion(p: PresupuestoEnPdf): Date | undefined {
  return p.borrador || p.mandadoEl === null ? undefined : mediodiaEnElTaller(p.mandadoEl);
}

export function tituloDelPdf(p: PresupuestoEnPdf): string {
  if (p.numero === null) return 'Presupuesto (borrador)';
  const conRevision =
    p.revision <= 1
      ? `Presupuesto ${p.numero}`
      : `Presupuesto ${p.numero} · Rev. ${String(p.revision)}`;
  return p.borrador ? `${conRevision} (borrador)` : conRevision;
}

export function textoDeLaPagina(titulo: string, pagina: number, total: number): string {
  return `${titulo} · Página ${String(pagina)} de ${String(total)}`;
}

export function deQuienEs(documento: DocumentoDelPresupuesto): string {
  return [documento.cliente, documento.titulo].filter(Boolean).join(' · ');
}

export function pieDelTaller(taller: DatosDelTaller): string {
  return [taller.nombre, taller.cuit === '' ? '' : `CUIT ${taller.cuit}`]
    .filter(Boolean)
    .join(' · ');
}

export function lineasDelTaller(taller: DatosDelTaller): string[] {
  const cuit = taller.cuit === '' ? '' : `CUIT ${taller.cuit}`;
  const condicion =
    taller.condicionFiscal === null ? '' : NOMBRE_DE_LA_CONDICION[taller.condicionFiscal];
  return [
    [taller.titular, cuit].filter(Boolean).join(' · '),
    condicion,
    taller.domicilio,
    [taller.telefono, taller.email].filter(Boolean).join(' · '),
  ].filter((linea) => linea !== '');
}

export interface CasillaDelPdf {
  titulo: string;
  valor: string;
  ancho?: number;
}

export function casillasDelRotuloDelPdf(p: PresupuestoEnPdf): CasillaDelPdf[] {
  if (p.borrador) {
    const dias = p.documento.validezDias;
    return [
      {
        titulo: 'Rev.',
        valor: p.numero === null ? '—' : String(p.revision),
        ancho: ANCHO_DE_LA_REVISION,
      },
      { titulo: 'Emitido', valor: '—' },
      { titulo: 'Validez', valor: dias === null ? 'Sin venc.' : `${String(dias)} días` },
    ];
  }
  const emitido: CasillaDelPdf[] = [
    { titulo: 'Rev.', valor: String(p.revision), ancho: ANCHO_DE_LA_REVISION },
    { titulo: 'Emitido', valor: p.mandadoEl === null ? '—' : fechaDelRotulo(p.mandadoEl) },
  ];
  if (p.aceptado !== null) {
    const { letra, el } = p.aceptado;
    return [
      ...emitido,
      ...(letra === null ? [] : [{ titulo: 'Opción', valor: letra, ancho: ANCHO_DE_LA_OPCION }]),
      ...(el === null ? [] : [{ titulo: 'Aceptado', valor: fechaDelRotulo(el) }]),
    ];
  }
  return [
    ...emitido,
    p.valeHasta === null
      ? { titulo: 'Validez', valor: 'Sin venc.' }
      : { titulo: 'Vale hasta', valor: fechaDelRotulo(p.valeHasta) },
  ];
}

export function textoDeLaValidez(p: PresupuestoEnPdf): string | null {
  if (p.aceptado !== null) return null;
  if (p.borrador) {
    const dias = p.documento.validezDias;
    return dias === null ? 'Sin vencimiento.' : `${String(dias)} días desde que se manda.`;
  }
  return p.valeHasta === null ? 'Sin vencimiento.' : `Hasta el ${fechaConAnio(p.valeHasta)}.`;
}

export function textoDelPlazo(dias: number): string {
  return `${String(dias)} días hábiles desde la seña.`;
}

export function lineaDelAceptado(el: string | null, letra: string | null): string {
  const cuando = el === null ? 'Aceptado' : `Aceptado el ${fechaConAnio(el)}`;
  return letra === null ? cuando : `${cuando} · Opción ${letra}`;
}

export function conQueCambio(p: PresupuestoEnPdf): boolean {
  return !p.borrador && p.aceptado === null && p.revision > 1 && (p.queCambio ?? '').trim() !== '';
}
