import { centavos, enPesos, puntosBasicos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { tesoroDe } from '@/features/armar-la-fila';

import type { LugarDelTramo } from './disposicion';
import {
  anuncioDelMovimiento,
  aplicarLaUnion,
  despuesDePara,
  encabezadoDelMenu,
  fraseDeLaUnion,
  unionDe,
} from './uniones';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const IIBB = '01900000-0000-7000-8000-000000000009';

const TESOROS = [
  { id: HOGAR, clave: 'hogar' as const, meta: null, moneda: 'ARS' as const },
  { id: MAUN, clave: 'maun' as const, meta: null, moneda: 'ARS' as const },
  { id: DIEZMO, clave: 'diezmo' as const, meta: null, moneda: 'ARS' as const },
  { id: COCOS, clave: 'cocos' as const, meta: null, moneda: 'ARS' as const },
  { id: FIJOS, clave: null, meta: null, moneda: 'ARS' as const },
  { id: MATERIALES, clave: null, meta: null, moneda: 'ARS' as const },
  { id: HERRAMIENTAS, clave: null, meta: enPesos(centavos(90_000_000)), moneda: 'ARS' as const },
  { id: IIBB, clave: null, meta: null, moneda: 'ARS' as const },
];

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(10_000_000),
      renglones: [{ nombre: 'Luz', monto: centavos(10_000_000), dia: null }],
      desde: null,
      modo: 'saldo',
      hastaLaMeta: false,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

const nombres: Record<string, string> = {
  [HERRAMIENTAS]: 'Herramientas',
  [HOGAR]: 'Hogar',
  [IIBB]: 'Ingresos Brutos',
  [DIEZMO]: 'Diezmo',
  [FIJOS]: 'Gastos fijos',
};
const nombreDe = (id: string) => nombres[id] ?? id;

const union = (origen: string, destino: string, fila: Fila = FILA) =>
  unionDe(fila, TESOROS, DIEZMO, origen, destino);

const frase = (origen: string, destino: string, fila: Fila = FILA) =>
  fraseDeLaUnion(fila, TESOROS, DIEZMO, nombreDe, union(origen, destino, fila), true);

describe('unir con la manija hasta el estante, con el tipo del grupo', () => {
  it('desde un ahorro fijo, entra como ahorro fijo después de él, con su meta', () => {
    expect(union(`paso-${MATERIALES}`, `estante-${HERRAMIENTAS}`)).toEqual({
      tipo: 'sumar',
      lugar: 'ahorro-fijo',
      tesoro: HERRAMIENTAS,
      despuesDe: MATERIALES,
    });
    expect(frase(`paso-${MATERIALES}`, `estante-${HERRAMIENTAS}`)).toBe(
      'Soltá: Herramientas entra como ahorro fijo 5',
    );
    const aplicada = aplicarLaUnion(FILA, TESOROS, DIEZMO, {
      tipo: 'sumar',
      lugar: 'ahorro-fijo',
      tesoro: HERRAMIENTAS,
      despuesDe: MATERIALES,
    });
    expect(aplicada.fila.pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      FIJOS,
      MATERIALES,
      HERRAMIENTAS,
    ]);
    expect(aplicada.fila.pasos[3]).toMatchObject({
      clase: 'prioridad',
      tope: 0,
      modo: 'mes',
      hastaLaMeta: true,
    });
    expect(aplicada.elegir).toBe(`paso-${HERRAMIENTAS}`);
  });

  it('desde un compromiso, entra como compromiso y se renueva al pagar', () => {
    expect(frase(`paso-${HOGAR}`, `estante-${HERRAMIENTAS}`)).toBe(
      'Soltá: Herramientas entra como compromiso 3',
    );
    const unida = union(`paso-${HOGAR}`, `estante-${HERRAMIENTAS}`);
    if (unida === null || unida.tipo === 'nuevo') throw new Error('No se unió');
    const aplicada = aplicarLaUnion(FILA, TESOROS, DIEZMO, unida);
    expect(aplicada.fila.pasos.map((paso) => [paso.tesoro, paso.clase, paso.modo])).toEqual([
      [HOGAR, 'sueldo', 'mes'],
      [HERRAMIENTAS, 'fijos', 'saldo'],
      [FIJOS, 'fijos', 'saldo'],
      [MATERIALES, 'prioridad', 'mes'],
    ]);
  });

  it('desde una obligación, entra como obligación con 0% y queda elegida para ponerle el porcentaje', () => {
    expect(union('diezmo', `estante-${IIBB}`)).toEqual({
      tipo: 'sumar',
      lugar: 'obligacion',
      tesoro: IIBB,
      despuesDe: DIEZMO,
    });
    expect(frase('diezmo', `estante-${IIBB}`)).toBe(
      'Soltá: Ingresos Brutos entra como obligación 2',
    );
    const aplicada = aplicarLaUnion(FILA, TESOROS, DIEZMO, {
      tipo: 'sumar',
      lugar: 'obligacion',
      tesoro: IIBB,
      despuesDe: DIEZMO,
    });
    expect(aplicada.fila.obligaciones.at(-1)).toEqual({
      tesoro: IIBB,
      porcentaje: 0,
      base: 'ingreso',
    });
    expect(aplicada.elegir).toBe(`obligacion-${IIBB}`);
    expect(union('diezmo', `estante-${HOGAR}`)).toBeNull();
    expect(union('diezmo', `estante-${MAUN}`)).toBeNull();
  });

  it('desde el reparto, entra al reparto con lo que queda libre', () => {
    expect(union('reparto', `estante-${HERRAMIENTAS}`)).toEqual({
      tipo: 'sumar',
      lugar: 'reparto',
      tesoro: HERRAMIENTAS,
      despuesDe: null,
    });
    expect(frase('reparto', `estante-${HERRAMIENTAS}`)).toBe(
      'Soltá: Herramientas entra al reparto',
    );
    const aplicada = aplicarLaUnion(FILA, TESOROS, DIEZMO, {
      tipo: 'sumar',
      lugar: 'reparto',
      tesoro: HERRAMIENTAS,
      despuesDe: null,
    });
    expect(aplicada.fila.reparto.at(-1)).toEqual({
      tesoro: HERRAMIENTAS,
      porcentaje: 1000,
      hastaLaMeta: true,
    });
    expect(union('reparto', `estante-${HOGAR}`)).toBeNull();
  });

  it('hasta otra ficha de su tipo, la mueve para que quede después; de otro tipo, no', () => {
    const conDos: Fila = {
      ...FILA,
      obligaciones: [
        { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' },
        ...FILA.obligaciones,
      ],
    };
    expect(union('diezmo', `obligacion-${IIBB}`, conDos)).toEqual({
      tipo: 'mover',
      lugar: 'obligacion',
      tesoro: IIBB,
      despuesDe: DIEZMO,
    });
    expect(frase('diezmo', `obligacion-${IIBB}`, conDos)).toBe(
      'Soltá: Ingresos Brutos pasa a ser la obligación 2',
    );
    const movida = aplicarLaUnion(conDos, TESOROS, DIEZMO, {
      tipo: 'mover',
      lugar: 'obligacion',
      tesoro: IIBB,
      despuesDe: DIEZMO,
    });
    expect(movida.fila.obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([DIEZMO, IIBB]);
    expect(union(`obligacion-${IIBB}`, 'diezmo', conDos)).toBeNull();

    expect(union(`paso-${FIJOS}`, `paso-${HOGAR}`)).toEqual({
      tipo: 'mover',
      lugar: 'compromiso',
      tesoro: HOGAR,
      despuesDe: FIJOS,
    });
    expect(frase(`paso-${FIJOS}`, `paso-${HOGAR}`)).toBe('Soltá: Hogar pasa a ser el compromiso 3');
    expect(union(`paso-${MATERIALES}`, `paso-${HOGAR}`)).toBeNull();
    expect(union(`paso-${HOGAR}`, `paso-${FIJOS}`)).toBeNull();
    expect(union('reparto', `paso-${HOGAR}`)).toBeNull();
  });

  it('hasta «Nuevo tesoro», pide la hoja con el tipo y el lugar', () => {
    expect(union(`paso-${HOGAR}`, 'nuevo')).toEqual({
      tipo: 'nuevo',
      lugar: 'compromiso',
      despuesDe: HOGAR,
    });
    expect(union('diezmo', 'nuevo')).toEqual({
      tipo: 'nuevo',
      lugar: 'obligacion',
      despuesDe: DIEZMO,
    });
    expect(union('reparto', 'nuevo')).toEqual({ tipo: 'nuevo', lugar: 'reparto', despuesDe: null });
  });

  it('un tesoro en dólares del estante no se une a la fila, y al pasar por encima dice por qué', () => {
    const conDolares = [
      ...TESOROS,
      { id: 'dolares', clave: null, meta: null, moneda: 'USD' as const },
    ];
    expect(unionDe(FILA, conDolares, DIEZMO, `paso-${MATERIALES}`, 'estante-dolares')).toBeNull();
    expect(unionDe(FILA, conDolares, DIEZMO, 'reparto', 'estante-dolares')).toBeNull();
    expect(fraseDeLaUnion(FILA, conDolares, DIEZMO, nombreDe, null, true, 'estante-dolares')).toBe(
      'La fila reparte pesos: un tesoro en dólares queda en el estante.',
    );
    expect(fraseDeLaUnion(FILA, conDolares, DIEZMO, nombreDe, null, true, `parte-${COCOS}`)).toBe(
      'Ahí no se puede unir',
    );
  });

  it('lo que no se puede unir lo dice', () => {
    expect(union(`paso-${HOGAR}`, `parte-${COCOS}`)).toBeNull();
    expect(union('origen', `estante-${HERRAMIENTAS}`)).toBeNull();
    expect(union('insumos', `estante-${HERRAMIENTAS}`)).toBeNull();
    expect(fraseDeLaUnion(FILA, TESOROS, DIEZMO, nombreDe, null, true)).toBe(
      'Ahí no se puede unir',
    );
    expect(fraseDeLaUnion(FILA, TESOROS, DIEZMO, nombreDe, null, false)).toBe(
      'Llevala hasta un tesoro',
    );
    expect(fraseDeLaUnion(FILA, TESOROS, DIEZMO, nombreDe, union('reparto', 'nuevo'), true)).toBe(
      'Soltá para crear un tesoro acá',
    );
  });
});

describe('el «+» de cada tramo', () => {
  it('suma después de la ficha de arriba si es de su tipo; si no, al principio de su tipo', () => {
    const vista = {
      tesoros: [HOGAR, DIEZMO].map((id) => ({
        ...tesoroDe({ tesoros: [] }, id),
        nombre: nombreDe(id),
      })),
    };
    const desdeElIngreso: LugarDelTramo = {
      fuente: 'origen',
      despuesDe: null,
      lugares: ['obligacion'],
    };
    const desdeElDiezmo: LugarDelTramo = {
      fuente: 'obligacion',
      despuesDe: DIEZMO,
      lugares: ['obligacion', 'compromiso'],
    };
    const desdeHogar: LugarDelTramo = {
      fuente: 'compromiso',
      despuesDe: HOGAR,
      lugares: ['compromiso', 'ahorro-fijo', 'reparto', 'superavit'],
    };
    expect(encabezadoDelMenu(vista, 'obligacion', desdeElIngreso)).toBe(
      'Como obligación, al principio',
    );
    expect(encabezadoDelMenu(vista, 'obligacion', desdeElDiezmo)).toBe(
      'Como obligación, después de Diezmo',
    );
    expect(encabezadoDelMenu(vista, 'compromiso', desdeElDiezmo)).toBe(
      'Como compromiso, al principio',
    );
    expect(encabezadoDelMenu(vista, 'ahorro-fijo', desdeHogar)).toBe(
      'Como ahorro fijo, después de Hogar',
    );
    expect(encabezadoDelMenu(vista, 'reparto', desdeHogar)).toBe('En el reparto');
    expect(despuesDePara('compromiso', desdeHogar)).toBe(HOGAR);
    expect(despuesDePara('superavit', desdeHogar)).toBeUndefined();
  });
});

describe('mover con el teclado', () => {
  it('dice el lugar en la fila adentro de su tipo, sin coordenadas', () => {
    expect(anuncioDelMovimiento(FILA, FIJOS, 'Gastos fijos', -1)).toBe(
      'Gastos fijos pasa a ser el compromiso 2 de 4.',
    );
    expect(anuncioDelMovimiento(FILA, HOGAR, 'Hogar', -1)).toBe(
      'Hogar ya es el primer compromiso.',
    );
    expect(anuncioDelMovimiento(FILA, FIJOS, 'Gastos fijos', 1)).toBe(
      'Gastos fijos ya es el último compromiso.',
    );
    expect(anuncioDelMovimiento(FILA, MATERIALES, 'Materiales', -1)).toBe(
      'Materiales ya es el primer ahorro fijo.',
    );
    expect(anuncioDelMovimiento(FILA, DIEZMO, 'Diezmo', 1)).toBe(
      'Diezmo ya es la última obligación.',
    );
    expect(anuncioDelMovimiento(FILA, COCOS, 'Cocos', 1)).toBe(
      'Solo las obligaciones y los pasos de la fila cambian de lugar.',
    );
  });
});
