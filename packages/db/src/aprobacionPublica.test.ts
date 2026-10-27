import { describe, expect, it, vi } from 'vitest';

import {
  aprobarElPresupuesto,
  leerResultadoDeAprobar,
  motivoDelRechazoDeLaAprobacion,
} from './aprobacionPublica.ts';
import type { ClienteMaun } from './cliente.ts';
import { RespuestaInvalidaError } from './replica.ts';

const APROBACION = {
  id: '0199c000-0000-7000-8000-000000000001',
  revision_id: '0199c000-0000-7000-8000-000000000002',
  opcion_id: null,
  dia: '2026-10-29',
  franja: 'manana',
  nota: '',
} as const;

describe('lo que contesta la puerta del presupuesto', () => {
  it('se guardó, también el reenvío idéntico', () => {
    expect(leerResultadoDeAprobar({ estado: 'guardada' })).toBe('guardada');
  });

  it('cualquier otra cosa es una respuesta que la página no entiende', () => {
    for (const rara of [null, [], 'guardada', {}, { estado: 'ya_contestada' }]) {
      expect(() => leerResultadoDeAprobar(rara)).toThrow(RespuestaInvalidaError);
    }
  });
});

describe('el motivo del rechazo de la aprobación', () => {
  it('sale del detalle de un MN050', () => {
    expect(motivoDelRechazoDeLaAprobacion({ code: 'MN050', details: 'fuera' })).toBe('fuera');
    expect(motivoDelRechazoDeLaAprobacion({ code: 'MN050', details: 'respondida' })).toBe(
      'respondida',
    );
  });

  it('no inventa uno si el código es otro o el detalle no es un motivo', () => {
    expect(motivoDelRechazoDeLaAprobacion({ code: 'MN020', details: 'fuera' })).toBeNull();
    expect(motivoDelRechazoDeLaAprobacion({ code: 'MN050', details: 'tope' })).toBeNull();
    expect(motivoDelRechazoDeLaAprobacion(new Error('red'))).toBeNull();
    expect(motivoDelRechazoDeLaAprobacion(null)).toBeNull();
  });
});

describe('aprobar el presupuesto', () => {
  it('manda el token y la aprobación a la puerta, y lee lo que contesta', async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { estado: 'guardada' }, error: null }));
    const cliente = { rpc } as unknown as ClienteMaun;

    expect(await aprobarElPresupuesto(cliente, 'el-token', APROBACION)).toBe('guardada');
    expect(rpc).toHaveBeenCalledWith('responder_el_presupuesto', {
      p_token: 'el-token',
      p_respuesta: APROBACION,
    });
  });

  it('un rechazo sale como error', async () => {
    const rechazo = { code: 'MN050', details: 'fuera' };
    const cliente = {
      rpc: vi.fn(() => Promise.resolve({ data: null, error: rechazo })),
    } as unknown as ClienteMaun;

    await expect(aprobarElPresupuesto(cliente, 'el-token', APROBACION)).rejects.toBe(rechazo);
  });
});
