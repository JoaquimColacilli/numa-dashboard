import { centavos, puntosBasicos, type Fila, type PasoDeLaFila } from '@maun/domain';
import { afterEach, describe, expect, it } from 'vitest';

import { proponerLaFormaNueva } from './acciones';
import {
  borradorDeLaFila,
  cambiarElBorrador,
  cuantosCambios,
  deshacerElBorrador,
  descartarElBorrador,
  empezarElBorrador,
} from './borrador';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const ALQUILER = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HOY = '2026-10-26';

function paso(tesoro: string, cambios: Partial<PasoDeLaFila> = {}): PasoDeLaFila {
  return {
    tesoro,
    clase: 'fijos',
    tope: centavos(10_000_000),
    renglones: [],
    desde: '2026-09',
    modo: 'mes',
    hastaLaMeta: false,
    dia: null,
    pagaSola: false,
    pagaSolaDesde: null,
    ...cambios,
  };
}

const DE_ANTES: Fila = {
  obligaciones: [
    { tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso', montoFijo: null },
  ],
  pasos: [
    paso(HOGAR, { clase: 'sueldo', tope: centavos(100_000_000) }),
    paso(ALQUILER, {
      modo: 'saldo',
      renglones: [{ nombre: 'Alquiler', monto: centavos(10_000_000), dia: 15 }],
    }),
    paso(MAUN, { renglones: [{ nombre: 'Costos fijos', monto: centavos(10_000_000), dia: null }] }),
    paso(MATERIALES, { clase: 'prioridad', tope: centavos(30_000_000) }),
  ],
  reparto: [],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

const DE_AHORA: Fila = {
  ...DE_ANTES,
  pasos: [
    paso(HOGAR, {
      clase: 'sueldo',
      tope: centavos(100_000_000),
      dia: 10,
      pagaSola: true,
      pagaSolaDesde: '2026-10-01',
    }),
    paso(MAUN, { renglones: [{ nombre: 'Costos fijos', monto: centavos(10_000_000), dia: null }] }),
  ],
};

function vistaCon(
  fila: Fila,
  {
    guardada = true,
    sincronizados = true,
    ajustesId = 'a',
  }: { guardada?: boolean; sincronizados?: boolean; ajustesId?: string | null } = {},
) {
  return {
    ajustesId,
    delTaller: { fila, version: 4, guardada, guardadaEn: guardada ? '2026-09-01T12:00:00Z' : null },
    sincronizados,
    sistema: { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO },
  };
}

afterEach(() => {
  descartarElBorrador();
});

describe('proponer la forma nueva de la fila', () => {
  it('con compromisos de la forma de antes, arranca un borrador con la forma nueva', () => {
    expect(proponerLaFormaNueva(vistaCon(DE_ANTES), HOY)).toBe('propuesta');

    const borrador = borradorDeLaFila();
    expect(borrador?.ajustesId).toBe('a');
    expect(borrador?.version).toBe(4);
    expect(borrador?.base).toBe(DE_ANTES);
    expect(borrador?.fila.pasos.map((uno) => [uno.tesoro, uno.dia, uno.pagaSola])).toEqual([
      [HOGAR, 10, true],
      [ALQUILER, 15, true],
      [MAUN, null, false],
      [MATERIALES, null, false],
    ]);
    expect(borrador?.fila.pasos[1]).toMatchObject({
      modo: 'mes',
      pagaSolaDesde: HOY,
      renglones: [{ nombre: 'Alquiler', monto: 10_000_000, dia: null }],
    });
    expect(cuantosCambios(borrador)).toBeGreaterThan(0);

    deshacerElBorrador();
    expect(borradorDeLaFila()?.fila).toEqual(DE_ANTES);
  });

  it('sin fila guardada, o sin compromisos de la forma de antes, no hay nada que proponer', () => {
    expect(proponerLaFormaNueva(vistaCon(DE_ANTES, { guardada: false }), HOY)).toBe(
      'nada-que-proponer',
    );
    expect(proponerLaFormaNueva(vistaCon(DE_AHORA), HOY)).toBe('nada-que-proponer');
    expect(proponerLaFormaNueva(vistaCon(DE_AHORA, { sincronizados: false }), HOY)).toBe(
      'nada-que-proponer',
    );
    expect(borradorDeLaFila()).toBeNull();
  });

  it('sin los tesoros sincronizados o con un borrador abierto, todavía no', () => {
    expect(proponerLaFormaNueva(vistaCon(DE_ANTES, { sincronizados: false }), HOY)).toBe(
      'todavia-no',
    );
    expect(proponerLaFormaNueva(vistaCon(DE_ANTES, { ajustesId: null }), HOY)).toBe('todavia-no');
    expect(borradorDeLaFila()).toBeNull();

    empezarElBorrador('a', 4, DE_ANTES);
    cambiarElBorrador({ ...DE_ANTES, superavit: MATERIALES });
    const abierto = borradorDeLaFila();
    expect(proponerLaFormaNueva(vistaCon(DE_ANTES), HOY)).toBe('todavia-no');
    expect(borradorDeLaFila()).toBe(abierto);
    expect(borradorDeLaFila()?.fila.superavit).toBe(MATERIALES);
  });
});
