import type { Mensajes } from '../es';

import { comun } from './comun';
import { editarTesoro } from './editarTesoro';
import { fila } from './fila';
import { inicio } from './inicio';
import { movimiento } from './movimiento';
import { registrarMovimiento } from './registrarMovimiento';

export const en = {
  comun,
  editarTesoro,
  fila,
  inicio,
  movimiento,
  registrarMovimiento,
} satisfies Mensajes;
