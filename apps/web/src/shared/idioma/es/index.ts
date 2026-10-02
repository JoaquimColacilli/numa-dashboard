import type { Ensanchar } from '@/shared/lib';

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
import { crearCuenta } from './crearCuenta';
import { desbloquearLaApp } from './desbloquearLaApp';
import { editarCliente } from './editarCliente';
import { editarLaEncuesta } from './editarLaEncuesta';
import { editarPerfil } from './editarPerfil';
import { editarProyecto } from './editarProyecto';
import { editarTesoro } from './editarTesoro';
import { elegirTema } from './elegirTema';
import { enlace } from './enlace';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { iniciarSesion } from './iniciarSesion';
import { leerLasOpiniones } from './leerLasOpiniones';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { llevarLaAgenda } from './llevarLaAgenda';
import { movimiento } from './movimiento';
import { paginaAcceso } from './paginaAcceso';
import { paginaAgenda } from './paginaAgenda';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaClientes } from './paginaClientes';
import { paginaCrearCuenta } from './paginaCrearCuenta';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaFinanzas } from './paginaFinanzas';
import { paginaInicio } from './paginaInicio';
import { paginaOpiniones } from './paginaOpiniones';
import { paginaProyectos } from './paginaProyectos';
import { paginaRecuperar } from './paginaRecuperar';
import { proyecto } from './proyecto';
import { recibirAvisos } from './recibirAvisos';
import { recuperarAcceso } from './recuperarAcceso';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';

export const es = {
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
  crearCuenta,
  desbloquearLaApp,
  editarCliente,
  editarLaEncuesta,
  editarPerfil,
  editarProyecto,
  editarTesoro,
  elegirTema,
  enlace,
  fila,
  hacerElSeguimiento,
  iniciarSesion,
  leerLasOpiniones,
  lib,
  liquidarProyecto,
  llevarLaAgenda,
  movimiento,
  paginaAcceso,
  paginaAgenda,
  paginaAnalitico,
  paginaClientes,
  paginaCrearCuenta,
  paginaDiezmo,
  paginaFinanzas,
  paginaInicio,
  paginaOpiniones,
  paginaProyectos,
  paginaRecuperar,
  proyecto,
  recibirAvisos,
  recuperarAcceso,
  registrarMovimiento,
  replica,
  ui,
} as const;

export type Mensajes = Ensanchar<typeof es>;
