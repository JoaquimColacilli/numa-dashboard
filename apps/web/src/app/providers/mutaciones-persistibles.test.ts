import 'fake-indexeddb/auto';

import {
  onlineManager,
  QueryClient,
  type Mutation,
  type MutationOptions,
} from '@tanstack/react-query';
import { persistQueryClientRestore } from '@tanstack/react-query-persist-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as agenda from '@/entities/agenda';
import * as archivo from '@/entities/archivo';
import * as cliente from '@/entities/cliente';
import * as enlace from '@/entities/enlace';
import * as entrega from '@/entities/entrega';
import * as movimiento from '@/entities/movimiento';
import * as opinion from '@/entities/opinion';
import * as presupuesto from '@/entities/presupuesto';
import * as proyecto from '@/entities/proyecto';
import * as sesion from '@/entities/sesion';
import * as tesoro from '@/entities/tesoro';
import * as armarLaFila from '@/features/armar-la-fila';
import * as armarLaVidriera from '@/features/armar-la-vidriera';
import * as configurarElPresupuesto from '@/features/configurar-el-presupuesto';
import * as configurarTaller from '@/features/configurar-taller';
import {
  CLAVE_DE_PROYECTO,
  conUnaNecesidadEditada,
  guardadoDeLoQueHaceFalta,
  type GuardadoDeProyecto,
} from '@/entities/proyecto';
import {
  CLAVE_DEL_ENVIO,
  NUMERO_PENDIENTE,
  type EnvioDelPresupuesto,
} from '@/entities/presupuesto';
import {
  filaPorId,
  guardarElProyecto,
  mandarElPresupuestoAlCliente,
  TABLAS_REPLICADAS,
  type FilaDe,
  type PresupuestoMandado,
  type ProyectoGuardado,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import {
  borrarCacheLocal,
  crearPersisterIndexedDb,
  guardarCacheAhora,
  reanudarCola,
  registrarGuardado,
} from '@/shared/lib';

import { OPCIONES_DE_DESHIDRATACION } from './lo-que-se-guarda';
import { crearQueryClient, DURACION_CACHE_MS, VERSION_CACHE } from './query-client';

vi.mock(import('@/shared/api'), async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    guardarElProyecto: vi.fn<typeof real.guardarElProyecto>(),
    mandarElPresupuestoAlCliente: vi.fn<typeof real.mandarElPresupuestoAlCliente>(),
  };
});

const CLAVE_DE_LA_REPLICA = ['replica', 'u1'] as const;
const AHORA = '2026-09-22T12:00:00Z';

const PROYECTO: FilaDe<'proyectos'> = {
  household_id: 'h',
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 3,
  id: 'p1',
  cliente_id: 'c1',
  titulo: 'Vanitory Chico',
  descripcion: '',
  estado: 'a_presupuestar',
  presupuesto_centavos: null,
  sena_bp: null,
  forma_pago: null,
  cobro_sena: null,
  cobro_saldo: null,
  comprobante: 'sin_comprobante',
  fecha_visita: null,
  visita_hora: null,
  ultimo_contacto: null,
  fecha_inicio: null,
  entrega_estimada: null,
  entrega_hora: null,
  fecha_entrega: null,
  direccion_entrega: '',
  notas: '',
  vencimiento_presupuesto: null,
  costo_madera_centavos: null,
  costo_herrajes_centavos: null,
  costo_flete_centavos: null,
  costo_ayudante_centavos: null,
  fecha_cobro: null,
  dist_cobrado_centavos: null,
  dist_gastos_centavos: null,
  dist_diezmo_bp: null,
  dist_tope_sueldo_centavos: null,
  dist_tope_fijos_centavos: null,
  dist_diezmo_centavos: null,
  dist_sueldo_centavos: null,
  dist_fijos_centavos: null,
  dist_remanente_centavos: null,
  dist_objetivo_sueldo_centavos: null,
  dist_objetivo_fijos_centavos: null,
  dist_sueldo_mensual: null,
  dist_sueldo_previo_centavos: null,
  dist_fijos_previo_centavos: null,
  dist_liquidado_at: null,
  reapertura_objetivo_sueldo_centavos: null,
  reapertura_objetivo_fijos_centavos: null,
  reapertura_sueldo_mensual: null,
  reapertura_fecha_cobro: null,
  reapertura_fila: null,
  dist_fila_version: null,
  dist_fila: null,
  dist_previo: null,
  reparto_ya_en_la_apertura: false,
  presupuesto_vale_hasta: null,
  listo_el: null,
  entrega_comprometida: null,
  entrega_comprometida_franja: null,
  tipo_de_proyecto: null,
  presupuesto_diseno: false,
  presupuesto_despiece: false,
  presupuesto_cotizacion: false,
  presupuesto_pdf: false,
  visita_hecha: false,
  visita_importante: false,
  entrega_importante: false,
  presupuesto_importante: false,
};

