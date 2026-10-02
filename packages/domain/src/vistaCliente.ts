import type { FormaDeCoordinar, FranjaDeEntrega, RespuestaDeEntrega } from './entrega.ts';
import type { EstadoProyecto } from './estados.ts';
import { DIAS_HABILES_DE_ENTREGA, diasEntre, entregaEstimada } from './fechas.ts';
import type { Idioma } from './idioma.ts';
import { restar, sumarTodos, type Moneda, type Money } from './money.ts';
import { montoParaPegar, ofrece, type FormaDeCobro, type InstanciaDePago } from './pagos.ts';
import {
  acordadoAlAprobar,
  cuentasDelPresupuesto,
  mensajeParaElTaller,
  nombreDelArchivo,
  numeroVisible,
  plazoDelPresupuesto,
  type CuentaDeUnValor,
  type DocumentoDelPresupuesto,
} from './presupuesto.ts';
import { vencioElPresupuesto } from './vigencia.ts';
import { VIDRIERA_VACIA, type VidrieraDelTaller } from './vidriera.ts';

export type HitoDelTrabajo =
  'estimativo' | 'presupuesto' | 'aprobado' | 'fabricacion' | 'entregado' | 'pagado';

export type EstadoDelHito = 'pasado' | 'actual' | 'futuro';

export type FocoDeLaVista = 'saldo' | 'estado';

export interface PagoDelCliente {
  id: string;
  fecha: string;
  concepto: string;
  monto: Money;
}

export interface ArchivoDelCliente {
  id: string;
  nombre: string;
  tipo: string;
  ancho: number | null;
  alto: number | null;
  fecha: string;
  ruta: string;
  rutaMini: string;
}

export interface FechasDelTrabajo {
  estimativo: string | null;
  presupuesto: string | null;
  aprobado: string | null;
  inicio: string | null;
  entregaPautada: string | null;
  listo: string | null;
  entregado: string | null;
  cobro: string | null;
  valeHasta: string | null;
}

export interface ComprometidaDelTrabajo {
  fecha: string;
  franja: FranjaDeEntrega | null;
}

export interface PropuestaDeEntrega {
  id: string;
  forma: FormaDeCoordinar;
  fecha: string | null;
  franja: FranjaDeEntrega | null;
}

export interface DiaQueLeQuedaBien {
  fecha: string;
  franjas: readonly FranjaDeEntrega[];
}

export interface RespuestaDelCliente {
  respuesta: RespuestaDeEntrega;
  dias: readonly DiaQueLeQuedaBien[];
  nota: string;
}

export interface EntregaQueSeCoordina {
  comprometida: ComprometidaDelTrabajo | null;
  propuesta: PropuestaDeEntrega | null;
  respuesta: RespuestaDelCliente | null;
}

export interface CobroDelTaller {
  alias: string | null;
  cbu: string | null;
  titular: string | null;
  cuit: string | null;
  link: string | null;
}

export interface PagoOfrecido {
  instancia: InstanciaDePago;
  formas: readonly FormaDeCobro[];
  monto: Money | null;
}

export interface PagoPendiente {
  instancia: InstanciaDePago | null;
  formas: readonly FormaDeCobro[];
  monto: Money | null;
  siguiente: PagoOfrecido | null;
}

export interface VisitaDelTrabajo {
  dia: string | null;
  hecha: boolean;
}

export interface PresupuestoDelTrabajo {
  numero: string;
  revision: number;
  mandadoEl: string;
  queCambio: string | null;
  documento: DocumentoDelPresupuesto;
  idioma: Idioma;
  aceptadoEl: string | null;
  letra: string | null;
}

export interface TrabajoDelCliente {
  taller: string;
  cliente: string;
  trabajo: string;
  idioma: Idioma;
  direccion: string;
  estado: EstadoProyecto;
  precio: Money | null;
  sena: Money | null;
  fechas: FechasDelTrabajo;
  visita: VisitaDelTrabajo;
  entrega: EntregaQueSeCoordina;
  pago: PagoPendiente;
  cobro: CobroDelTaller;
  pagos: readonly PagoDelCliente[];
  archivos: readonly ArchivoDelCliente[];
  vidriera: VidrieraDelTaller;
  valorDelRelevamiento: Money | null;
  presupuesto?: PresupuestoDelTrabajo | null;
}

export function hayComoTransferir(cobro: CobroDelTaller): boolean {
  return cobro.alias !== null || cobro.cbu !== null || cobro.link !== null;
}

export interface PagoQueSigue {
  instancia: InstanciaDePago;
  monto: Money | null;
  nombre: string;
  comoSePaga: string;
}

export interface CuentaParaTransferir {
  alias: string | null;
  cbu: string | null;
  titular: string | null;
  cuit: string | null;
}

export interface ComoPagar {
  instancia: InstanciaDePago;
  monto: Money | null;
  montoParaPegar: string | null;
  transferencia: boolean;
  cuenta: CuentaParaTransferir;
  link: string | null;
  mercadoPago: boolean;
  efectivo: boolean;
  faltanLosDatos: boolean;
  titulo: string;
  etiquetaDelImporte: string;
  pasos: string;
  enEfectivo: string;
  siguiente: PagoQueSigue | null;
  vencio: string | null;
}

export interface TextosDeComoPagar {
  titulo: string;
  etiquetaDelImporte: Readonly<Record<InstanciaDePago, string>>;
  nombre: Readonly<Record<InstanciaDePago, string>>;
  porTransferenciaOEnEfectivo: string;
  porTransferencia: string;
  enEfectivo: string;
  pasosParaTransferir: string;
  soloEfectivo: Readonly<Record<InstanciaDePago, string>>;
  tambienEfectivo: Readonly<Record<InstanciaDePago, string>>;
}

