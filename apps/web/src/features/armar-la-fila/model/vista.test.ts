import { centavos, CERO, enPesos, puntosBasicos, type Fila } from '@maun/domain';
import { afterEach, describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  borradorDeLaFila,
  cambiarElBorrador,
  descartarElBorrador,
  empezarElBorrador,
} from './borrador';
import { conHastaLaMeta, sacar } from './edicion';
import {
  encabezadoDeLaFicha,
  escalaDe,
  fichaDelTesoro,
  fichaVigente,
  numeroEnLaFila,
  pideLoCobrado,
  probarLaFila,
  SIN_PRUEBA,
  vistaDeLaFila,
} from './vista';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(90_000_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function tesoro(id: string, clave: TesoroDelTaller['clave'], nombre: string): TesoroDelTaller {
  return {
    id,
    clave,
    moneda: 'ARS',
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(CERO),
  };
}

const TESOROS = [
  tesoro(HOGAR, 'hogar', 'Hogar'),
  tesoro(MAUN, 'maun', 'Maun'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo'),
  tesoro(COCOS, 'cocos', 'Cocos'),
  tesoro(FIJOS, null, 'Gastos fijos'),
  tesoro(MATERIALES, null, 'Materiales'),
  tesoro(HERRAMIENTAS, null, 'Herramientas'),
];

const SISTEMA = { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO };

function vistaCon(fila: Fila) {
  const enLaFila = new Set([
    ...fila.obligaciones.map((obligacion) => obligacion.tesoro),
    ...fila.pasos.map((paso) => paso.tesoro),
    ...fila.reparto.map((parte) => parte.tesoro),
    fila.superavit,
  ]);
  const estante = TESOROS.filter((uno) => !enLaFila.has(uno.id));
  return { fila, estante, sistema: SISTEMA, tesoros: TESOROS };
}

function replicaCon(fila: Fila): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.ajustes = {
    a: {
      id: 'a',
      household_id: 'h',
      sueldo_mensual_centavos: 180_000_000,
      costos_fijos_centavos: 0,
      sueldo_tope_mensual: true,
      perdido_con_sueldo: false,
      perdido_con_diezmo: true,
      meta_cocos_centavos: 0,
      tasa_cocos_anual_bp: 0,
      fila,
      fila_version: 4,
      fila_guardada_at: '2026-09-01T12:00:00Z',
    },
  };
  tablas.tesoros = Object.fromEntries(
    TESOROS.map((uno) => [
      uno.id,
      {
        id: uno.id,
        household_id: 'h',
        clave: uno.clave,
        nombre: uno.nombre,
        descripcion: '',
        tinta: uno.tinta,
        icono: 'vault',
        meta_centavos: null,
        rinde_anual_bp: null,
        orden: 0,
        archivado_at: null,
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
        deleted_at: null,
        version: 1,
      },
    ]),
  );
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

afterEach(() => {
  descartarElBorrador();
});

describe('la ficha elegida', () => {
  it('sigue al tesoro cuando cambia de lugar: del paso al estante, y del estante al reparto', () => {
    const sinMateriales = sacar(FILA, MATERIALES);
    expect(fichaVigente(vistaCon(FILA), `paso-${MATERIALES}`)).toBe(`paso-${MATERIALES}`);
    expect(fichaVigente(vistaCon(sinMateriales), `paso-${MATERIALES}`)).toBe(
      `estante-${MATERIALES}`,
    );
    expect(fichaVigente(vistaCon(FILA), `estante-${MATERIALES}`)).toBe(`paso-${MATERIALES}`);
    const conElReparto: Fila = {
      ...sinMateriales,
      reparto: [
        ...sinMateriales.reparto,
        { tesoro: MATERIALES, porcentaje: puntosBasicos(1000), hastaLaMeta: false },
      ],
    };
    expect(fichaVigente(vistaCon(conElReparto), `estante-${MATERIALES}`)).toBe(
      `parte-${MATERIALES}`,
    );
  });

  it('el diezmo, el reparto y el resto siempre están; lo que no se elige o ya no está, suelta', () => {
    const vista = vistaCon(FILA);
    expect(fichaVigente(vista, 'diezmo')).toBe('diezmo');
    expect(fichaVigente(vista, 'reparto')).toBe('reparto');
    expect(fichaVigente(vista, 'resto')).toBe('resto');
    expect(fichaVigente(vista, 'origen')).toBeNull();
    expect(fichaVigente(vista, 'nuevo')).toBeNull();
    expect(fichaVigente(vista, 'paso-un-tesoro-que-no-esta')).toBeNull();
    expect(fichaVigente(vista, null)).toBeNull();
  });

  it('una obligación tiene su ficha, el diezmo la suya y el superávit aparte es el resto', () => {
    const conObligacion: Fila = {
      ...FILA,
      obligaciones: [
        { tesoro: HERRAMIENTAS, porcentaje: puntosBasicos(350), base: 'cobrado' },
        ...FILA.obligaciones,
      ],
    };
    expect(fichaVigente(vistaCon(FILA), `estante-${HERRAMIENTAS}`)).toBe(`estante-${HERRAMIENTAS}`);
    expect(fichaVigente(vistaCon(conObligacion), `estante-${HERRAMIENTAS}`)).toBe(
      `obligacion-${HERRAMIENTAS}`,
    );
    expect(fichaVigente(vistaCon(conObligacion), `obligacion-${DIEZMO}`)).toBe('diezmo');
    expect(
      encabezadoDeLaFicha(vistaCon(conObligacion), `obligacion-${HERRAMIENTAS}`),
    ).toMatchObject({ titulo: 'Herramientas', bajada: 'Obligación · 1 de 5' });
    expect(encabezadoDeLaFicha(vistaCon(conObligacion), 'diezmo')).toMatchObject({
      titulo: 'Diezmo',
      bajada: 'Obligación · 2 de 5',
    });
    expect(numeroEnLaFila(conObligacion, HERRAMIENTAS)).toBe(1);
    expect(numeroEnLaFila(conObligacion, FIJOS)).toBe(4);
    expect(numeroEnLaFila(conObligacion, COCOS)).toBe(0);
    expect(fichaDelTesoro(vistaCon(conObligacion), DIEZMO)).toBe('diezmo');
    expect(fichaDelTesoro(vistaCon(conObligacion), FIJOS)).toBe(`paso-${FIJOS}`);

    const conSuperavit: Fila = { ...FILA, superavit: HERRAMIENTAS };
    expect(fichaVigente(vistaCon(conSuperavit), `estante-${HERRAMIENTAS}`)).toBe('resto');
    expect(escalaDe(vistaCon(conSuperavit)).at(-1)).toMatchObject({
      tesoro: HERRAMIENTAS,
      porcentaje: 5000,
      resto: true,
    });
    expect(escalaDe(vistaCon(FILA)).at(-1)).toMatchObject({ tesoro: MAUN, resto: true });
  });

  it('el encabezado de un paso dice su tipo y su lugar en la fila, contando las obligaciones', () => {
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${FIJOS}`)).toMatchObject({
      titulo: 'Gastos fijos',
      bajada: 'Compromiso · 3 de 4',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${HOGAR}`)).toMatchObject({
      bajada: 'Compromiso · 2 de 4 · Sueldo',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${HOGAR}`, false)).toMatchObject({
      bajada: 'Compromiso · 2 de 4',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${MATERIALES}`)).toMatchObject({
      bajada: 'Ahorro fijo · 4 de 4',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `estante-${HERRAMIENTAS}`)).toMatchObject({
      titulo: 'Herramientas',
      bajada: 'En el estante',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), 'resto')).toMatchObject({
      titulo: 'Maun',
      bajada: 'Superávit · El resto',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), 'insumos')).toMatchObject({
      titulo: 'Insumos',
      tesoro: null,
    });
    expect(fichaVigente(vistaCon(FILA), 'insumos')).toBe('insumos');
  });
});

