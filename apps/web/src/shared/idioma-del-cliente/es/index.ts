import type { Ensanchar } from '@/shared/lib';

import { vista } from './vista';

export const es = {
  vista,
} as const;

export type MensajesDelCliente = Ensanchar<typeof es>;
