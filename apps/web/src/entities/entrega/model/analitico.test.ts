import { cuentaDe, resumirDias } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  cuantosTrabajos,
  desvioEnPalabras,
  enDias,
  fraseDeLasCumplidas,
  fraseDeLosAciertos,
  fraseDelDesvio,
  hayAlgoPorCarga,
  resumenDeLosDias,
  resumenDelDesvio,
} from './analitico';

describe('las frases de la precisión', () => {
  it('el desvío: sin trabajos, con pocos, y desde la mediana en los dos sentidos', () => {
    expect(fraseDelDesvio(resumirDias([]))).toBe(
      'Todavía no entregaste ningún trabajo con una fecha estimada para comparar.',
    );
    expect(fraseDelDesvio(resumirDias([2]))).toBe(
      'Con un trabajo todavía son pocos para sacar una cuenta: miralos uno por uno.',
    );
    expect(fraseDelDesvio(resumirDias([2, 3, 4]))).toBe(
      'Con 3 trabajos todavía son pocos para sacar una cuenta: miralos uno por uno.',
    );
    expect(fraseDelDesvio(resumirDias([4, 4, 4, 5, 2]))).toBe(
      'Entregás, en la mediana, 4 días después de lo estimado.',
    );
    expect(fraseDelDesvio(resumirDias([1, 1, 1, 0, 2]))).toBe(
      'Entregás, en la mediana, 1 día después de lo estimado.',
    );
    expect(fraseDelDesvio(resumirDias([-3, -2, -1, -4, -2, -1]))).toBe(
      'Entregás, en la mediana, 2 días antes de lo estimado.',
    );
    expect(fraseDelDesvio(resumirDias([0, 1, -1, 0, 0]))).toBe(
      'Entregás, en la mediana, el mismo día que estimaste.',
    );
    expect(fraseDelDesvio(resumirDias([1, 2, 3, 4, 5, 6]))).toBe(
      'Entregás, en la mediana, 3,5 días después de lo estimado.',
    );
  });

  it('los aciertos y las cumplidas, con el porcentaje recién desde 20', () => {
    expect(fraseDeLosAciertos(cuentaDe(7, 12))).toBe('Acertaste 7 de 12.');
    expect(fraseDeLasCumplidas(cuentaDe(9, 11))).toBe('Cumpliste 9 de 11 fechas comprometidas.');
    expect(fraseDeLosAciertos(cuentaDe(15, 22))).toBe('Acertaste 15 de 22 (68%).');
    expect(fraseDeLasCumplidas(cuentaDe(20, 20))).toBe(
      'Cumpliste 20 de 20 fechas comprometidas (100%).',
    );
  });
});

describe('los días en palabras', () => {
  it('uno, varios y con decimales', () => {
    expect(enDias(1)).toBe('1 día');
    expect(enDias(-1)).toBe('-1 día');
    expect(enDias(12)).toBe('12 días');
    expect(enDias(2.5)).toBe('2,5 días');
  });

  it('el desvío dice antes, después o el mismo día', () => {
    expect(desvioEnPalabras(0)).toBe('el mismo día');
    expect(desvioEnPalabras(3)).toBe('3 días después');
    expect(desvioEnPalabras(-1)).toBe('1 día antes');
  });
});

describe('el resumen de unos días', () => {
  it('con pocos, los casos uno por uno', () => {
    expect(resumenDeLosDias(resumirDias([]))).toBe('Sin datos todavía');
    expect(resumenDeLosDias(resumirDias([1]))).toBe('1 día');
    expect(resumenDeLosDias(resumirDias([20]))).toBe('20 días');
    expect(resumenDeLosDias(resumirDias([20, 25, 31]))).toBe('20, 25 y 31 días');
  });

  it('desde cinco, la mediana con el más corto y el más largo', () => {
    expect(resumenDeLosDias(resumirDias([10, 20, 30, 40, 50]))).toBe(
      '30 días en la mediana, de 10 a 50',
    );
    expect(resumenDeLosDias(resumirDias([10, 20, 30, 40, 50, 61]))).toBe(
      '35 días en la mediana, de 10 a 61',
    );
  });

  it('el desvío, igual', () => {
    expect(resumenDelDesvio(resumirDias([]))).toBe('Sin fecha estimada para comparar');
    expect(resumenDelDesvio(resumirDias([2, -1]))).toBe('2 días después y 1 día antes');
    expect(resumenDelDesvio(resumirDias([0, 0, 1, 2, 3]))).toBe('1 día después en la mediana');
  });
});

describe('lo demás', () => {
  it('cuenta los trabajos y si hay algo por carga', () => {
    expect(cuantosTrabajos(1)).toBe('1 trabajo');
    expect(cuantosTrabajos(4)).toBe('4 trabajos');
    expect(
      hayAlgoPorCarga([{ nombre: '0 o 1', desde: 0, hasta: 1, demora: resumirDias([]) }]),
    ).toBe(false);
    expect(
      hayAlgoPorCarga([{ nombre: '0 o 1', desde: 0, hasta: 1, demora: resumirDias([3]) }]),
    ).toBe(true);
  });
});
