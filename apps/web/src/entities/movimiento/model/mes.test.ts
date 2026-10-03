import { centavos, centavosEn, type Asiento } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { resumenMensual, valoresEnPesosDeLosPagos } from './mes';

function asiento(partes: Partial<Asiento> & Pick<Asiento, 'monto' | 'concepto'>): Asiento {
  return {
    origen: 'manual',
    asientoId: crypto.randomUUID(),
    fecha: '2026-09-01',
    tesoro: 'hogar',
    contrapartida: null,
    tesoroId: 'hogar',
    contrapartidaId: null,
    categoria: '',
    descripcion: '',
    proyectoId: null,
    yaEnLaApertura: false,
    ...partes,
  };
}

describe('resumenMensual', () => {
  it('la apertura de la migración acomoda el saldo pero no cuenta como lo que entró o gastó el hogar en el mes', () => {
    const asientos = [
      asiento({ concepto: 'ajuste', categoria: 'Apertura', monto: centavos(250_000_000) }),
      asiento({
        concepto: 'ajuste',
        categoria: 'Apertura',
        tesoro: 'maun',
        monto: centavos(-80_000_000),
      }),
      asiento({ concepto: 'ingreso', monto: centavos(10_000_000) }),
      asiento({ concepto: 'gasto', monto: centavos(-4_000_000) }),
      asiento({ concepto: 'cobro', origen: 'pago', tesoro: 'maun', monto: centavos(30_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09')).toEqual({
      entroHogar: 10_000_000,
      gastoHogar: 4_000_000,
      facturoTaller: 30_000_000,
    });
  });

  it('un pase entre tesoros no es lo que entró ni lo que gastó el hogar, y el sueldo del reparto sí entra', () => {
    const asientos = [
      asiento({
        concepto: 'transferencia',
        contrapartida: null,
        contrapartidaId: 'materiales',
        monto: centavos(-3_000_000),
      }),
      asiento({
        concepto: 'transferencia',
        contrapartida: 'maun',
        contrapartidaId: 'maun',
        monto: centavos(2_000_000),
      }),
      asiento({
        concepto: 'sueldo',
        origen: 'reparto',
        contrapartida: 'maun',
        contrapartidaId: 'maun',
        monto: centavos(180_000_000),
      }),
      asiento({ concepto: 'gasto', monto: centavos(-1_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09')).toEqual({
      entroHogar: 180_000_000,
      gastoHogar: 1_000_000,
      facturoTaller: 0,
    });
  });

  it('un ajuste negativo del hogar tampoco suma a lo gastado', () => {
    const asientos = [
      asiento({ concepto: 'ajuste', monto: centavos(-5_000_000) }),
      asiento({ concepto: 'gasto', monto: centavos(-1_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09').gastoHogar).toBe(1_000_000);
  });
});

describe('lo que facturó el taller con pagos en dólares', () => {
  const EN_PESOS = asiento({
    concepto: 'cobro',
    origen: 'pago',
    asientoId: 'pesos',
    tesoro: 'maun',
    tesoroId: 'maun',
    monto: centavos(30_000_000),
  });
  const EN_DOLARES = asiento({
    concepto: 'cobro',
    origen: 'pago',
    asientoId: 'dolares',
    tesoro: null,
    tesoroId: 'tesoro-en-dolares',
    monto: centavosEn('USD', 100_000),
  });

  it('cuenta cada pago por su valor en pesos, también el que entró a un tesoro en dólares', () => {
    const valores = new Map([
      ['pesos', centavos(30_000_000)],
      ['dolares', centavos(154_000_000)],
    ]);
    expect(resumenMensual([EN_PESOS, EN_DOLARES], '2026-09', valores).facturoTaller).toBe(
      184_000_000,
    );
  });

  it('sin el valor de un pago en dólares no suma sus dólares como si fueran pesos', () => {
    expect(resumenMensual([EN_PESOS, EN_DOLARES], '2026-09').facturoTaller).toBe(30_000_000);
  });

  it('los valores salen de los pagos de la réplica, cada uno a su dólar', () => {
    const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
    for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
    let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
    const pago = {
      household_id: 'h',
      created_at: '2026-09-01T12:00:00Z',
      updated_at: '2026-09-01T12:00:00Z',
      deleted_at: null,
      version: 1,
      proyecto_id: 'p',
      fecha: '2026-09-10',
      concepto: 'Seña',
      ya_en_la_apertura: false,
    } as const;
    replica = aplicarFilaLocal(replica, 'pagos', {
      ...pago,
      id: 'pesos',
      monto_centavos: 30_000_000,
      moneda: 'ARS',
      cotizacion_centavos: null,
      tesoro_id: null,
    });
    replica = aplicarFilaLocal(replica, 'pagos', {
      ...pago,
      id: 'dolares',
      monto_centavos: 100_000,
      moneda: 'USD',
      cotizacion_centavos: 154_000,
      tesoro_id: 'tesoro-en-dolares',
    });

    expect(valoresEnPesosDeLosPagos(replica)).toEqual(
      new Map([
        ['pesos', 30_000_000],
        ['dolares', 154_000_000],
      ]),
    );
  });
});
