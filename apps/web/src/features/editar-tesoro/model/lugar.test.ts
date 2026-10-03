import {
  centavos,
  MONTO_MAXIMO_DE_LA_FILA,
  puntosBasicos,
  TOPE_DE_OBLIGACIONES,
  type Fila,
  type PasoDeLaFila,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  dondeEntra,
  fraseDelLibre,
  opcionesDeLugar,
  porcentajeSugerido,
  revisarElLugar,
  SUGERENCIAS_DEL_LUGAR,
  type LoQueSePide,
} from './lugar';

function paso(tesoro: string): PasoDeLaFila {
  return {
    tesoro,
    clase: 'prioridad',
    tope: centavos(100),
    renglones: [],
    desde: null,
    modo: 'mes',
    hastaLaMeta: false,
  };
}

function parte(tesoro: string, porcentaje: number) {
  return { tesoro, porcentaje: puntosBasicos(porcentaje), hastaLaMeta: false };
}

const SIN_PASOS = {
  obligaciones: [{ tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso' as const }],
  superavit: 'maun',
  sueldoPorTrabajo: false,
};

const FILA: Fila = {
  ...SIN_PASOS,
  pasos: [paso('a')],
  reparto: [parte('b', 5000), parte('c', 3000)],
};

const PIDE: LoQueSePide = { monto: null, porcentaje: '', base: 'ingreso', antesDelDiezmo: false };

describe('dónde va un tesoro nuevo en dólares', () => {
  it('solo al estante, y dice por qué', () => {
    expect(opcionesDeLugar(FILA, 'Maun', 'USD')).toEqual([
      {
        id: 'estante',
        titulo: 'Al estante',
        detalle: 'La fila reparte pesos: un tesoro en dólares queda en el estante.',
        sePuede: true,
      },
    ]);
  });
});

describe('dónde va un tesoro nuevo', () => {
  it('ofrece el estante y los cinco lugares de la fila, cada uno con lo que es', () => {
    const opciones = opcionesDeLugar(FILA, 'Maun');
    expect(opciones.map((opcion) => [opcion.id, opcion.titulo, opcion.sePuede])).toEqual([
      ['estante', 'Al estante', true],
      ['obligacion', 'Como obligación', true],
      ['compromiso', 'Como compromiso', true],
      ['ahorro-fijo', 'Como ahorro fijo', true],
      ['reparto', 'En el reparto', true],
      ['superavit', 'Que reciba lo que sobra', true],
    ]);
    expect(opciones.at(-1)?.detalle).toBe('Recibe lo que sobra, en lugar de Maun');
  });

  it('no ofrece lo que ya está lleno, y dice por qué', () => {
    const llena: Fila = {
      ...SIN_PASOS,
      obligaciones: Array.from({ length: TOPE_DE_OBLIGACIONES }, (_, indice) => ({
        tesoro: `o${String(indice)}`,
        porcentaje: puntosBasicos(100),
        base: 'ingreso' as const,
      })),
      pasos: Array.from({ length: 12 }, (_, indice) => paso(String(indice))),
      reparto: [parte('b', 10_000)],
    };
    const [, obligacion, compromiso, ahorroFijo, reparto] = opcionesDeLugar(llena);
    expect(obligacion).toMatchObject({ sePuede: false, detalle: 'Entran hasta 6 obligaciones.' });
    expect(compromiso).toMatchObject({
      sePuede: false,
      detalle: 'Entran hasta 12 compromisos y ahorros fijos.',
    });
    expect(ahorroFijo).toMatchObject({ sePuede: false });
    expect(reparto).toMatchObject({ sePuede: false, detalle: 'El reparto ya suma 100%.' });

    const ocho: Fila = {
      ...SIN_PASOS,
      pasos: [],
      reparto: Array.from({ length: 8 }, (_, indice) => parte(String(indice), 100)),
    };
    expect(opcionesDeLugar(ocho)[4]).toMatchObject({
      sePuede: false,
      detalle: 'El reparto admite hasta 8 tesoros.',
    });
  });

  it('dice dónde entra adentro de su tipo: al final, al principio o después de quien se pidió', () => {
    const nombreDe = (tesoro: string) => (tesoro === 'a' ? 'Hogar' : '');
    expect(dondeEntra('compromiso', undefined, nombreDe)).toBe('Al final de su tipo');
    expect(dondeEntra('obligacion', null, nombreDe)).toBe('Al principio de su tipo');
    expect(dondeEntra('ahorro-fijo', 'a', nombreDe)).toBe('Después de Hogar');
    expect(dondeEntra('reparto', 'a', nombreDe)).toBeNull();
    expect(dondeEntra('superavit', undefined, nombreDe)).toBeNull();
    expect(dondeEntra('estante', undefined, nombreDe)).toBeNull();
  });

  it('sugiere nombres según el lugar, e Ingresos Brutos sobre lo que cobrás y antes del diezmo', () => {
    expect(SUGERENCIAS_DEL_LUGAR.obligacion).toEqual([
      { nombre: 'Ingresos Brutos', icono: 'landmark', base: 'cobrado', antesDelDiezmo: true },
    ]);
    const nombres = (lugar: keyof typeof SUGERENCIAS_DEL_LUGAR) =>
      SUGERENCIAS_DEL_LUGAR[lugar].map((sugerencia) => sugerencia.nombre);
    expect(nombres('compromiso')).toEqual(['Gastos fijos', 'Sueldos', 'Alquiler', 'Cuotas']);
    expect(nombres('ahorro-fijo')).toEqual([
      'Stock del taller',
      'Maquinaria',
      'Vehículo',
      'Inmueble',
    ]);
    expect(nombres('reparto')).toEqual(nombres('ahorro-fijo'));
    expect(nombres('superavit')).toEqual(['Superávit']);
    expect(nombres('estante')).toEqual([]);
  });

  it('sugiere hasta 10% y dice cuánto queda libre y quién se queda con el resto', () => {
    expect(porcentajeSugerido(2000)).toBe('10');
    expect(porcentajeSugerido(550)).toBe('5,5');
    expect(fraseDelLibre(2000, '10')).toBe(
      'Queda libre el 20% del reparto: con 10%, Maun se queda con el otro 10%.',
    );
    expect(fraseDelLibre(2000, '10', 'Superávit')).toBe(
      'Queda libre el 20% del reparto: con 10%, Superávit se queda con el otro 10%.',
    );
    expect(fraseDelLibre(2000, '20')).toBe(
      'Queda libre el 20% del reparto: con 20%, el reparto llega al 100%.',
    );
    expect(fraseDelLibre(2000, '30')).toBe('Queda libre el 20% del reparto.');
  });

  it('arma el lugar con su monto o su porcentaje, y frena lo que no se puede', () => {
    expect(revisarElLugar('estante', PIDE, FILA)).toEqual({ dondeVa: { lugar: 'estante' } });
    expect(revisarElLugar('superavit', PIDE, FILA)).toEqual({ dondeVa: { lugar: 'superavit' } });
    expect(revisarElLugar('compromiso', { ...PIDE, monto: 30_000_000 }, FILA)).toEqual({
      dondeVa: { lugar: 'compromiso', monto: 30_000_000 },
    });
    expect(revisarElLugar('ahorro-fijo', { ...PIDE, monto: 5_000_000 }, FILA)).toEqual({
      dondeVa: { lugar: 'ahorro-fijo', monto: 5_000_000 },
    });
    expect(revisarElLugar('ahorro-fijo', PIDE, FILA).errores?.monto).toBe(
      'Poné hasta cuánto recibe.',
    );
    expect(revisarElLugar('compromiso', { ...PIDE, monto: 0 }, FILA).errores?.monto).toBeDefined();
    expect(
      revisarElLugar('compromiso', { ...PIDE, monto: MONTO_MAXIMO_DE_LA_FILA + 1 }, FILA).errores
        ?.monto,
    ).toBe('El monto no puede ser tan grande.');
    expect(
      revisarElLugar(
        'obligacion',
        { ...PIDE, porcentaje: '3,5', base: 'cobrado', antesDelDiezmo: true },
        FILA,
      ),
    ).toEqual({
      dondeVa: { lugar: 'obligacion', porcentaje: 350, base: 'cobrado', antesDelDiezmo: true },
    });
    expect(revisarElLugar('obligacion', PIDE, FILA).errores?.porcentaje).toBe(
      'Poné un porcentaje de 0,01 a 100.',
    );
    expect(revisarElLugar('reparto', { ...PIDE, porcentaje: '12,5' }, FILA)).toEqual({
      dondeVa: { lugar: 'reparto', porcentaje: 1250 },
    });
    expect(revisarElLugar('reparto', { ...PIDE, porcentaje: '25' }, FILA).errores?.porcentaje).toBe(
      'Poné un porcentaje de 0,01 a 20, lo que queda libre.',
    );
    expect(
      revisarElLugar('reparto', { ...PIDE, porcentaje: '0' }, FILA).errores?.porcentaje,
    ).toBeDefined();
  });
});
