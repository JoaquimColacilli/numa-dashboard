import { centavosEn, cotizacion, type ImporteDeUnPago } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  efectoDelPago,
  loQueHaceElPago,
  loQueHizoElPago,
  monedaDeUnPagoNuevo,
  plataDelPago,
} from './pago';
import type { Pago, Proyecto } from './catalogos';

const sinEspacios = (texto: string) => texto.replace(/\s/gu, ' ');

const DOLAR = cotizacion(154_000);

function enPesos(monto: number, conDolar = false): ImporteDeUnPago {
  return {
    moneda: 'ARS',
    monto: centavosEn('ARS', monto),
    cotizacion: conDolar ? DOLAR : null,
  };
}

function enDolares(monto: number): ImporteDeUnPago {
  return { moneda: 'USD', monto: centavosEn('USD', monto), cotizacion: DOLAR };
}

describe('lo que hace un pago', () => {
  it('en pesos de un trabajo en pesos no hay nada que decir', () => {
    expect(efectoDelPago(enPesos(30_000_000), 'ARS')).toBeNull();
    expect(efectoDelPago(enPesos(30_000_000, true), 'ARS')).toBeNull();
  });

  it('en pesos de un trabajo en dólares descuenta dólares, a su dólar', () => {
    const efecto = efectoDelPago(enPesos(184_800_000, true), 'USD');
    expect(efecto).toEqual({
      tipo: 'descuenta',
      monto: { importe: 120_000, moneda: 'USD' },
      cotizacion: DOLAR,
    });
    expect(sinEspacios(loQueHaceElPago(efecto ?? fallar()))).toBe(
      'Descuenta US$ 1.200 del precio.',
    );
    expect(sinEspacios(loQueHizoElPago(efecto ?? fallar()))).toBe(
      'Descontó US$ 1.200 del precio, con el dólar a $ 1.540.',
    );
  });

  it('en dólares de un trabajo en pesos descuenta pesos', () => {
    const efecto = efectoDelPago(enDolares(100_000), 'ARS');
    expect(efecto).toMatchObject({ tipo: 'descuenta', monto: { importe: 154_000_000 } });
    expect(sinEspacios(loQueHaceElPago(efecto ?? fallar()))).toBe(
      'Descuenta $ 1.540.000 del precio.',
    );
  });

  it('en dólares de un trabajo en dólares vale pesos para el reparto', () => {
    const efecto = efectoDelPago(enDolares(100_000), 'USD');
    expect(efecto).toEqual({ tipo: 'vale', monto: 154_000_000, cotizacion: DOLAR });
    expect(sinEspacios(loQueHaceElPago(efecto ?? fallar()))).toBe(
      'Para el reparto vale $ 1.540.000.',
    );
    expect(sinEspacios(loQueHizoElPago(efecto ?? fallar()))).toBe(
      'Para el reparto valió $ 1.540.000, con el dólar a $ 1.540.',
    );
  });

  it('sin su dólar no inventa una conversión', () => {
    expect(efectoDelPago(enPesos(12_000_000), 'USD')).toBeNull();
  });

  it('cada pago guardado se lee con su moneda', () => {
    const pago = { monto_centavos: 100_000, moneda: 'USD', cotizacion_centavos: 154_000 } as Pago;
    expect(plataDelPago(pago)).toEqual({ importe: 100_000, moneda: 'USD' });
    const viejo = { monto_centavos: 5_000 } as Pago;
    expect(plataDelPago(viejo)).toEqual({ importe: 5_000, moneda: 'ARS' });
  });
});

describe('la moneda de un pago nuevo', () => {
  const conCobraEn = (cobraEn: string[] | null) => ({ cobra_en: cobraEn }) as Proyecto;

  it('sin «Te paga en» elegido arranca en pesos, aunque el trabajo sea en dólares', () => {
    expect(monedaDeUnPagoNuevo(conCobraEn(null), 'USD')).toBe('ARS');
    expect(monedaDeUnPagoNuevo(undefined, 'USD')).toBe('ARS');
  });

  it('con una sola moneda, esa; con las dos, la del trabajo', () => {
    expect(monedaDeUnPagoNuevo(conCobraEn(['USD']), 'ARS')).toBe('USD');
    expect(monedaDeUnPagoNuevo(conCobraEn(['ARS']), 'USD')).toBe('ARS');
    expect(monedaDeUnPagoNuevo(conCobraEn(['ARS', 'USD']), 'USD')).toBe('USD');
    expect(monedaDeUnPagoNuevo(conCobraEn(['ARS', 'USD']), 'ARS')).toBe('ARS');
  });
});

function fallar(): never {
  throw new Error('Se esperaba un efecto.');
}
