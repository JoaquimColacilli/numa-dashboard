import {
  aplicarLote,
  filasDe,
  leerLote,
  replicaVacia,
  TABLAS_REPLICADAS,
  traerBootstrap,
  traerDelta,
  type Lote,
  type Replica,
  type TablaReplicada,
} from '@maun/db';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sincronizar } from './datos';

vi.mock('@maun/db', async (original) => ({
  ...(await original<typeof import('@maun/db')>()),
  traerBootstrap: vi.fn(),
  traerDelta: vi.fn(),
}));

vi.mock('./cliente', () => ({ clienteMaun: () => ({}) }));

const USUARIO = '0199aaaa-0000-7000-8000-000000000001';
const AHORA = Date.parse('2026-10-03T12:00:00Z');
const HACE_UNA_HORA = Date.parse('2026-10-03T11:00:00Z');

function fila(id: string, extra: Record<string, unknown> = {}) {
  return { id, version: 1, deleted_at: null, ...extra };
}

function lote(cursor: string, filas: Partial<Record<TablaReplicada, unknown[]>>): Lote {
  const cuerpo: Record<string, unknown> = { cursor };
  for (const tabla of TABLAS_REPLICADAS) cuerpo[tabla] = filas[tabla] ?? [];
  return leerLote(cuerpo);
}

function guardadaAntesDeLasEtapas(): Replica {
  const completa = aplicarLote(
    replicaVacia(USUARIO),
    lote('t1', { proyectos: [fila('p1')] }),
    'reconcile',
    HACE_UNA_HORA,
  );
  const { cambios_de_estado: _etapas, ...sinEtapas } = completa.tablas;
  return { ...completa, tablas: sinEtapas } as unknown as Replica;
}

afterEach(() => {
  vi.mocked(traerBootstrap).mockReset();
  vi.mocked(traerDelta).mockReset();
});

describe('sincronizar con una réplica guardada antes de que viajaran los cambios de etapa', () => {
  it('con la cola pendiente trae un delta que no crea la tabla, y sin cola trae el bootstrap que la completa', async () => {
    const guardada = guardadaAntesDeLasEtapas();
    vi.mocked(traerDelta).mockResolvedValue(
      lote('t2', {
        proyectos: [fila('p2')],
        cambios_de_estado: [fila('e3', { proyecto_id: 'p2', hacia: 'contacto' })],
      }),
    );

    const conCola = await sincronizar({
      leerReplica: () => guardada,
      usuarioId: USUARIO,
      ahora: AHORA,
      hayPendientes: true,
    });

    expect(traerBootstrap).not.toHaveBeenCalled();
    expect(vi.mocked(traerDelta).mock.calls[0]?.[1]).toBe('t1');
    expect(filasDe(conCola, 'proyectos').map((p) => p.id)).toEqual(['p1', 'p2']);
    expect('cambios_de_estado' in conCola.tablas).toBe(false);

    vi.mocked(traerBootstrap).mockResolvedValue(
      lote('t3', {
        proyectos: [fila('p1'), fila('p2')],
        cambios_de_estado: [
          fila('e1', { proyecto_id: 'p1', hacia: 'contacto' }),
          fila('e2', { proyecto_id: 'p1', desde: 'contacto', hacia: 'relevamiento' }),
          fila('e3', { proyecto_id: 'p2', hacia: 'contacto' }),
        ],
      }),
    );

    const sinCola = await sincronizar({
      leerReplica: () => conCola,
      usuarioId: USUARIO,
      ahora: AHORA,
      hayPendientes: false,
    });

    expect(traerBootstrap).toHaveBeenCalledTimes(1);
    expect(filasDe(sinCola, 'cambios_de_estado').map((c) => c.id)).toEqual(['e1', 'e2', 'e3']);
    expect(sinCola.reconciliadoEn).toBe(new Date(AHORA).toISOString());
  });
});
