import {
  centavos,
  lugarLibreDelReparto,
  MONEDA_DEL_TALLER,
  MONTO_MAXIMO_DE_LA_FILA,
  puntosBasicos,
  TOPE_DE_OBLIGACIONES,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type BaseDeLaObligacion,
  type Fila,
  type Moneda,
  type Money,
  type PuntosBasicos,
} from '@maun/domain';

import { lugaresParaSumar, type LugarEnLaFila } from '@/entities/fila';
import { mensajes } from '@/shared/idioma';
import { formatearPorcentaje, parsearPorcentaje } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

export type LugarDelTesoro = 'estante' | LugarEnLaFila;

export type DondeVa =
  | { lugar: 'estante' }
  | {
      lugar: 'obligacion';
      porcentaje: PuntosBasicos;
      base: BaseDeLaObligacion;
      antesDelDiezmo: boolean;
    }
  | { lugar: 'compromiso'; monto: Money }
  | { lugar: 'ahorro-fijo'; monto: Money }
  | { lugar: 'reparto'; porcentaje: PuntosBasicos }
  | { lugar: 'superavit' };

export interface OpcionDeLugar {
  id: LugarDelTesoro;
  titulo: string;
  detalle: string;
  sePuede: boolean;
}

const PORCENTAJE_SUGERIDO = 1000;

const UN_TESORO_NUEVO = '00000000-0000-0000-0000-000000000000';

export function libreEnElReparto(fila: Pick<Fila, 'reparto'>): PuntosBasicos {
  return lugarLibreDelReparto(fila);
}

function detalleDelLugar(
  fila: Fila,
  lugar: LugarEnLaFila,
  sePuede: boolean,
  nombreDelSuperavit: string,
): string {
  switch (lugar) {
    case 'obligacion':
      return sePuede
        ? 'Un porcentaje de cada cobro, como Ingresos Brutos'
        : `Entran hasta ${String(TOPE_DE_OBLIGACIONES)} obligaciones.`;
    case 'compromiso':
      return sePuede
        ? 'Junta lo que tenés que pagar, como el alquiler'
        : `Entran hasta ${String(TOPE_DE_PASOS)} compromisos y ahorros fijos.`;
    case 'ahorro-fijo':
      return sePuede
        ? 'Un monto fijo que apartás de la ganancia'
        : `Entran hasta ${String(TOPE_DE_PASOS)} compromisos y ahorros fijos.`;
    case 'reparto':
      if (fila.reparto.length >= TOPE_DE_PARTES) {
        return `El reparto admite hasta ${String(TOPE_DE_PARTES)} tesoros.`;
      }
      return libreEnElReparto(fila) <= 0
        ? 'El reparto ya suma 100%.'
        : 'Un porcentaje de lo que sobra';
    case 'superavit':
      return `Recibe lo que sobra, en lugar de ${nombreDelSuperavit}`;
  }
}

export function dondeEntra(
  lugar: LugarDelTesoro,
  despuesDe: string | null | undefined,
  nombreDe: (tesoro: string) => string,
): string | null {
  if (lugar === 'estante' || lugar === 'reparto' || lugar === 'superavit') return null;
  if (despuesDe === undefined) return 'Al final de su tipo';
  if (despuesDe === null) return 'Al principio de su tipo';
  return `Después de ${nombreDe(despuesDe)}`;
}

export function opcionesDeLugar(
  fila: Fila,
  nombreDelSuperavit = 'Maun',
  moneda: Moneda = MONEDA_DEL_TALLER,
): OpcionDeLugar[] {
  if (moneda !== MONEDA_DEL_TALLER) {
    return [
      {
        id: 'estante',
        titulo: 'Al estante',
        detalle: mensajes().tesoros.laFilaRepartePesos,
        sePuede: true,
      },
    ];
  }
  return [
    {
      id: 'estante',
      titulo: 'Al estante',
      detalle: 'No recibe de los cobros: lo sumás a la fila después',
      sePuede: true,
    },
    ...lugaresParaSumar(fila, UN_TESORO_NUEVO, null).map(({ lugar, titulo, sePuede }) => ({
      id: lugar,
      titulo,
      detalle: detalleDelLugar(fila, lugar, sePuede, nombreDelSuperavit),
      sePuede,
    })),
  ];
}

