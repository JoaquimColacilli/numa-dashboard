import type { EstadoDelComprobante, TipoDeComprobante } from '@maun/domain';

import type { Ambiente, Pedir } from './red.ts';
import type { MensajeDeArca } from './xml.ts';

export const TOPE_DE_LA_BASE_MS = 10_000;

export interface Comprobante {
  id: string;
  household_id: string;
  proyecto_id: string;
  pago_id: string;
  asociado_id: string | null;
  tipo: TipoDeComprobante;
  ambiente: Ambiente;
  estado: EstadoDelComprobante;
  cuit_emisor: string;
  punto_de_venta: number;
  concepto: number;
  numero: number | null;
  fecha: string | null;
  importe_centavos: number;
  doc_tipo: number;
  doc_nro: string;
  condicion_iva_receptor: number;
  receptor_nombre: string;
  intentos: number;
  emitiendo_hasta: string | null;
}

export interface Rechazo {
  errores: MensajeDeArca[];
  observaciones: MensajeDeArca[];
}

export type Paso =
  | { paso: 'reservar'; intento: number; numero: number; fecha: string; segundos: number }
  | { paso: 'autorizada'; intento?: number; cae: string; caeVence: string; fecha: string }
  | { paso: 'rechazada'; intento: number; rechazo: Rechazo }
  | { paso: 'a_revisar'; intento: number; motivo: string }
  | { paso: 'pedida'; intento?: number; error?: string }
  | { paso: 'soltar'; intento: number; error: string };

export interface Anotado {
  hecho: boolean;
  comprobante: Comprobante;
}

export interface Intercambio {
  householdId: string | null;
  comprobanteId: string | null;
  ambiente: Ambiente;
  metodo: string;
  httpEstado: number | null;
  duracionMs: number | null;
  pedido: string | null;
  respuesta: string | null;
  error: string | null;
}

export interface TicketDelWsaa {
  token: string;
  firma: string;
  vence: string;
}

export type TomaDelLogin = { ticket: TicketDelWsaa } | { esperar: string } | { pedir: true };

export type TicketParaGuardar =
  TicketDelWsaa | { bloqueadoHasta: string } | { soltar: true } | { borrar: true };

export interface CertificadoGuardado {
  id: string;
  estado: 'pedido' | 'subido' | 'activo';
  cuit: string;
  pedido?: string;
  certificado: string | null;
  huella: string | null;
  vence: string | null;
  claveCifrada: string;
  claveIv: string;
}

export interface CertificadosDelTaller {
  activo: CertificadoGuardado | null;
  pendiente: CertificadoGuardado | null;
}

export interface CertificadoResumido {
  id: string;
  estado: 'pedido' | 'subido' | 'activo';
  cuit: string;
  vence: string | null;
}

export interface FacturacionDelTaller {
  householdId: string;
  ambiente: Ambiente | null;
  cuit: string;
  puntoDeVenta: number | null;
  desde: string | null;
  tallerCuit: string;
  tallerTitular: string;
  tallerCondicionFiscal: string | null;
  certificados: { activo: CertificadoResumido | null; pendiente: CertificadoResumido | null };
}

export interface ComprobanteARevisar {
  id: string;
  tipo: TipoDeComprobante;
  ambiente: Ambiente;
  cuitEmisor: string;
  puntoDeVenta: number;
  numero: number;
  fecha: string | null;
  importeCentavos: number;
  docTipo: number;
  docNro: string;
  proyectoId: string;
  cliente: string;
}

export interface TallerParaControlar {
  householdId: string;
  ambiente: Ambiente;
  cuit: string;
  puntoDeVenta: number;
  certificadoVence: string | null;
  ultimos: Record<TipoDeComprobante, number | null>;
  aRevisar: ComprobanteARevisar[];
  alertas: unknown[];
}

export interface FacturaAsociada {
  puntoDeVenta: number;
  numero: number;
  fecha: string;
}

export interface Base {
  pendientes(ambientes: readonly Ambiente[]): Promise<string[]>;
  tomar(id: string, segundos: number): Promise<Comprobante | null>;
  anotar(id: string, paso: Paso): Promise<Anotado>;
  facturaAsociada(id: string): Promise<FacturaAsociada | null>;
  tomarElLogin(certificado: string, segundos: number): Promise<TomaDelLogin>;
  guardarElTicket(certificado: string, ticket: TicketParaGuardar): Promise<void>;
  certificados(householdId: string): Promise<CertificadosDelTaller>;
  guardarElPedido(
    householdId: string,
    cuit: string,
    pedido: string,
    claveCifrada: string,
    claveIv: string,
  ): Promise<void>;
  guardarElCertificado(
    id: string,
    certificado: string,
    huella: string,
    vence: string,
  ): Promise<void>;
  conectar(householdId: string, certificadoId: string, puntoDeVenta: number): Promise<void>;
  anotarElIntercambio(intercambio: Intercambio): Promise<void>;
  anotarElAcceso(ambiente: Ambiente, ok: boolean, householdId: string | null): Promise<void>;
  paraControlar(ambientes: readonly Ambiente[]): Promise<TallerParaControlar[]>;
  anotarLasAlertas(householdId: string, alertas: readonly Record<string, unknown>[]): Promise<void>;
  delUsuario(usuarioId: string): Promise<FacturacionDelTaller | null>;
  usuarioDelToken(token: string): Promise<string | null>;
}

