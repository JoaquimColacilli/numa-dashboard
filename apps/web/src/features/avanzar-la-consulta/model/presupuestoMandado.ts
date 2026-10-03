import {
  acordadoAlAprobar,
  centavosEn,
  combinacionDeLaMoneda,
  entregaEstimada,
  leerDocumento,
  MONEDA_DEL_TALLER,
  monedaDelDocumento,
  numeroVisible,
  plazoDelPresupuesto,
  soloLaAceptada,
  totalPropuesto,
  type DocumentoDelPresupuesto,
  type Moneda,
} from '@maun/domain';

import { NUMERO_PENDIENTE, presupuestoDelTrabajo, ultimaRevision } from '@/entities/presupuesto';
import type { Replica } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { formatearPlata } from '@/shared/lib';

export interface LoMandadoAlCliente {
  documento: DocumentoDelPresupuesto;
  numero: string;
  revision: number;
}

export interface ComoSeCobraElTrabajo {
  moneda: Moneda;
  cobraEn: readonly Moneda[] | null;
}

const EN_PESOS: ComoSeCobraElTrabajo = { moneda: MONEDA_DEL_TALLER, cobraEn: null };

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

export function seCobraIgual(
  documento: DocumentoDelPresupuesto,
  trabajo: ComoSeCobraElTrabajo,
): boolean {
  return (
    combinacionDeLaMoneda(monedaDelDocumento(documento), documento.cobraEn) ===
    combinacionDeLaMoneda(trabajo.moneda, trabajo.cobraEn)
  );
}

interface LoAcordado {
  enElPresupuesto: number | null;
  acordado: number | null;
}

function loAcordado(
  documento: DocumentoDelPresupuesto,
  opcionId: string | null,
  aprobado: number | null,
): LoAcordado {
  if (documento.forma === 2) {
    const { valores } = soloLaAceptada(documento, opcionId);
    return {
      enElPresupuesto: totalPropuesto(valores),
      acordado: acordadoAlAprobar(valores, aprobado === null ? null : centavosEn('USD', aprobado)),
    };
  }
  const { valores } = soloLaAceptada(documento, opcionId);
  return {
    enElPresupuesto: totalPropuesto(valores),
    acordado: acordadoAlAprobar(
      valores,
      aprobado === null ? null : centavosEn(MONEDA_DEL_TALLER, aprobado),
    ),
  };
}

function loQueDice(mandado: LoMandadoAlCliente, enElPresupuesto: string | null): string {
  const { avanzarLaConsulta, armarElPresupuesto, ui } = mensajes();
  const { acordado } = avanzarLaConsulta.pasaje;
  if (mandado.numero === NUMERO_PENDIENTE) {
    return enElPresupuesto === null
      ? acordado.noEstaEnElQueLeMandaste
      : acordado.elQueLeMandasteDice(enElPresupuesto);
  }
  const { listo } = armarElPresupuesto.mandar;
  const numero = numeroVisible(mandado.numero, mandado.revision, {
    sinNumero: ui.rotulo.sinNumero,
    numero: listo.numero,
    conRevision: listo.numeroYRevision,
  });
  return enElPresupuesto === null
    ? acordado.noEstaEn(numero)
    : acordado.dice(numero, enElPresupuesto);
}

export function avisoDelAcordado(
  mandado: LoMandadoAlCliente | null,
  opcionId: string | null,
  aprobado: number | null,
  trabajo: ComoSeCobraElTrabajo = EN_PESOS,
): string | null {
  if (mandado === null || !seCobraIgual(mandado.documento, trabajo)) return null;
  const { enElPresupuesto, acordado } = loAcordado(mandado.documento, opcionId, aprobado);
  if (acordado === null) return null;
  const moneda = monedaDelDocumento(mandado.documento);
  const queDice = loQueDice(
    mandado,
    enElPresupuesto === null ? null : formatearPlata(enElPresupuesto, moneda),
  );
  const siLoApruebasAsi = mensajes().avanzarLaConsulta.pasaje.acordado.siLoApruebasAsi(
    formatearPlata(acordado, moneda),
  );
  return `${queDice} ${siLoApruebasAsi}`;
}
