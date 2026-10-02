import type { Ensanchar } from '@/shared/lib';

import { ui } from './ui';
import { vista } from './vista';
import { whatsapp } from './whatsapp';

export const es = {
  ui,
  vista,
  whatsapp,
} as const;

export type MensajesDelCliente = Ensanchar<typeof es>;
