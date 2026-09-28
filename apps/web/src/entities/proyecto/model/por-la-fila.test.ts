import { centavos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import type { Proyecto } from './catalogos';
import {
  ajusteDelReparto,
  cobroPorLaFila,
  loDelMesQueVio,
  pedidoPorLaFila,
  planDelCobro,
  proyectoLiquidadoPorLaFila,
  repartosLiquidados,
} from './por-la-fila';

const HOY = '2026-09-23';
const AHORA = '2026-09-23T18:00:00.000Z';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';

const IDS = ['r-uno', 'r-dos', 'r-tres'] as const;

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const FILA: Fila = {
  pasos: [
    { tesoro: HOGAR, clase: 'sueldo', tope: centavos(300_000), renglones: [], desde: null },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(200_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(200_000) }],
      desde: '2026-09',
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: 5000 as never }],
  sueldoPorTrabajo: false,
};

function tesoro(id: string, clave: FilaDe<'tesoros'>['clave'], nombre: string, tinta: string) {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
  } satisfies FilaDe<'tesoros'>;
}

function proyecto(extra: Partial<Proyecto> = {}): Proyecto {
  return {
    ...METADATOS,
    id: 'p',
    titulo: 'Placard',
    estado: 'entregado',
    version: 7,
    fecha_cobro: null,
    dist_cobrado_centavos: null,
    dist_fila_version: null,
    dist_fila: null,
    dist_previo: null,
    reapertura_fecha_cobro: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fila: null,
    reparto_ya_en_la_apertura: false,
    ...extra,
  } as Proyecto;
}

function taller({ fila = FILA }: { fila?: Fila | null } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    sueldo_mensual_centavos: 300_000,
    costos_fijos_centavos: 200_000,
    sueldo_tope_mensual: true,
    perdido_con_sueldo: false,
    perdido_con_diezmo: true,
    fila: fila as unknown as FilaDe<'ajustes'>['fila'],
    fila_version: fila === null ? 2 : 4,
    fila_guardada_at: null,
  } as unknown as FilaDe<'ajustes'>);
  for (const fila of [
    tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
    tesoro(MAUN, 'maun', 'Maun', 'maun'),
    tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
    tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
    tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
  ]) {
    replica = aplicarFilaLocal(replica, 'tesoros', fila);
  }
  replica = aplicarFilaLocal(replica, 'proyectos', proyecto());
  replica = aplicarFilaLocal(replica, 'pagos', {
    ...METADATOS,
    id: 'pago',
    proyecto_id: 'p',
    fecha: HOY,
    concepto: 'Saldo',
    monto_centavos: 1_000_000,
    ya_en_la_apertura: false,
  });
  replica = aplicarFilaLocal(
    replica,
    'proyectos',
    proyecto({
      id: 'antes',
      estado: 'cobrado',
      fecha_cobro: '2026-09-02',
      dist_cobrado_centavos: 111_111,
      dist_gastos_centavos: 0,
      dist_diezmo_centavos: 11_111,
      dist_remanente_centavos: 100_000,
      dist_fila_version: 4,
    }),
  );
  replica = aplicarFilaLocal(replica, 'repartos', {
    ...METADATOS,
    id: 'r-antes',
    proyecto_id: 'antes',
    posicion: 1,
    tesoro_id: HOGAR,
    nombre: 'Hogar',
    tipo: 'paso',
    clase: 'sueldo',
    objetivo_centavos: 300_000,
    previo_centavos: 0,
    tope_centavos: 300_000,
    por_mes: true,
    porcentaje_bp: null,
    monto_centavos: 100_000,
    fecha: '2026-09-02',
    ya_en_la_apertura: false,
  });
  return replica;
}

function cobro(replica = taller()) {
  return cobroPorLaFila(replica, proyecto(), HOY);
}

