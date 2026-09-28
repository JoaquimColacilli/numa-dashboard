import { createContext } from 'react';

import type { LugarDelTramo } from '../../model/disposicion';

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
  sumarEn: ((lugar: LugarDelTramo, boton: HTMLElement) => void) | null;
}

export const ContextoDeLasAristas = createContext<AccionesDeLasAristas>({ sumarEn: null });
