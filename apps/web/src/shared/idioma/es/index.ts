import type { Ensanchar } from '@/shared/lib';

import { api } from './api';
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
import { paginaAnalitico } from './paginaAnalitico';
import { registrarMovimiento } from './registrarMovimiento';

export const es = {
  api,
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
  paginaAnalitico,
  registrarMovimiento,
} as const;

export type Mensajes = Ensanchar<typeof es>;
