import { describe, expect, it } from 'vitest';

import {
  aplicarPorcentaje,
  centavos,
  centavosEn,
  CERO,
  esMoneda,
  esNegativo,
  importeDelTaller,
  maximo,
  minimo,
  MONEDA_DEL_TALLER,
  monedaLeida,
  MONEDAS,
  negar,
  puntosBasicos,
  restar,
  sumar,
  sumarTodos,
  type Moneda,
  type Money,
} from './money.ts';

describe('las monedas', () => {
  it('son pesos y dólares, y el taller reparte en pesos', () => {
    expect(MONEDAS).toEqual(['ARS', 'USD']);
    expect(MONEDA_DEL_TALLER).toBe('ARS');
  });

  it('reconoce una moneda de la lista y lee lo demás como la del taller', () => {
    expect(esMoneda('USD')).toBe(true);
    expect(esMoneda('EUR')).toBe(false);
    expect(esMoneda(1)).toBe(false);
    expect(monedaLeida('USD')).toBe('USD');
    expect(monedaLeida(undefined)).toBe('ARS');
    expect(monedaLeida('usd')).toBe('ARS');
  });

  it('centavosEn pide la moneda y valida igual que centavos', () => {
    const dolares: Money<'USD'> = centavosEn('USD', 50_000);
    expect(dolares).toBe(50_000);
    expect(() => centavosEn('USD', 1.5)).toThrow(RangeError);
  });

  it('importeDelTaller afirma que un importe de moneda desconocida es de la moneda del taller', () => {
    const deUnTesoroDeLaFila: Money<Moneda> = centavos(500);
    const enPesos: Money = importeDelTaller(deUnTesoroDeLaFila);
    expect(enPesos).toBe(500);
    expect(() => importeDelTaller(0.5 as Money<Moneda>)).toThrow(RangeError);
  });

  it('negar da vuelta el signo sin cambiar la moneda', () => {
    expect(negar(centavosEn('USD', 125))).toBe(-125);
    expect(negar(CERO)).toBe(0);
    expect(() => negar(centavos(Number.MIN_SAFE_INTEGER))).not.toThrow();
  });
});

describe('los tipos no dejan mezclar monedas', () => {
  const pesos = centavos(100);
  const dolares = centavosEn('USD', 100);
  const deCualquiera: Money<Moneda> = dolares;

  it('Money sin moneda sigue siendo pesos', () => {
    const enPesos: Money = centavosEn('ARS', 100);
    // @ts-expect-error: los dólares no van donde van pesos
    const mal: Money = dolares;
    expect([enPesos, mal, pesos]).toEqual([100, 100, 100]);
  });

  it('sumar, restar, el mínimo y el máximo piden la misma moneda de los dos lados', () => {
    expect(sumar(dolares, dolares)).toBe(200);
    // @ts-expect-error: no se suman pesos con dólares
    expect(sumar(pesos, dolares)).toBe(200);
    // @ts-expect-error: no se restan dólares de pesos
    expect(restar(pesos, dolares)).toBe(0);
    // @ts-expect-error: no se compara el mínimo entre monedas
    expect(minimo(dolares, pesos)).toBe(100);
    // @ts-expect-error: ni el máximo
    expect(maximo(dolares, pesos)).toBe(100);
  });

  it('sumarTodos no acepta una lista con las dos monedas', () => {
    expect(sumarTodos<'USD'>([dolares, dolares])).toBe(200);
    // @ts-expect-error: una lista mezclada no se suma
    expect(sumarTodos([pesos, dolares])).toBe(200);
  });

  it('el constructor de pesos no fabrica dólares', () => {
    // @ts-expect-error: centavos devuelve pesos, no dólares
    const fabricado: Money<'USD'> = centavos(100);
    expect(fabricado).toBe(100);
  });

  it('un importe de moneda desconocida no pasa por pesos', () => {
    // @ts-expect-error: no se sabe si son pesos
    const comoPesos: Money = deCualquiera;
    expect(comoPesos).toBe(100);
  });
});

