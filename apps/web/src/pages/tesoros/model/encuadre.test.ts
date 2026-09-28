import { describe, expect, it } from 'vitest';

import { encuadreDe, entraEnLaVista, formaDelPlano, limitesDe } from './encuadre';

const RELLENO = { arriba: 28, abajo: 28, izquierda: 40, derecha: 40 };

describe('el encuadre del plano', () => {
  it('los límites abarcan todas las fichas, con su ancho y su alto', () => {
    expect(
      limitesDe([
        { position: { x: -136, y: 0 }, width: 272, height: 56 },
        { position: { x: 200, y: -36 }, width: 208, height: 28 },
        { position: { x: 20, y: 700 }, width: 200, height: 100 },
      ]),
    ).toEqual({ x: -136, y: -36, ancho: 544, alto: 836 });
    expect(limitesDe([])).toBeNull();
  });

  it('entra la fila entera con su relleno, sin pasar de 1:1, y centrada', () => {
    const limites = { x: -136, y: 0, ancho: 800, alto: 1000 };
    const encuadre = encuadreDe(limites, 828, 783, RELLENO);
    expect(encuadre.zoom).toBeCloseTo((783 - 56) / 1000);
    const izquierda = encuadre.x + limites.x * encuadre.zoom;
    const derecha = izquierda + limites.ancho * encuadre.zoom;
    expect(izquierda - RELLENO.izquierda).toBeCloseTo(828 - RELLENO.derecha - derecha);
    expect(encuadre.y + limites.y * encuadre.zoom).toBeCloseTo(RELLENO.arriba);

    const chica = encuadreDe({ x: 0, y: 0, ancho: 300, alto: 200 }, 1000, 800, RELLENO);
    expect(chica.zoom).toBe(1);
  });

  it('alineada arriba, lo que sobra de alto queda abajo', () => {
    const limites = { x: -136, y: 0, ancho: 788, alto: 868 };
    const centrada = encuadreDe(limites, 758, 994, RELLENO);
    const arriba = encuadreDe(limites, 758, 994, RELLENO, 'arriba');
    expect(arriba.zoom).toBe(centrada.zoom);
    expect(arriba.x).toBe(centrada.x);
    expect(arriba.y).toBe(RELLENO.arriba);
    expect(centrada.y).toBeGreaterThan(arriba.y);
  });

  it('dice si la fila entra en lo que se ve, o si alguna ficha queda afuera', () => {
    const limites = { x: 0, y: 0, ancho: 500, alto: 700 };
    expect(entraEnLaVista(limites, { x: 10, y: 10, zoom: 1 }, 600, 800)).toBe(true);
    expect(entraEnLaVista(limites, { x: 10, y: 10, zoom: 1 }, 600, 650)).toBe(false);
    expect(entraEnLaVista(limites, { x: -20, y: 10, zoom: 1 }, 600, 800)).toBe(false);
    expect(entraEnLaVista(limites, { x: 150, y: 10, zoom: 1 }, 600, 800)).toBe(false);
    expect(entraEnLaVista(limites, { x: 150, y: 10, zoom: 0.8 }, 600, 800)).toBe(true);
  });

  it('la forma cambia con las fichas, su columna y su alto, y no con dónde está una ficha en su columna', () => {
    const paso = { id: 'paso-a', position: { x: -136, y: 176 }, width: 272, height: 104 };
    const estante = { id: 'estante-b', position: { x: 200, y: 96 }, width: 208, height: 84 };
    const forma = formaDelPlano([paso, estante]);
    expect(
      formaDelPlano([
        { ...paso, position: { x: -136, y: 0 } },
        { ...estante, position: { x: 200, y: 400 } },
      ]),
    ).toBe(forma);
    expect(formaDelPlano([{ ...paso, height: 176 }, estante])).not.toBe(forma);
    expect(formaDelPlano([paso, { ...estante, position: { x: 536, y: 96 } }])).not.toBe(forma);
    expect(formaDelPlano([paso])).not.toBe(forma);
  });
});
