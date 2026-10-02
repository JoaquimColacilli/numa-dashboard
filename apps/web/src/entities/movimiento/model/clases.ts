import { MONEDA_DEL_TALLER, type Fila, type Moneda, type Money, type Plata } from '@maun/domain';

import type { Tesoro, TipoMovimiento } from '@/shared/api';
import { mensajes, type Mensajes } from '@/shared/idioma';
import { rutaDeMovimientoNuevo } from '@/shared/lib';

export type GrupoDeMovimiento = 'ingreso' | 'gasto' | 'diezmo' | 'cocos' | 'entre' | 'dolares';

export type ClaseDeMovimiento =
  | 'ingreso_hogar'
  | 'ingreso_maun'
  | 'gasto_hogar'
  | 'gasto_maun'
  | 'gasto_tesoro'
  | 'pago_diezmo'
  | 'aporte_cocos'
  | 'retiro_cocos'
  | 'gasto_cocos'
  | 'entre_tesoros'
  | 'compra_de_dolares'
  | 'venta_de_dolares'
  | 'ingreso_en_dolares';

export type ClaseDeCambio = 'compra_de_dolares' | 'venta_de_dolares';

export interface DatosDeClase {
  id: ClaseDeMovimiento;
  grupo: GrupoDeMovimiento;
  etiqueta: string;
  corta: string;
  tipo: TipoMovimiento;
  desde: Tesoro | null;
  hacia: Tesoro | null;
  tesoro: Tesoro | null;
  eligeLosLados: boolean;
  eligeElTesoro: boolean;
  entraAlTesoro?: true;
  categorias: readonly string[];
  ejemplo: string;
}

type CategoriaDelCatalogo = keyof Mensajes['movimiento']['categorias'];

type TextosDeLaClase = keyof Mensajes['movimiento']['clases'];

function grupo(id: GrupoDeMovimiento): { id: GrupoDeMovimiento; etiqueta: string } {
  return {
    id,
    get etiqueta() {
      return mensajes().movimiento.grupos[id];
    },
  };
}

export const GRUPOS: readonly { id: GrupoDeMovimiento; etiqueta: string }[] = [
  grupo('ingreso'),
  grupo('gasto'),
  grupo('diezmo'),
  grupo('cocos'),
  grupo('entre'),
  grupo('dolares'),
];

const OTRA = 'Otro' satisfies CategoriaDelCatalogo;

export const QUE_DOLAR: readonly string[] = [
  'Oficial',
  'MEP',
  'Blue',
  'Cripto',
  OTRA,
] satisfies readonly CategoriaDelCatalogo[];

function conTextos(
  textos: TextosDeLaClase,
  datos: Omit<DatosDeClase, 'etiqueta' | 'corta' | 'ejemplo'>,
): DatosDeClase {
  return {
    ...datos,
    get etiqueta() {
      return mensajes().movimiento.clases[textos].etiqueta;
    },
    get corta() {
      return mensajes().movimiento.clases[textos].corta;
    },
    get ejemplo() {
      return mensajes().movimiento.clases[textos].ejemplo;
    },
  };
}

