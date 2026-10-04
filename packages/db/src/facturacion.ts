import {
  esAmbienteDeArca,
  esTipoDeComprobante,
  type AmbienteDeArca,
  type TipoDeComprobante,
} from '@maun/domain';
import { FunctionsHttpError } from '@supabase/supabase-js';

import type { ClienteMaun } from './cliente.ts';
import type { Json } from './database.types.ts';
import { RespuestaInvalidaError, type FilaDe } from './replica.ts';

export const FUNCION_DE_FACTURAR = 'facturar';

export interface FacturaParaPedir {
  id: string;
  pagoId: string;
  detalle: string;
}

export interface NotaDeCreditoParaPedir {
  id: string;
  facturaId: string;
}

export interface AlertaParaDescartar {
  codigo: 'fuera-de-numa';
  numero: number;
}

export type AlertaDeFacturacion =
  | {
      codigo: 'fuera-de-numa';
      tipo: TipoDeComprobante;
      puntoDeVenta: number;
      numeroArca: number;
      numeroNuma: number | null;
      descartada: boolean;
    }
  | {
      codigo: 'a-revisar';
      comprobanteId: string;
      proyectoId: string | null;
      tipo: TipoDeComprobante;
      puntoDeVenta: number;
      numero: number;
      cliente: string;
    }
  | { codigo: 'certificado-por-vencer'; vence: string }
  | { codigo: 'sin-acceso'; desde: string | null };

export interface ErrorDeArca {
  codigo: number | null;
  mensaje: string;
}

export interface RechazoDeArca {
  errores: readonly ErrorDeArca[];
  motivo: string | null;
}

export type EstadoDelCertificado = 'pedido' | 'subido' | 'activo';

export interface CertificadoDelTaller {
  estado: EstadoDelCertificado;
  vence: string | null;
}

export type ServidorDeArca = 'ok' | 'caido';

export type LoginEnArca = 'ok' | 'esperando' | 'rechazado' | 'sin-certificado';

export interface EstadoDeLaFacturacion {
  conectada: boolean;
  ambiente: AmbienteDeArca | null;
  prendido: boolean;
  servidor: ServidorDeArca | null;
  login: LoginEnArca | null;
  esperarHasta: string | null;
  ultimoNumero: number | null;
  certificadoVence: string | null;
  certificado: CertificadoDelTaller | null;
}

export const MOTIVOS_DEL_PEDIDO = [
  'apagada',
  'en-prueba',
  'no-monotributo',
  'taller-sin-cuit',
  'taller-sin-razon-social',
] as const;

export type MotivoDelPedido = (typeof MOTIVOS_DEL_PEDIDO)[number];

export const MOTIVOS_DE_LA_SUBIDA = [
  'apagada',
  'no-es-un-certificado',
  'no-es-de-este-pedido',
  'otro-cuit',
  'vencido',
] as const;

export type MotivoDeLaSubida = (typeof MOTIVOS_DE_LA_SUBIDA)[number];

export const MOTIVOS_DE_LA_CONEXION = [
  'apagada',
  'en-prueba',
  'sin-certificado',
  'login-rechazado',
  'esperando',
  'sin-punto-de-venta',
  'punto-de-venta-de-otro-taller',
  'comprobantes-en-vuelo',
  'otro-punto-de-venta',
  'otro-cuit',
  'arca-no-contesta',
] as const;

export type MotivoDeLaConexion = (typeof MOTIVOS_DE_LA_CONEXION)[number];

export type Contestado<T, M extends string> =
  { ok: true; valor: T } | { ok: false; motivo: M; esperarHasta: string | null };

type Objeto = Readonly<Record<string, unknown>>;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esEntero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor);
}

function textoONada(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null;
}

function invalida(que: string): never {
  throw new RespuestaInvalidaError(`La respuesta de la facturación no trae ${que}.`);
}

function exigirComprobante(valor: unknown, quien: string): FilaDe<'comprobantes'> {
  if (!esObjeto(valor) || typeof valor.id !== 'string' || !esEntero(valor.version)) {
    throw new RespuestaInvalidaError(`${quien} no devolvió el comprobante.`);
  }
  return valor as unknown as FilaDe<'comprobantes'>;
}

