import type { EstadoProyecto, Fase } from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { criterioPorId, ordenar, type Criterio, type Sentido } from '@/shared/lib';

import { ESTADO } from './catalogos';
import type { ResumenDeProyecto } from './resumen';

function sinAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function buscarProyectos(
  resumenes: readonly ResumenDeProyecto[],
  consulta: string,
): ResumenDeProyecto[] {
  const texto = sinAcentos(consulta.trim());
  if (texto === '') return [...resumenes];

  return resumenes.filter(
    (resumen) =>
      sinAcentos(resumen.nombreDelCliente).includes(texto) ||
      sinAcentos(resumen.proyecto.titulo).includes(texto),
  );
}

export function filtrarPorEtapa(
  resumenes: readonly ResumenDeProyecto[],
  etapa: Fase,
): ResumenDeProyecto[] {
  return resumenes.filter((resumen) => resumen.fase === etapa);
}

export function filtrarPorEstado(
  resumenes: readonly ResumenDeProyecto[],
  estado: EstadoProyecto | 'todos',
): ResumenDeProyecto[] {
  return estado === 'todos'
    ? [...resumenes]
    : resumenes.filter((resumen) => resumen.proyecto.estado === estado);
}

export const CRITERIOS: readonly Criterio<ResumenDeProyecto>[] = [
  {
    id: 'cliente',
    get etiqueta() {
      return mensajes().proyecto.orden.cliente;
    },
    tipo: 'texto',
    leer: (resumen) => resumen.nombreDelCliente,
    inicial: 'asc',
  },
  {
    id: 'trabajo',
    get etiqueta() {
      return mensajes().proyecto.orden.trabajo;
    },
    tipo: 'texto',
    leer: (resumen) => resumen.proyecto.titulo,
    inicial: 'asc',
  },
  {
    id: 'presupuesto',
    get etiqueta() {
      return mensajes().proyecto.orden.presupuesto;
    },
    tipo: 'numero',
    leer: (resumen) =>
      resumen.proyecto.presupuesto_centavos === null ? undefined : resumen.presupuesto,
    inicial: 'desc',
  },
  {
    id: 'cobrado',
    get etiqueta() {
      return mensajes().proyecto.orden.cobrado;
    },
    tipo: 'numero',
    leer: (resumen) => resumen.cobrado,
    inicial: 'desc',
  },
  {
    id: 'saldo',
    get etiqueta() {
      return mensajes().proyecto.orden.saldo;
    },
    tipo: 'numero',
    leer: (resumen) => resumen.saldo ?? undefined,
    inicial: 'desc',
  },
  {
    id: 'entrega',
    get etiqueta() {
      return mensajes().proyecto.orden.entrega;
    },
    tipo: 'fecha',
    leer: (resumen) => resumen.entrega.fecha ?? undefined,
    inicial: 'asc',
  },
  {
    id: 'estado',
    get etiqueta() {
      return mensajes().proyecto.orden.estado;
    },
    tipo: 'texto',
    leer: (resumen) => ESTADO[resumen.proyecto.estado].etiqueta,
    inicial: 'asc',
  },
];

export const ORDEN_POR_DEFECTO = 'entrega';

export function ordenarProyectos(
  resumenes: readonly ResumenDeProyecto[],
  ordenId: string,
  sentido: Sentido,
): ResumenDeProyecto[] {
  const criterio = criterioPorId(CRITERIOS, ordenId);
  if (criterio === undefined) return [...resumenes];
  return ordenar(resumenes, criterio, sentido, (resumen) => resumen.proyecto.id);
}
