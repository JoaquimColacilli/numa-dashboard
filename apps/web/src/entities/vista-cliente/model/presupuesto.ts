import {
  mensajeParaElTaller,
  NOMBRE_DE_LA_CONDICION,
  type DatosDelTaller,
  type PresupuestoAceptado,
  type PresupuestoMandado,
} from '@maun/domain';

import type { FormatosDelCliente, MensajesDelCliente } from '@/shared/idioma-del-cliente';
import { enlaceParaEscribir } from '@/shared/lib';
import { LEYENDA_DE_ARCA_EN_UNA_FRASE, type PresupuestoEnPdf } from '@/shared/pdf';
import type { DatosDelRotulo } from '@/shared/ui';

export function pdfDelMandado(presupuesto: PresupuestoMandado): PresupuestoEnPdf {
  return {
    documento: presupuesto.documento,
    idioma: presupuesto.idioma,
    numero: presupuesto.numero,
    revision: presupuesto.revision,
    mandadoEl: presupuesto.mandadoEl,
    valeHasta: presupuesto.valeHasta,
    queCambio: presupuesto.queCambio,
    aceptado: null,
    borrador: false,
  };
}

export function pdfDelBorrador(presupuesto: PresupuestoMandado): PresupuestoEnPdf {
  return {
    documento: presupuesto.documento,
    idioma: presupuesto.idioma,
    numero: presupuesto.numero === '' ? null : presupuesto.numero,
    revision: presupuesto.revision,
    mandadoEl: null,
    valeHasta: null,
    queCambio: null,
    aceptado: null,
    borrador: true,
  };
}

export function pdfDelAceptado(presupuesto: PresupuestoAceptado): PresupuestoEnPdf {
  return {
    documento: presupuesto.documento,
    idioma: presupuesto.idioma,
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

export function lineaDelVencido(
  vencio: string,
  hoy: string,
  m: MensajesDelCliente,
  f: FormatosDelCliente,
): LineaDelVencido {
  const { vencido } = m.presupuesto;
  return { cuando: vencido.cuando(f.fechaLarga(vencio, hoy)), queHacer: vencido.queHacer };
}

export function textoDeLaValidez(
  presupuesto: PresupuestoMandado,
  hoy: string,
  m: MensajesDelCliente,
  f: FormatosDelCliente,
): string {
  const { validez } = m.presupuesto;
  if (presupuesto.vencio !== null) return validez.vencio(f.fechaLarga(presupuesto.vencio, hoy));
  if (presupuesto.valeHasta === null) return validez.sinVencimiento;
  return validez.hasta(f.fechaLarga(presupuesto.valeHasta, hoy));
}

export interface ParteDelPie {
  texto: string;
  tipo: 'leyenda' | 'aclaracion' | 'dato';
}

export function partesDelPie(taller: DatosDelTaller, m: MensajesDelCliente): ParteDelPie[] {
  const { leyendaDeArca } = m.documento;
  const datos = [
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
  return [
    { texto: LEYENDA_DE_ARCA_EN_UNA_FRASE, tipo: 'leyenda' },
    ...(leyendaDeArca.aclarar
      ? [{ texto: leyendaDeArca.aclaracion, tipo: 'aclaracion' } as const]
      : []),
    ...datos.map((texto) => ({ texto, tipo: 'dato' }) as const),
  ];
}

export function enlaceParaEscribirleAlTaller(
  presupuesto: PresupuestoMandado,
  m: MensajesDelCliente,
): string | null {
  return enlaceParaEscribir(
    presupuesto.documento.taller.telefono,
    mensajeParaElTaller(presupuesto.numero, presupuesto.revision, m.presupuesto.mensajeAlTaller),
  );
}
