import {
  centavos,
  centavosEn,
  enPesos,
  filaDelMes,
  filaDeSiempre,
  plataEn,
  puntosBasicos,
  type DatosDelMes,
  type Fila,
  type Money,
  type MovimientoDelLibro,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';

import { cifrasDelPanorama, gastadoEnLosRenglones, panoramaDelTaller } from './panorama';

const SISTEMA = { hogar: 'hogar', maun: 'maun', diezmo: 'diezmo' };

function tesoro(
  id: string,
  clave: TesoroDelTaller['clave'],
  saldo: number,
  archivado = false,
): TesoroDelTaller {
  return {
    id,
    clave,
    moneda: 'ARS',
    nombre: id,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta: null,
    metaFecha: null,
    orden: 0,
    archivado,
    saldo: enPesos(centavos(saldo)),
  };
}

function conMeta(uno: TesoroDelTaller, meta: number): TesoroDelTaller {
  return { ...uno, meta: enPesos(centavos(meta)) };
}

function saldosDe(tesoros: readonly TesoroDelTaller[]): Map<string, Money> {
  return new Map(tesoros.map((uno) => [uno.id, centavos(uno.saldo.importe)]));
}

function gasto(
  categoria: string,
  monto: number,
  fecha = '2026-09-12',
  desdeId = 'maun',
): MovimientoDelLibro {
  return {
    id: `${categoria}-${fecha}`,
    fecha,
    tipo: 'gasto',
    tesoroOrigen: desdeId === 'maun' ? 'maun' : null,
    tesoroDestino: null,
    desdeId,
    haciaId: null,
    monto: centavos(monto),
    categoria,
    descripcion: '',
    proyectoId: null,
  };
}

describe('el panorama de Inicio con la fila de siempre: el hogar y el diezmo son para pagar, Maun es una caja', () => {
  const fila = filaDeSiempre(
    {
      sueldoMensual: centavos(180_000_000),
      costosFijos: centavos(90_000_000),
      sueldoTopeMensual: true,
    },
    SISTEMA,
  );
  const tesoros = [
    tesoro('hogar', 'hogar', 41_230_000),
    tesoro('maun', 'maun', 124_800_000),
    tesoro('diezmo', 'diezmo', 27_000_000),
    tesoro('cocos', 'cocos', 341_500_000),
  ];
  const datos: DatosDelMes = {
    liquidaciones: [
      {
        fecha: '2026-09-03',
        neta: centavos(270_000_000),
        diezmo: centavos(27_000_000),
        aportes: [
          { tesoro: 'hogar', monto: centavos(180_000_000) },
          { tesoro: 'maun', monto: centavos(63_000_000) },
        ],
        remanente: centavos(0),
      },
    ],
    coberturas: [],
    saldos: saldosDe(tesoros),
    metas: new Map(),
    gastos: [],
    pagos: [],
  };
  const delMes = filaDelMes(fila, SISTEMA, datos, '2026-09');
  const movimientos = [
    gasto('Costos fijos', 20_000_000),
    gasto('  costos FIJOS ', 1_000_000),
    gasto('Materiales', 5_000_000),
    gasto('Costos fijos', 10_000_000, '2026-08-20'),
  ];

  it('el saldo de las deudas y lo que el paso de Maun juntó en el mes, menos lo que ya se pagó con su nombre, es para pagar', () => {
    expect(gastadoEnLosRenglones(movimientos, 'maun', ['Costos fijos'], '2026-09')).toBe(
      21_000_000,
    );

    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros,
      movimientos,
      insumos: centavos(60_000_000),
      trabajosConInsumos: 2,
    });
    expect(panorama).toMatchObject({
      compromisoDeMaun: 42_000_000,
      paraPagar: 41_230_000 + 27_000_000 + 42_000_000,
      metas: 0,
      cajas: 124_800_000 - 60_000_000 - 42_000_000 + 341_500_000,
      insumos: 60_000_000,
      tesorosParaPagar: 3,
      tesorosDeMetas: 0,
      tesorosDeCajas: 2,
      enDolares: null,
    });
    expect(
      cifrasDelPanorama(panorama).map((cifra) => [
        cifra.etiqueta,
        cifra.monto.importe,
        cifra.detalle,
      ]),
    ).toEqual([
      ['Para pagar', 110_230_000, 'en 3 tesoros'],
      ['Metas', 0, 'todavía sin metas'],
      ['Cajas', 364_300_000, 'en 2 cajas, sin los insumos'],
      ['Insumos de los trabajos', 60_000_000, 'de 2 trabajos'],
    ]);
  });

  it('nunca es menos de 0, y sin su paso Maun no aparta nada para pagar', () => {
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros,
      movimientos: [gasto('Costos fijos', 90_000_000)],
      insumos: centavos(0),
      trabajosConInsumos: 0,
    });
    expect(panorama.compromisoDeMaun).toBe(0);
    expect(panorama.paraPagar).toBe(41_230_000 + 27_000_000);
    expect(panorama.tesorosParaPagar).toBe(2);
    expect(panorama.cajas).toBe(124_800_000 + 341_500_000);

    const sinFijos = filaDeSiempre(
      { sueldoMensual: centavos(180_000_000), costosFijos: centavos(0), sueldoTopeMensual: true },
      SISTEMA,
    );
    const otroMes = filaDelMes(sinFijos, SISTEMA, datos, '2026-09');
    expect(
      panoramaDelTaller({
        fila: sinFijos,
        delMes: otroMes,
        sistema: SISTEMA,
        tesoros,
        movimientos,
        insumos: centavos(0),
        trabajosConInsumos: 0,
      }).compromisoDeMaun,
    ).toBe(0);
  });

  it('una deuda en negativo no tiene nada para pagar y no se cuenta', () => {
    const conElHogarEnNegativo = tesoros.map((uno) =>
      uno.id === 'hogar' ? tesoro('hogar', 'hogar', -5_000_000) : uno,
    );
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros: conElHogarEnNegativo,
      movimientos,
      insumos: centavos(0),
      trabajosConInsumos: 0,
    });
    expect(panorama.paraPagar).toBe(27_000_000 + 42_000_000);
    expect(panorama.tesorosParaPagar).toBe(2);
    expect(panorama.cajas).toBe(124_800_000 - 42_000_000 + 341_500_000);
  });

  it('con meta, Cocos va a las metas; si los insumos y el compromiso de Maun no entran en las cajas, quedan en negativo y lo dice', () => {
    const conLaMetaDeCocos = tesoros.map((uno) =>
      uno.clave === 'cocos' ? conMeta(uno, 500_000_000) : uno,
    );
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros: conLaMetaDeCocos,
      movimientos,
      insumos: centavos(200_000_000),
      trabajosConInsumos: 1,
    });
    expect(panorama).toMatchObject({
      metas: 341_500_000,
      tesorosDeMetas: 1,
      cajas: 124_800_000 - 200_000_000 - 42_000_000,
      tesorosDeCajas: 1,
    });
    const cifras = cifrasDelPanorama(panorama);
    expect(cifras[1]?.detalle).toBe('en un tesoro');
    expect(cifras[2]?.detalle).toBe('no alcanzan para los insumos');
    expect(cifras[3]?.detalle).toBe('de un trabajo');

    const sinInsumos = cifrasDelPanorama({
      ...panorama,
      cajas: centavos(-40_000_000),
      insumos: centavos(0),
      compromisoDeMaun: centavos(0),
    });
    expect(sinInsumos[2]?.detalle).toBe('en una caja, sin los insumos');
  });
});

