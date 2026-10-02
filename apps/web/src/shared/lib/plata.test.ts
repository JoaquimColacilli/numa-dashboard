import { plata } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  adornosDelCampo,
  formatearCadaMoneda,
  formatearPesos,
  formatearPlata,
  marcadorDelCampo,
  porMoneda,
  separadoresDelCampo,
} from './plata';

const sinEspacios = (texto: string) => texto.replace(/\s/gu, '');
const conEspaciosComunes = (texto: string) => texto.replace(/[\u00a0\u202f]/gu, ' ');

describe('formatearPesos', () => {
  it('muestra los pesos sin decimales cuando son redondos', () => {
    expect(sinEspacios(formatearPesos(180000000))).toBe('$1.800.000');
    expect(sinEspacios(formatearPesos(0))).toBe('$0');
  });

  it('muestra los centavos cuando los hay', () => {
    expect(sinEspacios(formatearPesos(123456))).toBe('$1.234,56');
  });

  it('muestra el signo de lo negativo', () => {
    expect(sinEspacios(formatearPesos(-50000))).toBe('-$500');
  });

  it('en castellano escribe carácter por carácter lo mismo que antes de los idiomas', () => {
    const redondo = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
    const conCentavos = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
    const deAntes = (centavos: number) =>
      Number.isInteger(centavos / 100)
        ? redondo.format(centavos / 100)
        : conCentavos.format(centavos / 100);
    for (const centavos of [0, 1, 5, 99, 100, 150, 123456, -50000, -5, 180000000, 999999999999]) {
      expect(formatearPesos(centavos), String(centavos)).toBe(deAntes(centavos));
    }
  });
});

describe('formatearPlata', () => {
  it('«$» es pesos y solo en castellano; el dólar es siempre «US$»', () => {
    const casos = [
      ['es', 'ARS'],
      ['es', 'USD'],
      ['en', 'ARS'],
      ['en', 'USD'],
      ['pt-BR', 'ARS'],
      ['pt-BR', 'USD'],
    ] as const;
    expect(
      casos.map(([idioma, moneda]) =>
        conEspaciosComunes(formatearPlata(123456750, moneda, idioma)),
      ),
    ).toEqual([
      '$ 1.234.567,50',
      'US$ 1.234.567,50',
      'ARS 1,234,567.50',
      'US$1,234,567.50',
      'ARS 1.234.567,50',
      'US$ 1.234.567,50',
    ]);
  });

  it('esconde los centavos solo si son cero, y es exacto en todo el rango seguro', () => {
    expect(conEspaciosComunes(formatearPlata(120000, 'USD', 'pt-BR'))).toBe('US$ 1.200');
    expect(conEspaciosComunes(formatearPlata(-5, 'ARS', 'en'))).toBe('-ARS 0.05');
    expect(formatearPlata(Number.MAX_SAFE_INTEGER, 'USD', 'en')).toBe('US$90,071,992,547,409.91');
  });
});

describe('la plata de varias monedas', () => {
  it('suma cada moneda aparte, pesos primero y sin los ceros', () => {
    expect(
      porMoneda([
        plata('USD', 120_000),
        plata('ARS', 300_000_000),
        plata('USD', 30_000),
        plata('ARS', -300_000_000),
      ]),
    ).toEqual([{ importe: 150_000, moneda: 'USD' }]);
  });

  it('escribe cada moneda por su lado, pesos primero, y sin nada es cero pesos', () => {
    expect(
      formatearCadaMoneda([plata('USD', 120_000), plata('ARS', 320_000_000)], 'es').map(
        conEspaciosComunes,
      ),
    ).toEqual(['$ 3.200.000', 'US$ 1.200']);
    expect(formatearCadaMoneda([], 'es').map(conEspaciosComunes)).toEqual(['$ 0']);
  });
});

describe('el campo de plata', () => {
  it('saca el adorno de la moneda en cada idioma, sin el espacio del número', () => {
    expect(adornosDelCampo('ARS', 'es')).toEqual({ antes: '$', despues: '' });
    expect(adornosDelCampo('USD', 'es')).toEqual({ antes: 'US$', despues: '' });
    expect(adornosDelCampo('ARS', 'en')).toEqual({ antes: 'ARS', despues: '' });
    expect(adornosDelCampo('USD', 'en')).toEqual({ antes: 'US$', despues: '' });
    expect(adornosDelCampo('ARS', 'pt-BR')).toEqual({ antes: 'ARS', despues: '' });
  });

  it('el marcador vacío en castellano es el de siempre', () => {
    expect(marcadorDelCampo('ARS', 'es')).toBe('$ 0');
    expect(marcadorDelCampo('ARS', 'en')).toBe('ARS 0');
    expect(marcadorDelCampo('USD', 'pt-BR')).toBe('US$ 0');
  });

  it('en inglés solo el punto abre los decimales; en castellano y portugués, la coma y el punto', () => {
    expect(separadoresDelCampo('en')).toEqual({
      miles: ',',
      decimal: '.',
      abrenLosDecimales: ['.'],
    });
    for (const idioma of ['es', 'pt-BR'] as const) {
      expect(separadoresDelCampo(idioma)).toEqual({
        miles: '.',
        decimal: ',',
        abrenLosDecimales: [',', '.'],
      });
    }
  });
});
