import {
  calcularPorLaFila,
  centavos,
  CERO,
  cambiosDeLaFila,
  filaDelMes,
  puntosBasicos,
  type DatosDelMes,
  type Fila,
  type Money,
  type PasoDeLaFila,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import type { TintaDeTesoro } from '@/shared/lib';

import {
  ALTO,
  AL_COSTADO,
  AL_TIPO,
  altoDelPaso,
  ANCHO_DE_FICHA,
  ANCHO_DE_PARTE,
  ANCHO_DEL_ESTANTE,
  ANCHO_DEL_GLOBO,
  ANCHO_DEL_TIPO,
  aplicarElArrastre,
  armarElPlano,
  BAJADA_DEL_REPARTO,
  centrosDeLasFichas,
  ENTRE_PARTES,
  ESPACIO,
  ESPACIO_DEL_COBRO,
  huecoDelArrastre,
  lugaresDelTramo,
  RENGLON,
  RENGLON_DEL_ROTULO,
  renglonesALaVista,
  type NodoDelPlano,
  type VistaDelPlano,
} from './disposicion';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const INMUEBLES = '01900000-0000-7000-8000-000000000008';
const IIBB = '01900000-0000-7000-8000-000000000009';
const APARTE = '01900000-0000-7000-8000-000000000010';

function tesoro(id: string, clave: TesoroDelTaller['clave'], nombre: string, tinta: TintaDeTesoro) {
  return {
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault' as const,
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: CERO,
  };
}

const TESOROS: TesoroDelTaller[] = [
  tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
  tesoro(MAUN, 'maun', 'Maun', 'maun'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
  tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
  tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
  tesoro(MATERIALES, null, 'Materiales', 'mostaza'),
  tesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo'),
  tesoro(INMUEBLES, null, 'Inmuebles', 'ciruela'),
  tesoro(IIBB, null, 'Ingresos Brutos', 'petroleo'),
  tesoro(APARTE, null, 'Superávit', 'maun'),
];

const SUELDO: PasoDeLaFila = {
  tesoro: HOGAR,
  clase: 'sueldo',
  tope: centavos(180_000_000),
  renglones: [],
  desde: null,
  modo: 'mes',
  hastaLaMeta: false,
};

const GASTOS_FIJOS: PasoDeLaFila = {
  tesoro: FIJOS,
  clase: 'fijos',
  tope: centavos(90_000_000),
  renglones: [
    { nombre: 'Alquiler', monto: centavos(50_000_000), dia: 10 },
    { nombre: 'Luz', monto: centavos(6_000_000), dia: null },
    { nombre: 'Ayudante', monto: centavos(34_000_000), dia: null },
  ],
  desde: null,
  modo: 'mes',
  hastaLaMeta: false,
};

const MATERIALES_: PasoDeLaFila = {
  tesoro: MATERIALES,
  clase: 'prioridad',
  tope: centavos(30_000_000),
  renglones: [],
  desde: null,
  modo: 'mes',
  hastaLaMeta: false,
};

const HERRAMIENTAS_: PasoDeLaFila = {
  tesoro: HERRAMIENTAS,
  clase: 'prioridad',
  tope: centavos(10_000_000),
  renglones: [],
  desde: null,
  modo: 'mes',
  hastaLaMeta: false,
};

const SISTEMA = { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO };

const DEL_DIEZMO = { tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' as const };
const DE_IIBB = { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' as const };

function filaCon(
  pasos: PasoDeLaFila[],
  reparto: readonly (readonly [string, number, boolean?])[] = [],
  obligaciones: Fila['obligaciones'] = [DEL_DIEZMO],
  superavit = MAUN,
): Fila {
  return {
    obligaciones,
    pasos,
    reparto: reparto.map(([tesoro, porcentaje, hastaLaMeta]) => ({
      tesoro,
      porcentaje: puntosBasicos(porcentaje),
      hastaLaMeta: hastaLaMeta ?? false,
    })),
    superavit,
    sueldoPorTrabajo: false,
  };
}

function renglones(cuantos: number, monto: number) {
  return Array.from({ length: cuantos }, (_, indice) => ({
    nombre: `Gasto ${String(indice + 1)}`,
    monto: centavos(monto),
    dia: null,
  }));
}

const SIN_DATOS: DatosDelMes = {
  liquidaciones: [],
  coberturas: [],
  saldos: new Map(),
  metas: new Map(),
  gastos: [],
};

function vistaDe(
  fila: Fila,
  estante: TesoroDelTaller[] = [],
  base: Fila = fila,
  datos: DatosDelMes = SIN_DATOS,
): VistaDelPlano {
  return {
    fila,
    base,
    delMes: filaDelMes(fila, SISTEMA, datos, '2026-09'),
    tesoros: TESOROS,
    estante,
    sistema: SISTEMA,
    armando: base !== fila,
    cambios: cambiosDeLaFila(base, fila),
    revision: 5,
    mes: '2026-09',
  };
}

function nodo(nodos: NodoDelPlano[], id: string): NodoDelPlano {
  const encontrado = nodos.find((candidato) => candidato.id === id);
  if (encontrado === undefined) throw new Error(`No está ${id}`);
  return encontrado;
}

function abajoDe(unNodo: NodoDelPlano): number {
  return unNodo.position.y + (unNodo.height ?? 0);
}

const X = -ANCHO_DE_FICHA / 2;
const X_DE_LA_DERECHA = ANCHO_DE_FICHA / 2 + AL_COSTADO;
const X_DE_LOS_TIPOS = X - ANCHO_DEL_GLOBO - AL_TIPO - ANCHO_DEL_TIPO;
const Y_DEL_INGRESO = ALTO.sena + ESPACIO_DEL_COBRO;
const Y_DE_LA_PRIMERA = Y_DEL_INGRESO + ALTO.ingreso + ESPACIO;
const CENTRO_DEL_REPARTO = X_DE_LA_DERECHA + ANCHO_DE_FICHA / 2;

describe('la fila de la seña', () => {
  it('arriba va la píldora de la seña, a su derecha los insumos con su flecha, y la flecha que baja dice «Se cobra el trabajo»', () => {
    const { nodos, aristas } = armarElPlano({
      vista: vistaDe(filaCon([SUELDO])),
      prueba: null,
      elegido: null,
      insumos: { total: centavos(82_000_000), trabajos: 2 },
    });
    expect(nodo(nodos, 'sena').position).toEqual({ x: X, y: 0 });
    const insumos = nodo(nodos, 'insumos');
    expect(insumos.position).toEqual({
      x: X_DE_LA_DERECHA,
      y: (ALTO.sena - ALTO.insumos) / 2,
    });
    expect(insumos.type === 'insumos' && insumos.data).toMatchObject({
      total: 82_000_000,
      trabajos: 2,
    });
    expect(insumos.ariaLabel).toMatch(/^Insumos: \$\s820\.000, 2 trabajos en curso$/);
    expect(insumos.domAttributes).toEqual({ 'aria-roledescription': 'insumos' });
    expect(nodo(nodos, 'origen').position).toEqual({ x: X, y: Y_DEL_INGRESO });

    const haciaLosInsumos = aristas.find((arista) => arista.id === 'hacia-los-insumos');
    expect(haciaLosInsumos).toMatchObject({ source: 'sena', target: 'insumos' });
    expect(haciaLosInsumos?.data?.flujo).toBeNull();
    const cobro = aristas.find((arista) => arista.id === 'se-cobra-el-trabajo');
    expect(cobro).toMatchObject({ source: 'sena', target: 'origen' });
    expect(cobro?.data?.flujo).toBe('cobro');
  });

  it('sin trabajos en curso, los insumos dicen $ 0', () => {
    const { nodos } = armarElPlano({ vista: vistaDe(filaCon([])), prueba: null, elegido: null });
    const insumos = nodo(nodos, 'insumos');
    expect(insumos.type === 'insumos' && insumos.data).toMatchObject({ total: 0, trabajos: 0 });
    expect(insumos.ariaLabel).toMatch(/^Insumos: \$\s0, sin trabajos en curso$/);
  });

  it('la píldora del ingreso dice el mes sin prueba, y «Prueba» con un monto', () => {
    const fila = filaCon([SUELDO]);
    const sinPrueba = nodo(
      armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null }).nodos,
      'origen',
    );
    expect(sinPrueba.ariaLabel).toMatch(/^Ingreso de septiembre: \$\s0 en 0 cobros$/);
    const prueba = calcularPorLaFila({
      destino: 'cobrado',
      fecha: '2026-09-27',
      cobrado: centavos(200_000_000),
      gastos: CERO,
      fila,
      sistema: SISTEMA,
      ajustes: { perdidoConSueldo: false, perdidoConDiezmo: true },
      liquidaciones: [],
      coberturas: [],
      saldos: new Map(),
      metas: new Map(),
    });
    const conPrueba = nodo(
      armarElPlano({ vista: vistaDe(fila), prueba, elegido: null }).nodos,
      'origen',
    );
    expect(conPrueba.ariaLabel).toMatch(/^Prueba: un trabajo que deja \$\s2\.000\.000$/);
  });
});

describe('los grupos de la fila', () => {
  it('sin obligaciones, el ingreso baja al primer paso y los globos arrancan en 1', () => {
    const fila = filaCon([SUELDO, MATERIALES_], [], []);
    const { nodos, aristas } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const hogar = nodo(nodos, `paso-${HOGAR}`);
    expect(hogar.position).toEqual({ x: X, y: Y_DE_LA_PRIMERA });
    expect(hogar.type === 'paso' && hogar.data.numero).toBe(1);
    expect(aristas.find((arista) => arista.target === `paso-${HOGAR}`)?.source).toBe('origen');
    expect(nodos.some((uno) => uno.id === 'tipo-obligaciones')).toBe(false);
  });

  it('con una obligación, el diezmo es el 1, el primer compromiso el 2, y la flecha que sale del diezmo dice «Ingreso libre»', () => {
    const fila = filaCon([SUELDO, MATERIALES_]);
    const { nodos, aristas } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const diezmo = nodo(nodos, 'diezmo');
    expect(diezmo.position).toEqual({ x: X, y: Y_DE_LA_PRIMERA });
    expect(diezmo.height).toBe(ALTO.obligacion);
    expect(diezmo.type === 'obligacion' && diezmo.data.numero).toBe(1);
    const hogar = nodo(nodos, `paso-${HOGAR}`);
    expect(hogar.position.y).toBe(Y_DE_LA_PRIMERA + ALTO.obligacion + ESPACIO);
    expect(hogar.type === 'paso' && hogar.data.numero).toBe(2);
    const materiales = nodo(nodos, `paso-${MATERIALES}`);
    expect(materiales.type === 'paso' && materiales.data.numero).toBe(3);

    const deLaObligacion = aristas.find((arista) => arista.source === 'diezmo');
    expect(deLaObligacion?.data?.flujo).toBe('libre');
    const delCompromiso = aristas.find((arista) => arista.source === `paso-${HOGAR}`);
    expect(delCompromiso?.data?.flujo).toBe('ganancia');
    const alReparto = aristas.find((arista) => arista.target === 'reparto');
    expect(alReparto?.source).toBe(`paso-${MATERIALES}`);
    expect(alReparto?.data?.flujo).toBeNull();
  });

  it('con dos obligaciones van en su orden y numeradas, y su franja las abarca', () => {
    const fila = filaCon([SUELDO], [], [DE_IIBB, DEL_DIEZMO]);
    const { nodos, aristas } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const iibb = nodo(nodos, `obligacion-${IIBB}`);
    const diezmo = nodo(nodos, 'diezmo');
    expect(iibb.position.y).toBe(Y_DE_LA_PRIMERA);
    expect(diezmo.position.y).toBe(Y_DE_LA_PRIMERA + ALTO.obligacion + ESPACIO);
    expect([iibb, diezmo].map((uno) => uno.type === 'obligacion' && uno.data.numero)).toEqual([
      1, 2,
    ]);
    expect(
      aristas.find((arista) => arista.source === `obligacion-${IIBB}`)?.data?.flujo,
    ).toBeNull();
    expect(aristas.find((arista) => arista.source === 'diezmo')?.data?.flujo).toBe('libre');

    const franja = nodo(nodos, 'tipo-obligaciones');
    expect(franja.position).toEqual({ x: X_DE_LOS_TIPOS, y: iibb.position.y });
    expect(franja.height).toBe(abajoDe(diezmo) - iibb.position.y);
    expect(franja.width).toBe(ANCHO_DEL_TIPO);
    expect(franja.focusable).toBe(false);
    expect(franja.selectable).toBe(false);
    expect(franja.domAttributes).toEqual({
      'aria-roledescription': undefined,
      'aria-describedby': undefined,
    });
  });

  it('sin compromisos, la flecha de la última obligación dice solo «Ganancia»', () => {
    const fila = filaCon([MATERIALES_]);
    const { aristas, nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    expect(aristas.find((arista) => arista.source === 'diezmo')?.data?.flujo).toBe('ganancia');
    expect(nodos.some((uno) => uno.id === 'tipo-compromisos')).toBe(false);
  });

  it('la franja de cada tipo va a la izquierda de los globos, a lo largo de su grupo', () => {
    const fila = filaCon([SUELDO, GASTOS_FIJOS, MATERIALES_, HERRAMIENTAS_], [[COCOS, 5000]]);
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const compromisos = nodo(nodos, 'tipo-compromisos');
    expect(compromisos.position).toEqual({
      x: X_DE_LOS_TIPOS,
      y: nodo(nodos, `paso-${HOGAR}`).position.y,
    });
    expect(abajoDe(compromisos)).toBe(abajoDe(nodo(nodos, `paso-${FIJOS}`)));
    expect(X_DE_LOS_TIPOS + ANCHO_DEL_TIPO + AL_TIPO + ANCHO_DEL_GLOBO).toBe(X);
    const ahorros = nodo(nodos, 'tipo-ahorros');
    expect(ahorros.position.y).toBe(nodo(nodos, `paso-${MATERIALES}`).position.y);
    expect(abajoDe(ahorros)).toBe(abajoDe(nodo(nodos, `parte-${COCOS}`)));
  });

  it('con ahorros fijos y sin partes, la franja de los ahorros termina en el último ahorro fijo', () => {
    const fila = filaCon([SUELDO, MATERIALES_, HERRAMIENTAS_]);
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const ahorros = nodo(nodos, 'tipo-ahorros');
    expect(ahorros.position.y).toBe(nodo(nodos, `paso-${MATERIALES}`).position.y);
    expect(abajoDe(ahorros)).toBe(abajoDe(nodo(nodos, `paso-${HERRAMIENTAS}`)));
  });

  it('sin ahorros fijos, la franja de los ahorros es la del abanico, y sin partes no hay', () => {
    const conPartes = filaCon([SUELDO], [[COCOS, 5000]]);
    const conAbanico = armarElPlano({ vista: vistaDe(conPartes), prueba: null, elegido: null });
    const ahorros = nodo(conAbanico.nodos, 'tipo-ahorros');
    const cocos = nodo(conAbanico.nodos, `parte-${COCOS}`);
    expect(ahorros.position.y).toBe(cocos.position.y);
    expect(ahorros.height).toBe(ALTO.parte);

    const sinNada = armarElPlano({
      vista: vistaDe(filaCon([SUELDO])),
      prueba: null,
      elegido: null,
    });
    expect(sinNada.nodos.some((uno) => uno.id === 'tipo-ahorros')).toBe(false);
  });

  it('cada ficha nueva lleva su ariaLabel y su aria-roledescription', () => {
    const fila = filaCon(
      [SUELDO, { ...GASTOS_FIJOS, modo: 'saldo' }, MATERIALES_],
      [[COCOS, 5000]],
      [DE_IIBB, DEL_DIEZMO],
    );
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const rol = (id: string) => nodo(nodos, id).domAttributes?.['aria-roledescription'];
    expect(rol(`obligacion-${IIBB}`)).toBe('obligación');
    expect(rol('diezmo')).toBe('obligación');
    expect(rol(`paso-${HOGAR}`)).toBe('compromiso');
    expect(rol(`paso-${MATERIALES}`)).toBe('ahorro');
    expect(rol(`parte-${COCOS}`)).toBe('ahorro');
    expect(rol('resto')).toBe('superávit');
    expect(rol('insumos')).toBe('insumos');
    expect(nodo(nodos, `obligacion-${IIBB}`).ariaLabel).toMatch(
      /^Obligación 1 de 5: Ingresos Brutos, 3,5% sobre lo que cobrás; a pagar \$\s0$/,
    );
    expect(nodo(nodos, 'diezmo').ariaLabel).toMatch(
      /^Obligación 2 de 5: Diezmo, 10% sobre el ingreso; a pagar \$\s0; no se puede sacar de la fila$/,
    );
    expect(nodo(nodos, `paso-${HOGAR}`).ariaLabel).toMatch(
      /^Compromiso 3 de 5: Hogar, sueldo, hasta \$\s1\.800\.000 por mes; lleva \$\s0, faltan \$\s1\.800\.000$/,
    );
    expect(nodo(nodos, `paso-${FIJOS}`).ariaLabel).toMatch(
      /^Compromiso 4 de 5: Gastos fijos, hasta \$\s900\.000, se renueva al pagar; a pagar \$\s0, faltan \$\s900\.000$/,
    );
    expect(nodo(nodos, `paso-${MATERIALES}`).ariaLabel).toMatch(
      /^Ahorro fijo 5 de 5: Materiales, hasta \$\s300\.000 por mes; lleva \$\s0, faltan \$\s300\.000$/,
    );
    expect(nodo(nodos, `parte-${COCOS}`).ariaLabel).toBe('Ahorro: Cocos, 50% de lo que sobra');
    expect(nodo(nodos, 'resto').ariaLabel).toBe(
      'Superávit: Maun recibe el resto, 50%, y los centavos',
    );
  });
});

describe('el reparto, las partes y el superávit', () => {
  it('el reparto va a la derecha del último paso, centrado con él, y las partes cuelgan en abanico', () => {
    const fila = filaCon(
      [MATERIALES_],
      [
        [COCOS, 6000],
        [INMUEBLES, 4000],
      ],
    );
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const materiales = nodo(nodos, `paso-${MATERIALES}`);
    const reparto = nodo(nodos, 'reparto');
    expect(reparto.position).toEqual({
      x: X_DE_LA_DERECHA,
      y: materiales.position.y + (ALTO.paso - ALTO.reparto) / 2,
    });
    const partes = nodos.filter((candidato) => candidato.type === 'parte');
    expect(partes.map((parte) => parte.id)).toEqual([
      `parte-${COCOS}`,
      `parte-${INMUEBLES}`,
      'resto',
    ]);
    const ancho = 3 * ANCHO_DE_PARTE + 2 * ENTRE_PARTES;
    expect(partes.map((parte) => parte.position.x)).toEqual([
      CENTRO_DEL_REPARTO - ancho / 2,
      CENTRO_DEL_REPARTO - ancho / 2 + ANCHO_DE_PARTE + ENTRE_PARTES,
      CENTRO_DEL_REPARTO - ancho / 2 + 2 * (ANCHO_DE_PARTE + ENTRE_PARTES),
    ]);
    expect(new Set(partes.map((parte) => parte.position.y))).toEqual(
      new Set([reparto.position.y + ALTO.reparto + BAJADA_DEL_REPARTO]),
    );
    const resto = nodo(nodos, 'resto');
    expect(resto.type === 'parte' && resto.data).toMatchObject({ superavit: true, porcentaje: 0 });
  });

  it('un abanico ancho no se pasa a la izquierda de la columna, donde va la franja de los tipos', () => {
    const muchos = [COCOS, INMUEBLES, HERRAMIENTAS, APARTE].map(
      (tesoroDelReparto) => [tesoroDelReparto, 1000] as const,
    );
    const { nodos } = armarElPlano({
      vista: vistaDe(filaCon([SUELDO], muchos, [DEL_DIEZMO], MATERIALES)),
      prueba: null,
      elegido: null,
    });
    const primera = nodos.find((candidato) => candidato.type === 'parte');
    expect(primera?.position.x).toBe(X);
  });

  it('con el superávit en otro tesoro, la última parte es la suya, con lo que recibió en el mes', () => {
    const fila = filaCon([SUELDO], [[COCOS, 5000]], [DEL_DIEZMO], APARTE);
    const datos: DatosDelMes = {
      ...SIN_DATOS,
      liquidaciones: [
        {
          fecha: '2026-09-03',
          neta: centavos(100_000_000),
          diezmo: centavos(10_000_000),
          aportes: [{ tesoro: APARTE, monto: centavos(40_000_000) }],
          remanente: CERO,
        },
      ],
    };
    const { nodos, aristas } = armarElPlano({
      vista: vistaDe(fila, [], fila, datos),
      prueba: null,
      elegido: null,
    });
    const resto = nodo(nodos, 'resto');
    expect(resto.type === 'parte' && resto.data).toMatchObject({
      superavit: true,
      delMes: 40_000_000,
    });
    expect(resto.type === 'parte' && resto.data.tesoro.nombre).toBe('Superávit');
    expect(aristas.find((arista) => arista.target === 'resto')?.data?.etiqueta).toBe('resto 50%');
  });

  it('una parte con meta lleva la meta y si va hasta ella', () => {
    const fila = filaCon([SUELDO], [[INMUEBLES, 2000, true]]);
    const datos: DatosDelMes = {
      ...SIN_DATOS,
      saldos: new Map<string, Money>([[INMUEBLES, centavos(25_000_000)]]),
      metas: new Map<string, Money>([[INMUEBLES, centavos(30_000_000)]]),
    };
    const { nodos } = armarElPlano({
      vista: vistaDe(fila, [], fila, datos),
      prueba: null,
      elegido: null,
    });
    const inmuebles = nodo(nodos, `parte-${INMUEBLES}`);
    expect(inmuebles.type === 'parte' && inmuebles.data).toMatchObject({
      hastaLaMeta: true,
      meta: { meta: 30_000_000, saldo: 25_000_000, falta: 5_000_000 },
    });
    expect(inmuebles.ariaLabel).toMatch(
      /^Ahorro: Inmuebles, 20% de lo que sobra, hasta la meta; tiene \$\s250\.000 de su meta de \$\s300\.000$/,
    );
  });
});

describe('el estante y «Nuevo tesoro»', () => {
  it('el estante empieza debajo de los insumos, arriba del reparto si entra', () => {
    const fila = filaCon([SUELDO, GASTOS_FIJOS, MATERIALES_, HERRAMIENTAS_]);
    const { nodos } = armarElPlano({
      vista: vistaDe(fila, [TESOROS[3] as TesoroDelTaller]),
      prueba: null,
      elegido: null,
    });
    const insumos = nodo(nodos, 'insumos');
    const titulo = nodo(nodos, 'titulo-del-estante');
    expect(titulo.position).toEqual({ x: X_DE_LA_DERECHA, y: abajoDe(insumos) + ESPACIO });
    expect(nodo(nodos, `estante-${COCOS}`).position).toEqual({
      x: X_DE_LA_DERECHA,
      y: titulo.position.y + ALTO.titulo + 8,
    });
    expect(nodo(nodos, 'nuevo').width).toBe(ANCHO_DEL_ESTANTE);
  });

  it('un estante que no entra antes del reparto pasa a la tercera columna', () => {
    const fila = filaCon([MATERIALES_]);
    const estante = [TESOROS[3], TESOROS[6], TESOROS[7]] as TesoroDelTaller[];
    const { nodos } = armarElPlano({ vista: vistaDe(fila, estante), prueba: null, elegido: null });
    const columna = X_DE_LA_DERECHA + ANCHO_DE_FICHA + AL_COSTADO;
    for (const suelto of estante) {
      expect(nodo(nodos, `estante-${suelto.id}`).position.x).toBe(columna);
    }
    expect(nodo(nodos, 'nuevo').position.x).toBe(columna);
    expect(nodo(nodos, 'titulo-del-estante').position.y).toBe(
      abajoDe(nodo(nodos, 'insumos')) + ESPACIO,
    );
  });

  it('«Nuevo tesoro» no se elige ni toma el foco: el foco es del botón; en el plano para mirar no aparece', () => {
    const fila = filaCon([MATERIALES_]);
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const nuevo = nodo(nodos, 'nuevo');
    expect(nuevo).toMatchObject({ focusable: false, selectable: false, draggable: false });
    expect(nuevo.ariaLabel).toBeUndefined();
    expect(nuevo.domAttributes).toEqual({
      'aria-roledescription': undefined,
      'aria-describedby': undefined,
    });
    const paraMirar = armarElPlano({
      vista: vistaDe(fila),
      prueba: null,
      elegido: null,
      conNuevo: false,
    });
    expect(paraMirar.nodos.some((uno) => uno.id === 'nuevo')).toBe(false);
  });

  it('con el estante vacío dice que todos están en la fila', () => {
    const { nodos } = armarElPlano({
      vista: vistaDe(filaCon([SUELDO, MATERIALES_]), []),
      prueba: null,
      elegido: null,
    });
    const titulo = nodo(nodos, 'titulo-del-estante');
    expect(titulo.type === 'titulo' && titulo.data.bajada).toBe('Todos están en la fila');
  });
});

describe('las fichas de los pasos', () => {
  it('un compromiso que se renueva suma el renglón del modo; uno con deuda por mes, el de a pagar; un ahorro con meta, el de la meta', () => {
    expect(altoDelPaso(SUELDO)).toBe(ALTO.paso);
    expect(altoDelPaso({ ...MATERIALES_, modo: 'saldo' })).toBe(ALTO.paso + RENGLON_DEL_ROTULO);
    expect(altoDelPaso(GASTOS_FIJOS, { conDeuda: true })).toBe(
      ALTO.paso + 3 * RENGLON + 10 + RENGLON,
    );
    expect(altoDelPaso({ ...GASTOS_FIJOS, modo: 'saldo' }, { conDeuda: true })).toBe(
      ALTO.paso + 3 * RENGLON + 10 + RENGLON_DEL_ROTULO,
    );
    expect(altoDelPaso(MATERIALES_, { conMeta: true })).toBe(ALTO.paso + RENGLON);
  });

  it('los gastos fijos muestran hasta cuatro renglones, y con más, tres y «y N más»', () => {
    const conRenglones = (cuantos: number): PasoDeLaFila => ({
      ...GASTOS_FIJOS,
      renglones: renglones(cuantos, 1_000_000),
    });
    expect(renglonesALaVista(conRenglones(4).renglones)).toHaveLength(4);
    expect(renglonesALaVista(conRenglones(5).renglones)).toHaveLength(3);
    const altoDeCuatro = ALTO.paso + 4 * RENGLON + 10;
    expect(altoDelPaso(conRenglones(4))).toBe(altoDeCuatro);
    expect(altoDelPaso(conRenglones(12))).toBe(altoDeCuatro);
  });

  it('editando, marca la revisión y lo que valía antes, también en las obligaciones', () => {
    const base = filaCon([MATERIALES_], [], [DE_IIBB, DEL_DIEZMO]);
    const fila = filaCon(
      [{ ...MATERIALES_, tope: centavos(35_000_000) }],
      [],
      [DEL_DIEZMO, { ...DE_IIBB, porcentaje: puntosBasicos(300) }],
    );
    const { nodos } = armarElPlano({ vista: vistaDe(fila, [], base), prueba: null, elegido: null });
    const paso = nodo(nodos, `paso-${MATERIALES}`);
    expect(paso.type === 'paso' && paso.data.revision).toEqual({
      numero: 5,
      antes: expect.stringMatching(/^\$\s300\.000$/) as unknown,
    });
    expect(paso.draggable).toBe(true);
    const iibb = nodo(nodos, `obligacion-${IIBB}`);
    expect(iibb.type === 'obligacion' && iibb.data.revision).toEqual({
      numero: 5,
      antes: 'era el 1',
    });
    expect(iibb.draggable).toBe(true);
  });
});

describe('la prueba y el «+» de cada tramo', () => {
  it('en la prueba, cada tramo lleva lo que baja y el ingreso libre y la ganancia su monto', () => {
    const fila = filaCon([SUELDO, MATERIALES_], [[COCOS, 5000]], [DE_IIBB, DEL_DIEZMO]);
    const prueba = calcularPorLaFila({
      destino: 'cobrado',
      fecha: '2026-09-27',
      cobrado: centavos(250_000_000),
      gastos: centavos(50_000_000),
      fila,
      sistema: SISTEMA,
      ajustes: { perdidoConSueldo: false, perdidoConDiezmo: true },
      liquidaciones: [],
      coberturas: [],
      saldos: new Map(),
      metas: new Map(),
    });
    const { aristas } = armarElPlano({ vista: vistaDe(fila), prueba, elegido: null });
    const monto = (source: string) =>
      aristas.find((arista) => arista.source === source)?.data?.monto;
    expect(monto('origen')).toBe(200_000_000);
    expect(monto(`obligacion-${IIBB}`)).toBe(191_250_000);
    expect(monto('diezmo')).toBe(172_125_000);
    expect(monto(`paso-${HOGAR}`)).toBe(0);
    expect(aristas.find((arista) => arista.source === 'diezmo')?.data?.flujo).toBe('libre');
  });

  it('el «+» de cada tramo ofrece los tipos según el lugar, y solo editando', () => {
    const fila = filaCon([SUELDO, MATERIALES_], [], [DE_IIBB, DEL_DIEZMO]);
    const base = filaCon([SUELDO, MATERIALES_], [], [DEL_DIEZMO]);
    const { aristas } = armarElPlano({
      vista: vistaDe(fila, [], base),
      prueba: null,
      elegido: null,
    });
    const lugar = (source: string) =>
      aristas.find((arista) => arista.source === source)?.data?.lugar;
    expect(lugar('origen')).toEqual({ fuente: 'origen', despuesDe: null, lugares: ['obligacion'] });
    expect(lugar(`obligacion-${IIBB}`)?.lugares).toEqual(['obligacion']);
    expect(lugar('diezmo')).toEqual({
      fuente: 'obligacion',
      despuesDe: DIEZMO,
      lugares: ['obligacion', 'compromiso'],
    });
    expect(lugar(`paso-${HOGAR}`)?.lugares).toEqual(['compromiso', 'ahorro-fijo']);
    expect(lugar(`paso-${MATERIALES}`)?.lugares).toEqual(['ahorro-fijo', 'reparto', 'superavit']);

    const sinEditar = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    expect(sinEditar.aristas.every((arista) => arista.data?.lugar === null)).toBe(true);
  });

  it('los lugares de un tramo van de su tipo al del siguiente', () => {
    expect(lugaresDelTramo('obligacion', 'ahorro-fijo')).toEqual([
      'obligacion',
      'compromiso',
      'ahorro-fijo',
    ]);
    expect(lugaresDelTramo('compromiso', 'reparto')).toEqual([
      'compromiso',
      'ahorro-fijo',
      'reparto',
      'superavit',
    ]);
    expect(lugaresDelTramo('origen', 'compromiso')).toEqual(['obligacion', 'compromiso']);
  });
});

describe('arrastrar adentro del tipo', () => {
  it('los huecos cuentan solo los de su grupo, y los otros pasos se corren', () => {
    const fila = filaCon([SUELDO, GASTOS_FIJOS, MATERIALES_, HERRAMIENTAS_]);
    const vista = vistaDe(fila);
    const centros = centrosDeLasFichas(vista);
    expect(centros.map((centro) => centro.grupo)).toEqual([
      'obligacion',
      'compromiso',
      'compromiso',
      'ahorro-fijo',
      'ahorro-fijo',
    ]);
    expect(huecoDelArrastre(centros, HERRAMIENTAS, 0)).toBe(0);
    expect(huecoDelArrastre(centros, HERRAMIENTAS, 5_000)).toBe(1);
    expect(huecoDelArrastre(centros, HOGAR, 5_000)).toBe(1);

    const { nodos } = armarElPlano({
      vista,
      prueba: null,
      elegido: null,
      arrastre: { tesoro: HERRAMIENTAS, hueco: 0 },
    });
    const materiales = nodo(nodos, `paso-${MATERIALES}`);
    const herramientas = nodo(nodos, `paso-${HERRAMIENTAS}`);
    expect(herramientas.position.y).toBeLessThan(materiales.position.y);
    expect(herramientas.position.y).toBeGreaterThan(nodo(nodos, `paso-${FIJOS}`).position.y);
  });

  it('soltar deja la ficha en su lugar, sin salir de su tipo', () => {
    const fila = filaCon(
      [SUELDO, GASTOS_FIJOS, MATERIALES_, HERRAMIENTAS_],
      [],
      [DE_IIBB, DEL_DIEZMO],
    );
    expect(
      aplicarElArrastre(fila, { tesoro: HERRAMIENTAS, hueco: 0 }).pasos.map((paso) => paso.tesoro),
    ).toEqual([HOGAR, FIJOS, HERRAMIENTAS, MATERIALES]);
    expect(aplicarElArrastre(fila, { tesoro: HERRAMIENTAS, hueco: 9 })).toBe(fila);
    expect(
      aplicarElArrastre(fila, { tesoro: HOGAR, hueco: 5 }).pasos.map((paso) => paso.tesoro),
    ).toEqual([FIJOS, HOGAR, MATERIALES, HERRAMIENTAS]);
    expect(
      aplicarElArrastre(fila, { tesoro: DIEZMO, hueco: 0 }).obligaciones.map(
        (obligacion) => obligacion.tesoro,
      ),
    ).toEqual([DIEZMO, IIBB]);
    expect(aplicarElArrastre(fila, { tesoro: IIBB, hueco: 0 })).toBe(fila);
    expect(aplicarElArrastre(fila, { tesoro: COCOS, hueco: 0 })).toBe(fila);
  });
});
