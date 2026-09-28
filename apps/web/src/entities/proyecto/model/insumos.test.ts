import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { fraseDeLosInsumos, insumosDeLosTrabajos, insumosDelProyecto } from './insumos';

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.proyectos = {
    p1: { id: 'p1', titulo: 'Vestidor', estado: 'en_curso' },
    p2: { id: 'p2', titulo: 'Alacena', estado: 'en_curso' },
    p3: { id: 'p3', titulo: 'Cocina', estado: 'cobrado' },
    p4: { id: 'p4', titulo: 'Biblioteca', estado: 'contacto' },
  };
  tablas.pagos = {
    a: { id: 'a', proyecto_id: 'p1', monto_centavos: 50_000_000 },
    b: { id: 'b', proyecto_id: 'p2', monto_centavos: 10_000_000 },
    c: { id: 'c', proyecto_id: 'p3', monto_centavos: 90_000_000 },
  };
  tablas.gastos = {
    d: { id: 'd', proyecto_id: 'p1', monto_centavos: 20_000_000 },
    e: { id: 'e', proyecto_id: 'p2', monto_centavos: 25_000_000 },
  };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

describe('los insumos', () => {
  it('de un trabajo: lo que entró, lo que se gastó, lo que queda y lo que puso el taller', () => {
    const replica = replicaDelTaller();
    expect(insumosDelProyecto(replica, 'p1')).toEqual({
      proyectoId: 'p1',
      titulo: 'Vestidor',
      entro: 50_000_000,
      gastado: 20_000_000,
      queda: 30_000_000,
      tallerPuso: null,
    });
    const alacena = insumosDelProyecto(replica, 'p2');
    expect(alacena).toMatchObject({ queda: -15_000_000, tallerPuso: 15_000_000 });
    expect(fraseDeLosInsumos(alacena ?? { tallerPuso: null })?.replace(/\s/g, ' ')).toBe(
      'El taller puso $ 150.000.',
    );
    expect(insumosDelProyecto(replica, 'p3')).toBeNull();
  });

  it('del taller: el total y cada trabajo con plata, por título', () => {
    const { total, trabajos } = insumosDeLosTrabajos(replicaDelTaller());
    expect(total).toBe(15_000_000);
    expect(trabajos.map((trabajo) => [trabajo.titulo, trabajo.queda])).toEqual([
      ['Alacena', -15_000_000],
      ['Vestidor', 30_000_000],
    ]);
  });
});
