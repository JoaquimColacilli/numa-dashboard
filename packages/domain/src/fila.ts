import { DIEZMO } from './cascada.ts';
import type { EstadoLiquidado } from './estados.ts';
import { diaDelMes, mesDe } from './fechas.ts';
import {
  aplicarPorcentaje,
  BASE_PUNTOS_BASICOS,
  CERO,
  centavos,
  esNegativo,
  maximo,
  minimo,
  MONEDA_DEL_TALLER,
  puntosBasicos,
  restar,
  sumar,
  sumarTodos,
  type Moneda,
  type Money,
  type PuntosBasicos,
} from './money.ts';
import { claveDelNombre } from './necesidades.ts';

export const CLASES_DE_PASO = ['sueldo', 'fijos', 'prioridad'] as const;

export type ClaseDePaso = (typeof CLASES_DE_PASO)[number];

export const MODOS_DE_PASO = ['mes', 'saldo', 'trabajo'] as const;

export type ModoDePaso = (typeof MODOS_DE_PASO)[number];

export const BASES_DE_OBLIGACION = ['cobrado', 'ingreso'] as const;

export type BaseDeLaObligacion = (typeof BASES_DE_OBLIGACION)[number];

export const TIPOS_DE_TESORO = [
  'obligacion',
  'compromiso',
  'ahorro-fijo',
  'ahorro-por-porcentaje',
  'superavit',
] as const;

export type TipoDeTesoro = (typeof TIPOS_DE_TESORO)[number];

export type TipoDelPaso = Extract<TipoDeTesoro, 'compromiso' | 'ahorro-fijo'>;

export const TOPE_DE_OBLIGACIONES = 6;
export const TOPE_DE_PASOS = 12;
export const TOPE_DE_PARTES = 8;
export const TOPE_DE_RENGLONES = 12;
export const LARGO_MAXIMO_DEL_RENGLON = 40;
export const ULTIMO_DIA_DE_PAGO = 31;
export const MONTO_MAXIMO_DE_LA_FILA: Money = centavos(1_000_000_000_000);

export interface Renglon {
  nombre: string;
  monto: Money;
  dia: number | null;
}

export interface ObligacionDeLaFila {
  tesoro: string;
  porcentaje: PuntosBasicos;
  base: BaseDeLaObligacion;
}

export interface PasoDeLaFila {
  tesoro: string;
  clase: ClaseDePaso;
  tope: Money;
  renglones: readonly Renglon[];
  desde: string | null;
  modo: ModoDePaso;
  hastaLaMeta: boolean;
}

export interface ParteDelReparto {
  tesoro: string;
  porcentaje: PuntosBasicos;
  hastaLaMeta: boolean;
}

export interface Fila {
  obligaciones: readonly ObligacionDeLaFila[];
  pasos: readonly PasoDeLaFila[];
  reparto: readonly ParteDelReparto[];
  superavit: string;
  sueldoPorTrabajo: boolean;
}

export interface TesorosDelSistema {
  hogar: string;
  maun: string;
  diezmo: string;
}

export interface TesoroDeLaFila {
  id: string;
  clave: 'hogar' | 'maun' | 'diezmo' | 'cocos' | null;
  archivado: boolean;
  meta: Money | null;
  moneda?: Moneda;
}

export interface AjustesDeSiempre {
  sueldoMensual: Money;
  costosFijos: Money;
  sueldoTopeMensual: boolean;
}

export interface AjustesDelReparto {
  perdidoConSueldo: boolean;
  perdidoConDiezmo: boolean;
}

export interface ObligacionDelPlan extends ObligacionDeLaFila {
  diezmo: boolean;
}

export interface PasoDelPlan {
  tesoro: string;
  clase: ClaseDePaso;
  objetivo: Money;
  porMes: boolean;
  modo: ModoDePaso;
  hastaLaMeta: boolean;
}

export interface PlanDelReparto {
  obligaciones: readonly ObligacionDelPlan[];
  pasos: readonly PasoDelPlan[];
  reparto: readonly ParteDelReparto[];
  superavit: string | null;
}

export interface PrevioDelReparto {
  previo: ReadonlyMap<string, Money>;
  topes: ReadonlyMap<string, Money>;
}

export interface EntradaDelReparto extends PlanDelReparto, PrevioDelReparto {
  cobrado: Money;
  gastos: Money;
}

export interface ObligacionRepartida extends ObligacionDelPlan {
  sobre: Money;
  llega: Money;
  monto: Money;
}

export interface PasoRepartido extends PasoDelPlan {
  previo: Money;
  tope: Money;
  monto: Money;
  falta: Money;
}

export interface ParteRepartida extends ParteDelReparto {
  tope: Money | null;
  leTocaba: Money;
  monto: Money;
  llegaALaMeta: boolean;
}

export interface Reparto {
  cobrado: Money;
  gastos: Money;
  neta: Money;
  obligaciones: readonly ObligacionRepartida[];
  diezmoBp: PuntosBasicos;
  diezmo: Money;
  libre: Money;
  pasos: readonly PasoRepartido[];
  ganancia: Money;
  sobrante: Money;
  reparto: readonly ParteRepartida[];
  superavit: string | null;
  remanente: Money;
}

export interface AporteDelMes {
  tesoro: string;
  monto: Money;
}

export interface LiquidacionDelMes {
  fecha: string;
  neta: Money;
  diezmo: Money;
  aportes: readonly AporteDelMes[];
  remanente: Money;
}

export interface Cobertura {
  tesoro: string;
  mes: string;
  monto: Money;
}

export interface GastoDeUnTesoro {
  tesoro: string;
  categoria: string;
  fecha: string;
}

export interface EntradaDeLaLiquidacion {
  destino: EstadoLiquidado;
  fecha: string;
  cobrado: Money;
  gastos: Money;
  fila: Fila;
  sistema: Pick<TesorosDelSistema, 'diezmo' | 'maun'>;
  ajustes: AjustesDelReparto;
  liquidaciones: readonly LiquidacionDelMes[];
  coberturas: readonly Cobertura[];
  saldos: ReadonlyMap<string, Money>;
  metas: ReadonlyMap<string, Money>;
}

export interface PasoLiquidado extends PasoRepartido {
  lleva: Money;
  faltaParaLaMeta: Money | null;
  llegaALaMeta: boolean;
}

export interface LiquidacionPorLaFila extends Reparto {
  destino: EstadoLiquidado;
  fecha: string;
  pasos: readonly PasoLiquidado[];
}

export type RepartoDelCobro =
  | {
      tipo: 'obligacion';
      tesoro: string;
      porcentaje: PuntosBasicos;
      base: BaseDeLaObligacion;
      monto: Money;
    }
  | {
      tipo: 'paso';
      tesoro: string;
      clase: ClaseDePaso;
      modo: ModoDePaso;
      objetivo: Money;
      previo: Money;
      tope: Money;
      porMes: boolean;
      monto: Money;
    }
  | { tipo: 'parte'; tesoro: string; porcentaje: PuntosBasicos; tope: Money | null; monto: Money }
  | { tipo: 'superavit'; tesoro: string; monto: Money };

export interface ColumnasDeSiempre {
  diezmoBp: PuntosBasicos;
  diezmo: Money;
  topeSueldo: Money;
  topeFijos: Money;
  sueldo: Money;
  fijos: Money;
  remanente: Money;
  objetivoSueldo: Money;
  objetivoFijos: Money;
  sueldoMensual: boolean;
  sueldoPrevio: Money;
  fijosPrevio: Money;
}

export interface DatosDelMes {
  liquidaciones: readonly LiquidacionDelMes[];
  coberturas: readonly Cobertura[];
  saldos: ReadonlyMap<string, Money>;
  metas: ReadonlyMap<string, Money>;
  gastos: readonly GastoDeUnTesoro[];
}

export interface ObligacionDelMes {
  tesoro: string;
  porcentaje: PuntosBasicos;
  base: BaseDeLaObligacion;
  diezmo: boolean;
  apartado: Money;
  aPagar: Money;
}

