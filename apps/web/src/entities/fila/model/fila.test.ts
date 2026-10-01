import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import {
  ajustesDelReparto,
  cobradoYGastosDeLaPrueba,
  estanteDe,
  faltantesDeGastosFijos,
  filaDelMesDelTaller,
  pruebaDeUnCobro,
} from './fila';
import {
  aPagarDe,
  loQueHayQuePagar,
  metasDeLaFila,
  modoEnPalabras,
  modosDelPaso,
  nombreDelTipoDe,
  tiposDelTesoro,
  totalAPagar,
} from './tipos';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const STOCK = '00000000-0000-7000-8000-000000000011';
const APARTE = '00000000-0000-7000-8000-000000000012';
const IIBB = '00000000-0000-7000-8000-000000000013';

function replicaVacia(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(1_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(500),
      renglones: [{ nombre: 'Alquiler', monto: centavos(500), dia: 10 }],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function conElModo(fila: Fila, modo: 'mes' | 'saldo'): Fila {
  return {
    ...fila,
    pasos: fila.pasos.map((paso) => (paso.tesoro === FIJOS ? { ...paso, modo } : paso)),
  };
}

function tesoro(id: string, clave: FilaDe<'tesoros'>['clave'], nombre: string, meta = 0) {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta_centavos: meta > 0 ? meta : null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    moneda: 'ARS',
  } satisfies FilaDe<'tesoros'>;
}

function reparto(id: string, tesoroId: string, clase: string, monto: number): FilaDe<'repartos'> {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p1',
    posicion: id === 'r1' ? 1 : 2,
    tesoro_id: tesoroId,
    nombre: '',
    tipo: 'paso',
    clase,
    modo: 'mes',
    base: null,
    objetivo_centavos: monto,
    previo_centavos: 0,
    tope_centavos: monto,
    por_mes: true,
    porcentaje_bp: null,
    monto_centavos: monto,
    fecha: '2026-09-10',
    ya_en_la_apertura: false,
  };
}

function replicaDelMes(fila: Fila = FILA): Replica {
  let replica = replicaVacia();
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    perdido_con_sueldo: false,
    perdido_con_diezmo: true,
    meta_cocos_centavos: 0,
    fila: fila as unknown as FilaDe<'ajustes'>['fila'],
    fila_version: 2,
  } as unknown as FilaDe<'ajustes'>);
  for (const fila of [
    tesoro(HOGAR, 'hogar', 'Hogar'),
    tesoro(MAUN, 'maun', 'Maun'),
    tesoro(DIEZMO, 'diezmo', 'Diezmo'),
    tesoro(COCOS, 'cocos', 'Cocos'),
    tesoro(FIJOS, null, 'Gastos fijos'),
    tesoro(STOCK, null, 'Stock del taller', 1_000),
    tesoro(APARTE, null, 'Superávit'),
  ]) {
    replica = aplicarFilaLocal(replica, 'tesoros', fila);
  }
  replica = aplicarFilaLocal(replica, 'proyectos', {
    ...METADATOS,
    id: 'p1',
    estado: 'cobrado',
    fecha_cobro: '2026-09-10',
    dist_cobrado_centavos: 2_000,
    dist_gastos_centavos: 0,
    dist_diezmo_centavos: 200,
    dist_sueldo_centavos: 0,
    dist_fijos_centavos: 0,
    dist_remanente_centavos: 1_800,
    dist_liquidado_at: '2026-09-10T12:00:00Z',
    dist_fila_version: 2,
  } as unknown as FilaDe<'proyectos'>);
  replica = aplicarFilaLocal(replica, 'repartos', reparto('r1', HOGAR, 'sueldo', 1_000));
  replica = aplicarFilaLocal(replica, 'repartos', reparto('r2', FIJOS, 'fijos', 300));
  replica = aplicarFilaLocal(replica, 'movimientos', {
    ...METADATOS,
    id: 'm1',
    fecha: '2026-09-12',
    tipo: 'gasto',
    tesoro_origen: null,
    tesoro_destino: null,
    desde_id: FIJOS,
    hacia_id: null,
    cubre_el_mes: null,
    monto_centavos: 100,
    monto_destino_centavos: null,
    categoria: 'Alquiler',
    descripcion: '',
    proyecto_id: null,
  } satisfies FilaDe<'movimientos'>);
  return replica;
}

