import { IDIOMA_BASE, puedeCambiarEstado, sinBlancosEnLasPuntas } from '@maun/domain';

import {
  aplicarFilaLocal,
  filasDe,
  householdDe,
  quitarFilaLocal,
  type BorradorParaGuardar,
  type FilaDe,
  type Json,
  type PresupuestoMandado,
  type PresupuestoParaMandar,
  type Replica,
} from '@/shared/api';

export type FilaDelPresupuesto = FilaDe<'presupuestos'>;

export type FilaDeRevision = FilaDe<'revisiones_del_presupuesto'>;

export interface GuardadoDelBorrador {
  pedido: BorradorParaGuardar;
  previo: FilaDelPresupuesto | null;
  momento: string;
}

export interface EnvioDelPresupuesto {
  pedido: PresupuestoParaMandar;
  proyectoId: string;
  revision: number;
  numero: string | null;
  previos: {
    proyecto: FilaDe<'proyectos'>;
    proximos: readonly FilaDe<'proximos_contactos'>[];
  };
  momento: string;
}

export const NUMERO_PENDIENTE = '';

export function presupuestoDelTrabajo(
  replica: Replica,
  proyectoId: string,
): FilaDelPresupuesto | null {
  return filasDe(replica, 'presupuestos').find((fila) => fila.proyecto_id === proyectoId) ?? null;
}

export function revisionesDelPresupuesto(
  replica: Replica,
  presupuestoId: string,
): FilaDeRevision[] {
  return filasDe(replica, 'revisiones_del_presupuesto')
    .filter((fila) => fila.presupuesto_id === presupuestoId)
    .sort((una, otra) => una.revision - otra.revision);
}

export function ultimaRevision(replica: Replica, presupuestoId: string): FilaDeRevision | null {
  return revisionesDelPresupuesto(replica, presupuestoId).at(-1) ?? null;
}

export type EtapaDelPresupuesto = 'sin-borrador' | 'borrador' | 'mandado';

export function etapaDelPresupuesto(replica: Replica, proyectoId: string): EtapaDelPresupuesto {
  const presupuesto = presupuestoDelTrabajo(replica, proyectoId);
  if (presupuesto === null) return 'sin-borrador';
  return revisionesDelPresupuesto(replica, presupuesto.id).length > 0 ? 'mandado' : 'borrador';
}

export function seNumeraCuandoVuelvaLaSenal(revision: Pick<FilaDeRevision, 'numero'>): boolean {
  return revision.numero === NUMERO_PENDIENTE;
}

export function conElBorradorGuardado(
  replica: Replica,
  { pedido, previo, momento }: GuardadoDelBorrador,
): Replica {
  const household = householdDe(replica);
  if (!household) return replica;
  const contenido = pedido.contenido as unknown as Json;
  if (previo === null) {
    return aplicarFilaLocal(replica, 'presupuestos', {
      id: pedido.id,
      household_id: household.id,
      proyecto_id: pedido.proyectoId,
      contenido,
      borrador_version: pedido.version + 1,
      numero: null,
      aceptado_el: null,
      created_at: momento,
      updated_at: momento,
      deleted_at: null,
      version: 1,
    });
  }
  return aplicarFilaLocal(replica, 'presupuestos', {
    ...previo,
    contenido,
    borrador_version: pedido.version + 1,
    updated_at: momento,
    version: previo.version + 1,
  });
}

export function sinElBorradorGuardado(
  replica: Replica,
  { pedido, previo }: GuardadoDelBorrador,
): Replica {
  return previo === null
    ? quitarFilaLocal(replica, 'presupuestos', pedido.id)
    : aplicarFilaLocal(replica, 'presupuestos', previo);
}

function proyectoMandado(
  proyecto: FilaDe<'proyectos'>,
  { pedido, momento }: EnvioDelPresupuesto,
): FilaDe<'proyectos'> {
  const pasa =
    proyecto.estado !== 'presupuesto_enviado' &&
    puedeCambiarEstado(proyecto.estado, 'presupuesto_enviado');
  return {
    ...proyecto,
    estado: pasa ? 'presupuesto_enviado' : proyecto.estado,
    presupuesto_vale_hasta: pedido.valeHasta,
    ultimo_contacto: pedido.mandadoEl,
    presupuesto_pdf: true,
    updated_at: momento,
    version: proyecto.version + 1,
  };
}

export function conElPresupuestoMandado(replica: Replica, envio: EnvioDelPresupuesto): Replica {
  const household = householdDe(replica);
  if (!household) return replica;
  const { pedido, proyectoId, revision, numero, previos, momento } = envio;
  const conLaRevision = aplicarFilaLocal(replica, 'revisiones_del_presupuesto', {
    id: pedido.revisionId,
    household_id: household.id,
    presupuesto_id: pedido.presupuestoId,
    proyecto_id: proyectoId,
    revision,
    numero: numero ?? NUMERO_PENDIENTE,
    mandado_el: pedido.mandadoEl,
    vale_hasta: pedido.valeHasta,
    que_cambio: revision > 1 ? sinBlancosEnLasPuntas(pedido.queCambio ?? '') : null,
    contenido: pedido.documento as unknown as Json,
    idioma: IDIOMA_BASE,
    created_at: momento,
    updated_at: momento,
    deleted_at: null,
    version: 1,
  });
  const conElProyecto = aplicarFilaLocal(
    conLaRevision,
    'proyectos',
    proyectoMandado(previos.proyecto, envio),
  );
  if (previos.proyecto.estado !== 'en_seguimiento') return conElProyecto;
  return previos.proximos
    .filter((contacto) => contacto.hecho_el === null)
    .reduce(
      (parcial, contacto) =>
        aplicarFilaLocal(parcial, 'proximos_contactos', {
          ...contacto,
          hecho_el: pedido.mandadoEl,
          resultado: 'reactivado',
          updated_at: momento,
          version: contacto.version + 1,
        }),
      conElProyecto,
    );
}

export function sinElPresupuestoMandado(replica: Replica, envio: EnvioDelPresupuesto): Replica {
  const sinLaRevision = quitarFilaLocal(
    replica,
    'revisiones_del_presupuesto',
    envio.pedido.revisionId,
  );
  const conElProyecto = aplicarFilaLocal(sinLaRevision, 'proyectos', envio.previos.proyecto);
  return envio.previos.proximos.reduce(
    (parcial, contacto) => aplicarFilaLocal(parcial, 'proximos_contactos', contacto),
    conElProyecto,
  );
}

export function conLoMandado(replica: Replica, mandado: PresupuestoMandado): Replica {
  const conLasFilas = aplicarFilaLocal(
    aplicarFilaLocal(
      aplicarFilaLocal(replica, 'revisiones_del_presupuesto', mandado.revision),
      'presupuestos',
      mandado.presupuesto,
    ),
    'proyectos',
    mandado.proyecto,
  );
  return mandado.proximos.reduce(
    (parcial, contacto) => aplicarFilaLocal(parcial, 'proximos_contactos', contacto),
    conLasFilas,
  );
}
