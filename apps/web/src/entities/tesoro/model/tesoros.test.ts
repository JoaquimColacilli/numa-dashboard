import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import {
  tesoroDeLaClave,
  tesoroPorId,
  tesorosDelTaller,
  tesorosSincronizados,
  tesorosVivos,
} from './tesoros';

function replicaVacia(_usuario: string): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-27T12:00:00Z',
  updated_at: '2026-09-27T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function tesoro(
  id: string,
  clave: FilaDe<'tesoros'>['clave'],
  extra: Partial<FilaDe<'tesoros'>> = {},
) {
  return {
    ...METADATOS,
    id,
    clave,
    nombre: id,
    descripcion: '',
    tinta: clave ?? 'grana',
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    moneda: 'ARS',
    ...extra,
  } satisfies FilaDe<'tesoros'>;
}

function conTesoros(filas: readonly FilaDe<'tesoros'>[]): Replica {
  return filas.reduce(
    (replica, fila) => aplicarFilaLocal(replica, 'tesoros', fila),
    replicaVacia('u'),
  );
}

describe('los tesoros del taller', () => {
  it('sin tesoros replicados, son los cuatro de siempre con su clave como id', () => {
    const replica = replicaVacia('u');
    expect(tesorosSincronizados(replica)).toBe(false);
    expect(
      tesorosDelTaller(replica).map((uno) => [uno.id, uno.nombre, uno.tinta, uno.saldo]),
    ).toEqual([
      ['hogar', 'Hogar', 'hogar', 0],
      ['maun', 'Maun', 'maun', 0],
      ['diezmo', 'Diezmo', 'diezmo', 0],
      ['cocos', 'Cocos', 'cocos', 0],
    ]);
  });

  it('con los de la réplica, cada uno con su saldo, y la tinta o el ícono que no se conoce cae a uno que sí', () => {
    let replica = conTesoros([
      tesoro('t-hogar', 'hogar', { icono: 'house' }),
      tesoro('t-maun', 'maun'),
      tesoro('t-materiales', null, {
        tinta: 'violeta-rara',
        icono: 'no-existe',
        nombre: 'Materiales',
      }),
      tesoro('t-viejo', null, { archivado_at: '2026-09-01T00:00:00Z', orden: 2 }),
    ]);
    replica = aplicarFilaLocal(replica, 'movimientos', {
      ...METADATOS,
      id: 'm1',
      fecha: '2026-09-27',
      tipo: 'transferencia',
      tesoro_origen: 'maun',
      tesoro_destino: null,
      desde_id: 't-maun',
      hacia_id: 't-materiales',
      cubre_el_mes: null,
      monto_centavos: 15_000_000,
      monto_destino_centavos: null,
      categoria: '',
      descripcion: '',
      proyecto_id: null,
    });

    const tesoros = tesorosDelTaller(replica);
    expect(tesorosSincronizados(replica)).toBe(true);
    expect(tesoroPorId(tesoros, 't-materiales')).toMatchObject({
      nombre: 'Materiales',
      tinta: 'maun',
      icono: 'vault',
      saldo: 15_000_000,
    });
    expect(tesoroDeLaClave(tesoros, 'maun')?.saldo).toBe(-15_000_000);
    expect(tesoroDeLaClave(tesoros, 'hogar')?.icono).toBe('house');
    expect(tesoroDeLaClave(tesoros, 'cocos')).toBeUndefined();
    expect(tesorosVivos(tesoros).map((uno) => uno.id)).toEqual([
      't-hogar',
      't-maun',
      't-materiales',
    ]);
  });
});
