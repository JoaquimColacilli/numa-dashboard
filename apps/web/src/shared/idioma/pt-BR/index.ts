import type { Mensajes } from '../es';

import { comun } from './comun';
import { finanzas } from './finanzas';
import { inicio } from './inicio';
import { movimientos } from './movimientos';
import { tesoros } from './tesoros';

export const ptBR = {
  comun,
  inicio,
  tesoros,
  movimientos,
  finanzas,
} satisfies Mensajes;
