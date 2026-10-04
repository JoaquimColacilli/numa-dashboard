export { borrarCacheLocal, crearPersisterIndexedDb } from './cache/persister';
export { guardarCacheAhora, registrarGuardado } from './cache/guardado';
export { claveDeReplica, claveDeTodaReplica, RAIZ_DE_REPLICA } from './claves';
export { COLA_DE_SALIDA, esPersistible, reanudarCola } from './cache/cola';
export {
  conUnaSolaCeremonia,
  ESPERA_DE_LA_CEREMONIA_ANTERIOR_MS,
  TOPE_DE_UNA_CEREMONIA_MS,
  type DesenlaceDeLaCeremonia,
  type OpcionesDeLaCeremonia,
} from './ceremonia';
export { limpiarDatosLocales } from './cache/limpieza';
export { copiar, seleccionarEnPantalla, type ComoQuedo } from './copiar';
export {
  diaDelMes,
  diaLocal,
  diasDelMes,
  diasHasta,
  diaYMes,
  diaYMesCorto,
  errorDeLaFechaDeLaPlata,
  fechaConAnio,
  fechaCorta,
  fechaCortaSinAnio,
  fechaDelRotulo,
  fechaEnUnaFrase,
  fechaLarga,
  haceCuanto,
  horaEnElTaller,
  hoyEnElTaller,
  hoyLocal,
  mesAnterior,
  mesDeLaFecha,
  mesEnUnaFrase,
  nombreDelMes,
  relativa,
  ZONA_DEL_TALLER,
} from './fechas';
export { nombreDelTaller, TALLER_DE_RESPALDO } from './taller';
export {
  enlaceParaEscribir,
  mensajeParaElCliente,
  telefonoParaWhatsapp,
  whatsappCon,
  type TextosDelMensajeAlCliente,
  type UnMensajeAlCliente,
} from './telefono';
export {
  alternar,
  compararTextos,
  criterioPorId,
  ordenar,
  type Criterio,
  type Sentido,
  type TipoDeOrden,
} from './orden';
export {
  conFondo,
  esRutaDeHoja,
  fondoDelEstado,
  fondoPorDefecto,
  HOJAS_POR_RUTA,
  useCerrarHoja,
  useUbicacionVisible,
  type EstadoConFondo,
  type PatronDeHoja,
} from './hojas';
export {
  activarBloqueo,
  anotarCredencial,
  anotarIngresoConContrasena,
  anotarPreguntaPorLaHuella,
  bloqueoDe,
  CLAVE_DEL_BLOQUEO,
  entroRecienConContrasena,
  huellaDisponible,
  marcarDesbloqueada,
  olvidarBloqueo,
  pedirHuella,
  useAppBloqueada,
  useBloqueoActivo,
  vigilarElBloqueo,
  yaSePreguntoPorLaHuella,
  type BloqueoDelDispositivo,
  type ResultadoDeLaHuella,
} from './huella';
export { anotarHojaAbierta, type HojaAbierta } from './hojas-abiertas';
export { Ir, type IrProps } from './Ir';
export {
  ContextoDeLaPuerta,
  DESTINO_DE_LA_TARJETA,
  destinoDeLaTarjeta,
  ORIGEN_DE_LA_TARJETA,
  origenDeLaTarjeta,
  useIr,
  usePuerta,
  useSenalDeUnaVez,
  useVolver,
  type ComoIr,
  type OpcionesDeIr,
  type PuertoDeNavegacion,
  type SenalDeUnaVez,
  type Vuelta,
} from './puerta';
export { useVueltaPorUnAviso } from './vuelta-por-un-aviso';
export {
  aplicarLaVersionNueva,
  buscarVersionNueva,
  useVersionNueva,
  vigilarLaVersionNueva,
} from './version-nueva';
export {
  CORTE_DE_CELULAR,
  esCelular,
  esMedidaDeCelular,
  useAnchoDePantalla,
  type AnchoDePantalla,
} from './pantalla';
export { useAltoVisible, useVentanaVisible, type VentanaVisible } from './teclado';
export { useScrollPorPantalla } from './scroll';
export { usePantallaDespierta } from './pantalla-despierta';
export { useAlgoEnCurso, useHayAlgoEnCurso } from './en-curso';
export { useTirarParaActualizar, type FaseDelTiron, type Tiron } from './tirar-para-actualizar';
export {
  adornosDelCampo,
  enPesosEnteros,
  formatearCadaMoneda,
  formatearLaPlata,
  formatearPesos,
  formatearPlata,
  marcadorDelCampo,
  porMoneda,
  separadoresDelCampo,
  type AdornosDelCampo,
  type SeparadoresDelCampo,
} from './plata';
export { crearPlural, type FormasDelPlural } from './plural';
export { fijarLosTextosDeLib, textosDeLib, type TextosDeLib } from './textos';
export {
  frasesDeLoQueFaltaParaFacturar,
  type ClaveDeLoQueFalta,
  type FraseDeLoQueFalta,
} from './facturacion';
export { type Ensanchar, type Envoltorio } from './catalogo';
export { ABRE_EL_SEUDOIDIOMA, CIERRA_EL_SEUDOIDIOMA, seudoCatalogo, seudoTexto } from './seudo';
export {
  CLAVE_DEL_IDIOMA,
  CLAVE_DEL_SEUDOIDIOMA,
  etiquetaActual,
  fijarElIdiomaEnUso,
  guardarElIdioma,
  idiomaActual,
  enLista,
  idiomaEnUso,
  idiomaGuardadoDe,
  olvidarElIdioma,
  seudoidiomaPrendido,
  suscribirseAlIdioma,
  useIdiomaEnUso,
  type IdiomaEnUso,
  type IdiomaGuardado,
} from './idioma';
export {
  DIAS_DE_LA_SEMANA,
  diaDeLaSemana,
  fechasDelMes,
  INICIALES_DE_LA_SEMANA,
  mesesEntre,
  mesPrevio,
  mesSiguiente,
  primerDiaDelMes,
  rangoDeLaGrilla,
  semanasDelMes,
  ultimoDiaDelMes,
  type CeldaDelMes,
  type RangoDeLaGrilla,
} from './mes';
export { hayCambios } from './cambios';
export {
  codificarLienzo,
  decodificarImagen,
  ImagenIlegible,
  lienzoDelDocumento,
  type ContextoDeSalida,
  type ImagenDecodificada,
  type LienzoDeSalida,
  type MedidasDeImagen,
} from './imagen';
export {
  abiertaComoApp,
  avisosSoportados,
  datosDeLaSuscripcion,
  esIphoneOIpad,
  esteDispositivoEsIphone,
  pedirPermisoDeAvisos,
  permisoDeAvisos,
  suscribirElDispositivo,
  suscripcionDelDispositivo,
  type DatosDeLaSuscripcion,
} from './push';
export {
  CLAVE_DE_LOS_ENLACES,
  enlaceDeLaEncuesta,
  enlaceDelCliente,
  hashDelToken,
  olvidarLosTokens,
  olvidarToken,
  recordarToken,
  tokenDelEnlace,
  tokenNuevo,
} from './enlaces';
export {
  esLaEncuestaPublica,
  esLaVistaPublica,
  esUnaPaginaPublica,
  PREFIJO_DE_LA_ENCUESTA_PUBLICA,
  RUTA_DE_LA_ENCUESTA_PUBLICA,
  PARAMETRO_DE_TESORO,
  parametroDelTesoro,
  type TesoroDeLaRuta,
  PREFIJO_DE_LA_VISTA_PUBLICA,
  PARAMETRO_DE_RESPUESTA,
  RUTA_DE_OPINIONES,
  RUTA_DE_PREGUNTAS,
  rutaDeLaPregunta,
  rutaDeLaRespuesta,
  rutaDeAprobacion,
  rutaDeCompartir,
  rutaDelPresupuesto,
  rutaDeLaVistaDelCliente,
  RUTA_DE_LA_VISTA_PUBLICA,
  rutaDeCierre,
  rutaDeCobro,
  rutaDeEdicion,
  rutaDeFinanzasDelTesoro,
  rutaDeMovimientoNuevo,
  movimientoPropuesto,
  type MovimientoPropuesto,
  rutaDelCliente,
  rutaDelMovimiento,
  rutaDelProyecto,
  rutaDeAnotar,
  rutaDeContactoNuevo,
  rutaDeProyectoNuevo,
  fechaDelEnlace,
  PARAMETRO_DE_ENTREGA,
  PARAMETRO_DE_VISITA,
  tesoroDelParametro,
  RUTA_DE_AGENDA,
  RUTA_DE_AJUSTES,
  RUTA_DE_ANOTAR,
  RUTA_DE_AVISOS,
  RUTA_DEL_PRESUPUESTO_EN_AJUSTES,
  RUTA_DE_LA_FACTURACION,
  RUTA_DEL_ASISTENTE_DE_ARCA,
  RUTA_DE_CONTACTO_NUEVO,
  RUTA_DE_DIEZMO,
  RUTA_DE_LAS_ESTADISTICAS,
  RUTA_DE_TESOROS,
  RUTA_DE_FINANZAS,
  RUTA_DE_MOVIMIENTO_NUEVO,
  RUTA_DE_PROYECTO_NUEVO,
  RUTA_DE_PROYECTOS,
  RUTA_DE_CONSULTAS,
  RUTA_DE_SEGUIMIENTO,
  RUTA_DEL_ANALITICO,
  RUTA_DEL_HISTORIAL,
} from './rutas';
export {
  ICONOS_DE_TESORO,
  iconoDelTesoro,
  NOMBRE_DE_LA_TINTA,
  TESORO,
  TESOROS_EN_ORDEN,
  TINTA,
  TINTAS_DE_TESORO,
  tintaDelTesoro,
  type ClasesDeLaTinta,
  type DatosDelTesoro,
  type TintaDeTesoro,
} from './tesoros';
export { formatearPorcentaje, parsearPorcentaje, SENA_MAXIMA_BP } from './porcentaje';
export {
  anchoDeLaColumna,
  AREA_DE_UN_PUNTO,
  BANDA_CON_TODOS_LOS_ROTULOS,
  BANDA_MINIMA,
  caminoDeLaColumna,
  CANALETA_DEL_EJE,
  cota,
  ejeDeDecenas,
  escalaLineal,
  LUGARES_MINIMOS,
  lugaresQueEntran,
  marcasCada,
  pisosDeLosPuntos,
  plataCompacta,
  rotuloVisible,
  techoDeDias,
  techoRedondo,
  type Cota,
  type Escala,
} from './graficos';
export {
  anotarAviso,
  avisosAnotados,
  CLAVE_DE_AVISOS,
  descartarAviso,
  limpiarRechazosDelProyecto,
  useAvisos,
  useAvisosDelProyecto,
  type AvisoAnotado,
  type TipoDeAviso,
} from './avisos/bandeja';
export {
  avisarEnPantalla,
  avisoEnPantalla,
  avisosDeLaMeta,
  descartarDePantalla,
  metaDeAvisos,
  TEXTOS_DE_AVISO,
  useAvisosEnPantalla,
  vaciarAvisosEnPantalla,
  type AccionDelAviso,
  type AvisoEnPantalla,
  type AvisosDeUnaMutacion,
  type NuevoAviso,
  type QueSeGuarda,
  type TonoDelAviso,
} from './avisos/pantalla';
export { calcularEstadoSync, describirEstadoSync, type EstadoSync } from './sync/estado-sync';
export {
  CLAVE_DEL_TEMA,
  elegirTema,
  preferenciaDeTema,
  useTema,
  type PreferenciaDeTema,
} from './tema';
export { useEstadoSync, useHaySenal } from './sync/useEstadoSync';
export { uuidv7 } from './uuid';
