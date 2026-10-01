import {
  acordadoAlAprobar,
  ESTADOS_DE_CONSULTA,
  EN_SEGUIMIENTO,
  hayCambiosSinMandar,
  leerDocumento,
  soloLaAceptada,
  vencioElPresupuesto,
  type DocumentoDelPresupuesto,
  type EstadoProyecto,
  type Moneda,
  type Money,
  type OpcionDelDocumento,
} from '@maun/domain';

import {
  presupuestoDelTrabajo,
  revisionesDelPresupuesto,
  type FilaDelPresupuesto,
  type FilaDeRevision,
} from '@/entities/presupuesto';
import {
  opcionAprobada,
  opcionesDelProyecto,
  vigenciaDelPresupuesto,
  type Proyecto,
} from '@/entities/proyecto';
import type { Replica } from '@/shared/api';

import {
  borradorGuardado,
  documentoDeHoy,
  entradaDeHoy,
  FORMATOS_DE_LA_APP,
  totalDeHoy,
} from './documento';

export interface RevisionLeida {
  fila: FilaDeRevision;
  documento: DocumentoDelPresupuesto;
}

export type EstadoDeLaTarjeta =
  | { cual: 'sin-borrador' }
  | { cual: 'borrador'; presupuesto: FilaDelPresupuesto; documento: DocumentoDelPresupuesto }
  | {
      cual: 'mandado';
      presupuesto: FilaDelPresupuesto;
      ultima: RevisionLeida;
      anteriores: RevisionLeida[];
      cambiosSinMandar: boolean;
      valeHasta: string | null;
      vencido: boolean;
      seMandaOtra: boolean;
    }
  | {
      cual: 'aceptado';
      presupuesto: FilaDelPresupuesto;
      ultima: RevisionLeida;
      anteriores: RevisionLeida[];
      aceptadoEl: string | null;
      opcion: OpcionDelDocumento<Moneda> | null;
      documento: DocumentoDelPresupuesto;
      acordado: Money<Moneda> | null;
    };

const SE_MANDA_OTRA: readonly EstadoProyecto[] = [...ESTADOS_DE_CONSULTA, EN_SEGUIMIENTO];

const ACEPTADO: readonly EstadoProyecto[] = ['en_curso', 'entregado', 'cobrado'];

export function revisionesLeidas(replica: Replica, presupuestoId: string): RevisionLeida[] {
  return revisionesDelPresupuesto(replica, presupuestoId).flatMap((fila) => {
    const documento = leerDocumento(fila.contenido);
    return documento === null ? [] : [{ fila, documento }];
  });
}

export function sePuedeMandarOtra(estado: EstadoProyecto): boolean {
  return SE_MANDA_OTRA.includes(estado);
}

export function estadoDeLaTarjeta(
  replica: Replica,
  proyecto: Proyecto,
  hoy: string,
): EstadoDeLaTarjeta {
  const presupuesto = presupuestoDelTrabajo(replica, proyecto.id);
  if (presupuesto === null) return { cual: 'sin-borrador' };

  const borrador = borradorGuardado(replica, proyecto, presupuesto);
  const revisiones = revisionesLeidas(replica, presupuesto.id);
  const ultima = revisiones.at(-1);
  if (ultima === undefined) {
    return {
      cual: 'borrador',
      presupuesto,
      documento: documentoDeHoy({ replica, proyecto, borrador }),
    };
  }

  const anteriores = revisiones.slice(0, -1).reverse();
  if (!ACEPTADO.includes(proyecto.estado)) {
    const valeHasta = vigenciaDelPresupuesto(proyecto);
    const seMandaOtra = sePuedeMandarOtra(proyecto.estado);
    return {
      cual: 'mandado',
      presupuesto,
      ultima,
      anteriores,
      cambiosSinMandar:
        seMandaOtra &&
        hayCambiosSinMandar(
          entradaDeHoy({ replica, proyecto, borrador }),
          ultima.documento,
          FORMATOS_DE_LA_APP,
        ),
      valeHasta,
      vencido: seMandaOtra && vencioElPresupuesto(valeHasta, hoy),
      seMandaOtra,
    };
  }

  const aprobada = opcionAprobada(opcionesDelProyecto(replica, proyecto.id));
  const documento = soloLaAceptada(ultima.documento, aprobada?.id ?? null);
  const opcion =
    documento.valores?.tipo === 'opciones' ? (documento.valores.opciones[0] ?? null) : null;
  return {
    cual: 'aceptado',
    presupuesto,
    ultima,
    anteriores,
    aceptadoEl: presupuesto.aceptado_el,
    opcion,
    documento,
    acordado: acordadoAlAprobar<Moneda>(documento.valores, totalDeHoy(proyecto)),
  };
}
