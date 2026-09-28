import { createContext } from 'react';

export interface AccionesDeLasFichas {
  editable: boolean;
  alNuevo: () => void;
  puedeCrear: boolean;
}

export const ContextoDeLasFichas = createContext<AccionesDeLasFichas>({
  editable: false,
  alNuevo: () => undefined,
  puedeCrear: false,
});

export interface AccionesDeLasAristas {
  sumarDespuesDe: ((despuesDe: string | null, boton: HTMLElement) => void) | null;
}

export const ContextoDeLasAristas = createContext<AccionesDeLasAristas>({ sumarDespuesDe: null });