export interface VencimientoDelMes {
  indice: number;
  renglon: string;
  monto: Money;
  dia: number;
  fecha: string;
  pagado: boolean;
}

export interface MetaDelMes {
  meta: Money;
  saldo: Money;
  falta: Money;
  hastaLaMeta: boolean;
  llego: boolean;
}

export interface PasoDelMes {
  tesoro: string;
  clase: ClaseDePaso;
  tipo: TipoDelPaso;
  modo: ModoDePaso;
  objetivo: Money;
  recibido: Money;
  cubierto: Money;
  lleva: Money;
  falta: Money | null;
  completo: boolean;
  aPagar: Money | null;
  vencimientos: readonly VencimientoDelMes[];
  meta: MetaDelMes | null;
}

export interface ParteDelMes {
  tesoro: string;
  porcentaje: PuntosBasicos;
  hastaLaMeta: boolean;
  recibido: Money;
  meta: MetaDelMes | null;
}

export interface SuperavitDelMes {
  tesoro: string;
  recibido: Money;
}

export interface FilaDelMes {
  mes: string;
  cobros: number;
  ingreso: Money;
  diezmo: Money;
  apartado: Money;
  obligaciones: readonly ObligacionDelMes[];
  pasos: readonly PasoDelMes[];
  reparto: readonly ParteDelMes[];
  superavit: SuperavitDelMes;
  enElTaller: Money;
  repartoEmpezo: boolean;
}

export type ProblemaDeLaFila =
  | 'forma-invalida'
  | 'demasiadas-obligaciones'
  | 'demasiados-pasos'
  | 'demasiadas-partes'
  | 'tesoro-desconocido'
  | 'tesoro-archivado'
  | 'tesoro-en-otra-moneda'
  | 'tesoro-repetido'
  | 'obligacion-en-hogar-o-maun'
  | 'obligacion-invalida'
  | 'sin-diezmo'
  | 'diezmo-en-la-fila'
  | 'hogar-no-es-sueldo'
  | 'sueldo-no-es-hogar'
  | 'maun-no-es-fijos'
  | 'tope-fuera-de-rango'
  | 'renglones-en-otra-clase'
  | 'fijos-sin-renglones'
  | 'demasiados-renglones'
  | 'renglon-sin-nombre'
  | 'renglon-largo'
  | 'renglon-fuera-de-rango'
  | 'dia-invalido'
  | 'tope-no-es-la-suma'
  | 'desde-invalido'
  | 'modo-invalido'
  | 'meta-fuera-de-ahorro'
  | 'meta-sin-monto'
  | 'ahorro-antes-de-compromiso'
  | 'maun-en-el-reparto'
  | 'hogar-en-el-reparto'
  | 'porcentaje-invalido'
  | 'reparto-pasa-de-cien'
  | 'superavit-invalido'
  | 'superavit-en-la-fila'
  | 'sueldo-por-trabajo';

export interface ProblemaEnLaFila {
  problema: ProblemaDeLaFila;
  tesoro: string | null;
}

export type CambioDeLaFila =
  | {
      tipo: 'entra-a-las-obligaciones';
      tesoro: string;
      posicion: number;
      porcentaje: PuntosBasicos;
      base: BaseDeLaObligacion;
    }
  | { tipo: 'sale-de-las-obligaciones'; tesoro: string }
  | { tipo: 'cambia-de-lugar-la-obligacion'; tesoro: string; antes: number; despues: number }
  | {
      tipo: 'cambia-el-porcentaje-de-la-obligacion';
      tesoro: string;
      antes: PuntosBasicos;
      despues: PuntosBasicos;
    }
  | {
      tipo: 'cambia-la-base';
      tesoro: string;
      antes: BaseDeLaObligacion;
      despues: BaseDeLaObligacion;
    }
  | {
      tipo: 'entra-a-la-fila';
      tesoro: string;
      posicion: number;
      clase: ClaseDePaso;
      tope: Money;
      modo: ModoDePaso;
      hastaLaMeta: boolean;
    }
  | { tipo: 'sale-de-la-fila'; tesoro: string }
  | { tipo: 'cambia-de-lugar'; tesoro: string; antes: number; despues: number }
  | { tipo: 'cambia-la-clase'; tesoro: string; antes: ClaseDePaso; despues: ClaseDePaso }
  | { tipo: 'cambia-el-tope'; tesoro: string; antes: Money; despues: Money }
  | { tipo: 'cambian-los-renglones'; tesoro: string }
  | { tipo: 'cambian-los-dias'; tesoro: string }
  | { tipo: 'cambia-el-modo'; tesoro: string; antes: ModoDePaso; despues: ModoDePaso }
  | { tipo: 'cambia-la-meta'; tesoro: string; hastaLaMeta: boolean }
  | { tipo: 'entra-al-reparto'; tesoro: string; porcentaje: PuntosBasicos; hastaLaMeta: boolean }
  | { tipo: 'sale-del-reparto'; tesoro: string }
  | {
      tipo: 'cambia-el-porcentaje';
      tesoro: string;
      antes: PuntosBasicos;
      despues: PuntosBasicos;
    }
  | { tipo: 'cambia-el-superavit'; tesoro: string; antes: string };

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const MODOS_DE_LA_CLASE: Readonly<Record<ClaseDePaso, readonly ModoDePaso[]>> = {
  sueldo: ['mes'],
  fijos: ['mes', 'saldo'],
  prioridad: ['mes', 'saldo', 'trabajo'],
};

function exigirNoNegativo(nombre: string, importe: Money): void {
  if (esNegativo(importe)) {
    throw new RangeError(`${nombre} no puede ser negativo.`);
  }
}

function exigirMes(mes: string): void {
  if (!FORMATO_MES.test(mes)) {
    throw new RangeError(`Un mes va como AAAA-MM: ${mes} no.`);
  }
}

function porcentajeHaciaAbajo(importe: Money, porcentaje: PuntosBasicos): Money {
  const producto = importe * porcentaje;
  if (!Number.isSafeInteger(producto)) {
    throw new RangeError('Lo que sobra es demasiado grande para repartirlo con exactitud.');
  }
  return centavos((producto - (producto % BASE_PUNTOS_BASICOS)) / BASE_PUNTOS_BASICOS);
}

function sumaDeLosRenglones(renglones: readonly Renglon[]): Money {
  let suma = CERO;
  for (const renglon of renglones) suma = sumar(suma, renglon.monto);
  return suma;
}

function esCompromiso(paso: Pick<PasoDeLaFila, 'clase'>): boolean {
  return paso.clase !== 'prioridad';
}

function tieneMeta(meta: Money | null | undefined): meta is Money {
  return meta !== null && meta !== undefined && meta > 0;
}

function obligacionDelDiezmo(diezmo: string): ObligacionDeLaFila {
  return { tesoro: diezmo, porcentaje: DIEZMO, base: 'ingreso' };
}

export function esDiaDePago(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 1 && dia <= ULTIMO_DIA_DE_PAGO;
}

export function modosPosibles(
  clase: ClaseDePaso,
  clave: TesoroDeLaFila['clave'],
): readonly ModoDePaso[] {
  return clave === 'maun' ? ['mes'] : MODOS_DE_LA_CLASE[clase];
}

export function modoInicial(clase: ClaseDePaso, clave: TesoroDeLaFila['clave']): ModoDePaso {
  return clase === 'fijos' && clave !== 'maun' ? 'saldo' : 'mes';
}

export function admiteLaMeta(clase: ClaseDePaso): boolean {
  return clase === 'prioridad';
}

export function tipoDelPaso(clase: ClaseDePaso): TipoDelPaso {
  return clase === 'prioridad' ? 'ahorro-fijo' : 'compromiso';
}

export function tipoDelTesoro(fila: Fila, tesoro: string): TipoDeTesoro | null {
  if (fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) return 'obligacion';
  const paso = fila.pasos.find((candidato) => candidato.tesoro === tesoro);
  if (paso !== undefined) return tipoDelPaso(paso.clase);
  if (fila.reparto.some((parte) => parte.tesoro === tesoro)) return 'ahorro-por-porcentaje';
  return fila.superavit === tesoro ? 'superavit' : null;
}

