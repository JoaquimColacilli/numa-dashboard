import { describe, expect, it } from 'vitest';

import {
  anchoDeLaColumna,
  BANDA_MINIMA,
  caminoDeLaColumna,
  CANALETA_DEL_EJE,
  cota,
  ejeDeDecenas,
  escalaLineal,
  lugaresQueEntran,
  marcasCada,
  pisosDeLosPuntos,
  plataCompacta,
  rotuloVisible,
  techoDeDias,
  techoRedondo,
} from './graficos';
import { fijarElIdiomaEnUso } from './idioma';
import { seudoTexto } from './seudo';

const MARGENES_DE_LA_PAGINA_Y_EL_PAPEL = 66;

describe('la escala lineal', () => {
  it('lleva el dominio al rango, también al revés, y un dominio sin largo va al principio', () => {
    const y = escalaLineal([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
    expect(y(100)).toBe(0);
    expect(escalaLineal([5, 5], [10, 20])(5)).toBe(10);
  });
});

describe('el techo redondo', () => {
  it('es el primer número redondo que alcanza al máximo', () => {
    expect(techoRedondo(520_000_000)).toBe(600_000_000);
    expect(techoRedondo(2.1)).toBe(2.5);
    expect(techoRedondo(7)).toBe(8);
    expect(techoRedondo(999)).toBe(1000);
    expect(techoRedondo(1000)).toBe(1000);
    expect(techoRedondo(300_000)).toBe(300_000);
  });

  it('sin nada que dibujar, uno, para que la escala no divida por cero', () => {
    expect(techoRedondo(0)).toBe(1);
    expect(techoRedondo(-5)).toBe(1);
    expect(techoRedondo(Number.NaN)).toBe(1);
  });
});

describe('cuántos lugares entran', () => {
  it('cada mes tiene 24 px de banda como mínimo: a 320, 360 y 390 de pantalla entran 9, 10 y 11', () => {
    const lugares = [320, 360, 390].map((pantalla) => {
      const util = pantalla - MARGENES_DE_LA_PAGINA_Y_EL_PAPEL - CANALETA_DEL_EJE;
      const entran = lugaresQueEntran(util, 12);
      expect(util / entran).toBeGreaterThanOrEqual(BANDA_MINIMA);
      return entran;
    });
    expect(lugares).toEqual([9, 10, 11]);
  });

  it('en la compu entran los 12, nunca menos de 6 y nunca más de los que hay', () => {
    expect(lugaresQueEntran(600, 12)).toBe(12);
    expect(lugaresQueEntran(100, 12)).toBe(6);
    expect(lugaresQueEntran(600, 3)).toBe(3);
  });
});

describe('las columnas', () => {
  it('ocupan el 60 % de su banda hasta 24 px, y las chicas el 56 % hasta 14', () => {
    expect(anchoDeLaColumna(50)).toBe(24);
    expect(anchoDeLaColumna(30)).toBe(18);
    expect(anchoDeLaColumna(5)).toBe(4);
    expect(anchoDeLaColumna(20, true)).toBeCloseTo(11.2);
    expect(anchoDeLaColumna(40, true)).toBe(14);
  });

  it('tienen la punta redondeada y la base recta, y sin alto no se dibujan', () => {
    expect(caminoDeLaColumna(10, 50, 24, 50, 4)).toBe('M10 100V54Q10 50 14 50H30Q34 50 34 54V100Z');
    expect(caminoDeLaColumna(0, 98, 24, 2, 4)).toBe('M0 100V100Q0 98 2 98H22Q24 98 24 100V100Z');
    expect(caminoDeLaColumna(0, 0, 24, 0, 4)).toBe('');
  });

  it('un mes que dio pérdida baja desde el cero, con la punta abajo', () => {
    expect(caminoDeLaColumna(10, 100, 24, 30, 4, true)).toBe(
      'M10 100V126Q10 130 14 130H30Q34 130 34 126V100Z',
    );
  });

  it('los rótulos van todos con lugar, y si no uno sí y uno no, siempre el último y los que importan', () => {
    expect([0, 1, 2, 3].map((i) => rotuloVisible(i, 4, 34, false))).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect([0, 1, 2, 3].map((i) => rotuloVisible(i, 4, 26, false))).toEqual([
      false,
      true,
      false,
      true,
    ]);
    expect(rotuloVisible(0, 4, 26, true)).toBe(true);
  });
});

describe('los puntos apilados', () => {
  it('suben un piso cuando se pisan, y bajan al primero libre', () => {
    expect(pisosDeLosPuntos([10, 11, 30, 40, 41, 42], 12)).toEqual([0, 1, 0, 1, 2, 0]);
    expect(pisosDeLosPuntos([], 12)).toEqual([]);
  });
});

describe('los ejes', () => {
  it('los días van de 0 a la decena de arriba del máximo, con 30 como mínimo', () => {
    expect(techoDeDias([14, 45])).toBe(50);
    expect(techoDeDias([31])).toBe(40);
    expect(techoDeDias([5])).toBe(30);
    expect(techoDeDias([])).toBe(30);
    expect(marcasCada(50, 10)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(marcasCada(70, 10, 30)).toEqual([30, 40, 50, 60, 70]);
  });

  it('lo de cada $ 100 va de la decena de abajo a la de arriba, con 20 como mínimo y sin pasar de 0 ni de 100', () => {
    expect(ejeDeDecenas([39, 63])).toEqual([30, 70]);
    expect(ejeDeDecenas([55, 59])).toEqual([40, 70]);
    expect(ejeDeDecenas([95, 100])).toEqual([80, 100]);
    expect(ejeDeDecenas([0, 0])).toEqual([0, 20]);
    expect(ejeDeDecenas([-15, 20])).toEqual([-20, 20]);
  });
});

describe('la cota', () => {
  it('dos marcas en las puntas, la línea entre ellas y las dos flechas', () => {
    expect(cota(20, 120, 100)).toEqual({
      lineas: 'M20 95v10M120 95v10M20 100H120',
      flechas: 'M20 100l6 -3v6zM120 100l-6 -3v6z',
    });
  });
});

describe('la plata compacta de los ejes', () => {
  it('en millones con un decimal, en miles sin decimales y nunca «950,0 k» ni «K»', () => {
    expect(plataCompacta(0, 'es')).toBe('0');
    expect(plataCompacta(600_000_000, 'es')).toBe('$ 6 M');
    expect(plataCompacta(520_000_000, 'es')).toBe('$ 5,2 M');
    expect(plataCompacta(95_000_000, 'es')).toBe('$ 950 k');
    expect(plataCompacta(99_950_000, 'es')).toBe('$ 1 M');
    expect(plataCompacta(99_960, 'es')).toBe('$ 1 k');
    expect(plataCompacta(50_000, 'es')).toBe('$ 500');
    expect(plataCompacta(123_450_000_000, 'es')).toBe('$ 1.234,5 M');
    expect(plataCompacta(-520_000_000, 'es')).toBe('−$ 5,2 M');
  });

  it('con el símbolo y los separadores del idioma', () => {
    expect(plataCompacta(520_000_000, 'en')).toBe('ARS 5.2 M');
    expect(plataCompacta(123_450_000_000, 'en')).toBe('ARS 1,234.5 M');
    expect(plataCompacta(95_000_000, 'pt-BR')).toBe('ARS 950 k');
    expect(plataCompacta(520_000_000, 'pt-BR')).toBe('ARS 5,2 M');
  });

  it('con el seudoidioma sale marcada, como las fechas, y el cero queda solo', () => {
    try {
      fijarElIdiomaEnUso('es', true);
      expect(plataCompacta(95_000_000)).toBe(seudoTexto('$ 950 k'));
      expect(plataCompacta(520_000_000)).toBe(seudoTexto('$ 5,2 M'));
      expect(plataCompacta(50_000)).toBe(seudoTexto('$ 500'));
      expect(plataCompacta(0)).toBe('0');
    } finally {
      fijarElIdiomaEnUso('es');
    }
    expect(plataCompacta(95_000_000)).toBe('$ 950 k');
  });
});
