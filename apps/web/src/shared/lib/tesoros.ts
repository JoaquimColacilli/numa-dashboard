import type { Tesoro } from '@/shared/api';
import type { NombreDeIcono } from '@/shared/ui';

export interface DatosDelTesoro {
  id: Tesoro;
  nombre: string;
  descripcion: string;
  icono: NombreDeIcono;
  fondo: string;
  texto: string;
  barra: string;
}

export const TESOROS_EN_ORDEN: readonly Tesoro[] = ['hogar', 'maun', 'diezmo', 'cocos'];

export const TESORO: Readonly<Record<Tesoro, DatosDelTesoro>> = {
  hogar: {
    id: 'hogar',
    nombre: 'Hogar',
    descripcion: 'La plata de la familia',
    icono: 'house',
    fondo: 'bg-hogar-tint',
    texto: 'text-hogar',
    barra: 'bg-hogar',
  },
  maun: {
    id: 'maun',
    nombre: 'Maun',
    descripcion: 'La caja del taller',
    icono: 'hammer',
    fondo: 'bg-maun-tint',
    texto: 'text-maun',
    barra: 'bg-maun',
  },
  diezmo: {
    id: 'diezmo',
    nombre: 'Diezmo',
    descripcion: 'Lo apartado de cada ganancia',
    icono: 'church',
    fondo: 'bg-diezmo-tint',
    texto: 'text-diezmo',
    barra: 'bg-diezmo',
  },
  cocos: {
    id: 'cocos',
    nombre: 'Cocos',
    descripcion: 'Ahorro para la casa propia',
    icono: 'piggy-bank',
    fondo: 'bg-cocos-tint',
    texto: 'text-cocos',
    barra: 'bg-cocos',
  },
};

export const TINTAS_DE_TESORO = [
  'hogar',
  'maun',
  'diezmo',
  'cocos',
  'grana',
  'mostaza',
  'petroleo',
  'ciruela',
] as const;

export type TintaDeTesoro = (typeof TINTAS_DE_TESORO)[number];

export interface ClasesDeLaTinta {
  texto: string;
  fondo: string;
  tinte: string;
  borde: string;
  color: string;
}

export const TINTA: Readonly<Record<TintaDeTesoro, ClasesDeLaTinta>> = {
  hogar: {
    texto: 'text-hogar',
    fondo: 'bg-hogar',
    tinte: 'bg-hogar-tint',
    borde: 'border-hogar',
    color: 'var(--tesoro-hogar)',
  },
  maun: {
    texto: 'text-maun',
    fondo: 'bg-maun',
    tinte: 'bg-maun-tint',
    borde: 'border-maun',
    color: 'var(--tesoro-maun)',
  },
  diezmo: {
    texto: 'text-diezmo',
    fondo: 'bg-diezmo',
    tinte: 'bg-diezmo-tint',
    borde: 'border-diezmo',
    color: 'var(--tesoro-diezmo)',
  },
  cocos: {
    texto: 'text-cocos',
    fondo: 'bg-cocos',
    tinte: 'bg-cocos-tint',
    borde: 'border-cocos',
    color: 'var(--tesoro-cocos)',
  },
  grana: {
    texto: 'text-grana',
    fondo: 'bg-grana',
    tinte: 'bg-grana-tint',
    borde: 'border-grana',
    color: 'var(--tesoro-grana)',
  },
  mostaza: {
    texto: 'text-mostaza',
    fondo: 'bg-mostaza',
    tinte: 'bg-mostaza-tint',
    borde: 'border-mostaza',
    color: 'var(--tesoro-mostaza)',
  },
  petroleo: {
    texto: 'text-petroleo',
    fondo: 'bg-petroleo',
    tinte: 'bg-petroleo-tint',
    borde: 'border-petroleo',
    color: 'var(--tesoro-petroleo)',
  },
  ciruela: {
    texto: 'text-ciruela',
    fondo: 'bg-ciruela',
    tinte: 'bg-ciruela-tint',
    borde: 'border-ciruela',
    color: 'var(--tesoro-ciruela)',
  },
};

export const NOMBRE_DE_LA_TINTA: Readonly<Record<TintaDeTesoro, string>> = {
  hogar: 'Verde',
  maun: 'Madera',
  diezmo: 'Violeta',
  cocos: 'Azul',
  grana: 'Grana',
  mostaza: 'Mostaza',
  petroleo: 'Petróleo',
  ciruela: 'Ciruela',
};

export function tintaDelTesoro(valor: string): TintaDeTesoro {
  return (TINTAS_DE_TESORO as readonly string[]).includes(valor)
    ? (valor as TintaDeTesoro)
    : 'maun';
}

export const ICONOS_DE_TESORO: readonly NombreDeIcono[] = [
  'receipt',
  'package',
  'building-2',
  'wrench',
  'vault',
  'landmark',
  'coins',
  'trending-up',
  'piggy-bank',
  'car',
  'truck',
  'plane',
  'graduation-cap',
  'gift',
  'shield',
  'sprout',
];

const ICONOS_CONOCIDOS: ReadonlySet<string> = new Set<string>([
  ...ICONOS_DE_TESORO,
  ...Object.values(TESORO).map((tesoro) => tesoro.icono),
]);

export function iconoDelTesoro(valor: string): NombreDeIcono {
  return ICONOS_CONOCIDOS.has(valor) ? (valor as NombreDeIcono) : 'vault';
}
