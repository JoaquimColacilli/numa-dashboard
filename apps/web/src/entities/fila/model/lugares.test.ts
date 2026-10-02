import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { entraEnLaFila, lugaresParaSumar } from './lugares';

const FILA: Fila = {
  obligaciones: [{ tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: 'hogar',
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [],
  superavit: 'maun',
  sueldoPorTrabajo: false,
};

describe('los lugares para sumar un tesoro a la fila', () => {
  it('la fila reparte pesos: uno en dólares no entra en ningún lugar', () => {
    expect(entraEnLaFila({ moneda: 'ARS' })).toBe(true);
    expect(entraEnLaFila({ moneda: 'USD' })).toBe(false);
    expect(
      lugaresParaSumar(FILA, 'dolares', null, 'USD').map((lugar) => [lugar.lugar, lugar.sePuede]),
    ).toEqual([
      ['obligacion', false],
      ['compromiso', false],
      ['ahorro-fijo', false],
      ['reparto', false],
      ['superavit', false],
    ]);
  });

  it('uno en pesos, como siempre', () => {
    expect(
      lugaresParaSumar(FILA, 'vacaciones', null).map((lugar) => [lugar.lugar, lugar.sePuede]),
    ).toEqual([
      ['obligacion', true],
      ['compromiso', true],
      ['ahorro-fijo', true],
      ['reparto', true],
      ['superavit', true],
    ]);
  });
});
