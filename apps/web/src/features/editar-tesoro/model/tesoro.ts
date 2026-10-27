import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import type { CambiosDeTesoro, FilaDe, Tesoro, TesoroNuevo } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { hoyEnElTaller, ICONOS_DE_TESORO, type TintaDeTesoro } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

export const LARGO_MAXIMO_DEL_NOMBRE = 24;
export const LARGO_MAXIMO_DE_LA_DESCRIPCION = 80;

export const TINTAS_EN_LA_HOJA: readonly TintaDeTesoro[] = [
  'grana',
  'mostaza',
  'petroleo',
  'ciruela',
  'hogar',
  'maun',
  'cocos',
  'diezmo',
];

export function nombreDelIcono(icono: NombreDeIcono): string {
  const nombres: Readonly<Record<string, string | undefined>> = mensajes().editarTesoro.iconos;
  return nombres[icono] ?? icono;
}

export function iconosParaElegir(actual: NombreDeIcono): NombreDeIcono[] {
  return ICONOS_DE_TESORO.includes(actual) ? [...ICONOS_DE_TESORO] : [actual, ...ICONOS_DE_TESORO];
}

export interface BorradorDelTesoro {
  nombre: string;
  descripcion: string;
  moneda: Moneda;
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
  meta: number | null;
  metaFecha: string;
}

export interface ErroresDelTesoro {
  nombre?: string;
  descripcion?: string;
  meta?: string;
  metaFecha?: string;
}

type ConTinta = Pick<TesoroDelTaller, 'id' | 'nombre' | 'tinta' | 'archivado'>;

export function quienUsaLaTinta<T extends ConTinta>(
  tesoros: readonly T[],
  tinta: TintaDeTesoro,
  excepto: string | null,
): T | undefined {
  return tesoros.find(
    (tesoro) => !tesoro.archivado && tesoro.tinta === tinta && tesoro.id !== excepto,
  );
}

export function tintaSugerida(tesoros: readonly ConTinta[]): TintaDeTesoro {
  return (
    TINTAS_EN_LA_HOJA.find((tinta) => quienUsaLaTinta(tesoros, tinta, null) === undefined) ??
    'grana'
  );
}

export function iconoDeFabrica(moneda: Moneda): NombreDeIcono {
  return moneda === MONEDA_DEL_TALLER ? 'vault' : 'banknote';
}

export function borradorNuevo(
  tesoros: readonly ConTinta[],
  moneda: Moneda = MONEDA_DEL_TALLER,
): BorradorDelTesoro {
  return {
    nombre: '',
    descripcion: '',
    moneda,
    tinta: tintaSugerida(tesoros),
    icono: iconoDeFabrica(moneda),
    meta: null,
    metaFecha: '',
  };
}

export function conLaMoneda(borrador: BorradorDelTesoro, moneda: Moneda): BorradorDelTesoro {
  const deFabrica = borrador.icono === iconoDeFabrica(borrador.moneda);
  return { ...borrador, moneda, icono: deFabrica ? iconoDeFabrica(moneda) : borrador.icono };
}

export function borradorDe(tesoro: TesoroDelTaller): BorradorDelTesoro {
  return {
    nombre: tesoro.nombre,
    descripcion: tesoro.descripcion,
    moneda: tesoro.moneda,
    tinta: tesoro.tinta,
    icono: tesoro.icono,
    meta: tesoro.meta?.importe ?? null,
    metaFecha: tesoro.metaFecha ?? '',
  };
}

export function tieneMeta(borrador: Pick<BorradorDelTesoro, 'meta'>): boolean {
  return borrador.meta !== null && borrador.meta > 0;
}

function largo(texto: string): number {
  return Array.from(texto).length;
}

export function revisarElTesoro(
  borrador: BorradorDelTesoro,
  { pideMeta = false, hoy = hoyEnElTaller() }: { pideMeta?: boolean; hoy?: string } = {},
): ErroresDelTesoro {
  const textos = mensajes().editarTesoro.errores;
  const errores: ErroresDelTesoro = {};
  const nombre = borrador.nombre.trim();
  if (nombre === '' || largo(nombre) > LARGO_MAXIMO_DEL_NOMBRE) {
    errores.nombre = textos.nombre(LARGO_MAXIMO_DEL_NOMBRE);
  }
  if (largo(borrador.descripcion.trim()) > LARGO_MAXIMO_DE_LA_DESCRIPCION) {
    errores.descripcion = textos.descripcion(LARGO_MAXIMO_DE_LA_DESCRIPCION);
  }
  if (pideMeta && !tieneMeta(borrador)) errores.meta = textos.meta;
  if (borrador.metaFecha !== '') {
    if (!tieneMeta(borrador)) errores.metaFecha = textos.fechaSinMeta;
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(borrador.metaFecha) || borrador.metaFecha < hoy) {
      errores.metaFecha = textos.fechaDeLaMeta;
    }
  }
  return errores;
}

