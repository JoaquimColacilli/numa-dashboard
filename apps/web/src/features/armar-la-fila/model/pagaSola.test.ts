import {
  CATEGORIA_DE_LA_PLATA_DE_ANTES,
  CATEGORIA_DE_YA_NO_ESTA,
  centavos,
  puntosBasicos,
  type DatosDelMes,
  type Fila,
  type PasoDeLaFila,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  faltaElegir,
  loQueSePagaSolo,
  movimientosDeLaPlataDeAntes,
  type QueHacerConLaPlata,
  type QueSePagaSolo,
} from './pagaSola';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const ALQUILER = '01900000-0000-7000-8000-000000000005';
const SUELDOS = '01900000-0000-7000-8000-000000000006';
const LUZ = '01900000-0000-7000-8000-000000000007';
const MATERIALES = '01900000-0000-7000-8000-000000000008';
const HOY = '2026-09-27';

type Datos = Pick<DatosDelMes, 'liquidaciones' | 'coberturas' | 'saldos' | 'gastos'>;

const SIN_DATOS: Datos = { liquidaciones: [], coberturas: [], saldos: new Map(), gastos: [] };

function paso(tesoro: string, cambios: Partial<PasoDeLaFila> = {}): PasoDeLaFila {
  return {
    tesoro,
    clase: 'fijos',
    tope: centavos(10_000_000),
    renglones: [{ nombre: 'Alquiler', monto: centavos(10_000_000), dia: null }],
    desde: '2026-09',
    modo: 'mes',
    hastaLaMeta: false,
    dia: null,
    pagaSola: false,
    pagaSolaDesde: null,
    ...cambios,
  };
}