const BISAGRAS: FilaDe<'necesidades'> = {
  id: 'n1',
  household_id: 'h',
  proyecto_id: 'p1',
  tipo: 'herraje',
  nombre: 'bisagras cazoleta',
  cantidad: 4,
  listo: true,
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 2,
};

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'MAUN', deleted_at: null, version: 1 } };
  tablas.proyectos = { p1: PROYECTO };
  tablas.necesidades = { n1: BISAGRAS };
  return { usuarioId: 'u1', cursor: '', reconciliadoEn: AHORA, tablas } as unknown as Replica;
}

function laEdicion(): GuardadoDeProyecto {
  return guardadoDeLoQueHaceFalta(
    PROYECTO,
    [BISAGRAS],
    conUnaNecesidadEditada([BISAGRAS], 'n1', {
      nombre: 'Bisagras Cazoleta 35 Cierre Suave',
      cantidad: 6,
    }),
  );
}

function respuestaDeLaBase(): ProyectoGuardado {
  return {
    proyecto: PROYECTO,
    pagos: [],
    gastos: [],
    opciones: [],
    necesidades: [
      {
        ...BISAGRAS,
        nombre: 'Bisagras Cazoleta 35 Cierre Suave',
        cantidad: 6,
        version: 3,
      },
    ],
    proximos: [],
  };
}

async function restaurarEn(cliente: QueryClient): Promise<void> {
  await persistQueryClientRestore({
    queryClient: cliente,
    persister: crearPersisterIndexedDb(),
    buster: VERSION_CACHE,
    maxAge: DURACION_CACHE_MS,
  });
}

async function editarSinSenalYCerrar(): Promise<void> {
  const abierta = crearQueryClient();
  onlineManager.setOnline(false);
  const olvidar = registrarGuardado({
    queryClient: abierta,
    persister: crearPersisterIndexedDb(),
    buster: VERSION_CACHE,
    dehydrateOptions: OPCIONES_DE_DESHIDRATACION,
  });
  abierta.setQueryData(CLAVE_DE_LA_REPLICA, replicaDelTaller());

  const mutacion: Mutation<ProyectoGuardado, unknown, GuardadoDeProyecto> = abierta
    .getMutationCache()
    .build(abierta, { mutationKey: CLAVE_DE_PROYECTO });
  void mutacion.execute(laEdicion()).catch(() => undefined);

  await vi.waitFor(() => {
    const optimista = abierta.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
    expect(optimista && filaPorId(optimista, 'necesidades', 'n1')).toMatchObject({
      nombre: 'Bisagras Cazoleta 35 Cierre Suave',
      cantidad: 6,
      listo: true,
    });
  });
  await guardarCacheAhora();
  expect(mutacion.state.isPaused).toBe(true);

  olvidar();
  abierta.clear();
}

const MODULOS_CON_MUTACIONES = {
  agenda,
  archivo,
  cliente,
  enlace,
  entrega,
  movimiento,
  opinion,
  presupuesto,
  proyecto,
  sesion,
  tesoro,
  configurarTaller,
  configurarElPresupuesto,
  armarLaVidriera,
  armarLaFila,
};