describe('el cobro por la fila', () => {
  it('baja por la fila guardada con lo que el mes ya llevaba, y sale con su revisión', () => {
    const { liquidacion, version } = cobro();
    expect(version).toBe(4);
    expect(liquidacion.pasos.map((paso) => [paso.tesoro, paso.previo, paso.monto])).toEqual([
      [HOGAR, 100_000, 200_000],
      [FIJOS, 0, 200_000],
    ]);
    expect(liquidacion.reparto.map((parte) => [parte.tesoro, parte.monto])).toEqual([
      [COCOS, 250_000],
    ]);
    expect(liquidacion.remanente).toBe(250_000);
    expect(loDelMesQueVio(liquidacion)).toEqual({ [HOGAR]: 100_000, [FIJOS]: 0 });
  });

  it('un reabierto que se había cobrado por la fila vuelve con esa fila y esa revisión', () => {
    const reabierto = proyecto({
      reapertura_fecha_cobro: '2026-09-10',
      reapertura_objetivo_sueldo_centavos: 0,
      reapertura_objetivo_fijos_centavos: 0,
      reapertura_sueldo_mensual: true,
      reapertura_fila: {
        version: 2,
        fila: { ...FILA, reparto: [] },
      } as unknown as Proyecto['reapertura_fila'],
    });
    const { liquidacion, version } = cobroPorLaFila(taller(), reabierto, HOY);
    expect(version).toBe(2);
    expect(liquidacion.reparto).toEqual([]);
  });
});

describe('pedidoPorLaFila', () => {
  it('lleva las columnas de siempre en cero, lo que pasa por Maun y la fila con sus ids', () => {
    const elCobro = cobro();
    expect(pedidoPorLaFila(proyecto(), elCobro, IDS)).toEqual({
      proyectoId: 'p',
      version: 7,
      destino: 'cobrado',
      fecha: HOY,
      cobradoCentavos: 1_000_000,
      gastosCentavos: 0,
      topeSueldoCentavos: 0,
      topeFijosCentavos: 0,
      diezmoBp: 1000,
      diezmoCentavos: 100_000,
      sueldoCentavos: 0,
      fijosCentavos: 0,
      remanenteCentavos: 900_000,
      sueldoPrevioCentavos: 0,
      fijosPrevioCentavos: 0,
      yaEnLaApertura: false,
      porLaFila: {
        version: 4,
        repartos: [
          { id: 'r-uno', posicion: 1, tesoro_id: HOGAR, monto_centavos: 200_000 },
          { id: 'r-dos', posicion: 2, tesoro_id: FIJOS, monto_centavos: 200_000 },
          { id: 'r-tres', posicion: 3, tesoro_id: COCOS, monto_centavos: 250_000 },
        ],
        previo: { [HOGAR]: 100_000, [FIJOS]: 0 },
      },
    });
  });

  it('sin fila guardada viaja igual por la fila de siempre, con la revisión de los ajustes', () => {
    const replica = taller({ fila: null });
    const deSiempre = cobroPorLaFila(replica, proyecto(), HOY);
    const pedido = pedidoPorLaFila(proyecto(), deSiempre, ['a', 'b'], true);
    expect(pedido.porLaFila?.version).toBe(2);
    expect(pedido.porLaFila?.repartos.map((uno) => [uno.posicion, uno.tesoro_id])).toEqual([
      [1, HOGAR],
      [2, MAUN],
    ]);
    expect(pedido).toMatchObject({ sueldoCentavos: 0, fijosCentavos: 0, yaEnLaApertura: true });
  });

  it('sin un id por reparto no arma el pedido', () => {
    expect(() => pedidoPorLaFila(proyecto(), cobro(), ['r-uno'])).toThrow(RangeError);
  });
});

describe('repartosLiquidados', () => {
  it('son las filas optimistas en el orden de la fila: los pasos, después las partes, desde 1', () => {
    const elCobro = cobro();
    const pedido = pedidoPorLaFila(proyecto(), elCobro, IDS, true);
    const filas = repartosLiquidados(taller(), proyecto(), elCobro, pedido, AHORA);

    expect(
      filas.map((fila) => [fila.id, fila.posicion, fila.tesoro_id, fila.tipo, fila.nombre]),
    ).toEqual([
      ['r-uno', 1, HOGAR, 'paso', 'Hogar'],
      ['r-dos', 2, FIJOS, 'paso', 'Gastos fijos'],
      ['r-tres', 3, COCOS, 'parte', 'Cocos'],
    ]);
    expect(filas[0]).toMatchObject({
      household_id: 'h',
      proyecto_id: 'p',
      clase: 'sueldo',
      objetivo_centavos: 300_000,
      previo_centavos: 100_000,
      tope_centavos: 200_000,
      por_mes: true,
      porcentaje_bp: null,
      monto_centavos: 200_000,
      fecha: HOY,
      ya_en_la_apertura: true,
      created_at: AHORA,
      deleted_at: null,
    });
    expect(filas[2]).toMatchObject({
      clase: null,
      objetivo_centavos: null,
      tope_centavos: null,
      por_mes: null,
      porcentaje_bp: 5000,
      monto_centavos: 250_000,
    });
  });
});

