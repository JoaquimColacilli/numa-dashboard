import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import type { CambiosDeAjustes, CambiosDeTesoro, FilaDe, Tesoro, TesoroNuevo } from '@/shared/api';
import {
  formatearPorcentaje,
  ICONOS_DE_TESORO,
  parsearPorcentaje,
  type TintaDeTesoro,
} from '@/shared/lib';
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

const NOMBRE_DEL_ICONO: Readonly<Record<string, string>> = {
  receipt: 'Recibo',
  package: 'Paquete',
  'building-2': 'Edificio',
  wrench: 'Llave',
  vault: 'Caja fuerte',
  landmark: 'Banco',
  coins: 'Monedas',
  'trending-up': 'Flecha que sube',
  'piggy-bank': 'Chanchito',
  car: 'Auto',
  truck: 'Camión',
  plane: 'Avión',
  'graduation-cap': 'Birrete',
  gift: 'Regalo',
  shield: 'Escudo',
  sprout: 'Brote',
  house: 'Casa',
  hammer: 'Martillo',
  church: 'Iglesia',
};

export function nombreDelIcono(icono: NombreDeIcono): string {
  return NOMBRE_DEL_ICONO[icono] ?? icono;
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
  rinde: string;
}

export interface ErroresDelTesoro {
  nombre?: string;
  descripcion?: string;
  rinde?: string;
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

export function borradorNuevo(tesoros: readonly ConTinta[]): BorradorDelTesoro {
  return {
    nombre: '',
    descripcion: '',
    moneda: MONEDA_DEL_TALLER,
    tinta: tintaSugerida(tesoros),
    icono: 'vault',
    meta: null,
    rinde: '0',
  };
}

export function borradorDe(tesoro: TesoroDelTaller): BorradorDelTesoro {
  return {
    nombre: tesoro.nombre,
    descripcion: tesoro.descripcion,
    moneda: tesoro.moneda,
    tinta: tesoro.tinta,
    icono: tesoro.icono,
    meta: tesoro.meta?.importe ?? null,
    rinde: formatearPorcentaje(tesoro.rindeAnualBp ?? 0),
  };
}

function largo(texto: string): number {
  return Array.from(texto).length;
}

export function revisarElTesoro(
  borrador: BorradorDelTesoro,
  { conRinde }: { conRinde: boolean },
): ErroresDelTesoro {
  const errores: ErroresDelTesoro = {};
  const nombre = borrador.nombre.trim();
  if (nombre === '' || largo(nombre) > LARGO_MAXIMO_DEL_NOMBRE) {
    errores.nombre = `Ponele un nombre, de hasta ${String(LARGO_MAXIMO_DEL_NOMBRE)} letras.`;
  }
  if (largo(borrador.descripcion.trim()) > LARGO_MAXIMO_DE_LA_DESCRIPCION) {
    errores.descripcion = `Hasta ${String(LARGO_MAXIMO_DE_LA_DESCRIPCION)} letras.`;
  }
  if (conRinde && parsearPorcentaje(borrador.rinde) === undefined) {
    errores.rinde = 'Escribí el rinde como un porcentaje, por ejemplo 40. Podés dejarlo en 0.';
  }
  return errores;
}

export function hayErrores(errores: ErroresDelTesoro): boolean {
  return Object.values(errores).some((error) => error !== undefined);
}

function metaParaGuardar(meta: number | null): number | null {
  return meta === null || meta <= 0 ? null : meta;
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
    rinde_anual_bp: null,
    orden,
    moneda: borrador.moneda,
  };
}

const COLUMNAS_QUE_SE_EDITAN = [
  'nombre',
  'descripcion',
  'tinta',
  'icono',
  'meta_centavos',
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
    };
  }
  return {
    nombre: tesoro.nombre,
    descripcion: tesoro.descripcion,
    tinta: tesoro.tinta,
    icono: tesoro.icono,
    meta_centavos: tesoro.clave === null ? (tesoro.meta?.importe ?? null) : null,
  };
}

export interface Diferencias<T> {
  cambios: T;
  previos: T;
}

export function cambiosDelTesoro(
  actual: DatosQueSeEditan,
  clave: Tesoro | null,
  borrador: BorradorDelTesoro,
): Diferencias<CambiosDeTesoro> {
  const propuesto: CambiosDeTesoro = {
    nombre: borrador.nombre.trim(),
    descripcion: borrador.descripcion.trim(),
    tinta: borrador.tinta,
    icono: borrador.icono,
    ...(clave === null ? { meta_centavos: metaParaGuardar(borrador.meta) } : {}),
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

export function cambiosDeCocos(
  ajustes: Pick<FilaDe<'ajustes'>, 'meta_cocos_centavos' | 'tasa_cocos_anual_bp'>,
  borrador: BorradorDelTesoro,
): Diferencias<CambiosDeAjustes> {
  const cambios: CambiosDeAjustes = {};
  const previos: CambiosDeAjustes = {};
  const meta = borrador.meta ?? 0;
  if (meta !== ajustes.meta_cocos_centavos) {
    cambios.meta_cocos_centavos = meta;
    previos.meta_cocos_centavos = ajustes.meta_cocos_centavos;
  }
  const rinde = parsearPorcentaje(borrador.rinde);
  if (rinde !== undefined && rinde !== ajustes.tasa_cocos_anual_bp) {
    cambios.tasa_cocos_anual_bp = rinde;
    previos.tasa_cocos_anual_bp = ajustes.tasa_cocos_anual_bp;
  }
  return { cambios, previos };
}

export function hayDiferencias<T extends object>({ cambios }: Diferencias<T>): boolean {
  return Object.keys(cambios).length > 0;
}

export function bajadaDeLaEdicion(clave: Tesoro | null): string {
  if (clave === 'cocos') return 'Nombre, color, ícono, meta y rinde';
  if (clave === null) return 'Nombre, color, ícono y meta';
  return 'Nombre, color e ícono';
}
