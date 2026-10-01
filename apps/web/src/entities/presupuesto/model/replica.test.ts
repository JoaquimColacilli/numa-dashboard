import { borradorNuevo, PLANTILLA_DE_SIEMPRE, type BorradorDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  filaPorId,
  filasDe,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Json,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import {
  conElBorradorGuardado,
  conElPresupuestoMandado,
  conLoMandado,
  presupuestoDelTrabajo,
  revisionesDelPresupuesto,
  seNumeraCuandoVuelvaLaSenal,
  NUMERO_PENDIENTE,
  sinElBorradorGuardado,
  sinElPresupuestoMandado,
  ultimaRevision,
  type EnvioDelPresupuesto,
  type FilaDeRevision,
} from './replica';

const AHORA = '2026-09-22T12:00:00Z';
const LUEGO = '2026-09-22T12:05:00Z';

const BORRADOR: BorradorDelPresupuesto = {
  ...borradorNuevo({
    titulo: 'Placard',
    obra: '',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  }),
  muebles: [{ id: 'm1', nombre: 'Placard', descripcion: 'Tres puertas.' }],
};

const CONTENIDO = BORRADOR as unknown as Json;

function proyecto(estado: FilaDe<'proyectos'>['estado']): FilaDe<'proyectos'> {
  return {
    id: 'p1',
    household_id: 'h',
    cliente_id: 'c1',
    titulo: 'Placard',
    estado,
    version: 3,
    presupuesto_vale_hasta: null,
    ultimo_contacto: null,
    presupuesto_pdf: false,
    deleted_at: null,
  } as unknown as FilaDe<'proyectos'>;
}

function presupuesto(cambios: Partial<FilaDe<'presupuestos'>> = {}): FilaDe<'presupuestos'> {
  return {
    id: 'b1',
    household_id: 'h',
    proyecto_id: 'p1',
    contenido: CONTENIDO,
    borrador_version: 2,
    numero: null,
    aceptado_el: null,
    created_at: AHORA,
    updated_at: AHORA,
    deleted_at: null,
    version: 2,
    ...cambios,
  };
}

function revision(id: string, numero: number, extra: Partial<FilaDeRevision> = {}): FilaDeRevision {
  return {
    id,
    household_id: 'h',
    presupuesto_id: 'b1',
    proyecto_id: 'p1',
    revision: numero,
    numero: '20260920-01',
    mandado_el: '2026-09-20',
    vale_hasta: null,
    que_cambio: null,
    contenido: { forma: 1 },
    idioma: 'es',
    created_at: AHORA,
    updated_at: AHORA,
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

function replica(tablas: Partial<Record<TablaReplicada, Record<string, unknown>>> = {}): Replica {
  const todas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) todas[tabla] = tablas[tabla] ?? {};
  todas.households = { h: { id: 'h', nombre: 'Taller de prueba', deleted_at: null, version: 1 } };
  return {
    usuarioId: 'u1',
    cursor: '',
    reconciliadoEn: AHORA,
    tablas: todas,
  } as unknown as Replica;
}

function envio(cambios: Partial<EnvioDelPresupuesto> = {}): EnvioDelPresupuesto {
  return {
    pedido: {
      presupuestoId: 'b1',
      revisionId: 'r9',
      version: 2,
      documento: { forma: 1 } as unknown as EnvioDelPresupuesto['pedido']['documento'],
      queCambio: null,
      mandadoEl: '2026-09-22',
      valeHasta: '2026-10-07',
    },
    proyectoId: 'p1',
    revision: 1,
    numero: null,
    previos: { proyecto: proyecto('a_presupuestar'), proximos: [] },
    momento: LUEGO,
    ...cambios,
  };
}

describe('el presupuesto en la réplica', () => {
  it('el borrador de un trabajo y sus revisiones, en orden', () => {
    const conTodo = replica({
      presupuestos: { b1: presupuesto() },
      revisiones_del_presupuesto: { r2: revision('r2', 2), r1: revision('r1', 1) },
    });
    expect(presupuestoDelTrabajo(conTodo, 'p1')?.id).toBe('b1');
    expect(presupuestoDelTrabajo(conTodo, 'otro')).toBeNull();
    expect(revisionesDelPresupuesto(conTodo, 'b1').map((una) => una.id)).toEqual(['r1', 'r2']);
    expect(ultimaRevision(conTodo, 'b1')?.id).toBe('r2');
    expect(ultimaRevision(conTodo, 'otro')).toBeNull();
  });

  it('una revisión mandada sin señal todavía no tiene número', () => {
    expect(seNumeraCuandoVuelvaLaSenal({ numero: NUMERO_PENDIENTE })).toBe(true);
    expect(seNumeraCuandoVuelvaLaSenal({ numero: '20260920-01' })).toBe(false);
  });
});

describe('guardar el borrador', () => {
  it('el alta lo deja en la revisión 1, sin número', () => {
    const guardado = {
      pedido: { id: 'b1', proyectoId: 'p1', version: 0, contenido: BORRADOR },
      previo: null,
      momento: LUEGO,
    } as const;
    const conElAlta = conElBorradorGuardado(replica(), guardado);
    expect(filaPorId(conElAlta, 'presupuestos', 'b1')).toMatchObject({
      household_id: 'h',
      proyecto_id: 'p1',
      borrador_version: 1,
      numero: null,
      version: 1,
    });
    expect(filasDe(sinElBorradorGuardado(conElAlta, guardado), 'presupuestos')).toEqual([]);
  });

  it('la edición suma una revisión, y si la base la rechaza vuelve a la de antes', () => {
    const previo = presupuesto();
    const guardado = {
      pedido: {
        id: 'b1',
        proyectoId: 'p1',
        version: 2,
        contenido: { ...BORRADOR, titulo: 'Rack' },
      },
      previo,
      momento: LUEGO,
    };
    const editado = conElBorradorGuardado(replica({ presupuestos: { b1: previo } }), guardado);
    expect(filaPorId(editado, 'presupuestos', 'b1')).toMatchObject({
      borrador_version: 3,
      version: 3,
      updated_at: LUEGO,
      contenido: { titulo: 'Rack' },
    });
    expect(filaPorId(sinElBorradorGuardado(editado, guardado), 'presupuestos', 'b1')).toEqual(
      previo,
    );
  });

  it('sin el taller en la réplica no inventa nada', () => {
    const sinTaller = {
      ...replica(),
      tablas: { ...replica().tablas, households: {} },
    } as unknown as Replica;
    const guardado = {
      pedido: { id: 'b1', proyectoId: 'p1', version: 0, contenido: BORRADOR },
      previo: null,
      momento: LUEGO,
    } as const;
    expect(conElBorradorGuardado(sinTaller, guardado)).toBe(sinTaller);
  });
});

describe('mandar el presupuesto', () => {
  it('la primera revisión va sin número hasta que contesta la base, y el trabajo pasa a presupuesto enviado', () => {
    const mandado = conElPresupuestoMandado(
      replica({
        proyectos: { p1: proyecto('a_presupuestar') },
        presupuestos: { b1: presupuesto() },
      }),
      envio(),
    );
    expect(filaPorId(mandado, 'revisiones_del_presupuesto', 'r9')).toMatchObject({
      numero: NUMERO_PENDIENTE,
      revision: 1,
      que_cambio: null,
      mandado_el: '2026-09-22',
      vale_hasta: '2026-10-07',
    });
    expect(filaPorId(mandado, 'proyectos', 'p1')).toMatchObject({
      estado: 'presupuesto_enviado',
      presupuesto_vale_hasta: '2026-10-07',
      ultimo_contacto: '2026-09-22',
      presupuesto_pdf: true,
      version: 4,
    });
  });

  it('una revisión lleva el número que ya tenía y lo que cambió sin blancos, y deja el trabajo donde estaba', () => {
    const mandado = conElPresupuestoMandado(
      replica({ proyectos: { p1: proyecto('presupuesto_enviado') } }),
      envio({
        pedido: { ...envio().pedido, queCambio: '  Sumamos un estante.\n' },
        revision: 2,
        numero: '20260920-01',
        previos: { proyecto: proyecto('presupuesto_enviado'), proximos: [] },
      }),
    );
    expect(filaPorId(mandado, 'revisiones_del_presupuesto', 'r9')).toMatchObject({
      numero: '20260920-01',
      revision: 2,
      que_cambio: 'Sumamos un estante.',
    });
    expect(filaPorId(mandado, 'proyectos', 'p1')?.estado).toBe('presupuesto_enviado');
  });

  it('desde el seguimiento cierra el próximo contacto pendiente, como el trigger de la base', () => {
    const pendiente = {
      id: 'c1',
      proyecto_id: 'p1',
      hecho_el: null,
      resultado: null,
      version: 1,
      deleted_at: null,
    } as unknown as FilaDe<'proximos_contactos'>;
    const viejo = {
      ...pendiente,
      id: 'c0',
      hecho_el: '2026-09-01',
      resultado: 'otra_fecha',
    } as FilaDe<'proximos_contactos'>;
    const desdeElSeguimiento = envio({
      previos: { proyecto: proyecto('en_seguimiento'), proximos: [viejo, pendiente] },
    });
    const mandado = conElPresupuestoMandado(
      replica({
        proyectos: { p1: proyecto('en_seguimiento') },
        proximos_contactos: { c0: viejo, c1: pendiente },
      }),
      desdeElSeguimiento,
    );
    expect(filaPorId(mandado, 'proyectos', 'p1')?.estado).toBe('presupuesto_enviado');
    expect(filaPorId(mandado, 'proximos_contactos', 'c1')).toMatchObject({
      hecho_el: '2026-09-22',
      resultado: 'reactivado',
      version: 2,
    });
    expect(filaPorId(mandado, 'proximos_contactos', 'c0')).toEqual(viejo);

    const deshecho = sinElPresupuestoMandado(mandado, desdeElSeguimiento);
    expect(filaPorId(deshecho, 'revisiones_del_presupuesto', 'r9')).toBeUndefined();
    expect(filaPorId(deshecho, 'proyectos', 'p1')?.estado).toBe('en_seguimiento');
    expect(filaPorId(deshecho, 'proximos_contactos', 'c1')).toEqual(pendiente);
  });

  it('lo que contesta la base reemplaza lo optimista: la revisión numerada, el borrador y el trabajo', () => {
    const optimista = conElPresupuestoMandado(
      replica({
        proyectos: { p1: proyecto('a_presupuestar') },
        presupuestos: { b1: presupuesto() },
      }),
      envio(),
    );
    const confirmado = conLoMandado(optimista, {
      revision: revision('r9', 1, { numero: '20260922-01' }),
      presupuesto: presupuesto({ numero: '20260922-01', version: 3 }),
      proyecto: { ...proyecto('presupuesto_enviado'), version: 4 },
      proximos: [],
    });
    expect(filaPorId(confirmado, 'revisiones_del_presupuesto', 'r9')?.numero).toBe('20260922-01');
    expect(filaPorId(confirmado, 'presupuestos', 'b1')?.numero).toBe('20260922-01');
  });

  it('sin el taller en la réplica no inventa nada', () => {
    const sinTaller = {
      ...replica(),
      tablas: { ...replica().tablas, households: {} },
    } as unknown as Replica;
    expect(conElPresupuestoMandado(sinTaller, envio())).toBe(sinTaller);
  });
});
