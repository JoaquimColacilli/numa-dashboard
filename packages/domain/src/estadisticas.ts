import {
  cuentaDe,
  filasDeEntregas,
  resumenDeEntregas,
  resumirDias,
  UMBRAL_CUENTAS,
  UMBRAL_MEDIANA,
  type AnalisisDeEntregas,
  type CambioDeFechaParaElAnalisis,
  type Cuenta,
  type FilaDelAnalisis,
  type FilasDeEntregas,
  type GrupoPorTipo,
  type ResumenDeDias,
  type TrabajoParaElAnalisis,
} from './analitico.ts';
import {
  calcularMargen,
  calcularMargenEnDolares,
  CATEGORIAS_DE_COSTO,
  CATEGORIAS_DE_GASTO,
  type CategoriaDeGasto,
  type CostosEstimados,
  type MargenEnDolares,
} from './costos.ts';
import type { Cotizacion } from './cotizacion.ts';
import { esEstadoDeConsulta, type EstadoProyecto } from './estados.ts';
import { correrMes, diasEntre, mesDe } from './fechas.ts';
import {
  aPesosDeHoy,
  cambioReal,
  indiceAlDia,
  porcentajeEntero,
  type IndiceDePrecios,
  type MontoDelMes,
  type SentidoDelCambio,
} from './inflacion.ts';
import {
  centavos,
  centavosEn,
  CERO,
  MONEDA_DEL_TALLER,
  sumar,
  type Moneda,
  type Money,
} from './money.ts';
import { claveDelNombre, type TipoDeNecesidad } from './necesidades.ts';
import {
  fueMandado,
  pedidosPorTrabajo,
  PUNTOS_DE_LA_TASA,
  resumenDeOpiniones,
  type DatosDeLasOpiniones,
  type PedidoMandado,
  type ResultadoDePregunta,
  type TextosDeLasEscalas,
} from './opiniones.ts';
import {
  estaEnElRango,
  type ColumnaDelPeriodo,
  type PeriodoResuelto,
  type RangoDeDias,
} from './periodos.ts';
import { plata, totalesPorMoneda, type Plata } from './plata.ts';
import { seMandaElPresupuesto } from './vigencia.ts';

export const UMBRAL_DEL_EMBUDO = UMBRAL_CUENTAS;

export const UMBRAL_DE_COMPARACION = 5;

export const ETAPAS_ANOTADAS_DESDE = '2026-09-18';

export const PRIMEROS_DE_LO_QUE_MAS_USAS = 5;

export const RENGLONES_DE_LO_ESTIMADO = 6;

export const MESES_DE_LO_NORMAL = 12;

export const PASO_CONFORME = 4;

const SON_TRABAJO: readonly EstadoProyecto[] = ['en_curso', 'entregado', 'cobrado'];

export interface LiquidacionParaLasEstadisticas {
  readonly id: string;
  readonly titulo: string;
  readonly estado: 'cobrado' | 'perdido';
  readonly fecha: string;
  readonly cobrado: Money;
  readonly gastos: Money;
  readonly moneda: Moneda;
  readonly precio: Money<Moneda> | null;
  readonly costos: CostosEstimados;
  readonly cotizacionDeLosCostos: Cotizacion | null;
}

export interface GastoDeUnTrabajo {
  readonly id: string;
  readonly proyectoId: string;
  readonly fecha: string;
  readonly monto: Money;
  readonly categoria: CategoriaDeGasto | null;
}

export interface GastoDelTaller {
  readonly id: string;
  readonly fecha: string;
  readonly monto: Money;
  readonly categoria: string;
}

export interface NecesidadParaLasEstadisticas {
  readonly proyectoId: string;
  readonly tipo: TipoDeNecesidad;
  readonly nombre: string;
  readonly alta: string;
}

export interface TrabajoParaLasEstadisticas extends TrabajoParaElAnalisis {
  readonly clienteId: string;
  readonly moneda: Moneda;
  readonly precio: Money<Moneda> | null;
  readonly descontado: Money<Moneda>;
  readonly entregaEstimada: string | null;
  readonly entregaComprometida: string | null;
}

export interface CambioDeEstadoParaLasEstadisticas {
  readonly id: string;
  readonly proyectoId: string;
  readonly desde: EstadoProyecto | null;
  readonly hacia: EstadoProyecto;
  readonly ocurrioEl: string;
  readonly anotadoEn: string;
}

export interface DatosDeLasEstadisticas {
  readonly liquidaciones: readonly LiquidacionParaLasEstadisticas[];
  readonly gastosDeLosTrabajos: readonly GastoDeUnTrabajo[];
  readonly gastosDelTaller: readonly GastoDelTaller[];
  readonly necesidades: readonly NecesidadParaLasEstadisticas[];
  readonly trabajos: readonly TrabajoParaLasEstadisticas[];
  readonly cambiosDeEstado: readonly CambioDeEstadoParaLasEstadisticas[];
  readonly cambiosDeFecha: readonly CambioDeFechaParaElAnalisis[];
}

export interface LiquidacionDelPeriodo {
  readonly id: string;
  readonly titulo: string;
  readonly estado: 'cobrado' | 'perdido';
  readonly fecha: string;
  readonly cobrado: Money;
  readonly gastos: Money;
  readonly neta: Money;
  readonly moneda: Moneda;
}

export interface LiquidacionDeLaBase extends LiquidacionDelPeriodo {
  readonly precio: Money<Moneda> | null;
  readonly costos: CostosEstimados;
  readonly cotizacionDeLosCostos: Cotizacion | null;
}

