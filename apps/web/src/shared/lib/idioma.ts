import { esIdioma, ETIQUETAS_DE_IDIOMA, IDIOMA_BASE, type Idioma } from '@maun/domain';
import { useSyncExternalStore } from 'react';

export const CLAVE_DEL_IDIOMA = 'maun:idioma';

export const CLAVE_DEL_SEUDOIDIOMA = 'maun:seudoidioma';

export type EstadoDelSeudoidioma = 'activo' | 'disponible';

export interface IdiomaEnUso {
  readonly idioma: Idioma;
  readonly seudo: boolean;
}

export interface IdiomaGuardado {
  usuarioId: string;
  idioma: Idioma;
}

let enUso: IdiomaEnUso = { idioma: IDIOMA_BASE, seudo: false };
const oyentes = new Set<() => void>();

export function idiomaActual(): Idioma {
  return enUso.idioma;
}

export function idiomaEnUso(): IdiomaEnUso {
  return enUso;
}

export function etiquetaActual(): string {
  return ETIQUETAS_DE_IDIOMA[enUso.idioma];
}

const LISTAS = new Map<Idioma, Intl.ListFormat>();

export function enLista(partes: readonly string[], idioma: Idioma = enUso.idioma): string {
  let formato = LISTAS.get(idioma);
  if (formato === undefined) {
    formato = new Intl.ListFormat(ETIQUETAS_DE_IDIOMA[idioma], {
      style: 'long',
      type: 'conjunction',
    });
    LISTAS.set(idioma, formato);
  }
  return formato.format(partes);
}

export function fijarElIdiomaEnUso(idioma: Idioma, seudo = false): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = ETIQUETAS_DE_IDIOMA[idioma];
  }
  if (enUso.idioma === idioma && enUso.seudo === seudo) return;
  enUso = { idioma, seudo };
  for (const oyente of oyentes) oyente();
}

export function suscribirseAlIdioma(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function useIdiomaEnUso(): IdiomaEnUso {
  return useSyncExternalStore(suscribirseAlIdioma, idiomaEnUso, idiomaEnUso);
}

export function idiomaGuardadoDe(usuarioId: string): Idioma | null {
  try {
    const crudo = globalThis.localStorage.getItem(CLAVE_DEL_IDIOMA);
    if (crudo === null) return null;
    const guardado = JSON.parse(crudo) as Partial<Record<keyof IdiomaGuardado, unknown>> | null;
    if (guardado?.usuarioId !== usuarioId) return null;
    return esIdioma(guardado.idioma) ? guardado.idioma : null;
  } catch {
    return null;
  }
}

export function guardarElIdioma(usuarioId: string, idioma: Idioma): void {
  try {
    globalThis.localStorage.setItem(
      CLAVE_DEL_IDIOMA,
      JSON.stringify({ usuarioId, idioma } satisfies IdiomaGuardado),
    );
  } catch {
    return;
  }
}

export function olvidarElIdioma(): void {
  try {
    globalThis.localStorage.removeItem(CLAVE_DEL_IDIOMA);
  } catch {
    return;
  }
}

export function fijarElSeudoidioma(estado: EstadoDelSeudoidioma): void {
  try {
    globalThis.localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, estado);
  } catch {
    return;
  }
}

export function estadoDelSeudoidioma(): EstadoDelSeudoidioma | null {
  try {
    const valor = globalThis.localStorage.getItem(CLAVE_DEL_SEUDOIDIOMA);
    return valor === 'activo' || valor === 'disponible' ? valor : null;
  } catch {
    return null;
  }
}
