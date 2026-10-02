import type { Mensajes } from '../es';

import { api } from './api';
import { armarElPresupuesto } from './armarElPresupuesto';
import { avanzarLaConsulta } from './avanzarLaConsulta';
import { comun } from './comun';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { editarProyecto } from './editarProyecto';
import { editarTesoro } from './editarTesoro';
import { enlace } from './enlace';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { movimiento } from './movimiento';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaFinanzas } from './paginaFinanzas';
import { paginaInicio } from './paginaInicio';
import { paginaProyectos } from './paginaProyectos';
import { proyecto } from './proyecto';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';

export const en = {
  api,
  armarElPresupuesto,
  avanzarLaConsulta,
  comun,
  coordinarLaEntrega,
  editarProyecto,
  editarTesoro,
  enlace,
  fila,
  hacerElSeguimiento,
  lib,
  liquidarProyecto,
  movimiento,
  paginaAnalitico,
  paginaDiezmo,
  paginaFinanzas,
  paginaInicio,
  paginaProyectos,
  proyecto,
  registrarMovimiento,
  replica,
  ui,
} satisfies Mensajes;
