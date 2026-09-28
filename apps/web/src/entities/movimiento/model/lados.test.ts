import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import { ladosDeLaFila, ladosDelMovimiento } from './lados';

const MAUN = { id: '0192aaaa-0000-7000-8000-000000000002', clave: 'maun' as const };
const MATERIALES = { id: '0192aaaa-0000-7000-8000-000000000005', clave: null };

describe('los lados que viajan con un movimiento', () => {
  it('con los tesoros de la réplica van la clave y el id de cada lado, juntos', () => {
    expect(ladosDelMovimiento(MAUN, MATERIALES, true)).toEqual({
      tesoro_origen: 'maun',
      tesoro_destino: null,
      desde_id: MAUN.id,
      hacia_id: MATERIALES.id,
    });
    expect(ladosDelMovimiento(null, MAUN, true)).toEqual({
      tesoro_origen: null,
      tesoro_destino: 'maun',
      desde_id: null,
      hacia_id: MAUN.id,
    });
  });

  it('sin los tesoros en la réplica van solo las claves, y la base completa los ids', () => {
    expect(ladosDelMovimiento({ id: 'maun', clave: 'maun' }, null, false)).toEqual({
      tesoro_origen: 'maun',
      tesoro_destino: null,
    });
  });

  it('lo que tenía la fila se lee tolerando que falten las columnas nuevas', () => {
    const vieja = {
      tesoro_origen: 'hogar',
      tesoro_destino: null,
    } as unknown as FilaDe<'movimientos'>;
    expect(ladosDeLaFila(vieja, true)).toEqual({
      tesoro_origen: 'hogar',
      tesoro_destino: null,
      desde_id: null,
      hacia_id: null,
    });
    expect(ladosDeLaFila(vieja, false)).toEqual({ tesoro_origen: 'hogar', tesoro_destino: null });

    const nueva = {
      tesoro_origen: 'maun',
      tesoro_destino: null,
      desde_id: MAUN.id,
      hacia_id: MATERIALES.id,
    } as unknown as FilaDe<'movimientos'>;
    expect(ladosDeLaFila(nueva, true)).toMatchObject({
      desde_id: MAUN.id,
      hacia_id: MATERIALES.id,
    });
  });
});
