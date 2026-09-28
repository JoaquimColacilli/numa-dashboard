import { DIEZMO } from './cascada.ts';
import type { EstadoLiquidado } from './estados.ts';
import { mesDe } from './fechas.ts';
import {
  aplicarPorcentaje,
  BASE_PUNTOS_BASICOS,
  CERO,
  centavos,
  esNegativo,
  maximo,
  minimo,
  puntosBasicos,
  restar,
  sumar,
  type Money,
  type PuntosBasicos,
} from './money.ts';

export const CLASES_DE_PASO = ['sueldo', 'fijos', 'prioridad'] as const;

export type ClaseDePaso = (typeof CLASES_DE_PASO)[number];

export const TOPE_DE_PASOS = 12;
export const TOPE_DE_PARTES = 8;
export const TOPE_DE_RENGLONES = 12;
export const LARGO_MAXIMO_DEL_RENGLON = 40;
export const MONTO_MAXIMO_DE_LA_FILA: Money = centavos(1_000_000_000_000);

export interface Renglon {
  nombre: string;
  monto: Money;
}

export interface PasoDeLaFila {
  tesoro: string;
  clase: ClaseDePaso;
  tope: Money;
  renglones: readonly Renglon[];
  desde: string | null;
}

export interface ParteDelReparto {
  tesoro: string;
  porcentaje: PuntosBasicos;
}

export interface Fila {
  pasos: readonly PasoDeLaFila[];
  reparto: readonly ParteDelReparto[];
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

export interface PasoDelPlan {
  tesoro: string;
  clase: ClaseDePaso;
  objetivo: Money;
  porMes: boolean;
}

export interface PlanDelReparto {
  diezmoBp: PuntosBasicos;
  pasos: readonly PasoDelPlan[];
  reparto: readonly ParteDelReparto[];
}

export interface EntradaDelReparto extends PlanDelReparto {
  cobrado: Money;
  gastos: Money;
  previo: ReadonlyMap<string, Money>;
}

export interface PasoRepartido extends PasoDelPlan {
  previo: Money;
  tope: Money;
  monto: Money;
  falta: Money;
}

export interface ParteRepartida extends ParteDelReparto {
  monto: Money;
}

export interface Reparto {
  cobrado: Money;
  gastos: Money;
  diezmoBp: PuntosBasicos;
  neta: Money;
  diezmo: Money;
  pasos: readonly PasoRepartido[];
  sobrante: Money;
  reparto: readonly ParteRepartida[];
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

export interface EntradaDeLaLiquidacion {
  destino: EstadoLiquidado;
  fecha: string;
  cobrado: Money;
  gastos: Money;
  fila: Fila;
  ajustes: AjustesDelReparto;
  liquidaciones: readonly LiquidacionDelMes[];
  coberturas: readonly Cobertura[];
}

export interface LiquidacionPorLaFila extends Reparto {
  destino: EstadoLiquidado;
  fecha: string;
  previoDelMes: ReadonlyMap<string, Money>;
}

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

export interface PasoDelMes {
  tesoro: string;
  clase: ClaseDePaso;
  objetivo: Money;
  recibido: Money;
  cubierto: Money;
  falta: Money;
  completo: boolean;
}

export interface ParteDelMes {
  tesoro: string;
  porcentaje: PuntosBasicos;
  recibido: Money;
}

export interface FilaDelMes {
  mes: string;
  cobros: number;
  ganancia: Money;
  diezmo: Money;
  pasos: readonly PasoDelMes[];
  reparto: readonly ParteDelMes[];
  enElTaller: Money;
  repartoEmpezo: boolean;
}

export type ProblemaDeLaFila =
  | 'forma-invalida'
  | 'demasiados-pasos'
  | 'demasiadas-partes'
  | 'tesoro-desconocido'
  | 'tesoro-archivado'
  | 'tesoro-repetido'
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
  | 'tope-no-es-la-suma'
  | 'desde-invalido'
  | 'maun-en-el-reparto'
  | 'hogar-en-el-reparto'
  | 'porcentaje-invalido'
  | 'reparto-pasa-de-cien'
  | 'sueldo-por-trabajo';

export interface ProblemaEnLaFila {
  problema: ProblemaDeLaFila;
  tesoro: string | null;
}

export type CambioDeLaFila =
  | { tipo: 'entra-a-la-fila'; tesoro: string; posicion: number; tope: Money }
  | { tipo: 'sale-de-la-fila'; tesoro: string }
  | { tipo: 'cambia-de-lugar'; tesoro: string; antes: number; despues: number }
  | { tipo: 'cambia-el-tope'; tesoro: string; antes: Money; despues: Money }
  | { tipo: 'cambian-los-renglones'; tesoro: string }
  | { tipo: 'entra-al-reparto'; tesoro: string; porcentaje: PuntosBasicos }
  | { tipo: 'sale-del-reparto'; tesoro: string }
  | {
      tipo: 'cambia-el-porcentaje';
      tesoro: string;
      antes: PuntosBasicos;
      despues: PuntosBasicos;
    };

export const FILA_VACIA: Fila = { pasos: [], reparto: [], sueldoPorTrabajo: false };

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

export function sumaDelReparto(fila: Pick<Fila, 'reparto'>): number {
  let suma = 0;
  for (const parte of fila.reparto) suma += parte.porcentaje;
  return suma;
}

export function lugarLibreDelReparto(fila: Pick<Fila, 'reparto'>): PuntosBasicos {
  return puntosBasicos(Math.max(0, BASE_PUNTOS_BASICOS - sumaDelReparto(fila)));
}

export function tesorosDeLaFila(fila: Fila): string[] {
  return [...fila.pasos.map((paso) => paso.tesoro), ...fila.reparto.map((parte) => parte.tesoro)];
}

export function filaDeSiempre(
  ajustes: AjustesDeSiempre,
  sistema: Pick<TesorosDelSistema, 'hogar' | 'maun'>,
): Fila {
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
    });
  }
  if (ajustes.costosFijos > 0) {
    pasos.push({
      tesoro: sistema.maun,
      clase: 'fijos',
      tope: ajustes.costosFijos,
      renglones: [{ nombre: 'Costos fijos', monto: ajustes.costosFijos }],
      desde: null,
    });
  }

  return { pasos, reparto: [], sueldoPorTrabajo: !ajustes.sueldoTopeMensual };
}

