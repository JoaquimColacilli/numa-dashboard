import type { Mensajes } from '../es';

import { activarHuella } from './activarHuella';
import { adjuntarArchivos } from './adjuntarArchivos';
import { agenda } from './agenda';
import { api } from './api';
import { archivo } from './archivo';
import { armarElPresupuesto } from './armarElPresupuesto';
import { armarLaVidriera } from './armarLaVidriera';
import { avanzarLaConsulta } from './avanzarLaConsulta';
import { cerrarSesion } from './cerrarSesion';
import { cliente } from './cliente';
import { comun } from './comun';
import { configurarTaller } from './configurarTaller';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { desbloquearLaApp } from './desbloquearLaApp';
import { editarCliente } from './editarCliente';
import { editarLaEncuesta } from './editarLaEncuesta';
import { editarProyecto } from './editarProyecto';
import { editarTesoro } from './editarTesoro';
import { enlace } from './enlace';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { leerLasOpiniones } from './leerLasOpiniones';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { llevarLaAgenda } from './llevarLaAgenda';
import { movimiento } from './movimiento';
import { paginaAgenda } from './paginaAgenda';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaClientes } from './paginaClientes';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaFinanzas } from './paginaFinanzas';
import { paginaInicio } from './paginaInicio';
import { paginaOpiniones } from './paginaOpiniones';
import { paginaProyectos } from './paginaProyectos';
import { proyecto } from './proyecto';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';

export const ptBR = {
  activarHuella,
  adjuntarArchivos,
  agenda,
  api,
  archivo,
  armarElPresupuesto,
  armarLaVidriera,
  avanzarLaConsulta,
  cerrarSesion,
  cliente,
  comun,
  configurarTaller,
  coordinarLaEntrega,
  desbloquearLaApp,
  editarCliente,
  editarLaEncuesta,
  editarProyecto,
  editarTesoro,
  enlace,
  fila,
  hacerElSeguimiento,
  leerLasOpiniones,
  lib,
  liquidarProyecto,
  llevarLaAgenda,
  movimiento,
  paginaAgenda,
  paginaAnalitico,
  paginaClientes,
  paginaDiezmo,
  paginaFinanzas,
  paginaInicio,
  paginaOpiniones,
  paginaProyectos,
  proyecto,
  registrarMovimiento,
  replica,
  ui,
} satisfies Mensajes;
