import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import type { FotoEnLaVidriera } from '../api/mutacion';
import {
  DE_UN_TRABAJO,
  fotosDeLaVidriera,
  origenDeLaFoto,
  SUBIDA_PARA_LA_VIDRIERA,
} from './vidriera';

function foto(id: string, extra: Partial<FotoEnLaVidriera> = {}): FotoEnLaVidriera {
  return {
    id,
    household_id: 'h',
    orden: 0,
    tipo: 'image/webp',
    bytes: 300_000,
    ancho: 900,
    alto: 1200,
    archivo_de_origen: null,
    created_at: '2026-09-26T10:00:00Z',
    updated_at: '2026-09-26T10:00:00Z',
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

function replicaCon(tablas: Partial<Record<TablaReplicada, Record<string, unknown>>>): Replica {
  const todas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) todas[tabla] = tablas[tabla] ?? {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas: todas } as unknown as Replica;
}

describe('las fotos de la vidriera', () => {
  it('van en el orden en que las ve el cliente: por orden, después por cuándo se sumaron y por id', () => {
    const replica = replicaCon({
      fotos_de_la_vidriera: {
        c: foto('c', { orden: 2 }),
        b: foto('b', { orden: 0, created_at: '2026-09-26T11:00:00Z' }),
        a: foto('a', { orden: 0, created_at: '2026-09-26T11:00:00Z' }),
        z: foto('z', { orden: 0, created_at: '2026-09-26T09:00:00Z' }),
      },
    });
    expect(fotosDeLaVidriera(replica).map((una) => una.id)).toEqual(['z', 'a', 'b', 'c']);
  });

  it('dicen de dónde salieron', () => {
    const replica = replicaCon({
      archivos: { ar1: { id: 'ar1', proyecto_id: 'p1' } },
      proyectos: { p1: { id: 'p1', titulo: 'Placard de tres cuerpos' } },
    });
    expect(origenDeLaFoto(replica, foto('f1', { archivo_de_origen: 'ar1' }))).toBe(
      'De «Placard de tres cuerpos»',
    );
    expect(origenDeLaFoto(replica, foto('f2'))).toBe(SUBIDA_PARA_LA_VIDRIERA);
    expect(origenDeLaFoto(replica, foto('f3', { archivo_de_origen: 'ya-no-esta' }))).toBe(
      DE_UN_TRABAJO,
    );
  });
});