describe('el panorama con los tipos de tesoro: para pagar, metas, cajas y los dólares aparte', () => {
  const fila: Fila = {
    obligaciones: [
      { tesoro: 'iibb', porcentaje: puntosBasicos(350), base: 'cobrado', montoFijo: null },
      { tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso', montoFijo: null },
      {
        tesoro: 'contador',
        porcentaje: puntosBasicos(100),
        base: 'cobrado',
        montoFijo: centavos(5_000_000),
      },
    ],
    pasos: [
      {
        tesoro: 'hogar',
        clase: 'sueldo',
        tope: centavos(180_000_000),
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
        dia: null,
        pagaSola: false,
        pagaSolaDesde: null,
      },
      {
        tesoro: 'fijos',
        clase: 'fijos',
        tope: centavos(90_000_000),
        renglones: [
          { nombre: 'Alquiler', monto: centavos(50_000_000), dia: 10 },
          { nombre: 'Luz', monto: centavos(40_000_000), dia: null },
        ],
        desde: '2026-09',
        modo: 'saldo',
        hastaLaMeta: false,
        dia: null,
        pagaSola: false,
        pagaSolaDesde: null,
      },
      {
        tesoro: 'materiales',
        clase: 'prioridad',
        tope: centavos(30_000_000),
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
        dia: null,
        pagaSola: false,
        pagaSolaDesde: null,
      },
    ],
    reparto: [{ tesoro: 'inmuebles', porcentaje: puntosBasicos(2000), hastaLaMeta: true }],
    superavit: 'superavit',
    sueldoPorTrabajo: false,
  };
  const tesoros: TesoroDelTaller[] = [
    tesoro('hogar', 'hogar', 10_000_000),
    tesoro('maun', 'maun', 100_000_000),
    tesoro('diezmo', 'diezmo', 19_125_000),
    tesoro('cocos', 'cocos', 50_000_000),
    tesoro('iibb', null, 8_750_000),
    tesoro('contador', null, 2_500_000),
    tesoro('fijos', null, 63_000_000),
    tesoro('materiales', null, 18_500_000),
    conMeta(tesoro('inmuebles', null, 25_000_000), 30_000_000),
    conMeta(tesoro('viaje', null, 7_000_000), 40_000_000),
    tesoro('superavit', null, 15_000_000),
    tesoro('viejo', null, 0, true),
    {
      ...tesoro('dolares', null, 0),
      moneda: 'USD',
      saldo: plataEn('USD', centavosEn('USD', 100_000)),
    },
  ];
  const delMes = filaDelMes(
    fila,
    SISTEMA,
    {
      liquidaciones: [],
      coberturas: [],
      saldos: saldosDe(tesoros.filter((uno) => uno.moneda === 'ARS')),
      metas: new Map([['inmuebles', centavos(30_000_000)]]),
      gastos: [],
      pagos: [],
    },
    '2026-09',
  );

  it('las deudas destinadas y las obligatorias (el hogar también) son para pagar, las que tienen meta son metas y el resto, cajas', () => {
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros,
      movimientos: [],
      insumos: centavos(60_000_000),
      trabajosConInsumos: 1,
    });
    expect(panorama).toMatchObject({
      paraPagar: 10_000_000 + 19_125_000 + 8_750_000 + 2_500_000 + 63_000_000,
      metas: 25_000_000 + 7_000_000,
      cajas: 100_000_000 - 60_000_000 + 50_000_000 + 18_500_000 + 15_000_000,
      compromisoDeMaun: 0,
      tesorosParaPagar: 5,
      tesorosDeMetas: 2,
      tesorosDeCajas: 4,
    });
    expect(
      cifrasDelPanorama(panorama).map((cifra) => [cifra.id, cifra.monto.importe, cifra.detalle]),
    ).toEqual([
      ['para-pagar', 103_375_000, 'en 5 tesoros'],
      ['metas', 32_000_000, 'en 2 tesoros'],
      ['cajas', 123_500_000, 'en 4 cajas, sin los insumos'],
      ['insumos', 60_000_000, 'de un trabajo'],
      ['en-dolares', 100_000, 'en un tesoro'],
    ]);
  });

  it('los dólares no se suman a ningún grupo: van aparte, con su equivalente si hubo un cambio', () => {
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros,
      movimientos: [],
      insumos: centavos(0),
      trabajosConInsumos: 0,
    });
    expect(panorama.enDolares).toEqual({
      total: 100_000,
      tesoros: 1,
      ultimoCambio: null,
    });
    const [, , , , enDolares] = cifrasDelPanorama(panorama);
    expect(enDolares).toMatchObject({
      etiqueta: 'En dólares',
      monto: { moneda: 'USD', importe: 100_000 },
      equivalente: null,
    });

    const sinLosDolares = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros: tesoros.filter((uno) => uno.moneda === 'ARS'),
      movimientos: [],
      insumos: centavos(0),
      trabajosConInsumos: 0,
    });
    expect(sinLosDolares).toMatchObject({
      paraPagar: panorama.paraPagar,
      metas: panorama.metas,
      cajas: panorama.cajas,
      enDolares: null,
    });
    expect(cifrasDelPanorama(sinLosDolares).map((cifra) => cifra.id)).toEqual([
      'para-pagar',
      'metas',
      'cajas',
      'insumos',
    ]);
  });

  it('sin nada, lo dice con sus palabras', () => {
    const panorama = panoramaDelTaller({
      fila: { ...fila, obligaciones: [], pasos: [], reparto: [] },
      delMes: { ...delMes, obligaciones: [], pasos: [], reparto: [] },
      sistema: SISTEMA,
      tesoros: [tesoro('maun', 'maun', 0), tesoro('superavit', null, 0)],
      movimientos: [],
      insumos: centavos(0),
      trabajosConInsumos: 0,
    });
    expect(cifrasDelPanorama(panorama).map((cifra) => cifra.detalle)).toEqual([
      'nada pendiente',
      'todavía sin metas',
      'en 2 cajas, sin los insumos',
      'sin trabajos en curso',
    ]);
  });
});
