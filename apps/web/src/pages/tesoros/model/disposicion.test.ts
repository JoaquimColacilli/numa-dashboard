import {
  centavos,
  CERO,
  cambiosDeLaFila,
  filaDelMes,
  puntosBasicos,
  type Fila,
  type PasoDeLaFila,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import type { TintaDeTesoro } from '@/shared/lib';

import {
  ALTO,
  AL_COSTADO,
  altoDelPaso,
  ANCHO_DE_FICHA,
  ANCHO_DE_PARTE,
  ANCHO_DEL_ESTANTE,
  armarElPlano,
  BAJADA_DEL_REPARTO,
  centrosDeLosPasos,
  ENTRE_PARTES,
  ESPACIO,
  huecoDelArrastre,
  RENGLON,
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
];

const SUELDO: PasoDeLaFila = {
  tesoro: HOGAR,
  clase: 'sueldo',
  tope: centavos(180_000_000),
  renglones: [],
  desde: null,
};

const GASTOS_FIJOS: PasoDeLaFila = {
  tesoro: FIJOS,
  clase: 'fijos',
  tope: centavos(90_000_000),
  renglones: [
    { nombre: 'Alquiler', monto: centavos(50_000_000) },
    { nombre: 'Luz', monto: centavos(6_000_000) },
    { nombre: 'Ayudante', monto: centavos(34_000_000) },
  ],
  desde: null,
};

const MATERIALES_: PasoDeLaFila = {
  tesoro: MATERIALES,
  clase: 'prioridad',
  tope: centavos(30_000_000),
  renglones: [],
  desde: null,
};

const HERRAMIENTAS_: PasoDeLaFila = {
  tesoro: HERRAMIENTAS,
  clase: 'prioridad',
  tope: centavos(10_000_000),
  renglones: [],
  desde: null,
};

function vistaDe(fila: Fila, estante: TesoroDelTaller[] = [], base: Fila = fila): VistaDelPlano {
  return {
    fila,
    delMes: filaDelMes(fila, [], [], '2026-09'),
    tesoros: TESOROS,
    estante,
    sistema: { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO },
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

const X = -ANCHO_DE_FICHA / 2;
const X_DE_LA_DERECHA = ANCHO_DE_FICHA / 2 + AL_COSTADO;
const Y_DEL_DIEZMO = ALTO.origen + ESPACIO;
const Y_DEL_PRIMER_PASO = Y_DEL_DIEZMO + ALTO.diezmo + ESPACIO;
const CENTRO_DEL_REPARTO = X_DE_LA_DERECHA + ANCHO_DE_FICHA / 2;

describe('la disposición del plano', () => {
  it('sin pasos, el reparto va a la derecha del diezmo y Maun cuelga solo, con el resto', () => {
    const vacia: Fila = { pasos: [], reparto: [], sueldoPorTrabajo: false };
    const { nodos, aristas } = armarElPlano({
      vista: vistaDe(vacia, [TESOROS[3] as TesoroDelTaller]),
      prueba: null,
      elegido: null,
    });

    expect(nodo(nodos, 'origen').position).toEqual({ x: X, y: 0 });
    expect(nodo(nodos, 'diezmo').position).toEqual({ x: X, y: Y_DEL_DIEZMO });
    const yDelReparto = Y_DEL_DIEZMO + (ALTO.diezmo - ALTO.reparto) / 2;
    expect(nodo(nodos, 'reparto').position).toEqual({ x: X_DE_LA_DERECHA, y: yDelReparto });
    expect(nodo(nodos, 'resto').position).toEqual({
      x: CENTRO_DEL_REPARTO - ANCHO_DE_PARTE / 2,
      y: yDelReparto + ALTO.reparto + 64,
    });
    expect(aristas.map((arista) => arista.id)).toEqual([
      'cadena-origen-diezmo',
      'hacia-el-reparto-diezmo',
      'reparto-resto',
    ]);
    expect(nodo(nodos, `estante-${COCOS}`).position.x).toBe(
      X_DE_LA_DERECHA + ANCHO_DE_FICHA + AL_COSTADO,
    );
  });

  it('con un paso, el paso va debajo del diezmo y el reparto centrado con él', () => {
    const fila: Fila = { pasos: [MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const { nodos, aristas } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const paso = nodo(nodos, `paso-${MATERIALES}`);
    expect(paso.position).toEqual({ x: X, y: Y_DEL_PRIMER_PASO });
    expect(paso.height).toBe(ALTO.paso);
    expect(paso.measured).toEqual({ width: ANCHO_DE_FICHA, height: ALTO.paso });
    expect(nodo(nodos, 'reparto').position.y).toBe(
      Y_DEL_PRIMER_PASO + (ALTO.paso - ALTO.reparto) / 2,
    );
    expect(aristas.find((arista) => arista.target === 'reparto')?.source).toBe(
      `paso-${MATERIALES}`,
    );
  });

  it('con cuatro pasos, cada uno baja por su alto y los gastos fijos crecen con los renglones', () => {
    const fila: Fila = {
      pasos: [SUELDO, GASTOS_FIJOS, MATERIALES_, HERRAMIENTAS_],
      reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
      sueldoPorTrabajo: false,
    };
    const { nodos } = armarElPlano({
      vista: vistaDe(fila, [TESOROS[7] as TesoroDelTaller]),
      prueba: null,
      elegido: null,
    });
    const altoDeLosFijos = ALTO.paso + 3 * 18 + 10;
    const ys = [
      Y_DEL_PRIMER_PASO,
      Y_DEL_PRIMER_PASO + ALTO.paso + ESPACIO,
      Y_DEL_PRIMER_PASO + ALTO.paso + ESPACIO + altoDeLosFijos + ESPACIO,
    ];
    ys.push((ys[2] ?? 0) + ALTO.paso + ESPACIO);
    expect(
      [HOGAR, FIJOS, MATERIALES, HERRAMIENTAS].map((id) => nodo(nodos, `paso-${id}`).position.y),
    ).toEqual(ys);
    expect(nodo(nodos, `paso-${FIJOS}`).height).toBe(altoDeLosFijos);
    const yDelReparto = (ys[3] ?? 0) + (ALTO.paso - ALTO.reparto) / 2;
    expect(nodo(nodos, 'reparto').position).toEqual({ x: X_DE_LA_DERECHA, y: yDelReparto });
    expect(nodo(nodos, `paso-${FIJOS}`).ariaLabel).toBe(
      'Paso 2 de 4: Gastos fijos, gastos fijos, hasta $ 900.000 por mes; lleva $ 0'.replace(
        /\$ /g,
        '$ ',
      ),
    );
    expect(nodo(nodos, `estante-${INMUEBLES}`).position.x).toBe(X_DE_LA_DERECHA);
  });

  it('el abanico del reparto al 100% lleva cada parte y Maun al final, en cero', () => {
    const fila: Fila = {
      pasos: [MATERIALES_],
      reparto: [
        { tesoro: COCOS, porcentaje: puntosBasicos(6000) },
        { tesoro: INMUEBLES, porcentaje: puntosBasicos(4000) },
      ],
      sueldoPorTrabajo: false,
    };
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
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
    const resto = nodo(nodos, 'resto');
    expect(resto.type === 'parte' && resto.data.porcentaje).toBe(0);
    expect(new Set(partes.map((parte) => parte.position.y)).size).toBe(1);
  });

  it('con el estante vacío dice que todos están en la fila y deja «Nuevo tesoro»', () => {
    const fila: Fila = { pasos: [SUELDO, MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const { nodos } = armarElPlano({ vista: vistaDe(fila, []), prueba: null, elegido: null });
    const titulo = nodo(nodos, 'titulo-del-estante');
    expect(titulo.type === 'titulo' && titulo.data.bajada).toBe('Todos están en la fila');
    expect(titulo.position).toEqual({ x: X_DE_LA_DERECHA, y: Y_DEL_DIEZMO - ALTO.titulo - 8 });
    expect(nodo(nodos, 'nuevo').position).toEqual({ x: X_DE_LA_DERECHA, y: Y_DEL_DIEZMO });
    expect(nodo(nodos, 'nuevo').width).toBe(ANCHO_DEL_ESTANTE);
  });

  it('un estante que no entra antes del reparto pasa a la tercera columna', () => {
    const fila: Fila = { pasos: [MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const estante = [TESOROS[3], TESOROS[6], TESOROS[7]] as TesoroDelTaller[];
    const { nodos } = armarElPlano({ vista: vistaDe(fila, estante), prueba: null, elegido: null });
    const columna = X_DE_LA_DERECHA + ANCHO_DE_FICHA + AL_COSTADO;
    for (const suelto of estante) {
      expect(nodo(nodos, `estante-${suelto.id}`).position.x).toBe(columna);
    }
    expect(nodo(nodos, 'nuevo').position.x).toBe(columna);
  });

  it('editando, marca la revisión y lo que valía antes en lo que cambió', () => {
    const base: Fila = { pasos: [MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const fila: Fila = {
      pasos: [{ ...MATERIALES_, tope: centavos(35_000_000) }],
      reparto: [],
      sueldoPorTrabajo: false,
    };
    const { nodos } = armarElPlano({ vista: vistaDe(fila, [], base), prueba: null, elegido: null });
    const paso = nodo(nodos, `paso-${MATERIALES}`);
    expect(paso.type === 'paso' && paso.data.revision).toEqual({
      numero: 5,
      antes: '$ 300.000',
    });
    expect(paso.draggable).toBe(true);
  });

  it('con un paso y el reparto vacío, Maun cuelga solo del reparto, centrado, con el 100%', () => {
    const fila: Fila = { pasos: [MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const partes = nodos.filter((candidato) => candidato.type === 'parte');
    expect(partes.map((parte) => parte.id)).toEqual(['resto']);
    const resto = nodo(nodos, 'resto');
    expect(resto.position.x).toBe(CENTRO_DEL_REPARTO - ANCHO_DE_PARTE / 2);
    expect(resto.type === 'parte' && resto.data.porcentaje).toBe(10_000);
    const reparto = nodo(nodos, 'reparto');
    expect(resto.position.y).toBe(reparto.position.y + ALTO.reparto + BAJADA_DEL_REPARTO);
  });

  it('si el último paso es más alto que el reparto, las partes bajan hasta pasarlo', () => {
    const muchos: PasoDeLaFila = {
      ...GASTOS_FIJOS,
      renglones: Array.from({ length: 6 }, (_, indice) => ({
        nombre: `Gasto ${String(indice + 1)}`,
        monto: centavos(10_000_000),
      })),
      tope: centavos(60_000_000),
    };
    const fila: Fila = {
      pasos: [MATERIALES_, muchos],
      reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
      sueldoPorTrabajo: false,
    };
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    const ultimo = nodo(nodos, `paso-${FIJOS}`);
    const abajoDelUltimo = ultimo.position.y + (ultimo.height ?? 0);
    const reparto = nodo(nodos, 'reparto');
    expect(reparto.position.y + ALTO.reparto + BAJADA_DEL_REPARTO).toBeLessThan(
      abajoDelUltimo + ESPACIO,
    );
    for (const parte of nodos.filter((candidato) => candidato.type === 'parte')) {
      expect(parte.position.y).toBe(abajoDelUltimo + ESPACIO);
    }
  });

  it('los gastos fijos muestran hasta cuatro renglones, y con más, tres y «y N más»', () => {
    const conRenglones = (cuantos: number): PasoDeLaFila => ({
      ...GASTOS_FIJOS,
      renglones: Array.from({ length: cuantos }, (_, indice) => ({
        nombre: `Gasto ${String(indice + 1)}`,
        monto: centavos(1_000_000),
      })),
    });
    const cuatro = conRenglones(4);
    const cinco = conRenglones(5);
    const doce = conRenglones(12);
    expect(renglonesALaVista(cuatro.renglones)).toHaveLength(4);
    expect(renglonesALaVista(cinco.renglones)).toHaveLength(3);
    expect(renglonesALaVista(doce.renglones)).toHaveLength(3);
    const altoDeCuatro = ALTO.paso + 4 * RENGLON + 10;
    expect(altoDelPaso(cuatro)).toBe(altoDeCuatro);
    expect(altoDelPaso(cinco)).toBe(altoDeCuatro);
    expect(altoDelPaso(doce)).toBe(altoDeCuatro);
  });

  it('el título del estante, «Nuevo tesoro» y «Cada cobro» no se eligen ni dicen cómo elegirlos', () => {
    const fila: Fila = { pasos: [MATERIALES_], reparto: [], sueldoPorTrabajo: false };
    const { nodos } = armarElPlano({ vista: vistaDe(fila), prueba: null, elegido: null });
    for (const id of ['titulo-del-estante', 'nuevo']) {
      const atributos = nodo(nodos, id).domAttributes ?? {};
      expect(atributos).toHaveProperty('aria-roledescription', undefined);
      expect(atributos).toHaveProperty('aria-describedby', undefined);
    }
    const origen = nodo(nodos, 'origen');
    expect(origen.domAttributes).toEqual({
      'aria-roledescription': 'entrada',
      'aria-describedby': undefined,
    });
    expect(nodo(nodos, `paso-${MATERIALES}`).domAttributes).toEqual({
      'aria-roledescription': 'paso',
    });
  });

  it('al arrastrar, los otros pasos se corren para dejar el hueco', () => {
    const fila: Fila = {
      pasos: [SUELDO, MATERIALES_, HERRAMIENTAS_],
      reparto: [],
      sueldoPorTrabajo: false,
    };
    const vista = vistaDe(fila);
    const centros = centrosDeLosPasos(vista);
    expect(huecoDelArrastre(centros, HERRAMIENTAS, Y_DEL_PRIMER_PASO)).toBe(0);
    const { nodos } = armarElPlano({
      vista,
      prueba: null,
      elegido: null,
      arrastre: { tesoro: HERRAMIENTAS, hueco: 0 },
    });
    expect(nodo(nodos, `paso-${HOGAR}`).position.y).toBe(Y_DEL_PRIMER_PASO + ALTO.paso + ESPACIO);
    expect(nodo(nodos, `paso-${HERRAMIENTAS}`).position.y).toBe(Y_DEL_PRIMER_PASO);
  });
});
