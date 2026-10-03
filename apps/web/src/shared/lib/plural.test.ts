import { describe, expect, it } from 'vitest';

import { crearPlural } from './plural';

describe('los plurales de cada idioma', () => {
  const CANTIDADES = [0, 1, 1.5, 2, 1_000_000];

  it('en castellano 1.000.000 es «many»: «1.000.000 de trabajos»', () => {
    const plural = crearPlural('es-AR');
    expect(
      CANTIDADES.map((n) =>
        plural(n, {
          '=0': 'Sin trabajos',
          one: '# trabajo',
          many: '# de trabajos',
          other: '# trabajos',
        }),
      ),
    ).toEqual(['Sin trabajos', '1 trabajo', '1,5 trabajos', '2 trabajos', '1.000.000 de trabajos']);
  });

  it('en portugués 1,5 es «one», y el cero va aparte con «=0»', () => {
    const plural = crearPlural('pt-BR');
    expect(
      CANTIDADES.map((n) =>
        plural(n, {
          '=0': 'Nenhum projeto',
          one: '# projeto',
          many: '# de projetos',
          other: '# projetos',
        }),
      ),
    ).toEqual([
      'Nenhum projeto',
      '1 projeto',
      '1,5 projeto',
      '2 projetos',
      '1.000.000 de projetos',
    ]);
  });

  it('en inglés no hay «many», y sin forma para el cero va «other»', () => {
    const plural = crearPlural('en-US');
    expect(CANTIDADES.map((n) => plural(n, { one: '# job', other: '# jobs' }))).toEqual([
      '0 jobs',
      '1 job',
      '1.5 jobs',
      '2 jobs',
      '1,000,000 jobs',
    ]);
  });

  it('una forma que el idioma pide y el texto no trae cae en «other»', () => {
    expect(crearPlural('es-AR')(1_000_000, { one: '# vez', other: '# veces' })).toBe(
      '1.000.000 veces',
    );
  });
});
