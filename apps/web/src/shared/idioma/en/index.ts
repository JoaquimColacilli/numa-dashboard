import type { Mensajes } from '../es';

import { avanzarLaConsulta } from './avanzarLaConsulta';
import { comun } from './comun';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { editarTesoro } from './editarTesoro';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { inicio } from './inicio';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { movimiento } from './movimiento';
import { registrarMovimiento } from './registrarMovimiento';

export const en = {
  avanzarLaConsulta,
  comun,
  coordinarLaEntrega,
  editarTesoro,
  fila,
  hacerElSeguimiento,
  inicio,
  lib,
  liquidarProyecto,
  movimiento,
  registrarMovimiento,
} satisfies Mensajes;
