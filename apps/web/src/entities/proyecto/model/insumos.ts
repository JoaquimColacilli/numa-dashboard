import { CERO, restar, type Money } from '@maun/domain';

import {
  filasDe,
  insumosDelTaller,
  insumosDelTrabajo,
  type InsumosDelTrabajo,
  type Replica,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { compararTextos, formatearPesos, formatearPlata } from '@/shared/lib';

export interface EnOtroTesoro {
  nombre: string;
  monto: Money<'USD'>;
}

export interface InsumosDeUnTrabajo extends InsumosDelTrabajo {
  titulo: string;
  tallerPuso: Money | null;
}

export interface InsumosDeLosTrabajos {
  total: Money;
  trabajos: readonly InsumosDeUnTrabajo[];
}

function conTitulo(insumos: InsumosDelTrabajo, titulo: string): InsumosDeUnTrabajo {
  return {
    ...insumos,
    titulo,
    tallerPuso: insumos.queda < 0 ? restar(CERO, insumos.queda) : null,
  };
}

export function insumosDelProyecto(
  replica: Replica,
  proyectoId: string,
): InsumosDeUnTrabajo | null {
  const insumos = insumosDelTrabajo(replica, proyectoId);
  if (insumos === null) return null;
  const titulo = filasDe(replica, 'proyectos').find((fila) => fila.id === proyectoId)?.titulo;
  return conTitulo(insumos, titulo ?? '');
}

export function enOtrosTesoros(
  replica: Replica,
  insumos: Pick<InsumosDelTrabajo, 'enDolares'>,
): EnOtroTesoro[] {
  const nombres = new Map(filasDe(replica, 'tesoros').map((fila) => [fila.id, fila.nombre]));
  return insumos.enDolares.map((uno) => ({
    nombre: nombres.get(uno.tesoroId) ?? '',
    monto: uno.monto,
  }));
}

export function insumosDeLosTrabajos(replica: Replica): InsumosDeLosTrabajos {
  const titulos = new Map(filasDe(replica, 'proyectos').map((fila) => [fila.id, fila.titulo]));
  const { total, trabajos } = insumosDelTaller(replica);
  return {
    total,
    trabajos: trabajos
      .map((insumos) => conTitulo(insumos, titulos.get(insumos.proyectoId) ?? ''))
      .sort((uno, otro) => compararTextos(uno.titulo, otro.titulo)),
  };
}

export function fraseDeLosInsumos(insumos: Pick<InsumosDeUnTrabajo, 'tallerPuso'>): string | null {
  return insumos.tallerPuso === null
    ? null
    : mensajes().proyecto.insumos.tallerPuso(formatearPesos(insumos.tallerPuso));
}

export function frasesDeOtrosTesoros(otros: readonly EnOtroTesoro[]): string[] {
  const { enOtroTesoro } = mensajes().proyecto.insumos;
  return otros.map((otro) => enOtroTesoro(formatearPlata(otro.monto, 'USD'), otro.nombre));
}