function comoSePaga(formas: readonly FormaDeCobro[], textos: TextosDeComoPagar): string {
  const porTransferencia = ofrece(formas, 'transferencia');
  const enEfectivo = ofrece(formas, 'efectivo');
  if (porTransferencia && enEfectivo) return textos.porTransferenciaOEnEfectivo;
  if (porTransferencia) return textos.porTransferencia;
  return textos.enEfectivo;
}

function elQueSigue(pago: PagoOfrecido | null, textos: TextosDeComoPagar): PagoQueSigue | null {
  if (pago === null) return null;
  return {
    instancia: pago.instancia,
    monto: pago.monto,
    nombre: textos.nombre[pago.instancia],
    comoSePaga: comoSePaga(pago.formas, textos),
  };
}

const SIN_CUENTA: CuentaParaTransferir = { alias: null, cbu: null, titular: null, cuit: null };

function vencioLaSena(trabajo: TrabajoDelCliente, hoy: string): string | null {
  const valeHasta = fechasDe(trabajo).valeHasta ?? null;
  if (trabajo.estado !== 'presupuesto_enviado') return null;
  return vencioElPresupuesto(valeHasta, hoy) ? valeHasta : null;
}

export function comoPagar(
  trabajo: TrabajoDelCliente,
  hoy: string,
  textos: TextosDeComoPagar,
): ComoPagar | null {
  const pago = trabajo.pago as PagoPendiente | undefined;
  const cobro = trabajo.cobro as CobroDelTaller | undefined;
  if (pago === undefined || cobro === undefined) return null;

  const { instancia, formas, monto } = pago;
  if (instancia === null) return null;

  const vencio = instancia === 'sena' ? vencioLaSena(trabajo, hoy) : null;
  if (vencio !== null) {
    return {
      instancia,
      monto: null,
      montoParaPegar: null,
      transferencia: false,
      cuenta: SIN_CUENTA,
      link: null,
      mercadoPago: false,
      efectivo: false,
      faltanLosDatos: false,
      titulo: textos.titulo,
      etiquetaDelImporte: textos.etiquetaDelImporte[instancia],
      pasos: textos.pasosParaTransferir,
      enEfectivo: '',
      siguiente: null,
      vencio,
    };
  }

  const pideTransferencia = ofrece(formas, 'transferencia');
  const transferencia = pideTransferencia && hayComoTransferir(cobro);
  const efectivo = ofrece(formas, 'efectivo');
  const link = transferencia ? cobro.link : null;

  return {
    instancia,
    monto,
    montoParaPegar: monto === null ? null : montoParaPegar(monto),
    transferencia,
    cuenta: transferencia
      ? { alias: cobro.alias, cbu: cobro.cbu, titular: cobro.titular, cuit: cobro.cuit }
      : SIN_CUENTA,
    link,
    mercadoPago: transferencia,
    efectivo,
    faltanLosDatos: pideTransferencia && !transferencia,
    titulo: textos.titulo,
    etiquetaDelImporte: textos.etiquetaDelImporte[instancia],
    pasos: textos.pasosParaTransferir,
    enEfectivo: transferencia ? textos.tambienEfectivo[instancia] : textos.soloEfectivo[instancia],
    siguiente: elQueSigue(pago.siguiente, textos),
    vencio: null,
  };
}

export interface HitoDeLaVista {
  id: HitoDelTrabajo;
  etiqueta: string;
  estado: EstadoDelHito;
  fecha: string | null;
  texto: string;
}

export interface EventoDelCliente {
  id: string;
  fecha: string;
  texto: string;
  hito: HitoDelTrabajo;
  monto: Money | null;
}

export type EstadoDelRelevamiento = 'pendiente' | 'hecho';

export interface RelevamientoDeLaVista {
  estado: EstadoDelRelevamiento;
  fecha: string | null;
}

export interface NotaDelRelevamiento {
  hito: HitoDelTrabajo;
  estado: EstadoDelRelevamiento;
  etiqueta: string;
  titulo: string;
  lineas: readonly string[];
  resumen: string;
}

export interface FormatosDeFecha {
  larga: (fecha: string) => string;
  corta: (fecha: string) => string;
  enUnaFrase: (fecha: string) => string;
}

export type SenaDeLaVista =
  | { situacion: 'sin-presupuesto' }
  | { situacion: 'falta'; sena: Money; aCuenta: Money; falta: Money }
  | { situacion: 'cubierta'; sena: Money; aCuenta: Money };

export type ProyeccionDeLaEntrega =
  | { situacion: 'sin-fecha' }
  | { situacion: 'vigente'; senarAntesDe: string; listoPara: string }
  | { situacion: 'vencida'; vencio: string };

export type EntregaDelTrabajo =
  | { situacion: 'estimada'; fecha: string | null }
  | { situacion: 'a-coordinar' }
  | { situacion: 'confirmada'; fecha: string; franja: FranjaDeEntrega | null }
  | { situacion: 'a-confirmar' }
  | { situacion: 'entregado'; fecha: string | null };

export interface DatosDelTrabajo {
  direccion: string | null;
  inicio: string | null;
  entrega: EntregaDelTrabajo;
  sena: SenaDeLaVista;
}

export type TitularDeLaVista = string | { comprometida: ComprometidaDelTrabajo };

export type CoordinacionDeLaEntrega =
  | { situacion: 'sin-pedido' }
  | {
      situacion: 'un-dia';
      propuesta: PropuestaDeEntrega & { fecha: string };
      respuesta: RespuestaDelCliente | null;
    }
  | { situacion: 'sus-dias'; propuesta: PropuestaDeEntrega; respuesta: RespuestaDelCliente | null };

