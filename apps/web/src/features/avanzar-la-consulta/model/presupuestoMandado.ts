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
  return delPresupuesto
    ? `Calculada a ${String(plazo)} días hábiles del inicio, el plazo del presupuesto.`
    : `Calculada a ${String(plazo)} días hábiles del inicio.`;
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
  const cual =
    mandado.numero === NUMERO_PENDIENTE
      ? 'el presupuesto que le mandaste'
      : `el presupuesto ${numeroVisible(mandado.numero, mandado.revision)}`;
  const enElPresupuesto = totalPropuesto(valores);
  const queDice =
    enElPresupuesto === null
      ? `Ese importe no está en ${cual}.`
      : `En ${cual} dice ${formatearPesos(enElPresupuesto)}.`;
  return `${queDice} Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: ${formatearPesos(acordado)}».`;
}