describe('la vista de la fila con el borrador', () => {
  it('editando muestra el borrador, y al descartarlo vuelve la fila guardada', () => {
    const replica = replicaCon(FILA);
    empezarElBorrador('a', 4, FILA);
    const borrador = borradorDeLaFila();
    if (borrador === null) throw new Error('No hay borrador');
    cambiarElBorrador(sacar(borrador.fila, COCOS));
    const editando = vistaDeLaFila(replica, borradorDeLaFila(), '2026-09-27');
    expect(editando.armando).toBe(true);
    expect(editando.fila.reparto).toHaveLength(0);
    expect(editando.cuantos).toBe(1);

    descartarElBorrador();
    const guardada = vistaDeLaFila(replica, borradorDeLaFila(), '2026-09-27');
    expect(guardada.armando).toBe(false);
    expect(guardada.fila).toEqual(FILA);
    expect(guardada.cuantos).toBe(0);
  });

  it('editando, los problemas miran la meta de cada tesoro', () => {
    const replica = replicaCon(FILA);
    empezarElBorrador('a', 4, FILA);
    const borrador = borradorDeLaFila();
    if (borrador === null) throw new Error('No hay borrador');
    cambiarElBorrador(conHastaLaMeta(borrador.fila, MATERIALES, true));
    const editando = vistaDeLaFila(replica, borradorDeLaFila(), '2026-09-27');
    expect(editando.problemas.map((problema) => problema.problema)).toContain('meta-sin-monto');
  });
});

describe('probar un cobro', () => {
  const conIngresosBrutos: Fila = {
    ...FILA,
    obligaciones: [
      { tesoro: HERRAMIENTAS, porcentaje: puntosBasicos(350), base: 'cobrado' },
      ...FILA.obligaciones,
    ],
    pasos: [],
    reparto: [],
  };

  it('pide lo cobrado solo si alguna obligación se calcula sobre eso', () => {
    expect(pideLoCobrado(FILA)).toBe(false);
    expect(pideLoCobrado(conIngresosBrutos)).toBe(true);
  });

  it('con lo cobrado, las obligaciones sobre lo que cobrás lo usan', () => {
    const replica = replicaCon(conIngresosBrutos);
    const prueba = probarLaFila(
      replica,
      conIngresosBrutos,
      { monto: centavos(200_000_000), cobrado: centavos(250_000_000), enCero: true },
      '2026-09-27',
    );
    expect(prueba?.obligaciones.map((obligacion) => obligacion.monto)).toEqual([
      8_750_000, 19_125_000,
    ]);
    const sinLoCobrado = probarLaFila(
      replica,
      FILA,
      { monto: centavos(200_000_000), cobrado: centavos(250_000_000), enCero: true },
      '2026-09-27',
    );
    expect(sinLoCobrado?.cobrado).toBe(200_000_000);
    expect(probarLaFila(replica, FILA, SIN_PRUEBA, '2026-09-27')).toBeNull();
  });
});