interface LoComunDeLaVista {
  taller: string;
  cliente: string;
  titulo: string;
  hitoActual: HitoDelTrabajo;
  titular: TitularDeLaVista;
  hitos: readonly HitoDeLaVista[];
  relevamiento: RelevamientoDeLaVista | null;
  eventos: readonly EventoDelCliente[];
  sigue: string;
  pagos: readonly PagoDelCliente[];
  pagado: Money;
  archivos: readonly ArchivoDelCliente[];
  comoPagar: ComoPagar | null;
  vidriera: VidrieraDelTaller;
}

export interface RelevamientoPorHacer {
  titulo: string;
  lineas: readonly string[];
  valor: Money | null;
}

interface LoComunDelPresupuesto {
  numero: string;
  revision: number;
  numeroVisible: string;
  mandadoEl: string;
  documento: DocumentoDelPresupuesto;
  cuentas: readonly CuentaDeUnValor<Moneda>[];
  nombreDelArchivo: string;
}

export interface PresupuestoMandado extends LoComunDelPresupuesto {
  etapa: 'mandado';
  queCambio: string | null;
  valeHasta: string | null;
  vencio: string | null;
  mensajeParaElTaller: string;
  pideLaSena: boolean;
}

export interface PresupuestoAceptado extends LoComunDelPresupuesto {
  etapa: 'aceptado';
  aceptadoEl: string | null;
  letra: string | null;
  acordado: Money<Moneda> | null;
}

export type PresupuestoDeLaVista = PresupuestoMandado | PresupuestoAceptado;

export interface VistaAntesDelPresupuesto extends LoComunDeLaVista {
  etapa: 'antes-del-presupuesto';
  relevamientoPorHacer: RelevamientoPorHacer | null;
}

export interface VistaEsperandoLaSena extends LoComunDeLaVista {
  etapa: 'esperando-la-sena';
  presupuesto: Money | null;
  opciones: number;
  sena: SenaDeLaVista;
  proyeccion: ProyeccionDeLaEntrega;
  elPresupuesto: PresupuestoMandado | null;
}

export type EtapaAprobada = 'aprobado' | 'fabricacion' | 'listo' | 'entregado' | 'pagado';

export interface VistaAprobada extends LoComunDeLaVista {
  etapa: EtapaAprobada;
  precio: Money | null;
  saldo: Money | null;
  saldado: boolean;
  foco: FocoDeLaVista;
  datos: DatosDelTrabajo;
  coordinacion: CoordinacionDeLaEntrega | null;
  elPresupuesto: PresupuestoAceptado | null;
}

export type VistaDelCliente = VistaAntesDelPresupuesto | VistaEsperandoLaSena | VistaAprobada;

export type EtapaDeLaVista = VistaDelCliente['etapa'];

export interface TextosDelHito {
  etiqueta: string;
  futuro: string;
}

export interface TextosDeLosEventos {
  estimativo: string;
  relevamiento: string;
  presupuesto: string;
  pago: string;
  pagoQueSalda: string;
  saldoQueSalda: string;
  aprobado: string;
  inicio: string;
  listo: string;
  entregado: string;
}

export interface TextosDeLaProyeccion {
  coordinamosLaEntrega: string;
  coordinamosLaEntregaAlAprobar: string;
  vencio: (fecha: string) => string;
  siLoAprobasAntesDel: (antesDe: string, listoPara: string) => string;
  siDejasLaSenaAntesDel: (antesDe: string, listoPara: string) => string;
  vamosTomandoLosTrabajos: string;
}

export interface TextosDeLaNota {
  pendiente: TextosDeLaNotaEnSuEstado;
  hecho: TextosDeLaNotaEnSuEstado;
  yaFuimosAMedir: string;
  fuimosAMedirEl: (fecha: string) => string;
  armamosElPresupuesto: string;
  cerrandoElPresupuesto: string;
  resumenYaFuimos: string;
  medidoEl: (fecha: string) => string;
  faltaMedirDelEstimado: readonly string[];
  sinFechaParaLaVisita: string;
  quedamosEnIrEl: (fecha: string) => string;
  resumenFaltaMedir: string;
}

export interface TextosDeLaNotaEnSuEstado {
  etiqueta: string;
  titulo: string;
}

export interface TextosDeLaVista {
  hitos: Readonly<Record<HitoDelTrabajo, TextosDelHito>>;
  aprobadoSinLaSena: string;
  cuandoLoApruebes: string;
  cuandoDejesLaSena: string;
  yaEstaPagado: string;
  enCurso: Readonly<Record<HitoDelTrabajo, string>>;
  presupuestoMandado: string;
  titularDelAprobado: Readonly<Record<SenaDeLaVista['situacion'], string>>;
  sigue: Readonly<Record<Exclude<HitoDelTrabajo, 'pagado'>, string>>;
  titularListo: string;
  listoParaEntregar: string;
  sigueListo: Readonly<Record<CoordinacionDeLaEntrega['situacion'] | 'mandados', string>>;
  sigueConLaComprometida: string;
  sigueConElPresupuestoMandado: string;
  sigueConLaSenaCubierta: string;
  sigueConElPresupuestoVencido: string;
  sigueFaltaLaSena: string;
  sigueFaltaMedir: Readonly<Record<'estimativo' | 'presupuesto', string>>;
  relevamientoTecnico: string;
  queEsElRelevamiento: readonly string[];
  eventos: TextosDeLosEventos;
  comoPagar: TextosDeComoPagar;
  proyeccion: TextosDeLaProyeccion;
  nota: TextosDeLaNota;
}