export class ErrorDeLaBase extends Error {
  override readonly name = 'ErrorDeLaBase';

  constructor(
    readonly codigo: string,
    readonly hint: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function baseDeSupabase(url: string, clave: string, pedir: Pedir = fetch): Base {
  const cabeceras: Record<string, string> = {
    apikey: clave,
    'Content-Type': 'application/json',
    ...(clave.startsWith('eyJ') ? { Authorization: `Bearer ${clave}` } : {}),
  };

  async function leerElError(nombre: string, respuesta: Response): Promise<ErrorDeLaBase> {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      code?: unknown;
      message?: unknown;
      hint?: unknown;
    };
    return new ErrorDeLaBase(
      typeof cuerpo.code === 'string' ? cuerpo.code : String(respuesta.status),
      typeof cuerpo.hint === 'string' ? cuerpo.hint : '',
      `${nombre}: ${typeof cuerpo.message === 'string' ? cuerpo.message : String(respuesta.status)}`,
    );
  }

  async function rpc<T>(nombre: string, argumentos: Record<string, unknown>): Promise<T> {
    const respuesta = await pedir(`${url}/rest/v1/rpc/${nombre}`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify(argumentos),
      signal: AbortSignal.timeout(TOPE_DE_LA_BASE_MS),
    });
    if (!respuesta.ok) throw await leerElError(nombre, respuesta);
    return (await respuesta.json()) as T;
  }

  return {
    pendientes: (ambientes) => rpc('facturacion_pendientes', { p_ambientes: ambientes }),
    tomar: (id, segundos) => rpc('facturacion_tomar', { p_id: id, p_segundos: segundos }),
    anotar: (id, paso) => rpc('facturacion_anotar', { p_id: id, p_paso: paso }),
    facturaAsociada: async (id) => {
      const respuesta = await pedir(
        `${url}/rest/v1/comprobantes?id=eq.${encodeURIComponent(id)}&select=punto_de_venta,numero,fecha`,
        { method: 'GET', headers: cabeceras, signal: AbortSignal.timeout(TOPE_DE_LA_BASE_MS) },
      );
      if (!respuesta.ok) throw await leerElError('comprobantes', respuesta);
      const filas = (await respuesta.json()) as {
        punto_de_venta: number;
        numero: number | null;
        fecha: string | null;
      }[];
      const fila = filas[0];
      return fila === undefined || fila.numero === null || fila.fecha === null
        ? null
        : { puntoDeVenta: fila.punto_de_venta, numero: fila.numero, fecha: fila.fecha };
    },
    tomarElLogin: (certificado, segundos) =>
      rpc('facturacion_tomar_el_login', { p_certificado: certificado, p_segundos: segundos }),
    guardarElTicket: async (certificado, ticket) => {
      await rpc<boolean>('facturacion_guardar_el_ticket', {
        p_certificado: certificado,
        p_ticket: ticket,
      });
    },
    certificados: (householdId) => rpc('facturacion_certificados', { p_household_id: householdId }),
    guardarElPedido: async (householdId, cuit, pedido, claveCifrada, claveIv) => {
      await rpc<unknown>('facturacion_guardar_el_pedido', {
        p_household_id: householdId,
        p_cuit: cuit,
        p_pedido: pedido,
        p_clave_cifrada: claveCifrada,
        p_clave_iv: claveIv,
      });
    },
    guardarElCertificado: async (id, certificado, huella, vence) => {
      await rpc<unknown>('facturacion_guardar_el_certificado', {
        p_id: id,
        p_certificado: certificado,
        p_huella: huella,
        p_vence: vence,
      });
    },
    conectar: async (householdId, certificadoId, puntoDeVenta) => {
      await rpc<unknown>('facturacion_conectar', {
        p_household_id: householdId,
        p_certificado_id: certificadoId,
        p_punto_de_venta: puntoDeVenta,
      });
    },
    anotarElIntercambio: async (intercambio) => {
      await rpc<string>('facturacion_anotar_el_intercambio', { p_intercambio: intercambio });
    },
    anotarElAcceso: async (ambiente, ok, householdId) => {
      await rpc<number>('facturacion_anotar_el_acceso', {
        p_ambiente: ambiente,
        p_ok: ok,
        p_household_id: householdId,
      });
    },
    paraControlar: (ambientes) => rpc('facturacion_para_controlar', { p_ambientes: ambientes }),
    anotarLasAlertas: async (householdId, alertas) => {
      await rpc<unknown>('facturacion_anotar_las_alertas', {
        p_household_id: householdId,
        p_alertas: alertas,
      });
    },
    delUsuario: (usuarioId) => rpc('facturacion_del_usuario', { p_user_id: usuarioId }),
    usuarioDelToken: async (token) => {
      const respuesta = await pedir(`${url}/auth/v1/user`, {
        method: 'GET',
        headers: { apikey: clave, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(TOPE_DE_LA_BASE_MS),
      });
      if (!respuesta.ok) return null;
      const cuerpo = (await respuesta.json()) as { id?: unknown };
      return typeof cuerpo.id === 'string' ? cuerpo.id : null;
    },
  };
}
