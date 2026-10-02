import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import { filaDelPagoGuardado } from './mutacion';

const LUGAR = { householdId: 'h1', proyectoId: 'p1', ahora: '2026-10-01T12:00:00.000Z' };

const EN_DOLARES: FilaDe<'pagos'> = {
  id: 'g1',
  household_id: 'h1',
  proyecto_id: 'p1',
  fecha: '2026-09-20',
  concepto: 'Seña',
  monto_centavos: 50_000,
  ya_en_la_apertura: false,
  moneda: 'USD',
  cotizacion_centavos: 145_000,
  tesoro_id: 't-dolares',
  created_at: '2026-09-20T10:00:00.000Z',
  updated_at: '2026-09-20T10:00:00.000Z',
  deleted_at: null,
  version: 3,
};

describe('la fila de un pago que se guarda, antes de que conteste la base', () => {
  it('sin la moneda, el dólar ni el tesoro en el pedido, conserva los que ya tenía, como la base', () => {
    const fila = filaDelPagoGuardado(
      { id: 'g1', fecha: '2026-09-21', concepto: 'Seña', monto_centavos: 50_000 },
      EN_DOLARES,
      LUGAR,
    );

    expect(fila).toMatchObject({
      fecha: '2026-09-21',
      moneda: 'USD',
      cotizacion_centavos: 145_000,
      tesoro_id: 't-dolares',
      version: 3,
      created_at: '2026-09-20T10:00:00.000Z',
    });
  });

  it('un pago nuevo sin esas claves nace en pesos, sin dólar y sin tesoro', () => {
    const fila = filaDelPagoGuardado(
      { id: 'g2', fecha: '2026-09-21', concepto: 'Seña', monto_centavos: 7_250_000 },
      undefined,
      LUGAR,
    );

    expect(fila).toMatchObject({
      moneda: 'ARS',
      cotizacion_centavos: null,
      tesoro_id: null,
      ya_en_la_apertura: false,
      version: 1,
      created_at: LUGAR.ahora,
    });
  });

  it('con las claves, toma las que trae el pedido, también un null que borra el dólar', () => {
    const fila = filaDelPagoGuardado(
      {
        id: 'g1',
        fecha: '2026-09-21',
        concepto: 'Seña',
        monto_centavos: 7_250_000,
        moneda: 'ARS',
        cotizacion_centavos: null,
        tesoro_id: null,
      },
      EN_DOLARES,
      LUGAR,
    );

    expect(fila).toMatchObject({ moneda: 'ARS', cotizacion_centavos: null, tesoro_id: null });
  });
});
