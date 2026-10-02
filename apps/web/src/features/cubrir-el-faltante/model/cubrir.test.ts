import { centavos, enPesos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';

import {
  candidatosParaCubrir,
  fuentesIniciales,
  movimientosParaCubrir,
  notaDelCandidato,
  revisarLaCobertura,
} from './cubrir';

function tesoro(
  id: string,
  nombre: string,
  saldo: number,
  parcial: Partial<TesoroDelTaller> = {},
): TesoroDelTaller {
  return {
    id,
    clave: null,
    moneda: 'ARS',
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(centavos(saldo)),
    ...parcial,
  };
}

const FIJOS = '01900000-0000-7000-8000-000000000005';
const HOGAR = tesoro('01900000-0000-7000-8000-000000000001', 'Hogar', 41_230_000, {
  clave: 'hogar',
});
const MAUN = tesoro('01900000-0000-7000-8000-000000000002', 'Maun', 124_800_000, {
  clave: 'maun',
});
const DIEZMO = tesoro('01900000-0000-7000-8000-000000000003', 'Diezmo', 27_000_000, {
  clave: 'diezmo',
});
const COCOS = tesoro('01900000-0000-7000-8000-000000000004', 'Cocos', 341_500_000, {
  clave: 'cocos',
});
const GASTOS_FIJOS = tesoro(FIJOS, 'Gastos fijos', 13_000_000);
const VIEJO = tesoro('01900000-0000-7000-8000-000000000009', 'Viejo', 0, { archivado: true });
const TESOROS = [HOGAR, MAUN, DIEZMO, COCOS, GASTOS_FIJOS, VIEJO];

describe('de dónde puede salir lo que falta', () => {
  it('Maun primero, nunca el diezmo, ni el mismo paso, ni un archivado', () => {
    expect(candidatosParaCubrir(TESOROS, FIJOS).map((uno) => uno.nombre)).toEqual([
      'Maun',
      'Hogar',
      'Cocos',
    ]);
  });

  it('si el paso es Maun, Maun no aparece', () => {
    expect(candidatosParaCubrir(TESOROS, MAUN.id).map((uno) => uno.nombre)).toEqual([
      'Hogar',
      'Cocos',
      'Gastos fijos',
    ]);
  });

  it('avisa qué es la plata de Cocos y la del Hogar', () => {
    expect(notaDelCandidato(COCOS)).toBe('Es el ahorro invertido: si lo usás, la meta se atrasa.');
    expect(notaDelCandidato(HOGAR)).toBe('Es la plata de la familia.');
    expect(notaDelCandidato(GASTOS_FIJOS)).toBeNull();
  });
});

describe('lo que viene elegido', () => {
  it('Maun con todo el faltante', () => {
    expect(fuentesIniciales(candidatosParaCubrir(TESOROS, FIJOS), 27_000_000)).toEqual([
      { id: MAUN.id, monto: 27_000_000 },
    ]);
  });

  it('Maun con lo que tiene si no le alcanza, y nada si no tiene', () => {
    const corto = { ...MAUN, saldo: centavos(10_000_000) };
    expect(fuentesIniciales([corto], 27_000_000)).toEqual([{ id: MAUN.id, monto: 10_000_000 }]);
    expect(fuentesIniciales([{ ...MAUN, saldo: centavos(-5) }], 27_000_000)).toEqual([]);
  });

  it('nada si el paso es Maun', () => {
    expect(fuentesIniciales(candidatosParaCubrir(TESOROS, MAUN.id), 27_000_000)).toEqual([]);
  });
});

describe('cuánto se pasa', () => {
  const candidatos = candidatosParaCubrir(TESOROS, FIJOS);

  it('suma lo de cada uno y dice si cubre todo', () => {
    const revision = revisarLaCobertura(
      [
        { id: MAUN.id, monto: 20_000_000 },
        { id: COCOS.id, monto: 7_000_000 },
      ],
      candidatos,
      27_000_000,
    );
    expect(revision).toMatchObject({
      cubierto: 27_000_000,
      deMas: 0,
      completo: true,
      sePuede: true,
    });
  });

  it('no deja pasar más que el faltante', () => {
    const revision = revisarLaCobertura(
      [{ id: MAUN.id, monto: 30_000_000 }],
      candidatos,
      27_000_000,
    );
    expect(revision).toMatchObject({ deMas: 3_000_000, sePuede: false });
  });

  it('no deja sacar más de lo que tiene cada uno', () => {
    const revision = revisarLaCobertura(
      [{ id: HOGAR.id, monto: 50_000_000 }],
      candidatos,
      60_000_000,
    );
    expect(revision.sinSaldo.has(HOGAR.id)).toBe(true);
    expect(revision.sePuede).toBe(false);
  });

  it('sin nada escrito no se puede pasar', () => {
    expect(revisarLaCobertura([{ id: MAUN.id, monto: null }], candidatos, 27_000_000).sePuede).toBe(
      false,
    );
  });
});

describe('los movimientos', () => {
  it('una transferencia por tesoro elegido, hacia el paso, marcada con el mes que cubre', () => {
    let numero = 0;
    const movimientos = movimientosParaCubrir({
      fuentes: [
        { id: MAUN.id, monto: 20_000_000 },
        { id: COCOS.id, monto: 7_000_000 },
        { id: HOGAR.id, monto: null },
      ],
      candidatos: candidatosParaCubrir(TESOROS, FIJOS),
      paso: GASTOS_FIJOS,
      mes: '2026-09',
      hoy: '2026-09-27',
      nuevoId: () => `m${String((numero += 1))}`,
    });
    expect(movimientos).toEqual([
      {
        id: 'm1',
        fecha: '2026-09-27',
        tipo: 'transferencia',
        tesoro_origen: 'maun',
        tesoro_destino: null,
        desde_id: MAUN.id,
        hacia_id: FIJOS,
        cubre_el_mes: '2026-09-01',
        monto_centavos: 20_000_000,
        categoria: 'Cubrir el mes',
        descripcion: 'Para cubrir Gastos fijos de septiembre',
      },
      expect.objectContaining({
        id: 'm2',
        tesoro_origen: 'cocos',
        desde_id: COCOS.id,
        monto_centavos: 7_000_000,
      }),
    ]);
  });

  it('sin los tesoros en la réplica manda solo las claves', () => {
    const maun = tesoro('maun', 'Maun', 100, { clave: 'maun' });
    const hogar = tesoro('hogar', 'Hogar', 100, { clave: 'hogar' });
    const [movimiento] = movimientosParaCubrir({
      fuentes: [{ id: 'hogar', monto: 50 }],
      candidatos: candidatosParaCubrir([hogar], maun.id),
      paso: maun,
      mes: '2026-10',
      hoy: '2026-10-02',
      nuevoId: () => 'm',
    });
    expect(movimiento).toMatchObject({
      tesoro_origen: 'hogar',
      tesoro_destino: 'maun',
      desde_id: null,
      hacia_id: null,
      cubre_el_mes: '2026-10-01',
      descripcion: 'Para cubrir Maun de octubre',
    });
  });
});
