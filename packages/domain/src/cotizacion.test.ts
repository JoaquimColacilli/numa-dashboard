import { describe, expect, it } from 'vitest';

import {
  cotizacion,
  cotizacionDelCambio,
  cotizacionLeida,
  dolaresDePesos,
  esCotizacion,
  loQueDescuenta,
  necesitaCotizacion,
  pesosDeDolares,
  RANGO_DE_LA_COTIZACION,
  totalEnPesos,
  totalQueDescuenta,
  valorEnPesos,
  type Cotizacion,
  type ImporteDeUnPago,
} from './cotizacion.ts';
import { centavos, centavosEn, puntosBasicos } from './money.ts';
import { montoParaPegar } from './pagos.ts';
import { calcularSena } from './sena.ts';

function generador(semilla: number): (tope: number) => number {
  let estado = semilla;
  return (tope) => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4_294_967_296) * tope);
  };
}

function redondeoEntero(numerador: bigint, divisor: bigint): number {
  return Number((2n * numerador + divisor) / (2n * divisor));
}

const DOLAR = cotizacion(145_000);

describe('la cotización', () => {
  it('va de $ 1 a $ 100.000 por dólar, en centavos de peso', () => {
    expect(RANGO_DE_LA_COTIZACION).toEqual({ desde: 100, hasta: 10_000_000 });
    expect(esCotizacion(100)).toBe(true);
    expect(esCotizacion(10_000_000)).toBe(true);
    expect(esCotizacion(99)).toBe(false);
    expect(esCotizacion(10_000_001)).toBe(false);
    expect(esCotizacion(145_000.5)).toBe(false);
    expect(esCotizacion('145000')).toBe(false);
    expect(cotizacion(154_000)).toBe(154_000);
    expect(() => cotizacion(0)).toThrow(RangeError);
    expect(cotizacionLeida(154_000)).toBe(154_000);
    expect(cotizacionLeida(null)).toBeNull();
  });

  it('la de un cambio sale de los dos importes: $ 725.000 por US$ 500 es $ 1.450', () => {
    expect(cotizacionDelCambio(centavos(72_500_000), centavosEn('USD', 50_000))).toBe(145_000);
  });

  it('redondea a la mitad hacia arriba, con enteros, y un centavo de dólar la mueve en lo chico', () => {
    expect(cotizacionDelCambio(centavos(3), centavosEn('USD', 2))).toBe(150);
    expect(cotizacionDelCambio(centavos(1_450_000), centavosEn('USD', 1_000))).toBe(145_000);
    expect(cotizacionDelCambio(centavos(1_450_000), centavosEn('USD', 1_001))).toBe(144_855);
  });

  it('sin los dos importes, o con una que no llega a un centavo, no hay cotización', () => {
    expect(cotizacionDelCambio(centavos(0), centavosEn('USD', 100))).toBeNull();
    expect(cotizacionDelCambio(centavos(100), centavosEn('USD', 0))).toBeNull();
    expect(cotizacionDelCambio(centavos(-100), centavosEn('USD', 10))).toBeNull();
    expect(cotizacionDelCambio(centavos(1), centavosEn('USD', 1_000_000_000))).toBeNull();
    expect(cotizacionDelCambio(centavos(Number.MAX_SAFE_INTEGER), centavosEn('USD', 1))).toBeNull();
  });

  it('da lo mismo que la cuenta exacta con BigInt', () => {
    const al = generador(20_261_001);
    for (let i = 0; i < 2_000; i++) {
      const dolares = 1 + al(10_000_000);
      const pesos = 1 + al(1_000_000_000_000);
      const esperado = redondeoEntero(100n * BigInt(pesos), BigInt(dolares));
      const derivada = cotizacionDelCambio(centavos(pesos), centavosEn('USD', dolares));
      expect(derivada).toBe(esperado < 1 ? null : esperado);
    }
  });
});

