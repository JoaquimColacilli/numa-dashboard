import { describe, expect, it } from 'vitest';

import {
  ajustesDe,
  aplicarFilaLocal,
  aplicarLote,
  cantidadDe,
  faltaConfigurar,
  filaPorId,
  filasDe,
  householdDe,
  leerLote,
  necesitaReconcile,
  quitarFilaLocal,
  replicaVacia,
  RespuestaInvalidaError,
  TABLAS_REPLICADAS,
  tieneAcceso,
  type FilaDe,
  type Lote,
  type ModoDeSincronizacion,
  type Replica,
  type TablaReplicada,
} from './replica.ts';

const USUARIO = '11111111-1111-7000-8000-000000000001';
const AHORA = Date.parse('2026-09-11T12:00:00Z');
const HACE_23_HORAS = Date.parse('2026-09-10T13:00:00Z');
const HACE_24_HORAS = Date.parse('2026-09-10T12:00:00Z');

function cruda(id: string, version: number, extra: Record<string, unknown> = {}) {
  return { id, version, deleted_at: null, ...extra };
}

function borrada(id: string, version: number) {
  return { id, version, deleted_at: '2026-09-11T12:00:00Z' };
}

function lote(cursor: string, filas: Partial<Record<TablaReplicada, unknown[]>>): Lote {
  const cuerpo: Record<string, unknown> = { cursor };
  for (const tabla of TABLAS_REPLICADAS) cuerpo[tabla] = filas[tabla] ?? [];
  return leerLote(cuerpo);
}

function conClientes(
  cursor: string,
  filas: unknown[],
  modo: ModoDeSincronizacion = 'reconcile',
  ahora = AHORA,
) {
  return aplicarLote(replicaVacia(USUARIO), lote(cursor, { clientes: filas }), modo, ahora);
}

function ids(replica: Replica, tabla: TablaReplicada): string[] {
  return filasDe(replica, tabla).map((fila) => (fila as { id: string }).id);
}

function ajustesCon(valores: Record<string, number>): Replica {
  return aplicarLote(
    replicaVacia(USUARIO),
    lote('t1', { ajustes: [cruda('a1', 1, valores)] }),
    'reconcile',
    AHORA,
  );
}

describe('leerLote', () => {
  it('acepta la respuesta de bootstrap y delta', () => {
    const resultado = lote('2026-09-11T12:00:00Z', { clientes: [cruda('c1', 1)] });
    expect(resultado.cursor).toBe('2026-09-11T12:00:00Z');
    expect(resultado.filas.clientes).toHaveLength(1);
    expect(resultado.filas.movimientos).toHaveLength(0);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(() => leerLote(null)).toThrow(RespuestaInvalidaError);
    expect(() => leerLote('{}')).toThrow(RespuestaInvalidaError);
  });

  it('rechaza una respuesta sin cursor', () => {
    expect(() => leerLote({ clientes: [] })).toThrow(/cursor/);
  });

  it('rechaza una respuesta a la que le falta una tabla', () => {
    expect(() => leerLote({ cursor: 'x', clientes: [] })).toThrow(/households/);
  });

  it('rechaza la respuesta de una base sin los cambios de etapa: la migración sale antes que la app que los lee', () => {
    const cuerpo: Record<string, unknown> = { cursor: 'x' };
    for (const tabla of TABLAS_REPLICADAS) if (tabla !== 'cambios_de_estado') cuerpo[tabla] = [];
    expect(() => leerLote(cuerpo)).toThrow(/cambios_de_estado/);
  });

  it('rechaza una fila sin los campos que la sincronización necesita', () => {
    expect(() => lote('x', { clientes: [{ id: 'c1', version: 1 }] })).toThrow(/deleted_at/);
    expect(() => lote('x', { clientes: [{ id: 'c1', version: 1.5, deleted_at: null }] })).toThrow(
      /version/,
    );
  });
});

