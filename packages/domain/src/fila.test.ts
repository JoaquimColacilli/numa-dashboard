import { describe, expect, it } from 'vitest';

import { calcularDistribucion, DIEZMO } from './cascada.ts';
import {
  admiteLaMeta,
  aportesDelReparto,
  calcularPorLaFila,
  cambiarElPaso,
  cambiarLaClase,
  cambiarLaObligacion,
  cambiarLaParte,
  cambiosDeLaFila,
  columnasDeSiempre,
  conDesde,
  esDeLaMonedaDelTaller,
  esDiaDePago,
  filaDelMes,
  filaDeSiempre,
  leerLaFila,
  loDelMes,
  loVistoEsOtro,
  lugarLibreDelReparto,
  modoInicial,
  modosPosibles,
  moverObligacion,
  moverPaso,
  planDeLaLiquidacion,
  planDelReparto,
  ponerDespues,
  ponerElSuperavit,
  ponerEnElReparto,
  ponerObligacion,
  ponerPaso,
  previoDeLoVisto,
  previoDelMes,
  previoQueVio,
  primerProblemaDeLaFila,
  problemasDeLaFila,
  repartir,
  repartosDelCobro,
  sacarDeLaFila,
  sumaDelReparto,
  tesorosDeLaFila,
  tipoDelPaso,
  tipoDelTesoro,
  vencimientosDelPaso,
  type AjustesDelReparto,
  type DatosDelMes,
  type EntradaDelReparto,
  type Fila,
  type LiquidacionDelMes,
  type ModoDePaso,
  type ObligacionDeLaFila,
  type ParteDelReparto,
  type PasoDeLaFila,
  type TesoroDeLaFila,
  type TesorosDelSistema,
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
const IIBB = '00000000-0000-7000-8000-000000000015';
const SUPERAVIT = '00000000-0000-7000-8000-000000000016';
const DESCONOCIDO = '00000000-0000-7000-8000-000000000099';

const $ = (pesos: number): Money => centavos(pesos * 100);
const bp = puntosBasicos;

const SISTEMA: TesorosDelSistema = { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO_ID };

const TESOROS: TesoroDeLaFila[] = [
  { id: HOGAR, clave: 'hogar', archivado: false, meta: null },
  { id: MAUN, clave: 'maun', archivado: false, meta: null },
  { id: DIEZMO_ID, clave: 'diezmo', archivado: false, meta: null },
  { id: COCOS, clave: 'cocos', archivado: false, meta: $(3_000_000) },
  { id: FIJOS, clave: null, archivado: false, meta: null },
  { id: MATERIALES, clave: null, archivado: false, meta: $(1_000_000) },
  { id: INVERSIONES, clave: null, archivado: false, meta: $(300_000) },
  { id: INMUEBLES, clave: null, archivado: false, meta: $(0) },
  { id: ARCHIVADO, clave: null, archivado: true, meta: null },
  { id: IIBB, clave: null, archivado: false, meta: null },
  { id: SUPERAVIT, clave: null, archivado: false, meta: null },
];

const COBRADO: AjustesDelReparto = { perdidoConSueldo: false, perdidoConDiezmo: true };

const DEL_DIEZMO: ObligacionDeLaFila = { tesoro: DIEZMO_ID, porcentaje: DIEZMO, base: 'ingreso' };
const INGRESOS_BRUTOS: ObligacionDeLaFila = {
  tesoro: IIBB,
  porcentaje: bp(350),
  base: 'cobrado',
};

function sueldo(tope: Money): PasoDeLaFila {
  return {
    tesoro: HOGAR,
    clase: 'sueldo',
    tope,
    renglones: [],
    desde: null,
    modo: 'mes',
    hastaLaMeta: false,
  };
}

function fijos(
  renglones: [string, Money, number?][],
  tesoro = FIJOS,
  modo: ModoDePaso = 'mes',
): PasoDeLaFila {
  const lista = renglones.map(([nombre, monto, dia]) => ({ nombre, monto, dia: dia ?? null }));
  return {
    tesoro,
    clase: 'fijos',
    tope: centavos(lista.reduce((suma, renglon) => suma + renglon.monto, 0)),
    renglones: lista,
    desde: null,
    modo,
    hastaLaMeta: false,
  };
}

function prioridad(
  tesoro: string,
  tope: Money,
  cambios: Partial<Pick<PasoDeLaFila, 'modo' | 'hastaLaMeta' | 'desde'>> = {},
): PasoDeLaFila {
  return {
    tesoro,
    clase: 'prioridad',
    tope,
    renglones: [],
    desde: null,
    modo: 'mes',
    hastaLaMeta: false,
    ...cambios,
  };
}

function parte(tesoro: string, porcentaje: number, hastaLaMeta = false): ParteDelReparto {
  return { tesoro, porcentaje: bp(porcentaje), hastaLaMeta };
}

function filaCon(cambios: Partial<Fila>): Fila {
  return {
    obligaciones: [DEL_DIEZMO],
    pasos: [],
    reparto: [],
    superavit: MAUN,
    sueldoPorTrabajo: false,
    ...cambios,
  };
}

const PASO_SUELDO = sueldo($(1_800_000));
const PASO_FIJOS = fijos([
  ['Alquiler', $(500_000)],
  ['Luz', $(60_000)],
  ['Ayudante', $(340_000)],
]);
const PASO_MATERIALES = prioridad(MATERIALES, $(300_000));

const FILA_DE_ELISEO: Fila = filaCon({
  pasos: [PASO_SUELDO, PASO_FIJOS, PASO_MATERIALES],
  reparto: [parte(INVERSIONES, 5_000), parte(INMUEBLES, 3_000), parte(COCOS, 2_000)],
});

function entrada(
  cobrado: Money,
  gastos: Money,
  fila: Fila,
  previo: [string, Money][] = [],
  topes: [string, Money][] = [],
): EntradaDelReparto {
  return {
    ...planDelReparto('cobrado', fila, COBRADO, SISTEMA),
    cobrado,
    gastos,
    previo: new Map(previo),
    topes: new Map(topes),
  };
}

function montos(fila: Fila, cobrado: Money, previo: [string, Money][] = []) {
  const reparto = repartir(entrada(cobrado, $(0), fila, previo));
  return {
    diezmo: reparto.diezmo,
    pasos: reparto.pasos.map((paso) => paso.monto),
    reparto: reparto.reparto.map((una) => una.monto),
    remanente: reparto.remanente,
  };
}

function sumaDeTodo(reparto: ReturnType<typeof repartir>): number {
  return (
    reparto.obligaciones.reduce((suma, obligacion) => suma + obligacion.monto, 0) +
    reparto.pasos.reduce((suma, paso) => suma + paso.monto, 0) +
    reparto.reparto.reduce((suma, una) => suma + una.monto, 0) +
    reparto.remanente
  );
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

  it('el segundo cobro termina los montos y recién ahí reparte lo que sobra', () => {
    const reparto = repartir(entrada($(2_000_000), $(0), FILA_DE_ELISEO, [[HOGAR, $(1_350_000)]]));
    expect(reparto.pasos.map((paso) => paso.monto)).toEqual([$(450_000), $(900_000), $(300_000)]);
    expect(reparto.reparto.map((una) => una.monto)).toEqual([$(75_000), $(45_000), $(30_000)]);
    expect(reparto.remanente).toBe(0);
    expect(reparto.libre).toBe($(1_800_000));
    expect(reparto.ganancia).toBe($(450_000));
    expect(reparto.sobrante).toBe($(150_000));
    expect(reparto.superavit).toBeNull();
  });

  it('con los montos del mes llenos, el cobro va entero al reparto después del diezmo', () => {
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
    expect(reparto.reparto.map((una) => una.monto)).toEqual([$(450_000), $(270_000), $(180_000)]);
  });

  it('lo que no se asigna en el reparto va al superávit', () => {
    expect(montos(filaCon({ reparto: [parte(INVERSIONES, 4_000)] }), $(1_000_000))).toEqual({
      diezmo: $(100_000),
      pasos: [],
      reparto: [$(360_000)],
      remanente: $(540_000),
    });
  });

  it('cada parte se redondea hacia abajo y los centavos que sobran van al superávit', () => {
    const tercios = filaCon({
      obligaciones: [],
      reparto: [parte(INVERSIONES, 3_333), parte(INMUEBLES, 3_333), parte(COCOS, 3_334)],
    });
    const reparto = repartir(entrada(centavos(100), centavos(0), tercios));
    expect(reparto.reparto.map((una) => una.monto)).toEqual([33, 33, 33]);
    expect(reparto.remanente).toBe(1);
    expect(reparto.diezmoBp).toBe(0);
    expect(reparto.diezmo).toBe(0);

    const setentaTreinta = filaCon({
      obligaciones: [],
      reparto: [parte(INVERSIONES, 7_000), parte(INMUEBLES, 3_000)],
    });
    const chico = repartir(entrada(centavos(5), centavos(0), setentaTreinta));
    expect(chico.reparto.map((una) => una.monto)).toEqual([3, 1]);
    expect(chico.remanente).toBe(1);
  });

  it('un paso que no llega a su monto se lleva lo que queda y deja en cero lo de abajo', () => {
    const reparto = repartir(entrada($(1_000_000), $(0), FILA_DE_ELISEO, [[HOGAR, $(1_500_000)]]));
    expect(reparto.pasos.map((paso) => [paso.previo, paso.tope, paso.monto, paso.falta])).toEqual([
      [$(1_500_000), $(300_000), $(300_000), $(0)],
      [$(0), $(900_000), $(600_000), $(300_000)],
      [$(0), $(300_000), $(0), $(300_000)],
    ]);
  });

  it('un ingreso cero o negativo no reparte nada, y la pérdida queda en el superávit', () => {
    for (const [cobrado, gastos] of [
      [$(100), $(100)],
      [$(500), $(800)],
    ] as const) {
      const reparto = repartir(entrada(cobrado, gastos, FILA_DE_ELISEO));
      expect(reparto.diezmo).toBe(0);
      expect(reparto.libre).toBe(0);
      expect(reparto.ganancia).toBe(0);
      expect(reparto.pasos.every((paso) => paso.monto === 0 && paso.falta === paso.tope)).toBe(
        true,
      );
      expect(reparto.reparto.every((una) => una.monto === 0)).toBe(true);
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

  it('la suma de todo lo repartido es el ingreso', () => {
    const conTodo = filaCon({
      obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
      pasos: FILA_DE_ELISEO.pasos,
      reparto: FILA_DE_ELISEO.reparto,
      superavit: SUPERAVIT,
    });
    const reparto = repartir(
      entrada($(2_345_678), $(123_456), conTodo, [[HOGAR, $(900_001)]], [[COCOS, $(1)]]),
    );
    expect(sumaDeTodo(reparto)).toBe(reparto.neta);
  });
});

describe('las obligaciones', () => {
  it('Ingresos Brutos sobre lo cobrado antes del diezmo: 87.500 y 191.250, y quedan 1.721.250', () => {
    const reparto = repartir(
      entrada($(2_500_000), $(500_000), filaCon({ obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO] })),
    );
    expect(reparto.neta).toBe($(2_000_000));
    expect(
      reparto.obligaciones.map((obligacion) => [
        obligacion.tesoro,
        obligacion.sobre,
        obligacion.llega,
        obligacion.monto,
        obligacion.diezmo,
      ]),
    ).toEqual([
      [IIBB, $(2_500_000), $(2_000_000), $(87_500), false],
      [DIEZMO_ID, $(1_912_500), $(1_912_500), $(191_250), true],
    ]);
    expect(reparto.diezmo).toBe($(191_250));
    expect(reparto.diezmoBp).toBe(DIEZMO);
    expect(reparto.libre).toBe($(1_721_250));
    expect(reparto.remanente).toBe($(1_721_250));
  });

  it('con el diezmo primero salen 200.000 de diezmo y 87.500 de Ingresos Brutos, y quedan 1.712.500', () => {
    const reparto = repartir(
      entrada($(2_500_000), $(500_000), filaCon({ obligaciones: [DEL_DIEZMO, INGRESOS_BRUTOS] })),
    );
    expect(reparto.obligaciones.map((obligacion) => obligacion.monto)).toEqual([
      $(200_000),
      $(87_500),
    ]);
    expect(reparto.libre).toBe($(1_712_500));
  });

  it('cada obligación se redondea al centavo como el diezmo: la mitad sube', () => {
    const reparto = repartir(entrada(centavos(15), centavos(0), filaCon({})));
    expect(reparto.diezmo).toBe(2);
    expect(reparto.remanente).toBe(13);
  });

  it('una obligación nunca se lleva más que lo que le llega', () => {
    const reparto = repartir(
      entrada($(1_000_000), $(990_000), filaCon({ obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO] })),
    );
    expect(reparto.obligaciones.map((obligacion) => [obligacion.sobre, obligacion.monto])).toEqual([
      [$(1_000_000), $(10_000)],
      [$(0), $(0)],
    ]);
    expect(reparto.libre).toBe(0);
  });

  it('un trabajo a pérdida no aparta Ingresos Brutos aunque se deba', () => {
    const reparto = repartir(
      entrada($(100), $(300), filaCon({ obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO] })),
    );
    expect(reparto.obligaciones.map((obligacion) => obligacion.monto)).toEqual([0, 0]);
    expect(reparto.remanente).toBe($(-200));
  });

  it('en un perdido el diezmo sigue perdido_con_diezmo, con su porcentaje, y las demás se aplican igual', () => {
    const fila = filaCon({
      obligaciones: [INGRESOS_BRUTOS, { ...DEL_DIEZMO, porcentaje: bp(1_200) }],
    });
    const sinDiezmo = planDelReparto(
      'perdido',
      fila,
      { perdidoConSueldo: false, perdidoConDiezmo: false },
      SISTEMA,
    );
    expect(sinDiezmo.obligaciones.map((obligacion) => obligacion.porcentaje)).toEqual([350, 0]);
    const reparto = repartir({
      ...sinDiezmo,
      cobrado: $(1_000_000),
      gastos: $(0),
      previo: new Map(),
      topes: new Map(),
    });
    expect(reparto.obligaciones.map((obligacion) => obligacion.monto)).toEqual([$(35_000), 0]);
    expect([reparto.diezmoBp, reparto.diezmo]).toEqual([0, 0]);

    const conDiezmo = planDelReparto(
      'perdido',
      fila,
      { perdidoConSueldo: false, perdidoConDiezmo: true },
      SISTEMA,
    );
    expect(conDiezmo.obligaciones.map((obligacion) => obligacion.porcentaje)).toEqual([350, 1_200]);
  });
});

