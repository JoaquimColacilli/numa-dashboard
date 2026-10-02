import {
  CERO,
  cotizacionDelCambio,
  esDeLaMoneda,
  lineasDelLibro,
  MONEDA_DEL_TALLER,
  negar,
  plata,
  restar,
  sumar,
  totalesPorMoneda,
  type Cotizacion,
  type LineaDelLibro,
  type Moneda,
  type Money,
  type Plata,
  type Tesoro,
} from '@maun/domain';

import { datosDelLibro, filasDe, type Replica } from '@/shared/api';
import { mensajes, textosDelIdioma } from '@/shared/idioma';
import { mesDeLaFecha, TESORO, type TintaDeTesoro } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

import { categoriaEnPantalla, claseDe } from './clases';

export type SentidoDeLinea = 'entra' | 'sale' | 'mueve';

export type BloqueoDeLinea = 'del-proyecto' | 'ajuste';

export const TODOS_LOS_TESOROS = 'todos';

export const MOTIVO_DEL_BLOQUEO: Readonly<Record<BloqueoDeLinea, string>> = textosDelIdioma(
  () => mensajes().movimiento.libro.motivoDelBloqueo,
);

export interface TesoroDeLaLinea {
  id: string;
  clave: Tesoro | null;
  moneda: Moneda;
  nombre: string;
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
}

export interface LineaDelTaller extends LineaDelLibro {
  clave: string;
  etiqueta: string;
  detalle: string;
  proyectoTitulo: string | null;
  sentido: SentidoDeLinea;
  tesoroDesde: TesoroDeLaLinea | null;
  tesoroHacia: TesoroDeLaLinea | null;
  tesoroPrincipal: TesoroDeLaLinea;
  bloqueo: BloqueoDeLinea | null;
}

const OTRO_TESORO = {
  moneda: MONEDA_DEL_TALLER,
  tinta: 'maun',
  icono: 'vault',
} as const;

function sentidoDe(linea: LineaDelLibro): SentidoDeLinea {
  if (linea.desdeId !== null && linea.haciaId !== null) return 'mueve';
  return linea.haciaId === null ? 'sale' : 'entra';
}

function etiquetaDe(
  linea: LineaDelLibro,
  desde: TesoroDeLaLinea | null,
  hacia: TesoroDeLaLinea | null,
): string {
  const textos = mensajes().movimiento.libro;
  const derivadas: Readonly<Record<string, string | undefined>> = textos.etiquetaDerivada;
  if (linea.origen !== 'manual') return derivadas[linea.concepto] ?? textos.delTrabajo;
  if (linea.concepto === 'ajuste') return textos.ajusteDeSaldo;
  return (
    claseDe(linea.concepto, linea.desde, linea.hacia, {
      ...(desde === null ? {} : { desde: desde.moneda }),
      ...(hacia === null ? {} : { hacia: hacia.moneda }),
    })?.etiqueta ?? textos.movimiento
  );
}

function bloqueoDe(linea: LineaDelLibro): BloqueoDeLinea | null {
  if (linea.origen !== 'manual') return 'del-proyecto';
  return linea.concepto === 'ajuste' ? 'ajuste' : null;
}

function deSiempre(clave: Tesoro): TesoroDeLaLinea {
  const datos = TESORO[clave];
  return {
    id: clave,
    clave,
    moneda: MONEDA_DEL_TALLER,
    nombre: datos.nombre,
    tinta: clave,
    icono: datos.icono,
  };
}

function nombrador(
  tesoros: readonly TesoroDeLaLinea[],
): (id: string | null, clave: Tesoro | null) => TesoroDeLaLinea | null {
  const porId = new Map(tesoros.map((tesoro) => [tesoro.id, tesoro]));
  const porClave = new Map(
    tesoros.flatMap((tesoro) => (tesoro.clave === null ? [] : [[tesoro.clave, tesoro] as const])),
  );
  return (id, clave) => {
    const encontrado =
      (id === null ? undefined : porId.get(id)) ??
      (clave === null ? undefined : porClave.get(clave));
    if (encontrado) return encontrado;
    if (clave !== null) return { ...deSiempre(clave), id: id ?? clave };
    if (id === null) return null;
    return { id, clave: null, nombre: mensajes().movimiento.libro.otroTesoro, ...OTRO_TESORO };
  };
}