export function sumaDelReparto(fila: Pick<Fila, 'reparto'>): number {
  let suma = 0;
  for (const parte of fila.reparto) suma += parte.porcentaje;
  return suma;
}

export function lugarLibreDelReparto(fila: Pick<Fila, 'reparto'>): PuntosBasicos {
  return puntosBasicos(Math.max(0, BASE_PUNTOS_BASICOS - sumaDelReparto(fila)));
}

export function tesorosDeLaFila(fila: Fila): string[] {
  return [
    ...new Set([
      ...fila.obligaciones.map((obligacion) => obligacion.tesoro),
      ...fila.pasos.map((paso) => paso.tesoro),
      ...fila.reparto.map((parte) => parte.tesoro),
      fila.superavit,
    ]),
  ];
}

export function filaDeSiempre(ajustes: AjustesDeSiempre, sistema: TesorosDelSistema): Fila {
  exigirNoNegativo('El sueldo', ajustes.sueldoMensual);
  exigirNoNegativo('Los costos fijos', ajustes.costosFijos);

  const pasos: PasoDeLaFila[] = [];
  if (ajustes.sueldoMensual > 0) {
    pasos.push({
      tesoro: sistema.hogar,
      clase: 'sueldo',
      tope: ajustes.sueldoMensual,
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    });
  }
  if (ajustes.costosFijos > 0) {
    pasos.push({
      tesoro: sistema.maun,
      clase: 'fijos',
      tope: ajustes.costosFijos,
      renglones: [{ nombre: 'Costos fijos', monto: ajustes.costosFijos, dia: null }],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    });
  }

  return {
    obligaciones: [obligacionDelDiezmo(sistema.diezmo)],
    pasos,
    reparto: [],
    superavit: sistema.maun,
    sueldoPorTrabajo: !ajustes.sueldoTopeMensual,
  };
}

function esEntero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esId(valor: unknown): valor is string {
  return typeof valor === 'string' && FORMATO_ID.test(valor);
}

function esUnoDe<T extends string>(opciones: readonly T[], valor: unknown): valor is T {
  return typeof valor === 'string' && (opciones as readonly string[]).includes(valor);
}

function leerLista<T>(valor: unknown, leer: (crudo: unknown) => T | null): T[] | null {
  if (!Array.isArray(valor)) return null;
  const lista: T[] = [];
  for (const crudo of valor as unknown[]) {
    const leido = leer(crudo);
    if (leido === null) return null;
    lista.push(leido);
  }
  return lista;
}

function leerMarca(valor: unknown): boolean | null {
  if (valor === undefined) return false;
  return typeof valor === 'boolean' ? valor : null;
}

function leerRenglon(valor: unknown): Renglon | null {
  if (!esObjeto(valor) || typeof valor.nombre !== 'string' || !esEntero(valor.monto)) return null;
  const crudo = valor.dia ?? null;
  const dia = crudo === null ? null : esEntero(crudo) ? crudo : undefined;
  if (dia === undefined) return null;
  return { nombre: valor.nombre, monto: centavos(valor.monto), dia };
}

function leerPaso(valor: unknown): PasoDeLaFila | null {
  if (
    !esObjeto(valor) ||
    !esId(valor.tesoro) ||
    !esUnoDe(CLASES_DE_PASO, valor.clase) ||
    !esEntero(valor.tope) ||
    !(valor.desde === null || typeof valor.desde === 'string')
  ) {
    return null;
  }
  const renglones = leerLista(valor.renglones, leerRenglon);
  const modo =
    valor.modo === undefined ? 'mes' : esUnoDe(MODOS_DE_PASO, valor.modo) ? valor.modo : null;
  const hastaLaMeta = leerMarca(valor.hastaLaMeta);
  if (renglones === null || modo === null || hastaLaMeta === null) return null;
  return {
    tesoro: valor.tesoro,
    clase: valor.clase,
    tope: centavos(valor.tope),
    renglones,
    desde: valor.desde,
    modo,
    hastaLaMeta,
  };
}

function leerParte(valor: unknown): ParteDelReparto | null {
  if (!esObjeto(valor) || !esId(valor.tesoro) || !esEntero(valor.porcentaje)) return null;
  const hastaLaMeta = leerMarca(valor.hastaLaMeta);
  if (hastaLaMeta === null) return null;
  return {
    tesoro: valor.tesoro,
    porcentaje: valor.porcentaje as PuntosBasicos,
    hastaLaMeta,
  };
}

function leerObligacion(valor: unknown): ObligacionDeLaFila | null {
  if (
    !esObjeto(valor) ||
    !esId(valor.tesoro) ||
    !esEntero(valor.porcentaje) ||
    !esUnoDe(BASES_DE_OBLIGACION, valor.base)
  ) {
    return null;
  }
  return {
    tesoro: valor.tesoro,
    porcentaje: valor.porcentaje as PuntosBasicos,
    base: valor.base,
  };
}

export function leerLaFila(
  valor: unknown,
  sistema: Pick<TesorosDelSistema, 'diezmo' | 'maun'>,
): Fila | null {
  if (!esObjeto(valor) || typeof valor.sueldoPorTrabajo !== 'boolean') return null;
  const obligaciones =
    valor.obligaciones === undefined
      ? [obligacionDelDiezmo(sistema.diezmo)]
      : leerLista(valor.obligaciones, leerObligacion);
  const pasos = leerLista(valor.pasos, leerPaso);
  const reparto = leerLista(valor.reparto, leerParte);
  const superavit =
    valor.superavit === undefined ? sistema.maun : esId(valor.superavit) ? valor.superavit : null;
  if (obligaciones === null || pasos === null || reparto === null || superavit === null) {
    return null;
  }
  return { obligaciones, pasos, reparto, superavit, sueldoPorTrabajo: valor.sueldoPorTrabajo };
}

function problemaDelTesoro(
  id: string,
  vistos: ReadonlySet<string>,
  porId: ReadonlyMap<string, TesoroDeLaFila>,
): ProblemaDeLaFila | null {
  const tesoro = porId.get(id);
  if (tesoro === undefined) return 'tesoro-desconocido';
  if (tesoro.archivado) return 'tesoro-archivado';
  if (!esDeLaMonedaDelTaller(tesoro)) return 'tesoro-en-otra-moneda';
  if (vistos.has(id)) return 'tesoro-repetido';
  return null;
}

export function esDeLaMonedaDelTaller(tesoro: Pick<TesoroDeLaFila, 'moneda'>): boolean {
  return (tesoro.moneda ?? MONEDA_DEL_TALLER) === MONEDA_DEL_TALLER;
}

function problemaDeLaObligacion(
  obligacion: ObligacionDeLaFila,
  tesoro: TesoroDeLaFila,
): ProblemaDeLaFila | null {
  if (tesoro.clave === 'hogar' || tesoro.clave === 'maun') return 'obligacion-en-hogar-o-maun';
  if (
    !Number.isInteger(obligacion.porcentaje) ||
    obligacion.porcentaje < 1 ||
    obligacion.porcentaje > BASE_PUNTOS_BASICOS ||
    !esUnoDe(BASES_DE_OBLIGACION, obligacion.base)
  ) {
    return 'obligacion-invalida';
  }
  return null;
}

function problemaDeLosRenglones(paso: PasoDeLaFila): ProblemaDeLaFila | null {
  if (paso.clase !== 'fijos') return paso.renglones.length > 0 ? 'renglones-en-otra-clase' : null;
  if (paso.renglones.length === 0) return 'fijos-sin-renglones';
  if (paso.renglones.length > TOPE_DE_RENGLONES) return 'demasiados-renglones';
  for (const renglon of paso.renglones) {
    if (renglon.nombre.replace(/^ +| +$/g, '') === '') return 'renglon-sin-nombre';
    if (Array.from(renglon.nombre).length > LARGO_MAXIMO_DEL_RENGLON) return 'renglon-largo';
    if (renglon.monto <= 0 || renglon.monto > MONTO_MAXIMO_DE_LA_FILA) {
      return 'renglon-fuera-de-rango';
    }
    if (renglon.dia !== null && !esDiaDePago(renglon.dia)) return 'dia-invalido';
  }
  if (sumaDeLosRenglones(paso.renglones) !== paso.tope) return 'tope-no-es-la-suma';
  return null;
}