function filaCon(pasos: PasoDeLaFila[]): Fila {
  return {
    obligaciones: [
      { tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso', montoFijo: null },
    ],
    pasos,
    reparto: [],
    superavit: MAUN,
    sueldoPorTrabajo: false,
  };
}

const SUELDO_QUE_YA_SE_PAGABA = paso(HOGAR, {
  clase: 'sueldo',
  renglones: [],
  dia: 5,
  pagaSola: true,
  pagaSolaDesde: '2026-08-01',
});

const GUARDADA = filaCon([
  SUELDO_QUE_YA_SE_PAGABA,
  paso(ALQUILER),
  paso(SUELDOS),
  paso(LUZ),
  paso(MATERIALES, { clase: 'prioridad', renglones: [] }),
]);

function conAlquilerQueSePagaSolo(): Fila {
  return filaCon([
    SUELDO_QUE_YA_SE_PAGABA,
    paso(ALQUILER, { dia: 10, pagaSola: true, pagaSolaDesde: HOY }),
    paso(SUELDOS, { dia: 30, pagaSola: true, pagaSolaDesde: HOY }),
    paso(LUZ, { dia: 15 }),
    paso(MATERIALES, { clase: 'prioridad', renglones: [] }),
  ]);
}

describe('lo que pasa a pagarse solo al guardar la fila', () => {
  it('son solo los compromisos que antes no se pagaban solos, cada uno desde su próximo vencimiento', () => {
    expect(loQueSePagaSolo(GUARDADA, conAlquilerQueSePagaSolo(), SIN_DATOS, HOY)).toEqual([
      { tesoro: ALQUILER, desde: '2026-10-10', plataDeAntes: 0 },
      { tesoro: SUELDOS, desde: '2026-09-30', plataDeAntes: 0 },
    ]);
    expect(
      loQueSePagaSolo(GUARDADA, conAlquilerQueSePagaSolo(), SIN_DATOS, '2026-10-10').map((pago) => [
        pago.tesoro,
        pago.desde,
      ]),
    ).toEqual([
      [ALQUILER, '2026-11-10'],
      [SUELDOS, '2026-10-30'],
    ]);
    expect(loQueSePagaSolo(GUARDADA, GUARDADA, SIN_DATOS, HOY)).toEqual([]);
  });

  it('la plata de antes del ciclo es el saldo sin lo que juntó en este ciclo, más lo que ya adelantó para este vencimiento', () => {
    const datos: Datos = {
      saldos: new Map([[ALQUILER, centavos(8_000_000)]]),
      liquidaciones: [
        {
          fecha: '2026-09-05',
          neta: centavos(50_000_000),
          diezmo: centavos(5_000_000),
          aportes: [{ tesoro: ALQUILER, monto: centavos(2_000_000) }],
          remanente: centavos(0),
        },
        {
          fecha: '2026-09-15',
          neta: centavos(50_000_000),
          diezmo: centavos(5_000_000),
          aportes: [{ tesoro: ALQUILER, monto: centavos(3_000_000) }],
          remanente: centavos(0),
        },
      ],
      coberturas: [{ tesoro: ALQUILER, desde: '2026-09-10', monto: centavos(500_000) }],
      gastos: [
        {
          tesoro: ALQUILER,
          categoria: 'Alquiler',
          fecha: '2026-09-08',
          monto: centavos(10_000_000),
          vencimiento: '2026-09-10',
        },
        {
          tesoro: ALQUILER,
          categoria: 'Adelanto',
          fecha: '2026-09-20',
          monto: centavos(1_000_000),
          vencimiento: null,
        },
      ],
    };
    expect(loQueSePagaSolo(GUARDADA, conAlquilerQueSePagaSolo(), datos, HOY)[0]).toEqual({
      tesoro: ALQUILER,
      desde: '2026-10-10',
      plataDeAntes: 5_500_000,
    });
  });
});

describe('qué hacer con la plata de antes', () => {
  const PAGOS: QueSePagaSolo[] = [
    { tesoro: ALQUILER, desde: '2026-10-10', plataDeAntes: centavos(5_500_000) },
    { tesoro: SUELDOS, desde: '2026-09-30', plataDeAntes: centavos(0) },
    { tesoro: LUZ, desde: '2026-10-15', plataDeAntes: centavos(-200_000) },
  ];

  it('falta elegir mientras un compromiso con plata de antes no tiene destino', () => {
    expect(faltaElegir(PAGOS, {})).toBe(true);
    expect(faltaElegir(PAGOS, { [ALQUILER]: { que: 'otro', hacia: null } })).toBe(true);
    expect(faltaElegir(PAGOS, { [SUELDOS]: { que: 'maun' } })).toBe(true);
    expect(faltaElegir(PAGOS, { [ALQUILER]: { que: 'otro', hacia: MATERIALES } })).toBe(false);
    expect(faltaElegir(PAGOS, { [ALQUILER]: { que: 'maun' } })).toBe(false);
    expect(faltaElegir(PAGOS, { [ALQUILER]: { que: 'ya-no-esta' } })).toBe(false);
    expect(faltaElegir(PAGOS.slice(1), {})).toBe(false);
    expect(faltaElegir([], {})).toBe(false);
  });

  it('a Maun o a otro tesoro es una transferencia, y «Ya no está» un ajuste, con las categorías del dominio', () => {
    const pagos: QueSePagaSolo[] = [
      { tesoro: ALQUILER, desde: '2026-10-10', plataDeAntes: centavos(5_500_000) },
      { tesoro: SUELDOS, desde: '2026-09-30', plataDeAntes: centavos(2_000_000) },
      { tesoro: LUZ, desde: '2026-10-15', plataDeAntes: centavos(700_000) },
      { tesoro: HOGAR, desde: '2026-10-05', plataDeAntes: centavos(0) },
      { tesoro: MATERIALES, desde: '2026-10-05', plataDeAntes: centavos(300_000) },
    ];
    const elegidos: Record<string, QueHacerConLaPlata> = {
      [ALQUILER]: { que: 'maun' },
      [SUELDOS]: { que: 'otro', hacia: MATERIALES },
      [LUZ]: { que: 'ya-no-esta' },
      [HOGAR]: { que: 'maun' },
    };
    let ids = 0;
    const nuevoId = () => {
      ids += 1;
      return `m${String(ids)}`;
    };
    expect(movimientosDeLaPlataDeAntes(pagos, elegidos, MAUN, HOY, nuevoId)).toEqual([
      {
        id: 'm1',
        fecha: HOY,
        tipo: 'transferencia',
        monto_centavos: 5_500_000,
        desde_id: ALQUILER,
        hacia_id: MAUN,
        categoria: CATEGORIA_DE_LA_PLATA_DE_ANTES,
        descripcion: '',
      },
      {
        id: 'm2',
        fecha: HOY,
        tipo: 'transferencia',
        monto_centavos: 2_000_000,
        desde_id: SUELDOS,
        hacia_id: MATERIALES,
        categoria: CATEGORIA_DE_LA_PLATA_DE_ANTES,
        descripcion: '',
      },
      {
        id: 'm3',
        fecha: HOY,
        tipo: 'ajuste',
        monto_centavos: 700_000,
        desde_id: LUZ,
        hacia_id: null,
        categoria: CATEGORIA_DE_YA_NO_ESTA,
        descripcion: '',
      },
    ]);
  });

  it('sin destino elegido, o hacia el mismo tesoro, no arma ningún movimiento', () => {
    const pagos: QueSePagaSolo[] = [
      { tesoro: ALQUILER, desde: '2026-10-10', plataDeAntes: centavos(5_500_000) },
    ];
    const nuevoId = () => 'm';
    expect(movimientosDeLaPlataDeAntes(pagos, {}, MAUN, HOY, nuevoId)).toEqual([]);
    expect(
      movimientosDeLaPlataDeAntes(
        pagos,
        { [ALQUILER]: { que: 'otro', hacia: null } },
        MAUN,
        HOY,
        nuevoId,
      ),
    ).toEqual([]);
    expect(
      movimientosDeLaPlataDeAntes(
        pagos,
        { [ALQUILER]: { que: 'otro', hacia: ALQUILER } },
        MAUN,
        HOY,
        nuevoId,
      ),
    ).toEqual([]);
  });
});
