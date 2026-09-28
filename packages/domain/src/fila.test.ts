import { describe, expect, it } from 'vitest';

import { calcularDistribucion, DIEZMO } from './cascada.ts';
import {
  aportesDelReparto,
  calcularPorLaFila,
  cambiarElPaso,
  cambiosDeLaFila,
  columnasDeSiempre,
  conDesde,
  FILA_VACIA,
  filaDelMes,
  filaDeSiempre,
  leerLaFila,
  lugarLibreDelReparto,
  moverPaso,
  planDelReparto,
  ponerDespues,
  ponerEnElReparto,
  ponerPaso,
  previoDelMes,
  primerProblemaDeLaFila,
  problemasDeLaFila,
  repartir,
  sacarDeLaFila,
  sumaDelReparto,
  tesorosDeLaFila,
  type EntradaDelReparto,
  type Fila,
  type LiquidacionDelMes,
  type PasoDeLaFila,
  type TesoroDeLaFila,
} from './fila.ts';
import { topesDeLaLiquidacion } from './liquidacion.ts';
import { centavos, puntosBasicos, type Money } from './money.ts';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO_ID = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const MATERIALES = '00000000-0000-7000-8000-000000000011';
const INVERSIONES = '00000000-0000-7000-8000-000000000012';
const INMUEBLES = '00000000-0000-7000-8000-000000000013';
const ARCHIVADO = '00000000-0000-7000-8000-000000000014';
const DESCONOCIDO = '00000000-0000-7000-8000-000000000099';

const TESOROS: TesoroDeLaFila[] = [
  { id: HOGAR, clave: 'hogar', archivado: false },
  { id: MAUN, clave: 'maun', archivado: false },
  { id: DIEZMO_ID, clave: 'diezmo', archivado: false },
  { id: COCOS, clave: 'cocos', archivado: false },
  { id: FIJOS, clave: null, archivado: false },
  { id: MATERIALES, clave: null, archivado: false },
  { id: INVERSIONES, clave: null, archivado: false },
  { id: INMUEBLES, clave: null, archivado: false },
  { id: ARCHIVADO, clave: null, archivado: true },
];

const $ = (pesos: number): Money => centavos(pesos * 100);
const bp = puntosBasicos;

function sueldo(tope: Money): PasoDeLaFila {
  return { tesoro: HOGAR, clase: 'sueldo', tope, renglones: [], desde: null };
}

function fijos(renglones: [string, Money][], tesoro = FIJOS): PasoDeLaFila {
  const lista = renglones.map(([nombre, monto]) => ({ nombre, monto }));
  return {
    tesoro,
    clase: 'fijos',
    tope: centavos(lista.reduce((suma, renglon) => suma + renglon.monto, 0)),
    renglones: lista,
    desde: null,
  };
}

function prioridad(tesoro: string, tope: Money): PasoDeLaFila {
  return { tesoro, clase: 'prioridad', tope, renglones: [], desde: null };
}

const PASO_SUELDO = sueldo($(1_800_000));
const PASO_FIJOS = fijos([
  ['Alquiler', $(500_000)],
  ['Luz', $(60_000)],
  ['Ayudante', $(340_000)],
]);
const PASO_MATERIALES = prioridad(MATERIALES, $(300_000));

const FILA_DE_ELISEO: Fila = {
  pasos: [PASO_SUELDO, PASO_FIJOS, PASO_MATERIALES],
  reparto: [
    { tesoro: INVERSIONES, porcentaje: bp(5_000) },
    { tesoro: INMUEBLES, porcentaje: bp(3_000) },
    { tesoro: COCOS, porcentaje: bp(2_000) },
  ],
  sueldoPorTrabajo: false,
};

function entrada(
  cobrado: Money,
  gastos: Money,
  fila: Fila,
  previo: [string, Money][] = [],
): EntradaDelReparto {
  return {
    ...planDelReparto('cobrado', fila, { perdidoConSueldo: false, perdidoConDiezmo: true }),
    cobrado,
    gastos,
    previo: new Map(previo),
  };
}

function montos(fila: Fila, cobrado: Money, previo: [string, Money][] = []) {
  const reparto = repartir(entrada(cobrado, $(0), fila, previo));
  return {
    diezmo: reparto.diezmo,
    pasos: reparto.pasos.map((paso) => paso.monto),
    reparto: reparto.reparto.map((parte) => parte.monto),
    remanente: reparto.remanente,
  };
}

