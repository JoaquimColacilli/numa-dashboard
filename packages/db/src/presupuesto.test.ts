import {
  borradorNuevo,
  centavos,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  valoresDelTrabajo,
} from '@maun/domain';
import { describe, expect, it, vi } from 'vitest';

import type { ClienteMaun } from './cliente.ts';
import {
  guardarElBorrador,
  guardarLaPlantillaDelPresupuesto,
  leerPresupuestoMandado,
  mandarElPresupuesto,
} from './presupuesto.ts';
import { RespuestaInvalidaError } from './replica.ts';

const BORRADOR = borradorNuevo({
  titulo: 'Placard',
  obra: 'Arenales 1840, Palermo',
  plantilla: PLANTILLA_DE_SIEMPRE,
  validezDias: 15,
  idNuevo: () => 'm1',
});

const DOCUMENTO = documentoDelPresupuesto(
  {
    borrador: BORRADOR,
    plantilla: PLANTILLA_DE_SIEMPRE,
    taller: {
      nombre: 'Taller de prueba',
      titular: '',
      cuit: '',
      condicionFiscal: null,
      domicilio: '',
      telefono: '',
      email: '',
    },
    cliente: 'Paula Benítez',
    valores: valoresDelTrabajo(centavos(120_000_000), []),
    senaBp: puntosBasicos(5000),
    abonado: centavos(0),
  },
  {
    pesos: (importe) => `$ ${String(importe / 100)}`,
    porcentaje: (puntos) => String(puntos / 100),
  },
);

const MANDADO = {
  revision: { id: 'r1', numero: '20260920-01', revision: 1 },
  presupuesto: { id: 'b1', numero: '20260920-01' },
  proyecto: { id: 'p1', estado: 'presupuesto_enviado' },
  proximos_contactos: [{ id: 'c1', resultado: 'reactivado' }],
};

function clienteFalso(data: unknown) {
  const rpc = vi.fn(() => Promise.resolve({ data, error: null }));
  return { cliente: { rpc } as unknown as ClienteMaun, rpc };
}

function clienteQueRechaza(error: unknown) {
  const rpc = vi.fn(() => Promise.resolve({ data: null, error }));
  return { cliente: { rpc } as unknown as ClienteMaun, rpc };
}

describe('guardar el borrador del presupuesto', () => {
  it('va a guardar_el_presupuesto con el id, el trabajo, la revisión que vio la app y el borrador', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'b1', borrador_version: 1 });

    const fila = await guardarElBorrador(cliente, {
      id: 'b1',
      proyectoId: 'p1',
      version: 0,
      contenido: BORRADOR,
    });

    expect(fila).toEqual({ id: 'b1', borrador_version: 1 });
    expect(rpc).toHaveBeenCalledWith('guardar_el_presupuesto', {
      p_id: 'b1',
      p_proyecto_id: 'p1',
      p_version: 0,
      p_contenido: BORRADOR,
    });
  });

  it('un rechazo de la base sale como error, para que la cola lo trate', async () => {
    const rechazo = { code: 'MN026', message: 'Este presupuesto se cambió en otro aparato.' };
    const { cliente } = clienteQueRechaza(rechazo);

    await expect(
      guardarElBorrador(cliente, { id: 'b1', proyectoId: 'p1', version: 3, contenido: BORRADOR }),
    ).rejects.toBe(rechazo);
  });
});

describe('mandar el presupuesto', () => {
  it('va a mandar_el_presupuesto con el documento armado, y sin qué cambió manda un texto vacío', async () => {
    const { cliente, rpc } = clienteFalso(MANDADO);

    await mandarElPresupuesto(cliente, {
      presupuestoId: 'b1',
      revisionId: 'r1',
      version: 2,
      documento: DOCUMENTO,
      queCambio: null,
      mandadoEl: '2026-09-20',
      valeHasta: null,
    });

    expect(rpc).toHaveBeenCalledWith('mandar_el_presupuesto', {
      p_presupuesto_id: 'b1',
      p_revision_id: 'r1',
      p_version: 2,
      p_documento: DOCUMENTO,
      p_que_cambio: '',
      p_mandado_el: '2026-09-20',
      p_vale_hasta: null,
    });
  });

  it('vuelve con la revisión, el borrador, el trabajo y sus próximos contactos', async () => {
    const { cliente } = clienteFalso(MANDADO);

    const mandado = await mandarElPresupuesto(cliente, {
      presupuestoId: 'b1',
      revisionId: 'r1',
      version: 2,
      documento: DOCUMENTO,
      queCambio: 'Sumamos un estante.',
      mandadoEl: '2026-09-20',
      valeHasta: '2026-10-05',
    });

    expect(mandado.revision.numero).toBe('20260920-01');
    expect(mandado.presupuesto.id).toBe('b1');
    expect(mandado.proyecto.estado).toBe('presupuesto_enviado');
    expect(mandado.proximos.map((contacto) => contacto.id)).toEqual(['c1']);
  });

  it('no le cree a una respuesta sin alguna de sus partes', () => {
    expect(() => leerPresupuestoMandado(null)).toThrow(RespuestaInvalidaError);
    expect(() => leerPresupuestoMandado({ ...MANDADO, revision: null })).toThrow(
      RespuestaInvalidaError,
    );
    expect(() => leerPresupuestoMandado({ ...MANDADO, presupuesto: { numero: 'x' } })).toThrow(
      RespuestaInvalidaError,
    );
    expect(() => leerPresupuestoMandado({ ...MANDADO, proyecto: 'p1' })).toThrow(
      RespuestaInvalidaError,
    );
    expect(() => leerPresupuestoMandado({ ...MANDADO, proximos_contactos: undefined })).toThrow(
      RespuestaInvalidaError,
    );
    expect(() => leerPresupuestoMandado({ ...MANDADO, proximos_contactos: [{}] })).toThrow(
      RespuestaInvalidaError,
    );
  });
});

describe('guardar los textos de siempre', () => {
  it('va a guardar_la_plantilla_del_presupuesto con la revisión que vio la app, y null vuelve a los de siempre', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'a1', plantilla_del_presupuesto_version: 1 });

    await guardarLaPlantillaDelPresupuesto(cliente, 0, PLANTILLA_DE_SIEMPRE);
    expect(rpc).toHaveBeenLastCalledWith('guardar_la_plantilla_del_presupuesto', {
      p_version: 0,
      p_plantilla: PLANTILLA_DE_SIEMPRE,
    });

    await guardarLaPlantillaDelPresupuesto(cliente, 1, null);
    expect(rpc).toHaveBeenLastCalledWith('guardar_la_plantilla_del_presupuesto', {
      p_version: 1,
      p_plantilla: null,
    });
  });

  it('un rechazo de la base sale como error', async () => {
    const rechazo = {
      code: 'MN030',
      message: 'Los textos del presupuesto se cambiaron en otro aparato.',
    };
    const { cliente } = clienteQueRechaza(rechazo);

    await expect(guardarLaPlantillaDelPresupuesto(cliente, 0, null)).rejects.toBe(rechazo);
  });
});
