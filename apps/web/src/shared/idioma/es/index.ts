import type { Ensanchar } from '@/shared/lib';

import { comun } from './comun';

export const es = {
  comun,
} as const;

export type Mensajes = Ensanchar<typeof es>;