export function hayErrores(errores: ErroresDelTesoro): boolean {
  return Object.values(errores).some((error) => error !== undefined);
}

function metaParaGuardar(meta: number | null): number | null {
  return meta === null || meta <= 0 ? null : meta;
}

function fechaParaGuardar(borrador: Pick<BorradorDelTesoro, 'meta' | 'metaFecha'>): string | null {
  return tieneMeta(borrador) && borrador.metaFecha !== '' ? borrador.metaFecha : null;
}

export function ordenAlFinal(tesoros: readonly Pick<TesoroDelTaller, 'clave' | 'orden'>[]): number {
  const propios = tesoros.filter((tesoro) => tesoro.clave === null);
  return propios.length === 0 ? 0 : Math.max(...propios.map((tesoro) => tesoro.orden)) + 1;
}

export function tesoroNuevo(borrador: BorradorDelTesoro, id: string, orden: number): TesoroNuevo {
  return {
    id,
    nombre: borrador.nombre.trim(),
    descripcion: borrador.descripcion.trim(),
    tinta: borrador.tinta,
    icono: borrador.icono,
    meta_centavos: metaParaGuardar(borrador.meta),
    meta_fecha: fechaParaGuardar(borrador),
    orden,
    moneda: borrador.moneda,
  };
}

export function admiteMeta(clave: Tesoro | null): boolean {
  return clave === null || clave === 'cocos';
}

const COLUMNAS_QUE_SE_EDITAN = [
  'nombre',
  'descripcion',
  'tinta',
  'icono',
  'meta_centavos',
  'meta_fecha',
] as const satisfies readonly (keyof CambiosDeTesoro)[];

export type DatosQueSeEditan = Pick<FilaDe<'tesoros'>, (typeof COLUMNAS_QUE_SE_EDITAN)[number]>;

export function datosQueSeEditan(
  tesoro: TesoroDelTaller,
  fila: FilaDe<'tesoros'> | undefined,
): DatosQueSeEditan {
  if (fila) {
    return {
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      tinta: fila.tinta,
      icono: fila.icono,
      meta_centavos: fila.meta_centavos,
      meta_fecha: fila.meta_fecha,
    };
  }
  return {
    nombre: tesoro.nombre,
    descripcion: tesoro.descripcion,
    tinta: tesoro.tinta,
    icono: tesoro.icono,
    meta_centavos: admiteMeta(tesoro.clave) ? (tesoro.meta?.importe ?? null) : null,
    meta_fecha: admiteMeta(tesoro.clave) ? tesoro.metaFecha : null,
  };
}

export function metaQueVieneDeLosAjustes(
  tesoro: TesoroDelTaller,
  fila: FilaDe<'tesoros'> | undefined,
): number | null {
  if (tesoro.clave !== 'cocos' || fila === undefined || fila.meta_centavos !== null) return null;
  return tesoro.meta?.importe ?? null;
}

export interface Diferencias<T> {
  cambios: T;
  previos: T;
}

export function cambiosDelTesoro(
  actual: DatosQueSeEditan,
  conMeta: boolean,
  borrador: BorradorDelTesoro,
  deLosAjustes: number | null = null,
): Diferencias<CambiosDeTesoro> {
  const pedida = metaParaGuardar(borrador.meta);
  const vigente = metaParaGuardar(actual.meta_centavos ?? deLosAjustes);
  const meta = Object.is(pedida, vigente)
    ? actual.meta_centavos
    : (pedida ?? (deLosAjustes === null ? null : 0));
  const propuesto: CambiosDeTesoro = {
    nombre: borrador.nombre.trim(),
    descripcion: borrador.descripcion.trim(),
    tinta: borrador.tinta,
    icono: borrador.icono,
    ...(conMeta ? { meta_centavos: meta, meta_fecha: fechaParaGuardar(borrador) } : {}),
  };
  const cambios: CambiosDeTesoro = {};
  const previos: CambiosDeTesoro = {};
  for (const columna of COLUMNAS_QUE_SE_EDITAN) {
    if (!(columna in propuesto)) continue;
    const valor = propuesto[columna];
    const antes = actual[columna];
    if (Object.is(antes, valor)) continue;
    Object.assign(cambios, { [columna]: valor });
    Object.assign(previos, { [columna]: antes });
  }
  return { cambios, previos };
}

export function hayDiferencias<T extends object>({ cambios }: Diferencias<T>): boolean {
  return Object.keys(cambios).length > 0;
}

export function bajadaDeLaEdicion(conMeta: boolean): string {
  const { bajada } = mensajes().editarTesoro;
  return conMeta ? bajada.conMeta : bajada.deSiempre;
}
