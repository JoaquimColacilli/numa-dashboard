import type { Mensajes } from '../es';

import { api } from './api';
import { avanzarLaConsulta } from './avanzarLaConsulta';
import { comun } from './comun';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { editarTesoro } from './editarTesoro';
import { enlace } from './enlace';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { movimiento } from './movimiento';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaInicio } from './paginaInicio';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';

export const ptBR = {
  api,
  avanzarLaConsulta,
  comun,
  coordinarLaEntrega,
  editarTesoro,
  enlace,
  fila,
  hacerElSeguimiento,
  lib,
  liquidarProyecto,
  movimiento,
  paginaAnalitico,
  paginaDiezmo,
  paginaInicio,
  registrarMovimiento,
  replica,
  ui,
} satisfies Mensajes;
