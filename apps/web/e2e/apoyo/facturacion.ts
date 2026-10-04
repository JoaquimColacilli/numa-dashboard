import type { BrowserContext, Page, Request, Route } from '@playwright/test';

export const RUTAS_DE_LA_FACTURACION =
  /\/rest\/v1\/rpc\/(pedir_la_factura|pedir_la_nota_de_credito|descartar_la_alerta_de_facturacion)(\?|$)|\/functions\/v1\/facturar(\/|\?|$)/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const ESTADO_DEL_TALLER_DE_PRUEBA = {
  conectada: true,
  ambiente: 'homologacion',
  prendido: true,
  servidor: 'ok',
  login: 'ok',
  esperarHasta: null,
  ultimoNumero: 0,
  certificadoVence: '2028-10-02',
  certificado: null,
} as const;

export type CaminoDeLaFacturacion =
  | 'pedir_la_factura'
  | 'pedir_la_nota_de_credito'
  | 'descartar_la_alerta_de_facturacion'
  | 'estado'
  | 'certificado'
  | 'certificado/subir'
  | 'conectar'
  | 'control'
  | 'trabajo';

export function caminoDelPedido(url: string): string {
  const { pathname } = new URL(url);
  const rpc = /\/rest\/v1\/rpc\/([a-z_]+)$/.exec(pathname);
  if (rpc?.[1] !== undefined) return rpc[1];
  const funcion = /\/functions\/v1\/facturar\/?(.*)$/.exec(pathname);
  return funcion?.[1] ?? pathname;
}

function cuerpoDe(pedido: Request): unknown {
  const crudo = pedido.postData();
  if (crudo === null || crudo === '') return null;
  try {
    return JSON.parse(crudo) as unknown;
  } catch {
    return crudo;
  }
}

async function contestarElPermiso(ruta: Route): Promise<boolean> {
  if (ruta.request().method() !== 'OPTIONS') return false;
  await ruta.fulfill({ status: 204, headers: CORS });
  return true;
}

const escapados: string[] = [];

export function sacarLosEscapados(): string[] {
  return escapados.splice(0);
}

export function losEscapados(): readonly string[] {
  return [...escapados];
}

export interface OpcionesDeLaTraba {
  estado?: unknown;
}

export async function trabarLaFacturacion(
  context: BrowserContext,
  { estado }: OpcionesDeLaTraba = {},
): Promise<void> {
  await context.route(RUTAS_DE_LA_FACTURACION, async (ruta) => {
    if (await contestarElPermiso(ruta)) return;
    const pedido = ruta.request();
    const camino = caminoDelPedido(pedido.url());
    if (estado !== undefined && pedido.method() === 'GET' && camino === 'estado') {
      await ruta.fulfill({ status: 200, headers: CORS, json: estado });
      return;
    }
    escapados.push(`${pedido.method()} ${camino}`);
    await ruta.abort('blockedbyclient');
  });
}

export interface PedidoRecibido {
  camino: string;
  metodo: string;
  cuerpo: unknown;
}

export interface RespuestaSimulada {
  status?: number;
  json: unknown;
}

export type RespuestasDeLaFacturacion = Partial<
  Record<CaminoDeLaFacturacion, (cuerpo: unknown) => RespuestaSimulada>
>;

export interface ServidorSimulado {
  pedidos: PedidoRecibido[];
  sinRespuesta: string[];
  de: (camino: CaminoDeLaFacturacion) => PedidoRecibido[];
  responder: (respuestas: RespuestasDeLaFacturacion) => void;
}

export async function servidorDeLaFacturacion(
  donde: BrowserContext,
  iniciales: RespuestasDeLaFacturacion = {},
): Promise<ServidorSimulado> {
  const respuestas: RespuestasDeLaFacturacion = { ...iniciales };
  const servidor: ServidorSimulado = {
    pedidos: [],
    sinRespuesta: [],
    de: (camino) => servidor.pedidos.filter((pedido) => pedido.camino === camino),
    responder: (nuevas) => {
      Object.assign(respuestas, nuevas);
    },
  };
  await donde.route(RUTAS_DE_LA_FACTURACION, async (ruta) => {
    if (await contestarElPermiso(ruta)) return;
    const pedido = ruta.request();
    const camino = caminoDelPedido(pedido.url());
    const cuerpo = cuerpoDe(pedido);
    servidor.pedidos.push({ camino, metodo: pedido.method(), cuerpo });
    const responder = respuestas[camino as CaminoDeLaFacturacion];
    if (responder === undefined) {
      servidor.sinRespuesta.push(`${pedido.method()} ${camino}`);
      await ruta.abort('blockedbyclient');
      return;
    }
    const { status = 200, json } = responder(cuerpo);
    await ruta.fulfill({ status, headers: CORS, json });
  });
  return servidor;
}