describe('el reparto por la fila, caso por caso', () => {
  it('el primer cobro del mes llena la fila y el reparto por porcentajes no recibe nada', () => {
    expect(montos(FILA_DE_ELISEO, $(1_500_000))).toEqual({
      diezmo: $(150_000),
      pasos: [$(1_350_000), $(0), $(0)],
      reparto: [$(0), $(0), $(0)],
      remanente: $(0),
    });
  });

  it('el segundo cobro termina los topes y recién ahí reparte lo que sobra', () => {
    expect(montos(FILA_DE_ELISEO, $(2_000_000), [[HOGAR, $(1_350_000)]])).toEqual({
      diezmo: $(200_000),
      pasos: [$(450_000), $(900_000), $(300_000)],
      reparto: [$(75_000), $(45_000), $(30_000)],
      remanente: $(0),
    });
  });

  it('con los topes del mes llenos, el cobro va entero al reparto después del diezmo', () => {
    const lleno: [string, Money][] = [
      [HOGAR, $(1_800_000)],
      [FIJOS, $(900_000)],
      [MATERIALES, $(300_000)],
    ];
    const reparto = repartir(entrada($(1_000_000), $(0), FILA_DE_ELISEO, lleno));
    expect(reparto.pasos.map((paso) => [paso.tope, paso.monto, paso.falta])).toEqual([
      [$(0), $(0), $(0)],
      [$(0), $(0), $(0)],
      [$(0), $(0), $(0)],
    ]);
    expect(reparto.sobrante).toBe($(900_000));
    expect(reparto.reparto.map((parte) => parte.monto)).toEqual([
      $(450_000),
      $(270_000),
      $(180_000),
    ]);
  });

  it('lo que no se asigna en el reparto queda en el taller', () => {
    const fila: Fila = {
      pasos: [],
      reparto: [{ tesoro: INVERSIONES, porcentaje: bp(4_000) }],
      sueldoPorTrabajo: false,
    };
    expect(montos(fila, $(1_000_000))).toEqual({
      diezmo: $(100_000),
      pasos: [],
      reparto: [$(360_000)],
      remanente: $(540_000),
    });
  });

  it('cada parte se redondea hacia abajo y los centavos que sobran quedan en el taller', () => {
    const tercios: Fila = {
      pasos: [],
      reparto: [
        { tesoro: INVERSIONES, porcentaje: bp(3_333) },
        { tesoro: INMUEBLES, porcentaje: bp(3_333) },
        { tesoro: COCOS, porcentaje: bp(3_334) },
      ],
      sueldoPorTrabajo: false,
    };
    const reparto = repartir({ ...entrada(centavos(100), centavos(0), tercios), diezmoBp: bp(0) });
    expect(reparto.reparto.map((parte) => parte.monto)).toEqual([33, 33, 33]);
    expect(reparto.remanente).toBe(1);

    const setentaTreinta: Fila = {
      pasos: [],
      reparto: [
        { tesoro: INVERSIONES, porcentaje: bp(7_000) },
        { tesoro: INMUEBLES, porcentaje: bp(3_000) },
      ],
      sueldoPorTrabajo: false,
    };
    const chico = repartir({
      ...entrada(centavos(5), centavos(0), setentaTreinta),
      diezmoBp: bp(0),
    });
    expect(chico.reparto.map((parte) => parte.monto)).toEqual([3, 1]);
    expect(chico.remanente).toBe(1);
  });

  it('un paso que no llega a su tope se lleva lo que queda y deja en cero lo de abajo', () => {
    const reparto = repartir(entrada($(1_000_000), $(0), FILA_DE_ELISEO, [[HOGAR, $(1_500_000)]]));
    expect(reparto.pasos.map((paso) => [paso.previo, paso.tope, paso.monto, paso.falta])).toEqual([
      [$(1_500_000), $(300_000), $(300_000), $(0)],
      [$(0), $(900_000), $(600_000), $(300_000)],
      [$(0), $(300_000), $(0), $(300_000)],
    ]);
  });

  it('ganancia cero o negativa: todo en cero y la pérdida en el taller', () => {
    for (const [cobrado, gastos] of [
      [$(100), $(100)],
      [$(500), $(800)],
    ] as const) {
      const reparto = repartir(entrada(cobrado, gastos, FILA_DE_ELISEO));
      expect(reparto.diezmo).toBe(0);
      expect(reparto.pasos.every((paso) => paso.monto === 0 && paso.falta === paso.tope)).toBe(
        true,
      );
      expect(reparto.reparto.every((parte) => parte.monto === 0)).toBe(true);
      expect(reparto.remanente).toBe(cobrado - gastos);
    }
  });

  it('el sueldo por trabajo no mira lo que ya se pagó en el mes', () => {
    const porTrabajo: Fila = { ...FILA_DE_ELISEO, sueldoPorTrabajo: true };
    const reparto = repartir(entrada($(3_000_000), $(0), porTrabajo, [[HOGAR, $(1_800_000)]]));
    expect(reparto.pasos[0]).toMatchObject({
      porMes: false,
      tope: $(1_800_000),
      monto: $(1_800_000),
    });
  });

  it('la suma de todo lo repartido es la ganancia', () => {
    const reparto = repartir(
      entrada($(2_345_678), $(123_456), FILA_DE_ELISEO, [[HOGAR, $(900_001)]]),
    );
    const repartido =
      reparto.diezmo +
      reparto.pasos.reduce((suma, paso) => suma + paso.monto, 0) +
      reparto.reparto.reduce((suma, parte) => suma + parte.monto, 0) +
      reparto.remanente;
    expect(repartido).toBe(reparto.neta);
  });
});

