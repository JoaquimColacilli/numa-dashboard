import type { DocumentoDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { FilaDelPresupuesto, FilaDeRevision } from '@/entities/presupuesto';
import type { FilaDe } from '@/shared/api';

import { envioDelPresupuesto, revisionQueSeManda, valeHastaAlMandar } from './envio';

const PROYECTO = {
  id: 'p',
  estado: 'a_presupuestar',
  version: 3,
} as unknown as FilaDe<'proyectos'>;

const PRESUPUESTO = {
  id: 'b1',
  proyecto_id: 'p',
  borrador_version: 7,
  numero: null,
} as unknown as FilaDelPresupuesto;

const DOCUMENTO = { forma: 1 } as unknown as DocumentoDelPresupuesto;

function revision(numero: number): FilaDeRevision {
  return { id: `r${String(numero)}`, revision: numero } as unknown as FilaDeRevision;
}

function envio(
  revisiones: FilaDeRevision[],
  queCambio = '  Cambié los frentes.  ',
  validezDias: number | null = 15,
) {
  return envioDelPresupuesto({
    proyecto: PROYECTO,
    proximos: [],
    presupuesto: PRESUPUESTO,
    revisiones,
    documento: DOCUMENTO,
    queCambio,
    hoy: '2026-09-22',
    validezDias,
    revisionId: 'r-nueva',
    momento: '2026-09-22T15:00:00Z',
  });
}

describe('mandar el presupuesto', () => {
  it('la primera es la revisión 1, y cada una sigue a la última mandada', () => {
    expect(revisionQueSeManda([])).toBe(1);
    expect(revisionQueSeManda([{ revision: 1 }, { revision: 2 }])).toBe(3);
  });

  it('vale los días elegidos desde hoy, o no vence', () => {
    expect(valeHastaAlMandar('2026-09-22', 15)).toBe('2026-10-07');
    expect(valeHastaAlMandar('2026-09-22', null)).toBeNull();
  });

  it('la primera no lleva «qué cambió», y el pedido dice qué versión del borrador se manda', () => {
    const primera = envio([]);
    expect(primera).toEqual({
      pedido: {
        presupuestoId: 'b1',
        revisionId: 'r-nueva',
        version: 7,
        documento: DOCUMENTO,
        queCambio: null,
        mandadoEl: '2026-09-22',
        valeHasta: '2026-10-07',
      },
      proyectoId: 'p',
      revision: 1,
      numero: null,
      previos: { proyecto: PROYECTO, proximos: [] },
      momento: '2026-09-22T15:00:00Z',
    });
  });

  it('desde la segunda lleva «qué cambió» sin los blancos de las puntas', () => {
    const segunda = envio([revision(1)], '  Cambié los frentes.  ', null);
    expect(segunda.revision).toBe(2);
    expect(segunda.pedido.queCambio).toBe('Cambié los frentes.');
    expect(segunda.pedido.valeHasta).toBeNull();
  });
});
