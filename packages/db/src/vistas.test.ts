import { calcularPorLaFila, centavos, filaDelMes, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  replicaVacia,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from './replica.ts';
import { pedidoDeLaFila } from './sincronizacion.ts';
import {
  analisisDeLaReplica,
  baseDelReparto,
  coberturasDeLaReplica,
  datosDelAnalisis,
  datosDelMesDeLaReplica,
  entradaDeLaLiquidacion,
  filaDelCobro,
  filaDelTaller,
  filaParaLiquidar,
  gastosDeLosTesorosDeLaReplica,
  idDeLaClave,
  insumosDelTaller,
  insumosDelTrabajo,
  insumosPorTrabajo,
  liquidacionesDelMesDeLaReplica,
  metasDeLaReplica,
  modoDelReparto,
  porLaFila,
  reaperturaDeLaFila,
  repartosDelProyecto,
  saldosPorIdDeLaReplica,
  sistemaDeLaReplica,
  tesorosDeLaReplica,
} from './vistas.ts';

const TRABAJO = {
  id: 'p1',
  titulo: 'Placard de pasillo',
  estado: 'entregado',
  fecha_inicio: '2026-09-01',
  fecha_entrega: '2026-09-20',
  listo_el: '2026-09-18',
  tipo_de_proyecto: 'Placard',
  version: 1,
  deleted_at: null,
} as unknown as FilaDe<'proyectos'>;

const ESTIMADA = {
  id: 'f1',
  proyecto_id: 'p1',
  tipo: 'estimada',
  fecha: '2026-09-22',
  origen: 'taller',
  created_at: '2026-09-01T12:00:00Z',
  trabajos_en_curso: 2,
  version: 1,
  deleted_at: null,
} as unknown as FilaDe<'cambios_de_fecha'>;

describe('los datos del analítico de entregas', () => {
  it('salen de los trabajos y de la historia de las fechas', () => {
    let replica = aplicarFilaLocal(replicaVacia('u'), 'proyectos', TRABAJO);
    replica = aplicarFilaLocal(replica, 'cambios_de_fecha', ESTIMADA);

    expect(datosDelAnalisis(replica)).toEqual({
      trabajos: [
        {
          id: 'p1',
          titulo: 'Placard de pasillo',
          tipo: 'Placard',
          estado: 'entregado',
          inicio: '2026-09-01',
          listo: '2026-09-18',
          entregado: '2026-09-20',
        },
      ],
      cambios: [
        {
          id: 'f1',
          proyectoId: 'p1',
          tipo: 'estimada',
          fecha: '2026-09-22',
          origen: 'taller',
          creadoEn: '2026-09-01T12:00:00Z',
          trabajosEnCurso: 2,
        },
      ],
    });
    expect(analisisDeLaReplica(replica).trabajos).toMatchObject([{ id: 'p1', desvio: -2 }]);
  });

  it('una fila guardada antes de que existieran listo y el tipo se lee sin ellos', () => {
    const { listo_el: _listo, tipo_de_proyecto: _tipo, ...vieja } = TRABAJO;
    const replica = aplicarFilaLocal(
      replicaVacia('u'),
      'proyectos',
      vieja as unknown as FilaDe<'proyectos'>,
    );

    expect(datosDelAnalisis(replica).trabajos).toMatchObject([{ tipo: null, listo: null }]);
  });
});

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const MATERIALES = '00000000-0000-7000-8000-000000000011';
const BRUTOS = '00000000-0000-7000-8000-000000000012';
const SUPERAVIT = '00000000-0000-7000-8000-000000000013';

function tesoro(id: string, clave: string | null, nombre: string, extra: object = {}) {
  return {
    id,
    clave,
    nombre,
    descripcion: '',
    tinta: clave ?? 'grana',
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-27T12:00:00Z',
    version: 1,
    deleted_at: null,
    ...extra,
  } as unknown as FilaDe<'tesoros'>;
}

const LOS_DE_SIEMPRE = [
  tesoro(HOGAR, 'hogar', 'Hogar'),
  tesoro(MAUN, 'maun', 'Maun'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo'),
  tesoro(COCOS, 'cocos', 'Cocos'),
];

const AJUSTES = {
  id: 'a1',
  sueldo_mensual_centavos: 180_000_000,
  costos_fijos_centavos: 25_000_000,
  sueldo_tope_mensual: true,
  meta_cocos_centavos: 1_000_000_000,
  tasa_cocos_anual_bp: 4000,
  perdido_con_sueldo: false,
  perdido_con_diezmo: true,
  fila: null,
  fila_version: 3,
  fila_guardada_at: null,
  version: 1,
  deleted_at: null,
} as unknown as FilaDe<'ajustes'>;

function replicaCon(filas: { [T in TablaReplicada]?: readonly object[] }): Replica {
  let replica = replicaVacia('u');
  for (const [tabla, deLaTabla] of Object.entries(filas) as [TablaReplicada, object[]][]) {
    for (const fila of deLaTabla) {
      replica = aplicarFilaLocal(replica, tabla, fila as FilaDe<typeof tabla>);
    }
  }
  return replica;
}

function liquidado(id: string, extra: object): FilaDe<'proyectos'> {
  return {
    id,
    titulo: `Trabajo ${id}`,
    estado: 'cobrado',
    fecha_cobro: '2026-09-10',
    dist_liquidado_at: '2026-09-10T18:00:00Z',
    dist_cobrado_centavos: 100_000_000,
    dist_gastos_centavos: 0,
    dist_diezmo_centavos: 10_000_000,
    dist_sueldo_centavos: 0,
    dist_fijos_centavos: 0,
    dist_remanente_centavos: 90_000_000,
    dist_objetivo_sueldo_centavos: 0,
    dist_objetivo_fijos_centavos: 0,
    dist_sueldo_mensual: true,
    reapertura_fecha_cobro: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    version: 2,
    deleted_at: null,
    ...extra,
  } as unknown as FilaDe<'proyectos'>;
}

function reparto(
  id: string,
  proyecto: string,
  tesoroId: string,
  monto: number,
  extra: object = {},
) {
  return {
    id,
    proyecto_id: proyecto,
    posicion: 1,
    tesoro_id: tesoroId,
    nombre: 'x',
    tipo: 'paso',
    clase: 'prioridad',
    monto_centavos: monto,
    fecha: '2026-09-10',
    ya_en_la_apertura: false,
    version: 1,
    deleted_at: null,
    ...extra,
  } as unknown as FilaDe<'repartos'>;
}

function movimiento(id: string, extra: object) {
  return {
    id,
    fecha: '2026-09-15',
    tipo: 'gasto',
    tesoro_origen: null,
    tesoro_destino: null,
    desde_id: null,
    hacia_id: null,
    cubre_el_mes: null,
    monto_centavos: 1,
    categoria: '',
    descripcion: '',
    proyecto_id: null,
    version: 1,
    deleted_at: null,
    ...extra,
  } as unknown as FilaDe<'movimientos'>;
}

function trabajo(id: string, estado: string): FilaDe<'proyectos'> {
  return {
    id,
    titulo: `Trabajo ${id}`,
    estado,
    reapertura_fecha_cobro: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    version: 1,
    deleted_at: null,
  } as unknown as FilaDe<'proyectos'>;
}

function pago(id: string, proyecto: string, monto: number, extra: object = {}) {
  return {
    id,
    proyecto_id: proyecto,
    fecha: '2026-09-01',
    concepto: 'Seña',
    monto_centavos: monto,
    ya_en_la_apertura: false,
    version: 1,
    deleted_at: null,
    ...extra,
  };
}

function gasto(id: string, proyecto: string, monto: number) {
  return {
    id,
    proyecto_id: proyecto,
    fecha: '2026-09-05',
    descripcion: 'Melamina',
    monto_centavos: monto,
    version: 1,
    deleted_at: null,
  };
}

const PASO_DE_SIEMPRE = { renglones: [], desde: null, modo: 'mes', hastaLaMeta: false } as const;

const DE_LA_FILA_DE_SIEMPRE = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
  reparto: [],
  superavit: MAUN,
};

describe('los tesoros de la réplica', () => {
  it('van los cuatro de siempre primero y los del dueño por su orden; la meta de Cocos sale de ajustes', () => {
    const replica = replicaCon({
      ajustes: [AJUSTES],
      tesoros: [
        tesoro(MATERIALES, null, 'Materiales', { orden: 2 }),
        tesoro(FIJOS, null, 'Gastos fijos', {
          orden: 1,
          meta_centavos: 5000,
          archivado_at: 'ayer',
        }),
        ...LOS_DE_SIEMPRE,
      ],
    });

    const tesoros = tesorosDeLaReplica(replica);
    expect(tesoros.map((uno) => uno.nombre)).toEqual([
      'Hogar',
      'Maun',
      'Diezmo',
      'Cocos',
      'Gastos fijos',
      'Materiales',
    ]);
    expect(tesoros[3]).toMatchObject({ meta: 1_000_000_000, rindeAnualBp: 4000 });
    expect(tesoros[4]).toMatchObject({ meta: 5000, archivado: true });
    expect(tesoros[0]).toMatchObject({ meta: null, rindeAnualBp: null });
    expect(idDeLaClave(replica, 'maun')).toBe(MAUN);
  });

  it('sin tesoros replicados, cada clave es su propio id', () => {
    expect(tesorosDeLaReplica(replicaVacia('u'))).toEqual([]);
    expect(idDeLaClave(replicaVacia('u'), 'hogar')).toBe('hogar');
    expect(sistemaDeLaReplica(replicaVacia('u'))).toEqual({
      hogar: 'hogar',
      maun: 'maun',
      diezmo: 'diezmo',
    });
  });

  it('el sistema son los ids de Hogar, Maun y el diezmo', () => {
    expect(sistemaDeLaReplica(replicaCon({ tesoros: LOS_DE_SIEMPRE }))).toEqual({
      hogar: HOGAR,
      maun: MAUN,
      diezmo: DIEZMO,
    });
  });

  it('las metas son las de cada tesoro, la de Cocos de ajustes, y solo las que pasan de cero', () => {
    const replica = replicaCon({
      ajustes: [AJUSTES],
      tesoros: [
        ...LOS_DE_SIEMPRE,
        tesoro(MATERIALES, null, 'Materiales', { meta_centavos: 30_000_000 }),
        tesoro(FIJOS, null, 'Gastos fijos'),
      ],
    });
    expect(metasDeLaReplica(replica)).toEqual(
      new Map([
        [COCOS, 1_000_000_000],
        [MATERIALES, 30_000_000],
      ]),
    );

    const sinMetaDeCocos = replicaCon({
      ajustes: [{ ...AJUSTES, meta_cocos_centavos: 0 }],
      tesoros: LOS_DE_SIEMPRE,
    });
    expect(metasDeLaReplica(sinMetaDeCocos).size).toBe(0);
  });
});

describe('la fila del taller', () => {
  it('sin fila guardada es la de siempre, armada con el sueldo, los costos fijos y el diezmo', () => {
    const replica = replicaCon({ ajustes: [AJUSTES], tesoros: LOS_DE_SIEMPRE });

    expect(filaDelTaller(replica)).toEqual({
      fila: {
        ...DE_LA_FILA_DE_SIEMPRE,
        pasos: [
          { ...PASO_DE_SIEMPRE, tesoro: HOGAR, clase: 'sueldo', tope: 180_000_000 },
          {
            ...PASO_DE_SIEMPRE,
            tesoro: MAUN,
            clase: 'fijos',
            tope: 25_000_000,
            renglones: [{ nombre: 'Costos fijos', monto: 25_000_000, dia: null }],
          },
        ],
        sueldoPorTrabajo: false,
      },
      version: 3,
      guardada: false,
      guardadaEn: null,
    });
  });

  it('con fila guardada es esa, con su revisión y su fecha', () => {
    const fila = {
      obligaciones: [
        { tesoro: BRUTOS, porcentaje: 350, base: 'cobrado' },
        { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' },
      ],
      pasos: [
        {
          tesoro: FIJOS,
          clase: 'fijos',
          tope: 50_000_000,
          renglones: [{ nombre: 'Alquiler', monto: 50_000_000, dia: 10 }],
          desde: '2026-09',
          modo: 'saldo',
          hastaLaMeta: false,
        },
      ],
      reparto: [{ tesoro: COCOS, porcentaje: 5000, hastaLaMeta: true }],
      superavit: SUPERAVIT,
      sueldoPorTrabajo: false,
    } as unknown as Fila;
    const replica = replicaCon({
      ajustes: [{ ...AJUSTES, fila, fila_version: 4, fila_guardada_at: '2026-09-20T10:00:00Z' }],
      tesoros: LOS_DE_SIEMPRE,
    });

    expect(filaDelTaller(replica)).toEqual({
      fila,
      version: 4,
      guardada: true,
      guardadaEn: '2026-09-20T10:00:00Z',
    });
  });

  it('una fila guardada con la forma de antes se lee completa con lo de siempre', () => {
    const replica = replicaCon({
      ajustes: [
        {
          ...AJUSTES,
          fila: {
            pasos: [{ tesoro: HOGAR, clase: 'sueldo', tope: 1, renglones: [], desde: '2026-09' }],
            reparto: [{ tesoro: COCOS, porcentaje: 5000 }],
            sueldoPorTrabajo: false,
          },
        },
      ],
      tesoros: LOS_DE_SIEMPRE,
    });

    expect(filaDelTaller(replica)).toMatchObject({
      fila: {
        ...DE_LA_FILA_DE_SIEMPRE,
        pasos: [{ ...PASO_DE_SIEMPRE, tesoro: HOGAR, clase: 'sueldo', tope: 1, desde: '2026-09' }],
        reparto: [{ tesoro: COCOS, porcentaje: 5000, hastaLaMeta: false }],
        sueldoPorTrabajo: false,
      },
      guardada: true,
    });
  });

  it('una réplica sin ajustes ni columnas nuevas arma la fila vacía en la revisión 0', () => {
    const { fila: _fila, fila_version: _version, fila_guardada_at: _en, ...vieja } = AJUSTES;
    expect(filaDelTaller(replicaCon({ ajustes: [vieja] })).version).toBe(0);
    expect(filaDelTaller(replicaVacia('u'))).toEqual({
      fila: {
        obligaciones: [{ tesoro: 'diezmo', porcentaje: 1000, base: 'ingreso' }],
        pasos: [],
        reparto: [],
        superavit: 'maun',
        sueldoPorTrabajo: false,
      },
      version: 0,
      guardada: false,
      guardadaEn: null,
    });
  });
});

describe('con qué fila se cobra un proyecto', () => {
  const replica = replicaCon({ ajustes: [AJUSTES], tesoros: LOS_DE_SIEMPRE });
  const fila = {
    ...DE_LA_FILA_DE_SIEMPRE,
    pasos: [{ ...PASO_DE_SIEMPRE, tesoro: HOGAR, clase: 'sueldo', tope: 7 }],
    sueldoPorTrabajo: false,
  };

  it('un reabierto que se cobró por la fila, con la suya', () => {
    const reabierto = liquidado('p1', {
      estado: 'entregado',
      reapertura_fila: { version: 2, fila },
    });

    expect(filaParaLiquidar(replica, reabierto, 'cobrado')).toEqual({ fila, version: 2 });
    expect(reaperturaDeLaFila(replica, reabierto)).toEqual({ fila, version: 2 });
  });

  it('la foto de un reabierto con la forma de antes se lee completa', () => {
    const { obligaciones: _o, superavit: _s, ...deAntes } = fila;
    const reabierto = liquidado('p1', {
      estado: 'entregado',
      reapertura_fila: {
        version: 2,
        fila: {
          ...deAntes,
          pasos: [{ tesoro: HOGAR, clase: 'sueldo', tope: 7, renglones: [], desde: null }],
        },
      },
    });

    expect(reaperturaDeLaFila(replica, reabierto)).toEqual({ fila, version: 2 });
  });

  const FOTO_POR_TRABAJO = {
    estado: 'entregado',
    reapertura_fecha_cobro: '2026-09-01',
    reapertura_objetivo_sueldo_centavos: 100,
    reapertura_objetivo_fijos_centavos: 0,
    reapertura_sueldo_mensual: false,
  };
  const DE_SIEMPRE_CON_LA_FOTO = {
    ...DE_LA_FILA_DE_SIEMPRE,
    pasos: [{ ...PASO_DE_SIEMPRE, tesoro: HOGAR, clase: 'sueldo', tope: 100 }],
  };
  const porTrabajo = replicaCon({
    ajustes: [{ ...AJUSTES, sueldo_tope_mensual: false }],
    tesoros: LOS_DE_SIEMPRE,
  });

  it('un reabierto de antes que se cobró por trabajo, con el taller por mes, vuelve con la de siempre de su foto y el sueldo por mes, en la revisión 0', () => {
    const reabierto = liquidado('p1', FOTO_POR_TRABAJO);

    expect(filaParaLiquidar(replica, reabierto, 'cobrado')).toEqual({
      fila: { ...DE_SIEMPRE_CON_LA_FOTO, sueldoPorTrabajo: false },
      version: 0,
    });
    expect(reaperturaDeLaFila(replica, reabierto)).toBeNull();
  });

  it('con el taller por trabajo, como el seed, el reabierto sigue por trabajo', () => {
    expect(filaParaLiquidar(porTrabajo, liquidado('p1', FOTO_POR_TRABAJO), 'cobrado')).toEqual({
      fila: { ...DE_SIEMPRE_CON_LA_FOTO, sueldoPorTrabajo: true },
      version: 0,
    });
  });

  it('con la fila guardada el taller va por mes, aunque sueldo_tope_mensual esté apagado', () => {
    const conFila = replicaCon({
      ajustes: [{ ...AJUSTES, sueldo_tope_mensual: false, fila, fila_version: 5 }],
      tesoros: LOS_DE_SIEMPRE,
    });

    expect(filaParaLiquidar(conFila, liquidado('p1', FOTO_POR_TRABAJO), 'cobrado')).toEqual({
      fila: { ...DE_SIEMPRE_CON_LA_FOTO, sueldoPorTrabajo: false },
      version: 0,
    });
  });

  it('una foto por la fila que trajo el sueldo por trabajo vuelve por mes, con su revisión; en un taller por trabajo, igual que antes', () => {
    const reabierto = liquidado('p1', {
      estado: 'entregado',
      reapertura_fila: { version: 0, fila: { ...fila, sueldoPorTrabajo: true } },
    });

    expect(filaParaLiquidar(replica, reabierto, 'cobrado')).toEqual({
      fila: { ...fila, sueldoPorTrabajo: false },
      version: 0,
    });
    expect(filaParaLiquidar(porTrabajo, reabierto, 'cobrado')).toEqual({
      fila: { ...fila, sueldoPorTrabajo: true },
      version: 0,
    });
  });

  it('un perdido, siempre con la de los ajustes; y una foto que no se lee tampoco cuenta', () => {
    const reabierto = liquidado('p1', {
      estado: 'en_curso',
      reapertura_fila: { version: 2, fila },
    });
    expect(filaParaLiquidar(replica, reabierto, 'perdido')).toEqual({
      fila: filaDelTaller(replica).fila,
      version: 3,
    });
    const rota = liquidado('p1', { estado: 'entregado', reapertura_fila: { version: 'x', fila } });
    expect(filaParaLiquidar(replica, rota, 'cobrado').version).toBe(3);
    const sinObjeto = liquidado('p1', { estado: 'entregado', reapertura_fila: 'x' });
    expect(filaParaLiquidar(replica, sinObjeto, 'cobrado').version).toBe(3);
    const lista = liquidado('p1', { estado: 'entregado', reapertura_fila: [fila] });
    expect(reaperturaDeLaFila(replica, lista)).toBeNull();
  });

  it('la fila con la que se cobró sale de dist_fila, y un cobro de antes no tiene', () => {
    const porLaFilaNueva = liquidado('p1', { dist_fila_version: 4, dist_fila: fila });
    expect(filaDelCobro(replica, porLaFilaNueva)).toEqual(fila);
    expect(filaDelCobro(replica, liquidado('p2', {}))).toBeNull();
    expect(filaDelCobro(replica, liquidado('p3', { dist_fila: null }))).toBeNull();
  });
});

describe('lo del mes que sale de la réplica', () => {
  const replica = replicaCon({
    ajustes: [AJUSTES],
    tesoros: [...LOS_DE_SIEMPRE, tesoro(FIJOS, null, 'Gastos fijos')],
    proyectos: [
      liquidado('antes', {
        dist_sueldo_centavos: 80_000_000,
        dist_fijos_centavos: 10_000_000,
        dist_remanente_centavos: 0,
      }),
      liquidado('fila', { dist_fila_version: 4, dist_fila: {}, dist_previo: {} }),
      liquidado('sin-nada', { dist_fila_version: 1, dist_fila: {}, dist_previo: {} }),
      liquidado('abierto', { estado: 'entregado', fecha_cobro: null }),
      liquidado('sin-fecha', { fecha_cobro: null }),
    ],
    repartos: [
      reparto('r1', 'fila', HOGAR, 50_000_000, { clase: 'sueldo' }),
      reparto('r2', 'fila', FIJOS, 20_000_000, { posicion: 2 }),
    ],
    movimientos: [
      {
        id: 'm1',
        fecha: '2026-09-28',
        tipo: 'transferencia',
        tesoro_origen: 'maun',
        tesoro_destino: null,
        desde_id: MAUN,
        hacia_id: FIJOS,
        cubre_el_mes: '2026-09-01',
        monto_centavos: 3_000_000,
        version: 1,
        deleted_at: null,
      },
      {
        id: 'm2',
        fecha: '2026-09-28',
        tipo: 'transferencia',
        tesoro_origen: 'cocos',
        tesoro_destino: 'maun',
        monto_centavos: 1,
        version: 1,
        deleted_at: null,
      },
    ],
  });

  it('una liquidación de antes aporta el sueldo a Hogar y los fijos a Maun', () => {
    expect(liquidacionesDelMesDeLaReplica(replica, 'fila')).toEqual([
      {
        fecha: '2026-09-10',
        neta: 100_000_000,
        diezmo: 10_000_000,
        aportes: [
          { tesoro: HOGAR, monto: 80_000_000 },
          { tesoro: MAUN, monto: 10_000_000 },
        ],
        remanente: 0,
      },
      {
        fecha: '2026-09-10',
        neta: 100_000_000,
        diezmo: 10_000_000,
        aportes: [],
        remanente: 90_000_000,
      },
    ]);
  });

  it('una por la fila aporta sus repartos, y lo que queda en Maun es lo que no se repartió', () => {
    const [deLaFila] = liquidacionesDelMesDeLaReplica(replica, 'antes');
    expect(deLaFila).toEqual({
      fecha: '2026-09-10',
      neta: 100_000_000,
      diezmo: 10_000_000,
      aportes: [
        { tesoro: HOGAR, monto: 50_000_000 },
        { tesoro: FIJOS, monto: 20_000_000 },
      ],
      remanente: 20_000_000,
    });
  });

  it('las otras obligaciones y el superávit aparte también son aportes, y no quedan en Maun', () => {
    const conTipos = replicaCon({
      tesoros: [...LOS_DE_SIEMPRE, tesoro(BRUTOS, null, 'Ingresos Brutos')],
      proyectos: [liquidado('fila', { dist_fila_version: 4, dist_fila: {}, dist_previo: {} })],
      repartos: [
        reparto('r1', 'fila', BRUTOS, 3_500_000, { tipo: 'obligacion', clase: null }),
        reparto('r2', 'fila', FIJOS, 20_000_000, { posicion: 2 }),
        reparto('r3', 'fila', SUPERAVIT, 66_500_000, {
          posicion: 3,
          tipo: 'superavit',
          clase: null,
        }),
      ],
    });
    expect(liquidacionesDelMesDeLaReplica(conTipos)).toEqual([
      {
        fecha: '2026-09-10',
        neta: 100_000_000,
        diezmo: 10_000_000,
        aportes: [
          { tesoro: BRUTOS, monto: 3_500_000 },
          { tesoro: FIJOS, monto: 20_000_000 },
          { tesoro: SUPERAVIT, monto: 66_500_000 },
        ],
        remanente: 0,
      },
    ]);
  });

  it('las coberturas cuentan para su mes, y lo demás no es cobertura', () => {
    expect(coberturasDeLaReplica(replica)).toEqual([
      { tesoro: FIJOS, mes: '2026-09', monto: 3_000_000 },
    ]);
  });

  it('los repartos de un proyecto van en su orden', () => {
    expect(repartosDelProyecto(replica, 'fila').map((uno) => uno.id)).toEqual(['r1', 'r2']);
  });
});

describe('los repartos leídos con las columnas nuevas o sin ellas', () => {
  it('un paso sin modo es por mes, y el modo de otra cosa no existe', () => {
    expect(modoDelReparto(reparto('r1', 'p', FIJOS, 1))).toBe('mes');
    expect(modoDelReparto(reparto('r1', 'p', FIJOS, 1, { modo: null }))).toBe('mes');
    expect(modoDelReparto(reparto('r1', 'p', FIJOS, 1, { modo: 'saldo' }))).toBe('saldo');
    expect(modoDelReparto(reparto('r1', 'p', FIJOS, 1, { modo: 'trabajo' }))).toBe('trabajo');
    expect(modoDelReparto(reparto('r1', 'p', FIJOS, 1, { modo: 'otro' }))).toBe('mes');
    expect(modoDelReparto(reparto('r1', 'p', COCOS, 1, { tipo: 'parte', clase: null }))).toBeNull();
  });

  it('la base es solo de una obligación, y sin la columna no se sabe', () => {
    const obligacion = { tipo: 'obligacion', clase: null };
    expect(baseDelReparto(reparto('r', 'p', BRUTOS, 1, { ...obligacion, base: 'cobrado' }))).toBe(
      'cobrado',
    );
    expect(baseDelReparto(reparto('r', 'p', BRUTOS, 1, { ...obligacion, base: 'ingreso' }))).toBe(
      'ingreso',
    );
    expect(baseDelReparto(reparto('r', 'p', BRUTOS, 1, obligacion))).toBeNull();
    expect(baseDelReparto(reparto('r', 'p', FIJOS, 1, { base: 'cobrado' }))).toBeNull();
  });
});

describe('los saldos por id', () => {
  it('cuentan los movimientos entre tesoros del dueño y los repartos, y toleran filas sin ids', () => {
    const replica = replicaCon({
      tesoros: [
        ...LOS_DE_SIEMPRE,
        tesoro(FIJOS, null, 'Gastos fijos'),
        tesoro(MATERIALES, null, 'M'),
      ],
      proyectos: [liquidado('fila', { dist_fila_version: 4, dist_fila: {}, dist_previo: {} })],
      repartos: [reparto('r1', 'fila', FIJOS, 20_000_000)],
      movimientos: [
        {
          id: 'm1',
          fecha: '2026-09-28',
          tipo: 'transferencia',
          tesoro_origen: null,
          tesoro_destino: null,
          desde_id: FIJOS,
          hacia_id: MATERIALES,
          cubre_el_mes: null,
          monto_centavos: 5_000_000,
          version: 1,
          deleted_at: null,
        },
        {
          id: 'm2',
          fecha: '2026-09-28',
          tipo: 'ingreso',
          tesoro_origen: null,
          tesoro_destino: 'cocos',
          monto_centavos: 700,
          version: 1,
          deleted_at: null,
        },
      ],
    });

    const saldos = saldosPorIdDeLaReplica(replica);
    expect(saldos.get(FIJOS)).toBe(15_000_000);
    expect(saldos.get(MATERIALES)).toBe(5_000_000);
    expect(saldos.get(COCOS)).toBe(700);
    expect(saldos.get(DIEZMO)).toBe(10_000_000);
    expect(saldos.get(MAUN)).toBe(-10_000_000 - 20_000_000);
    expect(porLaFila(liquidado('x', {}))).toBe(false);
  });
});

describe('los gastos desde un tesoro', () => {
  it('son los movimientos de gasto con el tesoro de donde salen, también los de antes de los ids', () => {
    const replica = replicaCon({
      tesoros: [...LOS_DE_SIEMPRE, tesoro(FIJOS, null, 'Gastos fijos')],
      movimientos: [
        movimiento('m1', { desde_id: FIJOS, categoria: 'Alquiler', fecha: '2026-09-08' }),
        movimiento('m2', { tesoro_origen: 'maun', categoria: 'Luz', fecha: '2026-09-09' }),
        movimiento('m3', { tipo: 'transferencia', desde_id: FIJOS, hacia_id: MAUN }),
        movimiento('m4', { tipo: 'ingreso', hacia_id: MAUN }),
      ],
    });

    expect(gastosDeLosTesorosDeLaReplica(replica)).toEqual([
      { tesoro: FIJOS, categoria: 'Alquiler', fecha: '2026-09-08' },
      { tesoro: MAUN, categoria: 'Luz', fecha: '2026-09-09' },
    ]);
  });
});

describe('la fila del mes con lo que sale de la réplica', () => {
  const fila = {
    obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
    pasos: [
      {
        tesoro: FIJOS,
        clase: 'fijos',
        tope: 90_000_000,
        renglones: [
          { nombre: 'Alquiler', monto: 50_000_000, dia: 10 },
          { nombre: 'Luz', monto: 40_000_000, dia: null },
        ],
        desde: '2026-09',
        modo: 'saldo',
        hastaLaMeta: false,
      },
    ],
    reparto: [{ tesoro: MATERIALES, porcentaje: 2000, hastaLaMeta: true }],
    superavit: MAUN,
    sueldoPorTrabajo: false,
  } as unknown as Fila;

  it('lleva los saldos, las metas y los gastos: lo que hay a pagar, lo pagado y lo que falta para la meta', () => {
    const replica = replicaCon({
      ajustes: [{ ...AJUSTES, fila, fila_version: 5, fila_guardada_at: '2026-09-02T12:00:00Z' }],
      tesoros: [
        ...LOS_DE_SIEMPRE,
        tesoro(FIJOS, null, 'Gastos fijos'),
        tesoro(MATERIALES, null, 'Materiales', { meta_centavos: 30_000_000 }),
      ],
      proyectos: [liquidado('fila', { dist_fila_version: 5, dist_fila: fila, dist_previo: {} })],
      repartos: [
        reparto('r1', 'fila', FIJOS, 63_000_000, { clase: 'fijos', modo: 'saldo' }),
        reparto('r2', 'fila', MATERIALES, 5_400_000, {
          posicion: 2,
          tipo: 'parte',
          clase: null,
          porcentaje_bp: 2000,
        }),
      ],
      movimientos: [
        movimiento('m1', {
          desde_id: FIJOS,
          categoria: 'Alquiler',
          fecha: '2026-09-10',
          monto_centavos: 50_000_000,
        }),
      ],
    });

    const sistema = sistemaDeLaReplica(replica);
    const delMes = filaDelMes(
      filaDelTaller(replica).fila,
      sistema,
      datosDelMesDeLaReplica(replica),
      '2026-09',
    );

    expect(delMes.pasos[0]).toMatchObject({
      tesoro: FIJOS,
      lleva: 13_000_000,
      falta: 77_000_000,
      aPagar: 13_000_000,
      vencimientos: [{ renglon: 'Alquiler', fecha: '2026-09-10', pagado: true }],
    });
    expect(delMes.reparto[0]).toMatchObject({
      recibido: 5_400_000,
      meta: { meta: 30_000_000, saldo: 5_400_000, falta: 24_600_000, hastaLaMeta: true },
    });
  });
});

describe('los insumos de los trabajos', () => {
  const replica = replicaCon({
    proyectos: [
      trabajo('curso', 'en_curso'),
      trabajo('pasado', 'entregado'),
      trabajo('consulta', 'contacto'),
      trabajo('cobrado', 'cobrado'),
      trabajo('perdido', 'perdido'),
    ],
    pagos: [
      pago('s1', 'curso', 90_000_000),
      pago('s2', 'curso', 10_000_000, { ya_en_la_apertura: true }),
      pago('s3', 'pasado', 5_000_000),
      pago('s4', 'cobrado', 70_000_000),
    ],
    gastos: [
      gasto('g1', 'curso', 40_000_000),
      gasto('g2', 'pasado', 8_000_000),
      gasto('g3', 'perdido', 1_000_000),
    ],
  });

  it('cada trabajo vivo sin cobrar ni perder tiene lo que entró, lo gastado y lo que queda', () => {
    expect(insumosPorTrabajo(replica)).toEqual(
      new Map([
        ['consulta', { proyectoId: 'consulta', entro: 0, gastado: 0, queda: 0 }],
        [
          'curso',
          { proyectoId: 'curso', entro: 100_000_000, gastado: 40_000_000, queda: 60_000_000 },
        ],
        [
          'pasado',
          { proyectoId: 'pasado', entro: 5_000_000, gastado: 8_000_000, queda: -3_000_000 },
        ],
      ]),
    );
    expect(insumosDelTrabajo(replica, 'curso')?.queda).toBe(60_000_000);
    expect(insumosDelTrabajo(replica, 'cobrado')).toBeNull();
    expect(insumosDelTrabajo(replica, 'no-existe')).toBeNull();
  });

  it('en el taller suman los trabajos con plata, también lo que el taller puso', () => {
    const { total, trabajos } = insumosDelTaller(replica);
    expect(trabajos.map((uno) => uno.proyectoId)).toEqual(['curso', 'pasado']);
    expect(total).toBe(57_000_000);
    expect(insumosDelTaller(replicaVacia('u'))).toEqual({ total: 0, trabajos: [] });
  });
});

describe('lo que se liquida sale de la réplica', () => {
  const PROYECTO = trabajo('p', 'entregado');
  const fila = {
    obligaciones: [
      { tesoro: BRUTOS, porcentaje: 350, base: 'cobrado' },
      { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' },
    ],
    pasos: [
      {
        tesoro: FIJOS,
        clase: 'fijos',
        tope: 90_000_000,
        renglones: [{ nombre: 'Alquiler', monto: 90_000_000, dia: 10 }],
        desde: '2026-09',
        modo: 'saldo',
        hastaLaMeta: false,
      },
    ],
    reparto: [{ tesoro: MATERIALES, porcentaje: 2000, hastaLaMeta: true }],
    superavit: SUPERAVIT,
    sueldoPorTrabajo: false,
  } as unknown as Fila;

  const replica = replicaCon({
    ajustes: [{ ...AJUSTES, fila, fila_version: 7 }],
    tesoros: [
      ...LOS_DE_SIEMPRE,
      tesoro(BRUTOS, null, 'Ingresos Brutos'),
      tesoro(FIJOS, null, 'Gastos fijos'),
      tesoro(MATERIALES, null, 'Materiales', { meta_centavos: 30_000_000 }),
      tesoro(SUPERAVIT, null, 'Superávit'),
    ],
    proyectos: [PROYECTO],
    pagos: [pago('s1', 'p', 100_000_000), pago('s2', 'p', 150_000_000)],
    gastos: [gasto('g1', 'p', 50_000_000)],
    movimientos: [
      movimiento('m1', {
        tipo: 'transferencia',
        desde_id: MAUN,
        hacia_id: FIJOS,
        monto_centavos: 63_000_000,
      }),
      movimiento('m2', {
        tipo: 'transferencia',
        desde_id: MAUN,
        hacia_id: MATERIALES,
        monto_centavos: 25_000_000,
      }),
    ],
  });
  it('con la fila, el sistema, lo del mes, los saldos y las metas, y la cuenta da los vectores fijos', () => {
    const { entrada, version } = entradaDeLaLiquidacion(replica, PROYECTO, {
      destino: 'cobrado',
      fecha: '2026-09-28',
    });

    expect(version).toBe(7);
    expect(entrada).toMatchObject({
      cobrado: 250_000_000,
      gastos: 50_000_000,
      fila,
      sistema: { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO },
      ajustes: { perdidoConSueldo: false, perdidoConDiezmo: true },
      liquidaciones: [],
      coberturas: [],
    });
    expect(entrada.saldos.get(FIJOS)).toBe(63_000_000);
    expect(entrada.metas).toEqual(
      new Map([
        [COCOS, 1_000_000_000],
        [MATERIALES, 30_000_000],
      ]),
    );

    const liquidacion = calcularPorLaFila(entrada);
    expect(liquidacion.obligaciones.map((una) => una.monto)).toEqual([8_750_000, 19_125_000]);
    expect(liquidacion.libre).toBe(172_125_000);
    expect(liquidacion.pasos[0]).toMatchObject({ previo: 63_000_000, monto: 27_000_000 });
    expect(liquidacion.reparto[0]).toMatchObject({ tope: 5_000_000, monto: 5_000_000 });
    expect(liquidacion.remanente).toBe(140_125_000);

    expect(pedidoDeLaFila(liquidacion, version, ['r1', 'r2', 'r3', 'r4'])).toEqual({
      version: 7,
      repartos: [
        { id: 'r1', posicion: 1, tesoro_id: BRUTOS, monto_centavos: 8_750_000 },
        { id: 'r2', posicion: 2, tesoro_id: FIJOS, monto_centavos: 27_000_000 },
        { id: 'r3', posicion: 3, tesoro_id: MATERIALES, monto_centavos: 5_000_000 },
        { id: 'r4', posicion: 4, tesoro_id: SUPERAVIT, monto_centavos: 140_125_000 },
      ],
      previo: { [FIJOS]: 63_000_000, [MATERIALES]: 5_000_000 },
    });
  });

  it('lo cobrado y los gastos se pueden pasar, como con el pago del saldo al cobrar', () => {
    const { entrada } = entradaDeLaLiquidacion(replica, PROYECTO, {
      destino: 'perdido',
      fecha: '2026-09-28',
      cobrado: centavos(1),
      gastos: centavos(2),
    });
    expect(entrada).toMatchObject({ destino: 'perdido', cobrado: 1, gastos: 2 });
  });
});

describe('volver a cobrar el cobro del 25/9 de MAUN, que se había congelado por trabajo', () => {
  const SUELDO_DE_SIEMPRE = {
    tesoro: HOGAR,
    clase: 'sueldo',
    tope: 180_000_000,
    renglones: [],
    desde: null,
    modo: 'mes',
    hastaLaMeta: false,
  };
  const CONGELADA = {
    obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
    pasos: [SUELDO_DE_SIEMPRE],
    reparto: [],
    superavit: MAUN,
    sueldoPorTrabajo: true,
  };
  const DE_HOY = {
    ...CONGELADA,
    reparto: [{ tesoro: COCOS, porcentaje: 3000, hastaLaMeta: false }],
    sueldoPorTrabajo: false,
  };
  const SEPTIEMBRE = [
    liquidado('estanteria', {
      fecha_cobro: '2026-09-08',
      dist_sueldo_centavos: 14_220_000,
      dist_sueldo_mensual: false,
    }),
    liquidado('escritorio', {
      fecha_cobro: '2026-09-09',
      dist_sueldo_centavos: 95_160_420,
      dist_sueldo_mensual: false,
    }),
  ];

  it.each([
    [
      'con la foto de antes, como en la captura',
      {
        reapertura_fecha_cobro: '2026-09-25',
        reapertura_objetivo_sueldo_centavos: 180_000_000,
        reapertura_objetivo_fijos_centavos: 0,
        reapertura_sueldo_mensual: false,
      },
    ],
    [
      'con la foto por la fila, como queda al reabrirlo hoy',
      {
        reapertura_fecha_cobro: '2026-09-25',
        reapertura_objetivo_sueldo_centavos: 0,
        reapertura_objetivo_fijos_centavos: 0,
        reapertura_sueldo_mensual: true,
        reapertura_fila: { version: 0, fila: CONGELADA },
      },
    ],
  ])(
    '%s: el Salario recibe lo que le falta a septiembre, el resto queda en Maun y no entran las partes de la fila de hoy',
    (_caso, foto) => {
      const reabierto = { ...trabajo('vp', 'entregado'), ...foto } as FilaDe<'proyectos'>;
      const replica = replicaCon({
        ajustes: [{ ...AJUSTES, costos_fijos_centavos: 0, fila: DE_HOY, fila_version: 4 }],
        tesoros: LOS_DE_SIEMPRE,
        proyectos: [...SEPTIEMBRE, reabierto],
        pagos: [pago('pv', 'vp', 261_600_000)],
        gastos: [gasto('gv', 'vp', 114_015_047)],
      });

      const { entrada, version } = entradaDeLaLiquidacion(replica, reabierto, {
        destino: 'cobrado',
        fecha: '2026-09-25',
      });
      const liquidacion = calcularPorLaFila(entrada);

      expect(version).toBe(0);
      expect(entrada.fila).toMatchObject({ reparto: [], sueldoPorTrabajo: false });
      expect(liquidacion).toMatchObject({ neta: 147_584_953, diezmo: 14_758_495, reparto: [] });
      expect(liquidacion.pasos).toMatchObject([
        {
          tesoro: HOGAR,
          porMes: true,
          previo: 109_380_420,
          tope: 70_619_580,
          monto: 70_619_580,
          falta: 0,
        },
      ]);
      expect(liquidacion.remanente).toBe(62_206_878);
      expect(pedidoDeLaFila(liquidacion, version, ['r1'])).toEqual({
        version: 0,
        repartos: [{ id: 'r1', posicion: 1, tesoro_id: HOGAR, monto_centavos: 70_619_580 }],
        previo: { [HOGAR]: 109_380_420 },
      });
    },
  );
});