export function porcentajeSugerido(libre: number): string {
  return formatearPorcentaje(Math.min(PORCENTAJE_SUGERIDO, Math.max(0, libre)));
}

export function fraseDelLibre(libre: number, texto: string, nombreDelSuperavit = 'Maun'): string {
  const inicio = `Queda libre el ${formatearPorcentaje(libre)}% del reparto`;
  const porcentaje = parsearPorcentaje(texto, libre);
  if (porcentaje === undefined || porcentaje <= 0) return `${inicio}.`;
  const resto = libre - porcentaje;
  if (resto <= 0) {
    return `${inicio}: con ${formatearPorcentaje(porcentaje)}%, el reparto llega al 100%.`;
  }
  return `${inicio}: con ${formatearPorcentaje(porcentaje)}%, ${nombreDelSuperavit} se queda con el otro ${formatearPorcentaje(resto)}%.`;
}

export interface SugerenciaDeNombre {
  nombre: string;
  icono: NombreDeIcono;
  base?: BaseDeLaObligacion;
  antesDelDiezmo?: boolean;
}

const DE_AHORRO: readonly SugerenciaDeNombre[] = [
  { nombre: 'Stock del taller', icono: 'package' },
  { nombre: 'Maquinaria', icono: 'wrench' },
  { nombre: 'Vehículo', icono: 'car' },
  { nombre: 'Inmueble', icono: 'building-2' },
];

export const SUGERENCIAS_DEL_LUGAR: Readonly<
  Record<LugarDelTesoro, readonly SugerenciaDeNombre[]>
> = {
  estante: [],
  obligacion: [
    { nombre: 'Ingresos Brutos', icono: 'landmark', base: 'cobrado', antesDelDiezmo: true },
  ],
  compromiso: [
    { nombre: 'Gastos fijos', icono: 'receipt' },
    { nombre: 'Sueldos', icono: 'coins' },
    { nombre: 'Alquiler', icono: 'building-2' },
    { nombre: 'Cuotas', icono: 'landmark' },
  ],
  'ahorro-fijo': DE_AHORRO,
  reparto: DE_AHORRO,
  superavit: [{ nombre: 'Superávit', icono: 'piggy-bank' }],
};

export interface ErroresDelLugar {
  monto?: string;
  porcentaje?: string;
}

export interface LoQueSePide {
  monto: number | null;
  porcentaje: string;
  base: BaseDeLaObligacion;
  antesDelDiezmo: boolean;
}

export type LugarRevisado =
  { dondeVa: DondeVa; errores?: undefined } | { dondeVa?: undefined; errores: ErroresDelLugar };

function montoRevisado(monto: number | null): Money | string {
  if (monto === null || monto <= 0) return 'Poné hasta cuánto recibe.';
  if (monto > MONTO_MAXIMO_DE_LA_FILA) return 'El monto no puede ser tan grande.';
  return centavos(monto);
}

export function revisarElLugar(
  lugar: LugarDelTesoro,
  { monto, porcentaje, base, antesDelDiezmo }: LoQueSePide,
  fila: Pick<Fila, 'reparto'>,
): LugarRevisado {
  switch (lugar) {
    case 'estante':
      return { dondeVa: { lugar: 'estante' } };
    case 'superavit':
      return { dondeVa: { lugar: 'superavit' } };
    case 'compromiso':
    case 'ahorro-fijo': {
      const revisado = montoRevisado(monto);
      return typeof revisado === 'string'
        ? { errores: { monto: revisado } }
        : { dondeVa: { lugar, monto: revisado } };
    }
    case 'obligacion': {
      const bp = parsearPorcentaje(porcentaje, 10_000);
      if (bp === undefined || bp <= 0) {
        return { errores: { porcentaje: 'Poné un porcentaje de 0,01 a 100.' } };
      }
      return {
        dondeVa: { lugar, porcentaje: puntosBasicos(bp), base, antesDelDiezmo },
      };
    }
    case 'reparto': {
      const libre = libreEnElReparto(fila);
      const bp = parsearPorcentaje(porcentaje, libre);
      if (bp === undefined || bp <= 0) {
        return {
          errores: {
            porcentaje: `Poné un porcentaje de 0,01 a ${formatearPorcentaje(libre)}, lo que queda libre.`,
          },
        };
      }
      return { dondeVa: { lugar, porcentaje: puntosBasicos(bp) } };
    }
  }
}
