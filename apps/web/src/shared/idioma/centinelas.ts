import type { Mensajes } from './es';

export interface LlamadaCentinela {
  llamar: (m: Mensajes) => unknown;
  tieneQueDecir: readonly string[];
}

export type Centinelas = Readonly<Record<string, LlamadaCentinela>>;
