import {
  CERO,
  lugarLibreDelReparto,
  moverObligacion,
  moverPaso,
  tipoDelPaso,
  TOPE_DE_OBLIGACIONES,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type Fila,
  type TipoDelPaso,
} from '@maun/domain';

import {
  entraEnLaFila,
  NOMBRE_DEL_TIPO,
  puedeIrAlReparto,
  puedeSerAhorroFijo,
  puedeSerCompromiso,
  puedeSerObligacion,
  TITULO_DEL_LUGAR,
  type LugarEnLaFila,
} from '@/entities/fila';
import { metaEnPesos, type TesoroDelTaller } from '@/entities/tesoro';
import { mensajes } from '@/shared/idioma';
import {
  FICHA_DEL_DIEZMO,
  FICHA_DEL_REPARTO,
  FICHA_NUEVA,
  fichaDeLaObligacion,
  fichaDeLaParte,
  fichaDelPaso,
  numeroEnLaFila,
  queFichaEs,
  sumarAlReparto,
  sumarComoObligacion,
  sumarComoTipo,
  tesoroDe,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';

import type { LugarDelTramo } from './disposicion';

export function despuesDePara(
  lugar: LugarEnLaFila,
  tramo: LugarDelTramo,
): string | null | undefined {
  switch (lugar) {
    case 'obligacion':
      return tramo.fuente === 'obligacion' ? tramo.despuesDe : null;
    case 'compromiso':
      return tramo.fuente === 'compromiso' ? tramo.despuesDe : null;
    case 'ahorro-fijo':
      return tramo.fuente === 'compromiso' || tramo.fuente === 'ahorro-fijo'
        ? tramo.despuesDe
        : null;
    case 'reparto':
    case 'superavit':
      return undefined;
  }
}

export function encabezadoDelMenu(
  vista: Pick<VistaDeLaFila, 'tesoros'>,
  lugar: LugarEnLaFila,
  tramo: LugarDelTramo,
): string {
  const despuesDe = despuesDePara(lugar, tramo);
  const titulo = TITULO_DEL_LUGAR[lugar];
  if (despuesDe === undefined) return titulo;
  if (despuesDe === null) return `${titulo}, al principio`;
  return `${titulo}, después de ${tesoroDe(vista, despuesDe).nombre}`;
}

export type LugarDeLaUnion = 'obligacion' | TipoDelPaso | 'reparto';

export type Union =
  | { tipo: 'nuevo'; lugar: LugarDeLaUnion; despuesDe: string | null }
  | { tipo: 'sumar'; lugar: LugarDeLaUnion; tesoro: string; despuesDe: string | null }
  | { tipo: 'mover'; lugar: 'obligacion' | TipoDelPaso; tesoro: string; despuesDe: string };

type TesoroDeLaUnion = Pick<TesoroDelTaller, 'id' | 'clave' | 'meta' | 'moneda'>;

function esDeOtraMonedaEnElEstante(tesoros: readonly TesoroDeLaUnion[], ficha: string): boolean {
  const queEs = queFichaEs(ficha);
  if (queEs?.tipo !== 'estante') return false;
  const tesoro = tesoros.find((candidato) => candidato.id === queEs.tesoro);
  return tesoro !== undefined && !entraEnLaFila(tesoro);
}

interface Origen {
  lugar: LugarDeLaUnion;
  despuesDe: string | null;
}

function lugarDeLaFicha(fila: Fila, diezmo: string, id: string): Origen | null {
  if (id === FICHA_DEL_REPARTO) return { lugar: 'reparto', despuesDe: null };
  if (id === FICHA_DEL_DIEZMO) return { lugar: 'obligacion', despuesDe: diezmo };
  const ficha = queFichaEs(id);
  if (ficha?.tipo === 'obligacion') return { lugar: 'obligacion', despuesDe: ficha.tesoro };
  if (ficha?.tipo === 'paso') {
    const paso = fila.pasos.find((candidato) => candidato.tesoro === ficha.tesoro);
    return paso === undefined ? null : { lugar: tipoDelPaso(paso.clase), despuesDe: ficha.tesoro };
  }
  return null;
}

function hayLugar(fila: Fila, lugar: LugarDeLaUnion): boolean {
  if (lugar === 'obligacion') return fila.obligaciones.length < TOPE_DE_OBLIGACIONES;
  if (lugar === 'reparto') {
    return fila.reparto.length < TOPE_DE_PARTES && lugarLibreDelReparto(fila) > 0;
  }
  return fila.pasos.length < TOPE_DE_PASOS;
}

function puedeIr(
  fila: Fila,
  lugar: LugarDeLaUnion,
  tesoro: string,
  clave: TesoroDelTaller['clave'],
): boolean {
  switch (lugar) {
    case 'obligacion':
      return puedeSerObligacion(fila, tesoro, clave);
    case 'compromiso':
      return puedeSerCompromiso(fila, tesoro, clave);
    case 'ahorro-fijo':
      return puedeSerAhorroFijo(fila, tesoro, clave);
    case 'reparto':
      return puedeIrAlReparto(fila, tesoro, clave);
  }
}

export function unionDe(
  fila: Fila,
  tesoros: readonly TesoroDeLaUnion[],
  diezmo: string,
  origen: string,
  destino: string,
): Union | null {
  if (origen === destino) return null;
  const desde = lugarDeLaFicha(fila, diezmo, origen);
  if (desde === null) return null;

  if (destino === FICHA_NUEVA) {
    return hayLugar(fila, desde.lugar)
      ? { tipo: 'nuevo', lugar: desde.lugar, despuesDe: desde.despuesDe }
      : null;
  }

  const ficha = queFichaEs(destino);
  if (ficha?.tipo === 'estante') {
    if (esDeOtraMonedaEnElEstante(tesoros, destino)) return null;
    const clave = tesoros.find((candidato) => candidato.id === ficha.tesoro)?.clave ?? null;
    return puedeIr(fila, desde.lugar, ficha.tesoro, clave)
      ? { tipo: 'sumar', lugar: desde.lugar, tesoro: ficha.tesoro, despuesDe: desde.despuesDe }
      : null;
  }

  const hasta = lugarDeLaFicha(fila, diezmo, destino);
  if (
    hasta === null ||
    hasta.lugar === 'reparto' ||
    desde.lugar !== hasta.lugar ||
    desde.despuesDe === null ||
    hasta.despuesDe === null
  ) {
    return null;
  }
  const lugar = hasta.lugar;
  const tesoro = hasta.despuesDe;
  const despuesDe = desde.despuesDe;
  if (lugar === 'obligacion') {
    const sin = fila.obligaciones.filter((obligacion) => obligacion.tesoro !== tesoro);
    const actual = fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === tesoro);
    return sin.findIndex((obligacion) => obligacion.tesoro === despuesDe) + 1 === actual
      ? null
      : { tipo: 'mover', lugar, tesoro, despuesDe };
  }
  return lugarAlSoltar(fila, tesoro, despuesDe) ===
    fila.pasos.findIndex((paso) => paso.tesoro === tesoro)
    ? null
    : { tipo: 'mover', lugar, tesoro, despuesDe };
}

