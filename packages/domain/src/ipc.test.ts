import { describe, expect, it } from 'vitest';

import { correrMes, mesesEntre } from './fechas.ts';
import { indiceAlDia, valorDelIndice } from './inflacion.ts';
import { IPC } from './ipc.ts';

const LEIDA_EL_2_DE_OCTUBRE: readonly [string, number][] = [
  ['2024-01', 4261.5324],
  ['2024-02', 4825.7881],
  ['2024-03', 5357.0929],
  ['2024-04', 5830.2271],
  ['2024-05', 6073.7],
  ['2024-06', 6351.7145],
  ['2024-07', 6607.7479],
  ['2024-08', 6883.4412],
  ['2024-09', 7122.2421],
  ['2024-10', 7313.9542],
  ['2024-11', 7491.4314],
  ['2024-12', 7694.0075],
  ['2025-01', 7864.1257],
  ['2025-02', 8052.9927],
  ['2025-03', 8353.3158],
];

describe('el IPC que viaja con el código', () => {
  it('es la serie del INDEC con base diciembre 2016 = 100, un valor por mes, sin huecos', () => {
    expect(IPC.desde).toBe('2016-12');
    expect(valorDelIndice(IPC, '2016-12')).toBe(100);
    expect(IPC.valores).toHaveLength(mesesEntre(IPC.desde, IPC.hasta) + 1);
    expect(IPC.valores.every((valor) => Number.isFinite(valor) && valor > 0)).toBe(true);
    expect(IPC.fuente).toMatch(/INDEC/);
  });

  it('llega por lo menos hasta agosto de 2026, con el valor del informe del INDEC', () => {
    expect(IPC.hasta >= '2026-08').toBe(true);
    expect(valorDelIndice(IPC, '2026-08')).toBeCloseTo(12276.77, 1);
    expect(indiceAlDia(IPC, correrMes(IPC.hasta, 2))).toBe(true);
  });

  it('coincide con la serie de datos.gob.ar leída el 2 de octubre de 2026', () => {
    for (const [mes, valor] of LEIDA_EL_2_DE_OCTUBRE) {
      expect(Math.abs((valorDelIndice(IPC, mes) ?? 0) - valor), mes).toBeLessThan(0.02);
    }
  });
});