describe('lo del mes de la fila del taller', () => {
  it('suma lo que cada paso recibió en el mes, dice qué falta y lo que queda a pagar', () => {
    const mes = filaDelMesDelTaller(replicaDelMes(), '2026-09');
    expect(
      mes.pasos.map((paso) => [paso.tesoro, paso.recibido, paso.falta, paso.completo]),
    ).toEqual([
      [HOGAR, 1_000, 0, true],
      [FIJOS, 300, 200, false],
    ]);
    expect(mes.cobros).toBe(1);
    expect(mes.ingreso).toBe(2_000);
    expect(faltantesDeGastosFijos(mes).map((paso) => paso.tesoro)).toEqual([FIJOS]);
    expect(mes.pasos[1]?.vencimientos).toEqual([
      {
        indice: 0,
        renglon: 'Alquiler',
        monto: 500,
        dia: 10,
        fecha: '2026-09-10',
        pagado: true,
      },
    ]);
    expect(mes.pasos.map((paso) => paso.aPagar)).toEqual([null, 200]);
  });

  it('un compromiso que se renueva al pagar mira su saldo, no lo del mes', () => {
    const replica = replicaDelMes();
    const renueva = conElModo(FILA, 'saldo');
    const septiembre = filaDelMesDelTaller(replica, '2026-09', renueva);
    expect(septiembre.pasos[1]).toMatchObject({ modo: 'saldo', lleva: 200, falta: 300 });
    const octubre = filaDelMesDelTaller(replica, '2026-10', renueva);
    expect(octubre.pasos[1]).toMatchObject({ lleva: 200, falta: 300 });
    expect(filaDelMesDelTaller(replica, '2026-10').pasos[1]).toMatchObject({
      lleva: 0,
      falta: 500,
    });
    expect(faltantesDeGastosFijos(octubre).map((paso) => paso.tesoro)).toEqual([FIJOS]);
  });

  it('un ahorro por trabajo no tiene faltante', () => {
    const conStock: Fila = {
      ...FILA,
      pasos: [
        ...FILA.pasos,
        {
          tesoro: STOCK,
          clase: 'prioridad',
          tope: centavos(200),
          renglones: [],
          desde: null,
          modo: 'trabajo',
          hastaLaMeta: false,
        },
      ],
    };
    const mes = filaDelMesDelTaller(replicaDelMes(conStock), '2026-09');
    expect(mes.pasos[2]).toMatchObject({ falta: null, completo: false, aPagar: null });
    expect(faltantesDeGastosFijos(mes).map((paso) => paso.tesoro)).toEqual([FIJOS]);
  });

  it('la prueba arranca con lo de hoy, o con todo en cero', () => {
    const replica = replicaDelMes();
    const deHoy = pruebaDeUnCobro(replica, FILA, {
      monto: centavos(10_000),
      enCero: false,
      hoy: '2026-09-27',
    });
    const enCero = pruebaDeUnCobro(replica, FILA, {
      monto: centavos(10_000),
      enCero: true,
      hoy: '2026-09-27',
    });
    expect(deHoy.pasos.map((paso) => paso.monto)).toEqual([0, 200]);
    expect(enCero.pasos.map((paso) => paso.monto)).toEqual([1_000, 500]);

    const renueva = conElModo(FILA, 'saldo');
    expect(
      pruebaDeUnCobro(replica, renueva, {
        monto: centavos(10_000),
        enCero: false,
        hoy: '2026-09-27',
      }).pasos[1]?.monto,
    ).toBe(300);
    expect(
      pruebaDeUnCobro(replica, renueva, {
        monto: centavos(10_000),
        enCero: true,
        hoy: '2026-09-27',
      }).pasos[1]?.monto,
    ).toBe(500);
    expect(ajustesDelReparto(replica)).toEqual({ perdidoConSueldo: false, perdidoConDiezmo: true });
    expect(ajustesDelReparto(replicaVacia())).toEqual({
      perdidoConSueldo: false,
      perdidoConDiezmo: true,
    });
  });

  it('con una obligación sobre lo cobrado, la prueba separa lo cobrado de lo que deja', () => {
    expect(cobradoYGastosDeLaPrueba(centavos(100))).toEqual({ cobrado: 100, gastos: 0 });
    expect(cobradoYGastosDeLaPrueba(centavos(100), centavos(150))).toEqual({
      cobrado: 150,
      gastos: 50,
    });
    expect(cobradoYGastosDeLaPrueba(centavos(100), centavos(80))).toEqual({
      cobrado: 100,
      gastos: 0,
    });

    const conIngresosBrutos: Fila = {
      ...FILA,
      obligaciones: [
        { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' },
        { tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' },
      ],
      pasos: [],
      reparto: [],
    };
    const prueba = pruebaDeUnCobro(replicaDelMes(), conIngresosBrutos, {
      monto: centavos(200_000_000),
      cobrado: centavos(250_000_000),
      enCero: true,
      hoy: '2026-09-27',
    });
    expect(prueba.obligaciones.map((obligacion) => obligacion.monto)).toEqual([
      8_750_000, 19_125_000,
    ]);
    expect(prueba.libre).toBe(172_125_000);
  });
});

describe('el estante', () => {
  const tesoros = [
    { id: HOGAR, archivado: false },
    { id: MAUN, archivado: false },
    { id: DIEZMO, archivado: false },
    { id: COCOS, archivado: false },
    { id: FIJOS, archivado: false },
    { id: STOCK, archivado: false },
    { id: APARTE, archivado: false },
    { id: 'viejo', archivado: true },
  ];

  it('son los vivos que no están en la fila: ni obligación, ni paso, ni parte, ni superávit', () => {
    expect(estanteDe(FILA, tesoros).map((tesoro) => tesoro.id)).toEqual([STOCK, APARTE]);
  });

  it('con el superávit en otro tesoro, Maun queda en el estante', () => {
    expect(estanteDe({ ...FILA, superavit: APARTE }, tesoros).map((tesoro) => tesoro.id)).toEqual([
      MAUN,
      STOCK,
    ]);
  });
});

describe('los tipos de la fila', () => {
  const conMaun: Fila = {
    ...FILA,
    pasos: [
      ...FILA.pasos,
      {
        tesoro: MAUN,
        clase: 'fijos',
        tope: centavos(100),
        renglones: [{ nombre: 'Costos fijos', monto: centavos(100), dia: null }],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
      },
    ],
  };

  it('el tipo sale del lugar en la fila, y Maun puede ser compromiso y superávit', () => {
    expect(tiposDelTesoro(conMaun, DIEZMO)).toEqual(['obligacion']);
    expect(tiposDelTesoro(conMaun, HOGAR)).toEqual(['compromiso']);
    expect(tiposDelTesoro(conMaun, COCOS)).toEqual(['ahorro-por-porcentaje']);
    expect(tiposDelTesoro(conMaun, MAUN)).toEqual(['compromiso', 'superavit']);
    expect(tiposDelTesoro(conMaun, STOCK)).toEqual([]);
    expect(nombreDelTipoDe(conMaun, COCOS)).toBe('Ahorro');
    expect(nombreDelTipoDe(conMaun, DIEZMO)).toBe('Obligación');
    expect(nombreDelTipoDe(conMaun, STOCK)).toBeNull();
  });

  it('cada paso ofrece los modos que admite, con sus palabras', () => {
    expect(modosDelPaso('fijos', null)).toEqual([
      { id: 'mes', etiqueta: 'Por mes' },
      { id: 'saldo', etiqueta: 'Se renueva al pagar' },
    ]);
    expect(modosDelPaso('prioridad', null).map((modo) => modo.etiqueta)).toEqual([
      'Por mes',
      'Se repone al usarlo',
      'Por trabajo',
    ]);
    expect(modosDelPaso('fijos', 'maun')).toEqual([{ id: 'mes', etiqueta: 'Por mes' }]);
    expect(modosDelPaso('sueldo', 'hogar')).toEqual([{ id: 'mes', etiqueta: 'Por mes' }]);
    expect(modoEnPalabras('saldo', 'ahorro-fijo')).toBe('se repone al usarlo');
  });

  it('lo que hay que pagar son las obligaciones y los compromisos, sin Hogar ni Maun', () => {
    const mes = filaDelMesDelTaller(replicaDelMes(conMaun), '2026-09');
    expect(loQueHayQuePagar(mes)).toEqual([
      { tesoro: DIEZMO, tipo: 'obligacion', aPagar: 200 },
      { tesoro: FIJOS, tipo: 'compromiso', aPagar: 200 },
    ]);
    expect(totalAPagar(mes)).toBe(400);
    expect(aPagarDe(mes, FIJOS)).toBe(200);
    expect(aPagarDe(mes, MAUN)).toBeNull();
  });

  it('las metas son las de los ahorros, vayan o no hasta la meta', () => {
    const conStock: Fila = {
      ...FILA,
      pasos: [
        ...FILA.pasos,
        {
          tesoro: STOCK,
          clase: 'prioridad',
          tope: centavos(200),
          renglones: [],
          desde: null,
          modo: 'mes',
          hastaLaMeta: true,
        },
      ],
    };
    const mes = filaDelMesDelTaller(replicaDelMes(conStock), '2026-09');
    expect(metasDeLaFila(mes)).toEqual([
      {
        tesoro: STOCK,
        tipo: 'ahorro-fijo',
        meta: { meta: 1_000, saldo: 0, falta: 1_000, hastaLaMeta: true, llego: false },
      },
    ]);
  });
});
