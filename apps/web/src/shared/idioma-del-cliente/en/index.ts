import type { MensajesDelCliente } from '../es';

import { encuesta } from './encuesta';
import { ui } from './ui';
import { vista } from './vista';
import { whatsapp } from './whatsapp';
import { whatsappDeLaEncuesta } from './whatsappDeLaEncuesta';

export const en = {
  encuesta,
  ui,
  vista,
  whatsapp,
  whatsappDeLaEncuesta,
} satisfies MensajesDelCliente;
