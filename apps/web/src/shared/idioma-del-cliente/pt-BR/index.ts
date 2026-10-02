import type { MensajesDelCliente } from '../es';

import { ui } from './ui';
import { vista } from './vista';
import { whatsapp } from './whatsapp';

export const ptBR = {
  ui,
  vista,
  whatsapp,
} satisfies MensajesDelCliente;