export const HITOS_DEL_CAMINO: readonly HitoDelTrabajo[] = [
  'presupuesto',
  'aprobado',
  'fabricacion',
  'entregado',
  'pagado',
];

const ORDEN_DE_LOS_HITOS: readonly HitoDelTrabajo[] = ['estimativo', ...HITOS_DEL_CAMINO];

const HITOS_DEL_PRESUPUESTO: readonly HitoDelTrabajo[] = ['estimativo', 'presupuesto'];

const APROBADOS: readonly EstadoProyecto[] = ['en_curso', 'entregado', 'cobrado'];

const ESPERAN_LA_VISITA: readonly EstadoProyecto[] = [
  'contacto',
  'presupuesto_estimativo',
  'relevamiento',
];

const TODAVIA_ANTES_DE_LA_VISITA: readonly EstadoProyecto[] = ['contacto', 'relevamiento'];

const SIN_VISITA: VisitaDelTrabajo = { dia: null, hecha: false };

function posicionDelHito(hito: HitoDelTrabajo): number {
  return ORDEN_DE_LOS_HITOS.indexOf(hito);
}

export function llegoAl(vista: VistaDelCliente, hito: HitoDelTrabajo): boolean {
  return posicionDelHito(vista.hitoActual) >= posicionDelHito(hito);
}

export function estaAprobada(vista: VistaDelCliente): vista is VistaAprobada {
  return vista.etapa !== 'antes-del-presupuesto' && vista.etapa !== 'esperando-la-sena';
}

function fechasDe(trabajo: TrabajoDelCliente): Partial<FechasDelTrabajo> {
  return trabajo.fechas;
}

function fechaDelEstimativo(trabajo: TrabajoDelCliente): string | null {
  return fechasDe(trabajo).estimativo ?? null;
}

function listoDelTrabajo(trabajo: TrabajoDelCliente): string | null {
  return fechasDe(trabajo).listo ?? null;
}

function valorDelRelevamientoDe({
  valorDelRelevamiento,
}: Partial<Pick<TrabajoDelCliente, 'valorDelRelevamiento'>>): Money | null {
  return valorDelRelevamiento ?? null;
}

function entregaDe(trabajo: TrabajoDelCliente): EntregaQueSeCoordina {
  const entrega = trabajo.entrega as Partial<EntregaQueSeCoordina> | undefined;
  return {
    comprometida: entrega?.comprometida ?? null,
    propuesta: entrega?.propuesta ?? null,
    respuesta: entrega?.respuesta ?? null,
  };
}

function noPaso(fecha: string, hoy: string): boolean {
  return diasEntre(hoy, fecha) >= 0;
}

function comprometidaVigente(
  trabajo: TrabajoDelCliente,
  hoy: string,
): ComprometidaDelTrabajo | null {
  const { comprometida } = entregaDe(trabajo);
  return comprometida !== null && noPaso(comprometida.fecha, hoy) ? comprometida : null;
}

function coordinacionDelTrabajo(trabajo: TrabajoDelCliente, hoy: string): CoordinacionDeLaEntrega {
  const { propuesta, respuesta } = entregaDe(trabajo);
  if (propuesta === null) return { situacion: 'sin-pedido' };
  if (propuesta.forma === 'sus_dias') return { situacion: 'sus-dias', propuesta, respuesta };
  const { fecha } = propuesta;
  if (fecha === null || !noPaso(fecha, hoy)) return { situacion: 'sin-pedido' };
  return { situacion: 'un-dia', propuesta: { ...propuesta, fecha }, respuesta };
}

function loQueSigueListo(
  coordinacion: CoordinacionDeLaEntrega | null,
  textos: TextosDeLaVista,
): string {
  if (coordinacion === null) return textos.sigueListo['sin-pedido'];
  if (coordinacion.situacion !== 'sin-pedido' && coordinacion.respuesta !== null) {
    return textos.sigueListo.mandados;
  }
  return textos.sigueListo[coordinacion.situacion];
}

export function tuvoEstimativo(trabajo: TrabajoDelCliente): boolean {
  return trabajo.estado === 'presupuesto_estimativo' || fechaDelEstimativo(trabajo) !== null;
}

export function relevamientoDelTrabajo(
  trabajo: TrabajoDelCliente,
  hoy: string,
): RelevamientoDeLaVista | null {
  const visita = (trabajo.visita as VisitaDelTrabajo | undefined) ?? SIN_VISITA;
  const dia = visita.dia;
  const yaPaso = dia !== null && dia < hoy && !TODAVIA_ANTES_DE_LA_VISITA.includes(trabajo.estado);
  if (visita.hecha || yaPaso) return { estado: 'hecho', fecha: dia };
  if (dia === null && !ESPERAN_LA_VISITA.includes(trabajo.estado)) return null;
  return { estado: 'pendiente', fecha: dia !== null && dia >= hoy ? dia : null };
}

export function proyeccionDeLaEntrega(
  valeHasta: string | null,
  hoy: string,
  plazo: number = DIAS_HABILES_DE_ENTREGA,
): ProyeccionDeLaEntrega {
  if (valeHasta === null) return { situacion: 'sin-fecha' };
  if (vencioElPresupuesto(valeHasta, hoy)) return { situacion: 'vencida', vencio: valeHasta };
  return {
    situacion: 'vigente',
    senarAntesDe: valeHasta,
    listoPara: entregaEstimada(valeHasta, plazo),
  };
}