export interface CaminoDeLaConsulta {
  readonly proyectoId: string;
  readonly clienteId: string;
  readonly titulo: string;
  readonly estado: EstadoProyecto;
  readonly entro: string;
  readonly nacio: EstadoProyecto;
  readonly presupuesto: string | null;
  readonly aprobada: boolean;
  readonly respuesta: string | null;
}

export interface PedidoDelTrabajo {
  readonly proyectoId: string;
  readonly pedido: PedidoMandado;
}

export interface BaseDeLasEstadisticas {
  readonly primerMes: string | null;
  readonly liquidaciones: readonly LiquidacionDeLaBase[];
  readonly liquidacionesPorMes: ReadonlyMap<string, readonly LiquidacionDeLaBase[]>;
  readonly entregas: FilasDeEntregas;
  readonly gastosDeLosTrabajos: readonly GastoDeUnTrabajo[];
  readonly gastosDelTaller: readonly GastoDelTaller[];
  readonly necesidades: readonly NecesidadParaLasEstadisticas[];
  readonly consultas: readonly CaminoDeLaConsulta[];
  readonly trabajos: readonly TrabajoParaLasEstadisticas[];
  readonly opiniones: DatosDeLasOpiniones;
  readonly pedidos: readonly PedidoDelTrabajo[];
}

export interface ContextoDeLasEstadisticas {
  readonly hoy: string;
  readonly indice: IndiceDePrecios;
  readonly escalas: TextosDeLasEscalas;
}

function porFechaYTitulo<T extends { fecha: string; titulo: string; id: string }>(
  una: T,
  otra: T,
): number {
  return (
    una.fecha.localeCompare(otra.fecha) ||
    una.titulo.localeCompare(otra.titulo, 'es') ||
    una.id.localeCompare(otra.id)
  );
}

function liquidacionDeLaBase(liquidacion: LiquidacionParaLasEstadisticas): LiquidacionDeLaBase {
  return {
    id: liquidacion.id,
    titulo: liquidacion.titulo,
    estado: liquidacion.estado,
    fecha: liquidacion.fecha,
    cobrado: liquidacion.cobrado,
    gastos: liquidacion.gastos,
    neta: centavos(liquidacion.cobrado - liquidacion.gastos),
    moneda: liquidacion.moneda,
    precio: liquidacion.precio,
    costos: liquidacion.costos,
    cotizacionDeLosCostos: liquidacion.cotizacionDeLosCostos,
  };
}

function enOrdenDeAnotacion(
  una: CambioDeEstadoParaLasEstadisticas,
  otra: CambioDeEstadoParaLasEstadisticas,
): number {
  return una.anotadoEn.localeCompare(otra.anotadoEn) || una.id.localeCompare(otra.id);
}

function caminosDeLasConsultas(
  trabajos: readonly TrabajoParaLasEstadisticas[],
  cambios: readonly CambioDeEstadoParaLasEstadisticas[],
): CaminoDeLaConsulta[] {
  const porTrabajo = new Map<string, CambioDeEstadoParaLasEstadisticas[]>();
  for (const cambio of cambios) {
    porTrabajo.set(cambio.proyectoId, [...(porTrabajo.get(cambio.proyectoId) ?? []), cambio]);
  }
  return trabajos.flatMap((trabajo) => {
    const suyos = (porTrabajo.get(trabajo.id) ?? []).sort(enOrdenDeAnotacion);
    const alta = suyos.find((cambio) => cambio.desde === null);
    if (alta === undefined || !esEstadoDeConsulta(alta.hacia)) return [];
    const mandado = suyos.findIndex((cambio) => seMandaElPresupuesto(cambio.desde, cambio.hacia));
    const respuesta =
      mandado === -1
        ? undefined
        : suyos.slice(mandado + 1).find((cambio) => cambio.hacia === 'en_curso');
    return [
      {
        proyectoId: trabajo.id,
        clienteId: trabajo.clienteId,
        titulo: trabajo.titulo,
        estado: trabajo.estado,
        entro: alta.ocurrioEl,
        nacio: alta.hacia,
        presupuesto: suyos[mandado]?.ocurrioEl ?? null,
        aprobada: suyos.some((cambio) => cambio.hacia === 'en_curso'),
        respuesta: respuesta?.ocurrioEl ?? null,
      },
    ];
  });
}

function primerMesDe(fechas: Iterable<string>): string | null {
  let primero: string | null = null;
  for (const fecha of fechas) {
    const mes = mesDe(fecha);
    if (primero === null || mes < primero) primero = mes;
  }
  return primero;
}

