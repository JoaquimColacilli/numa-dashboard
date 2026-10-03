import type {
  BorradorDelPresupuesto,
  DocumentoDelPresupuesto,
  Idioma,
  PlantillaDelPresupuesto,
} from '@maun/domain';

import type { ClienteMaun } from './cliente.ts';
import type { Json } from './database.types.ts';
import { RespuestaInvalidaError, type FilaDe } from './replica.ts';

export interface BorradorParaGuardar {
  id: string;
  proyectoId: string;
  version: number;
  contenido: BorradorDelPresupuesto;
}

export interface PresupuestoParaMandar {
  presupuestoId: string;
  revisionId: string;
  version: number;
  documento: DocumentoDelPresupuesto;
  idioma: Idioma;
  queCambio: string | null;
  mandadoEl: string;
  valeHasta: string | null;
}

export interface PresupuestoMandado {
  revision: FilaDe<'revisiones_del_presupuesto'>;
  presupuesto: FilaDe<'presupuestos'>;
  proyecto: FilaDe<'proyectos'>;
  proximos: readonly FilaDe<'proximos_contactos'>[];
}

function esFilaConId(valor: unknown): boolean {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof (valor as { id?: unknown }).id === 'string'
  );
}

function exigirFila(valor: unknown, que: string): void {
  if (!esFilaConId(valor)) {
    throw new RespuestaInvalidaError(`mandar_el_presupuesto no devolvió ${que}.`);
  }
}

export function leerPresupuestoMandado(valor: unknown): PresupuestoMandado {
  if (typeof valor !== 'object' || valor === null) {
    throw new RespuestaInvalidaError('mandar_el_presupuesto no devolvió un objeto.');
  }
  const cuerpo = valor as Record<string, unknown>;
  const proximos = cuerpo.proximos_contactos;
  if (!Array.isArray(proximos) || !proximos.every(esFilaConId)) {
    throw new RespuestaInvalidaError('mandar_el_presupuesto no devolvió los próximos contactos.');
  }
  exigirFila(cuerpo.revision, 'la revisión');
  exigirFila(cuerpo.presupuesto, 'el presupuesto');
  exigirFila(cuerpo.proyecto, 'el trabajo');
  return {
    revision: cuerpo.revision as FilaDe<'revisiones_del_presupuesto'>,
    presupuesto: cuerpo.presupuesto as FilaDe<'presupuestos'>,
    proyecto: cuerpo.proyecto as FilaDe<'proyectos'>,
    proximos: proximos as FilaDe<'proximos_contactos'>[],
  };
}

export async function guardarElBorrador(
  cliente: ClienteMaun,
  pedido: BorradorParaGuardar,
): Promise<FilaDe<'presupuestos'>> {
  const { data, error } = await cliente.rpc('guardar_el_presupuesto', {
    p_id: pedido.id,
    p_proyecto_id: pedido.proyectoId,
    p_version: pedido.version,
    p_contenido: pedido.contenido as unknown as Json,
  });
  if (error) throw error;
  return data;
}

export async function mandarElPresupuesto(
  cliente: ClienteMaun,
  pedido: PresupuestoParaMandar,
): Promise<PresupuestoMandado> {
  const { data, error } = await cliente.rpc('mandar_el_presupuesto', {
    p_presupuesto_id: pedido.presupuestoId,
    p_revision_id: pedido.revisionId,
    p_version: pedido.version,
    p_documento: pedido.documento as unknown as Json,
    p_que_cambio: pedido.queCambio ?? '',
    p_mandado_el: pedido.mandadoEl,
    p_vale_hasta: pedido.valeHasta as string,
    p_idioma: pedido.idioma,
  });
  if (error) throw error;
  return leerPresupuestoMandado(data);
}

export async function guardarLaPlantillaDelPresupuesto(
  cliente: ClienteMaun,
  version: number,
  plantilla: PlantillaDelPresupuesto | null,
): Promise<FilaDe<'ajustes'>> {
  const { data, error } = await cliente.rpc('guardar_la_plantilla_del_presupuesto', {
    p_version: version,
    p_plantilla: plantilla as unknown as Json,
  });
  if (error) throw error;
  return data;
}
