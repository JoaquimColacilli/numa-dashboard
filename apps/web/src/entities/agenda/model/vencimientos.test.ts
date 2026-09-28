import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  fechaDelPagoPropuesta,
  rutaDelVencimiento,
  sePuedeRegistrarElPago,
  vencimientosDeLaReplica,
} from './vencimientos';

const FIJOS = '01900000-0000-7000-8000-000000000005';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';

function filaDeTesoro(id: string, clave: string | null, nombre: string) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'receipt',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaConUnAlquiler(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.ajustes = {
    a: {
      id: 'a',
      household_id: 'h',
      deleted_at: null,
      fila_guardada_at: '2026-09-01T15:00:00Z',
      fila: {
        obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
        pasos: [
          {
            tesoro: FIJOS,
            clase: 'fijos',
            tope: 50_000_000,
            renglones: [{ nombre: 'Alquiler', monto: 50_000_000, dia: 10 }],
            desde: null,
            modo: 'saldo',
            hastaLaMeta: false,
          },
        ],
        reparto: [],
        superavit: MAUN,
        sueldoPorTrabajo: false,
      },
    },
  };
  tablas.tesoros = Object.fromEntries(
    [
      filaDeTesoro(MAUN, 'maun', 'Maun'),
      filaDeTesoro(DIEZMO, 'diezmo', 'Diezmo'),
      filaDeTesoro(FIJOS, null, 'Gastos fijos'),
    ].map((fila) => [fila.id, fila]),
  );
  tablas.movimientos = {
    m: {
      id: 'm',
      household_id: 'h',
      fecha: '2026-09-09',
      tipo: 'gasto',
      tesoro_origen: null,
      tesoro_destino: null,
      desde_id: FIJOS,
      hacia_id: null,
      monto_centavos: 50_000_000,
      categoria: 'alquiler',
      descripcion: '',
      proyecto_id: null,
      deleted_at: null,
    },
  };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

describe('los vencimientos de la fila en la agenda', () => {
  it('salen de la fila guardada, cada mes desde que rige, y quedan pagados con el gasto del mes', () => {
    const vencimientos = vencimientosDeLaReplica(replicaConUnAlquiler(), {
      desde: '2026-08-01',
      hasta: '2026-10-31',
    });
    expect(vencimientos.map((uno) => [uno.fecha, uno.renglon, uno.pagado])).toEqual([
      ['2026-09-10', 'Alquiler', true],
      ['2026-10-10', 'Alquiler', false],
    ]);
    expect(
      vencimientosDeLaReplica(replicaConUnAlquiler(), { desde: '2026-09-11', hasta: '2026-10-09' }),
    ).toEqual([]);
  });

  it('tocarlo lleva a Tesoros con ese compromiso elegido', () => {
    expect(rutaDelVencimiento({ tesoro: FIJOS })).toBe(`/tesoros?tesoro=${FIJOS}`);
  });

  it('el pago se registra desde el mes en que vence; uno de un mes que pasó lleva su día', () => {
    const alquiler = { fecha: '2026-10-10', hecha: false };
    expect(sePuedeRegistrarElPago(alquiler, '2026-09-28')).toBe(false);
    expect(sePuedeRegistrarElPago(alquiler, '2026-10-01')).toBe(true);
    expect(sePuedeRegistrarElPago(alquiler, '2026-11-02')).toBe(true);
    expect(sePuedeRegistrarElPago({ ...alquiler, hecha: true }, '2026-10-12')).toBe(false);

    expect(fechaDelPagoPropuesta(alquiler, '2026-10-20')).toBeNull();
    expect(fechaDelPagoPropuesta(alquiler, '2026-11-02')).toBe('2026-10-10');
  });
});
