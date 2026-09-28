import { cambiosDeLaFila, centavos, puntosBasicos, type Fila } from '@maun/domain';
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
  conBase,
  conClase,
  conDia,
  conHastaLaMeta,
  conModo,
  conPorcentaje,
  conPorcentajeDeLaObligacion,
  conRenglones,
  conSuperavit,
  conTipo,
  conTope,
  lugarDelDiezmo,
  moverLaObligacion,
  moverUnLugar,
  sacar,
  sumarAlFinal,
  sumarAlReparto,
  sumarComoAhorroFijo,
  sumarComoCompromiso,
  sumarComoObligacion,
  sumarComoPaso,
  sumarEnElLugar,
  type TesoroQueSeSuma,
} from './edicion';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const INMUEBLE = '01900000-0000-7000-8000-000000000008';
const IIBB = '01900000-0000-7000-8000-000000000009';
const APARTE = '01900000-0000-7000-8000-000000000010';

const GUARDADA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(90_000_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function fila(): Fila {
  const actual = borradorDeLaFila();
  if (actual === null) throw new Error('No hay borrador');
  return actual.fila;
}

function tiposDeLosCambios(): string[] {
  const actual = borradorDeLaFila();
  if (actual === null) return [];
  return cambiosDeLaFila(actual.base, actual.fila).map((cambio) => cambio.tipo);
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
    cambiarElBorrador(sumarAlReparto(fila(), INMUEBLE));
    cambiarElBorrador(moverUnLugar(fila(), FIJOS, -1));
    cambiarElBorrador(sacar(fila(), COCOS));

    expect(fila().pasos.map((paso) => paso.tesoro)).toEqual([
      FIJOS,
      HOGAR,
      MATERIALES,
      HERRAMIENTAS,
    ]);
    expect(fila().pasos[2]?.tope).toBe(35_000_000);
    expect(fila().reparto.map((parte) => parte.tesoro)).toEqual([INMUEBLE]);
    expect(borradorDeLaFila()?.atras).toHaveLength(5);
    expect(cuantosCambios(borradorDeLaFila())).toBeGreaterThanOrEqual(5);
  });

  it('un ahorro no sube arriba de un compromiso: el paso se mueve adentro de su tipo', () => {
    empezarElBorrador('a', 4, GUARDADA);
    const antes = fila();
    cambiarElBorrador(moverUnLugar(fila(), MATERIALES, -1));
    expect(fila()).toBe(antes);
    expect(borradorDeLaFila()?.atras).toHaveLength(0);
  });

  it('sumar en un lugar, cambiar la clase, los renglones o el porcentaje también quedan, y se deshacen', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarComoPaso(fila(), HERRAMIENTAS, null, HOGAR, centavos(10_000_000)));
    cambiarElBorrador(conClase(fila(), MATERIALES, 'fijos'));
    cambiarElBorrador(
      conRenglones(fila(), FIJOS, [
        { nombre: 'Alquiler', monto: centavos(50_000_000), dia: 10 },
        { nombre: 'Luz', monto: centavos(40_000_000), dia: null },
      ]),
    );
    cambiarElBorrador(conPorcentaje(fila(), COCOS, puntosBasicos(7000)));

    expect(fila().pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      FIJOS,
      MATERIALES,
      HERRAMIENTAS,
    ]);
    expect(fila().pasos[2]).toMatchObject({
      clase: 'fijos',
      tope: 30_000_000,
      renglones: [{ nombre: 'Gasto fijo', monto: 30_000_000, dia: null }],
    });
    expect(fila().pasos[1]).toMatchObject({ tope: 90_000_000 });
    expect(fila().pasos[1]?.renglones).toHaveLength(2);
    expect(fila().reparto).toEqual([{ tesoro: COCOS, porcentaje: 7000, hastaLaMeta: false }]);
    expect(borradorDeLaFila()?.atras).toHaveLength(4);

    for (let vez = 0; vez < 4; vez += 1) deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
    expect(cuantosCambios(borradorDeLaFila())).toBe(0);
  });

  it('deshace y rehace de a una acción', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    const conElTope = fila();
    cambiarElBorrador(moverUnLugar(fila(), FIJOS, -1));
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

describe('las obligaciones en el borrador', () => {
  it('Ingresos Brutos entra antes del diezmo y sobre lo que cobrás, y se deshace', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(
      sumarComoObligacion(fila(), IIBB, {
        porcentaje: puntosBasicos(350),
        base: 'cobrado',
        posicion: lugarDelDiezmo(fila(), DIEZMO),
      }),
    );
    expect(fila().obligaciones).toEqual([
      { tesoro: IIBB, porcentaje: 350, base: 'cobrado' },
      { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' },
    ]);
    expect(tiposDeLosCambios()).toEqual(['entra-a-las-obligaciones']);

    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
    rehacerElBorrador();
    expect(fila().obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([IIBB, DIEZMO]);
  });

  it('una que entra por la manija arranca con 0% al final, y después se le pone el porcentaje', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarComoObligacion(fila(), IIBB));
    expect(fila().obligaciones.at(-1)).toEqual({ tesoro: IIBB, porcentaje: 0, base: 'ingreso' });
    cambiarElBorrador(conPorcentajeDeLaObligacion(fila(), IIBB, puntosBasicos(250)));
    cambiarElBorrador(conBase(fila(), IIBB, 'cobrado'));
    expect(fila().obligaciones.at(-1)).toEqual({ tesoro: IIBB, porcentaje: 250, base: 'cobrado' });
    expect(borradorDeLaFila()?.atras).toHaveLength(3);
  });

  it('sube, baja y sale de las obligaciones, sin pasarse de los bordes', () => {
    empezarElBorrador('a', 4, {
      ...GUARDADA,
      obligaciones: [
        { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' },
        ...GUARDADA.obligaciones,
      ],
    });
    const antes = fila();
    cambiarElBorrador(moverLaObligacion(fila(), IIBB, -1));
    expect(fila()).toBe(antes);
    cambiarElBorrador(moverLaObligacion(fila(), IIBB, 1));
    expect(fila().obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([DIEZMO, IIBB]);
    expect(tiposDeLosCambios()).toContain('cambia-de-lugar-la-obligacion');
    cambiarElBorrador(sacar(fila(), IIBB));
    expect(fila().obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([DIEZMO]);
    expect(tiposDeLosCambios()).toEqual(['sale-de-las-obligaciones']);

    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toBe(antes);
  });

  it('cambiar el porcentaje o la base de algo que no es obligación no hace nada', () => {
    expect(conPorcentajeDeLaObligacion(GUARDADA, COCOS, puntosBasicos(100))).toBe(GUARDADA);
    expect(conBase(GUARDADA, COCOS, 'cobrado')).toBe(GUARDADA);
  });
});

describe('los modos, las metas, los días y el superávit en el borrador', () => {
  it('cambia el modo de un paso y se deshace', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conModo(fila(), FIJOS, 'saldo'));
    expect(fila().pasos[1]?.modo).toBe('saldo');
    expect(tiposDeLosCambios()).toEqual(['cambia-el-modo']);
    expect(conModo(fila(), FIJOS, 'saldo')).toBe(fila());
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });

  it('«hasta la meta» en un paso y en una parte', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conHastaLaMeta(fila(), MATERIALES, true));
    cambiarElBorrador(conHastaLaMeta(fila(), COCOS, true));
    expect(fila().pasos[2]?.hastaLaMeta).toBe(true);
    expect(fila().reparto[0]?.hastaLaMeta).toBe(true);
    expect(tiposDeLosCambios()).toEqual(['cambia-la-meta', 'cambia-la-meta']);
    expect(conHastaLaMeta(fila(), COCOS, true)).toBe(fila());
    expect(conHastaLaMeta(fila(), HERRAMIENTAS, true)).toBe(fila());
    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });

  it('el día de pago de un renglón', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conDia(fila(), FIJOS, 0, 10));
    expect(fila().pasos[1]?.renglones[0]).toEqual({
      nombre: 'Alquiler',
      monto: 90_000_000,
      dia: 10,
    });
    expect(tiposDeLosCambios()).toEqual(['cambian-los-dias']);
    expect(conDia(fila(), FIJOS, 5, 3)).toBe(fila());
    cambiarElBorrador(conDia(fila(), FIJOS, 0, null));
    expect(fila().pasos[1]?.renglones[0]?.dia).toBeNull();
    deshacerElBorrador();
    expect(fila().pasos[1]?.renglones[0]?.dia).toBe(10);
  });

  it('el superávit cambia de tesoro y vuelve', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conSuperavit(fila(), APARTE));
    expect(fila().superavit).toBe(APARTE);
    expect(tiposDeLosCambios()).toEqual(['cambia-el-superavit']);
    expect(conSuperavit(fila(), APARTE)).toBe(fila());
    deshacerElBorrador();
    expect(fila().superavit).toBe(MAUN);
    rehacerElBorrador();
    expect(fila().superavit).toBe(APARTE);
  });

  it('«Qué es»: un ahorro fijo pasa a compromiso y vuelve, en el borde de su tipo', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTipo(fila(), MATERIALES, 'compromiso', null));
    expect(fila().pasos[2]).toMatchObject({ tesoro: MATERIALES, clase: 'fijos', tope: 30_000_000 });
    cambiarElBorrador(conTipo(fila(), FIJOS, 'ahorro-fijo', null, centavos(1_000)));
    expect(fila().pasos.map((paso) => [paso.tesoro, paso.clase])).toEqual([
      [HOGAR, 'sueldo'],
      [MATERIALES, 'fijos'],
      [FIJOS, 'prioridad'],
    ]);
    expect(fila().pasos[2]?.hastaLaMeta).toBe(true);
    expect(tiposDeLosCambios()).toContain('cambia-la-clase');
    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });

  it('un compromiso nuevo se renueva al pagar y un ahorro fijo nuevo va por mes, al final de su tipo', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(
      sumarComoCompromiso(fila(), HERRAMIENTAS, null, centavos(50_000_000), {
        renglon: 'Alquiler del galpón',
      }),
    );
    cambiarElBorrador(
      sumarComoAhorroFijo(fila(), INMUEBLE, null, centavos(10_000_000), { meta: centavos(1) }),
    );
    expect(fila().pasos.map((paso) => [paso.tesoro, paso.modo, paso.hastaLaMeta])).toEqual([
      [HOGAR, 'mes', false],
      [FIJOS, 'mes', false],
      [HERRAMIENTAS, 'saldo', false],
      [MATERIALES, 'mes', false],
      [INMUEBLE, 'mes', true],
    ]);
    expect(fila().pasos[2]?.renglones).toEqual([
      { nombre: 'Alquiler del galpón', monto: 50_000_000, dia: null },
    ]);
    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });
});