export function textoDeLaProyeccion(
  proyeccion: ProyeccionDeLaEntrega,
  formatos: Pick<FormatosDeFecha, 'enUnaFrase'>,
  sena: SenaDeLaVista['situacion'],
  textos: TextosDeLaProyeccion,
): readonly string[] {
  const cubierta = sena === 'cubierta';
  switch (proyeccion.situacion) {
    case 'sin-fecha':
      return [cubierta ? textos.coordinamosLaEntregaAlAprobar : textos.coordinamosLaEntrega];
    case 'vencida':
      return [textos.vencio(formatos.enUnaFrase(proyeccion.vencio))];
    case 'vigente': {
      const antesDe = formatos.enUnaFrase(proyeccion.senarAntesDe);
      const listoPara = formatos.enUnaFrase(proyeccion.listoPara);
      return [
        cubierta
          ? textos.siLoAprobasAntesDel(antesDe, listoPara)
          : textos.siDejasLaSenaAntesDel(antesDe, listoPara),
        textos.vamosTomandoLosTrabajos,
      ];
    }
  }
}

function presupuestoDe({
  presupuesto,
}: Partial<Pick<TrabajoDelCliente, 'presupuesto'>>): PresupuestoDelTrabajo | null {
  return presupuesto ?? null;
}

function loComunDelPresupuesto(
  presupuesto: PresupuestoDelTrabajo,
  pagado: Money,
): LoComunDelPresupuesto {
  const { numero, revision, mandadoEl, documento } = presupuesto;
  return {
    numero,
    revision,
    numeroVisible: numeroVisible(numero, revision),
    mandadoEl,
    documento,
    cuentas:
      documento.valores === null
        ? []
        : cuentasDelPresupuesto<Moneda>(documento.valores, documento.senaBp, pagado),
    nombreDelArchivo: nombreDelArchivo(documento, numero, revision),
  };
}

function presupuestoMandado(
  trabajo: TrabajoDelCliente,
  pagado: Money,
  hoy: string,
): PresupuestoMandado | null {
  const presupuesto = presupuestoDe(trabajo);
  if (presupuesto === null) return null;
  const comun = loComunDelPresupuesto(presupuesto, pagado);
  const valeHasta = fechasDe(trabajo).valeHasta ?? null;
  const vencio = vencioElPresupuesto(valeHasta, hoy) ? valeHasta : null;
  const [unica] = comun.cuentas;
  return {
    ...comun,
    etapa: 'mandado',
    queCambio: presupuesto.revision > 1 ? presupuesto.queCambio : null,
    valeHasta,
    vencio,
    mensajeParaElTaller: mensajeParaElTaller(presupuesto.numero, presupuesto.revision),
    pideLaSena:
      vencio === null &&
      presupuesto.documento.valores?.tipo === 'total' &&
      unica !== undefined &&
      unica.faltaParaLaSena > 0,
  };
}

function presupuestoAceptado(
  trabajo: TrabajoDelCliente,
  pagado: Money,
): PresupuestoAceptado | null {
  const presupuesto = presupuestoDe(trabajo);
  if (presupuesto === null) return null;
  return {
    ...loComunDelPresupuesto(presupuesto, pagado),
    etapa: 'aceptado',
    aceptadoEl: presupuesto.aceptadoEl,
    letra: presupuesto.letra,
    acordado: acordadoAlAprobar<Moneda>(presupuesto.documento.valores, trabajo.precio),
  };
}

function opcionesMandadas(trabajo: TrabajoDelCliente): number {
  const valores = presupuestoDe(trabajo)?.documento.valores ?? null;
  return valores?.tipo === 'opciones' ? valores.opciones.length : 0;
}

function senaDelTrabajo(trabajo: TrabajoDelCliente, pagado: Money): SenaDeLaVista {
  const sena = (trabajo.sena as Money | null | undefined) ?? null;
  const pago = trabajo.pago as PagoPendiente | undefined;
  if (sena === null || pago === undefined) return { situacion: 'sin-presupuesto' };
  if (pago.instancia !== 'sena') return { situacion: 'cubierta', sena, aCuenta: pagado };
  return pago.monto === null
    ? { situacion: 'sin-presupuesto' }
    : { situacion: 'falta', sena, aCuenta: pagado, falta: pago.monto };
}

function empezoAFabricarse(trabajo: TrabajoDelCliente, hoy: string): boolean {
  const inicio = fechasDe(trabajo).inicio ?? null;
  return inicio !== null && diasEntre(inicio, hoy) >= 0;
}

function inicioDeLaFabricacion(trabajo: TrabajoDelCliente, hoy: string): string | null {
  const { inicio = null, entregado = null } = fechasDe(trabajo);
  if (inicio === null || !empezoAFabricarse(trabajo, hoy)) return null;
  const hasta = [entregado, listoDelTrabajo(trabajo)];
  return hasta.some((fecha) => fecha !== null && diasEntre(inicio, fecha) < 0) ? null : inicio;
}

function etapaDeLaVista(trabajo: TrabajoDelCliente, saldado: boolean, hoy: string): EtapaDeLaVista {
  switch (trabajo.estado) {
    case 'cobrado':
      return 'pagado';
    case 'entregado':
      return saldado ? 'pagado' : 'entregado';
    case 'en_curso':
      if (listoDelTrabajo(trabajo) !== null) return 'listo';
      return empezoAFabricarse(trabajo, hoy) ? 'fabricacion' : 'aprobado';
    case 'presupuesto_enviado':
      return 'esperando-la-sena';
    default:
      return 'antes-del-presupuesto';
  }
}

function yaSeEntrego(etapa: EtapaDeLaVista): boolean {
  return etapa === 'entregado' || etapa === 'pagado';
}

