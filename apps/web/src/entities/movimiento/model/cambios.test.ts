import { centavos, centavosEn, cotizacion, type MovimientoDelLibro } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { usarIdioma } from '@/shared/idioma';

import {
  cotizacionDeUnCambio,
  equivalenteEnPesos,
  ultimoCambio,
  ultimoCambioEntre,
} from './cambios';

const TESOROS = [
  { id: 'maun', moneda: 'ARS' as const },
  { id: 'materiales', moneda: 'ARS' as const },
  { id: 'dolares', moneda: 'USD' as const },
];

function movimiento(
  id: string,
  fecha: string,
  extra: Partial<MovimientoDelLibro> = {},
): MovimientoDelLibro {
  return {
    id,
    fecha,
    tipo: 'cambio',
    tesoroOrigen: 'maun',
    tesoroDestino: null,
    desdeId: 'maun',
    haciaId: 'dolares',
    monto: centavos(72_500_000),
    montoDestino: centavosEn('USD', 50_000),
    categoria: 'MEP',
    descripcion: '',
    proyectoId: null,
    ...extra,
  };
}

const VENTA = {
  desdeId: 'dolares',
  haciaId: 'maun',
  tesoroOrigen: null,
  tesoroDestino: 'maun' as const,
  monto: centavosEn('USD', 10_000),
  montoDestino: centavos(14_300_000),
};

describe('el último cambio', () => {
  const monedaDe = (id: string) => TESOROS.find((uno) => uno.id === id)?.moneda;

  it('la cotización sale de los dos importes: de una compra y de una venta', () => {
    expect(cotizacionDeUnCambio(movimiento('c', '2026-09-28'), monedaDe)).toEqual({
      tipo: 'compra',
      cotizacion: 145_000,
    });
    expect(cotizacionDeUnCambio(movimiento('v', '2026-09-29', VENTA), monedaDe)).toEqual({
      tipo: 'venta',
      cotizacion: 143_000,
    });
    expect(
      cotizacionDeUnCambio(
        movimiento('p', '2026-09-29', { tipo: 'transferencia', haciaId: 'materiales' }),
        monedaDe,
      ),
    ).toBeNull();
  });

  it('es el más reciente por fecha, y en el mismo día el último cargado', () => {
    expect(
      ultimoCambioEntre(
        [movimiento('a', '2026-09-28'), movimiento('b', '2026-09-30', VENTA)],
        TESOROS,
      ),
    ).toEqual({ tipo: 'venta', fecha: '2026-09-30', cotizacion: 143_000 });
    expect(
      ultimoCambio([movimiento('b', '2026-09-28', VENTA), movimiento('a', '2026-09-28')], monedaDe)
        ?.tipo,
    ).toBe('venta');
    expect(ultimoCambioEntre([], TESOROS)).toBeNull();
  });
});

describe('el equivalente en pesos', () => {
  const compra = { tipo: 'compra' as const, fecha: '2026-09-28', cotizacion: cotizacion(145_000) };

  it('dice los pesos, la cotización y de qué cambio sale, sin sumarlo a nada', () => {
    expect(equivalenteEnPesos(centavosEn('USD', 125_000), compra)?.replace(/\s/g, ' ')).toBe(
      '≈ $ 1.812.500 a $ 1.450, tu última compra (28 sep)',
    );
    expect(
      equivalenteEnPesos(centavosEn('USD', 125_000), { ...compra, tipo: 'venta' })?.replace(
        /\s/g,
        ' ',
      ),
    ).toBe('≈ $ 1.812.500 a $ 1.450, tu última venta (28 sep)');
  });

  it('con un saldo en negativo, el equivalente también; sin cambio o sin dólares, nada', () => {
    expect(equivalenteEnPesos(centavosEn('USD', -10_000), compra)?.replace(/\s/g, ' ')).toBe(
      '≈ -$ 145.000 a $ 1.450, tu última compra (28 sep)',
    );
    expect(equivalenteEnPesos(centavosEn('USD', 10_000), null)).toBeNull();
    expect(equivalenteEnPesos(centavosEn('USD', 0), compra)).toBeNull();
  });

  it('en inglés y en portugués, con sus palabras y su forma de escribir la plata', async () => {
    try {
      await usarIdioma('en');
      expect(equivalenteEnPesos(centavosEn('USD', 125_000), compra)?.replace(/\s/g, ' ')).toBe(
        '≈ ARS 1,812,500 at ARS 1,450, your last dollar purchase (Sep 28)',
      );
      await usarIdioma('pt-BR');
      expect(equivalenteEnPesos(centavosEn('USD', 125_000), compra)?.replace(/\s/g, ' ')).toBe(
        '≈ ARS 1.812.500 a ARS 1.450, sua última compra de dólares (28 de set.)',
      );
    } finally {
      await usarIdioma('es');
    }
  });
});