describe('aplicarLote', () => {
  it('con reconcile reemplaza la copia entera', () => {
    const primera = conClientes('t1', [cruda('c1', 1), cruda('c2', 1)]);
    const segunda = aplicarLote(
      primera,
      lote('t2', { clientes: [cruda('c3', 1)] }),
      'reconcile',
      AHORA,
    );

    expect(ids(segunda, 'clientes')).toEqual(['c3']);
    expect(segunda.cursor).toBe('t2');
  });

  it('con delta agrega, actualiza y saca lo borrado', () => {
    const previa = conClientes('t1', [cruda('c1', 1), cruda('c2', 1)]);
    const siguiente = aplicarLote(
      previa,
      lote('t2', {
        clientes: [cruda('c1', 2, { nombre: 'Marcela' }), borrada('c2', 2), cruda('c3', 1)],
      }),
      'delta',
      AHORA,
    );

    expect(ids(siguiente, 'clientes')).toEqual(['c1', 'c3']);
    expect(filasDe(siguiente, 'clientes')[0]).toMatchObject({ version: 2, nombre: 'Marcela' });
    expect(siguiente.cursor).toBe('t2');
    expect(siguiente.reconciliadoEn).toBe(previa.reconciliadoEn);
  });

  it('una fila más vieja no pisa a la más nueva: cubre un delta que llega fuera de orden', () => {
    const previa = conClientes('t1', [cruda('c1', 5, { nombre: 'al día' })]);
    const siguiente = aplicarLote(
      previa,
      lote('t2', { clientes: [cruda('c1', 4, { nombre: 'vieja' })] }),
      'delta',
      AHORA,
    );

    expect(filasDe(siguiente, 'clientes')[0]).toMatchObject({ version: 5, nombre: 'al día' });
  });

  it('con la misma version gana la del servidor: es el solape, y completa la fila optimista', () => {
    const previa = aplicarFilaLocal(replicaVacia(USUARIO), 'movimientos', {
      id: 'm1',
      version: 1,
      deleted_at: null,
      household_id: '',
    } as unknown as FilaDe<'movimientos'>);
    const siguiente = aplicarLote(
      previa,
      lote('t2', { movimientos: [cruda('m1', 1, { household_id: 'h1' })] }),
      'delta',
      AHORA,
    );

    expect(filasDe(siguiente, 'movimientos')[0]).toMatchObject({ household_id: 'h1' });
  });

  it('no toca la réplica anterior', () => {
    const previa = conClientes('t1', [cruda('c1', 1)]);
    aplicarLote(
      previa,
      lote('t2', { clientes: [borrada('c1', 2), cruda('c2', 1)] }),
      'delta',
      AHORA,
    );

    expect(ids(previa, 'clientes')).toEqual(['c1']);
    expect(previa.cursor).toBe('t1');
  });
});

describe('aplicarFilaLocal', () => {
  it('agrega la fila optimista y la baja la saca', () => {
    const fila = { id: 'm1', version: 1, deleted_at: null } as unknown as FilaDe<'movimientos'>;
    const conFila = aplicarFilaLocal(replicaVacia(USUARIO), 'movimientos', fila);
    expect(ids(conFila, 'movimientos')).toEqual(['m1']);

    const baja = {
      ...fila,
      deleted_at: '2026-09-11T12:00:00Z',
    } as unknown as FilaDe<'movimientos'>;
    expect(ids(aplicarFilaLocal(conFila, 'movimientos', baja), 'movimientos')).toEqual([]);
  });

  it('no toca las otras tablas ni la réplica anterior', () => {
    const previa = conClientes('t1', [cruda('c1', 1)]);
    const siguiente = aplicarFilaLocal(previa, 'movimientos', {
      id: 'm1',
      version: 1,
      deleted_at: null,
    } as unknown as FilaDe<'movimientos'>);

    expect(ids(siguiente, 'clientes')).toEqual(['c1']);
    expect(cantidadDe(previa, 'movimientos')).toBe(0);
    expect(siguiente.cursor).toBe(previa.cursor);
  });
});

describe('quitarFilaLocal', () => {
  it('saca la fila optimista que la base rechazó', () => {
    const conFila = aplicarFilaLocal(replicaVacia(USUARIO), 'movimientos', {
      id: 'm1',
      version: 1,
      deleted_at: null,
    } as unknown as FilaDe<'movimientos'>);

    expect(ids(quitarFilaLocal(conFila, 'movimientos', 'm1'), 'movimientos')).toEqual([]);
  });

  it('devuelve la misma réplica si la fila no está', () => {
    const replica = conClientes('t1', [cruda('c1', 1)]);
    expect(quitarFilaLocal(replica, 'movimientos', 'm1')).toBe(replica);
  });
});

