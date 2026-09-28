import { centavos, CERO, puntosBasicos, type Fila } from '@maun/domain';
import { afterEach, describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  borradorDeLaFila,
  cambiarElBorrador,
  descartarElBorrador,
  empezarElBorrador,
} from './borrador';
import { sacar } from './edicion';
import { encabezadoDeLaFicha, fichaVigente, vistaDeLaFila } from './vista';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';

const FILA: Fila = {
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(90_000_000) }],
      desde: '2026-09',
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
  sueldoPorTrabajo: false,
};

function tesoro(id: string, clave: TesoroDelTaller['clave'], nombre: string): TesoroDelTaller {
  return {
    id,
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: CERO,
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
    ...fila.pasos.map((paso) => paso.tesoro),
    ...fila.reparto.map((parte) => parte.tesoro),
  ]);
  const estante = TESOROS.filter(
    (uno) => uno.clave !== 'diezmo' && uno.clave !== 'maun' && !enLaFila.has(uno.id),
  );
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
      reparto: [...sinMateriales.reparto, { tesoro: MATERIALES, porcentaje: puntosBasicos(1000) }],
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

  it('el encabezado de un paso dice su lugar y su clase, y en la hoja del celular solo el lugar', () => {
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${FIJOS}`)).toMatchObject({
      titulo: 'Gastos fijos',
      bajada: 'Paso 2 de 3 · Gastos fijos',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `paso-${FIJOS}`, false)).toMatchObject({
      titulo: 'Gastos fijos',
      bajada: 'Paso 2 de 3',
    });
    expect(encabezadoDeLaFicha(vistaCon(FILA), `estante-${HERRAMIENTAS}`)).toMatchObject({
      titulo: 'Herramientas',
      bajada: 'En el estante',
    });
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
});
