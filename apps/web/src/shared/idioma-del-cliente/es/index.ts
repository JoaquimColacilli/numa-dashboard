import type { Ensanchar } from '@/shared/lib';

import { documento } from './documento';
import { encuesta } from './encuesta';
import { enlace } from './enlace';
import { facturas } from './facturas';
import { pdf } from './pdf';
import { presupuesto } from './presupuesto';
import { ui } from './ui';
import { vista } from './vista';
import { whatsapp } from './whatsapp';
import { whatsappDeLaEncuesta } from './whatsappDeLaEncuesta';

export const es = {
  documento,
  encuesta,
  enlace,
  facturas,
  pdf,
  presupuesto,
  ui,
  vista,
  whatsapp,
  whatsappDeLaEncuesta,
} as const;

export type MensajesDelCliente = Ensanchar<typeof es>;
