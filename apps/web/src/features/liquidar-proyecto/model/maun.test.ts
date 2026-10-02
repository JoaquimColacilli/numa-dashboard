import { centavos, centavosEn, type Money } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { Despiece, PiezaDelDespiece, ValorDelPago } from '@/entities/proyecto';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { dolaresDelTrabajo, maunDespuesDelCobro } from './maun';

const MAUN = '00000000-0000-7000-8000-000000000002';
const HOGAR = '00000000-0000-7000-8000-000000000001';
const DOLARES = '00000000-0000-7000-8000-000000000020';
const AHORRO = '00000000-0000-7000-8000-000000000021';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function tesoro(
  id: string,
  clave: FilaDe<'tesoros'>['clave'],
  nombre: string,
  moneda: 'ARS' | 'USD',
): FilaDe<'tesoros'> {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    moneda,
  };
}

function conPago(replica: Replica, id: string, monto: number, moneda: 'ARS' | 'USD'): Replica {
  return aplicarFilaLocal(replica, 'pagos', {
    ...METADATOS,
    id,
    proyecto_id: 'p',
    fecha: '2026-09-20',
    concepto: 'Seña',
    monto_centavos: monto,
    ya_en_la_apertura: false,
    moneda,
    cotizacion_centavos: moneda === 'USD' ? 150_000 : null,
    tesoro_id: moneda === 'USD' ? DOLARES : null,
  });
}

function taller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  for (const fila of [
    tesoro(MAUN, 'maun', 'Maun', 'ARS'),
    tesoro(HOGAR, 'hogar', 'Hogar', 'ARS'),
    tesoro(DOLARES, null, 'Dólares', 'USD'),
  ]) {
    replica = aplicarFilaLocal(replica, 'tesoros', fila);
  }
  return aplicarFilaLocal(replica, 'proyectos', {
    ...METADATOS,
    id: 'p',
    titulo: 'Placard',
    estado: 'entregado',
    fecha_cobro: null,
    dist_diezmo_centavos: null,
    dist_sueldo_centavos: null,
    reparto_ya_en_la_apertura: false,
  } as unknown as FilaDe<'proyectos'>);
}

function despiece(...piezas: [string, number][]): Despiece {
  return {
    modo: 'proyeccion',
    cobrado: centavos(0),
    gastos: centavos(0),
    neta: centavos(0),
    piezas: piezas.map(
      ([tesoroId, monto], indice) =>
        ({
          id: String(indice),
          tesoro: tesoroId,
          nombre: tesoroId,
          monto: centavos(monto) as Money,
        }) as unknown as PiezaDelDespiece,
    ),
  };
}

function pago(valor: Partial<ValorDelPago>): ValorDelPago {
  return { moneda: 'ARS', monto: null, cotizacion: null, tesoroId: null, ...valor };
}

describe('maunDespuesDelCobro', () => {
  it('suma lo que entra a Maun y resta lo que el reparto manda a los otros tesoros', () => {
    const replica = conPago(taller(), 'pesos', 400_000, 'ARS');

    expect(maunDespuesDelCobro(replica, despiece([HOGAR, 300_000], [MAUN, 100_000]), 0)).toEqual({
      maun: MAUN,
      saldo: 100_000,
    });
    expect(
      maunDespuesDelCobro(replica, despiece([HOGAR, 300_000], [MAUN, 250_000]), 150_000),
    ).toEqual({ maun: MAUN, saldo: 250_000 });
  });

  it('un pago en dólares está en su tesoro: el reparto lo saca de Maun y la deja en negativo', () => {
    const replica = conPago(taller(), 'dolares', 100_000, 'USD');

    expect(maunDespuesDelCobro(replica, despiece([HOGAR, 1_200_000], [MAUN, 300_000]), 0)).toEqual({
      maun: MAUN,
      saldo: -1_200_000,
    });
  });
});

describe('dolaresDelTrabajo', () => {
  it('junta los dólares de cada tesoro con el pago final en dólares', () => {
    const enDolares = [
      { tesoroId: DOLARES, monto: centavosEn('USD', 100_000) },
      { tesoroId: AHORRO, monto: centavosEn('USD', 20_000) },
    ];

    expect(
      dolaresDelTrabajo(enDolares, pago({ moneda: 'USD', monto: 50_000, tesoroId: DOLARES })),
    ).toEqual([
      { tesoroId: DOLARES, monto: 150_000 },
      { tesoroId: AHORRO, monto: 20_000 },
    ]);
  });

  it('un pago final en pesos, sin tesoro o sin importe no suma dólares', () => {
    const enDolares = [{ tesoroId: DOLARES, monto: centavosEn('USD', 100_000) }];

    expect(dolaresDelTrabajo(enDolares, pago({ monto: 900_000 }))).toEqual(enDolares);
    expect(dolaresDelTrabajo(enDolares, pago({ moneda: 'USD', monto: 50_000 }))).toEqual(enDolares);
    expect(dolaresDelTrabajo([], pago({ moneda: 'USD', tesoroId: DOLARES }))).toEqual([]);
    expect(dolaresDelTrabajo(enDolares, null)).toEqual(enDolares);
  });
});
