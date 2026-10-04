import type { Mensajes } from '../es';

import { activarHuella } from './activarHuella';
import { adjuntarArchivos } from './adjuntarArchivos';
import { agenda } from './agenda';
import { ajustarCocos } from './ajustarCocos';
import { api } from './api';
import { appLayout } from './appLayout';
import { appNavegacion } from './appNavegacion';
import { appProviders } from './appProviders';
import { appRouter } from './appRouter';
import { archivo } from './archivo';
import { armarElPresupuesto } from './armarElPresupuesto';
import { armarLaFila } from './armarLaFila';
import { armarLaVidriera } from './armarLaVidriera';
import { avanzarLaConsulta } from './avanzarLaConsulta';
import { cerrarSesion } from './cerrarSesion';
import { cliente } from './cliente';
import { compartirConElCliente } from './compartirConElCliente';
import { comun } from './comun';
import { configurarTaller } from './configurarTaller';
import { coordinarLaEntrega } from './coordinarLaEntrega';
import { crearCuenta } from './crearCuenta';
import { cubrirElFaltante } from './cubrirElFaltante';
import { desbloquearLaApp } from './desbloquearLaApp';
import { editarCliente } from './editarCliente';
import { editarLaEncuesta } from './editarLaEncuesta';
import { editarPerfil } from './editarPerfil';
import { editarProyecto } from './editarProyecto';
import { editarTesoro } from './editarTesoro';
import { elegirIdioma } from './elegirIdioma';
import { elegirTema } from './elegirTema';
import { enlace } from './enlace';
import { facturacion } from './facturacion';
import { fila } from './fila';
import { hacerElSeguimiento } from './hacerElSeguimiento';
import { iniciarSesion } from './iniciarSesion';
import { leerLasOpiniones } from './leerLasOpiniones';
import { lib } from './lib';
import { liquidarProyecto } from './liquidarProyecto';
import { llevarLaAgenda } from './llevarLaAgenda';
import { movimiento } from './movimiento';
import { opinion } from './opinion';
import { paginaAcceso } from './paginaAcceso';
import { paginaAgenda } from './paginaAgenda';
import { paginaAjustes } from './paginaAjustes';
import { paginaAnalitico } from './paginaAnalitico';
import { paginaClientes } from './paginaClientes';
import { paginaCrearCuenta } from './paginaCrearCuenta';
import { paginaDiezmo } from './paginaDiezmo';
import { paginaEstadisticas } from './paginaEstadisticas';
import { paginaFinanzas } from './paginaFinanzas';
import { paginaInicio } from './paginaInicio';
import { paginaNuevaContrasena } from './paginaNuevaContrasena';
import { paginaOpiniones } from './paginaOpiniones';
import { paginaProyectos } from './paginaProyectos';
import { paginaRecuperar } from './paginaRecuperar';
import { paginaTesoros } from './paginaTesoros';
import { pdf } from './pdf';
import { pedirLaOpinion } from './pedirLaOpinion';
import { proyecto } from './proyecto';
import { recibirAvisos } from './recibirAvisos';
import { recuperarAcceso } from './recuperarAcceso';
import { registrarMovimiento } from './registrarMovimiento';
import { replica } from './replica';
import { ui } from './ui';
import { verNovedades } from './verNovedades';
import { vistaCliente } from './vistaCliente';

export const en = {
  activarHuella,
  adjuntarArchivos,
  agenda,
  ajustarCocos,
  api,
  appLayout,
  appNavegacion,
  appProviders,
  appRouter,
  archivo,
  armarElPresupuesto,
  armarLaFila,
  armarLaVidriera,
  avanzarLaConsulta,
  cerrarSesion,
  cliente,
  compartirConElCliente,
  comun,
  configurarTaller,
  coordinarLaEntrega,
  crearCuenta,
  cubrirElFaltante,
  desbloquearLaApp,
  editarCliente,
  editarLaEncuesta,
  editarPerfil,
  editarProyecto,
  editarTesoro,
  elegirIdioma,
  elegirTema,
  enlace,
  facturacion,
  fila,
  hacerElSeguimiento,
  iniciarSesion,
  leerLasOpiniones,
  lib,
  liquidarProyecto,
  llevarLaAgenda,
  movimiento,
  opinion,
  paginaAcceso,
  paginaAgenda,
  paginaAjustes,
  paginaAnalitico,
  paginaClientes,
  paginaCrearCuenta,
  paginaDiezmo,
  paginaEstadisticas,
  paginaFinanzas,
  paginaInicio,
  paginaNuevaContrasena,
  paginaOpiniones,
  paginaProyectos,
  paginaRecuperar,
  paginaTesoros,
  pdf,
  pedirLaOpinion,
  proyecto,
  recibirAvisos,
  recuperarAcceso,
  registrarMovimiento,
  replica,
  ui,
  verNovedades,
  vistaCliente,
} satisfies Mensajes;
