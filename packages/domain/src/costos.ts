import { dolaresDePesos, type Cotizacion } from './cotizacion.ts';
import { restar, sumar, type Moneda, type MonedaDelTaller, type Money } from './money.ts';

export const CATEGORIAS_DE_COSTO = ['madera', 'herrajes', 'flete', 'ayudante'] as const;

export type CategoriaDeCosto = (typeof CATEGORIAS_DE_COSTO)[number];

export type CostosEstimados<M extends Moneda = MonedaDelTaller> = Readonly<
  Record<CategoriaDeCosto, Money<M> | null>
>;

export const SIN_ESTIMAR: CostosEstimados = {
  madera: null,
  herrajes: null,
  flete: null,
  ayudante: null,
};

export interface EntradaDelMargen<M extends Moneda = MonedaDelTaller> {
  presupuesto: Money<M> | null;
  costos: CostosEstimados<M>;
}

export type MargenDelTrabajo<M extends Moneda = MonedaDelTaller> =
  | { situacion: 'sin-estimar' }
  | { situacion: 'sin-presupuesto'; estimado: Money<M>; cargadas: number }
  | {
      situacion: 'con-margen';
      estimado: Money<M>;
      cargadas: number;
      presupuesto: Money<M>;
      margen: Money<M>;
    };

export type MargenEnDolares =
  MargenDelTrabajo<'USD'> | { situacion: 'sin-cotizacion'; estimado: Money; cargadas: number };

export interface EntradaDelMargenEnDolares {
  presupuesto: Money<'USD'> | null;
  costos: CostosEstimados;
  cotizacion: Cotizacion | null;
}

export function categoriasEstimadas(costos: CostosEstimados<Moneda>): number {
  return CATEGORIAS_DE_COSTO.filter((categoria) => costos[categoria] !== null).length;
}

export function costoEstimado<M extends Moneda = MonedaDelTaller>(
  costos: CostosEstimados<M>,
): Money<M> {
  let total = 0 as Money<M>;
  for (const categoria of CATEGORIAS_DE_COSTO) {
    const costo = costos[categoria];
    if (costo !== null) total = sumar(total, costo);
  }
  return total;
}

export function calcularMargen<M extends Moneda = MonedaDelTaller>(
  entrada: EntradaDelMargen<M>,
): MargenDelTrabajo<M> {
  const cargadas = categoriasEstimadas(entrada.costos);
  if (cargadas === 0) return { situacion: 'sin-estimar' };

  const estimado = costoEstimado(entrada.costos);
  if (entrada.presupuesto === null) return { situacion: 'sin-presupuesto', estimado, cargadas };

  return {
    situacion: 'con-margen',
    estimado,
    cargadas,
    presupuesto: entrada.presupuesto,
    margen: restar(entrada.presupuesto, estimado),
  };
}

export function costosEnDolares(
  costos: CostosEstimados,
  cotizacion: Cotizacion,
): CostosEstimados<'USD'> {
  const enDolares = (costo: Money | null) =>
    costo === null ? null : dolaresDePesos(costo, cotizacion);
  return {
    madera: enDolares(costos.madera),
    herrajes: enDolares(costos.herrajes),
    flete: enDolares(costos.flete),
    ayudante: enDolares(costos.ayudante),
  };
}

export function calcularMargenEnDolares(entrada: EntradaDelMargenEnDolares): MargenEnDolares {
  const cargadas = categoriasEstimadas(entrada.costos);
  if (cargadas === 0) return { situacion: 'sin-estimar' };
  if (entrada.cotizacion === null) {
    return { situacion: 'sin-cotizacion', estimado: costoEstimado(entrada.costos), cargadas };
  }
  return calcularMargen({
    presupuesto: entrada.presupuesto,
    costos: costosEnDolares(entrada.costos, entrada.cotizacion),
  });
}
