import {
  calcularMargen,
  calcularMargenEnDolares,
  CATEGORIAS_DE_COSTO,
  categoriasEstimadas,
  centavos,
  centavosEn,
  costoEstimado,
  cotizacionLeida,
  MONEDA_DEL_TALLER,
  type CategoriaDeCosto,
  type CategoriaDeGasto,
  type CostosEstimados,
  type Cotizacion,
  type MargenDelTrabajo,
  type MargenEnDolares,
  type MonedaDelTaller,
} from '@maun/domain';

import {
  COLUMNAS_DE_COSTOS,
  monedaDelTrabajo,
  type CambiosDeCostos,
  type ColumnaDeCosto,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import type { Proyecto } from './catalogos';

export interface CostoDelTrabajo {
  categoria: CategoriaDeCosto;
  columna: ColumnaDeCosto;
  etiqueta: string;
}

export const COLUMNA_DEL_COSTO: Readonly<Record<CategoriaDeCosto, ColumnaDeCosto>> = {
  madera: 'costo_madera_centavos',
  herrajes: 'costo_herrajes_centavos',
  flete: 'costo_flete_centavos',
  ayudante: 'costo_ayudante_centavos',
};

function costo(categoria: CategoriaDeCosto, columna: ColumnaDeCosto): CostoDelTrabajo {
  return {
    categoria,
    columna,
    get etiqueta() {
      return mensajes().proyecto.costos[categoria];
    },
  };
}

export function nombreDeLaCategoria(categoria: CategoriaDeGasto): string {
  return mensajes().proyecto.costos[categoria];
}

export const COSTOS_DEL_TRABAJO: readonly CostoDelTrabajo[] = [
  costo('madera', 'costo_madera_centavos'),
  costo('herrajes', 'costo_herrajes_centavos'),
  costo('flete', 'costo_flete_centavos'),
  costo('ayudante', 'costo_ayudante_centavos'),
];

type FilaQuizasSinCostos = Partial<Pick<Proyecto, ColumnaDeCosto>>;

export function costoGuardado(proyecto: Proyecto, columna: ColumnaDeCosto): number | null {
  return (proyecto as FilaQuizasSinCostos)[columna] ?? null;
}

export function costosDelProyecto(proyecto: Proyecto): CostosEstimados {
  const armados = {} as Record<CategoriaDeCosto, ReturnType<typeof centavos> | null>;
  for (const categoria of CATEGORIAS_DE_COSTO) {
    const guardado = costoGuardado(proyecto, COLUMNA_DEL_COSTO[categoria]);
    armados[categoria] = guardado === null ? null : centavos(guardado);
  }
  return armados;
}

export function cambiaAlgunCosto(proyecto: Proyecto, cambios: CambiosDeCostos): boolean {
  return COLUMNAS_DE_COSTOS.some(
    (columna) => columna in cambios && costoGuardado(proyecto, columna) !== cambios[columna],
  );
}

export function cambiosDeCostos(
  valores: Readonly<Record<CategoriaDeCosto, number | null>>,
  cotizacion?: number | null,
): CambiosDeCostos {
  return {
    costo_madera_centavos: valores.madera,
    costo_herrajes_centavos: valores.herrajes,
    costo_flete_centavos: valores.flete,
    costo_ayudante_centavos: valores.ayudante,
    ...(cotizacion === undefined ? {} : { costos_cotizacion_centavos: cotizacion }),
  };
}

export function cotizacionDeLosCostos(proyecto: Proyecto): Cotizacion | null {
  const guardada = (proyecto as Partial<Pick<Proyecto, 'costos_cotizacion_centavos'>>)
    .costos_cotizacion_centavos;
  return cotizacionLeida(guardada ?? null);
}

export function costosGuardados(proyecto: Proyecto): CambiosDeCostos {
  return cambiosDeCostos({
    madera: costoGuardado(proyecto, 'costo_madera_centavos'),
    herrajes: costoGuardado(proyecto, 'costo_herrajes_centavos'),
    flete: costoGuardado(proyecto, 'costo_flete_centavos'),
    ayudante: costoGuardado(proyecto, 'costo_ayudante_centavos'),
  });
}

export function hayCostosEstimados(proyecto: Proyecto): boolean {
  return categoriasEstimadas(costosDelProyecto(proyecto)) > 0;
}

export function totalEstimado(proyecto: Proyecto): number {
  return costoEstimado(costosDelProyecto(proyecto));
}

export function margenDelTrabajo(proyecto: Proyecto): MargenDelTrabajo {
  return calcularMargen({
    presupuesto:
      proyecto.presupuesto_centavos === null ? null : centavos(proyecto.presupuesto_centavos),
    costos: costosDelProyecto(proyecto),
  });
}

export type MargenEnSuMoneda =
  | { moneda: MonedaDelTaller; margen: MargenDelTrabajo }
  | { moneda: 'USD'; margen: MargenEnDolares };

export function margenEnSuMoneda(proyecto: Proyecto): MargenEnSuMoneda {
  if (monedaDelTrabajo(proyecto) === MONEDA_DEL_TALLER) {
    return { moneda: MONEDA_DEL_TALLER, margen: margenDelTrabajo(proyecto) };
  }
  return {
    moneda: 'USD',
    margen: calcularMargenEnDolares({
      presupuesto:
        proyecto.presupuesto_centavos === null
          ? null
          : centavosEn('USD', proyecto.presupuesto_centavos),
      costos: costosDelProyecto(proyecto),
      cotizacion: cotizacionDeLosCostos(proyecto),
    }),
  };
}