export function lugarAlSoltar(fila: Fila, tesoro: string, despuesDe: string | null): number {
  const sin = fila.pasos.filter((paso) => paso.tesoro !== tesoro);
  return despuesDe === null ? 0 : sin.findIndex((paso) => paso.tesoro === despuesDe) + 1;
}

export interface UnionAplicada {
  fila: Fila;
  elegir: string;
}

export function aplicarLaUnion(
  fila: Fila,
  tesoros: readonly TesoroDeLaUnion[],
  diezmo: string,
  union: Exclude<Union, { tipo: 'nuevo' }>,
): UnionAplicada {
  const datos = tesoros.find((candidato) => candidato.id === union.tesoro);
  const clave = datos?.clave ?? null;
  const meta = datos === undefined ? null : metaEnPesos(datos);
  const fichaDeLaObligacionDe = (tesoro: string) =>
    tesoro === diezmo ? FICHA_DEL_DIEZMO : fichaDeLaObligacion(tesoro);
  if (union.tipo === 'mover') {
    if (union.lugar === 'obligacion') {
      const sin = fila.obligaciones.filter((obligacion) => obligacion.tesoro !== union.tesoro);
      const posicion = sin.findIndex((obligacion) => obligacion.tesoro === union.despuesDe) + 1;
      return {
        fila: moverObligacion(fila, union.tesoro, posicion),
        elegir: fichaDeLaObligacionDe(union.tesoro),
      };
    }
    return {
      fila: moverPaso(fila, union.tesoro, lugarAlSoltar(fila, union.tesoro, union.despuesDe)),
      elegir: fichaDelPaso(union.tesoro),
    };
  }
  switch (union.lugar) {
    case 'obligacion': {
      const posicion =
        union.despuesDe === null
          ? 0
          : fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === union.despuesDe) + 1;
      return {
        fila: sumarComoObligacion(fila, union.tesoro, { posicion }),
        elegir: fichaDeLaObligacionDe(union.tesoro),
      };
    }
    case 'reparto':
      return {
        fila: sumarAlReparto(fila, union.tesoro, undefined, meta),
        elegir: fichaDeLaParte(union.tesoro),
      };
    case 'compromiso':
    case 'ahorro-fijo':
      return {
        fila: sumarComoTipo(fila, union.lugar, union.tesoro, clave, CERO, {
          despuesDe: union.despuesDe,
          meta,
        }),
        elegir: fichaDelPaso(union.tesoro),
      };
  }
}