export function lineasDelTaller(
  replica: Replica,
  tesoros: readonly TesoroDeLaLinea[],
): LineaDelTaller[] {
  const titulos = new Map(
    filasDe(replica, 'proyectos').map((proyecto) => [proyecto.id, proyecto.titulo]),
  );
  const nombrar = nombrador(tesoros);
  const maun = nombrar(null, 'maun') ?? deSiempre('maun');

  return lineasDelLibro(datosDelLibro(replica))
    .map((linea) => {
      const sentido = sentidoDe(linea);
      const proyectoTitulo =
        linea.proyectoId === null ? null : (titulos.get(linea.proyectoId) ?? null);
      const tesoroDesde = nombrar(linea.desdeId, linea.desde);
      const tesoroHacia = nombrar(linea.haciaId, linea.hacia);
      return {
        ...linea,
        clave: `${linea.origen}:${linea.asientoId}:${linea.concepto}`,
        etiqueta: etiquetaDe(linea, tesoroDesde, tesoroHacia),
        detalle: linea.descripcion.trim(),
        proyectoTitulo,
        sentido,
        tesoroDesde,
        tesoroHacia,
        tesoroPrincipal: (sentido === 'sale' ? tesoroDesde : tesoroHacia) ?? maun,
        bloqueo: bloqueoDe(linea),
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.asientoId.localeCompare(a.asientoId));
}

export function efectoDeLaLinea(linea: LineaDelLibro, tesoro: string): Money<Moneda> {
  if (linea.yaEnLaApertura) return CERO;
  if (tesoro === TODOS_LOS_TESOROS) {
    if (linea.desdeId !== null && linea.haciaId !== null) return CERO;
    return linea.haciaId === null ? negar(linea.monto) : linea.montoHacia;
  }
  let total: Money<Moneda> = CERO;
  if (linea.haciaId === tesoro) total = sumar(total, linea.montoHacia);
  if (linea.desdeId === tesoro) total = restar(total, linea.monto);
  return total;
}

type LadosDeLaLinea = Pick<LineaDelTaller, 'haciaId' | 'sentido' | 'tesoroDesde' | 'tesoroHacia'>;

export function monedaDelEfecto(linea: LadosDeLaLinea, tesoro: string): Moneda {
  const entra = tesoro === TODOS_LOS_TESOROS ? linea.sentido === 'entra' : linea.haciaId === tesoro;
  return (entra ? linea.tesoroHacia : linea.tesoroDesde)?.moneda ?? MONEDA_DEL_TALLER;
}

export function efectoEnSuMoneda(linea: LineaDelLibro & LadosDeLaLinea, tesoro: string): Plata {
  return plata(monedaDelEfecto(linea, tesoro), efectoDeLaLinea(linea, tesoro));
}

export function montoDeLaLinea(linea: LineaDelLibro & LadosDeLaLinea): Plata {
  return linea.sentido === 'entra'
    ? plata(linea.tesoroHacia?.moneda ?? MONEDA_DEL_TALLER, linea.montoHacia)
    : plata(linea.tesoroDesde?.moneda ?? MONEDA_DEL_TALLER, linea.monto);
}

export function montoQueEntra(linea: LineaDelLibro & LadosDeLaLinea): Plata {
  return plata(linea.tesoroHacia?.moneda ?? MONEDA_DEL_TALLER, linea.montoHacia);
}

export function esUnCambioDeMoneda(linea: LadosDeLaLinea): boolean {
  return (
    linea.sentido === 'mueve' &&
    linea.tesoroDesde !== null &&
    linea.tesoroHacia !== null &&
    linea.tesoroDesde.moneda !== linea.tesoroHacia.moneda
  );
}

export function cotizacionDeLaLinea(linea: LineaDelLibro & LadosDeLaLinea): Cotizacion | null {
  if (!esUnCambioDeMoneda(linea)) return null;
  const sale = montoDeLaLinea(linea);
  const entra = montoQueEntra(linea);
  if (esDeLaMoneda(sale, MONEDA_DEL_TALLER) && esDeLaMoneda(entra, 'USD')) {
    return cotizacionDelCambio(sale.importe, entra.importe);
  }
  if (esDeLaMoneda(sale, 'USD') && esDeLaMoneda(entra, MONEDA_DEL_TALLER)) {
    return cotizacionDelCambio(entra.importe, sale.importe);
  }
  return null;
}

export const TODOS_LOS_MESES = 'todos';

export interface FiltroDelLibro {
  tesoro: string;
  sentido: SentidoDeLinea | 'todos';
  mes: string;
  texto: string;
}

export function filtroInicial(mes: string): FiltroDelLibro {
  return { tesoro: TODOS_LOS_TESOROS, sentido: 'todos', mes, texto: '' };
}

export function hayFiltroPuesto(filtro: FiltroDelLibro, mes: string): boolean {
  return (
    filtro.tesoro !== TODOS_LOS_TESOROS ||
    filtro.sentido !== 'todos' ||
    filtro.mes !== mes ||
    filtro.texto.trim() !== ''
  );
}

function coincideElTexto(linea: LineaDelTaller, texto: string): boolean {
  const buscado = texto.trim().toLowerCase();
  if (buscado === '') return true;
  const categoria = categoriaEnPantalla(linea.categoria);
  return [
    linea.detalle,
    linea.categoria,
    ...(categoria === linea.categoria ? [] : [categoria]),
    linea.etiqueta,
    linea.proyectoTitulo ?? '',
  ]
    .join(' ')
    .toLowerCase()
    .includes(buscado);
}

function esDelPeriodo(linea: LineaDelLibro, mes: string): boolean {
  return mes === TODOS_LOS_MESES || mesDeLaFecha(linea.fecha) === mes;
}

export function filtrarLineas(
  lineas: readonly LineaDelTaller[],
  filtro: FiltroDelLibro,
): LineaDelTaller[] {
  return lineas.filter(
    (linea) =>
      (filtro.tesoro === TODOS_LOS_TESOROS ||
        linea.desdeId === filtro.tesoro ||
        linea.haciaId === filtro.tesoro) &&
      (filtro.sentido === 'todos' || linea.sentido === filtro.sentido) &&
      esDelPeriodo(linea, filtro.mes) &&
      coincideElTexto(linea, filtro.texto),
  );
}

export function tesorosConMovimientoEn(
  lineas: readonly LineaDelLibro[],
  mes: string,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const linea of lineas) {
    if (!esDelPeriodo(linea, mes)) continue;
    if (linea.desdeId !== null) ids.add(linea.desdeId);
    if (linea.haciaId !== null) ids.add(linea.haciaId);
  }
  return ids;
}

export function mesesConMovimiento(lineas: readonly LineaDelTaller[], mesActual: string): string[] {
  const meses = new Set<string>([mesActual]);
  for (const linea of lineas) meses.add(mesDeLaFecha(linea.fecha));
  return [...meses].sort((a, b) => b.localeCompare(a));
}

export interface DiaDelLibro {
  fecha: string;
  netos: Plata[];
  lineas: LineaDelTaller[];
}

export function agruparPorDia(lineas: readonly LineaDelTaller[], tesoro: string): DiaDelLibro[] {
  const dias: { fecha: string; efectos: Plata[]; lineas: LineaDelTaller[] }[] = [];
  for (const linea of lineas) {
    let dia = dias.at(-1);
    if (!dia || dia.fecha !== linea.fecha) {
      dia = { fecha: linea.fecha, efectos: [], lineas: [] };
      dias.push(dia);
    }
    dia.lineas.push(linea);
    dia.efectos.push(efectoEnSuMoneda(linea, tesoro));
  }
  return dias.map(({ fecha, efectos, lineas: delDia }) => ({
    fecha,
    netos: totalesPorMoneda(efectos)
      .map(({ total }) => total)
      .filter((neto) => neto.importe !== 0),
    lineas: delDia,
  }));
}