export function baseDeLasEstadisticas(
  datos: DatosDeLasEstadisticas,
  opiniones: DatosDeLasOpiniones,
): BaseDeLasEstadisticas {
  const usados = new Set(
    datos.trabajos
      .filter((trabajo) => SON_TRABAJO.includes(trabajo.estado))
      .map((trabajo) => trabajo.id),
  );
  const liquidaciones = datos.liquidaciones.map(liquidacionDeLaBase).sort(porFechaYTitulo);
  const liquidacionesPorMes = new Map<string, LiquidacionDeLaBase[]>();
  for (const liquidacion of liquidaciones) {
    const mes = mesDe(liquidacion.fecha);
    liquidacionesPorMes.set(mes, [...(liquidacionesPorMes.get(mes) ?? []), liquidacion]);
  }
  const entregas = filasDeEntregas(datos.trabajos, datos.cambiosDeFecha);
  const necesidades = datos.necesidades.filter((necesidad) => usados.has(necesidad.proyectoId));
  const consultas = caminosDeLasConsultas(datos.trabajos, datos.cambiosDeEstado);
  const pedidos = [...pedidosPorTrabajo(opiniones)].flatMap(([proyectoId, pedido]) =>
    fueMandado(pedido) ? [{ proyectoId, pedido }] : [],
  );
  return {
    primerMes: primerMesDe([
      ...liquidaciones.map((liquidacion) => liquidacion.fecha),
      ...datos.gastosDeLosTrabajos.map((gasto) => gasto.fecha),
      ...datos.gastosDelTaller.map((gasto) => gasto.fecha),
      ...necesidades.map((necesidad) => necesidad.alta),
      ...entregas.filas.map((fila) => fila.entregado),
      ...consultas.map((consulta) => consulta.entro),
      ...pedidos.map(({ pedido }) => pedido.envio.enviadaEl),
    ]),
    liquidaciones,
    liquidacionesPorMes,
    entregas,
    gastosDeLosTrabajos: datos.gastosDeLosTrabajos,
    gastosDelTaller: datos.gastosDelTaller,
    necesidades,
    consultas,
    trabajos: datos.trabajos,
    opiniones,
    pedidos,
  };
}

function sumaDe(montos: Iterable<Money>): Money {
  let total = CERO;
  for (const monto of montos) total = sumar(total, monto);
  return total;
}

function montosPorMes(liquidaciones: readonly LiquidacionDelPeriodo[]): MontoDelMes[] {
  const porMes = new Map<string, Money>();
  for (const { fecha, neta } of liquidaciones) {
    const mes = mesDe(fecha);
    porMes.set(mes, sumar(porMes.get(mes) ?? CERO, neta));
  }
  return [...porMes].map(([mes, monto]) => ({ mes, monto }));
}

export function deCadaCien(parte: number, total: number): number {
  return total > 0 ? porcentajeEntero(parte, total) : 0;
}

export interface ColumnaDeLoQueTeDejaron extends ColumnaDelPeriodo {
  readonly comoSeCobro: Money;
  readonly enPesosDeHoy: Money;
  readonly liquidaciones: readonly LiquidacionDelPeriodo[];
}

export type CambioDeLoQueTeDejaron =
  | { readonly modo: 'sin-comparacion' }
  | { readonly modo: 'sin-anterior' }
  | {
      readonly modo: 'plata';
      readonly total: Money;
      readonly trabajos: number;
      readonly faltanCasos: boolean;
    }
  | {
      readonly modo: 'porcentaje';
      readonly porcentaje: number;
      readonly sentido: SentidoDelCambio;
    };

export interface EstimadoContraReal {
  readonly id: string;
  readonly titulo: string;
  readonly estimado: number;
  readonly real: number;
}

export interface LoQueTeDejaron {
  readonly total: Money;
  readonly cobrado: Money;
  readonly deCada100: number | null;
  readonly cobrados: number;
  readonly perdidos: number;
  readonly enDolares: number;
  readonly liquidaciones: readonly LiquidacionDelPeriodo[];
  readonly columnas: readonly ColumnaDeLoQueTeDejaron[];
  readonly mejor: ColumnaDeLoQueTeDejaron | null;
  readonly cambio: CambioDeLoQueTeDejaron;
  readonly deflactado: boolean;
  readonly estimado: readonly EstimadoContraReal[];
}

function delRango(
  liquidaciones: readonly LiquidacionDeLaBase[],
  rango: RangoDeDias,
): LiquidacionDeLaBase[] {
  return liquidaciones.filter((liquidacion) => estaEnElRango(liquidacion.fecha, rango));
}

function estimadoEnSuMoneda(liquidacion: LiquidacionDeLaBase): number | null {
  const margen: MargenEnDolares | ReturnType<typeof calcularMargen> =
    liquidacion.moneda === MONEDA_DEL_TALLER
      ? calcularMargen({
          presupuesto: liquidacion.precio === null ? null : centavos(liquidacion.precio),
          costos: liquidacion.costos,
        })
      : calcularMargenEnDolares({
          presupuesto: liquidacion.precio === null ? null : centavosEn('USD', liquidacion.precio),
          costos: liquidacion.costos,
          cotizacion: liquidacion.cotizacionDeLosCostos,
        });
  if (
    margen.situacion !== 'con-margen' ||
    margen.cargadas < CATEGORIAS_DE_COSTO.length ||
    margen.presupuesto <= 0
  ) {
    return null;
  }
  return porcentajeEntero(margen.margen, margen.presupuesto);
}

function loEstimadoContraLoReal(
  liquidaciones: readonly LiquidacionDeLaBase[],
): EstimadoContraReal[] {
  return liquidaciones
    .flatMap((liquidacion) => {
      if (liquidacion.estado !== 'cobrado' || liquidacion.cobrado <= 0) return [];
      const estimado = estimadoEnSuMoneda(liquidacion);
      return estimado === null
        ? []
        : [
            {
              id: liquidacion.id,
              titulo: liquidacion.titulo,
              estimado,
              real: porcentajeEntero(liquidacion.neta, liquidacion.cobrado),
            },
          ];
    })
    .sort(
      (una, otra) =>
        otra.real - una.real ||
        una.titulo.localeCompare(otra.titulo, 'es') ||
        una.id.localeCompare(otra.id),
    );
}

