import {
  CERO,
  lineasDelLibro,
  negar,
  restar,
  sumar,
  type LineaDelLibro,
  type Moneda,
  type Money,
  type Tesoro,
} from '@maun/domain';

import { datosDelLibro, filasDe, type Replica } from '@/shared/api';
import { mesDeLaFecha, TESORO, type TintaDeTesoro } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

import { claseDe } from './clases';

export type SentidoDeLinea = 'entra' | 'sale' | 'mueve';

export type BloqueoDeLinea = 'del-proyecto' | 'ajuste';

export const TODOS_LOS_TESOROS = 'todos';

export const MOTIVO_DEL_BLOQUEO: Readonly<Record<BloqueoDeLinea, string>> = {
  'del-proyecto':
    'Este asiento lo genera el proyecto: sale de sus pagos, de sus gastos y del reparto que quedó congelado al cobrarlo. Para cambiarlo hay que corregir el proyecto.',
  ajuste:
    'Un ajuste no se edita: es la constancia de una corrección que ya se hizo. Si quedó mal, se compensa con otro ajuste en sentido contrario.',
};

export interface TesoroDeLaLinea {
  id: string;
  clave: Tesoro | null;
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

const ETIQUETA_DERIVADA: Readonly<Record<string, string>> = {
  cobro: 'Cobro del trabajo',
  gasto: 'Gasto del trabajo',
  diezmo: 'Diezmo del reparto',
  sueldo: 'Sueldo del reparto',
  fijos: 'Gastos fijos del reparto',
  prioridad: 'Paso del reparto',
  reparto: 'Parte del reparto',
};

const OTRO_TESORO = { nombre: 'Otro tesoro', tinta: 'maun', icono: 'vault' } as const;

function sentidoDe(linea: LineaDelLibro): SentidoDeLinea {
  if (linea.desdeId !== null && linea.haciaId !== null) return 'mueve';
  return linea.haciaId === null ? 'sale' : 'entra';
}

function etiquetaDe(linea: LineaDelLibro): string {
  if (linea.origen !== 'manual') return ETIQUETA_DERIVADA[linea.concepto] ?? 'Del trabajo';
  if (linea.concepto === 'ajuste') return 'Ajuste de saldo';
  return claseDe(linea.concepto, linea.desde, linea.hacia)?.etiqueta ?? 'Movimiento';
}

function bloqueoDe(linea: LineaDelLibro): BloqueoDeLinea | null {
  if (linea.origen !== 'manual') return 'del-proyecto';
  return linea.concepto === 'ajuste' ? 'ajuste' : null;
}

function deSiempre(clave: Tesoro): TesoroDeLaLinea {
  const datos = TESORO[clave];
  return { id: clave, clave, nombre: datos.nombre, tinta: clave, icono: datos.icono };
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
    return id === null ? null : { id, clave: null, ...OTRO_TESORO };
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
        etiqueta: etiquetaDe(linea),
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
  return [linea.detalle, linea.categoria, linea.etiqueta, linea.proyectoTitulo ?? '']
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
  neto: Money<Moneda>;
  lineas: LineaDelTaller[];
}

export function agruparPorDia(lineas: readonly LineaDelTaller[], tesoro: string): DiaDelLibro[] {
  const dias: DiaDelLibro[] = [];
  for (const linea of lineas) {
    let dia = dias.at(-1);
    if (!dia || dia.fecha !== linea.fecha) {
      dia = { fecha: linea.fecha, neto: CERO, lineas: [] };
      dias.push(dia);
    }
    dia.lineas.push(linea);
    dia.neto = sumar(dia.neto, efectoDeLaLinea(linea, tesoro));
  }
  return dias;
}
