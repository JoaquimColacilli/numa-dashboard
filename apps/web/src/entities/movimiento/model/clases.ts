import type { Tesoro, TipoMovimiento } from '@/shared/api';

export type GrupoDeMovimiento = 'ingreso' | 'gasto' | 'diezmo' | 'cocos' | 'entre';

export type ClaseDeMovimiento =
  | 'ingreso_hogar'
  | 'ingreso_maun'
  | 'gasto_hogar'
  | 'gasto_maun'
  | 'pago_diezmo'
  | 'aporte_cocos'
  | 'retiro_cocos'
  | 'gasto_cocos'
  | 'entre_tesoros';

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
  categorias: readonly string[];
  ejemplo: string;
}

export const GRUPOS: readonly { id: GrupoDeMovimiento; etiqueta: string }[] = [
  { id: 'ingreso', etiqueta: 'Ingreso' },
  { id: 'gasto', etiqueta: 'Gasto' },
  { id: 'diezmo', etiqueta: 'Diezmo' },
  { id: 'cocos', etiqueta: 'Cocos' },
  { id: 'entre', etiqueta: 'Entre tesoros' },
];

export const CLASE: Readonly<Record<ClaseDeMovimiento, DatosDeClase>> = {
  ingreso_hogar: {
    id: 'ingreso_hogar',
    grupo: 'ingreso',
    etiqueta: 'Ingreso al hogar',
    corta: 'Al hogar',
    tipo: 'ingreso',
    desde: null,
    hacia: 'hogar',
    tesoro: 'hogar',
    eligeLosLados: false,
    categorias: ['Docencia', 'Changas', 'Regalos', 'Venta personal', 'Otro'],
    ejemplo: 'Docencia de septiembre',
  },
  ingreso_maun: {
    id: 'ingreso_maun',
    grupo: 'ingreso',
    etiqueta: 'Ingreso al taller',
    corta: 'Al taller',
    tipo: 'ingreso',
    desde: null,
    hacia: 'maun',
    tesoro: 'maun',
    eligeLosLados: false,
    categorias: ['Cobro suelto', 'Venta de sobrantes', 'Otro'],
    ejemplo: 'Venta de recortes de melamina',
  },
  gasto_hogar: {
    id: 'gasto_hogar',
    grupo: 'gasto',
    etiqueta: 'Gasto del hogar',
    corta: 'Del hogar',
    tipo: 'gasto',
    desde: 'hogar',
    hacia: null,
    tesoro: 'hogar',
    eligeLosLados: false,
    categorias: [
      'Supermercado',
      'Servicios',
      'Salud',
      'Educación',
      'Transporte',
      'Ropa',
      'Recreación',
      'Iglesia',
      'Otro',
    ],
    ejemplo: 'Supermercado, luz y gas, pediatra…',
  },
  gasto_maun: {
    id: 'gasto_maun',
    grupo: 'gasto',
    etiqueta: 'Gasto del taller',
    corta: 'Del taller',
    tipo: 'gasto',
    desde: 'maun',
    hacia: null,
    tesoro: 'maun',
    eligeLosLados: false,
    categorias: [
      'Materiales',
      'Herramientas',
      'Costos fijos',
      'Flete',
      'Servicios del taller',
      'Publicidad',
      'Otro',
    ],
    ejemplo: 'Alquiler, hoja de sierra, seguro…',
  },
  pago_diezmo: {
    id: 'pago_diezmo',
    grupo: 'diezmo',
    etiqueta: 'Pago de diezmo',
    corta: 'Pago de diezmo',
    tipo: 'pago_diezmo',
    desde: 'diezmo',
    hacia: null,
    tesoro: 'diezmo',
    eligeLosLados: false,
    categorias: [],
    ejemplo: 'Diezmo de septiembre',
  },
  aporte_cocos: {
    id: 'aporte_cocos',
    grupo: 'cocos',
    etiqueta: 'Del taller a Cocos',
    corta: 'Aporte',
    tipo: 'aporte_cocos',
    desde: 'maun',
    hacia: 'cocos',
    tesoro: 'cocos',
    eligeLosLados: false,
    categorias: [],
    ejemplo: 'Aporte del mes',
  },
  retiro_cocos: {
    id: 'retiro_cocos',
    grupo: 'cocos',
    etiqueta: 'De Cocos al taller',
    corta: 'Retiro',
    tipo: 'transferencia',
    desde: 'cocos',
    hacia: 'maun',
    tesoro: 'cocos',
    eligeLosLados: false,
    categorias: [],
    ejemplo: 'Retiro para comprar la plegadora',
  },
  gasto_cocos: {
    id: 'gasto_cocos',
    grupo: 'cocos',
    etiqueta: 'Gasto desde Cocos',
    corta: 'Gasto',
    tipo: 'gasto',
    desde: 'cocos',
    hacia: null,
    tesoro: 'cocos',
    eligeLosLados: false,
    categorias: ['Compra del inmueble', 'Escritura y sellos', 'Mudanza', 'Otro'],
    ejemplo: 'Seña del terreno',
  },
  entre_tesoros: {
    id: 'entre_tesoros',
    grupo: 'entre',
    etiqueta: 'Entre tesoros',
    corta: 'Entre tesoros',
    tipo: 'transferencia',
    desde: null,
    hacia: null,
    tesoro: null,
    eligeLosLados: true,
    categorias: [],
    ejemplo: 'Para los materiales del mes',
  },
};

export const CLASES_EN_ORDEN: readonly ClaseDeMovimiento[] = [
  'ingreso_hogar',
  'ingreso_maun',
  'gasto_hogar',
  'gasto_maun',
  'pago_diezmo',
  'aporte_cocos',
  'retiro_cocos',
  'gasto_cocos',
  'entre_tesoros',
];

export function clasesDelGrupo(grupo: GrupoDeMovimiento): DatosDeClase[] {
  return CLASES_EN_ORDEN.map((id) => CLASE[id]).filter((clase) => clase.grupo === grupo);
}

export function claseDe(
  tipo: string,
  desde: Tesoro | null,
  hacia: Tesoro | null,
): DatosDeClase | undefined {
  const clases = CLASES_EN_ORDEN.map((id) => CLASE[id]);
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