function antesDeEntregar(etapa: EtapaDeLaVista): boolean {
  return etapa === 'aprobado' || etapa === 'fabricacion' || etapa === 'listo';
}

function hitoDeLaEtapa(etapa: EtapaDeLaVista, trabajo: TrabajoDelCliente): HitoDelTrabajo {
  if (etapa === 'listo') return 'fabricacion';
  if (etapa !== 'antes-del-presupuesto' && etapa !== 'esperando-la-sena') return etapa;
  return trabajo.estado === 'presupuesto_estimativo' ? 'estimativo' : 'presupuesto';
}

interface Contexto {
  trabajo: TrabajoDelCliente;
  aprobado: boolean;
  sena: SenaDeLaVista['situacion'];
  relevamiento: RelevamientoDeLaVista | null;
  vencido: boolean;
  textos: TextosDeLaVista;
}

function textoEnCurso(hito: HitoDelTrabajo, { trabajo, sena, textos }: Contexto): string {
  if (hito === 'presupuesto' && trabajo.estado === 'presupuesto_enviado') {
    return textos.presupuestoMandado;
  }
  if (hito === 'aprobado') return textos.titularDelAprobado[sena];
  return textos.enCurso[hito];
}

function loQueSigue(
  hito: HitoDelTrabajo,
  { trabajo, sena, relevamiento, vencido, textos }: Contexto,
): string {
  if (hito === 'presupuesto' && trabajo.estado === 'presupuesto_enviado') {
    if (vencido) return textos.sigueConElPresupuestoVencido;
    return sena === 'cubierta'
      ? textos.sigueConLaSenaCubierta
      : textos.sigueConElPresupuestoMandado;
  }
  if ((hito === 'estimativo' || hito === 'presupuesto') && relevamiento?.estado === 'pendiente') {
    return textos.sigueFaltaMedir[hito];
  }
  if (hito === 'aprobado' && sena === 'falta') return textos.sigueFaltaLaSena;
  return hito === 'pagado' ? '' : textos.sigue[hito];
}

function etiquetaDelHito(hito: HitoDelTrabajo, { aprobado, sena, textos }: Contexto): string {
  return hito === 'aprobado' && aprobado && sena !== 'cubierta'
    ? textos.aprobadoSinLaSena
    : textos.hitos[hito].etiqueta;
}

function pasoEnCurso(
  etapa: EtapaDeLaVista,
  sena: SenaDeLaVista['situacion'],
): HitoDelTrabajo | null {
  switch (etapa) {
    case 'antes-del-presupuesto':
      return 'presupuesto';
    case 'esperando-la-sena':
      return 'aprobado';
    case 'aprobado':
      return sena === 'falta' ? 'aprobado' : 'fabricacion';
    case 'fabricacion':
      return 'fabricacion';
    case 'listo':
      return 'entregado';
    case 'entregado':
      return 'pagado';
    case 'pagado':
      return null;
  }
}

function textoDelPasoEnCurso(
  hito: HitoDelTrabajo,
  hitoActual: HitoDelTrabajo,
  sena: SenaDeLaVista['situacion'],
  textos: TextosDeLaVista,
): string {
  if (hito !== hitoActual) {
    return hito === 'aprobado' && sena === 'cubierta'
      ? textos.cuandoLoApruebes
      : textos.hitos[hito].futuro;
  }
  if (hito === 'aprobado') return textos.cuandoDejesLaSena;
  return textos.enCurso[hito];
}

function fechasDeLosHitos(
  trabajo: TrabajoDelCliente,
  saldado: boolean,
  hoy: string,
): Readonly<Record<HitoDelTrabajo, string | null>> {
  const fechas = fechasDe(trabajo);
  const ultimoPago = trabajo.pagos[trabajo.pagos.length - 1];
  return {
    estimativo: fechaDelEstimativo(trabajo),
    presupuesto: fechas.presupuesto ?? null,
    aprobado: fechas.aprobado ?? null,
    fabricacion: inicioDeLaFabricacion(trabajo, hoy),
    entregado: fechas.entregado ?? null,
    pagado: fechas.cobro ?? (saldado ? (ultimoPago?.fecha ?? null) : null),
  };
}

function textoDelPago(
  cantidad: number,
  esElUltimo: boolean,
  saldado: boolean,
  textos: TextosDeLosEventos,
): string {
  if (!saldado || !esElUltimo) return textos.pago;
  return cantidad === 1 ? textos.pagoQueSalda : textos.saldoQueSalda;
}

interface EventoOrdenable extends EventoDelCliente {
  orden: number;
}

