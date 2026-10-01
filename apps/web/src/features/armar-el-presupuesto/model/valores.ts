import { centavos, type Money, type OpcionDelTrabajo } from '@maun/domain';

import {
  datosActualesDelProyecto,
  type GuardadoDeProyecto,
  type OpcionDePresupuesto,
  type Proyecto,
} from '@/entities/proyecto';
import type { OpcionParaGuardar } from '@/shared/api';

export interface OpcionDelEditor {
  id: string;
  descripcion: string;
  monto: Money | null;
  aprobada: boolean;
}

export interface ValoresDelEditor {
  total: Money | null;
  opciones: OpcionDelEditor[];
}

export function valoresDelProyecto(
  proyecto: Proyecto,
  opciones: readonly OpcionDePresupuesto[],
): ValoresDelEditor {
  return {
    total:
      opciones.length > 0 || proyecto.presupuesto_centavos === null
        ? null
        : centavos(proyecto.presupuesto_centavos),
    opciones: opciones.map((opcion) => ({
      id: opcion.id,
      descripcion: opcion.descripcion,
      monto: opcion.monto_centavos > 0 ? centavos(opcion.monto_centavos) : null,
      aprobada: opcion.aprobada,
    })),
  };
}

export function totalDelEditor(valores: ValoresDelEditor): Money | null {
  return valores.opciones.length > 0 ? null : valores.total;
}

export function opcionesDelEditor(valores: ValoresDelEditor): OpcionDelTrabajo[] {
  return valores.opciones.map((opcion) => ({
    id: opcion.id,
    descripcion: opcion.descripcion.trim(),
    monto: opcion.monto ?? centavos(0),
  }));
}

function porId(una: { id: string }, otra: { id: string }): number {
  if (una.id === otra.id) return 0;
  return una.id < otra.id ? -1 : 1;
}

export function enElOrdenDelDocumento(valores: ValoresDelEditor): ValoresDelEditor {
  return { ...valores, opciones: [...valores.opciones].sort(porId) };
}

export function conMasDeUnaOpcion(
  valores: ValoresDelEditor,
  ids: [string, string],
): ValoresDelEditor {
  const [primera, segunda] = ids[0] < ids[1] ? ids : [ids[1], ids[0]];
  return {
    total: null,
    opciones: [
      { id: primera, descripcion: '', monto: valores.total, aprobada: false },
      { id: segunda, descripcion: '', monto: null, aprobada: false },
    ],
  };
}

export function presupuestoDelEditor(valores: ValoresDelEditor): number | null {
  if (valores.opciones.length === 0) return valores.total;
  return valores.opciones.find((opcion) => opcion.aprobada)?.monto ?? null;
}

export function guardadoDeLosValores(
  proyecto: Proyecto,
  vivas: readonly OpcionDePresupuesto[],
  valores: ValoresDelEditor,
): GuardadoDeProyecto {
  const quedan = new Set(valores.opciones.map((opcion) => opcion.id));
  const opciones: OpcionParaGuardar[] = [
    ...valores.opciones.map((opcion) => ({
      id: opcion.id,
      descripcion: opcion.descripcion.trim(),
      monto_centavos: opcion.monto ?? 0,
      aprobada: opcion.aprobada,
    })),
    ...vivas
      .filter((opcion) => !quedan.has(opcion.id))
      .map((opcion) => ({ id: opcion.id, borrado: true as const })),
  ];
  return {
    pedido: {
      id: proyecto.id,
      version: proyecto.version,
      datos: {
        ...datosActualesDelProyecto(proyecto),
        presupuesto_centavos: presupuestoDelEditor(valores),
      },
      pagos: [],
      gastos: [],
      opciones,
    },
    previos: { proyecto, pagos: [], gastos: [], opciones: vivas, necesidades: [] },
  };
}

function normalizados(valores: ValoresDelEditor): ValoresDelEditor {
  return {
    total: valores.opciones.length > 0 ? null : valores.total,
    opciones: enElOrdenDelDocumento(valores).opciones.map((opcion) => ({
      id: opcion.id,
      descripcion: opcion.descripcion.trim(),
      monto: opcion.monto === null || opcion.monto === 0 ? null : opcion.monto,
      aprobada: opcion.aprobada,
    })),
  };
}

export function mismosValores(una: ValoresDelEditor, otra: ValoresDelEditor): boolean {
  return JSON.stringify(normalizados(una)) === JSON.stringify(normalizados(otra));
}
