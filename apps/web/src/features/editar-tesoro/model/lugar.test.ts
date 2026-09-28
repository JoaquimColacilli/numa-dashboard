import { centavos, puntosBasicos, type Fila, type PasoDeLaFila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  fraseDelLibre,
  opcionesDeLugar,
  porcentajeSugerido,
  revisarElLugar,
  tituloDelPaso,
} from './lugar';

function paso(tesoro: string): PasoDeLaFila {
  return { tesoro, clase: 'prioridad', tope: centavos(100), renglones: [], desde: null };
}

const FILA: Fila = {
  pasos: [paso('a')],
  reparto: [
    { tesoro: 'b', porcentaje: puntosBasicos(5000) },
    { tesoro: 'c', porcentaje: puntosBasicos(3000) },
  ],
  sueldoPorTrabajo: false,
};

describe('dónde va un tesoro nuevo', () => {
  it('ofrece el estante, un paso al final y el reparto mientras entren', () => {
    expect(opcionesDeLugar(FILA).map((opcion) => [opcion.id, opcion.sePuede])).toEqual([
      ['estante', true],
      ['paso', true],
      ['reparto', true],
    ]);
  });

  it('no ofrece un paso con la fila llena ni el reparto que ya suma 100%', () => {
    const llena: Fila = {
      pasos: Array.from({ length: 12 }, (_, indice) => paso(String(indice))),
      reparto: [{ tesoro: 'b', porcentaje: puntosBasicos(10_000) }],
      sueldoPorTrabajo: false,
    };
    const [, comoPaso, enElReparto] = opcionesDeLugar(llena);
    expect(comoPaso).toMatchObject({ sePuede: false, detalle: 'Entran hasta 12 pasos.' });
    expect(enElReparto).toMatchObject({ sePuede: false, detalle: 'El reparto ya suma 100%.' });

    const ocho: Fila = {
      pasos: [],
      reparto: Array.from({ length: 8 }, (_, indice) => ({
        tesoro: String(indice),
        porcentaje: puntosBasicos(100),
      })),
      sueldoPorTrabajo: false,
    };
    expect(opcionesDeLugar(ocho)[2]).toMatchObject({
      sePuede: false,
      detalle: 'El reparto admite hasta 8 tesoros.',
    });
  });

  it('el paso dice dónde va a quedar: al final, al principio o después del paso desde donde se pidió', () => {
    const tres: Fila = { ...FILA, pasos: [paso('a'), paso('b'), paso('c')] };
    const nombres: Record<string, string> = { a: 'Hogar', b: 'Gastos fijos', c: 'Materiales' };
    const nombreDe = (tesoro: string) => nombres[tesoro] ?? '';
    const titulo = (despuesDe?: string | null) =>
      opcionesDeLugar(tres, despuesDe, nombreDe).find((opcion) => opcion.id === 'paso')?.titulo;
    expect(titulo()).toBe('Como paso, al final');
    expect(titulo('c')).toBe('Como paso, al final');
    expect(titulo(null)).toBe('Como paso 1, al principio');
    expect(titulo('b')).toBe('Como paso 3, después de Gastos fijos');
    expect(titulo('a')).toBe('Como paso 2, después de Hogar');
    expect(tituloDelPaso({ pasos: [] }, null, nombreDe)).toBe('Como paso, al final');
  });

  it('sugiere hasta 10% y dice cuánto queda libre', () => {
    expect(porcentajeSugerido(2000)).toBe('10');
    expect(porcentajeSugerido(550)).toBe('5,5');
    expect(fraseDelLibre(2000, '10')).toBe(
      'Queda libre el 20% del reparto: con 10%, Maun se queda con el otro 10%.',
    );
    expect(fraseDelLibre(2000, '20')).toBe(
      'Queda libre el 20% del reparto: con 20%, el reparto llega al 100%.',
    );
    expect(fraseDelLibre(2000, '30')).toBe('Queda libre el 20% del reparto.');
  });

  it('arma el lugar con su tope o su porcentaje, y frena lo que no se puede', () => {
    expect(revisarElLugar('estante', null, '', FILA)).toEqual({ dondeVa: { lugar: 'estante' } });
    expect(revisarElLugar('paso', 30_000_000, '', FILA)).toEqual({
      dondeVa: { lugar: 'paso', tope: 30_000_000 },
    });
    expect(revisarElLugar('paso', null, '', FILA).errores?.tope).toBe(
      'Poné hasta cuánto recibe por mes.',
    );
    expect(revisarElLugar('paso', 0, '', FILA).errores?.tope).toBeDefined();
    expect(revisarElLugar('reparto', null, '12,5', FILA)).toEqual({
      dondeVa: { lugar: 'reparto', porcentaje: 1250 },
    });
    expect(revisarElLugar('reparto', null, '25', FILA).errores?.porcentaje).toBe(
      'Poné un porcentaje de 0,01 a 20, lo que queda libre.',
    );
    expect(revisarElLugar('reparto', null, '0', FILA).errores?.porcentaje).toBeDefined();
  });
});