function problemaDelPaso(
  paso: PasoDeLaFila,
  tesoro: TesoroDeLaFila,
  siguientes: readonly PasoDeLaFila[],
): ProblemaDeLaFila | null {
  if (tesoro.clave === 'diezmo') return 'diezmo-en-la-fila';
  if (tesoro.clave === 'hogar' && paso.clase !== 'sueldo') return 'hogar-no-es-sueldo';
  if (paso.clase === 'sueldo' && tesoro.clave !== 'hogar') return 'sueldo-no-es-hogar';
  if (tesoro.clave === 'maun' && paso.clase !== 'fijos') return 'maun-no-es-fijos';
  if (esNegativo(paso.tope) || paso.tope > MONTO_MAXIMO_DE_LA_FILA) return 'tope-fuera-de-rango';
  const deLosRenglones = problemaDeLosRenglones(paso);
  if (deLosRenglones !== null) return deLosRenglones;
  if (paso.desde !== null && !FORMATO_MES.test(paso.desde)) return 'desde-invalido';
  if (!modosPosibles(paso.clase, tesoro.clave).includes(paso.modo)) return 'modo-invalido';
  if (paso.hastaLaMeta && !admiteLaMeta(paso.clase)) return 'meta-fuera-de-ahorro';
  if (paso.hastaLaMeta && !tieneMeta(tesoro.meta)) return 'meta-sin-monto';
  if (!esCompromiso(paso) && siguientes.some(esCompromiso)) return 'ahorro-antes-de-compromiso';
  return null;
}

function problemaDeLaParte(
  parte: ParteDelReparto,
  tesoro: TesoroDeLaFila,
): ProblemaDeLaFila | null {
  if (tesoro.clave === 'diezmo') return 'diezmo-en-la-fila';
  if (tesoro.clave === 'maun') return 'maun-en-el-reparto';
  if (tesoro.clave === 'hogar') return 'hogar-en-el-reparto';
  if (
    !Number.isInteger(parte.porcentaje) ||
    parte.porcentaje < 1 ||
    parte.porcentaje > BASE_PUNTOS_BASICOS
  ) {
    return 'porcentaje-invalido';
  }
  if (parte.hastaLaMeta && !tieneMeta(tesoro.meta)) return 'meta-sin-monto';
  return null;
}

function problemaDelSuperavit(
  id: string,
  vistos: ReadonlySet<string>,
  porId: ReadonlyMap<string, TesoroDeLaFila>,
): ProblemaDeLaFila | null {
  const tesoro = porId.get(id);
  if (tesoro === undefined) return 'tesoro-desconocido';
  if (tesoro.archivado) return 'tesoro-archivado';
  if (!esDeLaMonedaDelTaller(tesoro)) return 'tesoro-en-otra-moneda';
  if (tesoro.clave === 'hogar' || tesoro.clave === 'diezmo') return 'superavit-invalido';
  if (tesoro.clave !== 'maun' && vistos.has(id)) return 'superavit-en-la-fila';
  return null;
}

export function problemasDeLaFila(
  fila: Fila,
  tesoros: readonly TesoroDeLaFila[],
): ProblemaEnLaFila[] {
  const problemas: ProblemaEnLaFila[] = [];
  const deLaFila = (problema: ProblemaDeLaFila) => {
    problemas.push({ problema, tesoro: null });
  };
  if (fila.obligaciones.length > TOPE_DE_OBLIGACIONES) deLaFila('demasiadas-obligaciones');
  if (fila.pasos.length > TOPE_DE_PASOS) deLaFila('demasiados-pasos');
  if (fila.reparto.length > TOPE_DE_PARTES) deLaFila('demasiadas-partes');

  const porId = new Map(tesoros.map((tesoro) => [tesoro.id, tesoro]));
  const vistos = new Set<string>();
  const revisar = (
    id: string,
    delLugar: (tesoro: TesoroDeLaFila) => ProblemaDeLaFila | null,
  ): void => {
    const problema =
      problemaDelTesoro(id, vistos, porId) ?? delLugar(porId.get(id) as TesoroDeLaFila);
    if (problema !== null) problemas.push({ problema, tesoro: id });
    vistos.add(id);
  };

  for (const obligacion of fila.obligaciones) {
    revisar(obligacion.tesoro, (tesoro) => problemaDeLaObligacion(obligacion, tesoro));
  }
  if (!fila.obligaciones.some((obligacion) => porId.get(obligacion.tesoro)?.clave === 'diezmo')) {
    deLaFila('sin-diezmo');
  }
  fila.pasos.forEach((paso, lugar) => {
    revisar(paso.tesoro, (tesoro) => problemaDelPaso(paso, tesoro, fila.pasos.slice(lugar + 1)));
  });
  for (const parte of fila.reparto) {
    revisar(parte.tesoro, (tesoro) => problemaDeLaParte(parte, tesoro));
  }
  if (sumaDelReparto(fila) > BASE_PUNTOS_BASICOS) deLaFila('reparto-pasa-de-cien');
  const delSuperavit = problemaDelSuperavit(fila.superavit, vistos, porId);
  if (delSuperavit !== null) problemas.push({ problema: delSuperavit, tesoro: fila.superavit });
  if (fila.sueldoPorTrabajo) deLaFila('sueldo-por-trabajo');
  return problemas;
}

function sistemaDeLosTesoros(
  tesoros: readonly TesoroDeLaFila[],
): Pick<TesorosDelSistema, 'diezmo' | 'maun'> {
  const idDe = (clave: 'diezmo' | 'maun') =>
    tesoros.find((tesoro) => tesoro.clave === clave)?.id ?? '';
  return { diezmo: idDe('diezmo'), maun: idDe('maun') };
}

export function primerProblemaDeLaFila(
  valor: unknown,
  tesoros: readonly TesoroDeLaFila[],
): ProblemaDeLaFila | null {
  const fila = leerLaFila(valor, sistemaDeLosTesoros(tesoros));
  if (fila === null) return 'forma-invalida';
  return problemasDeLaFila(fila, tesoros)[0]?.problema ?? null;
}

export function planDelReparto(
  destino: EstadoLiquidado,
  fila: Fila,
  ajustes: AjustesDelReparto,
  sistema: Pick<TesorosDelSistema, 'diezmo' | 'maun'>,
): PlanDelReparto {
  const perdido = destino === 'perdido';
  const delDiezmo = fila.obligaciones.findIndex(
    (obligacion) => obligacion.tesoro === sistema.diezmo,
  );
  return {
    obligaciones: fila.obligaciones.map((obligacion, lugar) => ({
      tesoro: obligacion.tesoro,
      porcentaje:
        lugar === delDiezmo && perdido && !ajustes.perdidoConDiezmo
          ? puntosBasicos(0)
          : obligacion.porcentaje,
      base: obligacion.base,
      diezmo: lugar === delDiezmo,
    })),
    pasos: fila.pasos.map((paso) => ({
      tesoro: paso.tesoro,
      clase: paso.clase,
      objetivo: perdido && paso.clase === 'sueldo' && !ajustes.perdidoConSueldo ? CERO : paso.tope,
      porMes: !(paso.clase === 'sueldo' && fila.sueldoPorTrabajo),
      modo: paso.modo,
      hastaLaMeta: paso.hastaLaMeta,
    })),
    reparto: fila.reparto.map((parte) => ({
      tesoro: parte.tesoro,
      porcentaje: parte.porcentaje,
      hastaLaMeta: parte.hastaLaMeta,
    })),
    superavit: fila.superavit === sistema.maun ? null : fila.superavit,
  };
}