export async function pedirLaFactura(
  cliente: ClienteMaun,
  pedido: FacturaParaPedir,
): Promise<FilaDe<'comprobantes'>> {
  const { data, error } = await cliente.rpc('pedir_la_factura', {
    p_id: pedido.id,
    p_pago_id: pedido.pagoId,
    p_detalle: pedido.detalle,
  });
  if (error) throw error;
  return exigirComprobante(data, 'pedir_la_factura');
}

export async function pedirLaNotaDeCredito(
  cliente: ClienteMaun,
  pedido: NotaDeCreditoParaPedir,
): Promise<FilaDe<'comprobantes'>> {
  const { data, error } = await cliente.rpc('pedir_la_nota_de_credito', {
    p_id: pedido.id,
    p_factura_id: pedido.facturaId,
  });
  if (error) throw error;
  return exigirComprobante(data, 'pedir_la_nota_de_credito');
}

export async function descartarLaAlertaDeFacturacion(
  cliente: ClienteMaun,
  alerta: AlertaParaDescartar,
): Promise<FilaDe<'ajustes'>> {
  const { data, error } = await cliente.rpc('descartar_la_alerta_de_facturacion', {
    p_codigo: alerta.codigo,
    p_numero: alerta.numero,
  });
  if (error) throw error;
  return data;
}

function leerAlerta(valor: unknown): AlertaDeFacturacion | null {
  if (!esObjeto(valor)) return null;
  switch (valor.codigo) {
    case 'fuera-de-numa':
      if (
        !esTipoDeComprobante(valor.tipo) ||
        !esEntero(valor.puntoDeVenta) ||
        !esEntero(valor.numeroArca)
      ) {
        return null;
      }
      return {
        codigo: 'fuera-de-numa',
        tipo: valor.tipo,
        puntoDeVenta: valor.puntoDeVenta,
        numeroArca: valor.numeroArca,
        numeroNuma: esEntero(valor.numeroNuma) ? valor.numeroNuma : null,
        descartada: valor.descartada === true,
      };
    case 'a-revisar':
      if (
        typeof valor.comprobanteId !== 'string' ||
        !esTipoDeComprobante(valor.tipo) ||
        !esEntero(valor.puntoDeVenta) ||
        !esEntero(valor.numero)
      ) {
        return null;
      }
      return {
        codigo: 'a-revisar',
        comprobanteId: valor.comprobanteId,
        proyectoId: textoONada(valor.proyectoId),
        tipo: valor.tipo,
        puntoDeVenta: valor.puntoDeVenta,
        numero: valor.numero,
        cliente: textoONada(valor.cliente) ?? '',
      };
    case 'certificado-por-vencer':
      return typeof valor.vence === 'string'
        ? { codigo: 'certificado-por-vencer', vence: valor.vence }
        : null;
    case 'sin-acceso':
      return { codigo: 'sin-acceso', desde: textoONada(valor.desde) };
    default:
      return null;
  }
}

export function leerAlertasDeFacturacion(valor: unknown): AlertaDeFacturacion[] {
  if (!Array.isArray(valor)) return [];
  const alertas: AlertaDeFacturacion[] = [];
  for (const elemento of valor) {
    const alerta = leerAlerta(elemento);
    if (alerta !== null) alertas.push(alerta);
  }
  return alertas;
}

function leerError(valor: unknown): ErrorDeArca | null {
  if (!esObjeto(valor)) return null;
  const codigo = typeof valor.codigo === 'string' ? Number(valor.codigo) : valor.codigo;
  return {
    codigo: esEntero(codigo) ? codigo : null,
    mensaje: textoONada(valor.mensaje) ?? '',
  };
}

export function leerRechazoDeArca(valor: Json | null | undefined): RechazoDeArca {
  if (!esObjeto(valor)) return { errores: [], motivo: null };
  const errores = Array.isArray(valor.errores)
    ? valor.errores.map(leerError).filter((error): error is ErrorDeArca => error !== null)
    : [];
  return { errores, motivo: textoONada(valor.motivo) };
}

function leerCertificado(valor: unknown): CertificadoDelTaller | null {
  if (!esObjeto(valor)) return null;
  const { estado } = valor;
  if (estado !== 'pedido' && estado !== 'subido' && estado !== 'activo') {
    return invalida('el estado del certificado');
  }
  return { estado, vence: textoONada(valor.vence) };
}

