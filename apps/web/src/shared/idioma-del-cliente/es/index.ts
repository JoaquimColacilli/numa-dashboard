import type { Ensanchar } from '@/shared/lib';

import { encuesta } from './encuesta';
import { ui } from './ui';
import { vista } from './vista';
import { whatsapp } from './whatsapp';
import { whatsappDeLaEncuesta } from './whatsappDeLaEncuesta';

export const es = {
  encuesta,
  ui,
  vista,
  whatsapp,
  whatsappDeLaEncuesta,
} as const;

export type MensajesDelCliente = Ensanchar<typeof es>;