describe('cómo se llena cada paso', () => {
  const plan = planDelReparto(
    'cobrado',
    filaCon({
      pasos: [
        sueldo($(1_800_000)),
        fijos([['Alquiler', $(900_000), 10]], FIJOS, 'saldo'),
        prioridad(MATERIALES, $(300_000), { modo: 'trabajo' }),
        prioridad(COCOS, $(300_000), { hastaLaMeta: true }),
      ],
      reparto: [
        parte(INVERSIONES, 5_000, true),
        parte(INMUEBLES, 3_000, true),
        parte(SUPERAVIT, 1_000),
      ],
    }),
    COBRADO,
    SISTEMA,
  );
  const delMes = new Map<string, Money>([
    [HOGAR, $(700_000)],
    [FIJOS, $(999)],
    [MATERIALES, $(123)],
    [COCOS, $(100_000)],
  ]);
  const saldos = new Map<string, Money>([
    [FIJOS, $(630_000)],
    [COCOS, $(2_900_000)],
    [INVERSIONES, $(250_000)],
    [INMUEBLES, $(10)],
    [SUPERAVIT, $(1)],
  ]);
  const metas = new Map<string, Money>([
    [COCOS, $(3_000_000)],
    [INVERSIONES, $(300_000)],
    [INMUEBLES, $(0)],
    [SUPERAVIT, $(5)],
  ]);

  it('por mes, lo del mes; se renueva, su saldo; por trabajo, cero; y el piso de la meta', () => {
    const { previo, topes } = previoDelMes(plan, delMes, saldos, metas);
    expect(Object.fromEntries(previo)).toEqual({
      [HOGAR]: $(700_000),
      [FIJOS]: $(630_000),
      [MATERIALES]: $(0),
      [COCOS]: $(200_000),
    });
    expect(Object.fromEntries(topes)).toEqual({ [INVERSIONES]: $(50_000) });
  });

  it('un compromiso que se renueva al pagar, de 900.000 con 630.000 de saldo, recibe como mucho 270.000', () => {
    const reparto = repartir({
      ...plan,
      ...previoDelMes(plan, delMes, saldos, metas),
      cobrado: $(10_000_000),
      gastos: $(0),
    });
    expect(reparto.pasos.map((paso) => [paso.tesoro, paso.porMes, paso.tope, paso.monto])).toEqual([
      [HOGAR, true, $(1_100_000), $(1_100_000)],
      [FIJOS, true, $(270_000), $(270_000)],
      [MATERIALES, true, $(300_000), $(300_000)],
      [COCOS, true, $(100_000), $(100_000)],
    ]);
  });

  it('un saldo en rojo cuenta como cero', () => {
    const { previo } = previoDelMes(plan, delMes, new Map([[FIJOS, $(-5)]]), new Map());
    expect(previo.get(FIJOS)).toBe(0);
    expect(previo.get(COCOS)).toBe($(100_000));
  });

  it('lo que no está en el mes ni en los saldos es cero', () => {
    const { previo, topes } = previoDelMes(plan, new Map(), new Map(), metas);
    expect([...previo.values()]).toEqual([0, 0, 0, 0]);
    expect(Object.fromEntries(topes)).toEqual({ [INVERSIONES]: $(300_000) });
  });
});

describe('hasta la meta', () => {
  it('un ahorro del 20% hasta su meta de 300.000 con 250.000 recibe 50.000, y los 150.000 que no recibe van al superávit', () => {
    const fila = filaCon({ obligaciones: [], reparto: [parte(INVERSIONES, 2_000, true)] });
    const sinMeta = repartir(entrada($(1_000_000), $(0), fila));
    const conMeta = repartir(entrada($(1_000_000), $(0), fila, [], [[INVERSIONES, $(50_000)]]));
    expect(conMeta.reparto[0]).toMatchObject({
      tope: $(50_000),
      leTocaba: $(200_000),
      monto: $(50_000),
      llegaALaMeta: true,
    });
    expect(conMeta.remanente - sinMeta.remanente).toBe($(150_000));
    expect(sinMeta.reparto[0]).toMatchObject({ tope: null, llegaALaMeta: false });
  });

  it('una parte que no llega a su meta recibe lo suyo', () => {
    const fila = filaCon({ obligaciones: [], reparto: [parte(INVERSIONES, 2_000, true)] });
    const reparto = repartir(entrada($(100_000), $(0), fila, [], [[INVERSIONES, $(50_000)]]));
    expect(reparto.reparto[0]).toMatchObject({ monto: $(20_000), llegaALaMeta: false });
  });

  function liquidar(paso: PasoDeLaFila, saldo: Money, metas: [string, Money][]) {
    return calcularPorLaFila({
      destino: 'cobrado',
      fecha: '2026-09-25',
      cobrado: $(2_000_000),
      gastos: $(0),
      fila: filaCon({ obligaciones: [], pasos: [paso] }),
      sistema: SISTEMA,
      ajustes: COBRADO,
      liquidaciones: [],
      coberturas: [],
      saldos: new Map([[paso.tesoro, saldo]]),
      metas: new Map(metas),
    }).pasos[0];
  }

  it('un ahorro fijo recibe lo menor entre lo que le falta según su modo y lo que le falta para la meta', () => {
    const paso = prioridad(MATERIALES, $(300_000), { hastaLaMeta: true });
    expect(liquidar(paso, $(900_000), [[MATERIALES, $(1_000_000)]])).toMatchObject({
      lleva: $(0),
      previo: $(200_000),
      tope: $(100_000),
      monto: $(100_000),
      faltaParaLaMeta: $(100_000),
      llegaALaMeta: true,
    });
    expect(liquidar(paso, $(500_000), [[MATERIALES, $(1_000_000)]])).toMatchObject({
      previo: $(0),
      tope: $(300_000),
      faltaParaLaMeta: $(500_000),
      llegaALaMeta: false,
    });
  });

  it('con el saldo arriba de la meta no recibe nada, y llegó', () => {
    const paso = prioridad(MATERIALES, $(300_000), { hastaLaMeta: true, modo: 'saldo' });
    expect(liquidar(paso, $(1_200_000), [[MATERIALES, $(1_000_000)]])).toMatchObject({
      lleva: $(1_200_000),
      tope: $(0),
      monto: $(0),
      faltaParaLaMeta: $(0),
      llegaALaMeta: true,
    });
  });

  it('un tesoro que se quedó sin meta junta sin fin', () => {
    const paso = prioridad(MATERIALES, $(300_000), { hastaLaMeta: true });
    for (const metas of [[], [[MATERIALES, $(0)]]] as [string, Money][][]) {
      expect(liquidar(paso, $(900_000), metas)).toMatchObject({
        tope: $(300_000),
        faltaParaLaMeta: null,
        llegaALaMeta: false,
      });
    }
  });
});

