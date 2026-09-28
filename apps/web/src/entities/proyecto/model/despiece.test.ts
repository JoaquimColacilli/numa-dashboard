import { centavos, puntosBasicos, type Fila, type Liquidacion } from '@maun/domain';
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
  despieceDelCobro,
  despieceDelProyecto,
  fechaDelCobroPropuesta,
  loQueRecibeCadaTesoro,
  loQueVuelveAlReabrir,
  repartoEnLaAperturaPropuesto,
  type PiezaDelDespiece,
} from './despiece';
import { filaLiquidada, filaRevertida, pedidoDeLiquidacion } from './liquidacion';
import { cobroPorLaFila } from './por-la-fila';

const HOY = '2026-09-23';
const APERTURA = '2026-09-14';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const IIBB = '00000000-0000-7000-8000-000000000011';
const APARTE = '00000000-0000-7000-8000-000000000012';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function replicaVacia(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function replicaCon(pagos: readonly { fecha: string; proyecto_id?: string }[]): Replica {
  let replica = replicaVacia();
  pagos.forEach((pago, indice) => {
    replica = aplicarFilaLocal(replica, 'pagos', {
      id: `pago-${String(indice)}`,
      proyecto_id: 'p',
      deleted_at: null,
      ...pago,
    } as unknown as FilaDe<'pagos'>);
  });
  return replica;
}

function tesoro(
  id: string,
  clave: FilaDe<'tesoros'>['clave'],
  nombre: string,
  tinta: string,
  icono: string,
  orden = 0,
): FilaDe<'tesoros'> {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono,
    meta_centavos: null,
    rinde_anual_bp: null,
    orden,
    archivado_at: null,
  };
}

