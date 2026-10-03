import type { CambiosDeTareas, ColumnaDeTarea } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import type { Proyecto } from './catalogos';

export interface TareaDelPresupuesto {
  columna: ColumnaDeTarea;
  etiqueta: string;
  detalle: string | null;
}

function tarea(columna: ColumnaDeTarea): TareaDelPresupuesto {
  return {
    columna,
    get etiqueta() {
      return mensajes().proyecto.tareas.etiquetas[columna];
    },
    get detalle() {
      return columna === 'presupuesto_cotizacion'
        ? mensajes().proyecto.tareas.detalleDeCotizar
        : null;
    },
  };
}

export const TAREAS_DEL_PRESUPUESTO: readonly TareaDelPresupuesto[] = [
  tarea('presupuesto_diseno'),
  tarea('presupuesto_despiece'),
  tarea('presupuesto_cotizacion'),
  tarea('presupuesto_pdf'),
];

type FilaQuizasSinTareas = Partial<Pick<Proyecto, ColumnaDeTarea>>;

export function tareaHecha(proyecto: Proyecto, columna: ColumnaDeTarea): boolean {
  return (proyecto as FilaQuizasSinTareas)[columna] === true;
}

export function tareasHechas(proyecto: Proyecto): number {
  return TAREAS_DEL_PRESUPUESTO.filter((tarea) => tareaHecha(proyecto, tarea.columna)).length;
}

export function presupuestoArmado(proyecto: Proyecto): boolean {
  return tareasHechas(proyecto) === TAREAS_DEL_PRESUPUESTO.length;
}

export function marcaDeLaTarea(columna: ColumnaDeTarea, hecha: boolean): CambiosDeTareas {
  switch (columna) {
    case 'presupuesto_diseno':
      return { presupuesto_diseno: hecha };
    case 'presupuesto_despiece':
      return { presupuesto_despiece: hecha };
    case 'presupuesto_cotizacion':
      return { presupuesto_cotizacion: hecha };
    case 'presupuesto_pdf':
      return { presupuesto_pdf: hecha };
  }
}

export function cambiaAlgunaTarea(proyecto: Proyecto, cambios: CambiosDeTareas): boolean {
  return TAREAS_DEL_PRESUPUESTO.some(
    ({ columna }) => columna in cambios && tareaHecha(proyecto, columna) !== cambios[columna],
  );
}