const CON_ARTICULO: Readonly<Record<'obligacion' | TipoDelPaso, string>> = {
  obligacion: 'la obligación',
  compromiso: 'el compromiso',
  'ahorro-fijo': 'el ahorro fijo',
};

export function fraseDeLaUnion(
  fila: Fila,
  tesoros: readonly TesoroDeLaUnion[],
  diezmo: string,
  nombreDe: (tesoro: string) => string,
  union: Union | null,
  hayDestino: boolean,
  destino?: string,
): string {
  if (!hayDestino) return 'Llevala hasta un tesoro';
  if (union === null) {
    return destino !== undefined && esDeOtraMonedaEnElEstante(tesoros, destino)
      ? mensajes().fila.laFilaRepartePesos
      : 'Ahí no se puede unir';
  }
  if (union.tipo === 'nuevo') return 'Soltá para crear un tesoro acá';
  const nombre = nombreDe(union.tesoro);
  if (union.lugar === 'reparto') return `Soltá: ${nombre} entra al reparto`;
  const despues = aplicarLaUnion(fila, tesoros, diezmo, union).fila;
  const numero = String(numeroEnLaFila(despues, union.tesoro));
  if (union.tipo === 'mover')
    return `Soltá: ${nombre} pasa a ser ${CON_ARTICULO[union.lugar]} ${numero}`;
  const tipo =
    union.lugar === 'obligacion' ? 'obligación' : NOMBRE_DEL_TIPO[union.lugar].toLowerCase();
  return `Soltá: ${nombre} entra como ${tipo} ${numero}`;
}

const PRIMERO: Readonly<Record<'obligacion' | TipoDelPaso, string>> = {
  obligacion: 'la primera obligación',
  compromiso: 'el primer compromiso',
  'ahorro-fijo': 'el primer ahorro fijo',
};

const ULTIMO: Readonly<Record<'obligacion' | TipoDelPaso, string>> = {
  obligacion: 'la última obligación',
  compromiso: 'el último compromiso',
  'ahorro-fijo': 'el último ahorro fijo',
};

export function anuncioDelMovimiento(
  fila: Fila,
  tesoro: string,
  nombre: string,
  hacia: -1 | 1,
): string {
  const lugarDeLaObligacion = fila.obligaciones.findIndex(
    (obligacion) => obligacion.tesoro === tesoro,
  );
  const lugarDelPaso = fila.pasos.findIndex((paso) => paso.tesoro === tesoro);
  const paso = fila.pasos[lugarDelPaso];
  if (lugarDeLaObligacion === -1 && paso === undefined) {
    return 'Solo las obligaciones y los pasos de la fila cambian de lugar.';
  }
  const grupo = paso === undefined ? 'obligacion' : tipoDelPaso(paso.clase);
  const delGrupo =
    paso === undefined
      ? fila.obligaciones.map((obligacion) => obligacion.tesoro)
      : fila.pasos
          .filter((candidato) => tipoDelPaso(candidato.clase) === grupo)
          .map((candidato) => candidato.tesoro);
  const lugar = delGrupo.indexOf(tesoro);
  const destino = lugar + hacia;
  if (destino < 0) return `${nombre} ya es ${PRIMERO[grupo]}.`;
  if (destino >= delGrupo.length) return `${nombre} ya es ${ULTIMO[grupo]}.`;
  const cuantos = fila.obligaciones.length + fila.pasos.length;
  const numero = numeroEnLaFila(fila, tesoro) + hacia;
  return `${nombre} pasa a ser ${CON_ARTICULO[grupo]} ${String(numero)} de ${String(cuantos)}.`;
}
