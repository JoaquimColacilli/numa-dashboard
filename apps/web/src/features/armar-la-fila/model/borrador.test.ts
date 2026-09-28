import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  borradorDeLaFila,
  cambiarElBorrador,
  cortarLaJunta,
  cuantosCambios,
  deshacerElBorrador,
  descartarElBorrador,
  empezarElBorrador,
  rehacerElBorrador,
  useBorradorDeLaFila,
} from './borrador';
import {
  conClase,
  conPorcentaje,
  conRenglones,
  conTope,
  moverUnLugar,
  sacar,
  sumarAlFinal,
  sumarAlReparto,
  sumarComoPaso,
} from './edicion';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const COCOS = '01900000-0000-7000-8000-000000000004';

const GUARDADA: Fila = {
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(90_000_000) }],
      desde: '2026-09',
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
  sueldoPorTrabajo: false,
};

function fila(): Fila {
  const actual = borradorDeLaFila();
  if (actual === null) throw new Error('No hay borrador');
  return actual.fila;
}

afterEach(() => {
  descartarElBorrador();
});

describe('el borrador de la fila', () => {
  it('empieza con la fila guardada, sin cambios y con la versión que vio', () => {
    empezarElBorrador('a', 4, GUARDADA);
    const borrador = borradorDeLaFila();
    expect(borrador?.base).toBe(GUARDADA);
    expect(borrador?.fila).toEqual(GUARDADA);
    expect(borrador?.version).toBe(4);
    expect(cuantosCambios(borrador)).toBe(0);
  });

  it('cada acción queda en el borrador y cuenta como un cambio', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    cambiarElBorrador(sumarAlFinal(fila(), HERRAMIENTAS, null, centavos(10_000_000)));
    cambiarElBorrador(sumarAlReparto(fila(), '01900000-0000-7000-8000-000000000008'));
    cambiarElBorrador(moverUnLugar(fila(), MATERIALES, -1));
    cambiarElBorrador(sacar(fila(), COCOS));

    expect(fila().pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      MATERIALES,
      FIJOS,
      HERRAMIENTAS,
    ]);
    expect(fila().pasos[1]?.tope).toBe(35_000_000);
    expect(fila().reparto.map((parte) => parte.tesoro)).toEqual([
      '01900000-0000-7000-8000-000000000008',
    ]);
    expect(borradorDeLaFila()?.atras).toHaveLength(5);
    expect(cuantosCambios(borradorDeLaFila())).toBeGreaterThanOrEqual(5);
  });

  it('sumar en un lugar, cambiar la clase, los renglones o el porcentaje también quedan, y se deshacen', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarComoPaso(fila(), HERRAMIENTAS, null, HOGAR, centavos(10_000_000)));
    cambiarElBorrador(conClase(fila(), MATERIALES, 'fijos'));
    cambiarElBorrador(
      conRenglones(fila(), FIJOS, [
        { nombre: 'Alquiler', monto: centavos(50_000_000) },
        { nombre: 'Luz', monto: centavos(40_000_000) },
      ]),
    );
    cambiarElBorrador(conPorcentaje(fila(), COCOS, puntosBasicos(7000)));

    expect(fila().pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      HERRAMIENTAS,
      FIJOS,
      MATERIALES,
    ]);
    expect(fila().pasos[3]).toMatchObject({
      clase: 'fijos',
      tope: 30_000_000,
      renglones: [{ nombre: 'Gasto fijo', monto: 30_000_000 }],
    });
    expect(fila().pasos[2]).toMatchObject({ tope: 90_000_000 });
    expect(fila().pasos[2]?.renglones).toHaveLength(2);
    expect(fila().reparto).toEqual([{ tesoro: COCOS, porcentaje: 7000 }]);
    expect(borradorDeLaFila()?.atras).toHaveLength(4);
    expect(cuantosCambios(borradorDeLaFila())).toBe(4);

    for (let vez = 0; vez < 4; vez += 1) deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
    expect(cuantosCambios(borradorDeLaFila())).toBe(0);
  });

  it('deshace y rehace de a una acción', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    const conElTope = fila();
    cambiarElBorrador(moverUnLugar(fila(), MATERIALES, -1));
    const movida = fila();

    deshacerElBorrador();
    expect(fila()).toBe(conElTope);
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);

    rehacerElBorrador();
    expect(fila()).toBe(conElTope);
    rehacerElBorrador();
    expect(fila()).toBe(movida);
    rehacerElBorrador();
    expect(fila()).toBe(movida);
  });

  it('un cambio nuevo después de deshacer tira lo que se podía rehacer', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    deshacerElBorrador();
    cambiarElBorrador(sacar(fila(), COCOS));
    expect(borradorDeLaFila()?.adelante).toHaveLength(0);
  });

  it('las teclas de un mismo campo se juntan en un solo paso para deshacer', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(300)), `tope:${MATERIALES}`);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(3500)), `tope:${MATERIALES}`);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35000)), `tope:${MATERIALES}`);
    expect(borradorDeLaFila()?.atras).toHaveLength(1);

    cortarLaJunta();
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(40000)), `tope:${MATERIALES}`);
    expect(borradorDeLaFila()?.atras).toHaveLength(2);

    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });

  it('descartar vuelve a la fila guardada', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sacar(fila(), COCOS));
    descartarElBorrador();
    expect(borradorDeLaFila()).toBeNull();

    empezarElBorrador('a', 4, GUARDADA);
    expect(fila()).toEqual(GUARDADA);
    expect(borradorDeLaFila()?.atras).toHaveLength(0);
    expect(cuantosCambios(borradorDeLaFila())).toBe(0);
  });

  it('pasa a mensual el sueldo por trabajo de la fila de siempre, y eso cuenta como un cambio', () => {
    empezarElBorrador('a', 0, { ...GUARDADA, sueldoPorTrabajo: true });
    const borrador = borradorDeLaFila();
    expect(borrador?.fila.sueldoPorTrabajo).toBe(false);
    expect(borrador?.pasadoAMensual).toBe(true);
    expect(cuantosCambios(borrador)).toBe(1);
  });

  it('sobrevive a desmontar la pantalla, y es solo del taller que lo empezó', () => {
    const primera = renderHook(() => useBorradorDeLaFila('a'));
    act(() => {
      empezarElBorrador('a', 4, GUARDADA);
      cambiarElBorrador(sacar(GUARDADA, COCOS));
    });
    expect(primera.result.current?.fila.reparto).toHaveLength(0);
    primera.unmount();

    const segunda = renderHook(() => useBorradorDeLaFila('a'));
    expect(segunda.result.current?.fila.reparto).toHaveLength(0);
    expect(segunda.result.current?.atras).toHaveLength(1);

    const deOtro = renderHook(() => useBorradorDeLaFila('b'));
    expect(deOtro.result.current).toBeNull();
  });
});