describe('el superávit', () => {
  it('con el superávit en otro tesoro, lo que sobra va ahí como un reparto más', () => {
    const fila = filaCon({ reparto: [parte(INVERSIONES, 5_000)], superavit: SUPERAVIT });
    const reparto = repartir(entrada($(1_000_000), $(0), fila));
    expect(reparto.superavit).toBe(SUPERAVIT);
    expect(repartosDelCobro(reparto).at(-1)).toEqual({
      tipo: 'superavit',
      tesoro: SUPERAVIT,
      monto: $(450_000),
    });
  });

  it('con pérdida, el superávit aparte no recibe nada y la pérdida queda en el taller', () => {
    const reparto = repartir(entrada($(100), $(300), filaCon({ superavit: SUPERAVIT })));
    expect(repartosDelCobro(reparto)).toEqual([{ tipo: 'superavit', tesoro: SUPERAVIT, monto: 0 }]);
    expect(reparto.remanente).toBe($(-200));
  });

  it('en Maun no lleva reparto propio', () => {
    expect(repartosDelCobro(repartir(entrada($(1_000), $(0), filaCon({}))))).toEqual([]);
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
        pasos: [
          {
            tesoro: HOGAR,
            clase: 'sueldo',
            objetivo: centavos(-1),
            porMes: true,
            modo: 'mes',
            hastaLaMeta: false,
          },
        ],
      }),
    ).toThrow(RangeError);
    expect(() => repartir({ ...base, previo: new Map([[HOGAR, centavos(-1)]]) })).toThrow(
      RangeError,
    );
    expect(() => repartir({ ...base, topes: new Map([[COCOS, centavos(-1)]]) })).toThrow(
      RangeError,
    );
  });

  it('porcentajes fuera de rango, en cero o que pasan del 100%', () => {
    expect(() =>
      repartir({
        ...base,
        obligaciones: [{ ...DEL_DIEZMO, porcentaje: 10_001 as never, diezmo: true }],
      }),
    ).toThrow(RangeError);
    expect(() => repartir({ ...base, reparto: [parte(INVERSIONES, 0)] })).toThrow(RangeError);
    expect(() =>
      repartir({ ...base, reparto: [parte(INVERSIONES, 6_000), parte(INMUEBLES, 5_000)] }),
    ).toThrow(RangeError);
  });

  it('una obligación sin sobre qué calcularse, o dos diezmos', () => {
    expect(() =>
      repartir({
        ...base,
        obligaciones: [{ ...DEL_DIEZMO, base: 'neta' as never, diezmo: true }],
      }),
    ).toThrow(RangeError);
    expect(() =>
      repartir({
        ...base,
        obligaciones: [
          { ...DEL_DIEZMO, diezmo: true },
          { ...INGRESOS_BRUTOS, diezmo: true },
        ],
      }),
    ).toThrow(RangeError);
  });

  it('un tesoro repetido, también entre las obligaciones', () => {
    expect(() => repartir({ ...base, reparto: [parte(HOGAR, 1_000)] })).toThrow(RangeError);
    expect(() =>
      repartir({ ...base, obligaciones: [{ ...INGRESOS_BRUTOS, tesoro: COCOS, diezmo: false }] }),
    ).toThrow(RangeError);
  });

  it('un sobrante tan grande que el porcentaje dejaría de ser exacto', () => {
    const enorme = filaCon({ obligaciones: [], reparto: [parte(INVERSIONES, 10_000)] });
    expect(() => repartir(entrada(centavos(2 ** 50), centavos(0), enorme))).toThrow(RangeError);
  });

  it('un cobro tan grande que la obligación sobre lo cobrado dejaría de ser exacta', () => {
    const fila = filaCon({ obligaciones: [{ ...INGRESOS_BRUTOS, porcentaje: bp(10_000) }] });
    expect(() => repartir(entrada(centavos(2 ** 50), centavos(2 ** 50 - 1), fila))).toThrow(
      RangeError,
    );
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

      const fila = filaDeSiempre(ajustes, { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO_ID });
      const reparto = repartir({
        ...planDelReparto(perdido ? 'perdido' : 'cobrado', fila, flags, SISTEMA),
        cobrado,
        gastos,
        previo: new Map([
          [HOGAR, previo.sueldo],
          [MAUN, previo.fijos],
        ]),
        topes: new Map(),
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
  it('sale de los ajustes: el diezmo al 10% del ingreso, el sueldo al hogar y los costos fijos en el taller, que es el superávit', () => {
    expect(
      filaDeSiempre(
        { sueldoMensual: $(1_800_000), costosFijos: $(250_000), sueldoTopeMensual: false },
        SISTEMA,
      ),
    ).toEqual({
      obligaciones: [{ tesoro: DIEZMO_ID, porcentaje: 1_000, base: 'ingreso' }],
      pasos: [
        {
          tesoro: HOGAR,
          clase: 'sueldo',
          tope: $(1_800_000),
          renglones: [],
          desde: null,
          modo: 'mes',
          hastaLaMeta: false,
        },
        {
          tesoro: MAUN,
          clase: 'fijos',
          tope: $(250_000),
          renglones: [{ nombre: 'Costos fijos', monto: $(250_000), dia: null }],
          desde: null,
          modo: 'mes',
          hastaLaMeta: false,
        },
      ],
      reparto: [],
      superavit: MAUN,
      sueldoPorTrabajo: true,
    });
  });

  it('un paso en cero no entra, así que la fila del dueño de hoy es el diezmo y su sueldo', () => {
    expect(
      filaDeSiempre(
        { sueldoMensual: $(1_800_000), costosFijos: $(0), sueldoTopeMensual: true },
        SISTEMA,
      ).pasos.map((paso) => paso.clase),
    ).toEqual(['sueldo']);
    expect(
      filaDeSiempre({ sueldoMensual: $(0), costosFijos: $(0), sueldoTopeMensual: true }, SISTEMA),
    ).toEqual(filaCon({}));
  });

  it('rechaza importes negativos', () => {
    expect(() =>
      filaDeSiempre(
        { sueldoMensual: centavos(-1), costosFijos: $(0), sueldoTopeMensual: true },
        SISTEMA,
      ),
    ).toThrow(RangeError);
    expect(() =>
      filaDeSiempre(
        { sueldoMensual: $(0), costosFijos: centavos(-1), sueldoTopeMensual: true },
        SISTEMA,
      ),
    ).toThrow(RangeError);
  });
});

describe('el plan del reparto', () => {
  it('un perdido lleva sueldo según los ajustes y los demás pasos iguales', () => {
    const sinNada = planDelReparto(
      'perdido',
      FILA_DE_ELISEO,
      { perdidoConSueldo: false, perdidoConDiezmo: false },
      SISTEMA,
    );
    expect(sinNada.obligaciones[0]).toMatchObject({ porcentaje: 0, diezmo: true });
    expect(sinNada.pasos[0]?.objetivo).toBe(0);
    expect(sinNada.pasos[1]?.objetivo).toBe($(900_000));

    const conTodo = planDelReparto(
      'perdido',
      FILA_DE_ELISEO,
      { perdidoConSueldo: true, perdidoConDiezmo: true },
      SISTEMA,
    );
    expect(conTodo.obligaciones[0]?.porcentaje).toBe(DIEZMO);
    expect(conTodo.pasos[0]?.objetivo).toBe($(1_800_000));
  });

  it('marca el diezmo, pasa el modo y la meta, y el superávit es null cuando queda en Maun', () => {
    const fila = filaCon({
      obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
      pasos: [prioridad(MATERIALES, $(1), { modo: 'trabajo', hastaLaMeta: true })],
      reparto: [parte(INVERSIONES, 100, true)],
      superavit: SUPERAVIT,
    });
    expect(planDelReparto('cobrado', fila, COBRADO, SISTEMA)).toEqual({
      obligaciones: [
        { ...INGRESOS_BRUTOS, diezmo: false },
        { ...DEL_DIEZMO, diezmo: true },
      ],
      pasos: [
        {
          tesoro: MATERIALES,
          clase: 'prioridad',
          objetivo: $(1),
          porMes: true,
          modo: 'trabajo',
          hastaLaMeta: true,
        },
      ],
      reparto: [parte(INVERSIONES, 100, true)],
      superavit: SUPERAVIT,
    });
    expect(planDelReparto('cobrado', filaCon({}), COBRADO, SISTEMA).superavit).toBeNull();
  });

  it('una fila sin el diezmo no marca ninguna, y reparte sin diezmo', () => {
    const plan = planDelReparto(
      'cobrado',
      filaCon({ obligaciones: [INGRESOS_BRUTOS] }),
      COBRADO,
      SISTEMA,
    );
    expect(plan.obligaciones.map((obligacion) => obligacion.diezmo)).toEqual([false]);
    const reparto = repartir({
      ...plan,
      cobrado: $(100),
      gastos: $(0),
      previo: new Map(),
      topes: new Map(),
    });
    expect([reparto.diezmoBp, reparto.diezmo]).toEqual([0, 0]);
  });

  it('se vuelve a armar desde lo que se repartió', () => {
    const fila = filaCon({
      obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
      pasos: FILA_DE_ELISEO.pasos,
      reparto: [parte(INVERSIONES, 2_000, true)],
      superavit: SUPERAVIT,
    });
    const plan = planDelReparto('cobrado', fila, COBRADO, SISTEMA);
    const reparto = repartir({
      ...plan,
      cobrado: $(3_000_000),
      gastos: $(0),
      previo: new Map(),
      topes: new Map(),
    });
    expect(planDeLaLiquidacion(reparto)).toEqual(plan);
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
    const delMes = loDelMes(
      liquidaciones,
      [
        { tesoro: FIJOS, mes: '2026-09', monto: $(400) },
        { tesoro: FIJOS, mes: '2026-08', monto: $(999) },
      ],
      '2026-09',
    );
    expect(Object.fromEntries(delMes)).toEqual({
      [HOGAR]: $(700),
      [MATERIALES]: $(100),
      [FIJOS]: $(400),
    });
  });

  it('un mes mal escrito se rechaza, también en una cobertura', () => {
    expect(() => loDelMes([], [], '2026-9')).toThrow(RangeError);
    expect(() =>
      loDelMes([], [{ tesoro: FIJOS, mes: 'septiembre', monto: $(1) }], '2026-09'),
    ).toThrow(RangeError);
  });

  it('calcularPorLaFila usa el mes de la fecha del cobro, los saldos y las metas', () => {
    const fila = filaCon({
      pasos: [
        fijos(
          [
            ['Alquiler', $(500_000), 10],
            ['Luz', $(400_000)],
          ],
          FIJOS,
          'saldo',
        ),
        prioridad(MATERIALES, $(300_000), { hastaLaMeta: true }),
      ],
      reparto: [parte(INVERSIONES, 2_000, true)],
      superavit: SUPERAVIT,
    });
    const liquidacion = calcularPorLaFila({
      destino: 'cobrado',
      fecha: '2026-09-25',
      cobrado: $(2_000_000),
      gastos: $(0),
      fila,
      sistema: SISTEMA,
      ajustes: COBRADO,
      liquidaciones: [
        {
          fecha: '2026-09-02',
          neta: $(1),
          diezmo: $(0),
          aportes: [{ tesoro: MATERIALES, monto: $(50_000) }],
          remanente: $(0),
        },
      ],
      coberturas: [],
      saldos: new Map([
        [FIJOS, $(630_000)],
        [MATERIALES, $(900_000)],
        [INVERSIONES, $(250_000)],
      ]),
      metas: new Map([
        [MATERIALES, $(1_000_000)],
        [INVERSIONES, $(300_000)],
      ]),
    });
    expect(liquidacion).toMatchObject({
      destino: 'cobrado',
      fecha: '2026-09-25',
      diezmo: $(200_000),
      libre: $(1_800_000),
      ganancia: $(1_530_000),
      sobrante: $(1_430_000),
      remanente: $(1_380_000),
      superavit: SUPERAVIT,
    });
    expect(
      liquidacion.pasos.map((paso) => [
        paso.lleva,
        paso.previo,
        paso.tope,
        paso.monto,
        paso.faltaParaLaMeta,
        paso.llegaALaMeta,
      ]),
    ).toEqual([
      [$(630_000), $(630_000), $(270_000), $(270_000), null, false],
      [$(50_000), $(200_000), $(100_000), $(100_000), $(100_000), true],
    ]);
    expect(liquidacion.reparto[0]).toMatchObject({ tope: $(50_000), monto: $(50_000) });
    expect(repartosDelCobro(liquidacion)).toEqual([
      {
        tipo: 'paso',
        tesoro: FIJOS,
        clase: 'fijos',
        modo: 'saldo',
        objetivo: $(900_000),
        previo: $(630_000),
        tope: $(270_000),
        porMes: true,
        monto: $(270_000),
      },
      {
        tipo: 'paso',
        tesoro: MATERIALES,
        clase: 'prioridad',
        modo: 'mes',
        objetivo: $(300_000),
        previo: $(200_000),
        tope: $(100_000),
        porMes: true,
        monto: $(100_000),
      },
      { tipo: 'parte', tesoro: INVERSIONES, porcentaje: 2_000, tope: $(50_000), monto: $(50_000) },
      { tipo: 'superavit', tesoro: SUPERAVIT, monto: $(1_380_000) },
    ]);
    expect(previoQueVio(liquidacion)).toEqual({
      [FIJOS]: $(630_000),
      [MATERIALES]: $(200_000),
      [INVERSIONES]: $(50_000),
    });
  });
});

describe('lo que se congela en las columnas de siempre y en los repartos', () => {
  it('el diezmo de verdad, sueldo y fijos en cero y el remanente es el ingreso menos el diezmo', () => {
    const fila = filaCon({ ...FILA_DE_ELISEO, obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO] });
    const reparto = repartir(entrada($(2_000_000), $(100_000), fila));
    const columnas = columnasDeSiempre(reparto);
    expect(columnas).toEqual({
      diezmoBp: DIEZMO,
      diezmo: $(183_000),
      topeSueldo: 0,
      topeFijos: 0,
      sueldo: 0,
      fijos: 0,
      remanente: $(1_717_000),
      objetivoSueldo: 0,
      objetivoFijos: 0,
      sueldoMensual: true,
      sueldoPrevio: 0,
      fijosPrevio: 0,
    });
    expect(columnas.diezmo + columnas.remanente).toBe(reparto.neta);
  });

  it('con pérdida, el remanente es la pérdida', () => {
    expect(columnasDeSiempre(repartir(entrada($(100), $(300), FILA_DE_ELISEO))).remanente).toBe(
      $(-200),
    );
  });

  it('los repartos van en el orden de la fila: las otras obligaciones, los pasos, las partes y el superávit aparte', () => {
    const fila = filaCon({
      ...FILA_DE_ELISEO,
      obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
      superavit: SUPERAVIT,
    });
    const reparto = repartir(entrada($(3_000_000), $(0), fila));
    expect(repartosDelCobro(reparto).map((una) => [una.tipo, una.tesoro])).toEqual([
      ['obligacion', IIBB],
      ['paso', HOGAR],
      ['paso', FIJOS],
      ['paso', MATERIALES],
      ['parte', INVERSIONES],
      ['parte', INMUEBLES],
      ['parte', COCOS],
      ['superavit', SUPERAVIT],
    ]);
    expect(repartosDelCobro(reparto)[0]).toEqual({
      tipo: 'obligacion',
      tesoro: IIBB,
      porcentaje: 350,
      base: 'cobrado',
      monto: $(105_000),
    });
    expect(aportesDelReparto(reparto).map((aporte) => aporte.tesoro)).toEqual([
      IIBB,
      HOGAR,
      FIJOS,
      MATERIALES,
      INVERSIONES,
      INMUEBLES,
      COCOS,
      SUPERAVIT,
    ]);
    expect(
      aportesDelReparto(reparto).reduce<number>(
        (suma, aporte) => suma + aporte.monto,
        reparto.diezmo,
      ),
    ).toBe(reparto.neta);
  });
});

describe('lo que vio la app y lo que suma la base', () => {
  const plan = planDelReparto(
    'cobrado',
    filaCon({
      pasos: [PASO_SUELDO, PASO_MATERIALES],
      reparto: [parte(INVERSIONES, 1_000, true), parte(INMUEBLES, 1_000)],
    }),
    COBRADO,
    SISTEMA,
  );

  it('se lee como {tesoro: centavos}: cada paso con lo suyo o cero, y cada parte con tope solo si lo trae', () => {
    const { previo, topes } = previoDeLoVisto(plan, {
      [HOGAR]: 500,
      [MATERIALES]: 1.5,
      [INVERSIONES]: 70,
      [COCOS]: 3,
    });
    expect(Object.fromEntries(previo)).toEqual({ [HOGAR]: 500, [MATERIALES]: 0 });
    expect(Object.fromEntries(topes)).toEqual({ [INVERSIONES]: 70 });
    expect(Object.fromEntries(previoDeLoVisto(plan, null).previo)).toEqual({
      [HOGAR]: 0,
      [MATERIALES]: 0,
    });
  });

  it('es otro si cambia un paso, o si una parte tiene tope en uno y no en el otro, o con otro valor', () => {
    const base = { [HOGAR]: 500, [MATERIALES]: 0, [INVERSIONES]: 70 };
    expect(loVistoEsOtro(plan, base, base)).toBe(false);
    expect(loVistoEsOtro(plan, { [HOGAR]: 500, [INVERSIONES]: 70 }, base)).toBe(false);
    expect(loVistoEsOtro(plan, { ...base, [HOGAR]: 400 }, base)).toBe(true);
    expect(loVistoEsOtro(plan, { [HOGAR]: 500 }, base)).toBe(true);
    expect(loVistoEsOtro(plan, { ...base, [INVERSIONES]: 71 }, base)).toBe(true);
    expect(loVistoEsOtro(plan, { ...base, [INMUEBLES]: 0 }, base)).toBe(true);
    expect(loVistoEsOtro(plan, { ...base, [COCOS]: 1 }, base)).toBe(false);
  });

  it('sin lo que vio la app no hay nada con qué ajustar', () => {
    expect(loVistoEsOtro(plan, null, { [HOGAR]: 1 })).toBe(false);
    expect(loVistoEsOtro(plan, undefined, { [HOGAR]: 1 })).toBe(false);
  });

  it('lo que vio la app lleva cada paso y solo las partes con tope, y se vuelve a leer igual', () => {
    const reparto = repartir({
      ...plan,
      cobrado: $(3_000_000),
      gastos: $(0),
      previo: new Map([[HOGAR, $(1_000_000)]]),
      topes: new Map([[INVERSIONES, $(7)]]),
    });
    const visto = previoQueVio(reparto);
    expect(visto).toEqual({ [HOGAR]: $(1_000_000), [MATERIALES]: 0, [INVERSIONES]: $(7) });
    const leido = previoDeLoVisto(plan, JSON.parse(JSON.stringify(visto)));
    expect(Object.fromEntries(leido.previo)).toEqual({ [HOGAR]: $(1_000_000), [MATERIALES]: 0 });
    expect(Object.fromEntries(leido.topes)).toEqual({ [INVERSIONES]: $(7) });
    expect(loVistoEsOtro(plan, visto, JSON.parse(JSON.stringify(visto)))).toBe(false);
  });
});

describe('leer la fila guardada', () => {
  it('lee la forma nueva tal cual la guarda la base', () => {
    const fila = filaCon({
      obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
      pasos: [
        PASO_SUELDO,
        fijos([['Alquiler', $(500_000), 10]], FIJOS, 'saldo'),
        prioridad(MATERIALES, $(1), { modo: 'trabajo', hastaLaMeta: true, desde: '2026-09' }),
      ],
      reparto: [parte(INVERSIONES, 2_000, true)],
      superavit: SUPERAVIT,
    });
    expect(leerLaFila(JSON.parse(JSON.stringify(fila)), SISTEMA)).toEqual(fila);
  });

  it('lee la forma del primer pedido y completa lo que falta con lo de siempre', () => {
    const primerPedido = {
      pasos: [
        { tesoro: HOGAR, clase: 'sueldo', tope: 1, renglones: [], desde: null },
        {
          tesoro: FIJOS,
          clase: 'fijos',
          tope: 2,
          renglones: [{ nombre: 'Luz', monto: 2 }],
          desde: '2026-09',
        },
      ],
      reparto: [{ tesoro: COCOS, porcentaje: 500 }],
      sueldoPorTrabajo: false,
    };
    expect(leerLaFila(primerPedido, SISTEMA)).toEqual({
      obligaciones: [{ tesoro: DIEZMO_ID, porcentaje: 1_000, base: 'ingreso' }],
      pasos: [
        {
          tesoro: HOGAR,
          clase: 'sueldo',
          tope: 1,
          renglones: [],
          desde: null,
          modo: 'mes',
          hastaLaMeta: false,
        },
        {
          tesoro: FIJOS,
          clase: 'fijos',
          tope: 2,
          renglones: [{ nombre: 'Luz', monto: 2, dia: null }],
          desde: '2026-09',
          modo: 'mes',
          hastaLaMeta: false,
        },
      ],
      reparto: [{ tesoro: COCOS, porcentaje: 500, hastaLaMeta: false }],
      superavit: MAUN,
      sueldoPorTrabajo: false,
    });
    expect(primerProblemaDeLaFila(primerPedido, TESOROS)).toBeNull();
  });

  it('un renglón con el día en null es sin día', () => {
    const fila = leerLaFila(
      {
        pasos: [
          {
            tesoro: FIJOS,
            clase: 'fijos',
            tope: 1,
            renglones: [{ nombre: 'Luz', monto: 1, dia: null }],
            desde: null,
          },
        ],
        reparto: [],
        sueldoPorTrabajo: false,
      },
      SISTEMA,
    );
    expect(fila?.pasos[0]?.renglones[0]?.dia).toBeNull();
  });

  it('cualquier otra forma es inválida', () => {
    const guardada = JSON.parse(JSON.stringify(FILA_DE_ELISEO)) as Record<string, unknown>;
    const conPaso = (paso: unknown) => ({ ...guardada, pasos: [paso] });
    const conParte = (una: unknown) => ({ ...guardada, reparto: [una] });
    const conObligacion = (obligacion: unknown) => ({ ...guardada, obligaciones: [obligacion] });
    const pasoBueno = {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: 1,
      renglones: [],
      desde: null,
    };
    const renglonBueno = { nombre: 'Luz', monto: 1 };
    for (const valor of [
      null,
      [],
      'fila',
      { pasos: [], reparto: [] },
      { ...guardada, pasos: {} },
      { ...guardada, pasos: undefined },
      { ...guardada, reparto: {} },
      { ...guardada, obligaciones: {} },
      { ...guardada, obligaciones: null },
      { ...guardada, superavit: null },
      { ...guardada, superavit: 'MAUN' },
      { ...guardada, superavit: 7 },
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
      conPaso({ ...pasoBueno, renglones: [{ ...renglonBueno, dia: '10' }] }),
      conPaso({ ...pasoBueno, renglones: [{ ...renglonBueno, dia: 1.5 }] }),
      conPaso({ ...pasoBueno, desde: 202609 }),
      conPaso({ tesoro: MATERIALES, clase: 'prioridad', tope: 1, renglones: [] }),
      conPaso({ ...pasoBueno, modo: 'otro' }),
      conPaso({ ...pasoBueno, modo: null }),
      conPaso({ ...pasoBueno, hastaLaMeta: 'si' }),
      conPaso({ ...pasoBueno, hastaLaMeta: null }),
      conParte(null),
      conParte({ tesoro: 1, porcentaje: 1 }),
      conParte({ tesoro: 'inversiones', porcentaje: 1 }),
      conParte({ tesoro: INVERSIONES, porcentaje: 0.5 }),
      conParte({ tesoro: INVERSIONES, porcentaje: 1, hastaLaMeta: 1 }),
      conObligacion(null),
      conObligacion({ tesoro: 'IIBB', porcentaje: 350, base: 'cobrado' }),
      conObligacion({ tesoro: IIBB, porcentaje: 3.5, base: 'cobrado' }),
      conObligacion({ tesoro: IIBB, porcentaje: 350, base: 'neta' }),
      conObligacion({ tesoro: IIBB, porcentaje: 350 }),
    ]) {
      expect(leerLaFila(valor, SISTEMA)).toBeNull();
      expect(primerProblemaDeLaFila(valor, TESOROS)).toBe('forma-invalida');
    }
  });
});

describe('lo que no se puede guardar', () => {
  function problemas(cambios: Partial<Fila>) {
    return problemasDeLaFila(filaCon(cambios), TESOROS);
  }

  function primero(cambios: Partial<Fila>) {
    return problemas(cambios)[0];
  }

  it('la fila del dueño es válida, también con Ingresos Brutos y el superávit aparte', () => {
    expect(problemasDeLaFila(FILA_DE_ELISEO, TESOROS)).toEqual([]);
    expect(primerProblemaDeLaFila(JSON.parse(JSON.stringify(FILA_DE_ELISEO)), TESOROS)).toBeNull();
    expect(
      problemas({
        obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
        pasos: [
          PASO_SUELDO,
          fijos([['Alquiler', $(500_000), 10]], FIJOS, 'saldo'),
          fijos([['Costos fijos', $(1)]], MAUN),
          prioridad(MATERIALES, $(1), { modo: 'trabajo', hastaLaMeta: true }),
          prioridad(COCOS, $(1), { modo: 'saldo', hastaLaMeta: true }),
        ],
        reparto: [parte(INVERSIONES, 2_000, true)],
        superavit: SUPERAVIT,
      }),
    ).toEqual([]);
  });

  it('demasiadas obligaciones, pasos o partes', () => {
    const siete = Array.from({ length: 7 }, () => INGRESOS_BRUTOS);
    expect(primero({ obligaciones: siete })).toEqual({
      problema: 'demasiadas-obligaciones',
      tesoro: null,
    });
    const muchos = Array.from({ length: 13 }, () => prioridad(MATERIALES, $(1)));
    expect(primero({ pasos: muchos })).toEqual({ problema: 'demasiados-pasos', tesoro: null });
    const partes = Array.from({ length: 9 }, () => parte(INVERSIONES, 1));
    expect(primero({ reparto: partes })).toEqual({ problema: 'demasiadas-partes', tesoro: null });
  });

  it('el tesoro de cada obligación, paso, parte y del superávit', () => {
    expect(primero({ pasos: [prioridad(DESCONOCIDO, $(1))] })?.problema).toBe('tesoro-desconocido');
    expect(primero({ pasos: [prioridad(ARCHIVADO, $(1))] })?.problema).toBe('tesoro-archivado');
    expect(primero({ pasos: [prioridad(MATERIALES, $(1)), prioridad(MATERIALES, $(2))] })).toEqual({
      problema: 'tesoro-repetido',
      tesoro: MATERIALES,
    });
    expect(primero({ reparto: [parte(DESCONOCIDO, 1)] })?.problema).toBe('tesoro-desconocido');
    expect(
      primero({ pasos: [prioridad(MATERIALES, $(1))], reparto: [parte(MATERIALES, 1)] })?.problema,
    ).toBe('tesoro-repetido');
    expect(
      primero({ obligaciones: [DEL_DIEZMO, { ...INGRESOS_BRUTOS, tesoro: DESCONOCIDO }] }),
    ).toEqual({ problema: 'tesoro-desconocido', tesoro: DESCONOCIDO });
    expect(primero({ obligaciones: [DEL_DIEZMO, DEL_DIEZMO] })?.problema).toBe('tesoro-repetido');
    expect(
      primero({ obligaciones: [DEL_DIEZMO, INGRESOS_BRUTOS], pasos: [prioridad(IIBB, $(1))] }),
    ).toEqual({ problema: 'tesoro-repetido', tesoro: IIBB });
    expect(primero({ superavit: DESCONOCIDO })).toEqual({
      problema: 'tesoro-desconocido',
      tesoro: DESCONOCIDO,
    });
    expect(primero({ superavit: ARCHIVADO })?.problema).toBe('tesoro-archivado');
  });

  it('un tesoro en otra moneda no entra a la fila: la fila reparte pesos', () => {
    const DOLARES = '00000000-0000-7000-8000-000000000017';
    const conDolares: TesoroDeLaFila[] = [
      ...TESOROS,
      { id: DOLARES, clave: null, archivado: false, meta: $(1_000), moneda: 'USD' },
    ];
    const primeroConDolares = (cambios: Partial<Fila>) =>
      problemasDeLaFila(filaCon(cambios), conDolares)[0];
    expect(primeroConDolares({ pasos: [prioridad(DOLARES, $(1))] })).toEqual({
      problema: 'tesoro-en-otra-moneda',
      tesoro: DOLARES,
    });
    expect(primeroConDolares({ reparto: [parte(DOLARES, 1)] })?.problema).toBe(
      'tesoro-en-otra-moneda',
    );
    expect(
      primeroConDolares({ obligaciones: [DEL_DIEZMO, { ...INGRESOS_BRUTOS, tesoro: DOLARES }] })
        ?.problema,
    ).toBe('tesoro-en-otra-moneda');
    expect(primeroConDolares({ superavit: DOLARES })?.problema).toBe('tesoro-en-otra-moneda');
    expect(primerProblemaDeLaFila(filaCon({ superavit: DOLARES }), conDolares)).toBe(
      'tesoro-en-otra-moneda',
    );
  });

  it('el archivado va antes que la moneda, y un tesoro sin moneda es de la moneda del taller', () => {
    const conDolaresArchivado: TesoroDeLaFila[] = [
      ...TESOROS.filter(({ id }) => id !== ARCHIVADO),
      { id: ARCHIVADO, clave: null, archivado: true, meta: null, moneda: 'USD' },
      { id: MATERIALES, clave: null, archivado: false, meta: null, moneda: 'ARS' },
    ];
    expect(
      problemasDeLaFila(filaCon({ pasos: [prioridad(ARCHIVADO, $(1))] }), conDolaresArchivado)[0]
        ?.problema,
    ).toBe('tesoro-archivado');
    expect(esDeLaMonedaDelTaller({})).toBe(true);
    expect(esDeLaMonedaDelTaller({ moneda: 'ARS' })).toBe(true);
    expect(esDeLaMonedaDelTaller({ moneda: 'USD' })).toBe(false);
  });

  it('las obligaciones: el diezmo va entre ellas, sin Hogar ni Maun, y cada una con su porcentaje', () => {
    expect(primero({ obligaciones: [] })).toEqual({ problema: 'sin-diezmo', tesoro: null });
    expect(primero({ obligaciones: [INGRESOS_BRUTOS] })?.problema).toBe('sin-diezmo');
    for (const tesoro of [HOGAR, MAUN]) {
      expect(primero({ obligaciones: [DEL_DIEZMO, { ...INGRESOS_BRUTOS, tesoro }] })).toEqual({
        problema: 'obligacion-en-hogar-o-maun',
        tesoro,
      });
    }
    for (const obligacion of [
      { ...INGRESOS_BRUTOS, porcentaje: bp(0) },
      { ...INGRESOS_BRUTOS, porcentaje: 10_001 as never },
      { ...INGRESOS_BRUTOS, porcentaje: 1.5 as never },
      { ...INGRESOS_BRUTOS, base: 'neta' as never },
    ]) {
      expect(primero({ obligaciones: [DEL_DIEZMO, obligacion] })).toEqual({
        problema: 'obligacion-invalida',
        tesoro: IIBB,
      });
    }
    expect(problemas({ obligaciones: [{ ...DEL_DIEZMO, porcentaje: bp(10_000) }] })).toEqual([]);
  });

  it('el diezmo va entre las obligaciones, no en los pasos ni en el reparto', () => {
    expect(
      problemas({ obligaciones: [INGRESOS_BRUTOS], pasos: [prioridad(DIEZMO_ID, $(1))] }),
    ).toEqual([
      { problema: 'sin-diezmo', tesoro: null },
      { problema: 'diezmo-en-la-fila', tesoro: DIEZMO_ID },
    ]);
    expect(problemas({ obligaciones: [INGRESOS_BRUTOS], reparto: [parte(DIEZMO_ID, 1)] })).toEqual([
      { problema: 'sin-diezmo', tesoro: null },
      { problema: 'diezmo-en-la-fila', tesoro: DIEZMO_ID },
    ]);
    expect(problemas({ reparto: [parte(DIEZMO_ID, 1)] })).toEqual([
      { problema: 'tesoro-repetido', tesoro: DIEZMO_ID },
    ]);
  });

  it('las clases de cada tesoro del sistema', () => {
    expect(primero({ pasos: [prioridad(HOGAR, $(1))] })?.problema).toBe('hogar-no-es-sueldo');
    expect(primero({ pasos: [{ ...prioridad(COCOS, $(1)), clase: 'sueldo' }] })?.problema).toBe(
      'sueldo-no-es-hogar',
    );
    expect(primero({ pasos: [prioridad(MAUN, $(1))] })?.problema).toBe('maun-no-es-fijos');
    expect(problemas({ pasos: [fijos([['Alquiler', $(1)]], MAUN)] })).toEqual([]);
    expect(primero({ reparto: [parte(MAUN, 1)] })?.problema).toBe('maun-en-el-reparto');
    expect(primero({ reparto: [parte(HOGAR, 1)] })?.problema).toBe('hogar-en-el-reparto');
  });

  it('los montos, los renglones y sus días', () => {
    expect(primero({ pasos: [prioridad(MATERIALES, centavos(-1))] })?.problema).toBe(
      'tope-fuera-de-rango',
    );
    expect(primero({ pasos: [prioridad(MATERIALES, centavos(1_000_000_000_001))] })?.problema).toBe(
      'tope-fuera-de-rango',
    );
    expect(
      primero({
        pasos: [
          { ...prioridad(MATERIALES, $(1)), renglones: [{ nombre: 'x', monto: $(1), dia: null }] },
        ],
      })?.problema,
    ).toBe('renglones-en-otra-clase');
    expect(primero({ pasos: [{ ...fijos([]), tope: $(0) }] })?.problema).toBe(
      'fijos-sin-renglones',
    );
    const trece = Array.from({ length: 13 }, (_, i): [string, Money] => [`R${String(i)}`, $(1)]);
    expect(primero({ pasos: [fijos(trece)] })?.problema).toBe('demasiados-renglones');
    expect(primero({ pasos: [fijos([['   ', $(1)]])] })?.problema).toBe('renglon-sin-nombre');
    expect(primero({ pasos: [fijos([['a'.repeat(41), $(1)]])] })?.problema).toBe('renglon-largo');
    expect(problemas({ pasos: [fijos([['ñ'.repeat(40), $(1)]])] })).toEqual([]);
    expect(primero({ pasos: [fijos([['Luz', $(0)]])] })?.problema).toBe('renglon-fuera-de-rango');
    expect(
      primero({ pasos: [{ ...fijos([['Luz', centavos(1_000_000_000_001)]]), tope: $(1) }] })
        ?.problema,
    ).toBe('renglon-fuera-de-rango');
    for (const dia of [0, 32, 1.5]) {
      expect(primero({ pasos: [fijos([['Luz', $(10), dia]])] })).toEqual({
        problema: 'dia-invalido',
        tesoro: FIJOS,
      });
    }
    expect(
      problemas({
        pasos: [
          fijos([
            ['Luz', $(10), 1],
            ['Gas', $(1), 31],
          ]),
        ],
      }),
    ).toEqual([]);
    expect(primero({ pasos: [{ ...fijos([['Luz', $(10)]]), tope: $(11) }] })?.problema).toBe(
      'tope-no-es-la-suma',
    );
    expect(primero({ pasos: [prioridad(MATERIALES, $(1), { desde: '2026-13' })] })?.problema).toBe(
      'desde-invalido',
    );
    expect(problemas({ pasos: [prioridad(MATERIALES, $(1), { desde: '2026-09' })] })).toEqual([]);
  });

  it('cómo se llena cada paso: el sueldo por mes, los compromisos sin «por trabajo» y Maun que no se renueva', () => {
    expect(primero({ pasos: [{ ...PASO_SUELDO, modo: 'saldo' }] })).toEqual({
      problema: 'modo-invalido',
      tesoro: HOGAR,
    });
    expect(primero({ pasos: [fijos([['Luz', $(1)]], FIJOS, 'trabajo')] })?.problema).toBe(
      'modo-invalido',
    );
    expect(primero({ pasos: [fijos([['Luz', $(1)]], MAUN, 'saldo')] })).toEqual({
      problema: 'modo-invalido',
      tesoro: MAUN,
    });
    expect(primero({ pasos: [{ ...PASO_MATERIALES, modo: 'semana' as never }] })?.problema).toBe(
      'modo-invalido',
    );
  });

  it('hasta la meta: solo los ahorros, y con meta', () => {
    expect(primero({ pasos: [{ ...fijos([['Luz', $(1)]]), hastaLaMeta: true }] })).toEqual({
      problema: 'meta-fuera-de-ahorro',
      tesoro: FIJOS,
    });
    expect(primero({ pasos: [prioridad(FIJOS, $(1), { hastaLaMeta: true })] })).toEqual({
      problema: 'meta-sin-monto',
      tesoro: FIJOS,
    });
    expect(primero({ reparto: [parte(INMUEBLES, 100, true)] })).toEqual({
      problema: 'meta-sin-monto',
      tesoro: INMUEBLES,
    });
    expect(problemas({ reparto: [parte(COCOS, 100, true)] })).toEqual([]);
  });

  it('los ahorros van después de los compromisos', () => {
    expect(
      problemas({ pasos: [PASO_MATERIALES, PASO_SUELDO, prioridad(COCOS, $(1)), PASO_FIJOS] }),
    ).toEqual([
      { problema: 'ahorro-antes-de-compromiso', tesoro: MATERIALES },
      { problema: 'ahorro-antes-de-compromiso', tesoro: COCOS },
    ]);
  });

  it('los porcentajes del reparto', () => {
    expect(
      primero({ reparto: [{ ...parte(INVERSIONES, 1), porcentaje: 0 as never }] })?.problema,
    ).toBe('porcentaje-invalido');
    expect(
      primero({ reparto: [{ ...parte(INVERSIONES, 1), porcentaje: 10_001 as never }] })?.problema,
    ).toBe('porcentaje-invalido');
    expect(problemas({ reparto: [parte(INVERSIONES, 6_000), parte(INMUEBLES, 5_000)] })).toEqual([
      { problema: 'reparto-pasa-de-cien', tesoro: null },
    ]);
  });

  it('el superávit: ni Hogar ni el diezmo, ni un tesoro que ya está en la fila, salvo Maun', () => {
    expect(primero({ superavit: HOGAR })).toEqual({
      problema: 'superavit-invalido',
      tesoro: HOGAR,
    });
    expect(primero({ superavit: DIEZMO_ID })?.problema).toBe('superavit-invalido');
    expect(primero({ reparto: [parte(INVERSIONES, 1)], superavit: INVERSIONES })).toEqual({
      problema: 'superavit-en-la-fila',
      tesoro: INVERSIONES,
    });
    expect(
      primero({ obligaciones: [DEL_DIEZMO, INGRESOS_BRUTOS], superavit: IIBB })?.problema,
    ).toBe('superavit-en-la-fila');
    expect(problemas({ pasos: [fijos([['Costos fijos', $(1)]], MAUN)], superavit: MAUN })).toEqual(
      [],
    );
    expect(problemas({ superavit: COCOS })).toEqual([]);
  });

  it('una fila guardada no reparte el sueldo por trabajo', () => {
    expect(problemas({ sueldoPorTrabajo: true })).toEqual([
      { problema: 'sueldo-por-trabajo', tesoro: null },
    ]);
  });

  it('el primer problema sigue el orden de la base', () => {
    expect(
      primerProblemaDeLaFila(
        {
          ...filaCon({
            obligaciones: Array.from({ length: 7 }, () => INGRESOS_BRUTOS),
            reparto: [parte(MAUN, 1)],
            superavit: HOGAR,
          }),
          sueldoPorTrabajo: true,
        },
        TESOROS,
      ),
    ).toBe('demasiadas-obligaciones');
    expect(
      primerProblemaDeLaFila(filaCon({ reparto: [parte(MAUN, 1)], superavit: HOGAR }), TESOROS),
    ).toBe('maun-en-el-reparto');
  });

  it('sin los tesoros del sistema en la lista, lo que se completa no se reconoce', () => {
    const sinElSistema = TESOROS.filter(
      (tesoro) => tesoro.clave !== 'diezmo' && tesoro.clave !== 'maun',
    );
    const primerPedido = { pasos: [], reparto: [], sueldoPorTrabajo: false };
    expect(primerProblemaDeLaFila(primerPedido, sinElSistema)).toBe('tesoro-desconocido');
  });
});

describe('la fila del mes', () => {
  const FILA_DEL_MES: Fila = filaCon({
    obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
    pasos: [
      PASO_SUELDO,
      fijos(
        [
          ['Alquiler', $(500_000), 10],
          ['Luz', $(60_000), 31],
          ['Ayudante', $(340_000)],
        ],
        FIJOS,
        'saldo',
      ),
      fijos([['Costos fijos', $(200_000), 5]], MAUN),
      prioridad(MATERIALES, $(300_000), { modo: 'trabajo' }),
      prioridad(COCOS, $(300_000), { hastaLaMeta: true }),
    ],
    reparto: [parte(INVERSIONES, 5_000, true), parte(INMUEBLES, 3_000)],
    superavit: SUPERAVIT,
  });

  const DATOS: DatosDelMes = {
    liquidaciones: [
      {
        fecha: '2026-09-03',
        neta: $(1_500_000),
        diezmo: $(150_000),
        aportes: [
          { tesoro: IIBB, monto: $(52_500) },
          { tesoro: HOGAR, monto: $(1_297_500) },
        ],
        remanente: $(0),
      },
      {
        fecha: '2026-09-14',
        neta: $(2_000_000),
        diezmo: $(191_250),
        aportes: [
          { tesoro: IIBB, monto: $(87_500) },
          { tesoro: HOGAR, monto: $(502_500) },
          { tesoro: FIJOS, monto: $(900_000) },
          { tesoro: MAUN, monto: $(150_000) },
          { tesoro: MATERIALES, monto: $(300_000) },
          { tesoro: COCOS, monto: $(100_000) },
          { tesoro: INVERSIONES, monto: $(50_000) },
          { tesoro: INMUEBLES, monto: $(0) },
          { tesoro: SUPERAVIT, monto: $(12_345) },
        ],
        remanente: $(0),
      },
      {
        fecha: '2026-08-14',
        neta: $(9),
        diezmo: $(1),
        aportes: [{ tesoro: HOGAR, monto: $(8) }],
        remanente: $(0),
      },
    ],
    coberturas: [{ tesoro: MAUN, mes: '2026-09', monto: $(20_000) }],
    saldos: new Map([
      [IIBB, $(140_000)],
      [DIEZMO_ID, $(341_250)],
      [HOGAR, $(400_000)],
      [FIJOS, $(630_000)],
      [MAUN, $(-50_000)],
      [MATERIALES, $(900_000)],
      [COCOS, $(2_900_000)],
      [INVERSIONES, $(250_000)],
      [INMUEBLES, $(10_000)],
      [SUPERAVIT, $(12_345)],
    ]),
    metas: new Map([
      [COCOS, $(3_000_000)],
      [INVERSIONES, $(300_000)],
    ]),
    gastos: [
      { tesoro: FIJOS, categoria: ' alquiler', fecha: '2026-09-09' },
      { tesoro: FIJOS, categoria: 'Luz', fecha: '2026-08-31' },
      { tesoro: MAUN, categoria: 'Costos fijos', fecha: '2026-09-05' },
    ],
  };

  it('cada obligación con lo apartado y lo que tiene a pagar', () => {
    const mes = filaDelMes(FILA_DEL_MES, SISTEMA, DATOS, '2026-09');
    expect(mes).toMatchObject({
      mes: '2026-09',
      cobros: 2,
      ingreso: $(3_500_000),
      diezmo: $(341_250),
      apartado: $(481_250),
      enElTaller: $(0),
      repartoEmpezo: true,
    });
    expect(mes.obligaciones).toEqual([
      {
        tesoro: IIBB,
        porcentaje: 350,
        base: 'cobrado',
        diezmo: false,
        apartado: $(140_000),
        aPagar: $(140_000),
      },
      {
        tesoro: DIEZMO_ID,
        porcentaje: 1_000,
        base: 'ingreso',
        diezmo: true,
        apartado: $(341_250),
        aPagar: $(341_250),
      },
    ]);
  });

  it('cada compromiso con lo que le falta según su modo, sus vencimientos y si se pagaron', () => {
    const [hogar, gastosFijos, maun] = filaDelMes(FILA_DEL_MES, SISTEMA, DATOS, '2026-09').pasos;
    expect(hogar).toEqual({
      tesoro: HOGAR,
      clase: 'sueldo',
      tipo: 'compromiso',
      modo: 'mes',
      objetivo: $(1_800_000),
      recibido: $(1_800_000),
      cubierto: $(0),
      lleva: $(1_800_000),
      falta: $(0),
      completo: true,
      aPagar: null,
      vencimientos: [],
      meta: null,
    });
    expect(gastosFijos).toEqual({
      tesoro: FIJOS,
      clase: 'fijos',
      tipo: 'compromiso',
      modo: 'saldo',
      objetivo: $(900_000),
      recibido: $(900_000),
      cubierto: $(0),
      lleva: $(630_000),
      falta: $(270_000),
      completo: false,
      aPagar: $(630_000),
      vencimientos: [
        {
          indice: 0,
          renglon: 'Alquiler',
          monto: $(500_000),
          dia: 10,
          fecha: '2026-09-10',
          pagado: true,
        },
        {
          indice: 1,
          renglon: 'Luz',
          monto: $(60_000),
          dia: 31,
          fecha: '2026-09-30',
          pagado: false,
        },
      ],
      meta: null,
    });
    expect(maun).toMatchObject({
      tipo: 'compromiso',
      recibido: $(150_000),
      cubierto: $(20_000),
      lleva: $(170_000),
      falta: $(30_000),
      aPagar: null,
      vencimientos: [expect.objectContaining({ fecha: '2026-09-05', pagado: true })],
    });
  });

  it('cada ahorro con su meta, y el superávit', () => {
    const mes = filaDelMes(FILA_DEL_MES, SISTEMA, DATOS, '2026-09');
    expect(mes.pasos[3]).toMatchObject({
      tesoro: MATERIALES,
      tipo: 'ahorro-fijo',
      modo: 'trabajo',
      recibido: $(300_000),
      lleva: $(0),
      falta: null,
      completo: false,
      aPagar: null,
      meta: null,
    });
    expect(mes.pasos[4]).toMatchObject({
      tesoro: COCOS,
      lleva: $(100_000),
      falta: $(100_000),
      meta: {
        meta: $(3_000_000),
        saldo: $(2_900_000),
        falta: $(100_000),
        hastaLaMeta: true,
        llego: false,
      },
    });
    expect(mes.reparto).toEqual([
      {
        tesoro: INVERSIONES,
        porcentaje: 5_000,
        hastaLaMeta: true,
        recibido: $(50_000),
        meta: {
          meta: $(300_000),
          saldo: $(250_000),
          falta: $(50_000),
          hastaLaMeta: true,
          llego: false,
        },
      },
      { tesoro: INMUEBLES, porcentaje: 3_000, hastaLaMeta: false, recibido: $(0), meta: null },
    ]);
    expect(mes.superavit).toEqual({ tesoro: SUPERAVIT, recibido: $(12_345) });
  });

  it('una meta que no frena no achica lo que falta, y una cumplida llegó', () => {
    const fila = filaCon({
      pasos: [
        prioridad(COCOS, $(300_000), { hastaLaMeta: false }),
        prioridad(MATERIALES, $(300_000), { modo: 'saldo', hastaLaMeta: true }),
      ],
    });
    const mes = filaDelMes(
      fila,
      SISTEMA,
      {
        ...DATOS,
        saldos: new Map([
          [COCOS, $(2_990_000)],
          [MATERIALES, $(1_000_000)],
        ]),
        metas: new Map([
          [COCOS, $(3_000_000)],
          [MATERIALES, $(1_000_000)],
        ]),
      },
      '2026-09',
    );
    expect(mes.pasos.map((paso) => [paso.falta, paso.meta?.llego])).toEqual([
      [$(200_000), false],
      [$(0), true],
    ]);
  });

  it('un ahorro con meta y sin saldo todavía tiene toda la meta por delante', () => {
    const mes = filaDelMes(
      filaCon({ reparto: [parte(INVERSIONES, 1_000, true)] }),
      SISTEMA,
      { ...DATOS, saldos: new Map() },
      '2026-09',
    );
    expect(mes.reparto[0]?.meta).toEqual({
      meta: $(300_000),
      saldo: $(0),
      falta: $(300_000),
      hastaLaMeta: true,
      llego: false,
    });
  });

  it('con el superávit en Maun, recibe lo que quedó en el taller, y sin cobros el reparto no empezó', () => {
    const conMaun = filaDelMes(
      FILA_DE_ELISEO,
      SISTEMA,
      {
        ...DATOS,
        liquidaciones: [
          {
            fecha: '2026-09-28',
            neta: $(10),
            diezmo: $(1),
            aportes: [{ tesoro: COCOS, monto: $(0) }],
            remanente: $(9),
          },
        ],
      },
      '2026-09',
    );
    expect(conMaun.superavit).toEqual({ tesoro: MAUN, recibido: $(9) });
    expect(conMaun.repartoEmpezo).toBe(false);
    expect(conMaun.enElTaller).toBe($(9));
  });

  it('un mes mal escrito se rechaza', () => {
    expect(() => filaDelMes(FILA_DE_ELISEO, SISTEMA, DATOS, '2026-9')).toThrow(RangeError);
  });
});

describe('los vencimientos de un paso', () => {
  const paso = fijos(
    [
      ['Alquiler', $(500_000), 31],
      ['Ayudante', $(340_000)],
    ],
    FIJOS,
  );

  it('el 31 en un mes que no lo tiene cae el último día, y sin día no vence', () => {
    expect(vencimientosDelPaso(paso, '2026-02', [])).toEqual([
      {
        indice: 0,
        renglon: 'Alquiler',
        monto: $(500_000),
        dia: 31,
        fecha: '2026-02-28',
        pagado: false,
      },
    ]);
  });

  it('se paga con un gasto desde ese tesoro, con el renglón como categoría, en ese mes', () => {
    const pagos = (tesoro: string, categoria: string, fecha: string) =>
      vencimientosDelPaso(paso, '2026-09', [{ tesoro, categoria, fecha }])[0]?.pagado;
    expect(pagos(FIJOS, 'Alquiler', '2026-09-01')).toBe(true);
    expect(pagos(FIJOS, 'ALQUILER ', '2026-09-30')).toBe(true);
    expect(pagos(MAUN, 'Alquiler', '2026-09-01')).toBe(false);
    expect(pagos(FIJOS, 'Luz', '2026-09-01')).toBe(false);
    expect(pagos(FIJOS, 'Alquiler', '2026-10-01')).toBe(false);
  });

  it('un día fuera del calendario no vence', () => {
    const roto = { ...paso, renglones: [{ nombre: 'Luz', monto: $(1), dia: 0 }] };
    expect(vencimientosDelPaso(roto, '2026-09', [])).toEqual([]);
  });
});

describe('los tipos de tesoro', () => {
  const fila = filaCon({
    obligaciones: [INGRESOS_BRUTOS, DEL_DIEZMO],
    pasos: [PASO_SUELDO, fijos([['Costos fijos', $(1)]], MAUN), PASO_MATERIALES],
    reparto: [parte(INVERSIONES, 1_000)],
    superavit: MAUN,
  });

  it('salen del lugar en la fila', () => {
    expect(tipoDelTesoro(fila, IIBB)).toBe('obligacion');
    expect(tipoDelTesoro(fila, DIEZMO_ID)).toBe('obligacion');
    expect(tipoDelTesoro(fila, HOGAR)).toBe('compromiso');
    expect(tipoDelTesoro(fila, MAUN)).toBe('compromiso');
    expect(tipoDelTesoro(fila, MATERIALES)).toBe('ahorro-fijo');
    expect(tipoDelTesoro(fila, INVERSIONES)).toBe('ahorro-por-porcentaje');
    expect(tipoDelTesoro({ ...fila, superavit: SUPERAVIT }, SUPERAVIT)).toBe('superavit');
    expect(tipoDelTesoro(fila, COCOS)).toBeNull();
    expect(tipoDelPaso('fijos')).toBe('compromiso');
    expect(tipoDelPaso('prioridad')).toBe('ahorro-fijo');
  });

  it('cómo puede llenarse cada paso y cómo arranca', () => {
    expect(modosPosibles('sueldo', 'hogar')).toEqual(['mes']);
    expect(modosPosibles('fijos', null)).toEqual(['mes', 'saldo']);
    expect(modosPosibles('fijos', 'maun')).toEqual(['mes']);
    expect(modosPosibles('prioridad', 'cocos')).toEqual(['mes', 'saldo', 'trabajo']);
    expect(modoInicial('fijos', null)).toBe('saldo');
    expect(modoInicial('fijos', 'maun')).toBe('mes');
    expect(modoInicial('sueldo', 'hogar')).toBe('mes');
    expect(modoInicial('prioridad', null)).toBe('mes');
    expect(admiteLaMeta('prioridad')).toBe(true);
    expect(admiteLaMeta('fijos')).toBe(false);
    expect([0, 1, 31, 32, 1.5].map(esDiaDePago)).toEqual([false, true, true, false, false]);
  });

  it('los tesoros de la fila, una vez cada uno y con el superávit', () => {
    expect(tesorosDeLaFila(fila)).toEqual([IIBB, DIEZMO_ID, HOGAR, MAUN, MATERIALES, INVERSIONES]);
    expect(tesorosDeLaFila({ ...fila, superavit: SUPERAVIT }).at(-1)).toBe(SUPERAVIT);
  });
});

describe('editar la fila', () => {
  it('poner, mover y cambiar las obligaciones', () => {
    const conIngresosBrutos = ponerObligacion(FILA_DE_ELISEO, INGRESOS_BRUTOS, 0);
    expect(conIngresosBrutos.obligaciones).toEqual([INGRESOS_BRUTOS, DEL_DIEZMO]);
    expect(moverObligacion(conIngresosBrutos, IIBB, 1).obligaciones).toEqual([
      DEL_DIEZMO,
      INGRESOS_BRUTOS,
    ]);
    expect(
      cambiarLaObligacion(conIngresosBrutos, IIBB, { porcentaje: bp(400), base: 'ingreso' })
        .obligaciones[0],
    ).toEqual({ tesoro: IIBB, porcentaje: 400, base: 'ingreso' });

    const desdeUnPaso = ponerObligacion(
      FILA_DE_ELISEO,
      { ...INGRESOS_BRUTOS, tesoro: MATERIALES },
      1,
    );
    expect(desdeUnPaso.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, FIJOS]);
    expect(desdeUnPaso.obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([
      DIEZMO_ID,
      MATERIALES,
    ]);

    expect(() => ponerObligacion(FILA_DE_ELISEO, INGRESOS_BRUTOS, 2)).toThrow(RangeError);
    expect(() => moverObligacion(FILA_DE_ELISEO, IIBB, 0)).toThrow(RangeError);
    expect(() => cambiarLaObligacion(FILA_DE_ELISEO, IIBB, { porcentaje: bp(1) })).toThrow(
      RangeError,
    );
  });

  it('poner, mover y sacar pasos, siempre adentro de su tipo', () => {
    const cocos = prioridad(COCOS, $(100_000));
    const conCocos = ponerPaso(FILA_DE_ELISEO, cocos, 1);
    expect(conCocos.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, FIJOS, COCOS, MATERIALES]);
    expect(conCocos.reparto.map((una) => una.tesoro)).toEqual([INVERSIONES, INMUEBLES]);

    expect(moverPaso(conCocos, MATERIALES, 0).pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      FIJOS,
      MATERIALES,
      COCOS,
    ]);
    expect(moverPaso(conCocos, HOGAR, 3).pasos.map((paso) => paso.tesoro)).toEqual([
      FIJOS,
      HOGAR,
      COCOS,
      MATERIALES,
    ]);
    expect(() => moverPaso(conCocos, INVERSIONES, 0)).toThrow(RangeError);
    expect(() => ponerPaso(conCocos, cocos, 9)).toThrow(RangeError);
    expect(() => ponerPaso(conCocos, cocos, 1.5)).toThrow(RangeError);

    expect(sacarDeLaFila(conCocos, COCOS)).toEqual({
      ...FILA_DE_ELISEO,
      reparto: FILA_DE_ELISEO.reparto.filter((una) => una.tesoro !== COCOS),
    });
    expect(sacarDeLaFila(FILA_DE_ELISEO, DIEZMO_ID).obligaciones).toEqual([]);
  });

  it('dibujar una flecha pone un paso justo después de otro', () => {
    expect(
      ponerDespues(FILA_DE_ELISEO, HOGAR, fijos([['Luz', $(1)]], COCOS)).pasos.map(
        (paso) => paso.tesoro,
      ),
    ).toEqual([HOGAR, COCOS, FIJOS, MATERIALES]);
    expect(
      ponerDespues(FILA_DE_ELISEO, HOGAR, PASO_MATERIALES).pasos.map((paso) => paso.tesoro),
    ).toEqual([HOGAR, FIJOS, MATERIALES]);
    expect(
      ponerDespues(FILA_DE_ELISEO, null, PASO_SUELDO).pasos.map((paso) => paso.tesoro),
    ).toEqual([HOGAR, FIJOS, MATERIALES]);
    expect(() => ponerDespues(FILA_DE_ELISEO, INVERSIONES, PASO_MATERIALES)).toThrow(RangeError);
  });

  it('el reparto: entrar, cambiar el porcentaje o la meta sin moverse, y lo que queda libre', () => {
    const cambiado = ponerEnElReparto(FILA_DE_ELISEO, INMUEBLES, bp(2_000));
    expect(cambiado.reparto).toEqual([
      parte(INVERSIONES, 5_000),
      parte(INMUEBLES, 2_000),
      parte(COCOS, 2_000),
    ]);
    expect(lugarLibreDelReparto(cambiado)).toBe(1_000);
    expect(sumaDelReparto(cambiado)).toBe(9_000);

    const conMeta = ponerEnElReparto(cambiado, INMUEBLES, bp(1_000), true);
    expect(conMeta.reparto[1]).toEqual(parte(INMUEBLES, 1_000, true));
    expect(ponerEnElReparto(conMeta, INMUEBLES, bp(500)).reparto[1]).toEqual(
      parte(INMUEBLES, 500, true),
    );

    const desdeLaFila = ponerEnElReparto(FILA_DE_ELISEO, MATERIALES, bp(500), true);
    expect(desdeLaFila.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, FIJOS]);
    expect(desdeLaFila.reparto.at(-1)).toEqual(parte(MATERIALES, 500, true));
    expect(ponerEnElReparto(FILA_DE_ELISEO, SUPERAVIT, bp(1)).reparto.at(-1)).toEqual(
      parte(SUPERAVIT, 1),
    );
    expect(lugarLibreDelReparto(desdeLaFila)).toBe(0);
    expect(lugarLibreDelReparto({ reparto: [parte(COCOS, 10_000), parte(INVERSIONES, 10)] })).toBe(
      0,
    );

    expect(
      cambiarLaParte(FILA_DE_ELISEO, COCOS, { hastaLaMeta: true, porcentaje: bp(1_500) })
        .reparto[2],
    ).toEqual(parte(COCOS, 1_500, true));
    expect(() => cambiarLaParte(FILA_DE_ELISEO, HOGAR, { hastaLaMeta: true })).toThrow(RangeError);
  });

  it('cambiar un paso: el monto, los renglones con sus días, el modo y la meta', () => {
    const tope = cambiarElPaso(FILA_DE_ELISEO, MATERIALES, { tope: $(350_000) });
    expect(tope.pasos[2]?.tope).toBe($(350_000));

    const renglones = cambiarElPaso(FILA_DE_ELISEO, FIJOS, {
      renglones: [{ nombre: 'Alquiler', monto: $(600_000), dia: 10 }],
    });
    expect(renglones.pasos[1]).toMatchObject({
      tope: $(600_000),
      renglones: [{ nombre: 'Alquiler', monto: $(600_000), dia: 10 }],
    });

    const sinRenglones = cambiarElPaso(FILA_DE_ELISEO, FIJOS, { desde: '2026-10', modo: 'saldo' });
    expect(sinRenglones.pasos[1]).toMatchObject({
      tope: $(900_000),
      desde: '2026-10',
      modo: 'saldo',
    });

    const meta = cambiarElPaso(FILA_DE_ELISEO, MATERIALES, { hastaLaMeta: true, modo: 'trabajo' });
    expect(meta.pasos[2]).toMatchObject({ hastaLaMeta: true, modo: 'trabajo' });

    expect(() => cambiarElPaso(FILA_DE_ELISEO, COCOS, { tope: $(1) })).toThrow(RangeError);
  });

  it('cambiar qué es: un compromiso pasa a ahorro fijo y al revés, y queda en su tipo', () => {
    const aAhorro = cambiarLaClase(FILA_DE_ELISEO, FIJOS, 'prioridad');
    expect(aAhorro.pasos.map((paso) => [paso.tesoro, paso.clase])).toEqual([
      [HOGAR, 'sueldo'],
      [FIJOS, 'prioridad'],
      [MATERIALES, 'prioridad'],
    ]);
    expect(aAhorro.pasos[1]).toMatchObject({ renglones: [], tope: $(900_000), modo: 'mes' });

    const ahorro = filaCon({
      pasos: [
        PASO_SUELDO,
        prioridad(MATERIALES, $(1), { modo: 'trabajo', hastaLaMeta: true }),
        prioridad(COCOS, $(1), { modo: 'saldo' }),
      ],
    });
    const aCompromiso = cambiarLaClase(ahorro, COCOS, 'fijos', [
      { nombre: 'Alquiler', monto: $(500_000), dia: 10 },
    ]);
    expect(aCompromiso.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, COCOS, MATERIALES]);
    expect(aCompromiso.pasos[1]).toMatchObject({ clase: 'fijos', tope: $(500_000), modo: 'saldo' });
    expect(cambiarLaClase(ahorro, MATERIALES, 'fijos').pasos[1]).toMatchObject({
      clase: 'fijos',
      modo: 'saldo',
      hastaLaMeta: false,
      tope: $(0),
    });
    expect(cambiarLaClase(ahorro, MATERIALES, 'prioridad')).toBe(ahorro);
    expect(() => cambiarLaClase(ahorro, INVERSIONES, 'fijos')).toThrow(RangeError);
  });

  it('elegir dónde cae lo que sobra', () => {
    expect(ponerElSuperavit(FILA_DE_ELISEO, SUPERAVIT).superavit).toBe(SUPERAVIT);
  });

  it('desde cuándo rige cada monto', () => {
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
});