const TESOROS = [
  tesoro(HOGAR, 'hogar', 'Hogar', 'hogar', 'house'),
  tesoro(MAUN, 'maun', 'Maun', 'maun', 'hammer'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo', 'church'),
  tesoro(COCOS, 'cocos', 'Cocos', 'cocos', 'piggy-bank'),
  tesoro(FIJOS, null, 'Gastos fijos', 'grana', 'receipt', 1),
  tesoro(IIBB, null, 'Ingresos Brutos', 'mostaza', 'landmark', 2),
  tesoro(APARTE, null, 'Superávit', 'petroleo', 'gift', 3),
];

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(300_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(200_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(200_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

const CON_TODO: Fila = {
  ...FILA,
  obligaciones: [
    { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' },
    ...FILA.obligaciones,
  ],
  superavit: APARTE,
};

function taller({
  fila = null,
  conTesoros = true,
}: { fila?: Fila | null; conTesoros?: boolean } = {}): Replica {
  let replica = replicaVacia();
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    sueldo_mensual_centavos: 50_000_000,
    costos_fijos_centavos: 25_000_000,
    sueldo_tope_mensual: true,
    perdido_con_sueldo: false,
    perdido_con_diezmo: true,
    fila: fila as unknown as FilaDe<'ajustes'>['fila'],
    fila_version: fila === null ? 0 : 4,
    fila_guardada_at: null,
  } as unknown as FilaDe<'ajustes'>);
  if (conTesoros) {
    for (const fila of TESOROS) replica = aplicarFilaLocal(replica, 'tesoros', fila);
  }
  return replica;
}

function conPago(replica: Replica, proyectoId: string, monto: number, fecha = HOY): Replica {
  return aplicarFilaLocal(
    aplicarFilaLocal(replica, 'proyectos', proyecto({ id: proyectoId })),
    'pagos',
    {
      ...METADATOS,
      id: `pago-${proyectoId}`,
      proyecto_id: proyectoId,
      fecha,
      concepto: 'Pago',
      monto_centavos: monto,
      ya_en_la_apertura: false,
    },
  );
}

function proyecto(extra: Partial<Proyecto> = {}): Proyecto {
  return {
    ...METADATOS,
    id: 'p',
    estado: 'entregado',
    version: 3,
    fecha_cobro: null,
    reapertura_fecha_cobro: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fila: null,
    reparto_ya_en_la_apertura: false,
    dist_cobrado_centavos: null,
    dist_fila_version: null,
    ...extra,
  } as Proyecto;
}

function reparto(
  id: string,
  posicion: number,
  extra: Partial<FilaDe<'repartos'>>,
  proyectoId = 'p',
): FilaDe<'repartos'> {
  return {
    ...METADATOS,
    id,
    proyecto_id: proyectoId,
    posicion,
    tesoro_id: HOGAR,
    nombre: 'Hogar',
    tipo: 'paso',
    clase: 'sueldo',
    modo: 'mes',
    base: null,
    objetivo_centavos: 0,
    previo_centavos: 0,
    tope_centavos: 0,
    por_mes: true,
    porcentaje_bp: null,
    monto_centavos: 0,
    fecha: HOY,
    ya_en_la_apertura: false,
    ...extra,
  };
}

function resumen(piezas: readonly PiezaDelDespiece[]) {
  return piezas.map((pieza) => ({
    id: pieza.id,
    etiqueta: pieza.etiqueta,
    nombre: pieza.nombre,
    tinta: pieza.tinta,
    monto: pieza.monto,
  }));
}

const REABIERTO = {
  estado: 'entregado',
  reapertura_fecha_cobro: '2026-07-10',
  reapertura_objetivo_sueldo_centavos: 50_000_000,
  reapertura_objetivo_fijos_centavos: 25_000_000,
  reapertura_sueldo_mensual: true,
} satisfies Partial<Proyecto>;

describe('fechaDelCobroPropuesta', () => {
  it('es el día del último pago del trabajo, no hoy', () => {
    const replica = replicaCon([
      { fecha: '2026-07-10' },
      { fecha: '2026-08-20' },
      { fecha: '2026-09-01', proyecto_id: 'otro' },
    ]);
    expect(fechaDelCobroPropuesta(replica, proyecto(), HOY)).toBe('2026-08-20');
  });

  it('con el pago final que se está cargando, sigue a ese día', () => {
    const replica = replicaCon([{ fecha: '2026-07-10' }]);
    expect(fechaDelCobroPropuesta(replica, proyecto(), HOY, '2026-09-05')).toBe('2026-09-05');
    expect(fechaDelCobroPropuesta(replica, proyecto(), HOY, '')).toBe('2026-07-10');
  });

  it('sin pagos, o con un día que todavía no llegó, propone hoy', () => {
    expect(fechaDelCobroPropuesta(replicaCon([]), proyecto(), HOY)).toBe(HOY);
    expect(fechaDelCobroPropuesta(replicaCon([]), proyecto(), HOY, '2026-09-30')).toBe(HOY);
  });

  it('un cobro reabierto trae el día del cobro original', () => {
    const replica = replicaCon([{ fecha: '2026-09-20' }]);
    expect(fechaDelCobroPropuesta(replica, proyecto(REABIERTO), HOY)).toBe('2026-07-10');
  });
});

describe('repartoEnLaAperturaPropuesto', () => {
  it('lo de antes de la apertura arranca tildado, lo de después ni se pregunta', () => {
    expect(repartoEnLaAperturaPropuesto(proyecto(), '2026-07-10', APERTURA)).toBe(true);
    expect(repartoEnLaAperturaPropuesto(proyecto(), APERTURA, APERTURA)).toBe(false);
    expect(repartoEnLaAperturaPropuesto(proyecto(), '2026-07-10', null)).toBe(false);
  });

  it('un cobro reabierto conserva lo que tenía', () => {
    expect(repartoEnLaAperturaPropuesto(proyecto(REABIERTO), '2026-07-10', APERTURA)).toBe(false);
    expect(
      repartoEnLaAperturaPropuesto(
        proyecto({ ...REABIERTO, reparto_ya_en_la_apertura: true }),
        '2026-07-10',
        APERTURA,
      ),
    ).toBe(true);
  });
});

describe('el despiece proyectado por la fila', () => {
  it('sin fila guardada baja por la de siempre: diezmo, sueldo a Hogar, gastos fijos y el resto en Maun', () => {
    const replica = conPago(taller(), 'p', 70_000_000);
    const despiece = despieceDelProyecto(replica, proyecto(), HOY);

    expect(despiece.modo).toBe('proyeccion');
    expect(despiece.neta).toBe(70_000_000);
    expect(resumen(despiece.piezas)).toEqual([
      {
        id: 'diezmo',
        etiqueta: 'Diezmo 10% sobre el ingreso',
        nombre: 'Diezmo',
        tinta: 'diezmo',
        monto: 7_000_000,
      },
      {
        id: `paso-${HOGAR}`,
        etiqueta: 'Sueldo',
        nombre: 'Hogar',
        tinta: 'hogar',
        monto: 50_000_000,
      },
      {
        id: `paso-${MAUN}`,
        etiqueta: 'Gastos fijos',
        nombre: 'Maun',
        tinta: 'maun',
        monto: 13_000_000,
      },
      { id: 'resto', etiqueta: 'El resto', nombre: 'Maun', tinta: 'maun', monto: 0 },
    ]);
    const fijos = despiece.piezas.find((pieza) => pieza.id === `paso-${MAUN}`);
    expect(fijos).toMatchObject({ tipo: 'paso', tesoro: MAUN, falta: 12_000_000, cubierto: false });
    expect(despiece.piezas[0]?.parte).toBeCloseTo(0.1);
  });

  it('con una fila guardada, una pieza por paso y por parte, cada una con su tesoro', () => {
    const replica = conPago(taller({ fila: FILA }), 'p', 1_000_000);
    const despiece = despieceDelProyecto(replica, proyecto(), HOY);

    expect(resumen(despiece.piezas)).toEqual([
      {
        id: 'diezmo',
        etiqueta: 'Diezmo 10% sobre el ingreso',
        nombre: 'Diezmo',
        tinta: 'diezmo',
        monto: 100_000,
      },
      { id: `paso-${HOGAR}`, etiqueta: 'Sueldo', nombre: 'Hogar', tinta: 'hogar', monto: 300_000 },
      {
        id: `paso-${FIJOS}`,
        etiqueta: 'Gastos fijos',
        nombre: 'Gastos fijos',
        tinta: 'grana',
        monto: 200_000,
      },
      {
        id: `parte-${COCOS}`,
        etiqueta: '50% de lo que sobra',
        nombre: 'Cocos',
        tinta: 'cocos',
        monto: 200_000,
      },
      { id: 'resto', etiqueta: 'El resto', nombre: 'Maun', tinta: 'maun', monto: 200_000 },
    ]);
    expect(despiece.piezas.find((pieza) => pieza.id === `paso-${FIJOS}`)?.icono).toBe('receipt');
    expect(despiece.piezas.map((pieza) => pieza.tipo)).toEqual([
      'diezmo',
      'paso',
      'paso',
      'parte',
      'resto',
    ]);
  });

  it('un compromiso que se renueva y ya tiene su monto, y un ahorro que llega a su meta, lo dicen', () => {
    const MAQUINARIA = '00000000-0000-7000-8000-000000000013';
    const fila: Fila = {
      ...FILA,
      pasos: FILA.pasos.map((paso) =>
        paso.tesoro === FIJOS ? { ...paso, modo: 'saldo' as const } : paso,
      ),
      reparto: [{ tesoro: MAQUINARIA, porcentaje: puntosBasicos(5000), hastaLaMeta: true }],
    };
    let replica = aplicarFilaLocal(taller({ fila }), 'tesoros', {
      ...tesoro(MAQUINARIA, null, 'Maquinaria', 'ciruela', 'wrench', 4),
      meta_centavos: 150_000,
    });
    for (const [id, hacia, monto] of [
      ['m1', FIJOS, 200_000],
      ['m2', MAQUINARIA, 100_000],
    ] as const) {
      replica = aplicarFilaLocal(replica, 'movimientos', {
        ...METADATOS,
        id,
        fecha: '2026-09-02',
        tipo: 'ingreso',
        tesoro_origen: null,
        tesoro_destino: null,
        desde_id: null,
        hacia_id: hacia,
        cubre_el_mes: null,
        monto_centavos: monto,
        categoria: 'Otro',
        descripcion: '',
        proyecto_id: null,
      } as unknown as FilaDe<'movimientos'>);
    }
    const despiece = despieceDelProyecto(conPago(replica, 'p', 1_000_000), proyecto(), HOY);

    expect(despiece.piezas.find((pieza) => pieza.id === `paso-${FIJOS}`)).toMatchObject({
      monto: 0,
      conSuSaldo: true,
      cubierto: false,
      llegaALaMeta: false,
    });
    expect(despiece.piezas.find((pieza) => pieza.id === `parte-${MAQUINARIA}`)).toMatchObject({
      monto: 50_000,
      llegaALaMeta: true,
      cubierto: false,
    });
  });

  it('con otra obligación y el superávit aparte, cada obligación en su lugar y el resto al superávit', () => {
    const replica = conPago(taller({ fila: CON_TODO }), 'p', 1_000_000);
    const despiece = despieceDelProyecto(replica, proyecto(), HOY);

    expect(resumen(despiece.piezas)).toEqual([
      {
        id: `obligacion-${IIBB}`,
        etiqueta: 'Ingresos Brutos 3,5% sobre lo que cobrás',
        nombre: 'Ingresos Brutos',
        tinta: 'mostaza',
        monto: 35_000,
      },
      {
        id: 'diezmo',
        etiqueta: 'Diezmo 10% sobre el ingreso',
        nombre: 'Diezmo',
        tinta: 'diezmo',
        monto: 96_500,
      },
      { id: `paso-${HOGAR}`, etiqueta: 'Sueldo', nombre: 'Hogar', tinta: 'hogar', monto: 300_000 },
      {
        id: `paso-${FIJOS}`,
        etiqueta: 'Gastos fijos',
        nombre: 'Gastos fijos',
        tinta: 'grana',
        monto: 200_000,
      },
      {
        id: `parte-${COCOS}`,
        etiqueta: '50% de lo que sobra',
        nombre: 'Cocos',
        tinta: 'cocos',
        monto: 184_250,
      },
      { id: 'resto', etiqueta: 'El resto', nombre: 'Superávit', tinta: 'petroleo', monto: 184_250 },
    ]);
    expect(despiece.piezas.map((pieza) => [pieza.tipo, pieza.tipoDeTesoro])).toEqual([
      ['obligacion', 'obligacion'],
      ['diezmo', 'obligacion'],
      ['paso', 'compromiso'],
      ['paso', 'compromiso'],
      ['parte', 'ahorro-por-porcentaje'],
      ['resto', 'superavit'],
    ]);
    expect(despiece.piezas.reduce((suma, pieza) => suma + pieza.monto, 0)).toBe(despiece.neta);
  });

  it('un paso que el mes ya llenó queda en cero y lo dice, sin pedir lo que falta', () => {
    let replica = conPago(taller({ fila: FILA }), 'p', 1_000_000);
    replica = aplicarFilaLocal(
      replica,
      'proyectos',
      proyecto({
        id: 'antes',
        estado: 'cobrado',
        fecha_cobro: '2026-09-05',
        dist_cobrado_centavos: 400_000,
        dist_gastos_centavos: 0,
        dist_diezmo_centavos: 40_000,
        dist_remanente_centavos: 360_000,
        dist_fila_version: 4,
      }),
    );
    replica = aplicarFilaLocal(
      replica,
      'repartos',
      reparto(
        'r-antes',
        1,
        {
          objetivo_centavos: 300_000,
          tope_centavos: 300_000,
          monto_centavos: 300_000,
          fecha: '2026-09-05',
        },
        'antes',
      ),
    );

    const { piezas } = despieceDelProyecto(replica, proyecto(), HOY);
    expect(piezas.find((pieza) => pieza.id === `paso-${HOGAR}`)).toMatchObject({
      monto: 0,
      falta: 0,
      cubierto: true,
    });
    expect(piezas.find((pieza) => pieza.id === `paso-${FIJOS}`)).toMatchObject({
      monto: 200_000,
      cubierto: false,
    });
  });

  it('en el perdido el sueldo pide cero y no se da por cubierto', () => {
    const replica = conPago(taller({ fila: FILA }), 'p', 1_000_000);
    const cobro = cobroPorLaFila(replica, proyecto(), HOY, { destino: 'perdido' });
    const { piezas } = despieceDelCobro(replica, cobro);
    expect(piezas.find((pieza) => pieza.id === `paso-${HOGAR}`)).toMatchObject({
      monto: 0,
      cubierto: false,
    });
    expect(piezas.find((pieza) => pieza.id === 'resto')?.monto).toBe(350_000);
  });

  it('sin los tesoros en la réplica, las cuatro claves se nombran con el catálogo', () => {
    const replica = conPago(taller({ conTesoros: false }), 'p', 70_000_000);
    const { piezas } = despieceDelProyecto(replica, proyecto(), HOY);
    expect(resumen(piezas).map(({ id, nombre, tinta }) => [id, nombre, tinta])).toEqual([
      ['diezmo', 'Diezmo', 'diezmo'],
      ['paso-hogar', 'Hogar', 'hogar'],
      ['paso-maun', 'Maun', 'maun'],
      ['resto', 'Maun', 'maun'],
    ]);
  });

  it('lo que recibe cada tesoro junta las piezas del mismo tesoro y deja afuera lo que no recibe', () => {
    const replica = conPago(taller(), 'p', 80_000_000);
    const despiece = despieceDelProyecto(replica, proyecto(), HOY);
    expect(
      loQueRecibeCadaTesoro(despiece).map(({ tesoro: id, nombre, monto }) => [id, nombre, monto]),
    ).toEqual([
      [DIEZMO, 'Diezmo', 8_000_000],
      [HOGAR, 'Hogar', 50_000_000],
      [MAUN, 'Maun', 22_000_000],
    ]);
  });
});

describe('el despiece real', () => {
  const COBRADO_POR_LA_FILA = proyecto({
    estado: 'cobrado',
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
    dist_fila_version: 4,
  });

  function cobradoPorLaFila(): Replica {
    let replica = taller({ fila: FILA });
    replica = aplicarFilaLocal(replica, 'proyectos', COBRADO_POR_LA_FILA);
    for (const fila of [
      reparto('r1', 1, {
        objetivo_centavos: 300_000,
        tope_centavos: 300_000,
        monto_centavos: 300_000,
      }),
      reparto('r2', 2, {
        tesoro_id: FIJOS,
        nombre: 'Fijos del taller',
        clase: 'fijos',
        objetivo_centavos: 250_000,
        tope_centavos: 250_000,
        monto_centavos: 200_000,
      }),
      reparto('r3', 3, {
        tesoro_id: COCOS,
        nombre: 'Cocos',
        tipo: 'parte',
        clase: null,
        objetivo_centavos: null,
        previo_centavos: null,
        tope_centavos: null,
        por_mes: null,
        porcentaje_bp: 5000,
        monto_centavos: 150_000,
      }),
    ]) {
      replica = aplicarFilaLocal(replica, 'repartos', fila);
    }
    return replica;
  }

  it('desde los repartos, con el nombre con que se cobró y lo que quedó en Maun', () => {
    const despiece = despieceDelProyecto(cobradoPorLaFila(), COBRADO_POR_LA_FILA, HOY);

    expect(despiece.modo).toBe('real');
    expect(resumen(despiece.piezas)).toEqual([
      {
        id: 'diezmo',
        etiqueta: 'Diezmo 10% sobre el ingreso',
        nombre: 'Diezmo',
        tinta: 'diezmo',
        monto: 100_000,
      },
      { id: `paso-${HOGAR}`, etiqueta: 'Sueldo', nombre: 'Hogar', tinta: 'hogar', monto: 300_000 },
      {
        id: `paso-${FIJOS}`,
        etiqueta: 'Gastos fijos',
        nombre: 'Fijos del taller',
        tinta: 'grana',
        monto: 200_000,
      },
      {
        id: `parte-${COCOS}`,
        etiqueta: '50% de lo que sobra',
        nombre: 'Cocos',
        tinta: 'cocos',
        monto: 150_000,
      },
      { id: 'resto', etiqueta: 'El resto', nombre: 'Maun', tinta: 'maun', monto: 250_000 },
    ]);
    expect(despiece.piezas.find((pieza) => pieza.id === `paso-${FIJOS}`)?.falta).toBe(50_000);
  });

  it('reabrirlo devuelve a la caja del taller lo de cada tesoro, sin contar a Maun', () => {
    expect(
      loQueVuelveAlReabrir(cobradoPorLaFila(), COBRADO_POR_LA_FILA).map(({ nombre, monto }) => [
        nombre,
        monto,
      ]),
    ).toEqual([
      ['Diezmo', 100_000],
      ['Hogar', 300_000],
      ['Fijos del taller', 200_000],
      ['Cocos', 150_000],
    ]);
  });

  it('con otra obligación y el superávit aparte, los lee de sus repartos y el diezmo va en su lugar', () => {
    const cobrado = proyecto({
      ...COBRADO_POR_LA_FILA,
      dist_diezmo_centavos: 96_500,
      dist_remanente_centavos: 903_500,
      dist_fila: CON_TODO as unknown as Proyecto['dist_fila'],
    });
    let replica = taller({ fila: CON_TODO });
    replica = aplicarFilaLocal(replica, 'proyectos', cobrado);
    for (const fila of [
      reparto('o1', 1, {
        tesoro_id: IIBB,
        nombre: 'Ingresos Brutos',
        tipo: 'obligacion',
        clase: null,
        modo: null,
        base: 'cobrado',
        objetivo_centavos: null,
        previo_centavos: null,
        tope_centavos: null,
        por_mes: null,
        porcentaje_bp: 350,
        monto_centavos: 35_000,
      }),
      reparto('o2', 2, {
        objetivo_centavos: 300_000,
        tope_centavos: 300_000,
        monto_centavos: 300_000,
      }),
      reparto('o3', 3, {
        tesoro_id: FIJOS,
        nombre: 'Gastos fijos',
        clase: 'fijos',
        objetivo_centavos: 200_000,
        tope_centavos: 200_000,
        monto_centavos: 200_000,
      }),
      reparto('o4', 4, {
        tesoro_id: COCOS,
        nombre: 'Cocos',
        tipo: 'parte',
        clase: null,
        modo: null,
        objetivo_centavos: null,
        previo_centavos: null,
        tope_centavos: null,
        por_mes: null,
        porcentaje_bp: 5000,
        monto_centavos: 184_250,
      }),
      reparto('o5', 5, {
        tesoro_id: APARTE,
        nombre: 'Lo que sobra',
        tipo: 'superavit',
        clase: null,
        modo: null,
        objetivo_centavos: null,
        previo_centavos: null,
        tope_centavos: null,
        por_mes: null,
        monto_centavos: 184_250,
      }),
    ]) {
      replica = aplicarFilaLocal(replica, 'repartos', fila);
    }

    const despiece = despieceDelProyecto(replica, cobrado, HOY);
    expect(despiece.piezas.map((pieza) => [pieza.id, pieza.nombre, pieza.monto])).toEqual([
      [`obligacion-${IIBB}`, 'Ingresos Brutos', 35_000],
      ['diezmo', 'Diezmo', 96_500],
      [`paso-${HOGAR}`, 'Hogar', 300_000],
      [`paso-${FIJOS}`, 'Gastos fijos', 200_000],
      [`parte-${COCOS}`, 'Cocos', 184_250],
      ['resto', 'Lo que sobra', 184_250],
    ]);
    expect(despiece.piezas.map((pieza) => [pieza.etiqueta, pieza.tipoDeTesoro])).toEqual([
      ['Ingresos Brutos 3,5% sobre lo que cobrás', 'obligacion'],
      ['Diezmo 10% sobre el ingreso', 'obligacion'],
      ['Sueldo', 'compromiso'],
      ['Gastos fijos', 'compromiso'],
      ['50% de lo que sobra', 'ahorro-por-porcentaje'],
      ['El resto', 'superavit'],
    ]);

    const conOtroDiezmo = proyecto({
      ...COBRADO_POR_LA_FILA,
      dist_diezmo_bp: 1200,
      dist_fila: {
        ...CON_TODO,
        obligaciones: [
          { tesoro: DIEZMO, porcentaje: puntosBasicos(1200), base: 'cobrado' },
          ...CON_TODO.obligaciones.filter((obligacion) => obligacion.tesoro !== DIEZMO),
        ],
      } as unknown as Proyecto['dist_fila'],
    });
    const otraReplica = aplicarFilaLocal(replica, 'proyectos', conOtroDiezmo);
    expect(
      despieceDelProyecto(otraReplica, conOtroDiezmo, HOY).piezas.find(
        (pieza) => pieza.id === 'diezmo',
      )?.etiqueta,
    ).toBe('Diezmo 12% sobre lo que cobrás');
    expect(
      loQueVuelveAlReabrir(replica, cobrado).map(({ tesoro: id, monto }) => [id, monto]),
    ).toEqual([
      [IIBB, 35_000],
      [DIEZMO, 96_500],
      [HOGAR, 300_000],
      [FIJOS, 200_000],
      [COCOS, 184_250],
      [APARTE, 184_250],
    ]);
  });

  const COBRADO_DE_ANTES = proyecto({
    estado: 'cobrado',
    fecha_cobro: '2026-09-10',
    dist_cobrado_centavos: 70_000_000,
    dist_gastos_centavos: 0,
    dist_diezmo_bp: 1000,
    dist_tope_sueldo_centavos: 50_000_000,
    dist_tope_fijos_centavos: 25_000_000,
    dist_diezmo_centavos: 7_000_000,
    dist_sueldo_centavos: 50_000_000,
    dist_fijos_centavos: 13_000_000,
    dist_remanente_centavos: 0,
    dist_objetivo_sueldo_centavos: 50_000_000,
    dist_objetivo_fijos_centavos: 25_000_000,
  });

  it('un cobro por el camino de antes sale de sus columnas: diezmo, sueldo, fijos y el resto', () => {
    const replica = aplicarFilaLocal(taller(), 'proyectos', COBRADO_DE_ANTES);
    const despiece = despieceDelProyecto(replica, COBRADO_DE_ANTES, HOY);

    expect(despiece.modo).toBe('real');
    expect(resumen(despiece.piezas)).toEqual([
      {
        id: 'diezmo',
        etiqueta: 'Diezmo 10% sobre el ingreso',
        nombre: 'Diezmo',
        tinta: 'diezmo',
        monto: 7_000_000,
      },
      {
        id: `paso-${HOGAR}`,
        etiqueta: 'Sueldo',
        nombre: 'Hogar',
        tinta: 'hogar',
        monto: 50_000_000,
      },
      {
        id: `paso-${MAUN}`,
        etiqueta: 'Gastos fijos',
        nombre: 'Maun',
        tinta: 'maun',
        monto: 13_000_000,
      },
      { id: 'resto', etiqueta: 'El resto', nombre: 'Maun', tinta: 'maun', monto: 0 },
    ]);
    expect(
      loQueVuelveAlReabrir(replica, COBRADO_DE_ANTES).map(({ nombre, monto }) => [nombre, monto]),
    ).toEqual([
      ['Diezmo', 7_000_000],
      ['Hogar', 50_000_000],
    ]);
  });

  it('un escalón de antes que el mes ya cubrió se lee de su objetivo y su tope', () => {
    const cubierto = proyecto({
      ...COBRADO_DE_ANTES,
      dist_tope_sueldo_centavos: 0,
      dist_sueldo_centavos: 0,
      dist_remanente_centavos: 50_000_000,
    });
    const { piezas } = despieceDelProyecto(taller(), cubierto, HOY);
    expect(piezas.find((pieza) => pieza.id === `paso-${HOGAR}`)?.cubierto).toBe(true);
    expect(piezas.find((pieza) => pieza.id === `paso-${MAUN}`)?.cubierto).toBe(false);

    const sinObjetivo = proyecto({ ...cubierto, dist_objetivo_sueldo_centavos: null });
    expect(
      despieceDelProyecto(taller(), sinObjetivo, HOY).piezas.find(
        (pieza) => pieza.id === `paso-${HOGAR}`,
      )?.cubierto,
    ).toBe(false);
  });

  it('un trabajo sin cobrar no tiene nada que devolver', () => {
    expect(loQueVuelveAlReabrir(taller(), proyecto())).toEqual([]);
  });
});

describe('la marca de la apertura en el cobro', () => {
  const liquidacion = {
    destino: 'cobrado',
    fecha: '2026-07-10',
    cobrado: 70_000_000,
    gastos: 0,
    topeSueldo: 50_000_000,
    topeFijos: 25_000_000,
    diezmoBp: 1000,
    diezmo: 7_000_000,
    sueldo: 50_000_000,
    fijos: 13_000_000,
    remanente: 0,
    previo: { sueldo: 0, fijos: 0 },
    objetivos: { sueldo: 50_000_000, fijos: 25_000_000, sueldoMensual: true },
  } as unknown as Liquidacion;

  it('viaja en el pedido y en la fila optimista', () => {
    expect(pedidoDeLiquidacion(proyecto(), liquidacion, true)).toMatchObject({
      fecha: '2026-07-10',
      yaEnLaApertura: true,
    });
    expect(pedidoDeLiquidacion(proyecto(), liquidacion).yaEnLaApertura).toBe(false);
    expect(filaLiquidada(proyecto(), liquidacion, 'ahora', true)).toMatchObject({
      estado: 'cobrado',
      fecha_cobro: '2026-07-10',
      reparto_ya_en_la_apertura: true,
    });
  });

  it('reabrir un cobro la conserva, reactivar un perdido la apaga', () => {
    const cobrado = proyecto({
      estado: 'cobrado',
      fecha_cobro: '2026-07-10',
      reparto_ya_en_la_apertura: true,
    });
    expect(filaRevertida(cobrado, 'entregado', 'ahora')).toMatchObject({
      reapertura_fecha_cobro: '2026-07-10',
      reparto_ya_en_la_apertura: true,
      fecha_cobro: null,
    });

    const perdido = proyecto({ estado: 'perdido', reparto_ya_en_la_apertura: true });
    expect(filaRevertida(perdido, 'presupuesto_enviado', 'ahora').reparto_ya_en_la_apertura).toBe(
      false,
    );
  });
});