describe('lo que el reparto rechaza', () => {
  const base = entrada($(1_000), $(0), FILA_DE_ELISEO);

  it('importes negativos', () => {
    expect(() => repartir({ ...base, cobrado: centavos(-1) })).toThrow(RangeError);
    expect(() => repartir({ ...base, gastos: centavos(-1) })).toThrow(RangeError);
    expect(() =>
      repartir({
        ...base,
        pasos: [{ tesoro: HOGAR, clase: 'sueldo', objetivo: centavos(-1), porMes: true }],
      }),
    ).toThrow(RangeError);
    expect(() => repartir({ ...base, previo: new Map([[HOGAR, centavos(-1)]]) })).toThrow(
      RangeError,
    );
  });

  it('porcentajes fuera de rango, en cero o que pasan del 100%', () => {
    expect(() => repartir({ ...base, diezmoBp: 10_001 as never })).toThrow(RangeError);
    expect(() =>
      repartir({ ...base, reparto: [{ tesoro: INVERSIONES, porcentaje: 0 as never }] }),
    ).toThrow(RangeError);
    expect(() =>
      repartir({
        ...base,
        reparto: [
          { tesoro: INVERSIONES, porcentaje: bp(6_000) },
          { tesoro: INMUEBLES, porcentaje: bp(5_000) },
        ],
      }),
    ).toThrow(RangeError);
  });

  it('un tesoro repetido', () => {
    expect(() =>
      repartir({ ...base, reparto: [{ tesoro: HOGAR, porcentaje: bp(1_000) }] }),
    ).toThrow(RangeError);
  });

  it('un sobrante tan grande que el porcentaje dejaría de ser exacto', () => {
    const enorme: Fila = {
      pasos: [],
      reparto: [{ tesoro: INVERSIONES, porcentaje: bp(10_000) }],
      sueldoPorTrabajo: false,
    };
    expect(() =>
      repartir({ ...entrada(centavos(2 ** 50), centavos(0), enorme), diezmoBp: bp(0) }),
    ).toThrow(RangeError);
  });
});

function azar(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(estado, 1_664_525) + 1_013_904_223) >>> 0;
    return estado / 2 ** 32;
  };
}

describe('la fila de siempre reparte igual que la cascada de antes', () => {
  it('en miles de casos, cobrados y perdidos, por mes y por trabajo', () => {
    const r = azar(20260927);
    const entero = (tope: number) => Math.floor(r() * tope);
    for (let caso = 0; caso < 4_000; caso += 1) {
      const ajustes = {
        sueldoMensual: centavos(r() < 0.1 ? 0 : entero(300_000_000)),
        costosFijos: centavos(r() < 0.3 ? 0 : entero(60_000_000)),
        sueldoTopeMensual: r() < 0.7,
      };
      const perdido = r() < 0.3;
      const flags = { perdidoConSueldo: r() < 0.5, perdidoConDiezmo: r() < 0.5 };
      const previo = {
        sueldo: centavos(r() < 0.5 ? 0 : entero(400_000_000)),
        fijos: centavos(r() < 0.5 ? 0 : entero(80_000_000)),
      };
      const cobrado = centavos(entero(500_000_000));
      const gastos = centavos(r() < 0.2 ? cobrado + entero(10_000_000) : entero(cobrado + 1));

      const fila = filaDeSiempre(ajustes, { hogar: HOGAR, maun: MAUN });
      const reparto = repartir({
        ...planDelReparto(perdido ? 'perdido' : 'cobrado', fila, flags),
        cobrado,
        gastos,
        previo: new Map([
          [HOGAR, previo.sueldo],
          [MAUN, previo.fijos],
        ]),
      });

      const objetivoSueldo =
        perdido && !flags.perdidoConSueldo ? centavos(0) : ajustes.sueldoMensual;
      const antes = calcularDistribucion({
        cobrado,
        gastos,
        diezmoBp: perdido && !flags.perdidoConDiezmo ? bp(0) : DIEZMO,
        ...topesDeLaLiquidacion(
          {
            sueldo: objetivoSueldo,
            fijos: ajustes.costosFijos,
            sueldoMensual: ajustes.sueldoTopeMensual,
          },
          previo,
        ),
      });

      const delPaso = (tesoro: string) =>
        reparto.pasos.find((paso) => paso.tesoro === tesoro)?.monto ?? 0;
      expect({
        diezmo: reparto.diezmo,
        sueldo: delPaso(HOGAR),
        fijos: delPaso(MAUN),
        remanente: reparto.remanente,
      }).toEqual({
        diezmo: antes.diezmo,
        sueldo: antes.sueldo,
        fijos: antes.fijos,
        remanente: antes.remanente,
      });
    }
  });
});

