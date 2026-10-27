import {
  centavos,
  centavosEn,
  enPesos,
  filaDeSiempre,
  plata,
  puntosBasicos,
  type Fila,
  type PasoDeLaFila,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { FraseDelDiezmo } from '@/entities/movimiento';
import type { TesoroDelTaller } from '@/entities/tesoro';

import { detalleDeLaTarjeta, tipoEnLaTarjeta, tiposEnLasTarjetas } from './tesoros';

function tesoro(
  id: string,
  clave: TesoroDelTaller['clave'],
  extra: Partial<TesoroDelTaller> = {},
): TesoroDelTaller {
  return {
    id,
    clave,
    moneda: 'ARS',
    nombre: id,
    descripcion: `Para qué es ${id}`,
    tinta: clave ?? 'grana',
    icono: 'vault',
    meta: null,
    metaFecha: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(centavos(100_000)),
    ...extra,
  };
}

function paso(tesoroId: string, clase: PasoDeLaFila['clase'], extra: Partial<PasoDeLaFila> = {}) {
  return {
    tesoro: tesoroId,
    clase,
    tope: centavos(90_000_000),
    renglones: [],
    desde: null,
    modo: 'mes' as const,
    hastaLaMeta: false,
    dia: null,
    pagaSola: false,
    pagaSolaDesde: null,
    ...extra,
  };
}

const META = enPesos(centavos(2_000_000_000));

const FILA: Fila = {
  obligaciones: [
    { tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso', montoFijo: null },
    {
      tesoro: 'contador',
      porcentaje: puntosBasicos(100),
      base: 'cobrado',
      montoFijo: centavos(5_000_000),
    },
  ],
  pasos: [
    paso('hogar', 'sueldo'),
    paso('maun', 'fijos'),
    paso('alquiler', 'fijos', { dia: 10, pagaSola: true, pagaSolaDesde: '2026-10-10' }),
    paso('materiales', 'prioridad'),
    paso('maquinas', 'prioridad', { hastaLaMeta: true }),
  ],
  reparto: [
    { tesoro: 'cocos', porcentaje: puntosBasicos(5000), hastaLaMeta: false },
    { tesoro: 'inmuebles', porcentaje: puntosBasicos(2000), hastaLaMeta: true },
  ],
  superavit: 'superavit',
  sueldoPorTrabajo: false,
};

const DEBE: FraseDelDiezmo = {
  situacion: 'debe',
  titulo: 'Debés',
  importe: '$ 270.000',
  frase: 'Debés $ 270.000',
  detalle: 'de lo que ya cobraste y todavía no diste',
};

describe('el tipo en la tarjeta de Inicio', () => {
  it('cada tesoro dice lo que es: una deuda destinada, una deuda obligatoria, una meta o una caja', () => {
    const tipoDe = (uno: TesoroDelTaller) => tipoEnLaTarjeta(FILA, uno);

    expect(tipoDe(tesoro('diezmo', 'diezmo'))).toBe('Deuda destinada');
    expect(tipoDe(tesoro('contador', null))).toBe('Deuda destinada');
    expect(tipoDe(tesoro('hogar', 'hogar'))).toBe('Deuda obligatoria');
    expect(tipoDe(tesoro('alquiler', null))).toBe('Deuda obligatoria');
    expect(tipoDe(tesoro('maquinas', null, { meta: META }))).toBe('Meta');
    expect(tipoDe(tesoro('inmuebles', null, { meta: META }))).toBe('Meta');
    expect(tipoDe(tesoro('viaje', null, { meta: META }))).toBe('Meta');
    expect(tipoDe(tesoro('maun', 'maun'))).toBe('Caja');
    expect(tipoDe(tesoro('superavit', null))).toBe('Caja');
    expect(tipoDe(tesoro('materiales', null))).toBe('Caja');
    expect(tipoDe(tesoro('cocos', 'cocos'))).toBe('Caja');
    expect(tipoDe(tesoro('estante', null))).toBe('Caja');
  });

  it('uno en dólares con su meta en dólares es una meta, y sin meta una caja', () => {
    const enDolares = (meta: TesoroDelTaller['meta']) =>
      tesoro('dolares', null, { moneda: 'USD', meta, saldo: plata('USD', centavosEn('USD', 0)) });

    expect(tipoEnLaTarjeta(FILA, enDolares(plata('USD', centavosEn('USD', 200_000))))).toBe('Meta');
    expect(tipoEnLaTarjeta(FILA, enDolares(null))).toBe('Caja');
  });

  it('con la fila de siempre, Maun es una caja aunque junte los costos fijos, y Cocos con meta es una meta', () => {
    const deSiempre = filaDeSiempre(
      {
        sueldoMensual: centavos(180_000_000),
        costosFijos: centavos(90_000_000),
        sueldoTopeMensual: true,
      },
      { hogar: 'hogar', maun: 'maun', diezmo: 'diezmo' },
    );
    expect(tipoEnLaTarjeta(deSiempre, tesoro('maun', 'maun'))).toBe('Caja');
    expect(tipoEnLaTarjeta(deSiempre, tesoro('hogar', 'hogar'))).toBe('Deuda obligatoria');
    expect(tipoEnLaTarjeta(deSiempre, tesoro('diezmo', 'diezmo'))).toBe('Deuda destinada');
    expect(tipoEnLaTarjeta(deSiempre, tesoro('cocos', 'cocos'))).toBe('Caja');
    expect(tipoEnLaTarjeta(deSiempre, tesoro('cocos', 'cocos', { meta: META }))).toBe('Meta');
  });

  it('todas las tarjetas llevan su tipo, también las del estante', () => {
    const tipos = tiposEnLasTarjetas(FILA, [
      tesoro('hogar', 'hogar'),
      tesoro('maun', 'maun'),
      tesoro('diezmo', 'diezmo'),
      tesoro('viaje', null, { meta: META }),
      tesoro('estante', null),
    ]);
    expect([...tipos]).toEqual([
      ['hogar', 'Deuda obligatoria'],
      ['maun', 'Caja'],
      ['diezmo', 'Deuda destinada'],
      ['viaje', 'Meta'],
      ['estante', 'Caja'],
    ]);
  });
});

describe('el detalle de la tarjeta de una meta', () => {
  it('con fecha, dice para cuándo quiere llegar', () => {
    const conFecha = tesoro('viaje', null, {
      saldo: enPesos(centavos(500_000_000)),
      meta: META,
      metaFecha: '2027-03-31',
    });
    expect(detalleDeLaTarjeta(conFecha, DEBE)).toEqual({
      texto: '25% de la meta, para marzo de 2027',
      delDueno: false,
    });
  });

  it('sin fecha, dice solo cuánto lleva', () => {
    const sinFecha = tesoro('viaje', null, {
      saldo: enPesos(centavos(500_000_000)),
      meta: META,
    });
    expect(detalleDeLaTarjeta(sinFecha, DEBE)).toEqual({
      texto: '25% de la meta',
      delDueno: false,
    });
  });
});
