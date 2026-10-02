import {
  centavos,
  enPesos,
  filaDelMes,
  filaDeSiempre,
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
    rindeAnualBp: null,
    orden: 0,
    archivado,
    saldo: enPesos(centavos(saldo)),
  };
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

describe('el panorama de Inicio con la fila de siempre: Maun es compromiso y superávit', () => {
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
  };
  const delMes = filaDelMes(fila, SISTEMA, datos, '2026-09');
  const movimientos = [
    gasto('Costos fijos', 20_000_000),
    gasto('  costos FIJOS ', 1_000_000),
    gasto('Materiales', 5_000_000),
    gasto('Costos fijos', 10_000_000, '2026-08-20'),
  ];

  it('lo que el paso de Maun juntó en el mes, menos lo que ya se pagó con su nombre, es para pagar', () => {
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
      paraPagar: 69_000_000,
      ahorros: 341_500_000,
      superavit: 124_800_000 - 60_000_000 - 42_000_000,
      insumos: 60_000_000,
      tesorosParaPagar: 2,
      tesorosDeAhorro: 1,
      tesoroDelSuperavit: 'maun',
    });
    expect(
      cifrasDelPanorama(panorama, 'Maun').map((cifra) => [
        cifra.etiqueta,
        cifra.monto.importe,
        cifra.detalle,
      ]),
    ).toEqual([
      ['Para pagar', 69_000_000, 'en 2 tesoros'],
      ['Ahorros', 341_500_000, 'en un tesoro'],
      ['Superávit', 22_800_000, 'en Maun'],
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
    expect(panorama.paraPagar).toBe(27_000_000);
    expect(panorama.superavit).toBe(124_800_000);

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

  it('si los trabajos tienen más de lo que hay en Maun, el superávit queda en negativo y lo dice', () => {
    const panorama = panoramaDelTaller({
      fila,
      delMes,
      sistema: SISTEMA,
      tesoros,
      movimientos,
      insumos: centavos(200_000_000),
      trabajosConInsumos: 1,
    });
    expect(panorama.superavit).toBe(124_800_000 - 200_000_000 - 42_000_000);
    expect(cifrasDelPanorama(panorama, 'Maun')[2]?.detalle).toBe('en Maun, que no alcanza');
    expect(cifrasDelPanorama(panorama, 'Maun')[3]?.detalle).toBe('de un trabajo');
  });
});

describe('el panorama con los tipos de Eliseo y el superávit aparte', () => {
  const fila: Fila = {
    obligaciones: [
      { tesoro: 'iibb', porcentaje: puntosBasicos(350), base: 'cobrado' },
      { tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso' },
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
      },
      {
        tesoro: 'materiales',
        clase: 'prioridad',
        tope: centavos(30_000_000),
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
      },
    ],
    reparto: [{ tesoro: 'inmuebles', porcentaje: puntosBasicos(2000), hastaLaMeta: true }],
    superavit: 'superavit',
    sueldoPorTrabajo: false,
  };
  const tesoros = [
    tesoro('hogar', 'hogar', 10_000_000),
    tesoro('maun', 'maun', 100_000_000),
    tesoro('diezmo', 'diezmo', 19_125_000),
    tesoro('cocos', 'cocos', 50_000_000),
    tesoro('iibb', null, 8_750_000),
    tesoro('fijos', null, 63_000_000),
    tesoro('materiales', null, 18_500_000),
    tesoro('inmuebles', null, 25_000_000),
    tesoro('superavit', null, 15_000_000),
    tesoro('viejo', null, 0, true),
  ];
  const delMes = filaDelMes(
    fila,
    SISTEMA,
    {
      liquidaciones: [],
      coberturas: [],
      saldos: saldosDe(tesoros),
      metas: new Map([['inmuebles', centavos(30_000_000)]]),
      gastos: [],
    },
    '2026-09',
  );

  it('para pagar suma las obligaciones y los compromisos; ahorros, los ahorros y lo del estante', () => {
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
      paraPagar: 8_750_000 + 19_125_000 + 63_000_000,
      ahorros: 18_500_000 + 25_000_000 + 50_000_000,
      superavit: 15_000_000,
      compromisoDeMaun: 0,
      tesorosParaPagar: 3,
      tesorosDeAhorro: 3,
      tesoroDelSuperavit: 'superavit',
    });
    expect(cifrasDelPanorama(panorama, 'Superávit')[2]?.detalle).toBe('en Superávit');
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
    expect(cifrasDelPanorama(panorama, 'Superávit').map((cifra) => cifra.detalle)).toEqual([
      'nada pendiente',
      'todavía sin ahorros',
      'en Superávit',
      'sin trabajos en curso',
    ]);
  });
});