describe('proyectoLiquidadoPorLaFila', () => {
  it('congela las columnas de siempre, la fila, su revisión y lo que vio del mes', () => {
    const elCobro = cobro();
    const fila = proyectoLiquidadoPorLaFila(proyecto(), elCobro, AHORA);
    expect(fila).toMatchObject({
      estado: 'cobrado',
      version: 8,
      updated_at: AHORA,
      fecha_cobro: HOY,
      dist_cobrado_centavos: 1_000_000,
      dist_gastos_centavos: 0,
      dist_diezmo_bp: 1000,
      dist_diezmo_centavos: 100_000,
      dist_tope_sueldo_centavos: 0,
      dist_tope_fijos_centavos: 0,
      dist_sueldo_centavos: 0,
      dist_fijos_centavos: 0,
      dist_remanente_centavos: 900_000,
      dist_objetivo_sueldo_centavos: 0,
      dist_objetivo_fijos_centavos: 0,
      dist_sueldo_mensual: true,
      dist_liquidado_at: AHORA,
      dist_fila_version: 4,
      dist_previo: { [HOGAR]: 100_000, [FIJOS]: 0 },
      reparto_ya_en_la_apertura: false,
      reapertura_fecha_cobro: null,
      reapertura_fila: null,
    });
    expect(fila.dist_fila).toEqual(FILA);
  });
});

describe('ajusteDelReparto', () => {
  const nombres = new Map([
    [HOGAR, 'Hogar'],
    [FIJOS, 'Gastos fijos'],
    [COCOS, 'Cocos'],
  ]);

  function lasDos() {
    const elCobro = cobro();
    const pedido = pedidoPorLaFila(proyecto(), elCobro, IDS);
    const plan = planDelCobro(elCobro.liquidacion);
    return { elCobro, pedido, plan };
  }

  it('si la base vio lo mismo del mes, no hay ajuste', () => {
    const { elCobro, pedido, plan } = lasDos();
    const devuelta = proyectoLiquidadoPorLaFila(proyecto(), elCobro, AHORA);
    expect(ajusteDelReparto(devuelta, pedido, plan, nombres)).toBeUndefined();
  });

  it('si el mes ya llevaba más, dice qué tesoro recibió distinto y cuánto quedó en Maun', () => {
    const { elCobro, pedido, plan } = lasDos();
    const devuelta = {
      ...proyectoLiquidadoPorLaFila(proyecto(), elCobro, AHORA),
      dist_previo: { [HOGAR]: 300_000, [FIJOS]: 0 },
    };
    expect(ajusteDelReparto(devuelta, pedido, plan, nombres)).toEqual({
      diferencias: [
        {
          tesoro: HOGAR,
          nombre: 'Hogar',
          esperado: 200_000,
          quedo: 0,
          yaLlevabaElMes: 300_000,
        },
        { tesoro: COCOS, nombre: 'Cocos', esperado: 250_000, quedo: 350_000, yaLlevabaElMes: 0 },
      ],
      remanenteEsperado: 250_000,
      remanenteQuedo: 350_000,
    });
  });

  it('un cobro por el camino de antes no se compara por la fila', () => {
    const { elCobro, pedido, plan } = lasDos();
    const deAntes = {
      ...proyectoLiquidadoPorLaFila(proyecto(), elCobro, AHORA),
      dist_fila_version: null,
      dist_previo: { [HOGAR]: 300_000 },
    };
    expect(ajusteDelReparto(deAntes, pedido, plan, nombres)).toBeUndefined();
    expect(
      ajusteDelReparto(
        { ...deAntes, dist_fila_version: 4 },
        { ...pedido, porLaFila: undefined },
        plan,
        nombres,
      ),
    ).toBeUndefined();
  });
});
