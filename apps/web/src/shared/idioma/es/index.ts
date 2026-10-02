import type { Ensanchar } from '@/shared/lib';

import { comun } from './comun';
import { editarTesoro } from './editarTesoro';
import { fila } from './fila';
import { inicio } from './inicio';
import { movimiento } from './movimiento';
import { registrarMovimiento } from './registrarMovimiento';

export const es = {
  comun,
  editarTesoro,
  fila,
  inicio,
  movimiento,
  registrarMovimiento,
} as const;

export type Mensajes = Ensanchar<typeof es>;