function esEntero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerRenglon(valor: unknown): Renglon | null {
  if (!esObjeto(valor) || typeof valor.nombre !== 'string' || !esEntero(valor.monto)) return null;
  return { nombre: valor.nombre, monto: centavos(valor.monto) };
}

function leerPaso(valor: unknown): PasoDeLaFila | null {
  if (
    !esObjeto(valor) ||
    typeof valor.tesoro !== 'string' ||
    !FORMATO_ID.test(valor.tesoro) ||
    typeof valor.clase !== 'string' ||
    !(CLASES_DE_PASO as readonly string[]).includes(valor.clase) ||
    !esEntero(valor.tope) ||
    !Array.isArray(valor.renglones) ||
    !(valor.desde === null || typeof valor.desde === 'string')
  ) {
    return null;
  }
  const renglones: Renglon[] = [];
  for (const crudo of valor.renglones as unknown[]) {
    const renglon = leerRenglon(crudo);
    if (renglon === null) return null;
    renglones.push(renglon);
  }
  return {
    tesoro: valor.tesoro,
    clase: valor.clase as ClaseDePaso,
    tope: centavos(valor.tope),
    renglones,
    desde: valor.desde,
  };
}

function leerParte(valor: unknown): ParteDelReparto | null {
  if (
    !esObjeto(valor) ||
    typeof valor.tesoro !== 'string' ||
    !FORMATO_ID.test(valor.tesoro) ||
    !esEntero(valor.porcentaje)
  ) {
    return null;
  }
  return { tesoro: valor.tesoro, porcentaje: valor.porcentaje as PuntosBasicos };
}

export function leerLaFila(valor: unknown): Fila | null {
  if (
    !esObjeto(valor) ||
    !Array.isArray(valor.pasos) ||
    !Array.isArray(valor.reparto) ||
    typeof valor.sueldoPorTrabajo !== 'boolean'
  ) {
    return null;
  }
  const pasos: PasoDeLaFila[] = [];
  for (const crudo of valor.pasos as unknown[]) {
    const paso = leerPaso(crudo);
    if (paso === null) return null;
    pasos.push(paso);
  }
  const reparto: ParteDelReparto[] = [];
  for (const crudo of valor.reparto as unknown[]) {
    const parte = leerParte(crudo);
    if (parte === null) return null;
    reparto.push(parte);
  }
  return { pasos, reparto, sueldoPorTrabajo: valor.sueldoPorTrabajo };
}

