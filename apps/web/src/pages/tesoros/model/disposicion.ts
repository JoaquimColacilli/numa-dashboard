import {
  CERO,
  moverObligacion,
  moverPaso,
  restar,
  tipoDelPaso,
  type CambioDeLaFila,
  type Fila,
  type FilaDelMes,
  type LiquidacionPorLaFila,
  type MetaDelMes,
  type Money,
  type ObligacionDeLaFila,
  type PasoDeLaFila,
  type PasoDelMes,
  type TipoDelPaso,
} from '@maun/domain';
import type { Edge, Node } from '@xyflow/react';

import { DESCRIPCION_DEL_TIPO, type LugarEnLaFila, type ParteDeLaEscala } from '@/entities/fila';
import type { TesoroDelTaller } from '@/entities/tesoro';
import {
  escalaDe,
  FICHA_DE_LOS_INSUMOS,
  FICHA_DEL_DIEZMO,
  FICHA_DEL_ORIGEN,
  FICHA_DEL_REPARTO,
  FICHA_DEL_RESTO,
  FICHA_DEL_TITULO,
  FICHA_NUEVA,
  fichaDeLaObligacion,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  porciento,
  tesoroDe,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { mensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos, mesEnUnaFrase } from '@/shared/lib';

export const ANCHO_DE_FICHA = 272;
export const ANCHO_DE_PARTE = 216;
export const ANCHO_DEL_ESTANTE = 208;
export const ESPACIO = 40;
export const ESPACIO_DEL_COBRO = 56;
export const AL_COSTADO = 64;
export const AL_REPARTO = 128;
export const BAJADA_DEL_REPARTO = 64;
export const AIRE_DEL_ABANICO = 16;
export const BAJO_EL_ABANICO = 48;
export const PUNTA_DE_LA_FLECHA = 8;
export const ENTRE_PARTES = 16;
export const ENTRE_ESTANTES = 12;
export const RENGLON = 18;
export const ANCHO_DEL_GLOBO = 44;
export const ANCHO_DEL_TIPO = 40;
export const AL_TIPO = 8;

export const FICHA_DE_LA_SENA = 'sena';

export const ALTO = {
  sena: 56,
  insumos: 84,
  ingreso: 72,
  obligacion: 104,
  paso: 104,
  reparto: 96,
  parte: 104,
  estante: 84,
  nuevo: 56,
  titulo: 28,
} as const;

export const RENGLONES_EN_LA_FICHA = 4;

export const RENGLON_DEL_ROTULO = 16;

export const SOBRE_LOS_RENGLONES = 15;

export const SOBRE_LA_LINEA = 2;

export const GRUPOS_CON_FRANJA = ['obligaciones', 'compromisos', 'ahorros'] as const;

export type GrupoConFranja = (typeof GRUPOS_CON_FRANJA)[number];

export interface AltoDelPaso {
  conDeuda?: boolean;
  conMeta?: boolean;
}

export function altoDelPaso(
  paso: Pick<PasoDeLaFila, 'clase' | 'renglones' | 'modo'>,
  { conDeuda = false, conMeta = false }: AltoDelPaso = {},
): number {
  let alto: number = ALTO.paso;
  if (paso.clase === 'fijos') {
    alto += Math.min(paso.renglones.length, RENGLONES_EN_LA_FICHA) * RENGLON + SOBRE_LOS_RENGLONES;
  }
  if (paso.modo === 'saldo') alto += RENGLON_DEL_ROTULO;
  if (conDeuda && paso.modo !== 'saldo') alto += RENGLON + SOBRE_LA_LINEA;
  if (conMeta) alto += RENGLON + SOBRE_LA_LINEA;
  return alto;
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

export type DatosDeLaSena = Comun;

export interface DatosDeLosInsumos extends Comun {
  total: Money;
  trabajos: number;
}

export interface DatosDelIngreso extends Comun {
  ingreso: Money;
  cobros: number;
  prueba: Money | null;
}

export interface DatosDeLaObligacion extends Comun {
  numero: number;
  cuantos: number;
  tesoro: TesoroDelTaller;
  obligacion: ObligacionDeLaFila;
  diezmo: boolean;
  aPagar: Money;
  prueba: Money | null;
  arrastrando: boolean;
  revision: Revision | null;
}

export interface PruebaDelPaso {
  monto: Money;
  quedaba: Money;
  falta: Money;
  llegaALaMeta: boolean;
}

export interface DatosDelPaso extends Comun {
  numero: number;
  cuantos: number;
  tesoro: TesoroDelTaller;
  paso: PasoDeLaFila;
  tipo: TipoDelPaso;
  porTrabajo: boolean;
  delMes: PasoDelMes;
  conDeuda: boolean;
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
  superavit: boolean;
  hastaLaMeta: boolean;
  meta: MetaDelMes | null;
  delMes: Money;
  prueba: Money | null;
  llegaALaMeta: boolean;
  revision: Revision | null;
}

export interface DatosDelEstante extends Comun {
  tesoro: TesoroDelTaller;
}

export interface DatosDelTitulo extends Comun {
  texto: string;
  bajada: string;
}

export interface DatosDelTipo extends Comun {
  grupo: GrupoConFranja;
}

export type NodoDeLaSena = Node<DatosDeLaSena, 'sena'>;
export type NodoDeLosInsumos = Node<DatosDeLosInsumos, 'insumos'>;
export type NodoDelIngreso = Node<DatosDelIngreso, 'ingreso'>;
export type NodoDeLaObligacion = Node<DatosDeLaObligacion, 'obligacion'>;
export type NodoDelPaso = Node<DatosDelPaso, 'paso'>;
export type NodoDelReparto = Node<DatosDelReparto, 'reparto'>;
export type NodoDeLaParte = Node<DatosDeLaParte, 'parte'>;
export type NodoDelEstante = Node<DatosDelEstante, 'estante'>;
export type NodoNuevo = Node<Comun, 'nuevo'>;
export type NodoDelTitulo = Node<DatosDelTitulo, 'titulo'>;
export type NodoDelTipo = Node<DatosDelTipo, 'tipo'>;

export type NodoDelPlano =
  | NodoDeLaSena
  | NodoDeLosInsumos
  | NodoDelIngreso
  | NodoDeLaObligacion
  | NodoDelPaso
  | NodoDelReparto
  | NodoDeLaParte
  | NodoDelEstante
  | NodoNuevo
  | NodoDelTitulo
  | NodoDelTipo;

export type Tramo = 'cadena' | 'hacia-el-reparto' | 'reparto' | 'cobro' | 'hacia-los-insumos';

export type Flujo = 'cobro' | 'libre' | 'ganancia';

export type FuenteDelTramo = 'origen' | 'obligacion' | TipoDelPaso;

export interface LugarDelTramo {
  fuente: FuenteDelTramo;
  despuesDe: string | null;
  lugares: readonly LugarEnLaFila[];
}

export interface DatosDeLaArista {
  [clave: string]: unknown;
  tramo: Tramo;
  armando: boolean;
  etiqueta: string | null;
  monto: Money | null;
  grosor: number;
  vacia: boolean;
  flujo: Flujo | null;
  lugar: LugarDelTramo | null;
  centro?: number;
}

export type AristaDelPlano = Edge<DatosDeLaArista, 'plata'>;

export interface Arrastre {
  tesoro: string;
  hueco: number;
}

export interface InsumosEnElPlano {
  total: Money;
  trabajos: number;
}

export const SIN_INSUMOS: InsumosEnElPlano = { total: CERO, trabajos: 0 };

export type VistaDelPlano = Pick<
  VistaDeLaFila,
  | 'fila'
  | 'base'
  | 'delMes'
  | 'tesoros'
  | 'estante'
  | 'sistema'
  | 'armando'
  | 'cambios'
  | 'revision'
  | 'mes'
>;

export interface EntradaDelPlano {
  vista: VistaDelPlano;
  prueba: LiquidacionPorLaFila | null;
  elegido: string | null;
  arrastre?: Arrastre | null;
  insumos?: InsumosEnElPlano;
  conNuevo?: boolean;
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

export type GrupoDelArrastre = 'obligacion' | TipoDelPaso;

function grupoDelPaso(paso: Pick<PasoDeLaFila, 'clase'>): GrupoDelArrastre {
  return tipoDelPaso(paso.clase);
}

function conHueco<T extends { tesoro: string }>(
  lista: readonly T[],
  arrastre: Arrastre | null,
  grupo: (elemento: T) => string,
): T[] {
  if (arrastre === null) return [...lista];
  const movido = lista.find((elemento) => elemento.tesoro === arrastre.tesoro);
  if (movido === undefined) return [...lista];
  const suyo = grupo(movido);
  const resto = lista.filter((elemento) => elemento.tesoro !== arrastre.tesoro);
  const inicio = resto.findIndex((elemento) => grupo(elemento) === suyo);
  const delGrupo = resto.filter((elemento) => grupo(elemento) === suyo).length;
  if (inicio === -1) return [...lista];
  const lugar = inicio + Math.min(Math.max(0, arrastre.hueco), delGrupo);
  return [...resto.slice(0, lugar), movido, ...resto.slice(lugar)];
}

export function ordenConHueco(
  pasos: readonly PasoDeLaFila[],
  arrastre: Arrastre | null,
): PasoDeLaFila[] {
  return conHueco(pasos, arrastre, grupoDelPaso);
}

export function obligacionesConHueco(
  obligaciones: readonly ObligacionDeLaFila[],
  arrastre: Arrastre | null,
): ObligacionDeLaFila[] {
  return conHueco(obligaciones, arrastre, () => 'obligacion');
}

function delMesDe(mes: FilaDelMes, paso: PasoDeLaFila): PasoDelMes {
  return (
    mes.pasos.find((candidato) => candidato.tesoro === paso.tesoro) ?? {
      tesoro: paso.tesoro,
      clase: paso.clase,
      tipo: tipoDelPaso(paso.clase),
      modo: paso.modo,
      objetivo: paso.tope,
      recibido: CERO,
      cubierto: CERO,
      lleva: CERO,
      falta: paso.modo === 'trabajo' ? null : paso.tope,
      completo: paso.modo !== 'trabajo' && paso.tope === 0,
      aPagar: null,
      vencimientos: [],
      meta: null,
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
  base?: Pick<Fila, 'obligaciones' | 'pasos'>,
): Map<string, Revision> {
  const { eraEl } = mensajes().paginaTesoros.plano;
  const mapa = new Map<string, Revision>();
  for (const cambio of cambios) {
    let antes: string | null = null;
    if (cambio.tipo === 'cambia-el-tope') antes = formatearPesos(cambio.antes);
    if (cambio.tipo === 'cambia-el-porcentaje') antes = porciento(cambio.antes);
    if (cambio.tipo === 'cambia-el-porcentaje-de-la-obligacion') antes = porciento(cambio.antes);
    if (cambio.tipo === 'cambia-de-lugar-la-obligacion') antes = eraEl(cambio.antes + 1);
    if (cambio.tipo === 'cambia-de-lugar') {
      antes = eraEl((base?.obligaciones.length ?? 0) + cambio.antes + 1);
    }
    const previa = mapa.get(cambio.tesoro);
    mapa.set(cambio.tesoro, { numero, antes: previa?.antes ?? antes });
  }
  return mapa;
}

export function etiquetaDeLaObligacion(
  numero: number,
  cuantos: number,
  tesoro: Pick<TesoroDelTaller, 'nombre'>,
  obligacion: ObligacionDeLaFila,
  aPagar: Money,
  diezmo: boolean,
): string {
  const textos = mensajes().paginaTesoros.plano;
  const etiqueta = diezmo ? textos.etiquetaDelDiezmo : textos.etiquetaDeLaObligacion;
  return etiqueta(
    numero,
    cuantos,
    tesoro.nombre,
    porciento(obligacion.porcentaje),
    obligacion.base,
    formatearPesos(aPagar),
  );
}

function estadoEnPalabras(delMes: PasoDelMes, conDeuda: boolean): string {
  const textos = mensajes().paginaTesoros.plano;
  if (delMes.modo === 'trabajo') return textos.enElMesRecibio(formatearPesos(delMes.recibido));
  const lleva = formatearPesos(delMes.lleva);
  const falta = delMes.falta ?? 0;
  const faltan = formatearPesos(falta);
  if (delMes.modo === 'saldo' && conDeuda) {
    return falta > 0 ? textos.aPagarYFaltan(lleva, faltan) : textos.aPagarCompleto(lleva);
  }
  if (delMes.modo === 'saldo') {
    return falta > 0 ? textos.tieneYFaltan(lleva, faltan) : textos.tieneCompleto(lleva);
  }
  return falta > 0 ? textos.llevaYFaltan(lleva, faltan) : textos.llevaCompleto(lleva);
}

export function etiquetaDelPaso(
  numero: number,
  cuantos: number,
  tesoro: Pick<TesoroDelTaller, 'nombre'>,
  paso: PasoDeLaFila,
  delMes: PasoDelMes,
  conDeuda = false,
): string {
  const textos = mensajes().paginaTesoros.plano;
  const tipo = tipoDelPaso(paso.clase);
  const tope = formatearPesos(paso.tope);
  const encabezado =
    paso.clase === 'sueldo'
      ? textos.encabezadoDelSueldo(tipo, numero, cuantos, tesoro.nombre)
      : textos.encabezadoDelPaso(tipo, numero, cuantos, tesoro.nombre);
  const cifra =
    paso.modo === 'trabajo'
      ? textos.cifraPorTrabajo(tipo, tope)
      : paso.modo === 'saldo'
        ? textos.cifraDelSaldo(tipo, tope)
        : textos.cifraDelMes(tipo, tope);
  return textos.etiquetaDelPaso(encabezado, cifra, estadoEnPalabras(delMes, conDeuda));
}

function etiquetaDeLaParte(
  tesoro: Pick<TesoroDelTaller, 'nombre'>,
  porcentaje: number,
  hastaLaMeta: boolean,
  meta: MetaDelMes | null,
): string {
  const textos = mensajes().paginaTesoros.plano;
  if (meta === null) return textos.etiquetaDeLaParte(tesoro.nombre, porciento(porcentaje));
  const etiqueta = hastaLaMeta
    ? textos.etiquetaDeLaParteHastaLaMeta
    : textos.etiquetaDeLaParteConMeta;
  return etiqueta(
    tesoro.nombre,
    porciento(porcentaje),
    formatearPesos(meta.saldo),
    formatearPesos(meta.meta),
  );
}

export function textoDelIngreso(
  delMes: Pick<FilaDelMes, 'ingreso' | 'cobros'>,
  mes: string,
  prueba: Money | null,
): string {
  const textos = mensajes().paginaTesoros.plano;
  if (prueba !== null) return textos.pruebaDeUnTrabajo(formatearPesos(prueba));
  return textos.ingresoDelMes(mes, formatearPesos(delMes.ingreso), delMes.cobros);
}

export function textoDeLosInsumos(insumos: InsumosEnElPlano): string {
  return mensajes().paginaTesoros.plano.trabajosEnCurso(insumos.trabajos);
}

function conMedidas(nodo: NodoDelPlano): NodoDelPlano {
  return { ...nodo, measured: { width: nodo.width ?? 0, height: nodo.height ?? 0 } };
}

interface EslabonDeLaCadena {
  id: string;
  fuente: FuenteDelTramo;
  tesoro: string | null;
  monto: Money | null;
  flujo: Flujo | null;
}

const ORDEN_DEL_LUGAR: Readonly<Record<FuenteDelTramo, number>> = {
  origen: 0,
  obligacion: 0,
  compromiso: 1,
  'ahorro-fijo': 2,
};

const LUGARES_DE_LA_CADENA: readonly LugarEnLaFila[] = ['obligacion', 'compromiso', 'ahorro-fijo'];

export function lugaresDelTramo(
  desde: FuenteDelTramo,
  hacia: FuenteDelTramo | 'reparto',
): LugarEnLaFila[] {
  const inicio = ORDEN_DEL_LUGAR[desde];
  const fin = hacia === 'reparto' ? LUGARES_DE_LA_CADENA.length - 1 : ORDEN_DEL_LUGAR[hacia];
  const lugares = LUGARES_DE_LA_CADENA.slice(inicio, Math.max(inicio, fin) + 1);
  return hacia === 'reparto' ? [...lugares, 'reparto', 'superavit'] : lugares;
}

export function armarElPlano({
  vista,
  prueba,
  elegido,
  arrastre = null,
  insumos = SIN_INSUMOS,
  conNuevo = true,
}: EntradaDelPlano): Plano {
  const { fila, delMes, armando, sistema } = vista;
  const m = mensajes();
  const textos = m.paginaTesoros.plano;
  const mes = mesEnUnaFrase(vista.mes);
  const comun = { armando, probando: prueba !== null, mes };
  const marcas = armando
    ? revisiones(vista.cambios, vista.revision, vista.base)
    : new Map<string, Revision>();
  const marca = (tesoro: string) => marcas.get(tesoro) ?? null;
  const nodos: NodoDelPlano[] = [];
  const aristas: AristaDelPlano[] = [];
  const x = -ANCHO_DE_FICHA / 2;
  const xDeLaDerecha = ANCHO_DE_FICHA / 2 + AL_REPARTO;
  const neta = prueba?.neta ?? null;
  const obligaciones = obligacionesConHueco(fila.obligaciones, arrastre);
  const pasos = ordenConHueco(fila.pasos, arrastre);
  const cuantos = obligaciones.length + pasos.length;
  const conDeudaEn = (tesoro: string) => tesoro !== sistema.hogar && tesoro !== sistema.maun;

  nodos.push({
    id: FICHA_DE_LA_SENA,
    type: 'sena',
    position: { x, y: 0 },
    width: ANCHO_DE_FICHA,
    height: ALTO.sena,
    draggable: false,
    selectable: false,
    focusable: false,
    data: comun,
    ariaLabel: textos.senaDeLosTrabajos,
    domAttributes: { 'aria-roledescription': textos.entrada, 'aria-describedby': undefined },
  });
  const yDeLosInsumos = (ALTO.sena - ALTO.insumos) / 2;
  nodos.push({
    id: FICHA_DE_LOS_INSUMOS,
    type: 'insumos',
    position: { x: xDeLaDerecha, y: yDeLosInsumos },
    width: ANCHO_DEL_ESTANTE,
    height: ALTO.insumos,
    draggable: false,
    selected: elegido === FICHA_DE_LOS_INSUMOS,
    data: { ...comun, total: insumos.total, trabajos: insumos.trabajos },
    ...accesible(
      m.fila.descripcionDeLosInsumos,
      textos.etiquetaDeLosInsumos(formatearPesos(insumos.total), insumos.trabajos),
    ),
  });
  const sinMonto = {
    armando,
    etiqueta: null,
    monto: null,
    grosor: GROSOR_MINIMO,
    vacia: false,
    lugar: null,
  };
  aristas.push({
    id: 'hacia-los-insumos',
    type: 'plata',
    source: FICHA_DE_LA_SENA,
    sourceHandle: 'derecha',
    target: FICHA_DE_LOS_INSUMOS,
    targetHandle: 'izquierda',
    selectable: false,
    focusable: false,
    data: { ...sinMonto, tramo: 'hacia-los-insumos', flujo: null },
  });

  let y = ALTO.sena + ESPACIO_DEL_COBRO;
  const yDelIngreso = y;
  nodos.push({
    id: FICHA_DEL_ORIGEN,
    type: 'ingreso',
    position: { x, y },
    width: ANCHO_DE_FICHA,
    height: ALTO.ingreso,
    draggable: false,
    selectable: false,
    focusable: false,
    data: { ...comun, ingreso: delMes.ingreso, cobros: delMes.cobros, prueba: neta },
    ariaLabel: textoDelIngreso(delMes, mes, neta),
    domAttributes: { 'aria-roledescription': textos.entrada, 'aria-describedby': undefined },
  });
  aristas.push({
    id: 'se-cobra-el-trabajo',
    type: 'plata',
    source: FICHA_DE_LA_SENA,
    sourceHandle: 'abajo',
    target: FICHA_DEL_ORIGEN,
    targetHandle: 'arriba',
    selectable: false,
    focusable: false,
    data: { ...sinMonto, tramo: 'cobro', flujo: 'cobro' },
  });
  y += ALTO.ingreso + ESPACIO;

  const cadena: EslabonDeLaCadena[] = [
    { id: FICHA_DEL_ORIGEN, fuente: 'origen', tesoro: null, monto: neta, flujo: null },
  ];
  let corriente: Money | null = neta === null ? null : neta > 0 ? neta : CERO;
  const franjas: { grupo: GrupoConFranja; arriba: number; abajo: number }[] = [];
  const anotarFranja = (grupo: GrupoConFranja, arriba: number, abajo: number) => {
    const previa = franjas.find((franja) => franja.grupo === grupo);
    if (previa === undefined) franjas.push({ grupo, arriba, abajo });
    else previa.abajo = abajo;
  };

  let yDelUltimo = yDelIngreso;
  let altoDelUltimo: number = ALTO.ingreso;
  const hayCompromisos = pasos.some((paso) => tipoDelPaso(paso.clase) === 'compromiso');

  obligaciones.forEach((obligacion, indice) => {
    const esDiezmo = obligacion.tesoro === sistema.diezmo;
    const id = esDiezmo ? FICHA_DEL_DIEZMO : fichaDeLaObligacion(obligacion.tesoro);
    const tesoro = tesoroDe(vista, obligacion.tesoro);
    const delMesDeLaObligacion = delMes.obligaciones.find(
      (candidata) => candidata.tesoro === obligacion.tesoro,
    );
    const aPagar = delMesDeLaObligacion?.aPagar ?? CERO;
    const repartida = prueba?.obligaciones.find(
      (candidata) => candidata.tesoro === obligacion.tesoro,
    );
    const esLaMovida = arrastre?.tesoro === obligacion.tesoro;
    nodos.push({
      id,
      type: 'obligacion',
      position: { x, y },
      width: ANCHO_DE_FICHA,
      height: ALTO.obligacion,
      draggable: armando,
      selected: elegido === id,
      zIndex: esLaMovida ? 10 : undefined,
      data: {
        ...comun,
        numero: indice + 1,
        cuantos,
        tesoro,
        obligacion,
        diezmo: esDiezmo,
        aPagar,
        prueba: repartida?.monto ?? null,
        arrastrando: esLaMovida,
        revision: marca(obligacion.tesoro),
      },
      ...accesible(
        DESCRIPCION_DEL_TIPO.obligacion,
        etiquetaDeLaObligacion(indice + 1, cuantos, tesoro, obligacion, aPagar, esDiezmo),
      ),
    });
    if (corriente !== null && repartida !== undefined)
      corriente = restar(corriente, repartida.monto);
    const ultima = indice === obligaciones.length - 1;
    cadena.push({
      id,
      fuente: 'obligacion',
      tesoro: obligacion.tesoro,
      monto: corriente,
      flujo: ultima ? (hayCompromisos ? 'libre' : 'ganancia') : null,
    });
    anotarFranja('obligaciones', y, y + ALTO.obligacion);
    yDelUltimo = y;
    altoDelUltimo = ALTO.obligacion;
    y += ALTO.obligacion + ESPACIO;
  });

  const ultimoCompromiso = pasos.reduce(
    (ultimo, paso, indice) => (tipoDelPaso(paso.clase) === 'compromiso' ? indice : ultimo),
    -1,
  );
  let yDelPrimerAhorro: number | null = null;
  let abajoDelUltimoAhorro: number | null = null;

  for (const [indice, paso] of pasos.entries()) {
    const tipo = tipoDelPaso(paso.clase);
    const delMesDelPaso = delMesDe(delMes, paso);
    const conDeuda = tipo === 'compromiso' && conDeudaEn(paso.tesoro);
    const conMeta = tipo === 'ahorro-fijo' && delMesDelPaso.meta !== null;
    const repartido = prueba?.pasos.find((candidato) => candidato.tesoro === paso.tesoro);
    const tesoro = tesoroDe(vista, paso.tesoro);
    const alto = altoDelPaso(paso, { conDeuda, conMeta });
    const id = fichaDelPaso(paso.tesoro);
    const esElMovido = arrastre?.tesoro === paso.tesoro;
    const numero = obligaciones.length + indice + 1;
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
        numero,
        cuantos,
        tesoro,
        paso,
        tipo,
        porTrabajo: paso.clase === 'sueldo' && fila.sueldoPorTrabajo,
        delMes: delMesDelPaso,
        conDeuda,
        arrastrando: esElMovido,
        prueba:
          repartido === undefined
            ? null
            : {
                monto: repartido.monto,
                quedaba: repartido.tope,
                falta: repartido.falta,
                llegaALaMeta: repartido.llegaALaMeta,
              },
      },
      ...accesible(
        DESCRIPCION_DEL_TIPO[tipo],
        etiquetaDelPaso(numero, cuantos, tesoro, paso, delMesDelPaso, conDeuda),
      ),
    });
    if (corriente !== null && repartido !== undefined)
      corriente = restar(corriente, repartido.monto);
    cadena.push({
      id,
      fuente: tipo,
      tesoro: paso.tesoro,
      monto: corriente,
      flujo: indice === ultimoCompromiso ? 'ganancia' : null,
    });
    if (tipo === 'compromiso') anotarFranja('compromisos', y, y + alto);
    else {
      yDelPrimerAhorro ??= y;
      abajoDelUltimoAhorro = y + alto;
    }
    yDelUltimo = y;
    altoDelUltimo = alto;
    y += alto + ESPACIO;
  }

  const conPlata = (monto: Money | null) => ({
    etiqueta: monto === null ? null : formatearPesos(monto),
    monto,
    grosor: grosorDe(monto, neta),
    vacia: monto !== null && monto <= 0,
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
        ...conPlata(desde.monto),
        flujo: desde.flujo,
        lugar: armando
          ? {
              fuente: desde.fuente,
              despuesDe: desde.tesoro,
              lugares: lugaresDelTramo(desde.fuente, hacia.fuente),
            }
          : null,
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
      textos.rolDelReparto,
      textos.etiquetaDelReparto(
        escala.map((parte) =>
          textos.parteDelReparto(tesoroDe(vista, parte.tesoro).nombre, porciento(parte.porcentaje)),
        ),
      ),
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
        ...conPlata(monto),
        etiqueta: null,
        flujo: ultimo.flujo,
        lugar: armando
          ? {
              fuente: ultimo.fuente,
              despuesDe: ultimo.tesoro,
              lugares: lugaresDelTramo(ultimo.fuente, 'reparto'),
            }
          : null,
      },
    });
  }

  const anchoDelAbanico = escala.length * ANCHO_DE_PARTE + (escala.length - 1) * ENTRE_PARTES;
  const centroDelReparto = xDeLaDerecha + ANCHO_DE_FICHA / 2;
  let xDeLaParte = Math.max(centroDelReparto - anchoDelAbanico / 2, x);
  const abajoDelReparto = yDelReparto + ALTO.reparto;
  const abajoDelUltimo = yDelUltimo + altoDelUltimo;
  let yDeLasPartes = Math.max(abajoDelReparto + BAJADA_DEL_REPARTO, abajoDelUltimo + ESPACIO);
  const pasaPorDebajo = xDeLaParte + ANCHO_DE_PARTE / 2 < x + ANCHO_DE_FICHA;
  const alMedio = (abajoDelReparto + yDeLasPartes - PUNTA_DE_LA_FLECHA) / 2;
  const centroDelAbanico =
    pasaPorDebajo && alMedio < abajoDelUltimo + AIRE_DEL_ABANICO
      ? abajoDelUltimo + AIRE_DEL_ABANICO
      : undefined;
  if (centroDelAbanico !== undefined) {
    yDeLasPartes = Math.max(yDeLasPartes, centroDelAbanico + BAJO_EL_ABANICO);
  }
  for (const parte of escala) {
    const tesoro = tesoroDe(vista, parte.tesoro);
    const id = parte.resto ? FICHA_DEL_RESTO : fichaDeLaParte(parte.tesoro);
    const repartida = parte.resto
      ? undefined
      : prueba?.reparto.find((candidato) => candidato.tesoro === parte.tesoro);
    const monto = parte.resto ? (prueba?.remanente ?? null) : (repartida?.monto ?? null);
    const delMesDeLaParte = delMes.reparto.find((candidato) => candidato.tesoro === parte.tesoro);
    const recibido = parte.resto ? delMes.superavit.recibido : (delMesDeLaParte?.recibido ?? CERO);
    const hastaLaMeta =
      !parte.resto &&
      (fila.reparto.find((candidata) => candidata.tesoro === parte.tesoro)?.hastaLaMeta ?? false);
    const meta = parte.resto ? null : (delMesDeLaParte?.meta ?? null);
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
        superavit: parte.resto,
        hastaLaMeta,
        meta,
        delMes: recibido,
        prueba: monto,
        llegaALaMeta: repartida?.llegaALaMeta ?? false,
      },
      ...accesible(
        parte.resto
          ? DESCRIPCION_DEL_TIPO.superavit
          : DESCRIPCION_DEL_TIPO['ahorro-por-porcentaje'],
        parte.resto
          ? textos.etiquetaDelResto(tesoro.nombre, porciento(parte.porcentaje))
          : etiquetaDeLaParte(tesoro, parte.porcentaje, hastaLaMeta, meta),
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
        ...conPlata(monto),
        etiqueta:
          monto === null
            ? parte.resto
              ? textos.restoConPorcentaje(porciento(parte.porcentaje))
              : porciento(parte.porcentaje)
            : formatearPesos(monto),
        flujo: null,
        lugar: null,
        ...(centroDelAbanico === undefined ? {} : { centro: centroDelAbanico }),
      },
    });
    xDeLaParte += ANCHO_DE_PARTE + ENTRE_PARTES;
  }

  const hayPartes = fila.reparto.length > 0;
  if (yDelPrimerAhorro !== null || hayPartes) {
    const arriba = yDelPrimerAhorro ?? yDeLasPartes;
    const abajo = hayPartes ? yDeLasPartes + ALTO.parte : (abajoDelUltimoAhorro ?? arriba);
    franjas.push({ grupo: 'ahorros', arriba, abajo });
  }
  const xDeLosTipos = x - ANCHO_DEL_GLOBO - AL_TIPO - ANCHO_DEL_TIPO;
  for (const franja of franjas) {
    nodos.push({
      id: `tipo-${franja.grupo}`,
      type: 'tipo',
      position: { x: xDeLosTipos, y: franja.arriba },
      width: ANCHO_DEL_TIPO,
      height: franja.abajo - franja.arriba,
      draggable: false,
      selectable: false,
      focusable: false,
      data: { ...comun, grupo: franja.grupo },
      ...SIN_TECLADO,
    });
  }

  const estante = vista.estante;
  const altoDelEstante =
    ALTO.titulo +
    8 +
    estante.length * (ALTO.estante + ENTRE_ESTANTES) +
    (conNuevo ? ALTO.nuevo : -ENTRE_ESTANTES);
  const yDelTitulo = Math.max(ALTO.sena, yDeLosInsumos + ALTO.insumos) + ESPACIO;
  const entraArriba = yDelTitulo + altoDelEstante <= yDelReparto - ESPACIO;
  const xDelEstante = entraArriba ? xDeLaDerecha : xDeLaDerecha + ANCHO_DE_FICHA + AL_COSTADO;
  let yDelEstante = yDelTitulo;
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
      texto: textos.estante,
      bajada: estante.length === 0 ? textos.todosEnLaFila : textos.noRecibenDeLosCobros,
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
        textos.rolDelEstante,
        textos.etiquetaDelEstante(suelto.nombre, formatearLaPlata(suelto.saldo)),
      ),
    });
    yDelEstante += ALTO.estante + ENTRE_ESTANTES;
  }
  if (conNuevo) {
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
  }

  return {
    nodos: nodos.map(conMedidas),
    aristas: aristas.map((arista) => ({
      ...arista,
      ariaLabel: textos.flecha,
      domAttributes: { 'aria-hidden': true },
    })),
  };
}