export function leerEstadoDeLaFacturacion(valor: unknown): EstadoDeLaFacturacion {
  if (!esObjeto(valor)) return invalida('el estado');
  const { conectada, prendido, ambiente, servidor, login, ultimoNumero } = valor;
  if (typeof conectada !== 'boolean') return invalida('si está conectada');
  if (typeof prendido !== 'boolean') return invalida('si la facturación está prendida');
  return {
    conectada,
    ambiente: esAmbienteDeArca(ambiente) ? ambiente : null,
    prendido,
    servidor: servidor === 'ok' || servidor === 'caido' ? servidor : null,
    login:
      login === 'ok' ||
      login === 'esperando' ||
      login === 'rechazado' ||
      login === 'sin-certificado'
        ? login
        : null,
    esperarHasta: textoONada(valor.esperarHasta),
    ultimoNumero: esEntero(ultimoNumero) && ultimoNumero >= 0 ? ultimoNumero : null,
    certificadoVence: textoONada(valor.certificadoVence),
    certificado: leerCertificado(valor.certificado),
  };
}

function comoError(error: unknown): Error {
  return error instanceof Error ? error : new Error('La función de la facturación no respondió.');
}

async function motivoDelRechazo<M extends string>(
  error: FunctionsHttpError,
  motivos: readonly M[],
): Promise<{ motivo: M; esperarHasta: string | null } | null> {
  const respuesta: unknown = error.context;
  if (!(respuesta instanceof Response) || respuesta.status !== 422) return null;
  const cuerpo: unknown = await respuesta
    .clone()
    .json()
    .catch(() => null);
  if (!esObjeto(cuerpo)) return null;
  const motivo = motivos.find((posible) => posible === cuerpo.motivo);
  return motivo === undefined ? null : { motivo, esperarHasta: textoONada(cuerpo.esperarHasta) };
}

async function llamar<T, M extends string>(
  cliente: ClienteMaun,
  ruta: string,
  opciones: { method: 'GET' } | { body: Readonly<Record<string, string | number>> },
  leer: (valor: unknown) => T,
  motivos: readonly M[],
): Promise<Contestado<T, M>> {
  const respuesta = await cliente.functions.invoke<unknown>(
    `${FUNCION_DE_FACTURAR}${ruta}`,
    opciones,
  );
  const error: unknown = respuesta.error;
  if (error instanceof FunctionsHttpError) {
    const rechazo = await motivoDelRechazo(error, motivos);
    if (rechazo !== null) return { ok: false, ...rechazo };
  }
  if (error !== null) throw comoError(error);
  return { ok: true, valor: leer(respuesta.data) };
}

export async function traerElEstadoDeLaFacturacion(
  cliente: ClienteMaun,
): Promise<EstadoDeLaFacturacion> {
  const contestado = await llamar(
    cliente,
    '/estado',
    { method: 'GET' },
    leerEstadoDeLaFacturacion,
    [],
  );
  if (!contestado.ok) return invalida('el estado');
  return contestado.valor;
}

function leerElPedido(valor: unknown): string {
  if (!esObjeto(valor) || typeof valor.pedido !== 'string')
    return invalida('el pedido del certificado');
  return valor.pedido;
}

export function bajarElPedidoDelCertificado(
  cliente: ClienteMaun,
): Promise<Contestado<string, MotivoDelPedido>> {
  return llamar(cliente, '/certificado', { body: {} }, leerElPedido, MOTIVOS_DEL_PEDIDO);
}

export function subirElCertificado(
  cliente: ClienteMaun,
  certificado: string,
): Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaSubida>> {
  return llamar(
    cliente,
    '/certificado/subir',
    { body: { certificado } },
    leerEstadoDeLaFacturacion,
    MOTIVOS_DE_LA_SUBIDA,
  );
}

export function conectarConArca(
  cliente: ClienteMaun,
  puntoDeVenta: number,
): Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaConexion>> {
  return llamar(
    cliente,
    '/conectar',
    { body: { puntoDeVenta } },
    leerEstadoDeLaFacturacion,
    MOTIVOS_DE_LA_CONEXION,
  );
}
