import {
  aplicarPorcentaje,
  puntosBasicos,
  restar,
  type Moneda,
  type MonedaDelTaller,
  type Money,
  type PuntosBasicos,
} from './money.ts';

export const SENA_HABITUAL: PuntosBasicos = puntosBasicos(5_000);

export interface EntradaDeLaSena<M extends Moneda = MonedaDelTaller> {
  presupuesto: Money<M> | null;
  cobrado: Money<M>;
  porcentajeDelTaller: PuntosBasicos;
  porcentajeDelTrabajo: PuntosBasicos | null;
}

export type SenaDelTrabajo<M extends Moneda = MonedaDelTaller> =
  | { situacion: 'sin-presupuesto' }
  | {
      situacion: 'falta';
      porcentaje: PuntosBasicos;
      esperada: Money<M>;
      cobrado: Money<M>;
      falta: Money<M>;
    }
  | {
      situacion: 'cubierta';
      porcentaje: PuntosBasicos;
      esperada: Money<M>;
      cobrado: Money<M>;
      deMas: Money<M>;
    };

export function porcentajeDeLaSena(
  porcentajeDelTrabajo: PuntosBasicos | null,
  porcentajeDelTaller: PuntosBasicos,
): PuntosBasicos {
  return porcentajeDelTrabajo ?? porcentajeDelTaller;
}

export function calcularSena<M extends Moneda = MonedaDelTaller>(
  entrada: EntradaDeLaSena<M>,
): SenaDelTrabajo<M> {
  if (entrada.presupuesto === null) return { situacion: 'sin-presupuesto' };

  const porcentaje = porcentajeDeLaSena(entrada.porcentajeDelTrabajo, entrada.porcentajeDelTaller);
  const esperada = aplicarPorcentaje(entrada.presupuesto, porcentaje);
  const cobrado = entrada.cobrado;

  if (cobrado >= esperada) {
    return {
      situacion: 'cubierta',
      porcentaje,
      esperada,
      cobrado,
      deMas: restar(cobrado, esperada),
    };
  }

  return { situacion: 'falta', porcentaje, esperada, cobrado, falta: restar(esperada, cobrado) };
}
