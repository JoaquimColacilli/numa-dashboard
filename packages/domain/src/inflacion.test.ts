import { describe, expect, it } from 'vitest';

import {
  alPeso,
  aPesosDeHoy,
  cambioReal,
  factorDePesosDeHoy,
  indiceAlDia,
  MESES_SIN_PUBLICAR,
  porcentajeEntero,
  totalEnPesosDeHoy,
  valorDelIndice,
  type IndiceDePrecios,
} from './inflacion.ts';
import { centavos } from './money.ts';

const INDICE: IndiceDePrecios = {
  fuente: 'de prueba',
  desde: '2026-01',
  hasta: '2026-04',
  valores: [100, 110, 120, 200],
};

describe('el índice', () => {
  it('da el valor de cada mes publicado, y nada fuera de él', () => {
    expect(valorDelIndice(INDICE, '2026-01')).toBe(100);
    expect(valorDelIndice(INDICE, '2026-04')).toBe(200);
    expect(valorDelIndice(INDICE, '2025-12')).toBeNull();
    expect(valorDelIndice(INDICE, '2026-05')).toBeNull();
    expect(valorDelIndice(INDICE, 'abril')).toBeNull();
  });

  it('está al día si su último mes es el mes en curso menos dos o posterior', () => {
    expect(MESES_SIN_PUBLICAR).toBe(2);
    expect(indiceAlDia(INDICE, '2026-06')).toBe(true);
    expect(indiceAlDia(INDICE, '2026-05')).toBe(true);
    expect(indiceAlDia(INDICE, '2026-07')).toBe(false);
  });
});

describe('pesos de hoy', () => {
  it('es el monto por el índice del último mes publicado sobre el de su mes', () => {
    expect(factorDePesosDeHoy(INDICE, '2026-01', '2026-06')).toBe(2);
    expect(factorDePesosDeHoy(INDICE, '2026-04', '2026-06')).toBe(1);
    expect(aPesosDeHoy(centavos(1_000_000), '2026-01', INDICE, '2026-06')).toBe(2_000_000);
  });

  it('sale redondeado al peso por la cuenta', () => {
    expect(aPesosDeHoy(centavos(100_000), '2026-02', INDICE, '2026-06')).toBe(181_800);
    expect(aPesosDeHoy(centavos(1_234_567), '2026-04', INDICE, '2026-06')).toBe(1_234_600);
  });

  it('los meses posteriores al último publicado van como están, con sus centavos', () => {
    expect(factorDePesosDeHoy(INDICE, '2026-05', '2026-06')).toBeNull();
    expect(aPesosDeHoy(centavos(1_234_567), '2026-06', INDICE, '2026-06')).toBe(1_234_567);
  });

  it('con el índice viejo no se deflacta nada', () => {
    expect(factorDePesosDeHoy(INDICE, '2026-01', '2026-07')).toBeNull();
    expect(aPesosDeHoy(centavos(1_234_567), '2026-01', INDICE, '2026-07')).toBe(1_234_567);
  });

  it('un mes de antes del índice, o un índice roto, van como están', () => {
    expect(aPesosDeHoy(centavos(500), '2025-06', INDICE, '2026-06')).toBe(500);
    const roto: IndiceDePrecios = { ...INDICE, valores: [100, 110] };
    expect(factorDePesosDeHoy(roto, '2026-01', '2026-06')).toBeNull();
  });

  it('una pérdida también se lleva a pesos de hoy, con su signo', () => {
    expect(aPesosDeHoy(centavos(-150_050), '2026-01', INDICE, '2026-06')).toBe(-300_100);
    expect(alPeso(-40)).toBe(0);
    expect(Object.is(alPeso(-40), -0)).toBe(false);
    expect(alPeso(150)).toBe(200);
    expect(alPeso(-150)).toBe(-200);
  });

  it('suma meses distintos, cada uno con su factor', () => {
    expect(
      totalEnPesosDeHoy(
        [
          { mes: '2026-01', monto: centavos(100_000) },
          { mes: '2026-06', monto: centavos(55) },
        ],
        INDICE,
        '2026-06',
      ),
    ).toBe(200_055);
  });
});

describe('el porcentaje entero', () => {
  it('redondea a la unidad, alejándose del cero en el medio, con el signo de la cuenta', () => {
    expect(porcentajeEntero(58, 100)).toBe(58);
    expect(porcentajeEntero(1, 8)).toBe(13);
    expect(porcentajeEntero(-1, 8)).toBe(-13);
    expect(porcentajeEntero(1, -8)).toBe(-13);
    expect(porcentajeEntero(-1, 400)).toBe(0);
    expect(Object.is(porcentajeEntero(-1, 400), -0)).toBe(false);
  });
});

describe('el cambio real entre dos períodos', () => {
  it('compara los dos en pesos de hoy', () => {
    const cambio = cambioReal(
      [{ mes: '2026-04', monto: centavos(1_000_000) }],
      [{ mes: '2026-01', monto: centavos(400_000) }],
      INDICE,
      '2026-06',
    );
    expect(cambio).toEqual({
      actual: 1_000_000,
      anterior: 800_000,
      porcentaje: 25,
      sentido: 'mas',
    });
  });

  it('dice menos o igual, siempre como un número positivo', () => {
    expect(
      cambioReal(
        [{ mes: '2026-04', monto: centavos(600_000) }],
        [{ mes: '2026-04', monto: centavos(800_000) }],
        INDICE,
        '2026-06',
      ),
    ).toMatchObject({ porcentaje: 25, sentido: 'menos' });
    expect(
      cambioReal(
        [{ mes: '2026-04', monto: centavos(1_001_000) }],
        [{ mes: '2026-04', monto: centavos(1_000_000) }],
        INDICE,
        '2026-06',
      ),
    ).toMatchObject({ porcentaje: 0, sentido: 'igual' });
  });

  it('sin una base positiva no hay porcentaje', () => {
    expect(
      cambioReal(
        [{ mes: '2026-04', monto: centavos(1_000) }],
        [{ mes: '2026-04', monto: centavos(-5_000) }],
        INDICE,
        '2026-06',
      ),
    ).toBeNull();
    expect(cambioReal([], [], INDICE, '2026-06')).toBeNull();
  });
});
