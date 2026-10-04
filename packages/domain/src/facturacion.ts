import { digitosDeCuit, revisarCuit } from './cuit.ts';
import { sinBlancosEnLasPuntas, tieneTexto } from './encuesta.ts';
import { correrMes, esFechaQueExiste, mesDe } from './fechas.ts';
import { centavos, MONEDA_DEL_TALLER, type Moneda, type Money } from './money.ts';
import {
  CATEGORIA_MAXIMA,
  type CategoriaDelMonotributo,
  type EscalaDelMonotributo,
} from './monotributo.ts';
import {
  NOMBRE_DE_LA_CONDICION,
  recortado,
  sinProhibidos,
  type CondicionFiscal,
} from './presupuesto.ts';

export const TIPOS_DE_COMPROBANTE = ['factura_c', 'nota_de_credito_c'] as const;

export type TipoDeComprobante = (typeof TIPOS_DE_COMPROBANTE)[number];

export const AMBIENTES_DE_ARCA = ['homologacion', 'produccion'] as const;

export type AmbienteDeArca = (typeof AMBIENTES_DE_ARCA)[number];

export const ESTADOS_DEL_COMPROBANTE = [
  'pedida',
  'emitiendo',
  'autorizada',
  'anulada',
  'rechazada',
  'a_revisar',
] as const;

export type EstadoDelComprobante = (typeof ESTADOS_DEL_COMPROBANTE)[number];

export const ESTADOS_VIVOS: readonly EstadoDelComprobante[] = [
  'pedida',
  'emitiendo',
  'autorizada',
  'a_revisar',
];

export const CONCEPTOS_DE_ARCA = [1, 2, 3] as const;

export type ConceptoDeArca = (typeof CONCEPTOS_DE_ARCA)[number];

export const CONCEPTO_POR_DEFECTO: ConceptoDeArca = 1;

export const CODIGO_DE_ARCA = {
  factura_c: 11,
  nota_de_credito_c: 13,
} as const satisfies Record<TipoDeComprobante, number>;

export const CONDICIONES_DEL_RECEPTOR = [
  'consumidor_final',
  'monotributo',
  'responsable_inscripto',
  'exento',
] as const;

export type CondicionDelReceptor = (typeof CONDICIONES_DEL_RECEPTOR)[number];

export type CondicionIvaDeArca = 1 | 4 | 5 | 6;

const CONDICION_IVA: Readonly<Record<CondicionDelReceptor, CondicionIvaDeArca>> = {
  consumidor_final: 5,
  monotributo: 6,
  responsable_inscripto: 1,
  exento: 4,
};

export const NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR: Readonly<Record<CondicionDelReceptor, string>> = {
  consumidor_final: 'Consumidor Final',
  ...NOMBRE_DE_LA_CONDICION,
};

export type TipoDeDocumento = 80 | 96 | 99;

export const UMBRAL_DE_IDENTIFICACION_CENTAVOS: Money = centavos(1_000_000_000);

export const LARGO_MAXIMO_DEL_DETALLE = 200;

export const PUNTO_DE_VENTA_MAXIMO = 99_998;

export const NUMERO_MAXIMO = 99_999_999;

const IMPORTE_MAXIMO_DEL_QR = 9_999_999_999_999;

export const ENLACE_DEL_QR = 'https://www.arca.gob.ar/fe/qr/?p=';

export const LO_QUE_FALTA_PARA_FACTURAR = [
  'taller-no-monotributo',
  'taller-sin-razon-social',
  'taller-sin-domicilio',
  'taller-sin-ingresos-brutos',
  'taller-sin-inicio-de-actividades',
  'pago-borrado',
  'en-dolares',
  'de-la-apertura',
  'cliente-sin-cuit',
  'cliente-cuit-invalido',
  'cliente-sin-domicilio',
  'cliente-sin-dni',
] as const;

export type LoQueFaltaParaFacturar = (typeof LO_QUE_FALTA_PARA_FACTURAR)[number];

export type ClaseDelRechazo = 'numeracion' | 'condicion-iva' | 'documento' | 'otro';

