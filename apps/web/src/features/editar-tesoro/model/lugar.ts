import {
  centavos,
  lugarLibreDelReparto,
  MONTO_MAXIMO_DE_LA_FILA,
  puntosBasicos,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type Fila,
  type Money,
  type PuntosBasicos,
} from '@maun/domain';

import { formatearPorcentaje, parsearPorcentaje } from '@/shared/lib';

export type LugarDelTesoro = 'estante' | 'paso' | 'reparto';

export type DondeVa =
  | { lugar: 'estante' }
  | { lugar: 'paso'; tope: Money }
  | { lugar: 'reparto'; porcentaje: PuntosBasicos };

export interface OpcionDeLugar {
  id: LugarDelTesoro;
  titulo: string;
  detalle: string;
  sePuede: boolean;
}

const PORCENTAJE_SUGERIDO = 1000;

export function libreEnElReparto(fila: Pick<Fila, 'reparto'>): PuntosBasicos {
  return lugarLibreDelReparto(fila);
}

export function tituloDelPaso(
  fila: Pick<Fila, 'pasos'>,
  despuesDe: string | null | undefined,
  nombreDe: (tesoro: string) => string,
): string {
  if (despuesDe === undefined || fila.pasos.length === 0) return 'Como paso, al final';
  if (despuesDe === null) return 'Como paso 1, al principio';
  const lugar = fila.pasos.findIndex((paso) => paso.tesoro === despuesDe);
  if (lugar === -1 || lugar === fila.pasos.length - 1) return 'Como paso, al final';
  return `Como paso ${String(lugar + 2)}, después de ${nombreDe(despuesDe)}`;
}

export function opcionesDeLugar(
  fila: Pick<Fila, 'pasos' | 'reparto'>,
  despuesDe?: string | null,
  nombreDe: (tesoro: string) => string = (tesoro) => tesoro,
): OpcionDeLugar[] {
  const libre = libreEnElReparto(fila);
  const pasoLleno = fila.pasos.length >= TOPE_DE_PASOS;
  const repartoLleno = fila.reparto.length >= TOPE_DE_PARTES;
  return [
    {
      id: 'estante',
      titulo: 'Al estante',
      detalle: 'No recibe de los cobros: lo sumás a la fila después',
      sePuede: true,
    },
    {
      id: 'paso',
      titulo: tituloDelPaso(fila, despuesDe, nombreDe),
      detalle: pasoLleno ? `Entran hasta ${String(TOPE_DE_PASOS)} pasos.` : 'Con un tope por mes',
      sePuede: !pasoLleno,
    },
    {
      id: 'reparto',
      titulo: 'En el reparto',
      detalle: repartoLleno
        ? `El reparto admite hasta ${String(TOPE_DE_PARTES)} tesoros.`
        : libre <= 0
          ? 'El reparto ya suma 100%.'
          : 'Con un porcentaje de lo que sobra',
      sePuede: !repartoLleno && libre > 0,
    },
  ];
}

export function porcentajeSugerido(libre: number): string {
  return formatearPorcentaje(Math.min(PORCENTAJE_SUGERIDO, Math.max(0, libre)));
}

export function fraseDelLibre(libre: number, texto: string): string {
  const inicio = `Queda libre el ${formatearPorcentaje(libre)}% del reparto`;
  const porcentaje = parsearPorcentaje(texto, libre);
  if (porcentaje === undefined || porcentaje <= 0) return `${inicio}.`;
  const resto = libre - porcentaje;
  if (resto <= 0) {
    return `${inicio}: con ${formatearPorcentaje(porcentaje)}%, el reparto llega al 100%.`;
  }
  return `${inicio}: con ${formatearPorcentaje(porcentaje)}%, Maun se queda con el otro ${formatearPorcentaje(resto)}%.`;
}

export interface ErroresDelLugar {
  tope?: string;
  porcentaje?: string;
}

export type LugarRevisado =
  { dondeVa: DondeVa; errores?: undefined } | { dondeVa?: undefined; errores: ErroresDelLugar };

export function revisarElLugar(
  lugar: LugarDelTesoro,
  tope: number | null,
  porcentaje: string,
  fila: Pick<Fila, 'pasos' | 'reparto'>,
): LugarRevisado {
  if (lugar === 'paso') {
    if (tope === null || tope <= 0) {
      return { errores: { tope: 'Poné hasta cuánto recibe por mes.' } };
    }
    if (tope > MONTO_MAXIMO_DE_LA_FILA) {
      return { errores: { tope: 'El tope no puede ser tan grande.' } };
    }
    return { dondeVa: { lugar: 'paso', tope: centavos(tope) } };
  }
  if (lugar === 'reparto') {
    const libre = libreEnElReparto(fila);
    const bp = parsearPorcentaje(porcentaje, libre);
    if (bp === undefined || bp <= 0) {
      return {
        errores: {
          porcentaje: `Poné un porcentaje de 0,01 a ${formatearPorcentaje(libre)}, lo que queda libre.`,
        },
      };
    }
    return { dondeVa: { lugar: 'reparto', porcentaje: puntosBasicos(bp) } };
  }
  return { dondeVa: { lugar: 'estante' } };
}