describe('sumar un tesoro del estante en un lugar de la fila', () => {
  function suelto(id: string, meta: number | null = null): TesoroQueSeSuma {
    return { id, clave: null, meta: meta === null ? null : centavos(meta) };
  }

  it('entra con el tipo de su lugar y donde se pidió, cada vez es un cambio, y se deshace y se rehace', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarEnElLugar(fila(), suelto(IIBB), 'obligacion', null));
    cambiarElBorrador(sumarEnElLugar(fila(), suelto(HERRAMIENTAS), 'compromiso', HOGAR));
    cambiarElBorrador(sumarEnElLugar(fila(), suelto(INMUEBLE, 1_000), 'ahorro-fijo'));

    expect(fila().obligaciones).toEqual([
      { tesoro: IIBB, porcentaje: 0, base: 'ingreso' },
      { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' },
    ]);
    expect(
      fila().pasos.map((paso) => [paso.tesoro, paso.clase, paso.modo, paso.tope, paso.hastaLaMeta]),
    ).toEqual([
      [HOGAR, 'sueldo', 'mes', 180_000_000, false],
      [HERRAMIENTAS, 'fijos', 'saldo', 0, false],
      [FIJOS, 'fijos', 'mes', 90_000_000, false],
      [MATERIALES, 'prioridad', 'mes', 30_000_000, false],
      [INMUEBLE, 'prioridad', 'mes', 0, true],
    ]);
    expect(borradorDeLaFila()?.atras).toHaveLength(3);
    const conLosTres = fila();

    deshacerElBorrador();
    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
    rehacerElBorrador();
    rehacerElBorrador();
    rehacerElBorrador();
    expect(fila()).toBe(conLosTres);
  });

  it('en el reparto toma lo que queda libre; como superávit, recibe el resto y Maun vuelve a recibirlo', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarEnElLugar(fila(), suelto(HERRAMIENTAS, 1_000), 'reparto'));
    expect(fila().reparto).toEqual([
      { tesoro: COCOS, porcentaje: 5000, hastaLaMeta: false },
      { tesoro: HERRAMIENTAS, porcentaje: 1000, hastaLaMeta: true },
    ]);

    cambiarElBorrador(sumarEnElLugar(fila(), suelto(APARTE), 'superavit'));
    expect(fila().superavit).toBe(APARTE);
    expect(tiposDeLosCambios()).toContain('cambia-el-superavit');

    cambiarElBorrador(sumarEnElLugar(fila(), { id: MAUN, clave: 'maun', meta: null }, 'superavit'));
    expect(fila().superavit).toBe(MAUN);
    expect(fila().reparto).toHaveLength(2);

    deshacerElBorrador();
    expect(fila().superavit).toBe(APARTE);
    deshacerElBorrador();
    deshacerElBorrador();
    expect(fila()).toEqual(GUARDADA);
  });
});