export function planDeLaLiquidacion(reparto: Reparto): PlanDelReparto {
  return {
    obligaciones: reparto.obligaciones.map(({ tesoro, porcentaje, base, diezmo }) => ({
      tesoro,
      porcentaje,
      base,
      diezmo,
    })),
    pasos: reparto.pasos.map(({ tesoro, clase, objetivo, porMes, modo, hastaLaMeta }) => ({
      tesoro,
      clase,
      objetivo,
      porMes,
      modo,
      hastaLaMeta,
    })),
    reparto: reparto.reparto.map(({ tesoro, porcentaje, hastaLaMeta }) => ({
      tesoro,
      porcentaje,
      hastaLaMeta,
    })),
    superavit: reparto.superavit,
  };
}

function exigirTesorosUnicos(plan: PlanDelReparto): void {
  const vistos = new Set<string>();
  for (const tesoro of [
    ...plan.obligaciones.map((obligacion) => obligacion.tesoro),
    ...plan.pasos.map((paso) => paso.tesoro),
    ...plan.reparto.map((parte) => parte.tesoro),
  ]) {
    if (vistos.has(tesoro)) {
      throw new RangeError(`Un tesoro va una sola vez en la fila: ${tesoro} está repetido.`);
    }
    vistos.add(tesoro);
  }
}

function exigirLaEntrada(entrada: EntradaDelReparto): void {
  exigirNoNegativo('Lo cobrado', entrada.cobrado);
  exigirNoNegativo('Los gastos', entrada.gastos);
  let diezmos = 0;
  for (const obligacion of entrada.obligaciones) {
    puntosBasicos(obligacion.porcentaje);
    if (!esUnoDe(BASES_DE_OBLIGACION, obligacion.base)) {
      throw new RangeError('Una obligación se calcula sobre lo cobrado o sobre el ingreso.');
    }
    if (obligacion.diezmo) diezmos += 1;
  }
  if (diezmos > 1) throw new RangeError('La fila lleva un solo diezmo.');
  for (const paso of entrada.pasos) {
    exigirNoNegativo('El objetivo de un paso', paso.objetivo);
    exigirNoNegativo('Lo que un paso ya tiene', entrada.previo.get(paso.tesoro) ?? CERO);
  }
  for (const parte of entrada.reparto) {
    if (puntosBasicos(parte.porcentaje) === 0) {
      throw new RangeError('Una parte del reparto lleva un porcentaje mayor que cero.');
    }
    exigirNoNegativo('El tope de una parte', entrada.topes.get(parte.tesoro) ?? CERO);
  }
  if (sumaDelReparto(entrada) > BASE_PUNTOS_BASICOS) {
    throw new RangeError('El reparto no puede pasar del 100%.');
  }
  exigirTesorosUnicos(entrada);
}

export function repartir(entrada: EntradaDelReparto): Reparto {
  exigirLaEntrada(entrada);

  const neta = restar(entrada.cobrado, entrada.gastos);
  const positiva = neta > 0;
  let resto = positiva ? neta : CERO;

  const obligaciones: ObligacionRepartida[] = entrada.obligaciones.map((obligacion) => {
    const sobre = obligacion.base === 'cobrado' ? entrada.cobrado : resto;
    const llega = resto;
    const monto = positiva ? minimo(aplicarPorcentaje(sobre, obligacion.porcentaje), llega) : CERO;
    resto = restar(resto, monto);
    return { ...obligacion, sobre, llega, monto };
  });
  const libre = resto;

  let deLosCompromisos = CERO;
  const pasos: PasoRepartido[] = entrada.pasos.map((paso) => {
    const previo = entrada.previo.get(paso.tesoro) ?? CERO;
    const tope = paso.porMes ? maximo(CERO, restar(paso.objetivo, previo)) : paso.objetivo;
    const monto = minimo(tope, resto);
    resto = restar(resto, monto);
    if (esCompromiso(paso)) deLosCompromisos = sumar(deLosCompromisos, monto);
    return { ...paso, previo, tope, monto, falta: restar(tope, monto) };
  });

  const sobrante = resto;
  const reparto: ParteRepartida[] = entrada.reparto.map((parte) => {
    const leTocaba = porcentajeHaciaAbajo(sobrante, parte.porcentaje);
    const tope = entrada.topes.get(parte.tesoro) ?? null;
    const monto = tope === null ? leTocaba : minimo(leTocaba, tope);
    resto = restar(resto, monto);
    return { ...parte, tope, leTocaba, monto, llegaALaMeta: tope !== null && leTocaba >= tope };
  });

  const diezmo = obligaciones.find((obligacion) => obligacion.diezmo);
  return {
    cobrado: entrada.cobrado,
    gastos: entrada.gastos,
    neta,
    obligaciones,
    diezmoBp: diezmo?.porcentaje ?? puntosBasicos(0),
    diezmo: diezmo?.monto ?? CERO,
    libre,
    pasos,
    ganancia: restar(libre, deLosCompromisos),
    sobrante,
    reparto,
    superavit: entrada.superavit,
    remanente: positiva ? resto : neta,
  };
}

export function loDelMes(
  liquidaciones: readonly LiquidacionDelMes[],
  coberturas: readonly Cobertura[],
  mes: string,
): Map<string, Money> {
  exigirMes(mes);
  const delMes = new Map<string, Money>();
  const sumarAl = (tesoro: string, monto: Money) => {
    delMes.set(tesoro, sumar(delMes.get(tesoro) ?? CERO, monto));
  };
  for (const liquidacion of liquidaciones) {
    if (mesDe(liquidacion.fecha) !== mes) continue;
    for (const aporte of liquidacion.aportes) sumarAl(aporte.tesoro, aporte.monto);
  }
  for (const cobertura of coberturas) {
    exigirMes(cobertura.mes);
    if (cobertura.mes === mes) sumarAl(cobertura.tesoro, cobertura.monto);
  }
  return delMes;
}

function llevaSegunElModo(
  paso: Pick<PasoDelPlan, 'tesoro' | 'modo'>,
  delMes: ReadonlyMap<string, Money>,
  saldos: ReadonlyMap<string, Money>,
): Money {
  if (paso.modo === 'saldo') return maximo(CERO, saldos.get(paso.tesoro) ?? CERO);
  if (paso.modo === 'trabajo') return CERO;
  return delMes.get(paso.tesoro) ?? CERO;
}

function faltaParaLaMeta(
  tesoro: string,
  hastaLaMeta: boolean,
  saldos: ReadonlyMap<string, Money>,
  metas: ReadonlyMap<string, Money>,
): Money | null {
  const meta = metas.get(tesoro);
  if (!hastaLaMeta || !tieneMeta(meta)) return null;
  return maximo(CERO, restar(meta, saldos.get(tesoro) ?? CERO));
}

export function previoDelMes(
  plan: Pick<PlanDelReparto, 'pasos' | 'reparto'>,
  delMes: ReadonlyMap<string, Money>,
  saldos: ReadonlyMap<string, Money>,
  metas: ReadonlyMap<string, Money>,
): PrevioDelReparto {
  const previo = new Map<string, Money>();
  for (const paso of plan.pasos) {
    const lleva = llevaSegunElModo(paso, delMes, saldos);
    const falta = faltaParaLaMeta(paso.tesoro, paso.hastaLaMeta, saldos, metas);
    previo.set(paso.tesoro, falta === null ? lleva : maximo(lleva, restar(paso.objetivo, falta)));
  }
  const topes = new Map<string, Money>();
  for (const parte of plan.reparto) {
    const falta = faltaParaLaMeta(parte.tesoro, parte.hastaLaMeta, saldos, metas);
    if (falta !== null) topes.set(parte.tesoro, falta);
  }
  return { previo, topes };
}