const CLASE_DEL_RECHAZO: ReadonlyMap<number, ClaseDelRechazo> = new Map([
  [10016, 'numeracion'],
  [10242, 'condicion-iva'],
  [10243, 'condicion-iva'],
  [10246, 'condicion-iva'],
  [10015, 'documento'],
]);

export type MotivoDelDni = 'caracteres' | 'largo';

export type RevisionDelDni =
  | { estado: 'vacio' }
  | { estado: 'valido'; dni: string }
  | { estado: 'invalido'; motivo: MotivoDelDni };

export interface ClienteQueRecibe {
  condicion: CondicionDelReceptor;
  cuit: string;
  dni: string;
}

export interface DocumentoDelReceptor {
  docTipo: TipoDeDocumento;
  docNro: string;
}

export type FaltaDelDocumento = 'cuit' | 'cuit-invalido' | 'dni';

export type DocumentoOLoQueFalta = DocumentoDelReceptor | { falta: FaltaDelDocumento };

export interface ClienteDeLaFactura extends ClienteQueRecibe {
  nombre: string;
  razonSocial: string;
  domicilioFiscal: string;
  direccion: string;
}

export interface TallerQueFactura {
  condicion: CondicionFiscal | null;
  razonSocial: string;
  domicilio: string;
  ingresosBrutos: string;
  inicioDeActividades: string | null;
}

export interface TrabajoQueSeFactura {
  moneda: Moneda;
  borrado: boolean;
  precio: Money | null;
  cobrado: Money;
}

export interface PagoQueSeFactura {
  moneda: Moneda;
  borrado: boolean;
  yaEnLaApertura: boolean;
}

export interface DatosParaFacturar {
  taller: TallerQueFactura;
  trabajo: TrabajoQueSeFactura;
  pago: PagoQueSeFactura;
  cliente: Omit<ClienteDeLaFactura, 'nombre' | 'razonSocial'>;
}

export interface ComprobanteParaElQr {
  tipo: TipoDeComprobante;
  cuitEmisor: string;
  puntoDeVenta: number;
  numero: number;
  fecha: string;
  importe: Money;
  docTipo: TipoDeDocumento;
  docNro: string;
  cae: string;
}

export interface DatosDelQr {
  ver: 1;
  fecha: string;
  cuit: number;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: 'PES';
  ctz: 1;
  tipoDocRec: number;
  nroDocRec: number;
  tipoCodAut: 'E';
  codAut: number;
}

export interface ComprobanteQueSuma {
  tipo: TipoDeComprobante;
  ambiente: AmbienteDeArca;
  estado: EstadoDelComprobante;
  fecha: string | null;
  importe: Money;
}

export interface FacturadoEnLosUltimos12Meses {
  desde: string;
  hasta: string;
  centavos: Money;
}

export type NivelDelTope = 'bien' | 'cerca' | 'pasado' | 'fuera';

export interface EstadoDelTope {
  tope: Money;
  proporcion: number;
  porcentaje: number;
  nivel: NivelDelTope;
}

const DNI = /^[0-9]{7,8}$/;
const SOLO_DIGITOS = /^[0-9]+$/;
const FECHA_DE_ARCA = /^[0-9]{8}$/;
const CAE = /^[0-9]{14}$/;
const BASE_64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function esTipoDeComprobante(valor: unknown): valor is TipoDeComprobante {
  return typeof valor === 'string' && (TIPOS_DE_COMPROBANTE as readonly string[]).includes(valor);
}

export function esAmbienteDeArca(valor: unknown): valor is AmbienteDeArca {
  return typeof valor === 'string' && (AMBIENTES_DE_ARCA as readonly string[]).includes(valor);
}

export function esEstadoDelComprobante(valor: unknown): valor is EstadoDelComprobante {
  return (
    typeof valor === 'string' && (ESTADOS_DEL_COMPROBANTE as readonly string[]).includes(valor)
  );
}

export function esCondicionDelReceptor(valor: unknown): valor is CondicionDelReceptor {
  return (
    typeof valor === 'string' && (CONDICIONES_DEL_RECEPTOR as readonly string[]).includes(valor)
  );
}