export function loQueTeDejaron(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
  columnas: readonly ColumnaDelPeriodo[],
  contexto: ContextoDeLasEstadisticas,
): LoQueTeDejaron {
  const mesEnCurso = mesDe(contexto.hoy);
  const delPeriodo = delRango(base.liquidaciones, resuelto.dias);
  const total = sumaDe(delPeriodo.map((liquidacion) => liquidacion.neta));
  const cobrado = sumaDe(delPeriodo.map((liquidacion) => liquidacion.cobrado));

  const conMontos = columnas.map((columna): ColumnaDeLoQueTeDejaron => {
    const suyas = columna.meses.flatMap((mes) => base.liquidacionesPorMes.get(mes) ?? []);
    return {
      ...columna,
      comoSeCobro: sumaDe(suyas.map((liquidacion) => liquidacion.neta)),
      enPesosDeHoy: sumaDe(
        montosPorMes(suyas).map(({ mes, monto }) =>
          aPesosDeHoy(monto, mes, contexto.indice, mesEnCurso),
        ),
      ),
      liquidaciones: suyas,
    };
  });
  const conDatos = conMontos.filter(
    (columna) => columna.enElPeriodo && columna.liquidaciones.length > 0,
  );
  const mejor =
    conDatos.length < 2
      ? null
      : conDatos.reduce((elegida, columna) =>
          columna.enPesosDeHoy > elegida.enPesosDeHoy ? columna : elegida,
        );

  return {
    total,
    cobrado,
    deCada100: total > 0 ? porcentajeEntero(total, cobrado) : null,
    cobrados: delPeriodo.filter((liquidacion) => liquidacion.estado === 'cobrado').length,
    perdidos: delPeriodo.filter((liquidacion) => liquidacion.estado === 'perdido').length,
    enDolares: delPeriodo.filter((liquidacion) => liquidacion.moneda !== MONEDA_DEL_TALLER).length,
    liquidaciones: delPeriodo,
    columnas: conMontos,
    mejor,
    cambio: cambioContraElAnterior(base, resuelto, delPeriodo, contexto),
    deflactado: indiceAlDia(contexto.indice, mesEnCurso),
    estimado: loEstimadoContraLoReal(delPeriodo),
  };
}

function cambioContraElAnterior(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
  delPeriodo: readonly LiquidacionDelPeriodo[],
  contexto: ContextoDeLasEstadisticas,
): CambioDeLoQueTeDejaron {
  if (resuelto.anterior === null) return { modo: 'sin-comparacion' };
  const antes = delRango(base.liquidaciones, resuelto.anterior.dias);
  if (antes.length === 0) return { modo: 'sin-anterior' };
  const comoPaso = sumaDe(antes.map((liquidacion) => liquidacion.neta));
  const pocos = delPeriodo.length < UMBRAL_DE_COMPARACION || antes.length < UMBRAL_DE_COMPARACION;
  const real = pocos
    ? null
    : cambioReal(
        montosPorMes(delPeriodo),
        montosPorMes(antes),
        contexto.indice,
        mesDe(contexto.hoy),
      );
  if (real === null) {
    return { modo: 'plata', total: comoPaso, trabajos: antes.length, faltanCasos: pocos };
  }
  return { modo: 'porcentaje', porcentaje: real.porcentaje, sentido: real.sentido };
}

export interface GastoPorCategoria {
  readonly categoria: CategoriaDeGasto | null;
  readonly monto: Money;
  readonly gastos: number;
  readonly deCada100: number;
}

export interface GastoDelTallerPorCategoria {
  readonly categoria: string;
  readonly monto: Money;
  readonly gastos: number;
  readonly deCada100: number;
}

export interface UsoDeUnNombre {
  readonly clave: string;
  readonly nombre: string;
  readonly trabajos: number;
}

export interface LoQueMasUsas {
  readonly primeros: readonly UsoDeUnNombre[];
  readonly mas: number;
}

export interface LoQueGastaste {
  readonly total: Money;
  readonly enLosTrabajos: Money;
  readonly enElTaller: Money;
  readonly sinCategoria: Money;
  readonly trabajos: readonly GastoPorCategoria[];
  readonly taller: readonly GastoDelTallerPorCategoria[];
  readonly materiales: LoQueMasUsas;
  readonly herrajes: LoQueMasUsas;
}

interface Acumulado {
  monto: Money;
  gastos: number;
}

function acumular<T extends { monto: Money }, K>(
  gastos: readonly T[],
  claveDe: (gasto: T) => K,
): Map<K, Acumulado> {
  const porClave = new Map<K, Acumulado>();
  for (const gasto of gastos) {
    const clave = claveDe(gasto);
    const previo = porClave.get(clave) ?? { monto: CERO, gastos: 0 };
    porClave.set(clave, { monto: sumar(previo.monto, gasto.monto), gastos: previo.gastos + 1 });
  }
  return porClave;
}

function lugarDeLaCategoria(categoria: CategoriaDeGasto | null): number {
  if (categoria === null) return 2;
  return categoria === 'otro' ? 1 : 0;
}

const ORDEN_DE_LAS_CATEGORIAS: readonly (CategoriaDeGasto | null)[] = CATEGORIAS_DE_GASTO;

interface FormaEscrita {
  readonly nombre: string;
  readonly veces: number;
  readonly ultima: string;
}

function formaPreferida(una: FormaEscrita, otra: FormaEscrita): FormaEscrita {
  const diferencia =
    otra.veces - una.veces ||
    otra.ultima.localeCompare(una.ultima) ||
    una.nombre.localeCompare(otra.nombre, 'es');
  return diferencia > 0 ? otra : una;
}

function lugarDeLaDelTaller(categoria: string): number {
  if (categoria.trim() === '') return 2;
  return claveDelNombre(categoria) === 'otro' ? 1 : 0;
}

