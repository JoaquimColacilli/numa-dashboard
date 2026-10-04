import { describe, expect, it } from 'vitest';

import { centavos } from './money.ts';
import {
  CATEGORIA_MAXIMA,
  CATEGORIAS_DEL_MONOTRIBUTO,
  categoriaLeida,
  esCategoriaDelMonotributo,
  ESCALAS_DEL_MONOTRIBUTO,
  escalaVigente,
  type EscalaDelMonotributo,
} from './monotributo.ts';

const [AGOSTO_2026] = ESCALAS_DEL_MONOTRIBUTO;

function escalaDe(vigenteDesde: string, base: number): EscalaDelMonotributo {
  return {
    vigenteDesde,
    fuente: 'https://ejemplo.test',
    topesCentavos: Object.fromEntries(
      CATEGORIAS_DEL_MONOTRIBUTO.map((categoria, indice) => [
        categoria,
        centavos(base * (indice + 1)),
      ]),
    ) as EscalaDelMonotributo['topesCentavos'],
    precioUnitarioMaximoCentavos: centavos(base),
  };
}

describe('la escala del monotributo', () => {
  it('tiene las once categorías, de la A a la K, y la K es la más alta', () => {
    expect(CATEGORIAS_DEL_MONOTRIBUTO).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
    ]);
    expect(CATEGORIA_MAXIMA).toBe('K');
  });

  it('en cada escala, los topes suben de la A a la K', () => {
    for (const escala of ESCALAS_DEL_MONOTRIBUTO) {
      const topes = CATEGORIAS_DEL_MONOTRIBUTO.map((categoria) => escala.topesCentavos[categoria]);
      for (let indice = 1; indice < topes.length; indice += 1) {
        expect(topes[indice]).toBeGreaterThan(topes[indice - 1] ?? Infinity);
      }
    }
  });

  it('la de agosto de 2026 es la de la página de categorías de ARCA, con sus centavos', () => {
    expect(AGOSTO_2026?.vigenteDesde).toBe('2026-08-01');
    expect(AGOSTO_2026?.fuente).toBe('https://www.afip.gob.ar/monotributo/categorias.asp');
    expect(AGOSTO_2026?.topesCentavos).toEqual({
      A: 1_200_941_045,
      B: 1_759_518_274,
      C: 2_467_049_431,
      D: 3_062_865_143,
      E: 3_602_823_133,
      F: 4_515_165_941,
      G: 5_399_579_887,
      H: 8_192_466_037,
      I: 9_169_976_190,
      J: 10_501_251_920,
      K: 12_661_083_875,
    });
    expect(AGOSTO_2026?.precioUnitarioMaximoCentavos).toBe(71_684_077);
  });

  it('cada tope es un entero de centavos', () => {
    for (const escala of ESCALAS_DEL_MONOTRIBUTO) {
      for (const tope of Object.values(escala.topesCentavos)) {
        expect(Number.isSafeInteger(tope)).toBe(true);
      }
    }
  });
});

describe('las categorías leídas', () => {
  it('reconoce una letra de la A a la K', () => {
    expect(esCategoriaDelMonotributo('D')).toBe(true);
    expect(categoriaLeida('K')).toBe('K');
  });

  it('lo que no es una categoría se lee como sin categoría', () => {
    expect(esCategoriaDelMonotributo('L')).toBe(false);
    expect(esCategoriaDelMonotributo('d')).toBe(false);
    expect(esCategoriaDelMonotributo(4)).toBe(false);
    expect(categoriaLeida(null)).toBeNull();
    expect(categoriaLeida(undefined)).toBeNull();
    expect(categoriaLeida('')).toBeNull();
  });
});

describe('escalaVigente', () => {
  it('el día que empieza a regir ya es la vigente', () => {
    expect(escalaVigente('2026-08-01')).toBe(AGOSTO_2026);
    expect(escalaVigente('2026-10-03')).toBe(AGOSTO_2026);
  });

  it('antes de la primera escala devuelve la primera', () => {
    expect(escalaVigente('2026-07-31')).toBe(AGOSTO_2026);
  });

  it('una escala nueva no pisa la de antes: cada fecha toma la suya', () => {
    const vieja = escalaDe('2026-08-01', 100);
    const nueva = escalaDe('2027-02-01', 200);
    expect(escalaVigente('2027-01-31', [vieja, nueva])).toBe(vieja);
    expect(escalaVigente('2027-02-01', [vieja, nueva])).toBe(nueva);
    expect(escalaVigente('2027-06-30', [nueva, vieja])).toBe(nueva);
    expect(escalaVigente('2026-01-01', [nueva, vieja])).toBe(vieja);
  });

  it('si dos escalas rigen desde el mismo día, vale la que se sumó después', () => {
    const primera = escalaDe('2027-02-01', 200);
    const corregida = escalaDe('2027-02-01', 210);
    expect(escalaVigente('2027-03-01', [primera, corregida])).toBe(corregida);
  });

  it('sin ninguna escala no hay tope que mirar', () => {
    expect(() => escalaVigente('2026-10-03', [])).toThrow(RangeError);
  });
});
