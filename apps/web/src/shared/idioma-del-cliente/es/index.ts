import type { Ensanchar } from '@/shared/lib';

import { ui } from './ui';
import { vista } from './vista';

export const es = {
  ui,
  vista,
} as const;

export type MensajesDelCliente = Ensanchar<typeof es>;