export function conceptoLeido(valor: unknown): ConceptoDeArca {
  return CONCEPTOS_DE_ARCA.find((concepto) => concepto === valor) ?? CONCEPTO_POR_DEFECTO;
}

export function esUnaFacturaViva(estado: EstadoDelComprobante): boolean {
  return ESTADOS_VIVOS.includes(estado);
}

export function condicionIvaDelReceptor(condicion: CondicionDelReceptor): CondicionIvaDeArca {
  return CONDICION_IVA[condicion];
}

export function cuitValido(cuit: string): boolean {
  return revisarCuit(cuit).estado === 'valido';
}

export function revisarDni(texto: string): RevisionDelDni {
  const limpio = sinBlancosEnLasPuntas(texto).replace(/[. ]/g, '');
  if (limpio === '') return { estado: 'vacio' };
  if (!SOLO_DIGITOS.test(limpio)) return { estado: 'invalido', motivo: 'caracteres' };
  return DNI.test(limpio)
    ? { estado: 'valido', dni: limpio }
    : { estado: 'invalido', motivo: 'largo' };
}

export function operacionDelTrabajo(precio: Money | null, cobrado: Money): Money {
  return precio !== null && precio > cobrado ? precio : cobrado;
}

export function documentoDelReceptor(
  cliente: ClienteQueRecibe,
  operacion: Money,
): DocumentoOLoQueFalta {
  const revision = revisarCuit(cliente.cuit);
  if (revision.estado === 'valido') return { docTipo: 80, docNro: digitosDeCuit(cliente.cuit) };
  if (revision.estado !== 'vacio') return { falta: 'cuit-invalido' };
  if (cliente.condicion !== 'consumidor_final') return { falta: 'cuit' };
  if (operacion < UMBRAL_DE_IDENTIFICACION_CENTAVOS) return { docTipo: 99, docNro: '0' };
  return DNI.test(cliente.dni) ? { docTipo: 96, docNro: cliente.dni } : { falta: 'dni' };
}

export function nombreDelReceptor(
  cliente: Pick<ClienteDeLaFactura, 'condicion' | 'nombre' | 'razonSocial'>,
): string {
  return cliente.condicion !== 'consumidor_final' && tieneTexto(cliente.razonSocial)
    ? sinBlancosEnLasPuntas(cliente.razonSocial)
    : sinBlancosEnLasPuntas(cliente.nombre);
}

export function domicilioDelReceptor(
  cliente: Pick<ClienteDeLaFactura, 'condicion' | 'domicilioFiscal' | 'direccion'>,
): string {
  return cliente.condicion !== 'consumidor_final' && tieneTexto(cliente.domicilioFiscal)
    ? sinBlancosEnLasPuntas(cliente.domicilioFiscal)
    : sinBlancosEnLasPuntas(cliente.direccion);
}

export function loQueFaltaParaFacturar(datos: DatosParaFacturar): LoQueFaltaParaFacturar[] {
  const { taller, trabajo, pago, cliente } = datos;
  const falta: LoQueFaltaParaFacturar[] = [];
  if (taller.condicion !== 'monotributo') falta.push('taller-no-monotributo');
  if (!tieneTexto(taller.razonSocial)) falta.push('taller-sin-razon-social');
  if (!tieneTexto(taller.domicilio)) falta.push('taller-sin-domicilio');
  if (!tieneTexto(taller.ingresosBrutos)) falta.push('taller-sin-ingresos-brutos');
  if (taller.inicioDeActividades === null) falta.push('taller-sin-inicio-de-actividades');
  if (pago.borrado || trabajo.borrado) falta.push('pago-borrado');
  if (pago.moneda !== MONEDA_DEL_TALLER || trabajo.moneda !== MONEDA_DEL_TALLER) {
    falta.push('en-dolares');
  }
  if (pago.yaEnLaApertura) falta.push('de-la-apertura');
  const documento = documentoDelReceptor(
    cliente,
    operacionDelTrabajo(trabajo.precio, trabajo.cobrado),
  );
  const delDocumento = 'falta' in documento ? documento.falta : null;
  if (delDocumento === 'cuit') falta.push('cliente-sin-cuit');
  if (delDocumento === 'cuit-invalido') falta.push('cliente-cuit-invalido');
  if (
    cliente.condicion !== 'consumidor_final' &&
    !tieneTexto(cliente.domicilioFiscal) &&
    !tieneTexto(cliente.direccion)
  ) {
    falta.push('cliente-sin-domicilio');
  }
  if (delDocumento === 'dni') falta.push('cliente-sin-dni');
  return falta;
}