function problemasDelTesoro(
  id: string,
  vistos: Set<string>,
  porId: ReadonlyMap<string, TesoroDeLaFila>,
): ProblemaDeLaFila | null {
  const tesoro = porId.get(id);
  if (tesoro === undefined) return 'tesoro-desconocido';
  if (tesoro.archivado) return 'tesoro-archivado';
  if (vistos.has(id)) return 'tesoro-repetido';
  if (tesoro.clave === 'diezmo') return 'diezmo-en-la-fila';
  return null;
}

function problemaDelPaso(paso: PasoDeLaFila, tesoro: TesoroDeLaFila): ProblemaDeLaFila | null {
  if (tesoro.clave === 'hogar' && paso.clase !== 'sueldo') return 'hogar-no-es-sueldo';
  if (paso.clase === 'sueldo' && tesoro.clave !== 'hogar') return 'sueldo-no-es-hogar';
  if (tesoro.clave === 'maun' && paso.clase !== 'fijos') return 'maun-no-es-fijos';
  if (esNegativo(paso.tope) || paso.tope > MONTO_MAXIMO_DE_LA_FILA) return 'tope-fuera-de-rango';
  if (paso.clase !== 'fijos') {
    if (paso.renglones.length > 0) return 'renglones-en-otra-clase';
  } else {
    if (paso.renglones.length === 0) return 'fijos-sin-renglones';
    if (paso.renglones.length > TOPE_DE_RENGLONES) return 'demasiados-renglones';
    for (const renglon of paso.renglones) {
      if (renglon.nombre.replace(/^ +| +$/g, '') === '') return 'renglon-sin-nombre';
      if (Array.from(renglon.nombre).length > LARGO_MAXIMO_DEL_RENGLON) return 'renglon-largo';
      if (renglon.monto <= 0 || renglon.monto > MONTO_MAXIMO_DE_LA_FILA) {
        return 'renglon-fuera-de-rango';
      }
    }
    if (sumaDeLosRenglones(paso.renglones) !== paso.tope) return 'tope-no-es-la-suma';
  }
  if (paso.desde !== null && !FORMATO_MES.test(paso.desde)) return 'desde-invalido';
  return null;
}

function problemaDeLaParte(
  parte: ParteDelReparto,
  tesoro: TesoroDeLaFila,
): ProblemaDeLaFila | null {
  if (tesoro.clave === 'maun') return 'maun-en-el-reparto';
  if (tesoro.clave === 'hogar') return 'hogar-en-el-reparto';
  if (
    !Number.isInteger(parte.porcentaje) ||
    parte.porcentaje < 1 ||
    parte.porcentaje > BASE_PUNTOS_BASICOS
  ) {
    return 'porcentaje-invalido';
  }
  return null;
}

export function problemasDeLaFila(
  fila: Fila,
  tesoros: readonly TesoroDeLaFila[],
): ProblemaEnLaFila[] {
  const problemas: ProblemaEnLaFila[] = [];
  if (fila.pasos.length > TOPE_DE_PASOS) {
    problemas.push({ problema: 'demasiados-pasos', tesoro: null });
  }
  if (fila.reparto.length > TOPE_DE_PARTES) {
    problemas.push({ problema: 'demasiadas-partes', tesoro: null });
  }

  const porId = new Map(tesoros.map((tesoro) => [tesoro.id, tesoro]));
  const vistos = new Set<string>();

  for (const paso of fila.pasos) {
    const problema =
      problemasDelTesoro(paso.tesoro, vistos, porId) ??
      problemaDelPaso(paso, porId.get(paso.tesoro) as TesoroDeLaFila);
    if (problema !== null) problemas.push({ problema, tesoro: paso.tesoro });
    vistos.add(paso.tesoro);
  }

  for (const parte of fila.reparto) {
    const problema =
      problemasDelTesoro(parte.tesoro, vistos, porId) ??
      problemaDeLaParte(parte, porId.get(parte.tesoro) as TesoroDeLaFila);
    if (problema !== null) problemas.push({ problema, tesoro: parte.tesoro });
    vistos.add(parte.tesoro);
  }

  if (sumaDelReparto(fila) > BASE_PUNTOS_BASICOS) {
    problemas.push({ problema: 'reparto-pasa-de-cien', tesoro: null });
  }
  if (fila.sueldoPorTrabajo) {
    problemas.push({ problema: 'sueldo-por-trabajo', tesoro: null });
  }
  return problemas;
}