export const CLASE: Readonly<Record<ClaseDeMovimiento, DatosDeClase>> = {
  ingreso_hogar: conTextos('ingresoHogar', {
    id: 'ingreso_hogar',
    grupo: 'ingreso',
    tipo: 'ingreso',
    desde: null,
    hacia: 'hogar',
    tesoro: 'hogar',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [
      'Docencia',
      'Changas',
      'Regalos',
      'Venta personal',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
  ingreso_maun: conTextos('ingresoMaun', {
    id: 'ingreso_maun',
    grupo: 'ingreso',
    tipo: 'ingreso',
    desde: null,
    hacia: 'maun',
    tesoro: 'maun',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [
      'Cobro suelto',
      'Venta de sobrantes',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
  gasto_hogar: conTextos('gastoHogar', {
    id: 'gasto_hogar',
    grupo: 'gasto',
    tipo: 'gasto',
    desde: 'hogar',
    hacia: null,
    tesoro: 'hogar',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [
      'Supermercado',
      'Servicios',
      'Salud',
      'Educación',
      'Transporte',
      'Ropa',
      'Recreación',
      'Iglesia',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
  gasto_maun: conTextos('gastoMaun', {
    id: 'gasto_maun',
    grupo: 'gasto',
    tipo: 'gasto',
    desde: 'maun',
    hacia: null,
    tesoro: 'maun',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [
      'Materiales',
      'Herramientas',
      'Costos fijos',
      'Flete',
      'Servicios del taller',
      'Publicidad',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
  gasto_tesoro: conTextos('gastoTesoro', {
    id: 'gasto_tesoro',
    grupo: 'gasto',
    tipo: 'gasto',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: false,
    eligeElTesoro: true,
    categorias: ['Compra', 'Imprevisto', 'Regalo', OTRA] satisfies readonly CategoriaDelCatalogo[],
  }),
  pago_diezmo: conTextos('pagoDiezmo', {
    id: 'pago_diezmo',
    grupo: 'diezmo',
    tipo: 'pago_diezmo',
    desde: 'diezmo',
    hacia: null,
    tesoro: 'diezmo',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [],
  }),
  aporte_cocos: conTextos('aporteCocos', {
    id: 'aporte_cocos',
    grupo: 'cocos',
    tipo: 'aporte_cocos',
    desde: 'maun',
    hacia: 'cocos',
    tesoro: 'cocos',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [],
  }),
  retiro_cocos: conTextos('retiroCocos', {
    id: 'retiro_cocos',
    grupo: 'cocos',
    tipo: 'transferencia',
    desde: 'cocos',
    hacia: 'maun',
    tesoro: 'cocos',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [],
  }),
  gasto_cocos: conTextos('gastoCocos', {
    id: 'gasto_cocos',
    grupo: 'cocos',
    tipo: 'gasto',
    desde: 'cocos',
    hacia: null,
    tesoro: 'cocos',
    eligeLosLados: false,
    eligeElTesoro: false,
    categorias: [
      'Compra del inmueble',
      'Escritura y sellos',
      'Mudanza',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
  entre_tesoros: conTextos('entreTesoros', {
    id: 'entre_tesoros',
    grupo: 'entre',
    tipo: 'transferencia',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: true,
    eligeElTesoro: false,
    categorias: [],
  }),
  compra_de_dolares: conTextos('compraDeDolares', {
    id: 'compra_de_dolares',
    grupo: 'dolares',
    tipo: 'cambio',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: true,
    eligeElTesoro: false,
    categorias: QUE_DOLAR,
  }),
  venta_de_dolares: conTextos('ventaDeDolares', {
    id: 'venta_de_dolares',
    grupo: 'dolares',
    tipo: 'cambio',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: true,
    eligeElTesoro: false,
    categorias: QUE_DOLAR,
  }),
  ingreso_en_dolares: conTextos('ingresoEnDolares', {
    id: 'ingreso_en_dolares',
    grupo: 'dolares',
    tipo: 'ingreso',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: false,
    eligeElTesoro: true,
    entraAlTesoro: true,
    categorias: [
      'Ahorro previo',
      'Cobro suelto',
      'Regalo',
      OTRA,
    ] satisfies readonly CategoriaDelCatalogo[],
  }),
};

export const CLASES_EN_ORDEN: readonly ClaseDeMovimiento[] = [
  'ingreso_hogar',
  'ingreso_maun',
  'gasto_hogar',
  'gasto_maun',
  'gasto_tesoro',
  'pago_diezmo',
  'aporte_cocos',
  'retiro_cocos',
  'gasto_cocos',
  'entre_tesoros',
  'compra_de_dolares',
  'venta_de_dolares',
  'ingreso_en_dolares',
];

export function clasesDelGrupo(grupo: GrupoDeMovimiento): DatosDeClase[] {
  return CLASES_EN_ORDEN.map((id) => CLASE[id]).filter((clase) => clase.grupo === grupo);
}

export function esUnCambio(clase: ClaseDeMovimiento): clase is ClaseDeCambio {
  return clase === 'compra_de_dolares' || clase === 'venta_de_dolares';
}

export interface MonedasDeLosLados {
  desde?: Moneda;
  hacia?: Moneda;
}

export function claseDe(
  tipo: string,
  desde: Tesoro | null,
  hacia: Tesoro | null,
  monedas: MonedasDeLosLados = {},
): DatosDeClase | undefined {
  if (tipo === 'cambio') {
    return CLASE[
      (monedas.desde ?? MONEDA_DEL_TALLER) === MONEDA_DEL_TALLER
        ? 'compra_de_dolares'
        : 'venta_de_dolares'
    ];
  }
  const entraEnOtraMoneda = (monedas.hacia ?? MONEDA_DEL_TALLER) !== MONEDA_DEL_TALLER;
  const clases = CLASES_EN_ORDEN.map((id) => CLASE[id]).filter(
    (clase) => clase.entraAlTesoro !== true || entraEnOtraMoneda,
  );
  return (
    clases.find(
      (clase) =>
        !clase.eligeLosLados &&
        clase.tipo === tipo &&
        clase.desde === desde &&
        clase.hacia === hacia,
    ) ?? clases.find((clase) => clase.eligeLosLados && clase.tipo === tipo)
  );
}

export function vaEntreTesoros(tesoro: { clave: Tesoro | null }): boolean {
  return tesoro.clave !== 'diezmo';
}

export function gastaDesdeElTesoro(tesoro: { clave: Tesoro | null; archivado: boolean }): boolean {
  return tesoro.clave === null && !tesoro.archivado;
}

interface TesoroDeLaClase {
  id: string;
  clave: Tesoro | null;
  moneda: Moneda;
  archivado: boolean;
}

function esDelTaller(tesoro: { moneda: Moneda }): boolean {
  return tesoro.moneda === MONEDA_DEL_TALLER;
}

export function hayDolaresParaCargar(tesoros: readonly TesoroDeLaClase[]): boolean {
  return tesoros.some((tesoro) => !tesoro.archivado && !esDelTaller(tesoro));
}

export function origenesDeLaClase<T extends TesoroDeLaClase>(
  clase: ClaseDeMovimiento,
  tesoros: readonly T[],
): T[] {
  const vivos = tesoros.filter((tesoro) => !tesoro.archivado && vaEntreTesoros(tesoro));
  switch (clase) {
    case 'compra_de_dolares':
      return vivos.filter(esDelTaller);
    case 'venta_de_dolares':
      return vivos.filter((tesoro) => !esDelTaller(tesoro));
    default:
      return vivos;
  }
}

export function destinosDeLaClase<T extends TesoroDeLaClase>(
  clase: ClaseDeMovimiento,
  tesoros: readonly T[],
  origen: T | undefined,
): T[] {
  const vivos = tesoros.filter(
    (tesoro) => !tesoro.archivado && vaEntreTesoros(tesoro) && tesoro.id !== origen?.id,
  );
  switch (clase) {
    case 'compra_de_dolares':
      return vivos.filter((tesoro) => !esDelTaller(tesoro));
    case 'venta_de_dolares':
      return vivos.filter(esDelTaller);
    default:
      return vivos.filter((tesoro) => tesoro.moneda === (origen?.moneda ?? MONEDA_DEL_TALLER));
  }
}

export function tesorosParaElegir<T extends TesoroDeLaClase>(
  clase: ClaseDeMovimiento,
  tesoros: readonly T[],
): T[] {
  if (CLASE[clase].entraAlTesoro === true) {
    return tesoros.filter((tesoro) => !tesoro.archivado && !esDelTaller(tesoro));
  }
  return tesoros.filter(gastaDesdeElTesoro);
}

export function categoriaEnPantalla(categoria: string): string {
  const traducidas: Readonly<Record<string, string | undefined>> = mensajes().movimiento.categorias;
  return traducidas[categoria] ?? categoria;
}

export function esCategoriaDelCatalogo(categoria: string): boolean {
  return Object.hasOwn(mensajes().movimiento.categorias, categoria);
}

export function rutaParaComprarDolares(desde: { id: string; saldo: Plata }): string {
  return rutaDeMovimientoNuevo({
    clase: 'compra_de_dolares',
    tesoro: desde.id,
    ...(desde.saldo.importe > 0 ? { monto: desde.saldo.importe } : {}),
  });
}

export function rutaParaComprarDolaresPara(hacia: { id: string }): string {
  return rutaDeMovimientoNuevo({ clase: 'compra_de_dolares', hacia: hacia.id });
}

export function rutaParaVenderDolares(desde: { id: string; saldo: Plata }): string {
  return rutaDeMovimientoNuevo({
    clase: 'venta_de_dolares',
    tesoro: desde.id,
    ...(desde.saldo.importe > 0 ? { monto: desde.saldo.importe } : {}),
  });
}

export function renglonesPorTesoro(fila: Fila): Map<string, string[]> {
  return new Map(
    fila.pasos
      .filter((paso) => paso.clase === 'fijos')
      .map((paso) => [
        paso.tesoro,
        paso.renglones.map((renglon) => renglon.nombre.trim()).filter((nombre) => nombre !== ''),
      ]),
  );
}

export function categoriasDeLaClase(
  clase: ClaseDeMovimiento,
  renglones: readonly string[] = [],
): readonly string[] {
  if (!CLASE[clase].eligeElTesoro || renglones.length === 0) return CLASE[clase].categorias;
  return [...new Set([...renglones, OTRA])];
}

export function claseParaPagar(tesoro: { clave: Tesoro | null }): ClaseDeMovimiento {
  switch (tesoro.clave) {
    case 'maun':
      return 'gasto_maun';
    case 'diezmo':
      return 'pago_diezmo';
    case 'hogar':
      return 'gasto_hogar';
    case 'cocos':
      return 'gasto_cocos';
    case null:
      return 'gasto_tesoro';
  }
}

export interface PagoParaRegistrar {
  tesoro: { id: string; clave: Tesoro | null };
  monto: Money | null;
  categoria: string | null;
  fecha?: string | null;
}

export function rutaParaRegistrarElPago({
  tesoro,
  monto,
  categoria,
  fecha = null,
}: PagoParaRegistrar): string {
  const clase = claseParaPagar(tesoro);
  return rutaDeMovimientoNuevo({
    clase,
    ...(CLASE[clase].eligeElTesoro ? { tesoro: tesoro.id } : {}),
    ...(monto !== null && monto > 0 ? { monto } : {}),
    ...(categoria === null || clase === 'pago_diezmo' ? {} : { categoria }),
    ...(fecha === null ? {} : { fecha }),
  });
}
