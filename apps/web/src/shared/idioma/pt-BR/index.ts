import type { Mensajes } from '../es';

import { agenda } from './agenda';
import { api } from './api';
import { armarElPresupuesto } from './armarElPresupuesto';
import { avanzarLaConsulta } from './avanzarLaConsulta';
import { cliente } from './cliente';
import { comun } from './comun';
import { configurarTaller } from './configurarTaller';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { editarProyecto } from './editarProyecto';
import { editarTesoro } from './editarTesoro';
import { enlace } from './enlace';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { llevarLaAgenda } from './llevarLaAgenda';
import { movimiento } from './movimiento';
import { paginaAgenda } from './paginaAgenda';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaFinanzas } from './paginaFinanzas';
import { paginaInicio } from './paginaInicio';
import { paginaProyectos } from './paginaProyectos';
import { proyecto } from './proyecto';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';

export const ptBR = {
  agenda,
  api,
  armarElPresupuesto,
  avanzarLaConsulta,
  cliente,
  comun,
  configurarTaller,
  coordinarLaEntrega,
  editarProyecto,
  editarTesoro,
  enlace,
  fila,
  hacerElSeguimiento,
  lib,
  liquidarProyecto,
  llevarLaAgenda,
  movimiento,
  paginaAgenda,
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