type MutacionExportada = [string, MutationOptions<unknown, unknown, never>];

function mutacionesExportadas(): MutacionExportada[] {
  return Object.values(MODULOS_CON_MUTACIONES).flatMap((modulo) =>
    Object.entries(modulo).flatMap(([nombre, valor]: [string, unknown]): MutacionExportada[] =>
      nombre.startsWith('MUTACION_') &&
      typeof valor === 'object' &&
      valor !== null &&
      'mutationKey' in valor
        ? [[nombre, valor as MutationOptions<unknown, unknown, never>]]
        : [],
    ),
  );
}

describe('el registro de las mutaciones', () => {
  it('toda mutación que exporta la app tiene su mutationFn registrada para reanudar la cola', () => {
    const registrado = crearQueryClient();
    const mutaciones = mutacionesExportadas();
    expect(mutaciones.length).toBeGreaterThan(25);

    const sinRegistrar = mutaciones
      .filter(
        ([, mutacion]) =>
          mutacion.mutationKey === undefined ||
          registrado.getMutationDefaults(mutacion.mutationKey).mutationFn !== mutacion.mutationFn,
      )
      .map(([nombre]) => nombre);
    expect(sinRegistrar).toEqual([]);
  });
});

beforeEach(() => {
  vi.mocked(guardarElProyecto).mockReset();
  vi.mocked(mandarElPresupuestoAlCliente).mockReset();
});

afterEach(async () => {
  onlineManager.setOnline(true);
  await borrarCacheLocal();
});

describe('editar lo que hace falta sin señal', () => {
  it('queda en la cola, sobrevive a cerrar la app y llega igual al volver la señal', async () => {
    await editarSinSenalYCerrar();
    expect(guardarElProyecto).not.toHaveBeenCalled();

    const reabierta = crearQueryClient();
    onlineManager.setOnline(false);
    await restaurarEn(reabierta);

    const guardada = reabierta.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
    expect(guardada && filaPorId(guardada, 'necesidades', 'n1')).toMatchObject({
      nombre: 'Bisagras Cazoleta 35 Cierre Suave',
      cantidad: 6,
    });
    expect(reabierta.getMutationCache().getAll()).toHaveLength(1);

    vi.mocked(guardarElProyecto).mockResolvedValue(respuestaDeLaBase());
    onlineManager.setOnline(true);
    await reanudarCola(reabierta);

    expect(guardarElProyecto).toHaveBeenCalledOnce();
    const [pedido] = vi.mocked(guardarElProyecto).mock.calls[0] ?? [];
    expect(pedido?.version).toBe(PROYECTO.version);
    expect(pedido?.necesidades).toEqual([
      {
        id: 'n1',
        tipo: 'herraje',
        nombre: 'Bisagras Cazoleta 35 Cierre Suave',
        cantidad: 6,
        listo: true,
      },
    ]);
    expect(reabierta.getMutationCache().getAll()[0]?.state.status).toBe('success');
  });

  it('sin la mutación registrada se pierde en silencio: es lo que el registro evita', async () => {
    await editarSinSenalYCerrar();

    const sinRegistro = new QueryClient({
      defaultOptions: { mutations: { networkMode: 'online' } },
    });
    await restaurarEn(sinRegistro);
    onlineManager.setOnline(true);
    await reanudarCola(sinRegistro);

    expect(guardarElProyecto).not.toHaveBeenCalled();
    const perdida = sinRegistro.getMutationCache().getAll()[0];
    expect(perdida?.state.status).toBe('error');
    expect(String(perdida?.state.error)).toContain('No mutationFn found');
  });
});

const BORRADOR: FilaDe<'presupuestos'> = {
  id: 'b1',
  household_id: 'h',
  proyecto_id: 'p1',
  contenido: { forma: 1 },
  borrador_version: 2,
  numero: null,
  aceptado_el: null,
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 2,
};