export function importeParaArca(importe: Money): string {
  if (importe < 0) throw new RangeError('ARCA no recibe importes negativos.');
  const texto = String(importe).padStart(3, '0');
  return `${texto.slice(0, -2)}.${texto.slice(-2)}`;
}

function entreUnoY(valor: number, maximo: number, que: string): number {
  if (!Number.isInteger(valor) || valor < 1 || valor > maximo) {
    throw new RangeError(`${que} va de 1 a ${String(maximo)}: ${String(valor)} no.`);
  }
  return valor;
}

export function puntoDeVentaConCeros(puntoDeVenta: number): string {
  return String(entreUnoY(puntoDeVenta, PUNTO_DE_VENTA_MAXIMO, 'El punto de venta')).padStart(
    5,
    '0',
  );
}

export function numeroConCeros(numero: number): string {
  return String(entreUnoY(numero, NUMERO_MAXIMO, 'El número del comprobante')).padStart(8, '0');
}

export function numeroDelComprobante(puntoDeVenta: number, numero: number): string {
  return `${puntoDeVentaConCeros(puntoDeVenta)}-${numeroConCeros(numero)}`;
}

export function nombreDelComprobante(
  tipo: TipoDeComprobante,
  puntoDeVenta: number,
  numero: number,
): string {
  const nombre = tipo === 'factura_c' ? 'Factura C' : 'Nota de crédito C';
  return `${nombre} ${numeroDelComprobante(puntoDeVenta, numero)}`;
}

export function fechaParaArca(fecha: string): string {
  if (!esFechaQueExiste(fecha)) {
    throw new RangeError(`Una fecha va como AAAA-MM-DD y tiene que existir: ${fecha} no.`);
  }
  return fecha.replaceAll('-', '');
}

export function fechaDeArca(texto: string): string {
  const fecha = FECHA_DE_ARCA.test(texto)
    ? `${texto.slice(0, 4)}-${texto.slice(4, 6)}-${texto.slice(6)}`
    : '';
  if (!esFechaQueExiste(fecha)) {
    throw new RangeError(`ARCA escribe las fechas como AAAAMMDD: ${texto} no es una.`);
  }
  return fecha;
}

function base64DeAscii(texto: string): string {
  let salida = '';
  for (let indice = 0; indice < texto.length; indice += 3) {
    const a = texto.charCodeAt(indice);
    const b = texto.charCodeAt(indice + 1);
    const c = texto.charCodeAt(indice + 2);
    const triple = (a << 16) | (b << 8) | c;
    salida += BASE_64.charAt((triple >> 18) & 63) + BASE_64.charAt((triple >> 12) & 63);
    salida += Number.isNaN(b) ? '=' : BASE_64.charAt((triple >> 6) & 63);
    salida += Number.isNaN(c) ? '=' : BASE_64.charAt(triple & 63);
  }
  return salida;
}

