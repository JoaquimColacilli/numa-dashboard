import {
  cambiarElPaso,
  CERO,
  lugarLibreDelReparto,
  moverPaso,
  ponerDespues,
  ponerEnElReparto,
  puntosBasicos,
  sacarDeLaFila,
  sumaDelReparto,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  TOPE_DE_RENGLONES,
  type ClaseDePaso,
  type Fila,
  type Money,
  type PasoDeLaFila,
  type PuntosBasicos,
  type Renglon,
} from '@maun/domain';

import type { Tesoro } from '@/shared/api';

export const NOMBRE_DE_LA_CLASE: Readonly<Record<ClaseDePaso, string>> = {
  sueldo: 'Sueldo',
  fijos: 'Gastos fijos',
  prioridad: 'Prioridad',
};

const PORCENTAJE_AL_SUMAR = 1000;

export function clasesPosibles(clave: Tesoro | null): ClaseDePaso[] {
  if (clave === 'hogar') return ['sueldo'];
  if (clave === 'maun') return ['fijos'];
  return ['fijos', 'prioridad'];
}

export function pasoNuevo(tesoro: string, clave: Tesoro | null, tope: Money = CERO): PasoDeLaFila {
  if (clave === 'hogar') return { tesoro, clase: 'sueldo', tope, renglones: [], desde: null };
  if (clave === 'maun') {
    return {
      tesoro,
      clase: 'fijos',
      tope,
      renglones: [{ nombre: 'Costos fijos', monto: tope }],
      desde: null,
    };
  }
  return { tesoro, clase: 'prioridad', tope, renglones: [], desde: null };
}

export function lugarDelPaso(fila: Fila, tesoro: string): number {
  return fila.pasos.findIndex((paso) => paso.tesoro === tesoro);
}

export function pasoDe(fila: Fila, tesoro: string): PasoDeLaFila | undefined {
  return fila.pasos.find((paso) => paso.tesoro === tesoro);
}

export function entraOtroPaso(fila: Fila, tesoro: string): boolean {
  return fila.pasos.some((paso) => paso.tesoro === tesoro) || fila.pasos.length < TOPE_DE_PASOS;
}

export function sumarComoPaso(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  despuesDe: string | null,
  tope: Money = CERO,
): Fila {
  return ponerDespues(fila, despuesDe, pasoNuevo(tesoro, clave, tope));
}

export function sumarAlFinal(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
): Fila {
  const sin = sacarDeLaFila(fila, tesoro);
  return sumarComoPaso(sin, tesoro, clave, sin.pasos.at(-1)?.tesoro ?? null, tope);
}

export function puedeIrAlReparto(fila: Fila, tesoro: string, clave: Tesoro | null): boolean {
  if (clave === 'hogar' || clave === 'maun' || clave === 'diezmo') return false;
  if (fila.reparto.some((parte) => parte.tesoro === tesoro)) return true;
  return fila.reparto.length < TOPE_DE_PARTES && lugarLibreDelReparto(fila) > 0;
}

export function porcentajeParaSumar(fila: Fila): PuntosBasicos {
  return puntosBasicos(Math.min(lugarLibreDelReparto(fila), PORCENTAJE_AL_SUMAR));
}

export function sumarAlReparto(fila: Fila, tesoro: string, porcentaje?: PuntosBasicos): Fila {
  return ponerEnElReparto(fila, tesoro, porcentaje ?? porcentajeParaSumar(fila));
}

export function moverUnLugar(fila: Fila, tesoro: string, hacia: -1 | 1): Fila {
  const lugar = lugarDelPaso(fila, tesoro);
  const destino = lugar + hacia;
  if (lugar === -1 || destino < 0 || destino >= fila.pasos.length) return fila;
  return moverPaso(fila, tesoro, destino);
}

export function conClase(fila: Fila, tesoro: string, clase: ClaseDePaso): Fila {
  const paso = pasoDe(fila, tesoro);
  if (paso === undefined || paso.clase === clase) return fila;
  const renglones: Renglon[] =
    clase === 'fijos' ? [{ nombre: 'Gasto fijo', monto: paso.tope }] : [];
  const pasos = fila.pasos.map((otro) =>
    otro.tesoro === tesoro ? { ...otro, clase, renglones, tope: paso.tope } : otro,
  );
  return { ...fila, pasos };
}

export function conTope(fila: Fila, tesoro: string, tope: Money): Fila {
  return cambiarElPaso(fila, tesoro, { tope });
}

export function conRenglones(fila: Fila, tesoro: string, renglones: readonly Renglon[]): Fila {
  return cambiarElPaso(fila, tesoro, { renglones });
}

export function sePuedeSumarUnRenglon(paso: PasoDeLaFila): boolean {
  return paso.renglones.length < TOPE_DE_RENGLONES;
}

export function conPorcentaje(fila: Fila, tesoro: string, porcentaje: PuntosBasicos): Fila {
  return ponerEnElReparto(fila, tesoro, porcentaje);
}

export function libreParaLaParte(fila: Fila, tesoro: string): number {
  const propia = fila.reparto.find((parte) => parte.tesoro === tesoro)?.porcentaje ?? 0;
  return Math.max(0, 10_000 - sumaDelReparto(fila) + propia);
}

export function sacar(fila: Fila, tesoro: string): Fila {
  return sacarDeLaFila(fila, tesoro);
}
