export {
  CLAVE_DE_LA_FILA,
  MUTACION_DE_LA_FILA,
  type GuardadoDeLaFila,
  type LoQueGuardaLaFila,
} from './api/mutacion';
export { editarLaFila, empezarAEditar, sePuedeEditar } from './model/acciones';
export {
  borradorDeLaFila,
  cortarLaJunta,
  cuantosCambios,
  deshacerElBorrador,
  descartarElBorrador,
  empezarElBorrador,
  rehacerElBorrador,
  useBorradorDeLaFila,
  type BorradorDeLaFila,
} from './model/borrador';
export {
  aportesPorTesoro,
  comparacionDeLaFila,
  type RenglonDeLaComparacion,
} from './model/comparacion';
export {
  clasesPosibles,
  entraOtroPaso,
  lugarDelPaso,
  moverUnLugar,
  NOMBRE_DE_LA_CLASE,
  pasoDe,
  porcentajeParaSumar,
  puedeIrAlReparto,
  sacar,
  sumarAlFinal,
  sumarAlReparto,
  sumarComoPaso,
} from './model/edicion';
export {
  FICHA_DEL_DIEZMO,
  FICHA_DEL_ORIGEN,
  FICHA_DEL_REPARTO,
  FICHA_DEL_RESTO,
  FICHA_DEL_TITULO,
  FICHA_NUEVA,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  queFichaEs,
  tesoroDeLaFicha,
  type Ficha,
  type TipoDeFicha,
} from './model/fichas';
export { ATAJOS_DE_LA_PRUEBA, COBRO_DE_EJEMPLO, notaDelPasoEnLaPrueba } from './model/prueba';
export { describirCambios, porciento, textoDelProblema } from './model/textos';
export {
  encabezadoDeLaFicha,
  escalaDe,
  fichaVigente,
  loQueEstabaGuardado,
  probarLaFila,
  SIN_PRUEBA,
  tesoroDe,
  vistaDeLaFila,
  type EncabezadoDeLaFicha,
  type PruebaEnPantalla,
  type TesorosDelSistema,
  type VistaDeLaFila,
} from './model/vista';
export { BarraDeEdicion, BarraDeEdicionCelular } from './ui/BarraDeEdicion';
export { BotonEditarTesoro, type BotonEditarTesoroProps } from './ui/BotonEditarTesoro';
export { HojaDeGuardarLaFila, type HojaDeGuardarLaFilaProps } from './ui/HojaDeGuardarLaFila';
export { HojaDeLaFicha, type HojaDeLaFichaProps } from './ui/HojaDeLaFicha';
export { PanelDeDetalle, type PanelDeDetalleProps } from './ui/PanelDeDetalle';
export { Probador, TablaDeLaPrueba, type ProbadorProps } from './ui/Probador';