export function primerProblemaDeLaFila(
  valor: unknown,
  tesoros: readonly TesoroDeLaFila[],
): ProblemaDeLaFila | null {
  const fila = leerLaFila(valor);
  if (fila === null) return 'forma-invalida';
  return problemasDeLaFila(fila, tesoros)[0]?.problema ?? null;
}

export function planDelReparto(
  destino: EstadoLiquidado,
  fila: Fila,
  ajustes: AjustesDelReparto,
): PlanDelReparto {
  const perdido = destino === 'perdido';
  return {
    diezmoBp: perdido && !ajustes.perdidoConDiezmo ? puntosBasicos(0) : DIEZMO,
    pasos: fila.pasos.map((paso) => ({
      tesoro: paso.tesoro,
      clase: paso.clase,
      objetivo: perdido && paso.clase === 'sueldo' && !ajustes.perdidoConSueldo ? CERO : paso.tope,
      porMes: !(paso.clase === 'sueldo' && fila.sueldoPorTrabajo),
    })),
    reparto: fila.reparto,
  };
}

function exigirTesorosUnicos(plan: PlanDelReparto): void {
  const vistos = new Set<string>();
  for (const tesoro of [
    ...plan.pasos.map((paso) => paso.tesoro),
    ...plan.reparto.map((parte) => parte.tesoro),
  ]) {
    if (vistos.has(tesoro)) {
      throw new RangeError(`Un tesoro va una sola vez en la fila: ${tesoro} está repetido.`);
    }
    vistos.add(tesoro);
  }
}

export function repartir(entrada: EntradaDelReparto): Reparto {
  exigirNoNegativo('Lo cobrado', entrada.cobrado);
  exigirNoNegativo('Los gastos', entrada.gastos);
  puntosBasicos(entrada.diezmoBp);
  for (const paso of entrada.pasos) {
    exigirNoNegativo('El objetivo de un paso', paso.objetivo);
    exigirNoNegativo(
      'Lo que un tesoro ya recibió en el mes',
      entrada.previo.get(paso.tesoro) ?? CERO,
    );
  }
  for (const parte of entrada.reparto) {
    if (puntosBasicos(parte.porcentaje) === 0) {
      throw new RangeError('Una parte del reparto lleva un porcentaje mayor que cero.');
    }
  }
  if (sumaDelReparto(entrada) > BASE_PUNTOS_BASICOS) {
    throw new RangeError('El reparto no puede pasar del 100%.');
  }
  exigirTesorosUnicos(entrada);

  const neta = restar(entrada.cobrado, entrada.gastos);
  const positiva = neta > 0;
  const diezmo = positiva ? aplicarPorcentaje(neta, entrada.diezmoBp) : CERO;
  let resto = positiva ? restar(neta, diezmo) : CERO;

  const pasos: PasoRepartido[] = entrada.pasos.map((paso) => {
    const previo = entrada.previo.get(paso.tesoro) ?? CERO;
    const tope = paso.porMes ? maximo(CERO, restar(paso.objetivo, previo)) : paso.objetivo;
    const monto = minimo(tope, resto);
    resto = restar(resto, monto);
    return { ...paso, previo, tope, monto, falta: restar(tope, monto) };
  });

  const sobrante = resto;
  const reparto: ParteRepartida[] = entrada.reparto.map((parte) => {
    const monto = porcentajeHaciaAbajo(sobrante, parte.porcentaje);
    resto = restar(resto, monto);
    return { ...parte, monto };
  });

  return {
    cobrado: entrada.cobrado,
    gastos: entrada.gastos,
    diezmoBp: entrada.diezmoBp,
    neta,
    diezmo,
    pasos,
    sobrante,
    reparto,
    remanente: positiva ? resto : neta,
  };
}