describe('lecturas de la réplica', () => {
  it('ordena por id, que en UUIDv7 es por fecha de creación', () => {
    const replica = conClientes('t1', [cruda('c3', 1), cruda('c1', 1), cruda('c2', 1)]);
    expect(ids(replica, 'clientes')).toEqual(['c1', 'c2', 'c3']);
  });

  it('sin household no hay acceso, y con household hay ajustes', () => {
    expect(tieneAcceso(replicaVacia(USUARIO))).toBe(false);
    expect(householdDe(replicaVacia(USUARIO))).toBeUndefined();
    expect(ajustesDe(replicaVacia(USUARIO))).toBeUndefined();

    const replica = aplicarLote(
      replicaVacia(USUARIO),
      lote('t1', {
        households: [cruda('h1', 1, { nombre: 'Taller' })],
        ajustes: [cruda('a1', 1, { sueldo_mensual_centavos: 180000000 })],
      }),
      'reconcile',
      AHORA,
    );

    expect(tieneAcceso(replica)).toBe(true);
    expect(householdDe(replica)).toMatchObject({ nombre: 'Taller' });
    expect(ajustesDe(replica)).toMatchObject({ sueldo_mensual_centavos: 180000000 });
  });

  it('una réplica guardada sin una tabla nueva se lee como vacía en esa tabla, y un delta no la crea: la trae el reconcile', () => {
    const vieja = conClientes('t1', [cruda('c1', 1)]);
    const { anotaciones: _anotaciones, ...sinAnotaciones } = vieja.tablas;
    const guardada = { ...vieja, tablas: sinAnotaciones } as unknown as Replica;

    expect(filasDe(guardada, 'anotaciones')).toEqual([]);
    expect(cantidadDe(guardada, 'anotaciones')).toBe(0);
    expect(filaPorId(guardada, 'anotaciones', 'n1')).toBeUndefined();
    expect(ids(guardada, 'clientes')).toEqual(['c1']);

    const siguiente = aplicarLote(
      guardada,
      lote('t2', {
        clientes: [cruda('c2', 1)],
        anotaciones: [cruda('n1', 1, { texto: 'Comprar melamina' })],
      }),
      'delta',
      AHORA,
    );
    expect(ids(siguiente, 'clientes')).toEqual(['c1', 'c2']);
    expect('anotaciones' in siguiente.tablas).toBe(false);
    expect(necesitaReconcile(siguiente, AHORA)).toBe(true);
  });

  it('filaPorId encuentra la fila y no inventa una que no está', () => {
    const replica = conClientes('t1', [cruda('c1', 1), cruda('c2', 1)]);
    expect(filaPorId(replica, 'clientes', 'c1')).toMatchObject({ id: 'c1' });
    expect(filaPorId(replica, 'clientes', 'c9')).toBeUndefined();
  });

  it('un taller recién creado tiene los ajustes en cero, que es lo que la app pregunta', () => {
    const enCero = ajustesCon({
      sueldo_mensual_centavos: 0,
      costos_fijos_centavos: 0,
      meta_cocos_centavos: 0,
      tasa_cocos_anual_bp: 0,
    });
    expect(faltaConfigurar(ajustesDe(enCero))).toBe(true);

    expect(faltaConfigurar(undefined)).toBe(false);

    const conFila = aplicarLote(
      replicaVacia(USUARIO),
      lote('t1', {
        ajustes: [
          cruda('a1', 1, {
            sueldo_mensual_centavos: 0,
            costos_fijos_centavos: 0,
            meta_cocos_centavos: 0,
            tasa_cocos_anual_bp: 0,
            fila: { pasos: [], reparto: [], sueldoPorTrabajo: false },
          }),
        ],
      }),
      'reconcile',
      AHORA,
    );
    expect(faltaConfigurar(ajustesDe(conFila))).toBe(false);

    const conTasa = ajustesCon({
      sueldo_mensual_centavos: 0,
      costos_fijos_centavos: 0,
      meta_cocos_centavos: 0,
      tasa_cocos_anual_bp: 4000,
    });
    expect(faltaConfigurar(ajustesDe(conTasa))).toBe(false);
  });
});