function loQueMasUsas(
  necesidades: readonly NecesidadParaLasEstadisticas[],
  tipo: TipoDeNecesidad,
): LoQueMasUsas {
  const porClave = new Map<string, { trabajos: Set<string>; formas: Map<string, FormaEscrita> }>();
  for (const necesidad of necesidades) {
    if (necesidad.tipo !== tipo) continue;
    const nombre = necesidad.nombre.trim();
    const clave = claveDelNombre(nombre);
    if (clave === '') continue;
    const grupo = porClave.get(clave) ?? {
      trabajos: new Set<string>(),
      formas: new Map<string, FormaEscrita>(),
    };
    grupo.trabajos.add(necesidad.proyectoId);
    const forma = grupo.formas.get(nombre) ?? { nombre, veces: 0, ultima: necesidad.alta };
    grupo.formas.set(nombre, {
      nombre,
      veces: forma.veces + 1,
      ultima: necesidad.alta > forma.ultima ? necesidad.alta : forma.ultima,
    });
    porClave.set(clave, grupo);
  }
  const usos = [...porClave].map(([clave, { trabajos, formas }]) => ({
    clave,
    nombre: [...formas.values()].reduce(formaPreferida).nombre,
    trabajos: trabajos.size,
  }));
  usos.sort(
    (uno, otro) => otro.trabajos - uno.trabajos || uno.nombre.localeCompare(otro.nombre, 'es'),
  );
  return {
    primeros: usos.slice(0, PRIMEROS_DE_LO_QUE_MAS_USAS),
    mas: Math.max(0, usos.length - PRIMEROS_DE_LO_QUE_MAS_USAS),
  };
}

export function loQueGastaste(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
): LoQueGastaste {
  const deLosTrabajos = base.gastosDeLosTrabajos.filter((gasto) =>
    estaEnElRango(gasto.fecha, resuelto.dias),
  );
  const delTaller = base.gastosDelTaller.filter((gasto) =>
    estaEnElRango(gasto.fecha, resuelto.dias),
  );
  const enLosTrabajos = sumaDe(deLosTrabajos.map((gasto) => gasto.monto));
  const enElTaller = sumaDe(delTaller.map((gasto) => gasto.monto));
  const total = sumar(enLosTrabajos, enElTaller);

  const porCategoria = acumular(deLosTrabajos, (gasto) => gasto.categoria);
  const trabajos = [...porCategoria]
    .map(([categoria, { monto, gastos }]) => ({
      categoria,
      monto,
      gastos,
      deCada100: deCadaCien(monto, total),
    }))
    .sort(
      (una, otra) =>
        lugarDeLaCategoria(una.categoria) - lugarDeLaCategoria(otra.categoria) ||
        otra.monto - una.monto ||
        ORDEN_DE_LAS_CATEGORIAS.indexOf(una.categoria) -
          ORDEN_DE_LAS_CATEGORIAS.indexOf(otra.categoria),
    );

  const porLaDelTaller = acumular(delTaller, (gasto) => gasto.categoria.trim());
  const taller = [...porLaDelTaller]
    .map(([categoria, { monto, gastos }]) => ({
      categoria,
      monto,
      gastos,
      deCada100: deCadaCien(monto, total),
    }))
    .sort(
      (una, otra) =>
        lugarDeLaDelTaller(una.categoria) - lugarDeLaDelTaller(otra.categoria) ||
        otra.monto - una.monto ||
        una.categoria.localeCompare(otra.categoria, 'es'),
    );

  const usadas = base.necesidades.filter((necesidad) =>
    estaEnElRango(necesidad.alta, resuelto.dias),
  );
  return {
    total,
    enLosTrabajos,
    enElTaller,
    sinCategoria: porCategoria.get(null)?.monto ?? CERO,
    trabajos,
    taller,
    materiales: loQueMasUsas(usadas, 'material'),
    herrajes: loQueMasUsas(usadas, 'herraje'),
  };
}

export type ComoLlego = 'a-tiempo' | 'tarde' | 'sin-fecha';

export interface PuntoDeEntrega {
  readonly id: string;
  readonly titulo: string;
  readonly tipo: string | null;
  readonly entregado: string;
  readonly dias: number;
  readonly como: ComoLlego;
  readonly prometido: string | null;
  readonly atraso: number;
}

export interface TipoConSuMediana {
  readonly grupo: GrupoPorTipo;
  readonly mediana: number;
  readonly dias: readonly number[];
}

export interface LasEntregas {
  readonly entregados: number;
  readonly demora: ResumenDeDias;
  readonly faltan: number;
  readonly puntos: readonly PuntoDeEntrega[];
  readonly aTiempo: Cuenta;
  readonly porTipo: readonly TipoConSuMediana[];
  readonly deAUno: readonly PuntoDeEntrega[];
  readonly resumen: AnalisisDeEntregas;
}

function comoLlego(fila: FilaDelAnalisis): ComoLlego {
  if (fila.cumplida === null) return 'sin-fecha';
  return fila.cumplida ? 'a-tiempo' : 'tarde';
}

function puntoDe(fila: FilaDelAnalisis, dias: number): PuntoDeEntrega {
  return {
    id: fila.id,
    titulo: fila.titulo,
    tipo: fila.tipo,
    entregado: fila.entregado,
    dias,
    como: comoLlego(fila),
    prometido: fila.comprometida,
    atraso:
      fila.comprometida === null ? 0 : Math.max(0, diasEntre(fila.comprometida, fila.entregado)),
  };
}