export function previoDelMes(
  liquidaciones: readonly LiquidacionDelMes[],
  coberturas: readonly Cobertura[],
  mes: string,
): Map<string, Money> {
  exigirMes(mes);
  const previo = new Map<string, Money>();
  const sumarAl = (tesoro: string, monto: Money) => {
    previo.set(tesoro, sumar(previo.get(tesoro) ?? CERO, monto));
  };
  for (const liquidacion of liquidaciones) {
    if (mesDe(liquidacion.fecha) !== mes) continue;
    for (const aporte of liquidacion.aportes) sumarAl(aporte.tesoro, aporte.monto);
  }
  for (const cobertura of coberturas) {
    exigirMes(cobertura.mes);
    if (cobertura.mes === mes) sumarAl(cobertura.tesoro, cobertura.monto);
  }
  return previo;
}

export function calcularPorLaFila(entrada: EntradaDeLaLiquidacion): LiquidacionPorLaFila {
  const plan = planDelReparto(entrada.destino, entrada.fila, entrada.ajustes);
  const previo = previoDelMes(entrada.liquidaciones, entrada.coberturas, mesDe(entrada.fecha));
  const reparto = repartir({
    ...plan,
    cobrado: entrada.cobrado,
    gastos: entrada.gastos,
    previo,
  });
  return { ...reparto, destino: entrada.destino, fecha: entrada.fecha, previoDelMes: previo };
}

