import { describe, expect, it } from 'vitest';

import { centavos, centavosEn } from './money.ts';
import {
  deLaMoneda,
  enPesos,
  esDeLaMoneda,
  plata,
  plataEn,
  sumarPlata,
  totalesPorMoneda,
  type Plata,
  type PlataEn,
} from './plata.ts';

describe('Plata', () => {
  it('lleva el importe con su moneda', () => {
    expect(plata('USD', 125_000)).toEqual({ importe: 125_000, moneda: 'USD' });
    expect(plataEn('ARS', 10)).toEqual({ importe: 10, moneda: 'ARS' });
    expect(enPesos(centavos(300))).toEqual({ importe: 300, moneda: 'ARS' });
    expect(() => plata('USD', 0.5)).toThrow(RangeError);
  });

  it('separa por moneda sin mezclar', () => {
    const platas: Plata[] = [plata('ARS', 100), plata('USD', 5), plata('ARS', 50)];
    expect(deLaMoneda(platas, 'ARS')).toEqual([plata('ARS', 100), plata('ARS', 50)]);
    expect(deLaMoneda(platas, 'USD')).toEqual([plata('USD', 5)]);
    expect(esDeLaMoneda(plata('USD', 5), 'USD')).toBe(true);
    expect(esDeLaMoneda(plata('USD', 5), 'ARS')).toBe(false);
  });

  it('suma solo dentro de una moneda', () => {
    expect(sumarPlata(plataEn('USD', 100), plataEn('USD', 25))).toEqual(plata('USD', 125));
    const pesos: PlataEn<'ARS'> = plataEn('ARS', 1);
    const dolares: PlataEn<'USD'> = plataEn('USD', 1);
    // @ts-expect-error: la plata de dos monedas no se suma
    expect(sumarPlata(pesos, dolares).importe).toBe(2);
    expect(centavosEn('USD', 1)).toBe(1);
  });

  it('los totales van por moneda, los pesos primero, con cuántos tesoros suma cada uno', () => {
    expect(
      totalesPorMoneda([plata('USD', 125_000), plata('ARS', 235_000_000), plata('USD', 5_000)]),
    ).toEqual([
      { total: plata('ARS', 235_000_000), cuantas: 1 },
      { total: plata('USD', 130_000), cuantas: 2 },
    ]);
    expect(totalesPorMoneda([plata('USD', 1)])).toEqual([{ total: plata('USD', 1), cuantas: 1 }]);
    expect(totalesPorMoneda([])).toEqual([]);
  });

  it('un total que se pasa del rango seguro corta en vez de redondear', () => {
    expect(() =>
      totalesPorMoneda([plata('ARS', Number.MAX_SAFE_INTEGER), plata('ARS', 1)]),
    ).toThrow(RangeError);
  });
});