export function lasEntregas(base: BaseDeLasEstadisticas, resuelto: PeriodoResuelto): LasEntregas {
  const filas = base.entregas.filas.filter((fila) => estaEnElRango(fila.entregado, resuelto.dias));
  const resumen = resumenDeEntregas({ filas, sinFecha: 0 });
  const puntos = filas
    .flatMap((fila) => (fila.demora === null ? [] : [puntoDe(fila, fila.demora)]))
    .sort((uno, otro) => uno.dias - otro.dias || uno.id.localeCompare(otro.id));
  const conFecha = filas.filter((fila) => fila.cumplida !== null);
  const porTipo = resumen.porTipo.flatMap((grupo): TipoConSuMediana[] =>
    grupo.demora.modo === 'mediana'
      ? [
          {
            grupo,
            mediana: grupo.demora.mediana,
            dias: puntos
              .filter((punto) => claveDelNombre(punto.tipo ?? '') === grupo.clave)
              .map((punto) => punto.dias),
          },
        ]
      : [],
  );
  const conMediana = new Set(porTipo.map(({ grupo }) => grupo.clave));
  return {
    entregados: filas.length,
    demora: resumirDias(puntos.map((punto) => punto.dias)),
    faltan: Math.max(0, UMBRAL_MEDIANA - puntos.length),
    puntos,
    aTiempo: cuentaDe(conFecha.filter((fila) => fila.cumplida === true).length, conFecha.length),
    porTipo,
    deAUno:
      porTipo.length === 0
        ? []
        : puntos.filter((punto) => !conMediana.has(claveDelNombre(punto.tipo ?? ''))),
    resumen,
  };
}

export type DondeEstaHoy = 'trabajo' | 'perdida' | 'abierta';

export interface ConsultaDelPeriodo {
  readonly proyectoId: string;
  readonly clienteId: string;
  readonly titulo: string;
  readonly entro: string;
  readonly estado: EstadoProyecto;
  readonly donde: DondeEstaHoy;
  readonly llegoAlPresupuesto: boolean;
}

export interface LasConsultas {
  readonly consultas: number;
  readonly presupuestos: number;
  readonly trabajos: number;
  readonly perdidas: number;
  readonly perdidasDespues: number;
  readonly perdidasAntes: number;
  readonly abiertas: number;
  readonly aprobados: number;
  readonly perdidos: number;
  readonly esperan: number;
  readonly aprobadas: Cuenta;
  readonly modo: 'embudo' | 'casos';
  readonly modoDeLosPresupuestos: 'puntos' | 'barra';
  readonly alPresupuesto: ResumenDeDias;
  readonly aLaRespuesta: ResumenDeDias;
  readonly antesDelRegistro: boolean;
  readonly cohorte: readonly ConsultaDelPeriodo[];
}

function dondeEsta(estado: EstadoProyecto): DondeEstaHoy {
  if (SON_TRABAJO.includes(estado)) return 'trabajo';
  return estado === 'perdido' ? 'perdida' : 'abierta';
}

export function lasConsultas(base: BaseDeLasEstadisticas, resuelto: PeriodoResuelto): LasConsultas {
  const cohorte = base.consultas
    .filter((consulta) => estaEnElRango(consulta.entro, resuelto.dias))
    .map((consulta) => ({
      ...consulta,
      donde: dondeEsta(consulta.estado),
      llegoAlPresupuesto: consulta.presupuesto !== null || consulta.aprobada,
    }));
  const cuantas = (filtro: (consulta: (typeof cohorte)[number]) => boolean) =>
    cohorte.filter(filtro).length;
  const presupuestos = cuantas((consulta) => consulta.llegoAlPresupuesto);
  const aprobados = cuantas(
    (consulta) => consulta.llegoAlPresupuesto && consulta.donde === 'trabajo',
  );
  const perdidos = cuantas(
    (consulta) => consulta.llegoAlPresupuesto && consulta.donde === 'perdida',
  );

  return {
    consultas: cohorte.length,
    presupuestos,
    trabajos: cuantas((consulta) => consulta.donde === 'trabajo'),
    perdidas: cuantas((consulta) => consulta.donde === 'perdida'),
    perdidasDespues: perdidos,
    perdidasAntes: cuantas(
      (consulta) => !consulta.llegoAlPresupuesto && consulta.donde === 'perdida',
    ),
    abiertas: cuantas((consulta) => consulta.donde === 'abierta'),
    aprobados,
    perdidos,
    esperan: cuantas((consulta) => consulta.llegoAlPresupuesto && consulta.donde === 'abierta'),
    aprobadas: cuentaDe(aprobados, presupuestos),
    modo: cohorte.length >= UMBRAL_DEL_EMBUDO ? 'embudo' : 'casos',
    modoDeLosPresupuestos: presupuestos <= PUNTOS_DE_LA_TASA ? 'puntos' : 'barra',
    alPresupuesto: resumirDias(
      cohorte.flatMap((consulta) =>
        consulta.nacio !== 'presupuesto_enviado' && consulta.presupuesto !== null
          ? [diasEntre(consulta.entro, consulta.presupuesto)]
          : [],
      ),
    ),
    aLaRespuesta: resumirDias(
      cohorte.flatMap((consulta) =>
        consulta.presupuesto !== null && consulta.respuesta !== null
          ? [diasEntre(consulta.presupuesto, consulta.respuesta)]
          : [],
      ),
    ),
    antesDelRegistro: resuelto.dias.desde < ETAPAS_ANOTADAS_DESDE,
    cohorte: cohorte
      .map(({ proyectoId, clienteId, titulo, entro, estado, donde, llegoAlPresupuesto }) => ({
        proyectoId,
        clienteId,
        titulo,
        entro,
        estado,
        donde,
        llegoAlPresupuesto,
      }))
      .sort(
        (una, otra) =>
          otra.entro.localeCompare(una.entro) ||
          una.titulo.localeCompare(otra.titulo, 'es') ||
          una.proyectoId.localeCompare(otra.proyectoId),
      ),
  };
}

