import type { Ensanchar } from '@/shared/lib';

import { comun } from './comun';
import { finanzas } from './finanzas';
import { inicio } from './inicio';
import { movimientos } from './movimientos';
import { tesoros } from './tesoros';

export const es = {
  comun,
  inicio,
  tesoros,
  movimientos,
  finanzas,
} as const;

export type Mensajes = Ensanchar<typeof es>;