describe('centavos', () => {
  it('acepta enteros seguros, también negativos y cero', () => {
    expect(centavos(124_000_000)).toBe(124_000_000);
    expect(centavos(-500)).toBe(-500);
    expect(centavos(0)).toBe(CERO);
    expect(centavos(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('rechaza decimales, NaN, infinitos y enteros fuera del rango seguro', () => {
    for (const valor of [
      0.5,
      10.01,
      Number.NaN,
      Infinity,
      -Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() => centavos(valor)).toThrow(RangeError);
    }
  });
});

describe('operaciones', () => {
  it('suma, resta y suma listas de forma exacta', () => {
    expect(sumar(centavos(10), centavos(20))).toBe(30);
    expect(restar(centavos(10), centavos(25))).toBe(-15);
    expect(sumarTodos([centavos(40_000_000), centavos(40_000_000), centavos(44_000_000)])).toBe(
      124_000_000,
    );
    expect(sumarTodos([])).toBe(0);
  });

  it('corta en vez de perder precisión cuando el resultado sale del rango seguro', () => {
    expect(() => sumar(centavos(Number.MAX_SAFE_INTEGER), centavos(1))).toThrow(RangeError);
    expect(() => restar(centavos(-Number.MAX_SAFE_INTEGER), centavos(1))).toThrow(RangeError);
  });

  it('mínimo, máximo y signo', () => {
    expect(minimo(centavos(3), centavos(7))).toBe(3);
    expect(minimo(centavos(7), centavos(3))).toBe(3);
    expect(maximo(centavos(3), centavos(7))).toBe(7);
    expect(maximo(centavos(7), centavos(3))).toBe(7);
    expect(esNegativo(centavos(-1))).toBe(true);
    expect(esNegativo(CERO)).toBe(false);
  });
});

describe('puntosBasicos', () => {
  it('acepta enteros entre 0 y 10.000', () => {
    expect(puntosBasicos(0)).toBe(0);
    expect(puntosBasicos(1_000)).toBe(1_000);
    expect(puntosBasicos(10_000)).toBe(10_000);
  });

  it('rechaza negativos, decimales y más de 100%', () => {
    for (const valor of [-1, 10_001, 10.5, Number.NaN]) {
      expect(() => puntosBasicos(valor)).toThrow(RangeError);
    }
  });
});

describe('aplicarPorcentaje', () => {
  it('redondea mitad hacia arriba al centavo', () => {
    const diezPorciento = puntosBasicos(1_000);
    expect(aplicarPorcentaje(centavos(15), diezPorciento)).toBe(2);
    expect(aplicarPorcentaje(centavos(14), diezPorciento)).toBe(1);
    expect(aplicarPorcentaje(centavos(5), diezPorciento)).toBe(1);
    expect(aplicarPorcentaje(centavos(4), diezPorciento)).toBe(0);
    expect(aplicarPorcentaje(centavos(88_670_000), diezPorciento)).toBe(8_867_000);
  });

  it('cero y cien por ciento', () => {
    expect(aplicarPorcentaje(centavos(12_345), puntosBasicos(0))).toBe(0);
    expect(aplicarPorcentaje(centavos(12_345), puntosBasicos(10_000))).toBe(12_345);
    expect(aplicarPorcentaje(CERO, puntosBasicos(1_000))).toBe(0);
  });

  it('solo se aplica sobre importes no negativos', () => {
    expect(() => aplicarPorcentaje(centavos(-100), puntosBasicos(1_000))).toThrow(RangeError);
  });

  it('corta si el producto no entra en el rango seguro', () => {
    expect(() =>
      aplicarPorcentaje(centavos(Number.MAX_SAFE_INTEGER), puntosBasicos(1_000)),
    ).toThrow(RangeError);
  });

  it('da exactamente lo mismo que la cuenta entera con BigInt, también con importes grandes', () => {
    let estado = 20_260_911;
    const siguiente = (tope: number): number => {
      estado = (estado + 0x6d2b79f5) >>> 0;
      let t = estado;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4_294_967_296) * tope);
    };
    const casos: [number, number][] = [
      [900_719_925_473, 10_000],
      [900_719_925_473, 9_999],
      [9_007_199_254_730, 1_000],
      [15, 1_000],
      [5, 1_000],
    ];
    for (let i = 0; i < 3_000; i++) {
      const bp = siguiente(10_001);
      const limite = Math.floor((Number.MAX_SAFE_INTEGER - 5_000) / Math.max(bp, 1));
      casos.push([siguiente(limite + 1), bp]);
    }
    for (const [importe, bp] of casos) {
      const esperado = Number((BigInt(importe) * BigInt(bp) + 5_000n) / 10_000n);
      expect(aplicarPorcentaje(centavos(importe), puntosBasicos(bp))).toBe(esperado);
    }
  });
});