describe('el resumen de lo que cambió', () => {
  it('las obligaciones: salen, entran, cambian de lugar, de porcentaje y de base', () => {
    const antes = filaCon({
      obligaciones: [DEL_DIEZMO, INGRESOS_BRUTOS, { ...INGRESOS_BRUTOS, tesoro: COCOS }],
    });
    const despues = filaCon({
      obligaciones: [
        { tesoro: IIBB, porcentaje: bp(400), base: 'ingreso' },
        DEL_DIEZMO,
        { ...INGRESOS_BRUTOS, tesoro: SUPERAVIT },
      ],
    });
    expect(cambiosDeLaFila(antes, despues)).toEqual([
      { tipo: 'sale-de-las-obligaciones', tesoro: COCOS },
      { tipo: 'cambia-de-lugar-la-obligacion', tesoro: IIBB, antes: 1, despues: 0 },
      { tipo: 'cambia-el-porcentaje-de-la-obligacion', tesoro: IIBB, antes: 350, despues: 400 },
      { tipo: 'cambia-la-base', tesoro: IIBB, antes: 'cobrado', despues: 'ingreso' },
      { tipo: 'cambia-de-lugar-la-obligacion', tesoro: DIEZMO_ID, antes: 0, despues: 1 },
      {
        tipo: 'entra-a-las-obligaciones',
        tesoro: SUPERAVIT,
        posicion: 2,
        porcentaje: 350,
        base: 'cobrado',
      },
    ]);
  });

  it('los pasos: salen, entran, y cambian de lugar, de clase, de monto, de renglones, de días, de modo y de meta', () => {
    const despues: Fila = filaCon({
      pasos: [
        { ...PASO_SUELDO, tope: $(2_000_000) },
        fijos(
          [
            ['Alquiler', $(500_000), 10],
            ['Luz', $(60_000)],
            ['Ayudante', $(340_000)],
          ],
          FIJOS,
          'saldo',
        ),
        prioridad(COCOS, $(50_000), { modo: 'trabajo', hastaLaMeta: true }),
      ],
      reparto: FILA_DE_ELISEO.reparto.filter((una) => una.tesoro !== COCOS),
    });
    const conCocos = ponerPaso(FILA_DE_ELISEO, prioridad(COCOS, $(1)), 2);
    const movido: Fila = {
      ...conCocos,
      pasos: [conCocos.pasos[1], conCocos.pasos[0], conCocos.pasos[2], conCocos.pasos[3]].filter(
        (paso): paso is PasoDeLaFila => paso !== undefined,
      ),
    };
    expect(cambiosDeLaFila(FILA_DE_ELISEO, movido).slice(0, 2)).toEqual([
      { tipo: 'cambia-de-lugar', tesoro: FIJOS, antes: 1, despues: 0 },
      { tipo: 'cambia-de-lugar', tesoro: HOGAR, antes: 0, despues: 1 },
    ]);
    expect(cambiosDeLaFila(FILA_DE_ELISEO, despues)).toEqual([
      { tipo: 'sale-de-la-fila', tesoro: MATERIALES },
      { tipo: 'cambia-el-tope', tesoro: HOGAR, antes: $(1_800_000), despues: $(2_000_000) },
      { tipo: 'cambian-los-dias', tesoro: FIJOS },
      { tipo: 'cambia-el-modo', tesoro: FIJOS, antes: 'mes', despues: 'saldo' },
      {
        tipo: 'entra-a-la-fila',
        tesoro: COCOS,
        posicion: 2,
        clase: 'prioridad',
        tope: $(50_000),
        modo: 'trabajo',
        hastaLaMeta: true,
      },
      { tipo: 'sale-del-reparto', tesoro: COCOS },
    ]);

    const otraClase = cambiarLaClase(FILA_DE_ELISEO, FIJOS, 'prioridad');
    expect(cambiosDeLaFila(FILA_DE_ELISEO, otraClase)).toEqual([
      { tipo: 'cambia-la-clase', tesoro: FIJOS, antes: 'fijos', despues: 'prioridad' },
      { tipo: 'cambian-los-renglones', tesoro: FIJOS },
    ]);

    const conMeta = cambiarElPaso(FILA_DE_ELISEO, MATERIALES, { hastaLaMeta: true });
    expect(cambiosDeLaFila(FILA_DE_ELISEO, conMeta)).toEqual([
      { tipo: 'cambia-la-meta', tesoro: MATERIALES, hastaLaMeta: true },
    ]);

    const otroMontoYDia = cambiarElPaso(FILA_DE_ELISEO, FIJOS, {
      renglones: [{ nombre: 'Alquiler', monto: $(600_000), dia: 5 }],
    });
    expect(cambiosDeLaFila(FILA_DE_ELISEO, otroMontoYDia)).toEqual([
      { tipo: 'cambia-el-tope', tesoro: FIJOS, antes: $(900_000), despues: $(600_000) },
      { tipo: 'cambian-los-dias', tesoro: FIJOS },
    ]);

    const renombrado = cambiarElPaso(FILA_DE_ELISEO, FIJOS, {
      renglones: [
        { nombre: 'Alquiler del galpón', monto: $(500_000), dia: null },
        { nombre: 'Luz', monto: $(60_000), dia: null },
        { nombre: 'Ayudante', monto: $(340_000), dia: null },
      ],
    });
    expect(cambiosDeLaFila(FILA_DE_ELISEO, renombrado)).toEqual([
      { tipo: 'cambian-los-renglones', tesoro: FIJOS },
    ]);
  });

  it('el reparto y el superávit', () => {
    const despues = ponerElSuperavit(
      filaCon({
        pasos: FILA_DE_ELISEO.pasos,
        reparto: [
          parte(INVERSIONES, 6_000),
          parte(COCOS, 2_000, true),
          parte(SUPERAVIT, 1_000, true),
        ],
      }),
      IIBB,
    );
    expect(cambiosDeLaFila(FILA_DE_ELISEO, despues)).toEqual([
      { tipo: 'sale-del-reparto', tesoro: INMUEBLES },
      { tipo: 'cambia-el-porcentaje', tesoro: INVERSIONES, antes: 5_000, despues: 6_000 },
      { tipo: 'cambia-la-meta', tesoro: COCOS, hastaLaMeta: true },
      { tipo: 'entra-al-reparto', tesoro: SUPERAVIT, porcentaje: 1_000, hastaLaMeta: true },
      { tipo: 'cambia-el-superavit', tesoro: IIBB, antes: MAUN },
    ]);
    expect(cambiosDeLaFila(FILA_DE_ELISEO, FILA_DE_ELISEO)).toEqual([]);
  });
});
