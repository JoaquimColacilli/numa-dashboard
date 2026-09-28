import {
  lugarLibreDelReparto,
  moverPaso,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type Fila,
} from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import {
  entraOtroPaso,
  FICHA_DEL_DIEZMO,
  FICHA_DEL_REPARTO,
  FICHA_NUEVA,
  fichaDeLaParte,
  fichaDelPaso,
  puedeIrAlReparto,
  queFichaEs,
  sumarAlReparto,
  sumarComoPaso,
} from '@/features/armar-la-fila';

export type LugarDelNuevo = 'paso' | 'reparto';

export type Union =
  | { tipo: 'nuevo'; despuesDe: string | null; lugar: LugarDelNuevo }
  | { tipo: 'reparto'; tesoro: string }
  | { tipo: 'paso'; tesoro: string; despuesDe: string | null }
  | { tipo: 'mover'; tesoro: string; despuesDe: string | null };

function despuesDeLaFicha(origen: string): string | null | undefined {
  if (origen === FICHA_DEL_DIEZMO) return null;
  const ficha = queFichaEs(origen);
  return ficha?.tipo === 'paso' ? ficha.tesoro : undefined;
}

export function unionDe(
  fila: Fila,
  tesoros: readonly Pick<TesoroDelTaller, 'id' | 'clave'>[],
  origen: string,
  destino: string,
): Union | null {
  if (origen === destino) return null;
  const desdeElReparto = origen === FICHA_DEL_REPARTO;
  const despuesDe = despuesDeLaFicha(origen);
  if (!desdeElReparto && despuesDe === undefined) return null;
  const hayLugarEnElReparto =
    fila.reparto.length < TOPE_DE_PARTES && lugarLibreDelReparto(fila) > 0;

  if (destino === FICHA_NUEVA) {
    if (desdeElReparto) {
      return hayLugarEnElReparto ? { tipo: 'nuevo', despuesDe: null, lugar: 'reparto' } : null;
    }
    return fila.pasos.length < TOPE_DE_PASOS
      ? { tipo: 'nuevo', despuesDe: despuesDe ?? null, lugar: 'paso' }
      : null;
  }

  const ficha = queFichaEs(destino);
  if (ficha === null || ficha.tesoro === null) return null;
  const tesoro = ficha.tesoro;

  if (ficha.tipo === 'estante') {
    const clave = tesoros.find((candidato) => candidato.id === tesoro)?.clave ?? null;
    if (desdeElReparto) {
      return puedeIrAlReparto(fila, tesoro, clave) ? { tipo: 'reparto', tesoro } : null;
    }
    if (clave === 'diezmo' || !entraOtroPaso(fila, tesoro)) return null;
    return { tipo: 'paso', tesoro, despuesDe: despuesDe ?? null };
  }

  if (ficha.tipo === 'paso' && !desdeElReparto) {
    if (despuesDe === tesoro) return null;
    return { tipo: 'mover', tesoro, despuesDe: despuesDe ?? null };
  }
  return null;
}

export function lugarAlSoltar(fila: Fila, tesoro: string, despuesDe: string | null): number {
  const sin = fila.pasos.filter((paso) => paso.tesoro !== tesoro);
  return despuesDe === null ? 0 : sin.findIndex((paso) => paso.tesoro === despuesDe) + 1;
}

export function fraseDeLaUnion(
  fila: Fila,
  nombreDe: (tesoro: string) => string,
  union: Union | null,
  hayDestino: boolean,
): string {
  if (!hayDestino) return 'Llevala hasta un tesoro';
  if (union === null) return 'Ahí no se puede unir';
  switch (union.tipo) {
    case 'nuevo':
      return 'Soltá para crear un tesoro acá';
    case 'reparto':
      return `Soltá: ${nombreDe(union.tesoro)} entra al reparto`;
    case 'paso':
      return `Soltá: ${nombreDe(union.tesoro)} entra como paso ${String(lugarAlSoltar(fila, union.tesoro, union.despuesDe) + 1)}`;
    case 'mover':
      return `Soltá: ${nombreDe(union.tesoro)} pasa a ser el paso ${String(lugarAlSoltar(fila, union.tesoro, union.despuesDe) + 1)}`;
  }
}

export interface UnionAplicada {
  fila: Fila;
  elegir: string;
}

export function aplicarLaUnion(
  fila: Fila,
  tesoros: readonly Pick<TesoroDelTaller, 'id' | 'clave'>[],
  union: Exclude<Union, { tipo: 'nuevo' }>,
): UnionAplicada {
  const clave = tesoros.find((candidato) => candidato.id === union.tesoro)?.clave ?? null;
  switch (union.tipo) {
    case 'reparto':
      return { fila: sumarAlReparto(fila, union.tesoro), elegir: fichaDeLaParte(union.tesoro) };
    case 'paso':
      return {
        fila: sumarComoPaso(fila, union.tesoro, clave, union.despuesDe),
        elegir: fichaDelPaso(union.tesoro),
      };
    case 'mover':
      return {
        fila: moverPaso(fila, union.tesoro, lugarAlSoltar(fila, union.tesoro, union.despuesDe)),
        elegir: fichaDelPaso(union.tesoro),
      };
  }
}

export function anuncioDelMovimiento(
  fila: Fila,
  tesoro: string,
  nombre: string,
  hacia: -1 | 1,
): string {
  const lugar = fila.pasos.findIndex((paso) => paso.tesoro === tesoro);
  if (lugar === -1) return 'Solo los pasos de la fila cambian de lugar.';
  const destino = lugar + hacia;
  if (destino < 0) return `${nombre} ya es el primer paso.`;
  if (destino >= fila.pasos.length) return `${nombre} ya es el último paso.`;
  return `${nombre} pasa a ser el paso ${String(destino + 1)} de ${String(fila.pasos.length)}.`;
}
