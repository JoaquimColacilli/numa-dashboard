import { describe, expect, it } from 'vitest';

import { fijarLosTextosDeLib, tablaDeLib, textosDeLib, type TextosDeLib } from './textos';

function conLosTextos(otros: TextosDeLib, hacer: () => void): void {
  const anteriores = textosDeLib();
  try {
    fijarLosTextosDeLib(() => otros);
    hacer();
  } finally {
    fijarLosTextosDeLib(() => anteriores);
  }
}

describe('los textos de shared/lib', () => {
  it('los lee de quien los fija, en el momento en que se piden', () => {
    const anteriores = textosDeLib();
    let actuales: TextosDeLib = { ...anteriores };
    try {
      fijarLosTextosDeLib(() => actuales);
      expect(textosDeLib()).toBe(actuales);
      actuales = { ...actuales };
      expect(textosDeLib()).toBe(actuales);
    } finally {
      fijarLosTextosDeLib(() => anteriores);
    }
  });

  it('una tabla de lib se lee como un objeto común, con los textos de ese momento', () => {
    const TINTAS = tablaDeLib((textos) => textos.tintas);
    expect(TINTAS.hogar).toBe('Verde');
    expect(Object.keys(TINTAS)).toEqual(Object.keys(textosDeLib().tintas));
    expect({ ...TINTAS }).toEqual(textosDeLib().tintas);
    expect('ciruela' in TINTAS).toBe(true);

    const otros = { ...textosDeLib(), tintas: { ...textosDeLib().tintas, hogar: 'Green' } };
    conLosTextos(otros, () => {
      expect(TINTAS.hogar).toBe('Green');
    });
    expect(TINTAS.hogar).toBe('Verde');
  });

  it('y una lista también: se recorre, se indexa y se cuenta', () => {
    const DIAS = tablaDeLib((textos) => textos.semana.dias);
    expect(DIAS.map((dia) => dia)).toEqual(['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']);
    expect(DIAS[2]).toBe('mié');
    expect(DIAS).toHaveLength(7);
    expect([...DIAS].at(-1)).toBe('dom');
  });
});