describe('la fila de siempre', () => {
  it('sale de los ajustes: el sueldo al hogar y los costos fijos apartados en el taller', () => {
    expect(
      filaDeSiempre(
        { sueldoMensual: $(1_800_000), costosFijos: $(250_000), sueldoTopeMensual: false },
        { hogar: HOGAR, maun: MAUN },
      ),
    ).toEqual({
      pasos: [
        { tesoro: HOGAR, clase: 'sueldo', tope: $(1_800_000), renglones: [], desde: null },
        {
          tesoro: MAUN,
          clase: 'fijos',
          tope: $(250_000),
          renglones: [{ nombre: 'Costos fijos', monto: $(250_000) }],
          desde: null,
        },
      ],
      reparto: [],
      sueldoPorTrabajo: true,
    });
  });

  it('un paso en cero no entra, así que la fila del dueño de hoy es solo su sueldo', () => {
    expect(
      filaDeSiempre(
        { sueldoMensual: $(1_800_000), costosFijos: $(0), sueldoTopeMensual: true },
        { hogar: HOGAR, maun: MAUN },
      ).pasos.map((paso) => paso.clase),
    ).toEqual(['sueldo']);
    expect(
      filaDeSiempre(
        { sueldoMensual: $(0), costosFijos: $(0), sueldoTopeMensual: true },
        { hogar: HOGAR, maun: MAUN },
      ),
    ).toEqual(FILA_VACIA);
  });

  it('rechaza importes negativos', () => {
    expect(() =>
      filaDeSiempre(
        { sueldoMensual: centavos(-1), costosFijos: $(0), sueldoTopeMensual: true },
        { hogar: HOGAR, maun: MAUN },
      ),
    ).toThrow(RangeError);
    expect(() =>
      filaDeSiempre(
        { sueldoMensual: $(0), costosFijos: centavos(-1), sueldoTopeMensual: true },
        { hogar: HOGAR, maun: MAUN },
      ),
    ).toThrow(RangeError);
  });
});

describe('el plan del reparto', () => {
  it('un perdido lleva diezmo y sueldo según los ajustes', () => {
    const sinNada = planDelReparto('perdido', FILA_DE_ELISEO, {
      perdidoConSueldo: false,
      perdidoConDiezmo: false,
    });
    expect(sinNada.diezmoBp).toBe(0);
    expect(sinNada.pasos[0]?.objetivo).toBe(0);
    expect(sinNada.pasos[1]?.objetivo).toBe($(900_000));

    const conTodo = planDelReparto('perdido', FILA_DE_ELISEO, {
      perdidoConSueldo: true,
      perdidoConDiezmo: true,
    });
    expect(conTodo.diezmoBp).toBe(DIEZMO);
    expect(conTodo.pasos[0]?.objetivo).toBe($(1_800_000));
  });
});

describe('lo que cada tesoro ya recibió en el mes', () => {
  const liquidaciones: LiquidacionDelMes[] = [
    {
      fecha: '2026-09-03',
      neta: $(1_000),
      diezmo: $(100),
      aportes: [
        { tesoro: HOGAR, monto: $(500) },
        { tesoro: MATERIALES, monto: $(100) },
      ],
      remanente: $(300),
    },
    {
      fecha: '2026-09-20',
      neta: $(800),
      diezmo: $(80),
      aportes: [{ tesoro: HOGAR, monto: $(200) }],
      remanente: $(520),
    },
    {
      fecha: '2026-08-30',
      neta: $(9_000),
      diezmo: $(900),
      aportes: [{ tesoro: HOGAR, monto: $(8_000) }],
      remanente: $(100),
    },
  ];

  it('suma por tesoro los cobros del mes y las coberturas a mano de ese mes', () => {
    const previo = previoDelMes(
      liquidaciones,
      [
        { tesoro: FIJOS, mes: '2026-09', monto: $(400) },
        { tesoro: FIJOS, mes: '2026-08', monto: $(999) },
      ],
      '2026-09',
    );
    expect(Object.fromEntries(previo)).toEqual({
      [HOGAR]: $(700),
      [MATERIALES]: $(100),
      [FIJOS]: $(400),
    });
  });

  it('un mes mal escrito se rechaza, también en una cobertura', () => {
    expect(() => previoDelMes([], [], '2026-9')).toThrow(RangeError);
    expect(() =>
      previoDelMes([], [{ tesoro: FIJOS, mes: 'septiembre', monto: $(1) }], '2026-09'),
    ).toThrow(RangeError);
  });

  it('calcularPorLaFila usa el mes de la fecha del cobro', () => {
    const liquidacion = calcularPorLaFila({
      destino: 'cobrado',
      fecha: '2026-09-25',
      cobrado: $(2_000_000),
      gastos: $(0),
      fila: FILA_DE_ELISEO,
      ajustes: { perdidoConSueldo: false, perdidoConDiezmo: true },
      liquidaciones,
      coberturas: [],
    });
    expect(liquidacion.previoDelMes.get(HOGAR)).toBe($(700));
    expect(liquidacion.pasos[0]).toMatchObject({ previo: $(700), tope: $(1_799_300) });
    expect(liquidacion.destino).toBe('cobrado');
    expect(liquidacion.fecha).toBe('2026-09-25');
  });
});

