import type { MensajesDelCliente } from './es';

export interface LlamadaCentinela {
  llamar: (m: MensajesDelCliente) => unknown;
  tieneQueDecir: readonly string[];
}

export type Centinelas = Readonly<Record<string, LlamadaCentinela>>;