describe('necesitaReconcile', () => {
  it('sin réplica, o sin reconcile previo, o con una marca ilegible', () => {
    expect(necesitaReconcile(undefined, AHORA)).toBe(true);
    expect(necesitaReconcile(replicaVacia(USUARIO), AHORA)).toBe(true);

    const corrupta: Replica = { ...conClientes('t1', []), reconciliadoEn: 'no es una fecha' };
    expect(necesitaReconcile(corrupta, AHORA)).toBe(true);
  });

  it('a las 24 horas sí, antes no', () => {
    expect(necesitaReconcile(conClientes('t1', [], 'reconcile', HACE_23_HORAS), AHORA)).toBe(false);
    expect(necesitaReconcile(conClientes('t1', [], 'reconcile', HACE_24_HORAS), AHORA)).toBe(true);
  });

  it('una réplica guardada antes de que existiera una tabla pide el reconcile completo', () => {
    const vieja = conClientes('t1', [cruda('c1', 1)], 'reconcile', AHORA);
    const { anotaciones: _anotaciones, ...sinAnotaciones } = vieja.tablas;
    const guardada = { ...vieja, tablas: sinAnotaciones } as unknown as Replica;

    expect(necesitaReconcile(vieja, AHORA)).toBe(false);
    expect(necesitaReconcile(guardada, AHORA)).toBe(true);
  });

  it('una réplica guardada antes de la vidriera se lee sin fotos y pide el reconcile que las trae', () => {
    const vieja = conClientes('t1', [cruda('c1', 1)], 'reconcile', AHORA);
    const { fotos_de_la_vidriera: _fotos, ...sinVidriera } = vieja.tablas;
    const guardada = { ...vieja, tablas: sinVidriera } as unknown as Replica;

    expect(filasDe(guardada, 'fotos_de_la_vidriera')).toEqual([]);
    expect(necesitaReconcile(guardada, AHORA)).toBe(true);
  });

  it('una réplica guardada antes del presupuesto se lee sin borradores ni revisiones y pide el reconcile que los trae', () => {
    const vieja = conClientes('t1', [cruda('c1', 1)], 'reconcile', AHORA);
    const {
      presupuestos: _presupuestos,
      revisiones_del_presupuesto: _revisiones,
      ...sinPresupuesto
    } = vieja.tablas;
    const guardada = { ...vieja, tablas: sinPresupuesto } as unknown as Replica;

    expect(filasDe(guardada, 'presupuestos')).toEqual([]);
    expect(filasDe(guardada, 'revisiones_del_presupuesto')).toEqual([]);
    expect(necesitaReconcile(guardada, AHORA)).toBe(true);
  });

  it('una réplica guardada antes de que viajaran los cambios de etapa se lee sin ellos y pide el reconcile que los trae', () => {
    const vieja = conClientes('t1', [cruda('c1', 1)], 'reconcile', AHORA);
    const { cambios_de_estado: _etapas, ...sinEtapas } = vieja.tablas;
    const guardada = { ...vieja, tablas: sinEtapas } as unknown as Replica;

    expect(filasDe(guardada, 'cambios_de_estado')).toEqual([]);
    expect(necesitaReconcile(guardada, AHORA)).toBe(true);

    const completa = aplicarLote(
      replicaVacia(USUARIO),
      lote('t2', {
        cambios_de_estado: [
          cruda('e1', 1, { proyecto_id: 'p1', desde: null, hacia: 'contacto' }),
          cruda('e2', 1, { proyecto_id: 'p1', desde: 'contacto', hacia: 'relevamiento' }),
        ],
      }),
      'reconcile',
      AHORA,
    );
    expect(ids(completa, 'cambios_de_estado')).toEqual(['e1', 'e2']);
    expect(necesitaReconcile(completa, AHORA)).toBe(false);
  });

  it('el bootstrap trae el borrador y las revisiones, y un borrado los saca', () => {
    const conPresupuesto = aplicarLote(
      replicaVacia(USUARIO),
      lote('t1', {
        presupuestos: [cruda('b1', 2, { proyecto_id: 'p1' })],
        revisiones_del_presupuesto: [cruda('r1', 1, { presupuesto_id: 'b1' })],
      }),
      'reconcile',
      AHORA,
    );
    expect(ids(conPresupuesto, 'presupuestos')).toEqual(['b1']);
    expect(ids(conPresupuesto, 'revisiones_del_presupuesto')).toEqual(['r1']);

    const sinElTrabajo = aplicarLote(
      conPresupuesto,
      lote('t2', {
        presupuestos: [borrada('b1', 3)],
        revisiones_del_presupuesto: [borrada('r1', 2)],
      }),
      'delta',
      AHORA,
    );
    expect(ids(sinElTrabajo, 'presupuestos')).toEqual([]);
    expect(ids(sinElTrabajo, 'revisiones_del_presupuesto')).toEqual([]);
  });

  it('la marca del reconcile es el reloj del cliente, no el cursor del servidor', () => {
    const replica = conClientes('2020-01-01T00:00:00Z', [], 'reconcile', AHORA);

    expect(replica.reconciliadoEn).toBe(new Date(AHORA).toISOString());
    expect(replica.cursor).toBe('2020-01-01T00:00:00Z');
    expect(necesitaReconcile(replica, AHORA + 60_000)).toBe(false);
  });
});