export interface CentroDeLaFicha {
  tesoro: string;
  grupo: GrupoDelArrastre;
  centro: number;
}

export function centrosDeLasFichas(vista: VistaDelPlano): CentroDeLaFicha[] {
  const { nodos } = armarElPlano({ vista, prueba: null, elegido: null });
  const centros: CentroDeLaFicha[] = [];
  for (const nodo of nodos) {
    const centro = nodo.position.y + (nodo.height ?? 0) / 2;
    if (nodo.type === 'obligacion') {
      centros.push({ tesoro: nodo.data.obligacion.tesoro, grupo: 'obligacion', centro });
    }
    if (nodo.type === 'paso') {
      centros.push({ tesoro: nodo.data.paso.tesoro, grupo: nodo.data.tipo, centro });
    }
  }
  return centros;
}

export function huecoDelArrastre(
  centros: readonly CentroDeLaFicha[],
  tesoro: string,
  centro: number,
): number {
  const grupo = centros.find((otro) => otro.tesoro === tesoro)?.grupo;
  return centros.filter(
    (otro) => otro.tesoro !== tesoro && otro.grupo === grupo && otro.centro < centro,
  ).length;
}

export function aplicarElArrastre(fila: Fila, arrastre: Arrastre): Fila {
  const lugarDeLaObligacion = fila.obligaciones.findIndex(
    (obligacion) => obligacion.tesoro === arrastre.tesoro,
  );
  if (lugarDeLaObligacion !== -1) {
    const destino = Math.min(Math.max(0, arrastre.hueco), fila.obligaciones.length - 1);
    return destino === lugarDeLaObligacion ? fila : moverObligacion(fila, arrastre.tesoro, destino);
  }
  const lugar = fila.pasos.findIndex((paso) => paso.tesoro === arrastre.tesoro);
  const movido = fila.pasos[lugar];
  if (movido === undefined) return fila;
  const grupo = grupoDelPaso(movido);
  const sin = fila.pasos.filter((paso) => paso.tesoro !== arrastre.tesoro);
  const inicio = sin.findIndex((paso) => grupoDelPaso(paso) === grupo);
  const delGrupo = sin.filter((paso) => grupoDelPaso(paso) === grupo).length;
  if (inicio === -1) return fila;
  const destino = inicio + Math.min(Math.max(0, arrastre.hueco), delGrupo);
  return destino === lugar ? fila : moverPaso(fila, arrastre.tesoro, destino);
}