function eventosDelTrabajo(
  { trabajo, aprobado, relevamiento, textos }: Contexto,
  etapa: EtapaDeLaVista,
  saldado: boolean,
  hoy: string,
): readonly EventoDelCliente[] {
  const eventos: EventoOrdenable[] = [];
  const fechas = fechasDe(trabajo);
  const cantidad = trabajo.pagos.length;

  const estimativo = fechaDelEstimativo(trabajo);
  if (estimativo !== null) {
    eventos.push({
      id: 'estimativo',
      fecha: estimativo,
      texto: textos.eventos.estimativo,
      hito: 'estimativo',
      monto: null,
      orden: -2,
    });
  }

  if (relevamiento?.estado === 'hecho' && relevamiento.fecha !== null) {
    eventos.push({
      id: 'relevamiento',
      fecha: relevamiento.fecha,
      texto: textos.eventos.relevamiento,
      hito: 'presupuesto',
      monto: null,
      orden: -1,
    });
  }

  const presupuesto = fechas.presupuesto ?? null;
  if (presupuesto !== null && etapa !== 'antes-del-presupuesto') {
    eventos.push({
      id: 'presupuesto',
      fecha: presupuesto,
      texto: textos.eventos.presupuesto,
      hito: 'presupuesto',
      monto: null,
      orden: 0,
    });
  }

  trabajo.pagos.forEach((pago, indice) => {
    const esElUltimo = indice === cantidad - 1;
    eventos.push({
      id: pago.id,
      fecha: pago.fecha,
      texto: textoDelPago(cantidad, esElUltimo, saldado, textos.eventos),
      hito: saldado && esElUltimo ? 'pagado' : aprobado ? 'aprobado' : 'presupuesto',
      monto: pago.monto,
      orden: indice + 1,
    });
  });

  const aprobadoEl = fechas.aprobado ?? null;
  if (aprobado && aprobadoEl !== null) {
    eventos.push({
      id: 'aprobado',
      fecha: aprobadoEl,
      texto: textos.eventos.aprobado,
      hito: 'aprobado',
      monto: null,
      orden: cantidad + 1,
    });
  }

  const inicio = inicioDeLaFabricacion(trabajo, hoy);
  if (aprobado && inicio !== null) {
    eventos.push({
      id: 'inicio',
      fecha: inicio,
      texto: textos.eventos.inicio,
      hito: 'fabricacion',
      monto: null,
      orden: cantidad + 2,
    });
  }

  const listo = listoDelTrabajo(trabajo);
  if (aprobado && listo !== null) {
    eventos.push({
      id: 'listo',
      fecha: listo,
      texto: textos.eventos.listo,
      hito: 'fabricacion',
      monto: null,
      orden: cantidad + 3,
    });
  }

  const entregado = fechas.entregado ?? null;
  if (yaSeEntrego(etapa) && entregado !== null) {
    eventos.push({
      id: 'entregado',
      fecha: entregado,
      texto: textos.eventos.entregado,
      hito: 'entregado',
      monto: null,
      orden: cantidad + 4,
    });
  }

  return eventos
    .sort((uno, otro) => {
      const porFecha = diasEntre(uno.fecha, otro.fecha);
      if (porFecha !== 0) return porFecha;
      const porHito = posicionDelHito(otro.hito) - posicionDelHito(uno.hito);
      return porHito === 0 ? otro.orden - uno.orden : porHito;
    })
    .map((evento) => ({
      id: evento.id,
      fecha: evento.fecha,
      texto: evento.texto,
      hito: evento.hito,
      monto: evento.monto,
    }));
}

function entregaDeLaTarjeta(
  trabajo: TrabajoDelCliente,
  etapa: EtapaDeLaVista,
  hoy: string,
): EntregaDelTrabajo {
  const fechas = fechasDe(trabajo);
  if (yaSeEntrego(etapa)) return { situacion: 'entregado', fecha: fechas.entregado ?? null };
  const { comprometida } = entregaDe(trabajo);
  if (comprometida !== null) {
    return noPaso(comprometida.fecha, hoy)
      ? { situacion: 'confirmada', fecha: comprometida.fecha, franja: comprometida.franja }
      : { situacion: 'a-confirmar' };
  }
  if (etapa === 'listo') return { situacion: 'a-coordinar' };
  const estimada = fechas.entregaPautada ?? null;
  return {
    situacion: 'estimada',
    fecha: estimada !== null && noPaso(estimada, hoy) ? estimada : null,
  };
}

function datosDelTrabajo(
  trabajo: TrabajoDelCliente,
  etapa: EtapaDeLaVista,
  sena: SenaDeLaVista,
  hoy: string,
): DatosDelTrabajo {
  const fechas = fechasDe(trabajo);
  const direccion = trabajo.direccion.trim();
  return {
    direccion: direccion === '' ? null : direccion,
    inicio: fechas.inicio ?? null,
    entrega: entregaDeLaTarjeta(trabajo, etapa, hoy),
    sena,
  };
}

