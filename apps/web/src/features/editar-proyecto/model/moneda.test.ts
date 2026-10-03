import { cotizacion } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { pagoVacio, type FilaDeOpcion } from '@/entities/proyecto';

import {
  conLaOtraMoneda,
  convertir,
  erroresDelCambio,
  hayErroresEnElCambio,
  hayImportes,
  pagosQuePidenSuDolar,
  type CambioDeMoneda,
} from './moneda';

const HOY = '2026-10-01';

const OPCIONES: FilaDeOpcion[] = [
  { id: 'o1', detalle: 'Melamina', monto: 154_000_000, aprobada: false },
  { id: 'o2', detalle: 'Laqueado', monto: null, aprobada: false },
];

const VISITA = { ...pagoVacio('visita', HOY, 'ARS'), detalle: 'Visita', monto: 12_000_000 };

function cambio(extra: Partial<CambioDeMoneda> = {}): CambioDeMoneda {
  return {
    hacia: 'USD',
    conLosImportes: 'pasarlos',
    dolar: 154_000,
    dolaresDeLosPagos: { visita: 145_000 },
    ...extra,
  };
}

describe('cambiar la moneda de un trabajo', () => {
  it('pasa los importes con el dólar elegido, y de vuelta da lo mismo', () => {
    const dolar = cotizacion(154_000);
    expect(convertir(154_000_000, 'USD', dolar)).toBe(100_000);
    expect(convertir(100_000, 'ARS', dolar)).toBe(154_000_000);
    expect(convertir(null, 'USD', dolar)).toBeNull();
  });

  it('pide un dólar solo si hay importes que pasar, y el de cada pago en pesos', () => {
    const valores = { presupuesto: null, opciones: OPCIONES, pagos: [VISITA] };
    expect(hayImportes(valores)).toBe(true);
    expect(hayImportes({ presupuesto: null, opciones: [] })).toBe(false);
    expect(pagosQuePidenSuDolar(valores.pagos, 'USD').map((pago) => pago.id)).toEqual(['visita']);
    expect(pagosQuePidenSuDolar(valores.pagos, 'ARS')).toEqual([]);

    const sinNada = erroresDelCambio(valores, cambio({ dolar: null, dolaresDeLosPagos: {} }));
    expect(hayErroresEnElCambio(sinNada)).toBe(true);
    expect(sinNada.dolar).toBe('¿A cuánto se tomó?');
    expect(Object.keys(sinNada.pagos)).toEqual(['visita']);
    const enBlanco = erroresDelCambio(
      valores,
      cambio({ conLosImportes: 'dejarlosEnBlanco', dolar: null }),
    );
    expect(hayErroresEnElCambio(enBlanco)).toBe(false);
  });

  it('el cambio deja los importes en la otra moneda o en blanco, y a cada pago en pesos su dólar', () => {
    const valores = {
      moneda: 'ARS' as const,
      presupuesto: null,
      opciones: OPCIONES,
      pagos: [VISITA],
    };
    const pasados = conLaOtraMoneda(valores, cambio());
    expect(pasados.moneda).toBe('USD');
    expect(pasados.opciones.map((opcion) => opcion.monto)).toEqual([100_000, null]);
    expect(pasados.pagos[0]).toMatchObject({
      moneda: 'ARS',
      monto: 12_000_000,
      cotizacion: 145_000,
    });

    const enBlanco = conLaOtraMoneda(valores, cambio({ conLosImportes: 'dejarlosEnBlanco' }));
    expect(enBlanco.opciones.map((opcion) => opcion.monto)).toEqual([null, null]);
  });
});