export interface ConformesDeUnaPregunta {
  readonly resultado: ResultadoDePregunta;
  readonly conformes: Cuenta;
}

export interface LasOpiniones {
  readonly enviadas: number;
  readonly contestadas: number;
  readonly titular: ResultadoDePregunta | null;
  readonly conformes: Cuenta | null;
  readonly tiempos: ConformesDeUnaPregunta | null;
  readonly trato: ConformesDeUnaPregunta | null;
}

function conformesDe(resultado: ResultadoDePregunta): Cuenta {
  return cuentaDe(
    resultado.conteos
      .filter((conteo) => conteo.paso.valor >= PASO_CONFORME)
      .reduce((suma, conteo) => suma + conteo.n, 0),
    resultado.n,
  );
}

function deLaEscala(
  preguntas: readonly ResultadoDePregunta[],
  escala: 'tiempos' | 'trato',
): ConformesDeUnaPregunta | null {
  const resultado = preguntas.find(
    (una) => una.pregunta.tipo === 'escala5' && una.pregunta.escala === escala,
  );
  return resultado === undefined ? null : { resultado, conformes: conformesDe(resultado) };
}

export function lasOpiniones(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
  contexto: ContextoDeLasEstadisticas,
): LasOpiniones {
  const trabajos = new Set(
    base.pedidos
      .filter(({ pedido }) => estaEnElRango(pedido.envio.enviadaEl, resuelto.dias))
      .map(({ proyectoId }) => proyectoId),
  );
  const encuestas = base.opiniones.encuestas.filter((encuesta) =>
    trabajos.has(encuesta.proyectoId),
  );
  const ids = new Set(encuestas.map((encuesta) => encuesta.id));
  const resumen = resumenDeOpiniones(
    {
      preguntas: base.opiniones.preguntas,
      encuestas,
      respuestas: base.opiniones.respuestas.filter((respuesta) => ids.has(respuesta.encuestaId)),
      trabajos: base.opiniones.trabajos,
    },
    contexto.hoy,
    contexto.escalas,
  );
  const titular = resumen.preguntas.find((resultado) => resultado.pregunta.titular) ?? null;
  return {
    enviadas: resumen.enviadas,
    contestadas: resumen.contestadas,
    titular,
    conformes: titular?.pregunta.tipo === 'escala5' ? conformesDe(titular) : null,
    tiempos: deLaEscala(resumen.preguntas, 'tiempos'),
    trato: deLaEscala(resumen.preguntas, 'trato'),
  };
}

export interface EstadisticasDelPeriodo {
  readonly dejaron: LoQueTeDejaron;
  readonly gastos: LoQueGastaste;
  readonly entregas: LasEntregas;
  readonly consultas: LasConsultas;
  readonly opiniones: LasOpiniones;
}

export function estadisticasDelPeriodo(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
  columnas: readonly ColumnaDelPeriodo[],
  contexto: ContextoDeLasEstadisticas,
): EstadisticasDelPeriodo {
  return {
    dejaron: loQueTeDejaron(base, resuelto, columnas, contexto),
    gastos: loQueGastaste(base, resuelto),
    entregas: lasEntregas(base, resuelto),
    consultas: lasConsultas(base, resuelto),
    opiniones: lasOpiniones(base, resuelto, contexto),
  };
}

export interface TarjetaDeLaEntrega {
  readonly demora: ResumenDeDias;
  readonly aTiempo: Cuenta;
  readonly puntos: readonly ComoLlego[];
}

export interface TarjetaDeLosPresupuestos {
  readonly aprobadas: Cuenta;
  readonly esperan: number;
  readonly puntos: readonly DondeEstaHoy[];
}

export interface ResumenDelPeriodo {
  readonly dejaron: LoQueTeDejaron;
  readonly gastaste: Money | null;
  readonly entrega: TarjetaDeLaEntrega | null;
  readonly presupuestos: TarjetaDeLosPresupuestos | null;
  readonly conformes: Cuenta | null;
}

function conPuntos<T>(cuenta: Cuenta, puntos: readonly T[]): readonly T[] {
  return cuenta.porcentaje === null ? puntos : [];
}

export function resumenDelPeriodo(estadisticas: EstadisticasDelPeriodo): ResumenDelPeriodo {
  const { dejaron, gastos, entregas, consultas, opiniones } = estadisticas;
  const hayGastos = gastos.trabajos.length + gastos.taller.length > 0;
  return {
    dejaron,
    gastaste: hayGastos ? gastos.total : null,
    entrega:
      entregas.puntos.length === 0
        ? null
        : {
            demora: entregas.demora,
            aTiempo: entregas.aTiempo,
            puntos: conPuntos(
              entregas.aTiempo,
              entregas.puntos
                .filter((punto) => punto.como !== 'sin-fecha')
                .map((punto) => punto.como),
            ),
          },
    presupuestos:
      consultas.presupuestos === 0
        ? null
        : {
            aprobadas: consultas.aprobadas,
            esperan: consultas.esperan,
            puntos: conPuntos(consultas.aprobadas, [
              ...Array.from({ length: consultas.aprobados }, (): DondeEstaHoy => 'trabajo'),
              ...Array.from({ length: consultas.perdidos }, (): DondeEstaHoy => 'perdida'),
              ...Array.from({ length: consultas.esperan }, (): DondeEstaHoy => 'abierta'),
            ]),
          },
    conformes:
      opiniones.conformes !== null && opiniones.conformes.n > 0 ? opiniones.conformes : null,
  };
}