export function calcularPorLaFila(entrada: EntradaDeLaLiquidacion): LiquidacionPorLaFila {
  const plan = planDelReparto(entrada.destino, entrada.fila, entrada.ajustes, entrada.sistema);
  const delMes = loDelMes(entrada.liquidaciones, entrada.coberturas, mesDe(entrada.fecha));
  const reparto = repartir({
    ...plan,
    ...previoDelMes(plan, delMes, entrada.saldos, entrada.metas),
    cobrado: entrada.cobrado,
    gastos: entrada.gastos,
  });
  return {
    ...reparto,
    destino: entrada.destino,
    fecha: entrada.fecha,
    pasos: reparto.pasos.map((paso) => {
      const falta = faltaParaLaMeta(paso.tesoro, paso.hastaLaMeta, entrada.saldos, entrada.metas);
      return {
        ...paso,
        lleva: llevaSegunElModo(paso, delMes, entrada.saldos),
        faltaParaLaMeta: falta,
        llegaALaMeta: falta !== null && paso.monto === falta,
      };
    }),
  };
}

export function repartosDelCobro(reparto: Reparto): RepartoDelCobro[] {
  const filas: RepartoDelCobro[] = [];
  for (const obligacion of reparto.obligaciones) {
    if (obligacion.diezmo) continue;
    filas.push({
      tipo: 'obligacion',
      tesoro: obligacion.tesoro,
      porcentaje: obligacion.porcentaje,
      base: obligacion.base,
      monto: obligacion.monto,
    });
  }
  for (const paso of reparto.pasos) {
    filas.push({
      tipo: 'paso',
      tesoro: paso.tesoro,
      clase: paso.clase,
      modo: paso.modo,
      objetivo: paso.objetivo,
      previo: paso.previo,
      tope: paso.tope,
      porMes: paso.porMes,
      monto: paso.monto,
    });
  }
  for (const parte of reparto.reparto) {
    filas.push({
      tipo: 'parte',
      tesoro: parte.tesoro,
      porcentaje: parte.porcentaje,
      tope: parte.tope,
      monto: parte.monto,
    });
  }
  if (reparto.superavit !== null) {
    filas.push({
      tipo: 'superavit',
      tesoro: reparto.superavit,
      monto: maximo(CERO, reparto.remanente),
    });
  }
  return filas;
}

export function aportesDelReparto(reparto: Reparto): AporteDelMes[] {
  return repartosDelCobro(reparto).map(({ tesoro, monto }) => ({ tesoro, monto }));
}

export function previoQueVio(reparto: Pick<Reparto, 'pasos' | 'reparto'>): Record<string, Money> {
  const visto: Record<string, Money> = {};
  for (const paso of reparto.pasos) visto[paso.tesoro] = paso.previo;
  for (const parte of reparto.reparto) {
    if (parte.tope !== null) visto[parte.tesoro] = parte.tope;
  }
  return visto;
}

export function previoDeLoVisto(
  plan: Pick<PlanDelReparto, 'pasos' | 'reparto'>,
  visto: unknown,
): PrevioDelReparto {
  const valores: Record<string, unknown> = esObjeto(visto) ? visto : {};
  const numero = (tesoro: string): Money | null => {
    const valor = valores[tesoro];
    return esEntero(valor) ? centavos(valor) : null;
  };
  const topes = new Map<string, Money>();
  for (const parte of plan.reparto) {
    const tope = numero(parte.tesoro);
    if (tope !== null) topes.set(parte.tesoro, tope);
  }
  return {
    previo: new Map(plan.pasos.map((paso) => [paso.tesoro, numero(paso.tesoro) ?? CERO])),
    topes,
  };
}

export function loVistoEsOtro(
  plan: Pick<PlanDelReparto, 'pasos' | 'reparto'>,
  visto: unknown,
  base: unknown,
): boolean {
  if (visto === null || visto === undefined) return false;
  const deLaApp = previoDeLoVisto(plan, visto);
  const deLaBase = previoDeLoVisto(plan, base);
  return (
    plan.pasos.some(
      (paso) => deLaApp.previo.get(paso.tesoro) !== deLaBase.previo.get(paso.tesoro),
    ) ||
    plan.reparto.some(
      (parte) => deLaApp.topes.get(parte.tesoro) !== deLaBase.topes.get(parte.tesoro),
    )
  );
}

export function columnasDeSiempre(reparto: Reparto): ColumnasDeSiempre {
  return {
    diezmoBp: reparto.diezmoBp,
    diezmo: reparto.diezmo,
    topeSueldo: CERO,
    topeFijos: CERO,
    sueldo: CERO,
    fijos: CERO,
    remanente: restar(reparto.neta, reparto.diezmo),
    objetivoSueldo: CERO,
    objetivoFijos: CERO,
    sueldoMensual: true,
    sueldoPrevio: CERO,
    fijosPrevio: CERO,
  };
}

function sePagoElRenglon(
  tesoro: string,
  nombre: string,
  mes: string,
  gastos: readonly GastoDeUnTesoro[],
): boolean {
  const clave = claveDelNombre(nombre);
  return gastos.some(
    (gasto) =>
      gasto.tesoro === tesoro &&
      mesDe(gasto.fecha) === mes &&
      claveDelNombre(gasto.categoria) === clave,
  );
}

export function vencimientosDelPaso(
  paso: Pick<PasoDeLaFila, 'tesoro' | 'renglones'>,
  mes: string,
  gastos: readonly GastoDeUnTesoro[],
): VencimientoDelMes[] {
  const vencimientos: VencimientoDelMes[] = [];
  paso.renglones.forEach((renglon, indice) => {
    if (renglon.dia === null || !esDiaDePago(renglon.dia)) return;
    vencimientos.push({
      indice,
      renglon: renglon.nombre,
      monto: renglon.monto,
      dia: renglon.dia,
      fecha: diaDelMes(mes, renglon.dia),
      pagado: sePagoElRenglon(paso.tesoro, renglon.nombre, mes, gastos),
    });
  });
  return vencimientos;
}

function metaDelAhorro(
  tesoro: string,
  hastaLaMeta: boolean,
  datos: DatosDelMes,
): MetaDelMes | null {
  const meta = datos.metas.get(tesoro);
  if (!tieneMeta(meta)) return null;
  const saldo = datos.saldos.get(tesoro) ?? CERO;
  const falta = maximo(CERO, restar(meta, saldo));
  return { meta, saldo, falta, hastaLaMeta, llego: falta === 0 };
}

export function filaDelMes(
  fila: Fila,
  sistema: TesorosDelSistema,
  datos: DatosDelMes,
  mes: string,
): FilaDelMes {
  const delMes = datos.liquidaciones.filter((liquidacion) => mesDe(liquidacion.fecha) === mes);
  const recibido = loDelMes(delMes, [], mes);
  const cubierto = loDelMes([], datos.coberturas, mes);
  const todo = loDelMes(delMes, datos.coberturas, mes);

  let ingreso = CERO;
  let diezmo = CERO;
  let enElTaller = CERO;
  for (const liquidacion of delMes) {
    ingreso = sumar(ingreso, liquidacion.neta);
    diezmo = sumar(diezmo, liquidacion.diezmo);
    enElTaller = sumar(enElTaller, liquidacion.remanente);
  }

  const recibidoDe = (tesoro: string) => recibido.get(tesoro) ?? CERO;
  const aPagarDe = (tesoro: string) => maximo(CERO, datos.saldos.get(tesoro) ?? CERO);

  const obligaciones: ObligacionDelMes[] = fila.obligaciones.map((obligacion) => {
    const delDiezmo = obligacion.tesoro === sistema.diezmo;
    return {
      tesoro: obligacion.tesoro,
      porcentaje: obligacion.porcentaje,
      base: obligacion.base,
      diezmo: delDiezmo,
      apartado: delDiezmo ? diezmo : recibidoDe(obligacion.tesoro),
      aPagar: aPagarDe(obligacion.tesoro),
    };
  });

  const pasos: PasoDelMes[] = fila.pasos.map((paso) => {
    const compromiso = esCompromiso(paso);
    const lleva = llevaSegunElModo(paso, todo, datos.saldos);
    const meta = compromiso ? null : metaDelAhorro(paso.tesoro, paso.hastaLaMeta, datos);
    const segunElModo = paso.modo === 'trabajo' ? null : maximo(CERO, restar(paso.tope, lleva));
    const falta =
      segunElModo !== null && meta !== null && meta.hastaLaMeta
        ? minimo(segunElModo, meta.falta)
        : segunElModo;
    const conDeuda = compromiso && paso.tesoro !== sistema.hogar && paso.tesoro !== sistema.maun;
    return {
      tesoro: paso.tesoro,
      clase: paso.clase,
      tipo: tipoDelPaso(paso.clase),
      modo: paso.modo,
      objetivo: paso.tope,
      recibido: recibidoDe(paso.tesoro),
      cubierto: cubierto.get(paso.tesoro) ?? CERO,
      lleva,
      falta,
      completo: falta === 0,
      aPagar: conDeuda ? aPagarDe(paso.tesoro) : null,
      vencimientos: vencimientosDelPaso(paso, mes, datos.gastos),
      meta,
    };
  });

  const reparto: ParteDelMes[] = fila.reparto.map((parte) => ({
    tesoro: parte.tesoro,
    porcentaje: parte.porcentaje,
    hastaLaMeta: parte.hastaLaMeta,
    recibido: recibidoDe(parte.tesoro),
    meta: metaDelAhorro(parte.tesoro, parte.hastaLaMeta, datos),
  }));

  return {
    mes,
    cobros: delMes.length,
    ingreso,
    diezmo,
    apartado: sumarTodos(obligaciones.map((obligacion) => obligacion.apartado)),
    obligaciones,
    pasos,
    reparto,
    superavit: {
      tesoro: fila.superavit,
      recibido: fila.superavit === sistema.maun ? enElTaller : recibidoDe(fila.superavit),
    },
    enElTaller,
    repartoEmpezo: reparto.some((parte) => parte.recibido > 0),
  };
}