export function vistaDelCliente(
  trabajo: TrabajoDelCliente,
  hoy: string,
  textos: TextosDeLaVista,
): VistaDelCliente {
  const aprobado = APROBADOS.includes(trabajo.estado);
  const pagado = sumarTodos(trabajo.pagos.map((pago) => pago.monto));
  const saldo = aprobado && trabajo.precio !== null ? restar(trabajo.precio, pagado) : null;
  const saldado = saldo !== null && saldo <= 0;
  const sena = senaDelTrabajo(trabajo, pagado);
  const relevamiento = relevamientoDelTrabajo(trabajo, hoy);
  const vencido =
    trabajo.estado === 'presupuesto_enviado' &&
    vencioElPresupuesto(fechasDe(trabajo).valeHasta ?? null, hoy);
  const contexto: Contexto = {
    trabajo,
    aprobado,
    sena: sena.situacion,
    relevamiento,
    vencido,
    textos,
  };

  const etapa = etapaDeLaVista(trabajo, saldado, hoy);
  const hitoActual = hitoDeLaEtapa(etapa, trabajo);
  const camino: readonly HitoDelTrabajo[] = tuvoEstimativo(trabajo)
    ? ORDEN_DE_LOS_HITOS
    : HITOS_DEL_CAMINO;
  const enCurso = pasoEnCurso(etapa, sena.situacion);
  const indiceEnCurso = enCurso === null ? camino.length : camino.indexOf(enCurso);
  const fechaDe = fechasDeLosHitos(trabajo, saldado, hoy);
  const comprometida = antesDeEntregar(etapa) ? comprometidaVigente(trabajo, hoy) : null;
  const coordinacion =
    etapa === 'listo' && entregaDe(trabajo).comprometida === null
      ? coordinacionDelTrabajo(trabajo, hoy)
      : null;

  function fechaDelPasoEnCurso(hito: HitoDelTrabajo): string | null {
    if (hito === 'fabricacion') return fechaDe.fabricacion;
    return hito === 'entregado' ? (comprometida?.fecha ?? null) : null;
  }

  function textoDelPasoDeHoy(hito: HitoDelTrabajo): string {
    if (etapa !== 'listo') return textoDelPasoEnCurso(hito, hitoActual, sena.situacion, textos);
    return comprometida === null ? textos.listoParaEntregar : textos.hitos[hito].futuro;
  }

  function titularDeLaVista(): TitularDeLaVista {
    if (comprometida !== null) return { comprometida };
    return etapa === 'listo' ? textos.titularListo : textoEnCurso(hitoActual, contexto);
  }

  function loQueSigueEnLaVista(): string {
    if (comprometida !== null) return textos.sigueConLaComprometida;
    return etapa === 'listo'
      ? loQueSigueListo(coordinacion, textos)
      : loQueSigue(hitoActual, contexto);
  }

  const hitos: HitoDeLaVista[] = camino.map((hito, indice) => {
    const etiqueta = etiquetaDelHito(hito, contexto);
    if (indice < indiceEnCurso) {
      return {
        id: hito,
        etiqueta,
        estado: 'pasado',
        fecha: fechaDe[hito],
        texto: hito === 'pagado' ? textos.enCurso.pagado : etiqueta,
      };
    }
    if (indice === indiceEnCurso) {
      return {
        id: hito,
        etiqueta,
        estado: 'actual',
        fecha: fechaDelPasoEnCurso(hito),
        texto: textoDelPasoDeHoy(hito),
      };
    }
    return {
      id: hito,
      etiqueta,
      estado: 'futuro',
      fecha: null,
      texto: hito === 'pagado' && saldado ? textos.yaEstaPagado : textos.hitos[hito].futuro,
    };
  });

  const comun = {
    taller: trabajo.taller,
    cliente: trabajo.cliente,
    titulo: trabajo.trabajo,
    hitoActual,
    titular: titularDeLaVista(),
    hitos,
    relevamiento,
    eventos: eventosDelTrabajo(contexto, etapa, saldado, hoy),
    sigue: loQueSigueEnLaVista(),
    pagos: trabajo.pagos,
    pagado,
    archivos: trabajo.archivos,
    comoPagar: comoPagar(trabajo, hoy, textos.comoPagar),
    vidriera: (trabajo.vidriera as VidrieraDelTaller | undefined) ?? VIDRIERA_VACIA,
  };

  if (etapa === 'antes-del-presupuesto') {
    const relevamientoPorHacer: RelevamientoPorHacer | null =
      relevamiento?.estado === 'pendiente'
        ? {
            titulo: textos.relevamientoTecnico,
            lineas: textos.queEsElRelevamiento,
            valor: valorDelRelevamientoDe(trabajo),
          }
        : null;
    return {
      ...comun,
      etapa,
      sigue: relevamientoPorHacer === null ? comun.sigue : '',
      relevamientoPorHacer,
    };
  }

  if (etapa === 'esperando-la-sena') {
    return {
      ...comun,
      etapa,
      presupuesto: trabajo.precio,
      opciones: opcionesMandadas(trabajo),
      sena,
      proyeccion: proyeccionDeLaEntrega(
        fechasDe(trabajo).valeHasta ?? null,
        hoy,
        plazoDelPresupuesto(presupuestoDe(trabajo)?.documento ?? null),
      ),
      elPresupuesto: presupuestoMandado(trabajo, pagado, hoy),
    };
  }

  return {
    ...comun,
    etapa,
    precio: trabajo.precio,
    saldo,
    saldado,
    foco: yaSeEntrego(etapa) && saldo !== null && saldo > 0 ? 'saldo' : 'estado',
    datos: datosDelTrabajo(trabajo, etapa, sena, hoy),
    coordinacion,
    elPresupuesto: presupuestoAceptado(trabajo, pagado),
  };
}

export function notaDelRelevamiento(
  vista: VistaDelCliente,
  formatos: Pick<FormatosDeFecha, 'larga' | 'corta'>,
  textos: TextosDeLaNota,
): NotaDelRelevamiento | null {
  const { relevamiento } = vista;
  if (relevamiento === null || !HITOS_DEL_PRESUPUESTO.includes(vista.hitoActual)) return null;
  const { fecha } = relevamiento;
  const mandado = vista.etapa === 'esperando-la-sena';

  if (relevamiento.estado === 'hecho') {
    return {
      hito: vista.hitoActual,
      estado: 'hecho',
      ...textos.hecho,
      lineas: [
        fecha === null ? textos.yaFuimosAMedir : textos.fuimosAMedirEl(formatos.larga(fecha)),
        mandado ? textos.armamosElPresupuesto : textos.cerrandoElPresupuesto,
      ],
      resumen: fecha === null ? textos.resumenYaFuimos : textos.medidoEl(formatos.corta(fecha)),
    };
  }

  const conEstimativo = vista.hitos.some((hito) => hito.id === 'estimativo');
  if (mandado || !conEstimativo) return null;
  return {
    hito: vista.hitoActual,
    estado: 'pendiente',
    ...textos.pendiente,
    lineas: [
      ...textos.faltaMedirDelEstimado,
      fecha === null ? textos.sinFechaParaLaVisita : textos.quedamosEnIrEl(formatos.larga(fecha)),
    ],
    resumen: textos.resumenFaltaMedir,
  };
}