describe('lo que se congela en las columnas de siempre', () => {
  it('diezmo y totales de verdad, sueldo y fijos en cero y el resto como remanente', () => {
    const reparto = repartir(entrada($(2_000_000), $(100_000), FILA_DE_ELISEO));
    const columnas = columnasDeSiempre(reparto);
    expect(columnas).toEqual({
      diezmoBp: DIEZMO,
      diezmo: $(190_000),
      topeSueldo: 0,
      topeFijos: 0,
      sueldo: 0,
      fijos: 0,
      remanente: $(1_710_000),
      objetivoSueldo: 0,
      objetivoFijos: 0,
      sueldoMensual: true,
      sueldoPrevio: 0,
      fijosPrevio: 0,
    });
    expect(columnas.diezmo + columnas.sueldo + columnas.fijos + columnas.remanente).toBe(
      reparto.neta,
    );
  });

  it('con pérdida, el remanente es la pérdida', () => {
    expect(columnasDeSiempre(repartir(entrada($(100), $(300), FILA_DE_ELISEO))).remanente).toBe(
      $(-200),
    );
  });

  it('los aportes son lo que recibió cada tesoro, pasos y partes', () => {
    const reparto = repartir(entrada($(3_000_000), $(0), FILA_DE_ELISEO));
    expect(aportesDelReparto(reparto).map((aporte) => aporte.tesoro)).toEqual([
      HOGAR,
      FIJOS,
      MATERIALES,
      INVERSIONES,
      INMUEBLES,
      COCOS,
    ]);
  });
});

describe('leer la fila guardada', () => {
  const guardada = JSON.parse(JSON.stringify(FILA_DE_ELISEO)) as unknown;

  it('lee la forma que guarda la base', () => {
    expect(leerLaFila(guardada)).toEqual(FILA_DE_ELISEO);
  });

  it('cualquier otra forma es inválida', () => {
    const conPaso = (paso: unknown) => ({ ...FILA_DE_ELISEO, pasos: [paso] });
    const conParte = (parte: unknown) => ({ ...FILA_DE_ELISEO, reparto: [parte] });
    const pasoBueno = {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: 1,
      renglones: [],
      desde: null,
    };
    for (const valor of [
      null,
      [],
      'fila',
      { pasos: [], reparto: [] },
      { pasos: {}, reparto: [], sueldoPorTrabajo: false },
      { pasos: [], reparto: {}, sueldoPorTrabajo: false },
      conPaso(null),
      conPaso({ ...pasoBueno, tesoro: 7 }),
      conPaso({ ...pasoBueno, tesoro: 'MATERIALES' }),
      conPaso({ ...pasoBueno, clase: 'otra' }),
      conPaso({ ...pasoBueno, clase: 3 }),
      conPaso({ ...pasoBueno, tope: 1.5 }),
      conPaso({ ...pasoBueno, tope: 2 ** 60 }),
      conPaso({ ...pasoBueno, renglones: {} }),
      conPaso({ ...pasoBueno, renglones: [null] }),
      conPaso({ ...pasoBueno, renglones: [{ nombre: 1, monto: 1 }] }),
      conPaso({ ...pasoBueno, renglones: [{ nombre: 'Luz', monto: '1' }] }),
      conPaso({ ...pasoBueno, desde: 202609 }),
      conParte(null),
      conParte({ tesoro: 1, porcentaje: 1 }),
      conParte({ tesoro: 'inversiones', porcentaje: 1 }),
      conParte({ tesoro: INVERSIONES, porcentaje: 0.5 }),
    ]) {
      expect(leerLaFila(valor)).toBeNull();
      expect(primerProblemaDeLaFila(valor, TESOROS)).toBe('forma-invalida');
    }
  });
});