export function datosDelQr(comprobante: ComprobanteParaElQr): DatosDelQr {
  if (comprobante.importe > IMPORTE_MAXIMO_DEL_QR) {
    throw new RangeError('El importe no entra en el QR de ARCA.');
  }
  if (!CAE.test(comprobante.cae)) {
    throw new RangeError(`Un CAE tiene 14 dígitos: ${comprobante.cae} no.`);
  }
  if (!SOLO_DIGITOS.test(comprobante.docNro)) {
    throw new RangeError(`El documento del receptor va en dígitos: ${comprobante.docNro} no.`);
  }
  if (!cuitValido(comprobante.cuitEmisor)) {
    throw new RangeError(`El CUIT del emisor no es válido: ${comprobante.cuitEmisor}.`);
  }
  return {
    ver: 1,
    fecha: fechaDeArca(fechaParaArca(comprobante.fecha)),
    cuit: Number(digitosDeCuit(comprobante.cuitEmisor)),
    ptoVta: entreUnoY(comprobante.puntoDeVenta, PUNTO_DE_VENTA_MAXIMO, 'El punto de venta'),
    tipoCmp: CODIGO_DE_ARCA[comprobante.tipo],
    nroCmp: entreUnoY(comprobante.numero, NUMERO_MAXIMO, 'El número del comprobante'),
    importe: Number(importeParaArca(comprobante.importe)),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: comprobante.docTipo,
    nroDocRec: Number(comprobante.docNro),
    tipoCodAut: 'E',
    codAut: Number(comprobante.cae),
  };
}

export function enlaceDelQr(comprobante: ComprobanteParaElQr): string {
  return `${ENLACE_DEL_QR}${base64DeAscii(JSON.stringify(datosDelQr(comprobante)))}`;
}

export function claseDelRechazo(codigo: number): ClaseDelRechazo {
  return CLASE_DEL_RECHAZO.get(codigo) ?? 'otro';
}

export function detalleDeLaFactura(concepto: string, titulo: string): string {
  const partes = [concepto, titulo].filter(tieneTexto).map(sinBlancosEnLasPuntas);
  return sinBlancosEnLasPuntas(recortado(partes.join(' — '), LARGO_MAXIMO_DEL_DETALLE));
}

export function nombreDelArchivoDeLaFactura(comprobante: {
  tipo: TipoDeComprobante;
  puntoDeVenta: number;
  numero: number;
  receptorNombre: string;
}): string {
  const cabeza = nombreDelComprobante(
    comprobante.tipo,
    comprobante.puntoDeVenta,
    comprobante.numero,
  );
  const receptor = sinProhibidos(comprobante.receptorNombre).replace(/\s+/g, ' ').trim();
  return `${receptor === '' ? cabeza : `${cabeza} - ${receptor}`}.pdf`;
}

export function facturadoEnLosUltimos12Meses(
  comprobantes: Iterable<ComprobanteQueSuma>,
  hoy: string,
): FacturadoEnLosUltimos12Meses {
  const desde = `${correrMes(mesDe(hoy), -11)}-01`;
  let total = 0;
  for (const comprobante of comprobantes) {
    const { tipo, ambiente, estado, fecha, importe } = comprobante;
    if (ambiente !== 'produccion' || fecha === null || fecha < desde || fecha > hoy) continue;
    if (tipo === 'factura_c' && (estado === 'autorizada' || estado === 'anulada')) total += importe;
    if (tipo === 'nota_de_credito_c' && estado === 'autorizada') total -= importe;
  }
  return { desde, hasta: hoy, centavos: centavos(total) };
}

export function estadoDelTope(
  facturado: Money,
  categoria: CategoriaDelMonotributo,
  escala: EscalaDelMonotributo,
): EstadoDelTope {
  const tope = escala.topesCentavos[categoria];
  const positivo = Math.max(facturado, 0);
  const nivel: NivelDelTope =
    facturado > escala.topesCentavos[CATEGORIA_MAXIMA]
      ? 'fuera'
      : facturado > tope
        ? 'pasado'
        : facturado * 5 >= tope * 4
          ? 'cerca'
          : 'bien';
  return {
    tope,
    proporcion: positivo / tope,
    porcentaje: Math.floor((positivo * 100) / tope),
    nivel,
  };
}

export function proximaRecategorizacion(hoy: string): string {
  const anio = mesDe(hoy).slice(0, 4);
  if (hoy <= `${anio}-02-05`) return `${anio}-02-05`;
  if (hoy <= `${anio}-08-05`) return `${anio}-08-05`;
  return `${String(Number(anio) + 1).padStart(4, '0')}-02-05`;
}