function exigirPosicion(posicion: number, largo: number): void {
  if (!Number.isInteger(posicion) || posicion < 0 || posicion > largo) {
    throw new RangeError(`La posición ${String(posicion)} no está en la fila.`);
  }
}

function sinElTesoro(fila: Fila, tesoro: string): Fila {
  return {
    ...fila,
    obligaciones: fila.obligaciones.filter((obligacion) => obligacion.tesoro !== tesoro),
    pasos: fila.pasos.filter((paso) => paso.tesoro !== tesoro),
    reparto: fila.reparto.filter((parte) => parte.tesoro !== tesoro),
  };
}

function enOrdenDeTipos(pasos: readonly PasoDeLaFila[]): PasoDeLaFila[] {
  return [...pasos.filter(esCompromiso), ...pasos.filter((paso) => !esCompromiso(paso))];
}

function exigirPaso(fila: Fila, tesoro: string): PasoDeLaFila {
  const paso = fila.pasos.find((candidato) => candidato.tesoro === tesoro);
  if (paso === undefined) {
    throw new RangeError(`El tesoro ${tesoro} no es un paso de la fila.`);
  }
  return paso;
}

export function ponerObligacion(
  fila: Fila,
  obligacion: ObligacionDeLaFila,
  posicion: number,
): Fila {
  const sin = sinElTesoro(fila, obligacion.tesoro);
  exigirPosicion(posicion, sin.obligaciones.length);
  return {
    ...sin,
    obligaciones: [
      ...sin.obligaciones.slice(0, posicion),
      obligacion,
      ...sin.obligaciones.slice(posicion),
    ],
  };
}

export function moverObligacion(fila: Fila, tesoro: string, posicion: number): Fila {
  const obligacion = fila.obligaciones.find((candidata) => candidata.tesoro === tesoro);
  if (obligacion === undefined) {
    throw new RangeError(`El tesoro ${tesoro} no es una obligación de la fila.`);
  }
  return ponerObligacion(fila, obligacion, posicion);
}

export function cambiarLaObligacion(
  fila: Fila,
  tesoro: string,
  cambio: Partial<Pick<ObligacionDeLaFila, 'porcentaje' | 'base'>>,
): Fila {
  if (!fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) {
    throw new RangeError(`El tesoro ${tesoro} no es una obligación de la fila.`);
  }
  return {
    ...fila,
    obligaciones: fila.obligaciones.map((obligacion) =>
      obligacion.tesoro === tesoro ? { ...obligacion, ...cambio } : obligacion,
    ),
  };
}

export function ponerPaso(fila: Fila, paso: PasoDeLaFila, posicion: number): Fila {
  const sin = sinElTesoro(fila, paso.tesoro);
  exigirPosicion(posicion, sin.pasos.length);
  return {
    ...sin,
    pasos: enOrdenDeTipos([...sin.pasos.slice(0, posicion), paso, ...sin.pasos.slice(posicion)]),
  };
}

export function moverPaso(fila: Fila, tesoro: string, posicion: number): Fila {
  return ponerPaso(fila, exigirPaso(fila, tesoro), posicion);
}

export function ponerDespues(fila: Fila, antes: string | null, paso: PasoDeLaFila): Fila {
  const sin = sinElTesoro(fila, paso.tesoro);
  if (antes === null) return ponerPaso(sin, paso, 0);
  const lugar = sin.pasos.findIndex((candidato) => candidato.tesoro === antes);
  if (lugar === -1) {
    throw new RangeError(`El tesoro ${antes} no es un paso de la fila.`);
  }
  return ponerPaso(sin, paso, lugar + 1);
}

export function cambiarElPaso(
  fila: Fila,
  tesoro: string,
  cambio: Partial<Pick<PasoDeLaFila, 'tope' | 'renglones' | 'desde' | 'modo' | 'hastaLaMeta'>>,
): Fila {
  exigirPaso(fila, tesoro);
  const pasos = fila.pasos.map((paso) => {
    if (paso.tesoro !== tesoro) return paso;
    const renglones = cambio.renglones ?? paso.renglones;
    const tope =
      paso.clase === 'fijos' && cambio.renglones !== undefined
        ? sumaDeLosRenglones(renglones)
        : (cambio.tope ?? paso.tope);
    return { ...paso, ...cambio, renglones, tope };
  });
  return { ...fila, pasos };
}

export function cambiarLaClase(
  fila: Fila,
  tesoro: string,
  clase: ClaseDePaso,
  renglones: readonly Renglon[] = [],
): Fila {
  const paso = exigirPaso(fila, tesoro);
  if (paso.clase === clase) return fila;
  const cambiado: PasoDeLaFila = {
    ...paso,
    clase,
    renglones: clase === 'fijos' ? renglones : [],
    tope: clase === 'fijos' ? sumaDeLosRenglones(renglones) : paso.tope,
    modo: MODOS_DE_LA_CLASE[clase].includes(paso.modo) ? paso.modo : modoInicial(clase, null),
    hastaLaMeta: paso.hastaLaMeta && admiteLaMeta(clase),
  };
  return {
    ...fila,
    pasos: enOrdenDeTipos(
      fila.pasos.map((candidato) => (candidato.tesoro === tesoro ? cambiado : candidato)),
    ),
  };
}

export function ponerEnElReparto(
  fila: Fila,
  tesoro: string,
  porcentaje: PuntosBasicos,
  hastaLaMeta?: boolean,
): Fila {
  const sin = sinElTesoro(fila, tesoro);
  const actual = fila.reparto.findIndex((parte) => parte.tesoro === tesoro);
  const parte = {
    tesoro,
    porcentaje,
    hastaLaMeta: hastaLaMeta ?? fila.reparto[actual]?.hastaLaMeta ?? false,
  };
  const reparto =
    actual === -1
      ? [...sin.reparto, parte]
      : [...sin.reparto.slice(0, actual), parte, ...sin.reparto.slice(actual)];
  return { ...sin, reparto };
}

export function cambiarLaParte(
  fila: Fila,
  tesoro: string,
  cambio: Partial<Pick<ParteDelReparto, 'porcentaje' | 'hastaLaMeta'>>,
): Fila {
  if (!fila.reparto.some((parte) => parte.tesoro === tesoro)) {
    throw new RangeError(`El tesoro ${tesoro} no está en el reparto.`);
  }
  return {
    ...fila,
    reparto: fila.reparto.map((parte) =>
      parte.tesoro === tesoro ? { ...parte, ...cambio } : parte,
    ),
  };
}