describe('lo que no se puede guardar', () => {
  function problemas(fila: Partial<Fila>) {
    return problemasDeLaFila({ ...FILA_VACIA, ...fila }, TESOROS);
  }

  it('la fila del dueño es válida', () => {
    expect(problemasDeLaFila(FILA_DE_ELISEO, TESOROS)).toEqual([]);
    expect(primerProblemaDeLaFila(JSON.parse(JSON.stringify(FILA_DE_ELISEO)), TESOROS)).toBeNull();
  });

  it('demasiados pasos o partes', () => {
    const muchos = Array.from({ length: 13 }, () => prioridad(MATERIALES, $(1)));
    expect(problemas({ pasos: muchos })[0]).toEqual({ problema: 'demasiados-pasos', tesoro: null });
    const partes = Array.from({ length: 9 }, () => ({ tesoro: INVERSIONES, porcentaje: bp(1) }));
    expect(problemas({ reparto: partes })[0]).toEqual({
      problema: 'demasiadas-partes',
      tesoro: null,
    });
  });

  it('el tesoro de cada paso o parte', () => {
    expect(problemas({ pasos: [prioridad(DESCONOCIDO, $(1))] })[0]?.problema).toBe(
      'tesoro-desconocido',
    );
    expect(problemas({ pasos: [prioridad(ARCHIVADO, $(1))] })[0]?.problema).toBe(
      'tesoro-archivado',
    );
    expect(
      problemas({ pasos: [prioridad(MATERIALES, $(1)), prioridad(MATERIALES, $(2))] })[0],
    ).toEqual({ problema: 'tesoro-repetido', tesoro: MATERIALES });
    expect(problemas({ pasos: [prioridad(DIEZMO_ID, $(1))] })[0]?.problema).toBe(
      'diezmo-en-la-fila',
    );
    expect(problemas({ reparto: [{ tesoro: DESCONOCIDO, porcentaje: bp(1) }] })[0]?.problema).toBe(
      'tesoro-desconocido',
    );
    expect(
      problemas({
        pasos: [prioridad(MATERIALES, $(1))],
        reparto: [{ tesoro: MATERIALES, porcentaje: bp(1) }],
      })[0]?.problema,
    ).toBe('tesoro-repetido');
  });

  it('las clases de cada tesoro del sistema', () => {
    expect(problemas({ pasos: [prioridad(HOGAR, $(1))] })[0]?.problema).toBe('hogar-no-es-sueldo');
    expect(
      problemas({ pasos: [{ ...prioridad(COCOS, $(1)), clase: 'sueldo' }] })[0]?.problema,
    ).toBe('sueldo-no-es-hogar');
    expect(problemas({ pasos: [prioridad(MAUN, $(1))] })[0]?.problema).toBe('maun-no-es-fijos');
    expect(problemas({ pasos: [fijos([['Alquiler', $(1)]], MAUN)] })).toEqual([]);
    expect(problemas({ reparto: [{ tesoro: MAUN, porcentaje: bp(1) }] })[0]?.problema).toBe(
      'maun-en-el-reparto',
    );
    expect(problemas({ reparto: [{ tesoro: HOGAR, porcentaje: bp(1) }] })[0]?.problema).toBe(
      'hogar-en-el-reparto',
    );
  });

  it('los topes y los renglones', () => {
    expect(problemas({ pasos: [prioridad(MATERIALES, centavos(-1))] })[0]?.problema).toBe(
      'tope-fuera-de-rango',
    );
    expect(
      problemas({ pasos: [prioridad(MATERIALES, centavos(1_000_000_000_001))] })[0]?.problema,
    ).toBe('tope-fuera-de-rango');
    expect(
      problemas({
        pasos: [{ ...prioridad(MATERIALES, $(1)), renglones: [{ nombre: 'x', monto: $(1) }] }],
      })[0]?.problema,
    ).toBe('renglones-en-otra-clase');
    expect(problemas({ pasos: [{ ...fijos([]), tope: $(0) }] })[0]?.problema).toBe(
      'fijos-sin-renglones',
    );
    const trece = Array.from({ length: 13 }, (_, i): [string, Money] => [`R${String(i)}`, $(1)]);
    expect(problemas({ pasos: [fijos(trece)] })[0]?.problema).toBe('demasiados-renglones');
    expect(problemas({ pasos: [fijos([['   ', $(1)]])] })[0]?.problema).toBe('renglon-sin-nombre');
    expect(problemas({ pasos: [fijos([['a'.repeat(41), $(1)]])] })[0]?.problema).toBe(
      'renglon-largo',
    );
    expect(problemas({ pasos: [fijos([['ñ'.repeat(40), $(1)]])] })).toEqual([]);
    expect(problemas({ pasos: [fijos([['Luz', $(0)]])] })[0]?.problema).toBe(
      'renglon-fuera-de-rango',
    );
    expect(
      problemas({ pasos: [{ ...fijos([['Luz', centavos(1_000_000_000_001)]]), tope: $(1) }] })[0]
        ?.problema,
    ).toBe('renglon-fuera-de-rango');
    expect(problemas({ pasos: [{ ...fijos([['Luz', $(10)]]), tope: $(11) }] })[0]?.problema).toBe(
      'tope-no-es-la-suma',
    );
    expect(
      problemas({ pasos: [{ ...prioridad(MATERIALES, $(1)), desde: '2026-13' }] })[0]?.problema,
    ).toBe('desde-invalido');
    expect(problemas({ pasos: [{ ...prioridad(MATERIALES, $(1)), desde: '2026-09' }] })).toEqual(
      [],
    );
  });

  it('los porcentajes', () => {
    expect(
      problemas({ reparto: [{ tesoro: INVERSIONES, porcentaje: 0 as never }] })[0]?.problema,
    ).toBe('porcentaje-invalido');
    expect(
      problemas({ reparto: [{ tesoro: INVERSIONES, porcentaje: 10_001 as never }] })[0]?.problema,
    ).toBe('porcentaje-invalido');
    expect(
      problemas({
        reparto: [
          { tesoro: INVERSIONES, porcentaje: bp(6_000) },
          { tesoro: INMUEBLES, porcentaje: bp(5_000) },
        ],
      }),
    ).toEqual([{ problema: 'reparto-pasa-de-cien', tesoro: null }]);
  });

  it('una fila guardada no reparte el sueldo por trabajo', () => {
    expect(problemas({ sueldoPorTrabajo: true })).toEqual([
      { problema: 'sueldo-por-trabajo', tesoro: null },
    ]);
  });
});

