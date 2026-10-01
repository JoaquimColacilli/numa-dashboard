import { sumarDias, type DocumentoDelPresupuesto } from '@maun/domain';

import type {
  EnvioDelPresupuesto,
  FilaDelPresupuesto,
  FilaDeRevision,
} from '@/entities/presupuesto';
import type { FilaDe } from '@/shared/api';

export interface DatosDelEnvio {
  proyecto: FilaDe<'proyectos'>;
  proximos: readonly FilaDe<'proximos_contactos'>[];
  presupuesto: FilaDelPresupuesto;
  revisiones: readonly FilaDeRevision[];
  documento: DocumentoDelPresupuesto;
  queCambio: string;
  hoy: string;
  validezDias: number | null;
  revisionId: string;
  momento: string;
}

export function revisionQueSeManda(
  revisiones: readonly Pick<FilaDeRevision, 'revision'>[],
): number {
  return (revisiones.at(-1)?.revision ?? 0) + 1;
}

export function valeHastaAlMandar(hoy: string, validezDias: number | null): string | null {
  return validezDias === null ? null : sumarDias(hoy, validezDias);
}

export function envioDelPresupuesto(datos: DatosDelEnvio): EnvioDelPresupuesto {
  const revision = revisionQueSeManda(datos.revisiones);
  return {
    pedido: {
      presupuestoId: datos.presupuesto.id,
      revisionId: datos.revisionId,
      version: datos.presupuesto.borrador_version,
      documento: datos.documento,
      queCambio: revision > 1 ? datos.queCambio.trim() : null,
      mandadoEl: datos.hoy,
      valeHasta: valeHastaAlMandar(datos.hoy, datos.validezDias),
    },
    proyectoId: datos.proyecto.id,
    revision,
    numero: datos.presupuesto.numero,
    previos: { proyecto: datos.proyecto, proximos: datos.proximos },
    momento: datos.momento,
  };
}
