import type { Cotizacion } from './cotizacion.ts';
import { estaLiquidado, type EstadoProyecto } from './estados.ts';
import { mesDe } from './fechas.ts';
import {
  BASE_PUNTOS_BASICOS,
  CERO,
  centavos,
  importeDelTaller,
  negar,
  restar,
  sumar,
  type Moneda,
  type MonedaDelTaller,
  type Money,
} from './money.ts';

export const TESOROS = ['hogar', 'maun', 'diezmo', 'cocos'] as const;

export type Tesoro = (typeof TESOROS)[number];

export const CATEGORIA_DE_APERTURA = 'Apertura';

export type OrigenDeAsiento = 'manual' | 'pago' | 'gasto_proyecto' | 'distribucion' | 'reparto';

export interface TesoroDelLibro {
  id: string;
  clave: Tesoro | null;
}

export interface MovimientoDelLibro {
  id: string;
  fecha: string;
  tipo: string;
  tesoroOrigen: Tesoro | null;
  tesoroDestino: Tesoro | null;
  desdeId: string | null;
  haciaId: string | null;
  monto: Money<Moneda>;
  montoDestino?: Money<Moneda> | null;
  categoria: string;
  descripcion: string;
  proyectoId: string | null;
}

export interface PagoDelLibro {
  id: string;
  proyectoId: string;
  fecha: string;
  concepto: string;
  monto: Money<Moneda>;
  moneda?: Moneda;
  cotizacion?: Cotizacion | null;
  tesoroId?: string | null;
  yaEnLaApertura: boolean;
}

export interface GastoDelLibro {
  id: string;
  proyectoId: string;
  fecha: string;
  descripcion: string;
  monto: Money;
}

export interface ProyectoDelLibro {
  id: string;
  titulo: string;
  estado: EstadoProyecto;
  fechaCobro: string | null;
  diezmo: Money;
  sueldo: Money;
  repartoYaEnLaApertura: boolean;
}

export interface RepartoDelLibro {
  id: string;
  proyectoId: string;
  tesoroId: string;
  clase: string | null;
  monto: Money;
  fecha: string;
  yaEnLaApertura: boolean;
}

export interface DatosDelLibro {
  tesoros: readonly TesoroDelLibro[];
  movimientos: readonly MovimientoDelLibro[];
  pagos: readonly PagoDelLibro[];
  gastos: readonly GastoDelLibro[];
  proyectos: readonly ProyectoDelLibro[];
  repartos: readonly RepartoDelLibro[];
}

export interface Asiento {
  origen: OrigenDeAsiento;
  asientoId: string;
  fecha: string;
  tesoro: Tesoro | null;
  contrapartida: Tesoro | null;
  tesoroId: string;
  contrapartidaId: string | null;
  monto: Money<Moneda>;
  concepto: string;
  categoria: string;
  descripcion: string;
  proyectoId: string | null;
  yaEnLaApertura: boolean;
}

export interface LineaDelLibro {
  origen: OrigenDeAsiento;
  asientoId: string;
  fecha: string;
  desde: Tesoro | null;
  hacia: Tesoro | null;
  desdeId: string | null;
  haciaId: string | null;
  monto: Money<Moneda>;
  montoHacia: Money<Moneda>;
  concepto: string;
  categoria: string;
  descripcion: string;
  proyectoId: string | null;
  yaEnLaApertura: boolean;
}

export type SaldosPorTesoro = Readonly<Record<Tesoro, Money>>;

export type SaldosPorId = ReadonlyMap<string, Money<Moneda>>;

interface Tesoreria {
  idDe: (clave: Tesoro) => string;
  claveDe: (id: string) => Tesoro | null;
}

function esClave(valor: string): valor is Tesoro {
  return (TESOROS as readonly string[]).includes(valor);
}

function tesoreria(tesoros: readonly TesoroDelLibro[]): Tesoreria {
  const porClave = new Map<Tesoro, string>();
  const porId = new Map<string, Tesoro | null>();
  for (const tesoro of tesoros) {
    porId.set(tesoro.id, tesoro.clave);
    if (tesoro.clave !== null) porClave.set(tesoro.clave, tesoro.id);
  }
  return {
    idDe: (clave) => porClave.get(clave) ?? clave,
    claveDe: (id) => {
      const clave = porId.get(id);
      if (clave !== undefined) return clave;
      return esClave(id) ? id : null;
    },
  };
}

function ladoDelMovimiento(
  clave: Tesoro | null,
  id: string | null,
  { idDe, claveDe }: Tesoreria,
): { clave: Tesoro | null; id: string | null } {
  if (id !== null) return { clave: clave ?? claveDe(id), id };
  if (clave !== null) return { clave, id: idDe(clave) };
  return { clave: null, id: null };
}