describe('la fila del mes', () => {
  it('cada paso con lo recibido, lo cubierto a mano y lo que falta', () => {
    const liquidaciones: LiquidacionDelMes[] = [
      {
        fecha: '2026-09-03',
        neta: $(1_500_000),
        diezmo: $(150_000),
        aportes: [{ tesoro: HOGAR, monto: $(1_350_000) }],
        remanente: $(0),
      },
      {
        fecha: '2026-09-14',
        neta: $(2_000_000),
        diezmo: $(200_000),
        aportes: [
          { tesoro: HOGAR, monto: $(450_000) },
          { tesoro: FIJOS, monto: $(500_000) },
          { tesoro: INVERSIONES, monto: $(0) },
        ],
        remanente: $(850_000),
      },
      {
        fecha: '2026-08-14',
        neta: $(9),
        diezmo: $(1),
        aportes: [{ tesoro: HOGAR, monto: $(8) }],
        remanente: $(0),
      },
    ];
    const mes = filaDelMes(
      FILA_DE_ELISEO,
      liquidaciones,
      [{ tesoro: FIJOS, mes: '2026-09', monto: $(100_000) }],
      '2026-09',
    );
    expect(mes).toMatchObject({
      mes: '2026-09',
      cobros: 2,
      ganancia: $(3_500_000),
      diezmo: $(350_000),
      enElTaller: $(850_000),
      repartoEmpezo: false,
    });
    expect(mes.pasos).toEqual([
      {
        tesoro: HOGAR,
        clase: 'sueldo',
        objetivo: $(1_800_000),
        recibido: $(1_800_000),
        cubierto: $(0),
        falta: $(0),
        completo: true,
      },
      {
        tesoro: FIJOS,
        clase: 'fijos',
        objetivo: $(900_000),
        recibido: $(500_000),
        cubierto: $(100_000),
        falta: $(300_000),
        completo: false,
      },
      {
        tesoro: MATERIALES,
        clase: 'prioridad',
        objetivo: $(300_000),
        recibido: $(0),
        cubierto: $(0),
        falta: $(300_000),
        completo: false,
      },
    ]);
    expect(mes.reparto.map((parte) => parte.recibido)).toEqual([$(0), $(0), $(0)]);
  });

  it('el reparto empieza cuando alguna parte recibe algo', () => {
    const mes = filaDelMes(
      FILA_DE_ELISEO,
      [
        {
          fecha: '2026-09-28',
          neta: $(10),
          diezmo: $(1),
          aportes: [{ tesoro: COCOS, monto: $(2) }],
          remanente: $(0),
        },
      ],
      [],
      '2026-09',
    );
    expect(mes.repartoEmpezo).toBe(true);
  });
});