export type EstadoEnCurso =
  | { readonly cual: 'listo' }
  | { readonly cual: 'atrasado'; readonly dias: number }
  | { readonly cual: 'paso'; readonly dias: number };

export interface FechaPrometida {
  readonly fecha: string;
  readonly cual: 'comprometida' | 'estimada';
}

export interface TrabajoEnCurso {
  readonly id: string;
  readonly titulo: string;
  readonly clienteId: string;
  readonly dias: number | null;
  readonly prometido: FechaPrometida | null;
  readonly hastaLaPromesa: number | null;
  readonly estado: EstadoEnCurso | null;
}

export interface PorCobrar {
  readonly id: string;
  readonly titulo: string;
  readonly clienteId: string;
  readonly saldo: Plata;
  readonly entregado: string | null;
  readonly dias: number | null;
}

export interface LoQueViene {
  readonly enCurso: readonly TrabajoEnCurso[];
  readonly listos: number;
  readonly normal: number | null;
  readonly porCobrar: readonly PorCobrar[];
  readonly teDeben: readonly Plata[];
}

function prometidoDe(trabajo: TrabajoParaLasEstadisticas): FechaPrometida | null {
  if (trabajo.entregaComprometida !== null) {
    return { fecha: trabajo.entregaComprometida, cual: 'comprometida' };
  }
  return trabajo.entregaEstimada === null
    ? null
    : { fecha: trabajo.entregaEstimada, cual: 'estimada' };
}

function estadoEnCurso(
  trabajo: TrabajoParaLasEstadisticas,
  dias: number | null,
  normal: number | null,
  hoy: string,
): EstadoEnCurso | null {
  if (trabajo.listo !== null) return { cual: 'listo' };
  if (trabajo.entregaComprometida !== null && trabajo.entregaComprometida < hoy) {
    return { cual: 'atrasado', dias: diasEntre(trabajo.entregaComprometida, hoy) };
  }
  if (normal !== null && dias !== null && dias > normal) return { cual: 'paso', dias: normal };
  return null;
}

function porFechaPrimero(una: string | null, otra: string | null): number {
  if (una === otra) return 0;
  if (una === null) return 1;
  if (otra === null) return -1;
  return una.localeCompare(otra);
}

export function lasEntregasNormales(base: BaseDeLasEstadisticas, hoy: string): ResumenDeDias {
  const desde = `${correrMes(mesDe(hoy), 1 - MESES_DE_LO_NORMAL)}-01`;
  return resumirDias(
    base.entregas.filas.flatMap((fila) =>
      fila.demora === null || fila.entregado < desde || fila.entregado > hoy ? [] : [fila.demora],
    ),
  );
}

export function loQueViene(base: BaseDeLasEstadisticas, hoy: string): LoQueViene {
  const lasNormales = lasEntregasNormales(base, hoy);
  const normal = lasNormales.modo === 'mediana' ? lasNormales.mediana : null;
  const enCurso = base.trabajos
    .filter((trabajo) => trabajo.estado === 'en_curso')
    .map((trabajo): TrabajoEnCurso => {
      const dias = trabajo.inicio === null ? null : diasEntre(trabajo.inicio, hoy);
      const prometido = prometidoDe(trabajo);
      return {
        id: trabajo.id,
        titulo: trabajo.titulo,
        clienteId: trabajo.clienteId,
        dias,
        prometido,
        hastaLaPromesa:
          trabajo.inicio === null || prometido === null
            ? null
            : diasEntre(trabajo.inicio, prometido.fecha),
        estado: estadoEnCurso(trabajo, dias, normal, hoy),
      };
    })
    .sort(
      (uno, otro) =>
        porFechaPrimero(uno.prometido?.fecha ?? null, otro.prometido?.fecha ?? null) ||
        uno.titulo.localeCompare(otro.titulo, 'es') ||
        uno.id.localeCompare(otro.id),
    );
  const porCobrar = base.trabajos
    .filter((trabajo) => trabajo.estado === 'entregado')
    .flatMap((trabajo): PorCobrar[] => {
      const falta = (trabajo.precio ?? 0) - trabajo.descontado;
      return falta > 0
        ? [
            {
              id: trabajo.id,
              titulo: trabajo.titulo,
              clienteId: trabajo.clienteId,
              saldo: plata(trabajo.moneda, falta),
              entregado: trabajo.entregado,
              dias: trabajo.entregado === null ? null : diasEntre(trabajo.entregado, hoy),
            },
          ]
        : [];
    })
    .sort(
      (uno, otro) =>
        porFechaPrimero(uno.entregado, otro.entregado) ||
        uno.titulo.localeCompare(otro.titulo, 'es') ||
        uno.id.localeCompare(otro.id),
    );
  return {
    enCurso,
    listos: enCurso.filter((trabajo) => trabajo.estado?.cual === 'listo').length,
    normal,
    porCobrar,
    teDeben: totalesPorMoneda(porCobrar.map((uno) => uno.saldo)).map(({ total }) => total),
  };
}

export function hayAlgoParaContar(base: BaseDeLasEstadisticas, viene: LoQueViene): boolean {
  return base.primerMes !== null || viene.enCurso.length > 0 || viene.porCobrar.length > 0;
}
