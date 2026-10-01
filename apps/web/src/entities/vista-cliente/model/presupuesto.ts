import {
  NOMBRE_DE_LA_CONDICION,
  type DatosDelTaller,
  type PresupuestoAceptado,
  type PresupuestoMandado,
} from '@maun/domain';

import { enlaceParaEscribir, fechaLarga, formatearPesos, formatearPorcentaje } from '@/shared/lib';
import type { PresupuestoEnPdf } from '@/shared/pdf';
import type { DatosDelRotulo } from '@/shared/ui';

export const EL_PRESUPUESTO = 'El presupuesto';

export const EL_PRESUPUESTO_QUE_ACEPTASTE = 'El presupuesto que aceptaste';

export const ELEGI_LA_OPCION = 'Elegí la opción que prefieras y avisale al taller.';

export const DOCUMENTO_NO_VALIDO = 'Documento no válido como factura';

export const ESCRIBIRLE_AL_TALLER = 'Escribirle al taller';

export const COMO_DEJAR_LA_SENA = 'Cómo dejar la seña';

export const VER_EL_DETALLE = 'Ver el detalle';

export const DESCARGAR_EL_PDF = 'Descargar el PDF';

export const COMPARTIR = 'Compartir';

export const COMPARTIR_EL_PDF = 'Compartir el PDF';

export function pdfDelMandado(presupuesto: PresupuestoMandado): PresupuestoEnPdf {
  return {
    documento: presupuesto.documento,
    numero: presupuesto.numero,
    revision: presupuesto.revision,
    mandadoEl: presupuesto.mandadoEl,
    valeHasta: presupuesto.valeHasta,
    queCambio: presupuesto.queCambio,
    aceptado: null,
    borrador: false,
  };
}

export function pdfDelAceptado(presupuesto: PresupuestoAceptado): PresupuestoEnPdf {
  return {
    documento: presupuesto.documento,
    numero: presupuesto.numero,
    revision: presupuesto.revision,
    mandadoEl: presupuesto.mandadoEl,
    valeHasta: null,
    queCambio: null,
    aceptado: {
      el: presupuesto.aceptadoEl,
      letra: presupuesto.letra,
      acordado: presupuesto.acordado,
    },
    borrador: false,
  };
}

export const ID_DE_COMO_PAGAR = 'como-pagar';

export function rotuloDelMandado(presupuesto: PresupuestoMandado): DatosDelRotulo {
  return {
    numero: presupuesto.numero,
    revision: presupuesto.revision,
    emitido: presupuesto.mandadoEl,
    valeHasta: presupuesto.valeHasta,
    vencido: presupuesto.vencio !== null,
  };
}

export function rotuloDelAceptado(presupuesto: PresupuestoAceptado): DatosDelRotulo {
  return {
    numero: presupuesto.numero,
    revision: presupuesto.revision,
    emitido: presupuesto.mandadoEl,
    aceptado: { el: presupuesto.aceptadoEl, letra: presupuesto.letra },
  };
}

export interface LineaDelVencido {
  cuando: string;
  queHacer: string;
}

export function lineaDelVencido(vencio: string, hoy: string): LineaDelVencido {
  return {
    cuando: `Venció el ${fechaLarga(vencio, hoy)}.`,
    queHacer: 'Escribile al taller para actualizarlo.',
  };
}

export function queCambioEnLaRevision(revision: number): string {
  return `Qué cambió en la revisión ${String(revision)}`;
}

export function claveDeLaSena(senaBp: number): string {
  return `Seña (${formatearPorcentaje(senaBp)}%)`;
}

export function textoDeLaValidez(presupuesto: PresupuestoMandado, hoy: string): string {
  if (presupuesto.vencio !== null) return `Venció el ${fechaLarga(presupuesto.vencio, hoy)}`;
  if (presupuesto.valeHasta === null) return 'Sin vencimiento';
  return `Hasta el ${fechaLarga(presupuesto.valeHasta, hoy)}`;
}

export function textoDelPlazo(dias: number): string {
  return dias === 1 ? '1 día hábil' : `${String(dias)} días hábiles`;
}

export function cuantoDuraLaGarantia(meses: number): string {
  return meses === 1 ? '1 mes' : `${String(meses)} meses`;
}

export function textoDelAcordado(acordado: number): string {
  return `Acordado al aprobar: ${formatearPesos(acordado)}`;
}

export function partesDelPie(taller: DatosDelTaller): string[] {
  return [
    DOCUMENTO_NO_VALIDO,
    taller.nombre,
    taller.titular,
    taller.cuit === '' ? '' : `CUIT ${taller.cuit}`,
    taller.condicionFiscal === null ? '' : NOMBRE_DE_LA_CONDICION[taller.condicionFiscal],
    taller.domicilio,
    taller.telefono,
    taller.email,
  ]
    .map((parte) => parte.trim())
    .filter((parte) => parte !== '');
}

export function enlaceParaEscribirleAlTaller(presupuesto: PresupuestoMandado): string | null {
  return enlaceParaEscribir(presupuesto.documento.taller.telefono, presupuesto.mensajeParaElTaller);
}