export interface DatosDelComprobante {
  id: string;
  householdId: string;
  proyectoId: string;
  pagoId: string;
  importe: number;
  tipo?: 'factura_c' | 'nota_de_credito_c';
  estado?: 'pedida' | 'emitiendo' | 'autorizada' | 'anulada' | 'rechazada' | 'a_revisar';
  puntoDeVenta?: number;
  numero?: number | null;
  fecha?: string | null;
  caeVence?: string | null;
  asociadoId?: string | null;
  receptor?: string;
  detalle?: string;
  version?: number;
}

export function filaDeComprobante(datos: DatosDelComprobante): Record<string, unknown> {
  const {
    estado = 'pedida',
    tipo = 'factura_c',
    puntoDeVenta = 2,
    numero = null,
    fecha = null,
  } = datos;
  const autorizada = estado === 'autorizada' || estado === 'anulada';
  const ahora = new Date().toISOString();
  return {
    id: datos.id,
    household_id: datos.householdId,
    proyecto_id: datos.proyectoId,
    pago_id: datos.pagoId,
    tipo,
    ambiente: 'homologacion',
    estado,
    punto_de_venta: puntoDeVenta,
    numero,
    fecha,
    concepto: 1,
    importe_centavos: datos.importe,
    moneda: 'ARS',
    detalle: datos.detalle ?? 'Seña',
    cuit_emisor: '20-11111111-2',
    emisor: {
      razonSocial: 'Taller de Prueba Ñandú',
      nombreDelTaller: 'Pruebas',
      domicilio: 'Calle Falsa 123, Rosario',
      cuit: '20-11111111-2',
      ingresosBrutos: '901-123456-7',
      inicioDeActividades: '2019-03-01',
    },
    receptor_nombre: datos.receptor ?? 'Consumidor final',
    receptor_domicilio: '',
    receptor_condicion: 'consumidor_final',
    condicion_iva_receptor: 5,
    doc_tipo: 99,
    doc_nro: '0',
    asociado_id: datos.asociadoId ?? null,
    cae: autorizada ? '86400944804384' : null,
    cae_vence: autorizada ? (datos.caeVence ?? fecha) : null,
    autorizada_at: autorizada ? ahora : null,
    rechazo: null,
    intentos: 0,
    emitiendo_hasta: null,
    ultimo_error: null,
    pedida_at: ahora,
    created_at: ahora,
    updated_at: ahora,
    deleted_at: null,
    version: datos.version ?? 1,
  };
}

interface MutacionGuardada {
  mutationKey?: unknown[];
  state?: { variables?: { pedido?: { id?: string } } };
}

export async function facturasEnLaCola(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((listo, fallo) => {
        const apertura = indexedDB.open('maun');
        apertura.onerror = () => {
          fallo(new Error('no se pudo abrir la base del aparato'));
        };
        apertura.onsuccess = () => {
          const lectura = apertura.result
            .transaction('react-query')
            .objectStore('react-query')
            .get('cache');
          lectura.onerror = () => {
            fallo(new Error('no se pudo leer la cola guardada'));
          };
          lectura.onsuccess = () => {
            const guardado = lectura.result as
              { clientState?: { mutations?: MutacionGuardada[] } } | undefined;
            listo(
              (guardado?.clientState?.mutations ?? [])
                .filter((mutacion) => mutacion.mutationKey?.[1] === 'pedir-la-factura')
                .map((mutacion) => mutacion.state?.variables?.pedido?.id ?? ''),
            );
          };
        };
      }),
  );
}

export async function conComprobantesEnElArranque(
  page: Page,
  filas: readonly Record<string, unknown>[],
): Promise<void> {
  await page.route(/\/rest\/v1\/rpc\/(bootstrap|delta)(\?|$)/, async (ruta) => {
    if (ruta.request().method() !== 'POST') {
      await ruta.fallback();
      return;
    }
    const respuesta = await ruta.fetch();
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    const previas = Array.isArray(cuerpo.comprobantes) ? (cuerpo.comprobantes as unknown[]) : [];
    await ruta.fulfill({
      response: respuesta,
      json: { ...cuerpo, comprobantes: [...previas, ...filas] },
    });
  });
}
