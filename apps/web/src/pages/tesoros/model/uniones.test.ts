import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { anuncioDelMovimiento, aplicarLaUnion, fraseDeLaUnion, unionDe } from './uniones';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const COCOS = '01900000-0000-7000-8000-000000000004';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';

const TESOROS = [
  { id: HOGAR, clave: 'hogar' as const },
  { id: MAUN, clave: 'maun' as const },
  { id: COCOS, clave: 'cocos' as const },
  { id: MATERIALES, clave: null },
  { id: HERRAMIENTAS, clave: null },
];

const FILA: Fila = {
  pasos: [
    { tesoro: HOGAR, clase: 'sueldo', tope: centavos(100_000_000), renglones: [], desde: null },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: null,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
  sueldoPorTrabajo: false,
};

const nombres: Record<string, string> = { [HERRAMIENTAS]: 'Herramientas', [HOGAR]: 'Hogar' };
const nombreDe = (id: string) => nombres[id] ?? id;

describe('unir con flechas', () => {
  it('de un paso a un tesoro del estante, entra como paso después de ese paso', () => {
    const union = unionDe(FILA, TESOROS, `paso-${MATERIALES}`, `estante-${HERRAMIENTAS}`);
    expect(union).toEqual({ tipo: 'paso', tesoro: HERRAMIENTAS, despuesDe: MATERIALES });
    expect(fraseDeLaUnion(FILA, nombreDe, union, true)).toBe(
      'Soltá: Herramientas entra como paso 3',
    );
    const aplicada = aplicarLaUnion(FILA, TESOROS, {
      tipo: 'paso',
      tesoro: HERRAMIENTAS,
      despuesDe: MATERIALES,
    });
    expect(aplicada.fila.pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      MATERIALES,
      HERRAMIENTAS,
    ]);
    expect(aplicada.fila.pasos[2]).toMatchObject({ clase: 'prioridad', tope: 0 });
    expect(aplicada.elegir).toBe(`paso-${HERRAMIENTAS}`);
  });

  it('desde el diezmo, entra primero', () => {
    const union = unionDe(FILA, TESOROS, 'diezmo', `estante-${HERRAMIENTAS}`);
    expect(fraseDeLaUnion(FILA, nombreDe, union, true)).toBe(
      'Soltá: Herramientas entra como paso 1',
    );
  });

  it('desde el reparto, entra al reparto con lo que queda libre', () => {
    const union = unionDe(FILA, TESOROS, 'reparto', `estante-${HERRAMIENTAS}`);
    expect(union).toEqual({ tipo: 'reparto', tesoro: HERRAMIENTAS });
    expect(fraseDeLaUnion(FILA, nombreDe, union, true)).toBe(
      'Soltá: Herramientas entra al reparto',
    );
    const aplicada = aplicarLaUnion(FILA, TESOROS, { tipo: 'reparto', tesoro: HERRAMIENTAS });
    expect(aplicada.fila.reparto.at(-1)).toEqual({ tesoro: HERRAMIENTAS, porcentaje: 1000 });
    expect(unionDe(FILA, TESOROS, 'reparto', `estante-${HOGAR}`)).toBeNull();
  });

  it('hasta otro paso, lo mueve para que quede después', () => {
    const union = unionDe(FILA, TESOROS, `paso-${MATERIALES}`, `paso-${HOGAR}`);
    expect(union).toEqual({ tipo: 'mover', tesoro: HOGAR, despuesDe: MATERIALES });
    expect(fraseDeLaUnion(FILA, nombreDe, union, true)).toBe('Soltá: Hogar pasa a ser el paso 2');
    expect(unionDe(FILA, TESOROS, 'reparto', `paso-${HOGAR}`)).toBeNull();
  });

  it('hasta «Nuevo tesoro», pide la hoja con ese lugar', () => {
    expect(unionDe(FILA, TESOROS, `paso-${HOGAR}`, 'nuevo')).toEqual({
      tipo: 'nuevo',
      despuesDe: HOGAR,
      lugar: 'paso',
    });
    expect(unionDe(FILA, TESOROS, 'reparto', 'nuevo')).toEqual({
      tipo: 'nuevo',
      despuesDe: null,
      lugar: 'reparto',
    });
  });

  it('lo que no se puede unir lo dice', () => {
    expect(unionDe(FILA, TESOROS, `paso-${HOGAR}`, `parte-${COCOS}`)).toBeNull();
    expect(fraseDeLaUnion(FILA, nombreDe, null, true)).toBe('Ahí no se puede unir');
    expect(fraseDeLaUnion(FILA, nombreDe, null, false)).toBe('Llevala hasta un tesoro');
  });
});

describe('mover con el teclado', () => {
  it('dice el lugar en la fila, sin coordenadas', () => {
    expect(anuncioDelMovimiento(FILA, MATERIALES, 'Materiales', -1)).toBe(
      'Materiales pasa a ser el paso 1 de 2.',
    );
    expect(anuncioDelMovimiento(FILA, HOGAR, 'Hogar', -1)).toBe('Hogar ya es el primer paso.');
    expect(anuncioDelMovimiento(FILA, MATERIALES, 'Materiales', 1)).toBe(
      'Materiales ya es el último paso.',
    );
  });
});