export function lineasDelLibro(datos: DatosDelLibro): LineaDelLibro[] {
  const lineas: LineaDelLibro[] = [];
  const tesoros = tesoreria(datos.tesoros);
  const maun = tesoros.idDe('maun');

  for (const movimiento of datos.movimientos) {
    const desde = ladoDelMovimiento(movimiento.tesoroOrigen, movimiento.desdeId, tesoros);
    const hacia = ladoDelMovimiento(movimiento.tesoroDestino, movimiento.haciaId, tesoros);
    lineas.push({
      origen: 'manual',
      asientoId: movimiento.id,
      fecha: movimiento.fecha,
      desde: desde.clave,
      hacia: hacia.clave,
      desdeId: desde.id,
      haciaId: hacia.id,
      monto: movimiento.monto,
      montoHacia: movimiento.montoDestino ?? movimiento.monto,
      concepto: movimiento.tipo,
      categoria: movimiento.categoria,
      descripcion: movimiento.descripcion,
      proyectoId: movimiento.proyectoId,
      yaEnLaApertura: false,
    });
  }

  const proyectos = new Map(datos.proyectos.map((proyecto) => [proyecto.id, proyecto]));

  for (const pago of datos.pagos) {
    if (!proyectos.has(pago.proyectoId)) continue;
    const tesoroDelPago = pago.tesoroId ?? null;
    lineas.push({
      origen: 'pago',
      asientoId: pago.id,
      fecha: pago.fecha,
      desde: null,
      hacia: tesoroDelPago === null ? 'maun' : tesoros.claveDe(tesoroDelPago),
      desdeId: null,
      haciaId: tesoroDelPago ?? maun,
      monto: pago.monto,
      montoHacia: pago.monto,
      concepto: 'cobro',
      categoria: 'Cobro',
      descripcion: pago.concepto,
      proyectoId: pago.proyectoId,
      yaEnLaApertura: pago.yaEnLaApertura,
    });
  }

  for (const gasto of datos.gastos) {
    if (!proyectos.has(gasto.proyectoId)) continue;
    lineas.push({
      origen: 'gasto_proyecto',
      asientoId: gasto.id,
      fecha: gasto.fecha,
      desde: 'maun',
      hacia: null,
      desdeId: maun,
      haciaId: null,
      monto: gasto.monto,
      montoHacia: gasto.monto,
      concepto: 'gasto',
      categoria: 'Materiales',
      descripcion: gasto.descripcion,
      proyectoId: gasto.proyectoId,
      yaEnLaApertura: false,
    });
  }

  for (const proyecto of datos.proyectos) {
    if (!estaLiquidado(proyecto.estado) || proyecto.fechaCobro === null) continue;

    const escalones: readonly [Tesoro, Money, string][] = [
      ['diezmo', proyecto.diezmo, 'diezmo'],
      ['hogar', proyecto.sueldo, 'sueldo'],
    ];

    for (const [hacia, monto, concepto] of escalones) {
      if (monto === 0) continue;
      lineas.push({
        origen: 'distribucion',
        asientoId: proyecto.id,
        fecha: proyecto.fechaCobro,
        desde: 'maun',
        hacia,
        desdeId: maun,
        haciaId: tesoros.idDe(hacia),
        monto,
        montoHacia: monto,
        concepto,
        categoria: 'Distribución',
        descripcion: proyecto.titulo,
        proyectoId: proyecto.id,
        yaEnLaApertura: proyecto.repartoYaEnLaApertura,
      });
    }
  }

  for (const reparto of datos.repartos) {
    const proyecto = proyectos.get(reparto.proyectoId);
    if (proyecto === undefined || !estaLiquidado(proyecto.estado)) continue;
    if (reparto.monto === 0 || reparto.tesoroId === maun) continue;
    lineas.push({
      origen: 'reparto',
      asientoId: reparto.id,
      fecha: reparto.fecha,
      desde: 'maun',
      hacia: tesoros.claveDe(reparto.tesoroId),
      desdeId: maun,
      haciaId: reparto.tesoroId,
      monto: reparto.monto,
      montoHacia: reparto.monto,
      concepto: reparto.clase ?? 'reparto',
      categoria: 'Distribución',
      descripcion: proyecto.titulo,
      proyectoId: proyecto.id,
      yaEnLaApertura: reparto.yaEnLaApertura,
    });
  }

  return lineas;
}

export function asientosDeLaLinea(linea: LineaDelLibro): Asiento[] {
  const comun = {
    origen: linea.origen,
    asientoId: linea.asientoId,
    fecha: linea.fecha,
    concepto: linea.concepto,
    categoria: linea.categoria,
    descripcion: linea.descripcion,
    proyectoId: linea.proyectoId,
    yaEnLaApertura: linea.yaEnLaApertura,
  };

  const asientos: Asiento[] = [];
  if (linea.haciaId !== null) {
    asientos.push({
      ...comun,
      tesoro: linea.hacia,
      contrapartida: linea.desde,
      tesoroId: linea.haciaId,
      contrapartidaId: linea.desdeId,
      monto: linea.montoHacia,
    });
  }
  if (linea.desdeId !== null) {
    asientos.push({
      ...comun,
      tesoro: linea.desde,
      contrapartida: linea.hacia,
      tesoroId: linea.desdeId,
      contrapartidaId: linea.haciaId,
      monto: negar(linea.monto),
    });
  }
  return asientos;
}

