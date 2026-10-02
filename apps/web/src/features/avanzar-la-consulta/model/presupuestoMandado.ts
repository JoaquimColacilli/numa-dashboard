import {
  acordadoAlAprobar,
  centavos,
  entregaEstimada,
  leerDocumento,
  numeroVisible,
  plazoDelPresupuesto,
  soloLaAceptada,
  totalPropuesto,
  type DocumentoDelPresupuesto,
} from '@maun/domain';

import { NUMERO_PENDIENTE, presupuestoDelTrabajo, ultimaRevision } from '@/entities/presupuesto';
import type { Replica } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';

export interface LoMandadoAlCliente {
  documento: DocumentoDelPresupuesto;
  numero: string;
  revision: number;
}

export function loMandadoAlCliente(
  replica: Replica,
  proyectoId: string,
): LoMandadoAlCliente | null {
  const presupuesto = presupuestoDelTrabajo(replica, proyectoId);
  if (presupuesto === null) return null;
  const ultima = ultimaRevision(replica, presupuesto.id);
  if (ultima === null) return null;
  const documento = leerDocumento(ultima.contenido);
  return documento === null
    ? null
    : { documento, numero: ultima.numero, revision: ultima.revision };
}

export function plazoDelPasaje(mandado: LoMandadoAlCliente | null): number {
  return plazoDelPresupuesto(mandado?.documento ?? null);
}

export function entregaDelPasaje(inicio: string, plazo: number): string {
  return entregaEstimada(inicio, plazo);
}

export function ayudaDeLaEntrega(plazo: number, delPresupuesto: boolean): string {
  const { pasaje } = mensajes().avanzarLaConsulta;
  return delPresupuesto
    ? pasaje.ayudaDeLaEntregaDelPresupuesto(plazo)
    : pasaje.ayudaDeLaEntrega(plazo);
}

function loQueDice(mandado: LoMandadoAlCliente, enElPresupuesto: number | null): string {
  const { avanzarLaConsulta, armarElPresupuesto, ui } = mensajes();
  const { acordado } = avanzarLaConsulta.pasaje;
  if (mandado.numero === NUMERO_PENDIENTE) {
    return enElPresupuesto === null
      ? acordado.noEstaEnElQueLeMandaste
      : acordado.elQueLeMandasteDice(formatearPesos(enElPresupuesto));
  }
  const { listo } = armarElPresupuesto.mandar;
  const numero = numeroVisible(mandado.numero, mandado.revision, {
    sinNumero: ui.rotulo.sinNumero,
    numero: listo.numero,
    conRevision: listo.numeroYRevision,
  });
  return enElPresupuesto === null
    ? acordado.noEstaEn(numero)
    : acordado.dice(numero, formatearPesos(enElPresupuesto));
}

export function avisoDelAcordado(
  mandado: LoMandadoAlCliente | null,
  opcionId: string | null,
  aprobado: number | null,
): string | null {
  if (mandado === null) return null;
  const valores = soloLaAceptada(mandado.documento, opcionId).valores;
  const acordado = acordadoAlAprobar(valores, aprobado === null ? null : centavos(aprobado));
  if (acordado === null) return null;
  const queDice = loQueDice(mandado, totalPropuesto(valores));
  const siLoApruebasAsi = mensajes().avanzarLaConsulta.pasaje.acordado.siLoApruebasAsi(
    formatearPesos(acordado),
  );
  return `${queDice} ${siLoApruebasAsi}`;
}
