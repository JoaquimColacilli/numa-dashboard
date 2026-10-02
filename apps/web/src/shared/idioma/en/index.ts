import type { Mensajes } from '../es';

import { avanzarLaConsulta } from './avanzarLaConsulta';
import { comun } from './comun';
import { editarTesoro } from './editarTesoro';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { inicio } from './inicio';
import { lib } from './lib';
import { movimiento } from './movimiento';
import { registrarMovimiento } from './registrarMovimiento';

export const en = {
  avanzarLaConsulta,
  comun,
  editarTesoro,
  fila,
  hacerElSeguimiento,
  inicio,
  lib,
  movimiento,
  registrarMovimiento,
} satisfies Mensajes;