describe('editar la fila', () => {
  it('poner, mover y sacar pasos', () => {
    const cocos = prioridad(COCOS, $(100_000));
    const conCocos = ponerPaso(FILA_DE_ELISEO, cocos, 1);
    expect(conCocos.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, COCOS, FIJOS, MATERIALES]);
    expect(conCocos.reparto.map((parte) => parte.tesoro)).toEqual([INVERSIONES, INMUEBLES]);

    expect(moverPaso(conCocos, MATERIALES, 0).pasos.map((paso) => paso.tesoro)).toEqual([
      MATERIALES,
      HOGAR,
      COCOS,
      FIJOS,
    ]);
    expect(() => moverPaso(conCocos, INVERSIONES, 0)).toThrow(RangeError);
    expect(() => ponerPaso(conCocos, cocos, 9)).toThrow(RangeError);
    expect(() => ponerPaso(conCocos, cocos, 1.5)).toThrow(RangeError);

    expect(sacarDeLaFila(conCocos, COCOS)).toEqual({
      ...FILA_DE_ELISEO,
      reparto: FILA_DE_ELISEO.reparto.filter((parte) => parte.tesoro !== COCOS),
    });
  });

  it('dibujar una flecha pone un paso justo después de otro', () => {
    const materiales = PASO_MATERIALES;
    expect(
      ponerDespues(FILA_DE_ELISEO, HOGAR, materiales).pasos.map((paso) => paso.tesoro),
    ).toEqual([HOGAR, MATERIALES, FIJOS]);
    expect(ponerDespues(FILA_DE_ELISEO, null, materiales).pasos.map((paso) => paso.tesoro)).toEqual(
      [MATERIALES, HOGAR, FIJOS],
    );
    expect(() => ponerDespues(FILA_DE_ELISEO, INVERSIONES, materiales)).toThrow(RangeError);
  });

  it('el reparto: entrar, cambiar el porcentaje sin moverse, y lo que queda libre', () => {
    const cambiado = ponerEnElReparto(FILA_DE_ELISEO, INMUEBLES, bp(2_000));
    expect(cambiado.reparto).toEqual([
      { tesoro: INVERSIONES, porcentaje: 5_000 },
      { tesoro: INMUEBLES, porcentaje: 2_000 },
      { tesoro: COCOS, porcentaje: 2_000 },
    ]);
    expect(lugarLibreDelReparto(cambiado)).toBe(1_000);
    expect(sumaDelReparto(cambiado)).toBe(9_000);

    const desdeLaFila = ponerEnElReparto(FILA_DE_ELISEO, MATERIALES, bp(500));
    expect(desdeLaFila.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, FIJOS]);
    expect(desdeLaFila.reparto.at(-1)).toEqual({ tesoro: MATERIALES, porcentaje: 500 });
    expect(lugarLibreDelReparto(desdeLaFila)).toBe(0);
    expect(
      lugarLibreDelReparto({
        reparto: [
          { tesoro: COCOS, porcentaje: bp(10_000) },
          { tesoro: INVERSIONES, porcentaje: bp(10) },
        ],
      }),
    ).toBe(0);
    expect(tesorosDeLaFila(FILA_DE_ELISEO)).toEqual([
      HOGAR,
      FIJOS,
      MATERIALES,
      INVERSIONES,
      INMUEBLES,
      COCOS,
    ]);
  });

  it('cambiar un paso: el tope, o los renglones, que en los fijos son el tope', () => {
    const tope = cambiarElPaso(FILA_DE_ELISEO, MATERIALES, { tope: $(350_000) });
    expect(tope.pasos[2]?.tope).toBe($(350_000));

    const renglones = cambiarElPaso(FILA_DE_ELISEO, FIJOS, {
      renglones: [{ nombre: 'Alquiler', monto: $(600_000) }],
    });
    expect(renglones.pasos[1]).toMatchObject({ tope: $(600_000) });

    const sinRenglones = cambiarElPaso(FILA_DE_ELISEO, FIJOS, { desde: '2026-10' });
    expect(sinRenglones.pasos[1]).toMatchObject({ tope: $(900_000), desde: '2026-10' });

    expect(() => cambiarElPaso(FILA_DE_ELISEO, COCOS, { tope: $(1) })).toThrow(RangeError);
  });

  it('desde cuándo rige cada tope', () => {
    const antes: Fila = {
      ...FILA_DE_ELISEO,
      pasos: FILA_DE_ELISEO.pasos.map((paso) => ({ ...paso, desde: '2026-03' })),
    };
    const nuevo = ponerPaso(
      cambiarElPaso(antes, MATERIALES, { tope: $(350_000) }),
      prioridad(COCOS, $(1)),
      3,
    );
    expect(conDesde(antes, nuevo, '2026-10').pasos.map((paso) => paso.desde)).toEqual([
      '2026-03',
      '2026-03',
      '2026-10',
      '2026-10',
    ]);
    expect(() => conDesde(antes, nuevo, '10-2026')).toThrow(RangeError);
  });

  it('el resumen de lo que cambió, en el orden de la fila', () => {
    const despues: Fila = {
      pasos: [PASO_MATERIALES, { ...PASO_SUELDO, tope: $(2_000_000) }, prioridad(COCOS, $(50_000))],
      reparto: [
        { tesoro: INVERSIONES, porcentaje: bp(6_000) },
        { tesoro: FIJOS, porcentaje: bp(1_000) },
      ],
      sueldoPorTrabajo: false,
    };
    expect(cambiosDeLaFila(FILA_DE_ELISEO, despues)).toEqual([
      { tipo: 'sale-de-la-fila', tesoro: FIJOS },
      { tipo: 'cambia-de-lugar', tesoro: MATERIALES, antes: 2, despues: 0 },
      { tipo: 'cambia-de-lugar', tesoro: HOGAR, antes: 0, despues: 1 },
      { tipo: 'cambia-el-tope', tesoro: HOGAR, antes: $(1_800_000), despues: $(2_000_000) },
      { tipo: 'entra-a-la-fila', tesoro: COCOS, posicion: 2, tope: $(50_000) },
      { tipo: 'sale-del-reparto', tesoro: INMUEBLES },
      { tipo: 'sale-del-reparto', tesoro: COCOS },
      { tipo: 'cambia-el-porcentaje', tesoro: INVERSIONES, antes: 5_000, despues: 6_000 },
      { tipo: 'entra-al-reparto', tesoro: FIJOS, porcentaje: 1_000 },
    ]);

    const renglones = cambiarElPaso(FILA_DE_ELISEO, FIJOS, {
      renglones: [
        { nombre: 'Alquiler del galpón', monto: $(500_000) },
        { nombre: 'Luz', monto: $(60_000) },
        { nombre: 'Ayudante', monto: $(340_000) },
      ],
    });
    expect(cambiosDeLaFila(FILA_DE_ELISEO, renglones)).toEqual([
      { tipo: 'cambian-los-renglones', tesoro: FIJOS },
    ]);
    expect(cambiosDeLaFila(FILA_DE_ELISEO, FILA_DE_ELISEO)).toEqual([]);
  });
});