export function aportesDelReparto(reparto: Reparto): AporteDelMes[] {
  return [
    ...reparto.pasos.map((paso) => ({ tesoro: paso.tesoro, monto: paso.monto })),
    ...reparto.reparto.map((parte) => ({ tesoro: parte.tesoro, monto: parte.monto })),
  ];
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

export function filaDelMes(
  fila: Fila,
  liquidaciones: readonly LiquidacionDelMes[],
  coberturas: readonly Cobertura[],
  mes: string,
): FilaDelMes {
  const delMes = liquidaciones.filter((liquidacion) => mesDe(liquidacion.fecha) === mes);
  const recibido = previoDelMes(delMes, [], mes);
  const cubierto = previoDelMes([], coberturas, mes);

  let ganancia = CERO;
  let diezmo = CERO;
  let enElTaller = CERO;
  for (const liquidacion of delMes) {
    ganancia = sumar(ganancia, liquidacion.neta);
    diezmo = sumar(diezmo, liquidacion.diezmo);
    enElTaller = sumar(enElTaller, liquidacion.remanente);
  }

  const pasos: PasoDelMes[] = fila.pasos.map((paso) => {
    const deLosCobros = recibido.get(paso.tesoro) ?? CERO;
    const aMano = cubierto.get(paso.tesoro) ?? CERO;
    const falta = maximo(CERO, restar(paso.tope, sumar(deLosCobros, aMano)));
    return {
      tesoro: paso.tesoro,
      clase: paso.clase,
      objetivo: paso.tope,
      recibido: deLosCobros,
      cubierto: aMano,
      falta,
      completo: falta === 0,
    };
  });

  const reparto: ParteDelMes[] = fila.reparto.map((parte) => ({
    tesoro: parte.tesoro,
    porcentaje: parte.porcentaje,
    recibido: recibido.get(parte.tesoro) ?? CERO,
  }));

  return {
    mes,
    cobros: delMes.length,
    ganancia,
    diezmo,
    pasos,
    reparto,
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
    pasos: fila.pasos.filter((paso) => paso.tesoro !== tesoro),
    reparto: fila.reparto.filter((parte) => parte.tesoro !== tesoro),
  };
}

export function ponerPaso(fila: Fila, paso: PasoDeLaFila, posicion: number): Fila {
  const sin = sinElTesoro(fila, paso.tesoro);
  exigirPosicion(posicion, sin.pasos.length);
  return {
    ...sin,
    pasos: [...sin.pasos.slice(0, posicion), paso, ...sin.pasos.slice(posicion)],
  };
}

export function moverPaso(fila: Fila, tesoro: string, posicion: number): Fila {
  const paso = fila.pasos.find((candidato) => candidato.tesoro === tesoro);
  if (paso === undefined) {
    throw new RangeError(`El tesoro ${tesoro} no es un paso de la fila.`);
  }
  return ponerPaso(fila, paso, posicion);
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

export function ponerEnElReparto(fila: Fila, tesoro: string, porcentaje: PuntosBasicos): Fila {
  const sin = sinElTesoro(fila, tesoro);
  const actual = fila.reparto.findIndex((parte) => parte.tesoro === tesoro);
  const parte = { tesoro, porcentaje };
  const reparto =
    actual === -1
      ? [...sin.reparto, parte]
      : [...sin.reparto.slice(0, actual), parte, ...sin.reparto.slice(actual)];
  return { ...sin, reparto };
}

export function sacarDeLaFila(fila: Fila, tesoro: string): Fila {
  return sinElTesoro(fila, tesoro);
}

export function cambiarElPaso(
  fila: Fila,
  tesoro: string,
  cambio: Partial<Pick<PasoDeLaFila, 'tope' | 'renglones' | 'desde'>>,
): Fila {
  if (!fila.pasos.some((paso) => paso.tesoro === tesoro)) {
    throw new RangeError(`El tesoro ${tesoro} no es un paso de la fila.`);
  }
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

function mismosRenglones(a: readonly Renglon[], b: readonly Renglon[]): boolean {
  return (
    a.length === b.length &&
    a.every((renglon, i) => {
      const otro = b[i];
      return otro !== undefined && renglon.nombre === otro.nombre && renglon.monto === otro.monto;
    })
  );
}

export function cambiosDeLaFila(antes: Fila, despues: Fila): CambioDeLaFila[] {
  const cambios: CambioDeLaFila[] = [];
  const pasosAntes = new Map(antes.pasos.map((paso, i) => [paso.tesoro, { paso, i }]));
  const pasosDespues = new Map(despues.pasos.map((paso, i) => [paso.tesoro, { paso, i }]));
  const partesAntes = new Map(antes.reparto.map((parte) => [parte.tesoro, parte]));
  const partesDespues = new Map(despues.reparto.map((parte) => [parte.tesoro, parte]));

  for (const [tesoro] of pasosAntes) {
    if (!pasosDespues.has(tesoro)) cambios.push({ tipo: 'sale-de-la-fila', tesoro });
  }
  const quedan = despues.pasos.filter((paso) => pasosAntes.has(paso.tesoro));
  const ordenAntes = antes.pasos.filter((paso) => pasosDespues.has(paso.tesoro));
  for (const [i, paso] of despues.pasos.entries()) {
    const previo = pasosAntes.get(paso.tesoro);
    if (previo === undefined) {
      cambios.push({ tipo: 'entra-a-la-fila', tesoro: paso.tesoro, posicion: i, tope: paso.tope });
      continue;
    }
    const lugarAntes = ordenAntes.findIndex((otro) => otro.tesoro === paso.tesoro);
    const lugarDespues = quedan.findIndex((otro) => otro.tesoro === paso.tesoro);
    if (lugarAntes !== lugarDespues) {
      cambios.push({ tipo: 'cambia-de-lugar', tesoro: paso.tesoro, antes: previo.i, despues: i });
    }
    if (previo.paso.tope !== paso.tope) {
      cambios.push({
        tipo: 'cambia-el-tope',
        tesoro: paso.tesoro,
        antes: previo.paso.tope,
        despues: paso.tope,
      });
    } else if (!mismosRenglones(previo.paso.renglones, paso.renglones)) {
      cambios.push({ tipo: 'cambian-los-renglones', tesoro: paso.tesoro });
    }
  }

  for (const [tesoro] of partesAntes) {
    if (!partesDespues.has(tesoro)) cambios.push({ tipo: 'sale-del-reparto', tesoro });
  }
  for (const parte of despues.reparto) {
    const previa = partesAntes.get(parte.tesoro);
    if (previa === undefined) {
      cambios.push({
        tipo: 'entra-al-reparto',
        tesoro: parte.tesoro,
        porcentaje: parte.porcentaje,
      });
    } else if (previa.porcentaje !== parte.porcentaje) {
      cambios.push({
        tipo: 'cambia-el-porcentaje',
        tesoro: parte.tesoro,
        antes: previa.porcentaje,
        despues: parte.porcentaje,
      });
    }
  }
  return cambios;
}
