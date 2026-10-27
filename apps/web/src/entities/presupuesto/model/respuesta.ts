import {
  esFranjaDeLaVisita,
  horaDeLaVisita,
  leerDocumento,
  letraDeLaRespuesta,
  type DocumentoDelPresupuesto,
  type FranjaDeLaVisita,
} from '@maun/domain';

import { filaPorId, filasDe, type FilaDe, type Replica } from '@/shared/api';

import { presupuestoDelTrabajo, ultimaRevision } from './replica';

export type FilaDeRespuesta = FilaDe<'respuestas_al_presupuesto'>;

export interface RespuestaDelCliente {
  fila: FilaDeRespuesta;
  documento: DocumentoDelPresupuesto | null;
  letra: string | null;
  franja: FranjaDeLaVisita | null;
  hora: string | null;
}

function leida(replica: Replica, fila: FilaDeRespuesta): RespuestaDelCliente {
  const revision = filaPorId(replica, 'revisiones_del_presupuesto', fila.revision_id);
  const documento = revision === undefined ? null : leerDocumento(revision.contenido);
  const franja = esFranjaDeLaVisita(fila.franja) ? fila.franja : null;
  return {
    fila,
    documento,
    letra: documento === null ? null : letraDeLaRespuesta(documento, fila.opcion_id),
    franja,
    hora: horaDeLaVisita(franja),
  };
}

export function respuestaDeLaUltimaRevision(
  replica: Replica,
  proyectoId: string,
): RespuestaDelCliente | null {
  const presupuesto = presupuestoDelTrabajo(replica, proyectoId);
  if (presupuesto === null) return null;
  const ultima = ultimaRevision(replica, presupuesto.id);
  if (ultima === null) return null;
  const fila = filasDe(replica, 'respuestas_al_presupuesto').find(
    (una) => una.revision_id === ultima.id,
  );
  return fila === undefined ? null : leida(replica, fila);
}

export function respuestaPendiente(
  replica: Replica,
  proyectoId: string,
): RespuestaDelCliente | null {
  const respuesta = respuestaDeLaUltimaRevision(replica, proyectoId);
  return respuesta !== null && respuesta.fila.atendida_at === null ? respuesta : null;
}

export function respuestasPendientes(replica: Replica): ReadonlySet<string> {
  const proyectos = new Set<string>();
  for (const fila of filasDe(replica, 'respuestas_al_presupuesto')) {
    if (fila.atendida_at !== null || proyectos.has(fila.proyecto_id)) continue;
    if (respuestaPendiente(replica, fila.proyecto_id) !== null) proyectos.add(fila.proyecto_id);
  }
  return proyectos;
}
