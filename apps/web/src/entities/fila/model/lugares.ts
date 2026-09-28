import {
  lugarLibreDelReparto,
  TOPE_DE_OBLIGACIONES,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type Fila,
  type TesoroDeLaFila,
} from '@maun/domain';

export const LUGARES_EN_LA_FILA = [
  'obligacion',
  'compromiso',
  'ahorro-fijo',
  'reparto',
  'superavit',
] as const;

export type LugarEnLaFila = (typeof LUGARES_EN_LA_FILA)[number];

export const TITULO_DEL_LUGAR: Readonly<Record<LugarEnLaFila, string>> = {
  obligacion: 'Como obligación',
  compromiso: 'Como compromiso',
  'ahorro-fijo': 'Como ahorro fijo',
  reparto: 'En el reparto',
  superavit: 'Que reciba lo que sobra',
};

type Clave = TesoroDeLaFila['clave'];

function esElSuperavitAparte(fila: Fila, tesoro: string, clave: Clave): boolean {
  return clave !== 'maun' && fila.superavit === tesoro;
}

export function entraOtroPaso(fila: Fila, tesoro: string): boolean {
  return fila.pasos.some((paso) => paso.tesoro === tesoro) || fila.pasos.length < TOPE_DE_PASOS;
}

export function puedeSerObligacion(fila: Fila, tesoro: string, clave: Clave): boolean {
  if (clave === 'hogar' || clave === 'maun' || esElSuperavitAparte(fila, tesoro, clave)) {
    return false;
  }
  if (fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) return true;
  return fila.obligaciones.length < TOPE_DE_OBLIGACIONES;
}

export function puedeSerCompromiso(fila: Fila, tesoro: string, clave: Clave): boolean {
  if (clave === 'diezmo' || esElSuperavitAparte(fila, tesoro, clave)) return false;
  return entraOtroPaso(fila, tesoro);
}

export function puedeSerAhorroFijo(fila: Fila, tesoro: string, clave: Clave): boolean {
  if (clave === 'hogar' || clave === 'maun' || clave === 'diezmo') return false;
  if (esElSuperavitAparte(fila, tesoro, clave)) return false;
  return entraOtroPaso(fila, tesoro);
}

export function puedeIrAlReparto(fila: Fila, tesoro: string, clave: Clave): boolean {
  if (clave === 'hogar' || clave === 'maun' || clave === 'diezmo') return false;
  if (esElSuperavitAparte(fila, tesoro, clave)) return false;
  if (fila.reparto.some((parte) => parte.tesoro === tesoro)) return true;
  return fila.reparto.length < TOPE_DE_PARTES && lugarLibreDelReparto(fila) > 0;
}

export function puedeSerSuperavit(fila: Fila, tesoro: string, clave: Clave): boolean {
  if (clave === 'hogar' || clave === 'diezmo') return false;
  if (clave === 'maun') return true;
  return (
    !fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro) &&
    !fila.pasos.some((paso) => paso.tesoro === tesoro) &&
    !fila.reparto.some((parte) => parte.tesoro === tesoro)
  );
}

export interface LugarParaSumar {
  lugar: LugarEnLaFila;
  titulo: string;
  sePuede: boolean;
}

const PUEDE: Readonly<
  Record<LugarEnLaFila, (fila: Fila, tesoro: string, clave: Clave) => boolean>
> = {
  obligacion: puedeSerObligacion,
  compromiso: puedeSerCompromiso,
  'ahorro-fijo': puedeSerAhorroFijo,
  reparto: puedeIrAlReparto,
  superavit: puedeSerSuperavit,
};

export function lugaresParaSumar(fila: Fila, tesoro: string, clave: Clave): LugarParaSumar[] {
  return LUGARES_EN_LA_FILA.map((lugar) => ({
    lugar,
    titulo: TITULO_DEL_LUGAR[lugar],
    sePuede: PUEDE[lugar](fila, tesoro, clave),
  }));
}