export function ponerElSuperavit(fila: Fila, tesoro: string): Fila {
  return { ...fila, superavit: tesoro };
}

export function sacarDeLaFila(fila: Fila, tesoro: string): Fila {
  return sinElTesoro(fila, tesoro);
}

export function conDesde(antes: Fila, despues: Fila, mes: string): Fila {
  exigirMes(mes);
  const previos = new Map(antes.pasos.map((paso) => [paso.tesoro, paso]));
  return {
    ...despues,
    pasos: despues.pasos.map((paso) => {
      const previo = previos.get(paso.tesoro);
      const mismoTope = previo !== undefined && previo.tope === paso.tope;
      return { ...paso, desde: mismoTope ? previo.desde : mes };
    }),
  };
}

interface LugarDelCambio<T> {
  actual: T;
  posicion: number;
  previo: { elemento: T; posicion: number } | undefined;
  seMovio: boolean;
}

function lugaresDelCambio<T extends { tesoro: string }>(
  antes: readonly T[],
  despues: readonly T[],
): { salen: string[]; lugares: LugarDelCambio<T>[] } {
  const previos = new Map(
    antes.map((elemento, posicion) => [elemento.tesoro, { elemento, posicion }]),
  );
  const siguen = new Set(despues.map((elemento) => elemento.tesoro));
  const quedan = despues.filter((elemento) => previos.has(elemento.tesoro));
  const ordenAntes = antes.filter((elemento) => siguen.has(elemento.tesoro));
  return {
    salen: antes
      .filter((elemento) => !siguen.has(elemento.tesoro))
      .map((elemento) => elemento.tesoro),
    lugares: despues.map((actual, posicion) => ({
      actual,
      posicion,
      previo: previos.get(actual.tesoro),
      seMovio:
        ordenAntes.findIndex((otro) => otro.tesoro === actual.tesoro) !==
        quedan.findIndex((otro) => otro.tesoro === actual.tesoro),
    })),
  };
}

function mismosRenglones(a: readonly Renglon[], b: readonly Renglon[]): boolean {
  return (
    a.length === b.length &&
    a.every((renglon, i) => {
      const otro = b[i];
      return otro !== undefined && renglon.nombre === otro.nombre && renglon.monto === otro.monto;
    })
  );
}

function diasDeLosRenglones(renglones: readonly Renglon[]): string {
  return JSON.stringify(
    renglones
      .filter((renglon) => renglon.dia !== null)
      .map((renglon) => [renglon.nombre, renglon.dia]),
  );
}

function cambiosDeLasObligaciones(antes: Fila, despues: Fila, cambios: CambioDeLaFila[]): void {
  const { salen, lugares } = lugaresDelCambio(antes.obligaciones, despues.obligaciones);
  for (const tesoro of salen) cambios.push({ tipo: 'sale-de-las-obligaciones', tesoro });
  for (const { actual, posicion, previo, seMovio } of lugares) {
    if (previo === undefined) {
      cambios.push({
        tipo: 'entra-a-las-obligaciones',
        tesoro: actual.tesoro,
        posicion,
        porcentaje: actual.porcentaje,
        base: actual.base,
      });
      continue;
    }
    if (seMovio) {
      cambios.push({
        tipo: 'cambia-de-lugar-la-obligacion',
        tesoro: actual.tesoro,
        antes: previo.posicion,
        despues: posicion,
      });
    }
    if (previo.elemento.porcentaje !== actual.porcentaje) {
      cambios.push({
        tipo: 'cambia-el-porcentaje-de-la-obligacion',
        tesoro: actual.tesoro,
        antes: previo.elemento.porcentaje,
        despues: actual.porcentaje,
      });
    }
    if (previo.elemento.base !== actual.base) {
      cambios.push({
        tipo: 'cambia-la-base',
        tesoro: actual.tesoro,
        antes: previo.elemento.base,
        despues: actual.base,
      });
    }
  }
}

function cambiosDelPaso(
  antes: PasoDeLaFila,
  despues: PasoDeLaFila,
  cambios: CambioDeLaFila[],
): void {
  const tesoro = despues.tesoro;
  if (antes.clase !== despues.clase) {
    cambios.push({ tipo: 'cambia-la-clase', tesoro, antes: antes.clase, despues: despues.clase });
  }
  if (antes.tope !== despues.tope) {
    cambios.push({ tipo: 'cambia-el-tope', tesoro, antes: antes.tope, despues: despues.tope });
  } else if (!mismosRenglones(antes.renglones, despues.renglones)) {
    cambios.push({ tipo: 'cambian-los-renglones', tesoro });
  }
  if (diasDeLosRenglones(antes.renglones) !== diasDeLosRenglones(despues.renglones)) {
    cambios.push({ tipo: 'cambian-los-dias', tesoro });
  }
  if (antes.modo !== despues.modo) {
    cambios.push({ tipo: 'cambia-el-modo', tesoro, antes: antes.modo, despues: despues.modo });
  }
  if (antes.hastaLaMeta !== despues.hastaLaMeta) {
    cambios.push({ tipo: 'cambia-la-meta', tesoro, hastaLaMeta: despues.hastaLaMeta });
  }
}

function cambiosDeLosPasos(antes: Fila, despues: Fila, cambios: CambioDeLaFila[]): void {
  const { salen, lugares } = lugaresDelCambio(antes.pasos, despues.pasos);
  for (const tesoro of salen) cambios.push({ tipo: 'sale-de-la-fila', tesoro });
  for (const { actual, posicion, previo, seMovio } of lugares) {
    if (previo === undefined) {
      cambios.push({
        tipo: 'entra-a-la-fila',
        tesoro: actual.tesoro,
        posicion,
        clase: actual.clase,
        tope: actual.tope,
        modo: actual.modo,
        hastaLaMeta: actual.hastaLaMeta,
      });
      continue;
    }
    if (seMovio) {
      cambios.push({
        tipo: 'cambia-de-lugar',
        tesoro: actual.tesoro,
        antes: previo.posicion,
        despues: posicion,
      });
    }
    cambiosDelPaso(previo.elemento, actual, cambios);
  }
}

function cambiosDelReparto(antes: Fila, despues: Fila, cambios: CambioDeLaFila[]): void {
  const partesAntes = new Map(antes.reparto.map((parte) => [parte.tesoro, parte]));
  const siguen = new Set(despues.reparto.map((parte) => parte.tesoro));
  for (const parte of antes.reparto) {
    if (!siguen.has(parte.tesoro)) cambios.push({ tipo: 'sale-del-reparto', tesoro: parte.tesoro });
  }
  for (const parte of despues.reparto) {
    const previa = partesAntes.get(parte.tesoro);
    if (previa === undefined) {
      cambios.push({
        tipo: 'entra-al-reparto',
        tesoro: parte.tesoro,
        porcentaje: parte.porcentaje,
        hastaLaMeta: parte.hastaLaMeta,
      });
      continue;
    }
    if (previa.porcentaje !== parte.porcentaje) {
      cambios.push({
        tipo: 'cambia-el-porcentaje',
        tesoro: parte.tesoro,
        antes: previa.porcentaje,
        despues: parte.porcentaje,
      });
    }
    if (previa.hastaLaMeta !== parte.hastaLaMeta) {
      cambios.push({
        tipo: 'cambia-la-meta',
        tesoro: parte.tesoro,
        hastaLaMeta: parte.hastaLaMeta,
      });
    }
  }
}

export function cambiosDeLaFila(antes: Fila, despues: Fila): CambioDeLaFila[] {
  const cambios: CambioDeLaFila[] = [];
  cambiosDeLasObligaciones(antes, despues, cambios);
  cambiosDeLosPasos(antes, despues, cambios);
  cambiosDelReparto(antes, despues, cambios);
  if (antes.superavit !== despues.superavit) {
    cambios.push({
      tipo: 'cambia-el-superavit',
      tesoro: despues.superavit,
      antes: antes.superavit,
    });
  }
  return cambios;
}