export function asientosDelLibro(datos: DatosDelLibro): Asiento[] {
  return lineasDelLibro(datos).flatMap(asientosDeLaLinea);
}

export function mueveLosTesoros(asiento: Asiento): boolean {
  return !asiento.yaEnLaApertura;
}

export function enLaMonedaDelTaller(asiento: Asiento): Money | null {
  return asiento.tesoro === null ? null : importeDelTaller(asiento.monto);
}

export function saldosPorTesoro(asientos: readonly Asiento[]): SaldosPorTesoro {
  const saldos: Record<Tesoro, Money> = { hogar: CERO, maun: CERO, diezmo: CERO, cocos: CERO };
  for (const asiento of asientos.filter(mueveLosTesoros)) {
    if (asiento.tesoro === null) continue;
    saldos[asiento.tesoro] = sumar(saldos[asiento.tesoro], importeDelTaller(asiento.monto));
  }
  return saldos;
}

export function saldosPorId(asientos: readonly Asiento[]): SaldosPorId {
  const saldos = new Map<string, Money<Moneda>>();
  for (const asiento of asientos.filter(mueveLosTesoros)) {
    const anterior: Money<Moneda> = saldos.get(asiento.tesoroId) ?? CERO;
    saldos.set(asiento.tesoroId, sumar(anterior, asiento.monto));
  }
  return saldos;
}

export function fechaDeApertura(movimientos: readonly MovimientoDelLibro[]): string | null {
  let apertura: string | null = null;
  for (const movimiento of movimientos) {
    if (movimiento.tipo !== 'ajuste' || movimiento.categoria !== CATEGORIA_DE_APERTURA) continue;
    if (apertura === null || movimiento.fecha < apertura) apertura = movimiento.fecha;
  }
  return apertura;
}

export function esAnteriorALaApertura(fecha: string, apertura: string | null): boolean {
  return apertura !== null && fecha < apertura;
}

export function saldosDelLibro(datos: DatosDelLibro): SaldosPorTesoro {
  return saldosPorTesoro(asientosDelLibro(datos));
}

export function saldosDelLibroPorId(datos: DatosDelLibro): SaldosPorId {
  return saldosPorId(asientosDelLibro(datos));
}

export function asientosDelMes(asientos: readonly Asiento[], mes: string): Asiento[] {
  return asientos.filter((asiento) => mesDe(asiento.fecha) === mes);
}

export interface EntradasYSalidas<M extends Moneda = MonedaDelTaller> {
  entro: Money<M>;
  salio: Money<M>;
}

function sumarEntradasYSalidas(asientos: readonly Asiento[]): EntradasYSalidas<Moneda> {
  let entro: Money<Moneda> = CERO;
  let salio: Money<Moneda> = CERO;

  for (const asiento of asientos) {
    if (asiento.monto >= 0) entro = sumar(entro, asiento.monto);
    else salio = sumar(salio, negar(asiento.monto));
  }

  return { entro, salio };
}

export function entradasYSalidas(asientos: readonly Asiento[], tesoro: Tesoro): EntradasYSalidas {
  const { entro, salio } = sumarEntradasYSalidas(
    asientos.filter((asiento) => asiento.tesoro === tesoro),
  );
  return { entro: importeDelTaller(entro), salio: importeDelTaller(salio) };
}

export function entradasYSalidasPorId(
  asientos: readonly Asiento[],
  tesoroId: string,
): EntradasYSalidas<Moneda> {
  return sumarEntradasYSalidas(asientos.filter((asiento) => asiento.tesoroId === tesoroId));
}

export type SituacionDelDiezmo = 'debe' | 'al-dia' | 'pago-de-mas';

export interface EstadoDelDiezmo {
  situacion: SituacionDelDiezmo;
  importe: Money;
  generado: Money;
  pagado: Money;
}

export function estadoDelDiezmo(asientos: readonly Asiento[]): EstadoDelDiezmo {
  const { entro, salio } = entradasYSalidas(asientos.filter(mueveLosTesoros), 'diezmo');
  const saldo = restar(entro, salio);
  return {
    situacion: saldo > 0 ? 'debe' : saldo < 0 ? 'pago-de-mas' : 'al-dia',
    importe: saldo < 0 ? negar(saldo) : saldo,
    generado: entro,
    pagado: salio,
  };
}

export function proyeccionCocos(saldo: Money, tasaAnualBp: number, dias: number): Money {
  if (!Number.isInteger(tasaAnualBp) || tasaAnualBp < 0) {
    throw new RangeError(`La tasa anual va en puntos básicos enteros: ${String(tasaAnualBp)} no.`);
  }
  if (dias <= 0 || tasaAnualBp === 0) return saldo;
  const factor = (1 + tasaAnualBp / BASE_PUNTOS_BASICOS) ** (dias / 365);
  return centavos(Math.round(saldo * factor));
}