function elEnvio(): EnvioDelPresupuesto {
  return {
    pedido: {
      presupuestoId: 'b1',
      revisionId: 'r1',
      version: 2,
      documento: { forma: 1 } as unknown as EnvioDelPresupuesto['pedido']['documento'],
      queCambio: null,
      mandadoEl: '2026-09-22',
      valeHasta: '2026-10-07',
    },
    proyectoId: 'p1',
    revision: 1,
    numero: null,
    previos: { proyecto: PROYECTO, proximos: [] },
    momento: AHORA,
  };
}

function loQueDevuelveLaBase(): PresupuestoMandado {
  return {
    revision: {
      id: 'r1',
      household_id: 'h',
      presupuesto_id: 'b1',
      proyecto_id: 'p1',
      revision: 1,
      numero: '20260922-01',
      mandado_el: '2026-09-22',
      vale_hasta: '2026-10-07',
      que_cambio: null,
      contenido: { forma: 1 },
      created_at: AHORA,
      updated_at: AHORA,
      deleted_at: null,
      version: 1,
    },
    presupuesto: { ...BORRADOR, numero: '20260922-01', version: 3 },
    proyecto: { ...PROYECTO, estado: 'presupuesto_enviado', version: 4 },
    proximos: [],
  };
}

describe('mandar el presupuesto sin señal', () => {
  it('queda en la cola con la revisión sin número, sobrevive a cerrar la app y se numera al volver la señal', async () => {
    const abierta = crearQueryClient();
    onlineManager.setOnline(false);
    const olvidar = registrarGuardado({
      queryClient: abierta,
      persister: crearPersisterIndexedDb(),
      buster: VERSION_CACHE,
      dehydrateOptions: OPCIONES_DE_DESHIDRATACION,
    });
    const conElBorrador = replicaDelTaller();
    abierta.setQueryData(CLAVE_DE_LA_REPLICA, {
      ...conElBorrador,
      tablas: { ...conElBorrador.tablas, presupuestos: { b1: BORRADOR } },
    });

    const mutacion: Mutation<PresupuestoMandado, unknown, EnvioDelPresupuesto> = abierta
      .getMutationCache()
      .build(abierta, { mutationKey: CLAVE_DEL_ENVIO });
    void mutacion.execute(elEnvio()).catch(() => undefined);

    await vi.waitFor(() => {
      const optimista = abierta.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
      expect(optimista && filaPorId(optimista, 'revisiones_del_presupuesto', 'r1')).toMatchObject({
        numero: NUMERO_PENDIENTE,
        revision: 1,
      });
      expect(optimista && filaPorId(optimista, 'proyectos', 'p1')).toMatchObject({
        estado: 'presupuesto_enviado',
        presupuesto_vale_hasta: '2026-10-07',
        presupuesto_pdf: true,
      });
    });
    await guardarCacheAhora();
    expect(mutacion.state.isPaused).toBe(true);
    expect(mandarElPresupuestoAlCliente).not.toHaveBeenCalled();
    olvidar();
    abierta.clear();

    const reabierta = crearQueryClient();
    onlineManager.setOnline(false);
    await restaurarEn(reabierta);
    const guardada = reabierta.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
    expect(guardada && filaPorId(guardada, 'revisiones_del_presupuesto', 'r1')?.numero).toBe(
      NUMERO_PENDIENTE,
    );

    vi.mocked(mandarElPresupuestoAlCliente).mockResolvedValue(loQueDevuelveLaBase());
    onlineManager.setOnline(true);
    await reanudarCola(reabierta);

    expect(mandarElPresupuestoAlCliente).toHaveBeenCalledOnce();
    expect(vi.mocked(mandarElPresupuestoAlCliente).mock.calls[0]?.[0]).toMatchObject({
      presupuestoId: 'b1',
      revisionId: 'r1',
      version: 2,
    });
    const confirmada = reabierta.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
    expect(confirmada && filaPorId(confirmada, 'revisiones_del_presupuesto', 'r1')?.numero).toBe(
      '20260922-01',
    );
    expect(confirmada && filaPorId(confirmada, 'presupuestos', 'b1')?.numero).toBe('20260922-01');
  });
});
