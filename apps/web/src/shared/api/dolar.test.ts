import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  leerElDolar,
  olvidarLaSugerenciaDelDolar,
  pedirLaSugerenciaDelDolar,
  RUTAS_DEL_DOLAR,
  sugerenciaDelDolarGuardada,
} from './dolar';

const BOLSA = {
  moneda: 'USD',
  casa: 'bolsa',
  nombre: 'Bolsa',
  compra: 1551.1,
  venta: 1551.1,
  fechaActualizacion: '2026-10-02T13:51:00.000Z',
};

const BLUE = {
  moneda: 'USD',
  casa: 'blue',
  nombre: 'Blue',
  compra: 1535,
  venta: 1555,
  fechaActualizacion: '2026-10-02T13:51:00.000Z',
};

function conRespuestas(porRuta: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((ruta: string) => {
      const cuerpo = porRuta[ruta];
      if (cuerpo instanceof Error) return Promise.reject(cuerpo);
      return Promise.resolve(
        new Response(JSON.stringify(cuerpo), { status: cuerpo === undefined ? 500 : 200 }),
      );
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  olvidarLaSugerenciaDelDolar();
});

describe('el lector de DolarApi', () => {
  it('pasa la compra y la venta a centavos de peso por dólar, con la hora del dato', () => {
    expect(leerElDolar(BOLSA)).toEqual({
      dolar: { compra: 155_110, venta: 155_110 },
      fecha: '2026-10-02T13:51:00.000Z',
    });
    expect(leerElDolar(BLUE)?.dolar).toEqual({ compra: 153_500, venta: 155_500 });
  });

  it('una respuesta que no es la esperada no sugiere nada', () => {
    expect(leerElDolar(null)).toBeNull();
    expect(leerElDolar('1550')).toBeNull();
    expect(leerElDolar({ ...BLUE, venta: '1555' })).toBeNull();
    expect(leerElDolar({ ...BLUE, compra: 0 })).toBeNull();
    expect(leerElDolar({ ...BLUE, venta: 1_000_000 })).toBeNull();
    expect(leerElDolar({ ...BLUE, fechaActualizacion: 'ayer' })).toBeNull();
  });
});

describe('la sugerencia del dólar', () => {
  it('trae el MEP y el blue juntos, y la guarda en memoria unos minutos', async () => {
    conRespuestas({ [RUTAS_DEL_DOLAR.mep]: BOLSA, [RUTAS_DEL_DOLAR.blue]: BLUE });
    const ahora = Date.parse('2026-10-02T14:00:00.000Z');
    const sugerencia = await pedirLaSugerenciaDelDolar(ahora);
    expect(sugerencia).toEqual({
      mep: { compra: 155_110, venta: 155_110 },
      blue: { compra: 153_500, venta: 155_500 },
      hora: '2026-10-02T13:51:00.000Z',
    });
    await pedirLaSugerenciaDelDolar(ahora + 60_000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sugerenciaDelDolarGuardada(ahora + 60_000)).toEqual(sugerencia);
    expect(sugerenciaDelDolarGuardada(ahora + 10 * 60_000)).toBeNull();
  });

  it('si uno de los dos no responde, sugiere el otro', async () => {
    conRespuestas({ [RUTAS_DEL_DOLAR.blue]: BLUE });
    expect(await pedirLaSugerenciaDelDolar()).toMatchObject({
      mep: null,
      blue: { venta: 155_500 },
    });
  });

  it('sin señal no sugiere nada y no vuelve a intentar enseguida', async () => {
    conRespuestas({
      [RUTAS_DEL_DOLAR.mep]: new TypeError('Failed to fetch'),
      [RUTAS_DEL_DOLAR.blue]: new TypeError('Failed to fetch'),
    });
    const ahora = Date.now();
    expect(await pedirLaSugerenciaDelDolar(ahora)).toBeNull();
    expect(await pedirLaSugerenciaDelDolar(ahora + 1_000)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
