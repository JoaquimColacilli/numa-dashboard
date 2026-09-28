import {
  CERO,
  restar,
  type CambioDeLaFila,
  type FilaDelMes,
  type LiquidacionPorLaFila,
  type Money,
  type PasoDeLaFila,
  type PasoDelMes,
  type PuntosBasicos,
} from '@maun/domain';
import type { Edge, Node } from '@xyflow/react';

import type { ParteDeLaEscala } from '@/entities/fila';
import type { TesoroDelTaller } from '@/entities/tesoro';
import {
  escalaDe,
  FICHA_DEL_DIEZMO,
  FICHA_DEL_ORIGEN,
  FICHA_DEL_REPARTO,
  FICHA_DEL_RESTO,
  FICHA_DEL_TITULO,
  FICHA_NUEVA,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  NOMBRE_DE_LA_CLASE,
  porciento,
  tesoroDe,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { formatearPesos, nombreDelMes } from '@/shared/lib';

export const ANCHO_DE_FICHA = 272;
export const ANCHO_DE_PARTE = 200;
export const ANCHO_DEL_ESTANTE = 208;
export const ESPACIO = 40;
export const AL_COSTADO = 64;
export const BAJADA_DEL_REPARTO = 64;
export const ENTRE_PARTES = 16;
export const ENTRE_ESTANTES = 12;
export const RENGLON = 18;

export const ALTO = {
  origen: 56,
  diezmo: 80,
  paso: 104,
  reparto: 96,
  parte: 100,
  estante: 84,
  nuevo: 56,
  titulo: 28,
} as const;

export const RENGLONES_EN_LA_FICHA = 4;

export function altoDelPaso(paso: Pick<PasoDeLaFila, 'clase' | 'renglones'>): number {
  if (paso.clase !== 'fijos') return ALTO.paso;
  return ALTO.paso + Math.min(paso.renglones.length, RENGLONES_EN_LA_FICHA) * RENGLON + 10;
}

export function renglonesALaVista<T>(renglones: readonly T[]): readonly T[] {
  return renglones.length > RENGLONES_EN_LA_FICHA
    ? renglones.slice(0, RENGLONES_EN_LA_FICHA - 1)
    : renglones;
}

export interface Revision {
  numero: number;
  antes: string | null;
}

interface Comun {
  [clave: string]: unknown;
  armando: boolean;
  probando: boolean;
  mes: string;
}

export interface DatosDelOrigen extends Comun {
  ganancia: Money;
  cobros: number;
  prueba: Money | null;
}

export interface DatosDelDiezmo extends Comun {
  tesoro: TesoroDelTaller;
  porcentaje: PuntosBasicos;
  delMes: Money;
  prueba: Money | null;
}

export interface PruebaDelPaso {
  monto: Money;
  quedaba: Money;
  falta: Money;
}

export interface DatosDelPaso extends Comun {
  numero: number;
  cuantos: number;
  tesoro: TesoroDelTaller;
  paso: PasoDeLaFila;
  porTrabajo: boolean;
  delMes: PasoDelMes;
  prueba: PruebaDelPaso | null;
  arrastrando: boolean;
  revision: Revision | null;
}

export interface DatosDelReparto extends Comun {
  escala: readonly ParteDeLaEscala[];
  aTesoros: number;
  prueba: Money | null;
}

export interface DatosDeLaParte extends Comun {
  tesoro: TesoroDelTaller;
  porcentaje: number;
  resto: boolean;
  delMes: Money;
  prueba: Money | null;
  revision: Revision | null;
}

export interface DatosDelEstante extends Comun {
  tesoro: TesoroDelTaller;
}

export interface DatosDelTitulo extends Comun {
  texto: string;
  bajada: string;
}

export type NodoDelOrigen = Node<DatosDelOrigen, 'origen'>;
export type NodoDelDiezmo = Node<DatosDelDiezmo, 'diezmo'>;
export type NodoDelPaso = Node<DatosDelPaso, 'paso'>;
export type NodoDelReparto = Node<DatosDelReparto, 'reparto'>;
export type NodoDeLaParte = Node<DatosDeLaParte, 'parte'>;
export type NodoDelEstante = Node<DatosDelEstante, 'estante'>;
export type NodoNuevo = Node<Comun, 'nuevo'>;
export type NodoDelTitulo = Node<DatosDelTitulo, 'titulo'>;

export type NodoDelPlano =
  | NodoDelOrigen
  | NodoDelDiezmo
  | NodoDelPaso
  | NodoDelReparto
  | NodoDeLaParte
  | NodoDelEstante
  | NodoNuevo
  | NodoDelTitulo;

export type Tramo = 'cadena' | 'hacia-el-reparto' | 'reparto';

export interface DatosDeLaArista {
  [clave: string]: unknown;
  tramo: Tramo;
  armando: boolean;
  etiqueta: string | null;
  monto: Money | null;
  grosor: number;
  vacia: boolean;
  sumable: boolean;
  despuesDe: string | null;
}

export type AristaDelPlano = Edge<DatosDeLaArista, 'plata'>;

export interface Arrastre {
  tesoro: string;
  hueco: number;
}

export type VistaDelPlano = Pick<
  VistaDeLaFila,
  'fila' | 'delMes' | 'tesoros' | 'estante' | 'sistema' | 'armando' | 'cambios' | 'revision' | 'mes'
>;

export interface EntradaDelPlano {
  vista: VistaDelPlano;
  prueba: LiquidacionPorLaFila | null;
  elegido: string | null;
  arrastre?: Arrastre | null;
}

export interface Plano {
  nodos: NodoDelPlano[];
  aristas: AristaDelPlano[];
}

export const GROSOR_MINIMO = 1.5;
export const GROSOR_MAXIMO = 12;

export function grosorDe(monto: Money | null, total: Money | null): number {
  if (monto === null || total === null || total <= 0) return GROSOR_MINIMO;
  if (monto <= 0) return 1;
  return GROSOR_MINIMO + (GROSOR_MAXIMO - GROSOR_MINIMO) * Math.min(1, monto / total);
}

export function ordenConHueco(
  pasos: readonly PasoDeLaFila[],
  arrastre: Arrastre | null,
): PasoDeLaFila[] {
  if (arrastre === null) return [...pasos];
  const movido = pasos.find((paso) => paso.tesoro === arrastre.tesoro);
  if (movido === undefined) return [...pasos];
  const resto = pasos.filter((paso) => paso.tesoro !== arrastre.tesoro);
  return [...resto.slice(0, arrastre.hueco), movido, ...resto.slice(arrastre.hueco)];
}

function delMesDe(mes: FilaDelMes, paso: PasoDeLaFila): PasoDelMes {
  return (
    mes.pasos.find((candidato) => candidato.tesoro === paso.tesoro) ?? {
      tesoro: paso.tesoro,
      clase: paso.clase,
      objetivo: paso.tope,
      recibido: CERO,
      cubierto: CERO,
      falta: paso.tope,
      completo: paso.tope === 0,
    }
  );
}

function accesible(descripcion: string, etiqueta: string) {
  return { ariaLabel: etiqueta, domAttributes: { 'aria-roledescription': descripcion } };
}

const SIN_TECLADO = {
  domAttributes: { 'aria-roledescription': undefined, 'aria-describedby': undefined },
};

export function revisiones(
  cambios: readonly CambioDeLaFila[],
  numero: number,
): Map<string, Revision> {
  const mapa = new Map<string, Revision>();
  for (const cambio of cambios) {
    let antes: string | null = null;
    if (cambio.tipo === 'cambia-el-tope') antes = formatearPesos(cambio.antes);
    if (cambio.tipo === 'cambia-el-porcentaje') antes = porciento(cambio.antes);
    if (cambio.tipo === 'cambia-de-lugar') antes = `era el ${String(cambio.antes + 1)}`;
    const previa = mapa.get(cambio.tesoro);
    mapa.set(cambio.tesoro, { numero, antes: previa?.antes ?? antes });
  }
  return mapa;
}

export function etiquetaDelPaso(
  numero: number,
  cuantos: number,
  tesoro: TesoroDelTaller,
  paso: PasoDeLaFila,
  delMes: PasoDelMes,
): string {
  const lleva = delMes.recibido + delMes.cubierto;
  return `Paso ${String(numero)} de ${String(cuantos)}: ${tesoro.nombre}, ${NOMBRE_DE_LA_CLASE[paso.clase].toLowerCase()}, hasta ${formatearPesos(paso.tope)} por mes; lleva ${formatearPesos(lleva)}`;
}

function conMedidas(nodo: NodoDelPlano): NodoDelPlano {
  return { ...nodo, measured: { width: nodo.width ?? 0, height: nodo.height ?? 0 } };
}

export function armarElPlano({ vista, prueba, elegido, arrastre = null }: EntradaDelPlano): Plano {
  const { fila, delMes, armando } = vista;
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const comun = { armando, probando: prueba !== null, mes };
  const marcas = armando ? revisiones(vista.cambios, vista.revision) : new Map<string, Revision>();
  const marca = (tesoro: string) => marcas.get(tesoro) ?? null;
  const nodos: NodoDelPlano[] = [];
  const aristas: AristaDelPlano[] = [];
  const x = -ANCHO_DE_FICHA / 2;
  const xDeLaDerecha = ANCHO_DE_FICHA / 2 + AL_COSTADO;
  const neta = prueba?.neta ?? null;
  const pasos = ordenConHueco(fila.pasos, arrastre);
  const diezmo = tesoroDe(vista, vista.sistema.diezmo);
  let y = 0;

  nodos.push({
    id: FICHA_DEL_ORIGEN,
    type: 'origen',
    position: { x, y },
    width: ANCHO_DE_FICHA,
    height: ALTO.origen,
    draggable: false,
    selectable: false,
    focusable: false,
    data: { ...comun, ganancia: delMes.ganancia, cobros: delMes.cobros, prueba: neta },
    ariaLabel: 'Cada cobro entra acá',
    domAttributes: { 'aria-roledescription': 'entrada', 'aria-describedby': undefined },
  });
  y += ALTO.origen + ESPACIO;

  const yDelDiezmo = y;
  nodos.push({
    id: FICHA_DEL_DIEZMO,
    type: 'diezmo',
    position: { x, y },
    width: ANCHO_DE_FICHA,
    height: ALTO.diezmo,
    draggable: false,
    selected: elegido === FICHA_DEL_DIEZMO,
    data: {
      ...comun,
      tesoro: diezmo,
      porcentaje: (prueba?.diezmoBp ?? 1000) as PuntosBasicos,
      delMes: delMes.diezmo,
      prueba: prueba?.diezmo ?? null,
    },
    ...accesible(
      'paso fijo',
      `${diezmo.nombre}, 10% de cada ganancia, siempre primero; ${formatearPesos(delMes.diezmo)} en ${mes}`,
    ),
  });
  let yDelUltimo = y;
  let altoDelUltimo: number = ALTO.diezmo;
  y += ALTO.diezmo + ESPACIO;

  let corriente: Money | null = prueba === null ? null : restar(prueba.neta, prueba.diezmo);
  const cadena: { id: string; monto: Money | null; despuesDe: string | null }[] = [
    { id: FICHA_DEL_ORIGEN, monto: neta, despuesDe: null },
    { id: FICHA_DEL_DIEZMO, monto: corriente, despuesDe: null },
  ];

  pasos.forEach((paso, indice) => {
    const delMesDelPaso = delMesDe(delMes, paso);
    const repartido = prueba?.pasos.find((candidato) => candidato.tesoro === paso.tesoro);
    const tesoro = tesoroDe(vista, paso.tesoro);
    const alto = altoDelPaso(paso);
    const id = fichaDelPaso(paso.tesoro);
    const esElMovido = arrastre?.tesoro === paso.tesoro;
    nodos.push({
      id,
      type: 'paso',
      position: { x, y },
      width: ANCHO_DE_FICHA,
      height: alto,
      draggable: armando,
      selected: elegido === id,
      zIndex: esElMovido ? 10 : undefined,
      data: {
        ...comun,
        revision: marca(paso.tesoro),
        numero: indice + 1,
        cuantos: pasos.length,
        tesoro,
        paso,
        porTrabajo: paso.clase === 'sueldo' && fila.sueldoPorTrabajo,
        delMes: delMesDelPaso,
        arrastrando: esElMovido,
        prueba:
          repartido === undefined
            ? null
            : { monto: repartido.monto, quedaba: repartido.tope, falta: repartido.falta },
      },
      ...accesible('paso', etiquetaDelPaso(indice + 1, pasos.length, tesoro, paso, delMesDelPaso)),
    });
    if (corriente !== null && repartido !== undefined) {
      corriente = restar(corriente, repartido.monto);
    }
    cadena.push({ id, monto: corriente, despuesDe: paso.tesoro });
    yDelUltimo = y;
    altoDelUltimo = alto;
    y += alto + ESPACIO;
  });

  for (let i = 0; i < cadena.length - 1; i += 1) {
    const desde = cadena[i];
    const hacia = cadena[i + 1];
    if (desde === undefined || hacia === undefined) continue;
    aristas.push({
      id: `cadena-${desde.id}-${hacia.id}`,
      type: 'plata',
      source: desde.id,
      sourceHandle: 'abajo',
      target: hacia.id,
      targetHandle: 'arriba',
      selectable: false,
      focusable: false,
      data: {
        tramo: 'cadena',
        armando,
        etiqueta: desde.monto === null ? null : formatearPesos(desde.monto),
        monto: desde.monto,
        grosor: grosorDe(desde.monto, neta),
        vacia: desde.monto !== null && desde.monto <= 0,
        sumable: i >= 1,
        despuesDe: desde.despuesDe,
      },
    });
  }

  const ultimo = cadena.at(-1);
  const escala = escalaDe(vista);
  const aTesoros = escala
    .filter((parte) => !parte.resto)
    .reduce((suma, parte) => suma + parte.porcentaje, 0);
  const yDelReparto = yDelUltimo + (altoDelUltimo - ALTO.reparto) / 2;
  nodos.push({
    id: FICHA_DEL_REPARTO,
    type: 'reparto',
    position: { x: xDeLaDerecha, y: yDelReparto },
    width: ANCHO_DE_FICHA,
    height: ALTO.reparto,
    draggable: false,
    selected: elegido === FICHA_DEL_REPARTO,
    data: { ...comun, escala, aTesoros, prueba: prueba?.sobrante ?? null },
    ...accesible(
      'reparto',
      `Lo que sobra se reparte: ${escala
        .map((parte) => `${tesoroDe(vista, parte.tesoro).nombre} ${porciento(parte.porcentaje)}`)
        .join(', ')}`,
    ),
  });
  if (ultimo !== undefined) {
    const monto = prueba?.sobrante ?? null;
    aristas.push({
      id: `hacia-el-reparto-${ultimo.id}`,
      type: 'plata',
      source: ultimo.id,
      sourceHandle: 'derecha',
      target: FICHA_DEL_REPARTO,
      targetHandle: 'izquierda',
      selectable: false,
      focusable: false,
      data: {
        tramo: 'hacia-el-reparto',
        armando,
        etiqueta: null,
        monto,
        grosor: grosorDe(monto, neta),
        vacia: monto !== null && monto <= 0,
        sumable: armando,
        despuesDe: ultimo.despuesDe,
      },
    });
  }

  const anchoDelAbanico = escala.length * ANCHO_DE_PARTE + (escala.length - 1) * ENTRE_PARTES;
  const centroDelReparto = xDeLaDerecha + ANCHO_DE_FICHA / 2;
  let xDeLaParte = centroDelReparto - anchoDelAbanico / 2;
  const yDeLasPartes = Math.max(
    yDelReparto + ALTO.reparto + BAJADA_DEL_REPARTO,
    yDelUltimo + altoDelUltimo + ESPACIO,
  );
  for (const parte of escala) {
    const tesoro = tesoroDe(vista, parte.tesoro);
    const id = parte.resto ? FICHA_DEL_RESTO : fichaDeLaParte(parte.tesoro);
    const monto = parte.resto
      ? (prueba?.remanente ?? null)
      : (prueba?.reparto.find((candidato) => candidato.tesoro === parte.tesoro)?.monto ?? null);
    const recibido = parte.resto
      ? delMes.enElTaller
      : (delMes.reparto.find((candidato) => candidato.tesoro === parte.tesoro)?.recibido ?? CERO);
    nodos.push({
      id,
      type: 'parte',
      position: { x: xDeLaParte, y: yDeLasPartes },
      width: ANCHO_DE_PARTE,
      height: ALTO.parte,
      draggable: false,
      selected: elegido === id,
      data: {
        ...comun,
        revision: parte.resto ? null : marca(parte.tesoro),
        tesoro,
        porcentaje: parte.porcentaje,
        resto: parte.resto,
        delMes: recibido,
        prueba: monto,
      },
      ...accesible(
        parte.resto ? 'lo que queda' : 'parte del reparto',
        parte.resto
          ? `${tesoro.nombre} se queda con el resto, ${porciento(parte.porcentaje)}, y los centavos`
          : `${tesoro.nombre}, ${porciento(parte.porcentaje)} de lo que sobra`,
      ),
    });
    aristas.push({
      id: `reparto-${id}`,
      type: 'plata',
      source: FICHA_DEL_REPARTO,
      sourceHandle: 'abajo',
      target: id,
      targetHandle: 'arriba',
      selectable: false,
      focusable: false,
      data: {
        tramo: 'reparto',
        armando,
        etiqueta:
          monto === null
            ? parte.resto
              ? `resto ${porciento(parte.porcentaje)}`
              : porciento(parte.porcentaje)
            : formatearPesos(monto),
        monto,
        grosor: grosorDe(monto, neta),
        vacia: monto !== null && monto <= 0,
        sumable: false,
        despuesDe: null,
      },
    });
    xDeLaParte += ANCHO_DE_PARTE + ENTRE_PARTES;
  }

  const estante = vista.estante;
  const altoDelEstante =
    ALTO.titulo + 8 + estante.length * (ALTO.estante + ENTRE_ESTANTES) + ALTO.nuevo;
  const entraArriba = yDelDiezmo + altoDelEstante <= yDelReparto - ESPACIO;
  const xDelEstante = entraArriba ? xDeLaDerecha : xDeLaDerecha + ANCHO_DE_FICHA + AL_COSTADO;
  let yDelEstante = yDelDiezmo - ALTO.titulo - 8;
  nodos.push({
    id: FICHA_DEL_TITULO,
    type: 'titulo',
    position: { x: xDelEstante, y: yDelEstante },
    width: ANCHO_DEL_ESTANTE,
    height: ALTO.titulo,
    draggable: false,
    selectable: false,
    focusable: false,
    data: {
      ...comun,
      texto: 'Estante',
      bajada: estante.length === 0 ? 'Todos están en la fila' : 'No reciben de los cobros',
    },
    ...SIN_TECLADO,
  });
  yDelEstante += ALTO.titulo + 8;
  for (const suelto of estante) {
    const id = fichaDelEstante(suelto.id);
    nodos.push({
      id,
      type: 'estante',
      position: { x: xDelEstante, y: yDelEstante },
      width: ANCHO_DEL_ESTANTE,
      height: ALTO.estante,
      draggable: false,
      selected: elegido === id,
      data: { ...comun, tesoro: suelto },
      ...accesible(
        'tesoro en el estante',
        `${suelto.nombre}, en el estante, tiene ${formatearPesos(suelto.saldo)}`,
      ),
    });
    yDelEstante += ALTO.estante + ENTRE_ESTANTES;
  }
  nodos.push({
    id: FICHA_NUEVA,
    type: 'nuevo',
    position: { x: xDelEstante, y: yDelEstante },
    width: ANCHO_DEL_ESTANTE,
    height: ALTO.nuevo,
    draggable: false,
    selectable: false,
    focusable: false,
    data: comun,
    ...SIN_TECLADO,
  });

  return { nodos: nodos.map(conMedidas), aristas };
}

export function centrosDeLosPasos(vista: VistaDelPlano): { tesoro: string; centro: number }[] {
  const { nodos } = armarElPlano({ vista, prueba: null, elegido: null });
  return nodos
    .filter((nodo): nodo is NodoDelPaso => nodo.type === 'paso')
    .map((nodo) => ({
      tesoro: nodo.data.paso.tesoro,
      centro: nodo.position.y + (nodo.height ?? 0) / 2,
    }));
}

export function huecoDelArrastre(
  centros: readonly { tesoro: string; centro: number }[],
  tesoro: string,
  centro: number,
): number {
  return centros.filter((otro) => otro.tesoro !== tesoro && otro.centro < centro).length;
}