describe('las conversiones', () => {
  it('pasa dólares a pesos y pesos a dólares a la cotización, a la mitad hacia arriba', () => {
    expect(pesosDeDolares(centavosEn('USD', 100), DOLAR)).toBe(145_000);
    expect(pesosDeDolares(centavosEn('USD', 1), cotizacion(150))).toBe(2);
    expect(pesosDeDolares(centavosEn('USD', 1), cotizacion(149))).toBe(1);
    expect(dolaresDePesos(centavos(12_000_000), DOLAR)).toBe(8_276);
    expect(dolaresDePesos(centavos(3), cotizacion(200))).toBe(2);
    expect(dolaresDePesos(centavos(1), cotizacion(300))).toBe(0);
  });

  it('no convierte importes negativos ni los que no entran en un entero seguro', () => {
    expect(() => pesosDeDolares(centavosEn('USD', -1), DOLAR)).toThrow(RangeError);
    expect(() => dolaresDePesos(centavos(-1), DOLAR)).toThrow(RangeError);
    expect(() =>
      pesosDeDolares(centavosEn('USD', 1_000_000_000_000_000), cotizacion(10_000_000)),
    ).toThrow(RangeError);
    expect(() => dolaresDePesos(centavos(Number.MAX_SAFE_INTEGER), DOLAR)).toThrow(RangeError);
  });

  it('dan lo mismo que la cuenta exacta con BigInt', () => {
    const al = generador(14_092_026);
    for (let i = 0; i < 3_000; i++) {
      const valor = (RANGO_DE_LA_COTIZACION.desde + al(RANGO_DE_LA_COTIZACION.hasta)) as Cotizacion;
      const dolares = al(100_000_000);
      const pesos = al(1_000_000_000_000);
      expect(pesosDeDolares(centavosEn('USD', dolares), valor)).toBe(
        redondeoEntero(BigInt(dolares) * BigInt(valor), 100n),
      );
      expect(dolaresDePesos(centavos(pesos), valor)).toBe(
        redondeoEntero(100n * BigInt(pesos), BigInt(valor)),
      );
    }
  });

  it('los pesos de un saldo en dólares, cargados a la misma cotización, lo cancelan exacto', () => {
    const al = generador(1_540);
    const cotizaciones = [100, 101, 199, 999, 145_000, 154_321, 9_999_999, 10_000_000];
    for (let i = 0; i < 4_000; i++) {
      cotizaciones.push(RANGO_DE_LA_COTIZACION.desde + al(RANGO_DE_LA_COTIZACION.hasta));
    }
    for (const [lugar, crudo] of cotizaciones.entries()) {
      const valor = cotizacion(Math.min(crudo, RANGO_DE_LA_COTIZACION.hasta));
      const dolares = centavosEn('USD', lugar < 8 ? 91_724 : al(10_000_000));
      expect(dolaresDePesos(pesosDeDolares(dolares, valor), valor)).toBe(dolares);
    }
  });
});

describe('las dos cuentas de un pago', () => {
  const enPesos: ImporteDeUnPago = {
    moneda: 'ARS',
    monto: centavos(12_000_000),
    cotizacion: DOLAR,
  };
  const enPesosSinDolar: ImporteDeUnPago = {
    moneda: 'ARS',
    monto: centavos(12_000_000),
    cotizacion: null,
  };
  const enDolares: ImporteDeUnPago = {
    moneda: 'USD',
    monto: centavosEn('USD', 100_000),
    cotizacion: cotizacion(154_000),
  };

  it('el valor en pesos: el importe si es en pesos, y si es en dólares, a su cotización', () => {
    expect(valorEnPesos(enPesos)).toBe(12_000_000);
    expect(valorEnPesos(enPesosSinDolar)).toBe(12_000_000);
    expect(valorEnPesos(enDolares)).toBe(154_000_000);
  });

  it('lo que descuenta, en la moneda del trabajo', () => {
    expect(loQueDescuenta(enPesos, 'ARS')).toBe(12_000_000);
    expect(loQueDescuenta(enPesos, 'USD')).toBe(8_276);
    expect(loQueDescuenta(enDolares, 'USD')).toBe(100_000);
    expect(loQueDescuenta(enDolares, 'ARS')).toBe(154_000_000);
  });

  it('un pago en otra moneda sin su cotización no se cuenta', () => {
    expect(() => loQueDescuenta(enPesosSinDolar, 'USD')).toThrow(RangeError);
    expect(() => valorEnPesos({ ...enDolares, cotizacion: null })).toThrow(RangeError);
  });

  it('necesita cotización todo pago en dólares y todo pago de un trabajo en dólares', () => {
    expect(necesitaCotizacion('ARS', 'ARS')).toBe(false);
    expect(necesitaCotizacion('ARS', 'USD')).toBe(true);
    expect(necesitaCotizacion('USD', 'ARS')).toBe(true);
    expect(necesitaCotizacion('USD', 'USD')).toBe(true);
  });

  it('las sumas son siempre una de las dos', () => {
    expect(totalEnPesos([enPesos, enDolares])).toBe(166_000_000);
    expect(totalQueDescuenta([enPesos, enDolares], 'USD')).toBe(108_276);
    expect(totalQueDescuenta([enPesos, enDolares], 'ARS')).toBe(166_000_000);
    expect(totalEnPesos([])).toBe(0);
  });
});

describe('la seña de un trabajo en dólares con la visita pagada en pesos', () => {
  it('US$ 2.000 y la visita de $ 120.000 a $ 1.450: falta US$ 917,24, hoy $ 1.329.998', () => {
    const visita: ImporteDeUnPago = {
      moneda: 'ARS',
      monto: centavos(12_000_000),
      cotizacion: DOLAR,
    };
    const sena = calcularSena({
      presupuesto: centavosEn('USD', 200_000),
      cobrado: loQueDescuenta(visita, 'USD'),
      porcentajeDelTaller: puntosBasicos(5_000),
      porcentajeDelTrabajo: null,
    });
    expect(sena).toEqual({
      situacion: 'falta',
      porcentaje: 5_000,
      esperada: 100_000,
      cobrado: 8_276,
      falta: 91_724,
    });
    const falta = sena.situacion === 'falta' ? sena.falta : centavosEn('USD', 0);
    const hoyEnPesos = pesosDeDolares(falta, DOLAR);
    expect(hoyEnPesos).toBe(132_999_800);
    expect(montoParaPegar(hoyEnPesos)).toBe('1329998');
    expect(montoParaPegar(falta)).toBe('917,24');
    expect(dolaresDePesos(hoyEnPesos, DOLAR)).toBe(falta);
  });
});
