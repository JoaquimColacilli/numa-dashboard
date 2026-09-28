import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  replicaVacia,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from './replica.ts';
import {
  analisisDeLaReplica,
  coberturasDeLaReplica,
  datosDelAnalisis,
  filaDelTaller,
  filaParaLiquidar,
  idDeLaClave,
  liquidacionesDelMesDeLaReplica,
  porLaFila,
  repartosDelProyecto,
  saldosPorIdDeLaReplica,
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
  });
});

describe('la fila del taller', () => {
  it('sin fila guardada es la de siempre, armada con el sueldo y los costos fijos', () => {
    const replica = replicaCon({ ajustes: [AJUSTES], tesoros: LOS_DE_SIEMPRE });

    expect(filaDelTaller(replica)).toEqual({
      fila: {
        pasos: [
          { tesoro: HOGAR, clase: 'sueldo', tope: 180_000_000, renglones: [], desde: null },
          {
            tesoro: MAUN,
            clase: 'fijos',
            tope: 25_000_000,
            renglones: [{ nombre: 'Costos fijos', monto: 25_000_000 }],
            desde: null,
          },
        ],
        reparto: [],
        sueldoPorTrabajo: false,
      },
      version: 3,
      guardada: false,
      guardadaEn: null,
    });
  });

  it('con fila guardada es esa, con su revisión y su fecha', () => {
    const fila = {
      pasos: [{ tesoro: HOGAR, clase: 'sueldo', tope: 1, renglones: [], desde: '2026-09' }],
      reparto: [{ tesoro: COCOS, porcentaje: 5000 }],
      sueldoPorTrabajo: false,
    };
    const replica = replicaCon({
      ajustes: [{ ...AJUSTES, fila, fila_version: 4, fila_guardada_at: '2026-09-20T10:00:00Z' }],
      tesoros: LOS_DE_SIEMPRE,
    });

    expect(filaDelTaller(replica)).toMatchObject({
      fila,
      version: 4,
      guardada: true,
      guardadaEn: '2026-09-20T10:00:00Z',
    });
  });

  it('una réplica sin ajustes ni columnas nuevas arma la fila vacía en la revisión 0', () => {
    const { fila: _fila, fila_version: _version, fila_guardada_at: _en, ...vieja } = AJUSTES;
    expect(filaDelTaller(replicaCon({ ajustes: [vieja] })).version).toBe(0);
    expect(filaDelTaller(replicaVacia('u'))).toMatchObject({
      fila: { pasos: [], reparto: [], sueldoPorTrabajo: false },
      version: 0,
    });
  });
});

describe('con qué fila se cobra un proyecto', () => {
  const replica = replicaCon({ ajustes: [AJUSTES], tesoros: LOS_DE_SIEMPRE });
  const fila = {
    pasos: [{ tesoro: HOGAR, clase: 'sueldo', tope: 7, renglones: [], desde: null }],
    reparto: [],
    sueldoPorTrabajo: false,
  };

  it('un reabierto que se cobró por la fila, con la suya', () => {
    const reabierto = liquidado('p1', {
      estado: 'entregado',
      reapertura_fila: { version: 2, fila },
    });

    expect(filaParaLiquidar(replica, reabierto, 'cobrado')).toEqual({ fila, version: 2 });
  });

  it('un reabierto de antes, con la de siempre armada con su foto, en la revisión 0', () => {
    const reabierto = liquidado('p1', {
      estado: 'entregado',
      reapertura_fecha_cobro: '2026-09-01',
      reapertura_objetivo_sueldo_centavos: 100,
      reapertura_objetivo_fijos_centavos: 0,
      reapertura_sueldo_mensual: false,
    });

    expect(filaParaLiquidar(replica, reabierto, 'cobrado')).toEqual({
      fila: {
        pasos: [{ tesoro: HOGAR, clase: 'sueldo', tope: 100, renglones: [], desde: null }],
        reparto: [],
        sueldoPorTrabajo: true,
      },
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

  it('las coberturas cuentan para su mes, y lo demás no es cobertura', () => {
    expect(coberturasDeLaReplica(replica)).toEqual([
      { tesoro: FIJOS, mes: '2026-09', monto: 3_000_000 },
    ]);
  });

  it('los repartos de un proyecto van en su orden', () => {
    expect(repartosDelProyecto(replica, 'fila').map((uno) => uno.id)).toEqual(['r1', 'r2']);
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
