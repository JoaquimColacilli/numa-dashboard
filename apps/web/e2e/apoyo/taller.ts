import { createHash } from 'node:crypto';

import { entornoDePrueba, type EntornoDePrueba } from './entorno';

const DIA_EN_EL_TALLER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoyEnElTaller(ahora: Date = new Date()): string {
  return DIA_EN_EL_TALLER.format(ahora);
}

export interface SesionDePrueba {
  entorno: EntornoDePrueba;
  accessToken: string;
  usuarioId: string;
  guardada: string;
}

const ESPERA_DE_UNA_LECTURA_MS = 10_000;
const ESPERA_DE_UNA_ESCRITURA_MS = 20_000;
const PAUSAS_ENTRE_INTENTOS_MS = [500, 2_000] as const;
const PEDIDO_LENTO_MS = 3_000;

const CODIGOS_QUE_NO_ESCRIBIERON = new Set([
  '40001',
  '40P01',
  '55P03',
  '57014',
  'PGRST000',
  'PGRST001',
  'PGRST002',
  'PGRST003',
]);

const ESTADOS_QUE_NO_ESCRIBIERON = new Set([429, 503, 521, 522, 523]);

const FALLAS_ANTES_DE_MANDAR = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
]);

const POST_QUE_SE_PUEDEN_REPETIR = [
  '/auth/v1/token',
  '/storage/v1/object/list/',
  '/rest/v1/rpc/estado_de_mis_avisos',
  '/rest/v1/rpc/guardar_preferencias_de_avisos',
  '/rest/v1/rpc/encuesta_compartida',
];

type OtraVez = 'siempre' | 'si-se-puede-repetir' | 'nunca';

class PedidoFallido extends Error {
  readonly otraVez: OtraVez;

  constructor(mensaje: string, otraVez: OtraVez) {
    super(mensaje);
    this.otraVez = otraVez;
  }
}

function sePuedeRepetir(metodo: string, ruta: string): boolean {
  return metodo !== 'POST' || POST_QUE_SE_PUEDEN_REPETIR.some((inicio) => ruta.startsWith(inicio));
}

function sinConsulta(ruta: string): string {
  return ruta.split('?')[0] ?? ruta;
}

function codigoDeLaFalla(error: unknown): string {
  if (!(error instanceof Error)) return '';
  const causa: unknown = error.cause;
  if (causa instanceof Error && 'code' in causa && typeof causa.code === 'string') {
    return causa.code;
  }
  return error.name;
}

function fallaDeLaRed(error: unknown, espera: number): PedidoFallido {
  const codigo = codigoDeLaFalla(error);
  if (codigo === 'TimeoutError' || codigo === 'AbortError') {
    return new PedidoFallido(`no contestó en ${String(espera / 1000)} s`, 'si-se-puede-repetir');
  }
  const detalle = error instanceof Error ? error.message : String(error);
  return new PedidoFallido(
    `no llegó a la base (${codigo === '' ? detalle : `${codigo}: ${detalle}`})`,
    FALLAS_ANTES_DE_MANDAR.has(codigo) ? 'siempre' : 'si-se-puede-repetir',
  );
}

function fallaDeLaRespuesta(ruta: string, estado: number, texto: string): PedidoFallido {
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto) as unknown;
  } catch {
    return new PedidoFallido(
      `${ruta} devolvió ${String(estado)} sin JSON: ${texto.replace(/\s+/g, ' ').slice(0, 160)}`,
      ESTADOS_QUE_NO_ESCRIBIERON.has(estado)
        ? 'siempre'
        : estado >= 500 || estado < 300
          ? 'si-se-puede-repetir'
          : 'nunca',
    );
  }
  const codigo =
    typeof cuerpo === 'object' && cuerpo !== null && 'code' in cuerpo ? String(cuerpo.code) : '';
  return new PedidoFallido(
    `${ruta} devolvió ${String(estado)}: ${JSON.stringify(cuerpo)}`,
    CODIGOS_QUE_NO_ESCRIBIERON.has(codigo) || ESTADOS_QUE_NO_ESCRIBIERON.has(estado)
      ? 'siempre'
      : estado >= 500
        ? 'si-se-puede-repetir'
        : 'nunca',
  );
}

async function pedir(
  entorno: EntornoDePrueba,
  ruta: string,
  opciones: Omit<RequestInit, 'headers' | 'signal'> & {
    accessToken?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<unknown> {
  const { accessToken, headers, ...resto } = opciones;
  const metodo = (resto.method ?? 'GET').toUpperCase();
  const repetible = sePuedeRepetir(metodo, ruta);
  const espera = repetible ? ESPERA_DE_UNA_LECTURA_MS : ESPERA_DE_UNA_ESCRITURA_MS;
  const donde = `${metodo} ${sinConsulta(ruta)}`;

  for (let intento = 1; ; intento += 1) {
    const inicio = performance.now();
    let falla: PedidoFallido;
    try {
      const respuesta = await fetch(`${entorno.url}${ruta}`, {
        ...resto,
        signal: AbortSignal.timeout(espera),
        headers: {
          apikey: entorno.publishableKey,
          'Content-Type': 'application/json',
          ...(accessToken === undefined ? {} : { Authorization: `Bearer ${accessToken}` }),
          ...headers,
        },
      });
      const texto = await respuesta.text();
      const tardo = performance.now() - inicio;
      if (tardo > PEDIDO_LENTO_MS) {
        console.warn(`[taller] ${donde} tardó ${(tardo / 1000).toFixed(1)} s`);
      }
      if (respuesta.ok) {
        if (texto === '') return null;
        try {
          return JSON.parse(texto) as unknown;
        } catch {
          falla = fallaDeLaRespuesta(ruta, respuesta.status, texto);
        }
      } else {
        falla = fallaDeLaRespuesta(ruta, respuesta.status, texto);
      }
    } catch (error) {
      falla = fallaDeLaRed(error, espera);
    }
    const pausa = PAUSAS_ENTRE_INTENTOS_MS[intento - 1];
    const otraVez =
      falla.otraVez === 'siempre' || (falla.otraVez === 'si-se-puede-repetir' && repetible);
    if (!otraVez || pausa === undefined) {
      if (intento > 1) falla.message = `${falla.message} (intento ${String(intento)})`;
      throw falla;
    }
    console.warn(`[taller] ${donde}: ${falla.message}; otra vez en ${String(pausa)} ms`);
    await new Promise((listo) => setTimeout(listo, pausa));
  }
}

export async function iniciarSesionDePrueba(): Promise<SesionDePrueba> {
  const entorno = entornoDePrueba();
  const cuerpo = (await pedir(entorno, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: entorno.email, password: entorno.password }),
  })) as { access_token?: string; user?: { id?: string } };

  const accessToken = cuerpo.access_token;
  const usuarioId = cuerpo.user?.id;
  if (accessToken === undefined || usuarioId === undefined) {
    throw new Error(
      'La cuenta de prueba no pudo iniciar sesión. Revisá E2E_EMAIL y E2E_PASSWORD, y que el mail esté confirmado.',
    );
  }
  return { entorno, accessToken, usuarioId, guardada: JSON.stringify(cuerpo) };
}

export async function householdDePrueba({ entorno, accessToken }: SesionDePrueba): Promise<string> {
  const filas = (await pedir(entorno, '/rest/v1/households?select=id', { accessToken })) as {
    id: string;
  }[];
  const id = filas[0]?.id;
  if (id === undefined) throw new Error('La cuenta de prueba no tiene taller.');
  return id;
}

export async function vaciarClientes({ entorno, accessToken }: SesionDePrueba): Promise<number> {
  const vivos = (await pedir(entorno, '/rest/v1/clientes?select=id&deleted_at=is.null', {
    accessToken,
  })) as { id: string }[];
  if (vivos.length === 0) return 0;

  await pedir(entorno, '/rest/v1/clientes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  return vivos.length;
}

export interface FilaDeCliente {
  id: string;
  nombre: string;
  version: number;
  updated_at: string;
}

export async function contarClientes(
  { entorno, accessToken }: SesionDePrueba,
  nombre: string,
): Promise<number> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/clientes?select=id&deleted_at=is.null&nombre=eq.${encodeURIComponent(nombre)}`,
    { accessToken },
  )) as { id: string }[];
  return filas.length;
}

export async function upsertCliente(
  { entorno, accessToken }: SesionDePrueba,
  datos: { id: string; nombre: string; zona?: string },
): Promise<FilaDeCliente> {
  const filas = (await pedir(entorno, '/rest/v1/clientes?on_conflict=id', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(datos),
  })) as FilaDeCliente[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el upsert no devolvió la fila');
  return fila;
}

export async function leerCliente(
  { entorno, accessToken }: SesionDePrueba,
  nombre: string,
): Promise<(FilaDeCliente & { zona: string }) | undefined> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/clientes?select=id,nombre,zona,version,updated_at&deleted_at=is.null&nombre=eq.${encodeURIComponent(nombre)}`,
    { accessToken },
  )) as (FilaDeCliente & { zona: string })[];
  return filas[0];
}

export interface FilaDeProyecto {
  id: string;
  titulo: string;
  estado: string;
  version: number;
  presupuesto_centavos: number | null;
  sena_bp: number | null;
  fecha_visita: string | null;
  visita_hora: string | null;
  entrega_estimada: string | null;
  entrega_hora: string | null;
  fecha_entrega: string | null;
  vencimiento_presupuesto: string | null;
  costo_madera_centavos: number | null;
  costo_herrajes_centavos: number | null;
  costo_flete_centavos: number | null;
  costo_ayudante_centavos: number | null;
  presupuesto_cotizacion: boolean;
  visita_hecha: boolean;
  visita_importante: boolean;
  entrega_importante: boolean;
  presupuesto_importante: boolean;
  presupuesto_vale_hasta: string | null;
  listo_el: string | null;
  entrega_comprometida: string | null;
  entrega_comprometida_franja: string | null;
  tipo_de_proyecto: string | null;
}

const COLUMNAS_DEL_PROYECTO = [
  'id',
  'titulo',
  'estado',
  'version',
  'presupuesto_centavos',
  'sena_bp',
  'fecha_visita',
  'visita_hora',
  'entrega_estimada',
  'entrega_hora',
  'fecha_entrega',
  'vencimiento_presupuesto',
  'costo_madera_centavos',
  'costo_herrajes_centavos',
  'costo_flete_centavos',
  'costo_ayudante_centavos',
  'presupuesto_cotizacion',
  'visita_hecha',
  'visita_importante',
  'entrega_importante',
  'presupuesto_importante',
  'presupuesto_vale_hasta',
  'listo_el',
  'entrega_comprometida',
  'entrega_comprometida_franja',
  'tipo_de_proyecto',
].join(',');

export async function descongelarProyectos({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<number> {
  const liquidados = (await pedir(
    entorno,
    '/rest/v1/proyectos?select=id,estado,version&deleted_at=is.null&estado=in.(cobrado,perdido)',
    { accessToken },
  )) as { id: string; estado: string; version: number }[];

  for (const proyecto of liquidados) {
    const esCobro = proyecto.estado === 'cobrado';
    await pedir(entorno, `/rest/v1/rpc/${esCobro ? 'reabrir_proyecto' : 'reactivar_perdido'}`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        p_proyecto_id: proyecto.id,
        p_version: proyecto.version,
        ...(esCobro ? {} : { p_estado: 'contacto' }),
      }),
    });
  }
  return liquidados.length;
}

export async function vaciarProyectos(sesion: SesionDePrueba): Promise<number> {
  const { entorno, accessToken } = sesion;
  await descongelarProyectos(sesion);

  const vivos = (await pedir(entorno, '/rest/v1/proyectos?select=id&deleted_at=is.null', {
    accessToken,
  })) as { id: string }[];
  if (vivos.length === 0) return 0;

  await pedir(entorno, '/rest/v1/proyectos?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  return vivos.length;
}

export interface FilaDeMovimiento {
  id: string;
  fecha: string;
  tipo: string;
  tesoro_origen: string | null;
  tesoro_destino: string | null;
  desde_id?: string | null;
  hacia_id?: string | null;
  cubre_el_mes?: string | null;
  monto_centavos: number;
  categoria: string;
  descripcion: string;
}

export async function vaciarMovimientos({ entorno, accessToken }: SesionDePrueba): Promise<number> {
  const vivos = (await pedir(entorno, '/rest/v1/movimientos?select=id&deleted_at=is.null', {
    accessToken,
  })) as { id: string }[];
  if (vivos.length === 0) return 0;

  await pedir(entorno, '/rest/v1/movimientos?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  return vivos.length;
}

export async function movimientosDelTaller({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<FilaDeMovimiento[]> {
  return (await pedir(
    entorno,
    '/rest/v1/movimientos?select=id,fecha,tipo,tesoro_origen,tesoro_destino,desde_id,hacia_id,cubre_el_mes,monto_centavos,categoria,descripcion&deleted_at=is.null&order=id',
    { accessToken },
  )) as FilaDeMovimiento[];
}

export async function vaciarAnotaciones({ entorno, accessToken }: SesionDePrueba): Promise<number> {
  const vivas = (await pedir(entorno, '/rest/v1/anotaciones?select=id&deleted_at=is.null', {
    accessToken,
  })) as { id: string }[];
  if (vivas.length === 0) return 0;

  await pedir(entorno, '/rest/v1/anotaciones?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  return vivas.length;
}

export interface FilaDeAnotacion {
  id: string;
  fecha: string;
  texto: string;
  categoria: string;
  hecha: boolean;
  importante: boolean;
}

export async function anotacionesDelTaller({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<FilaDeAnotacion[]> {
  return (await pedir(
    entorno,
    '/rest/v1/anotaciones?select=id,fecha,texto,categoria,hecha,importante&deleted_at=is.null&order=fecha,texto',
    { accessToken },
  )) as FilaDeAnotacion[];
}

export async function crearAnotacionPorRest(
  { entorno, accessToken }: SesionDePrueba,
  datos: {
    fecha: string;
    texto: string;
    categoria?: 'materiales' | 'taller';
    hora?: string;
    proyecto_id?: string;
    importante?: boolean;
    hecha?: boolean;
  },
): Promise<string> {
  const filas = (await pedir(entorno, '/rest/v1/anotaciones', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(datos),
  })) as { id: string }[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta de la anotación no devolvió la fila');
  return fila.id;
}

export interface FilaDeArchivo {
  id: string;
  household_id: string;
  proyecto_id: string;
  nombre: string;
  tipo: string;
  bytes: number;
  ancho: number | null;
  alto: number | null;
  deleted_at: string | null;
}

export async function archivosDelTaller(
  { entorno, accessToken }: SesionDePrueba,
  incluirBorrados = false,
): Promise<FilaDeArchivo[]> {
  const filtro = incluirBorrados ? '' : '&deleted_at=is.null';
  return (await pedir(
    entorno,
    `/rest/v1/archivos?select=id,household_id,proyecto_id,nombre,tipo,bytes,ancho,alto,deleted_at${filtro}&order=nombre`,
    { accessToken },
  )) as FilaDeArchivo[];
}

export function rutasDelArchivo(fila: FilaDeArchivo): string[] {
  const base = `${fila.household_id}/${fila.proyecto_id}/${fila.id}`;
  if (fila.tipo === 'application/pdf') return [`${base}.pdf`];
  const extension = fila.tipo === 'image/jpeg' ? 'jpg' : 'webp';
  return [`${base}.${extension}`, `${base}.mini.${extension}`];
}

export async function objetosDelTrabajo(
  { entorno, accessToken }: SesionDePrueba,
  householdId: string,
  proyectoId: string,
): Promise<string[]> {
  const lista = (await pedir(entorno, '/storage/v1/object/list/archivos', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ prefix: `${householdId}/${proyectoId}`, limit: 100 }),
  })) as { name: string }[];
  return lista.map((objeto) => `${householdId}/${proyectoId}/${objeto.name}`);
}

export async function vaciarArchivos(sesion: SesionDePrueba): Promise<number> {
  const { entorno, accessToken } = sesion;
  const filas = await archivosDelTaller(sesion, true);
  const rutas = filas.flatMap(rutasDelArchivo);
  if (rutas.length > 0) {
    await pedir(entorno, '/storage/v1/object/archivos', {
      method: 'DELETE',
      accessToken,
      body: JSON.stringify({ prefixes: rutas }),
    });
  }
  const vivas = filas.filter((fila) => fila.deleted_at === null);
  if (vivas.length > 0) {
    await pedir(entorno, '/rest/v1/archivos?deleted_at=is.null', {
      method: 'PATCH',
      accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    });
  }
  return vivas.length;
}

export interface FilaDeLaVidriera {
  id: string;
  household_id: string;
  orden: number;
  tipo: string;
  bytes: number;
  ancho: number;
  alto: number;
  archivo_de_origen: string | null;
  deleted_at: string | null;
}

export async function fotosDeLaVidrieraDelTaller(
  { entorno, accessToken }: SesionDePrueba,
  incluirBorradas = false,
): Promise<FilaDeLaVidriera[]> {
  const filtro = incluirBorradas ? '' : '&deleted_at=is.null';
  return (await pedir(
    entorno,
    `/rest/v1/fotos_de_la_vidriera?select=id,household_id,orden,tipo,bytes,ancho,alto,archivo_de_origen,deleted_at${filtro}&order=orden,created_at,id`,
    { accessToken },
  )) as FilaDeLaVidriera[];
}

export function rutasEnLaVidriera(
  fila: Pick<FilaDeLaVidriera, 'id' | 'household_id' | 'tipo'>,
): string[] {
  const base = `${fila.household_id}/vidriera/${fila.id}`;
  const extension = fila.tipo === 'image/jpeg' ? 'jpg' : 'webp';
  return [`${base}.${extension}`, `${base}.mini.${extension}`];
}

export async function objetosDeLaVidriera(
  { entorno, accessToken }: SesionDePrueba,
  householdId: string,
): Promise<string[]> {
  const lista = (await pedir(entorno, '/storage/v1/object/list/archivos', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ prefix: `${householdId}/vidriera`, limit: 1000 }),
  })) as { name: string }[];
  return lista.map((objeto) => `${householdId}/vidriera/${objeto.name}`);
}

export async function subirAlBucketDePrueba(
  { entorno, accessToken }: SesionDePrueba,
  ruta: string,
  contenido: Buffer,
  tipo: string,
): Promise<void> {
  const respuesta = await fetch(`${entorno.url}/storage/v1/object/archivos/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: entorno.publishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': tipo,
      'x-upsert': 'true',
      'cache-control': 'max-age=31536000',
    },
    body: new Uint8Array(contenido),
  });
  if (!respuesta.ok) {
    throw new Error(
      `subir ${ruta} devolvió ${String(respuesta.status)}: ${await respuesta.text()}`,
    );
  }
}

export interface FotoParaLaVidriera {
  orden: number;
  contenido?: Buffer;
  tipo?: 'image/webp' | 'image/jpeg';
  ancho?: number;
  alto?: number;
  archivoDeOrigen?: string | null;
}

export async function fotoALaVidrieraPorRest(
  sesion: SesionDePrueba,
  foto: FotoParaLaVidriera,
): Promise<FilaDeLaVidriera> {
  const { orden, contenido, tipo = 'image/webp', ancho = 900, alto = 1200 } = foto;
  const id = crypto.randomUUID();
  if (contenido !== undefined) {
    const householdId = await householdDePrueba(sesion);
    for (const ruta of rutasEnLaVidriera({ id, household_id: householdId, tipo })) {
      await subirAlBucketDePrueba(sesion, ruta, contenido, tipo);
    }
  }
  const filas = (await pedir(sesion.entorno, '/rest/v1/fotos_de_la_vidriera', {
    method: 'POST',
    accessToken: sesion.accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      id,
      orden,
      tipo,
      bytes: contenido === undefined ? 1_000 : contenido.length * 2,
      ancho,
      alto,
      archivo_de_origen: foto.archivoDeOrigen ?? null,
    }),
  })) as FilaDeLaVidriera[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta de la foto de la vidriera no devolvió la fila');
  return fila;
}

export async function vaciarLaVidriera(sesion: SesionDePrueba): Promise<number> {
  const { entorno, accessToken } = sesion;
  const filas = await fotosDeLaVidrieraDelTaller(sesion, true);
  const rutas = filas.flatMap(rutasEnLaVidriera);
  if (rutas.length > 0) {
    await pedir(entorno, '/storage/v1/object/archivos', {
      method: 'DELETE',
      accessToken,
      body: JSON.stringify({ prefixes: rutas }),
    });
  }
  const vivas = filas.filter((fila) => fila.deleted_at === null);
  if (vivas.length > 0) {
    await pedir(entorno, '/rest/v1/fotos_de_la_vidriera?deleted_at=is.null', {
      method: 'PATCH',
      accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    });
  }
  return vivas.length;
}

export interface RedesDePrueba {
  instagram_link: string;
  facebook_link: string;
  tiktok_link: string;
}

export const SIN_REDES: RedesDePrueba = { instagram_link: '', facebook_link: '', tiktok_link: '' };

export async function escribirLasRedes(
  sesion: SesionDePrueba,
  redes: Partial<RedesDePrueba>,
): Promise<void> {
  await escribirAjustes(sesion, redes);
}

export type ClaveDeTesoro = 'hogar' | 'maun' | 'diezmo' | 'cocos';

export type MonedaDePrueba = 'ARS' | 'USD';

export interface FilaDeTesoro {
  id: string;
  clave: ClaveDeTesoro | null;
  moneda: MonedaDePrueba;
  nombre: string;
  descripcion: string;
  tinta: string;
  icono: string;
  meta_centavos: number | null;
  rinde_anual_bp: number | null;
  orden: number;
  archivado_at: string | null;
}

const COLUMNAS_DEL_TESORO =
  'id,clave,moneda,nombre,descripcion,tinta,icono,meta_centavos,rinde_anual_bp,orden,archivado_at';

export async function tesorosDelTaller(
  { entorno, accessToken }: SesionDePrueba,
  { conLosArchivados = false } = {},
): Promise<FilaDeTesoro[]> {
  const filtro = conLosArchivados ? '' : '&archivado_at=is.null';
  return (await pedir(
    entorno,
    `/rest/v1/tesoros?select=${COLUMNAS_DEL_TESORO}&deleted_at=is.null${filtro}&order=orden,created_at,id`,
    { accessToken },
  )) as FilaDeTesoro[];
}

export async function idDelTesoro(sesion: SesionDePrueba, clave: ClaveDeTesoro): Promise<string> {
  const tesoro = (await tesorosDelTaller(sesion)).find((uno) => uno.clave === clave);
  if (tesoro === undefined) throw new Error(`el taller de prueba no tiene el tesoro ${clave}`);
  return tesoro.id;
}

export interface TesoroParaCrear {
  nombre: string;
  moneda?: MonedaDePrueba;
  descripcion?: string;
  tinta?: string;
  icono?: string;
  meta_centavos?: number | null;
  rinde_anual_bp?: number | null;
  orden?: number;
}

export async function tesoroPorRest(
  { entorno, accessToken }: SesionDePrueba,
  datos: TesoroParaCrear,
): Promise<FilaDeTesoro> {
  const filas = (await pedir(entorno, `/rest/v1/tesoros?select=${COLUMNAS_DEL_TESORO}`, {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      descripcion: '',
      tinta: 'grana',
      icono: datos.moneda === 'USD' ? 'banknote' : 'vault',
      orden: 10,
      ...datos,
    }),
  })) as FilaDeTesoro[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta del tesoro no devolvió la fila');
  return fila;
}

export async function saldoDelTesoro(
  { entorno, accessToken }: SesionDePrueba,
  tesoroId: string,
): Promise<number> {
  const asientos = (await pedir(
    entorno,
    `/rest/v1/libro_mayor?select=monto_centavos&tesoro_id=eq.${tesoroId}&ya_en_la_apertura=is.false`,
    { accessToken },
  )) as { monto_centavos: number }[];
  return asientos.reduce((saldo, asiento) => saldo + asiento.monto_centavos, 0);
}

export async function archivarTesoroPorRest(
  { entorno, accessToken }: SesionDePrueba,
  tesoroId: string,
): Promise<void> {
  await pedir(entorno, `/rest/v1/tesoros?id=eq.${tesoroId}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ archivado_at: new Date().toISOString() }),
  });
}

export interface FilaGuardada {
  fila: Record<string, unknown> | null;
  fila_version: number;
  fila_guardada_at: string | null;
}

export async function leerLaFila({ entorno, accessToken }: SesionDePrueba): Promise<FilaGuardada> {
  const filas = (await pedir(
    entorno,
    '/rest/v1/ajustes?select=fila,fila_version,fila_guardada_at&deleted_at=is.null',
    { accessToken },
  )) as FilaGuardada[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el taller de prueba no tiene ajustes');
  return fila;
}

export async function guardarLaFilaPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  version: number,
  fila: Record<string, unknown> | null,
): Promise<FilaGuardada> {
  return (await pedir(entorno, '/rest/v1/rpc/guardar_la_fila', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ p_version: version, p_fila: fila }),
  })) as FilaGuardada;
}

export async function sacarLaFila(sesion: SesionDePrueba): Promise<boolean> {
  const { fila, fila_version } = await leerLaFila(sesion);
  if (fila === null) return false;
  await guardarLaFilaPorRpc(sesion, fila_version, null);
  return true;
}

export async function archivarLosTesorosDelDueno(sesion: SesionDePrueba): Promise<number> {
  const tesoros = await tesorosDelTaller(sesion);
  const delDueno = tesoros.filter((tesoro) => tesoro.clave === null);
  if (delDueno.length === 0) return 0;

  const maun = tesoros.find((tesoro) => tesoro.clave === 'maun');
  if (maun === undefined) throw new Error('el taller de prueba no tiene el tesoro maun');

  const pases: string[] = [];
  for (const tesoro of delDueno) {
    const saldo = await saldoDelTesoro(sesion, tesoro.id);
    if (saldo !== 0) {
      const id = crypto.randomUUID();
      const enOtraMoneda = tesoro.moneda !== 'ARS';
      await movimientosPorRest(sesion, [
        {
          id,
          fecha: hoyEnElTaller(),
          tipo: enOtraMoneda ? 'cambio' : 'transferencia',
          desde_id: saldo > 0 ? tesoro.id : maun.id,
          hacia_id: saldo > 0 ? maun.id : tesoro.id,
          monto_centavos: Math.abs(saldo),
          ...(enOtraMoneda ? { monto_destino_centavos: Math.abs(saldo) } : {}),
          categoria: enOtraMoneda ? 'Otro' : '',
          descripcion: `Lo que quedaba en ${tesoro.nombre}`,
        },
      ]);
      pases.push(id);
    }
    await archivarTesoroPorRest(sesion, tesoro.id);
  }
  if (pases.length > 0) await vaciarMovimientos(sesion);
  return delDueno.length;
}

export interface FilaDeReparto {
  id: string;
  posicion: number;
  tesoro_id: string;
  nombre: string;
  tipo: 'obligacion' | 'paso' | 'parte' | 'superavit';
  clase: string | null;
  modo: string | null;
  base: string | null;
  objetivo_centavos: number | null;
  previo_centavos: number | null;
  tope_centavos: number | null;
  por_mes: boolean | null;
  porcentaje_bp: number | null;
  monto_centavos: number;
  fecha: string;
  ya_en_la_apertura: boolean;
}

export async function repartosDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeReparto[]> {
  return (await pedir(
    entorno,
    `/rest/v1/repartos?select=id,posicion,tesoro_id,nombre,tipo,clase,modo,base,objetivo_centavos,previo_centavos,tope_centavos,por_mes,porcentaje_bp,monto_centavos,fecha,ya_en_la_apertura&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=posicion`,
    { accessToken },
  )) as FilaDeReparto[];
}

export interface RepartoLeido {
  tesoro: string;
  clase: string | null;
  objetivo: number | null;
  previo: number | null;
  monto: number;
}

export async function repartoDelCobro(
  sesion: SesionDePrueba,
  proyectoId: string,
): Promise<RepartoLeido[]> {
  const claves = new Map(
    (await tesorosDelTaller(sesion, { conLosArchivados: true })).map((tesoro) => [
      tesoro.id,
      tesoro.clave ?? tesoro.nombre,
    ]),
  );
  return (await repartosDe(sesion, proyectoId)).map((reparto) => ({
    tesoro: claves.get(reparto.tesoro_id) ?? reparto.tesoro_id,
    clase: reparto.clase,
    objetivo: reparto.objetivo_centavos,
    previo: reparto.previo_centavos,
    monto: reparto.monto_centavos,
  }));
}

export const DOLARES_E_IDIOMA_DE_FABRICA = {
  idioma_de_los_clientes: 'es',
  dolar_del_dia_centavos: null,
  dolar_del_dia_el: null,
  cobro_dolares_cbu: '',
  cobro_dolares_alias: '',
} as const;

export type IdiomaDePrueba = 'es' | 'en' | 'pt-BR';

export async function idiomaDeLaCuentaPorRest(
  { entorno, accessToken }: SesionDePrueba,
  idioma: IdiomaDePrueba | null,
): Promise<void> {
  await pedir(entorno, '/auth/v1/user', {
    method: 'PUT',
    accessToken,
    body: JSON.stringify({ data: { idioma } }),
  });
}

export async function idiomaDeLaCuentaDe({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<string | null> {
  const usuario = (await pedir(entorno, '/auth/v1/user', { accessToken })) as {
    user_metadata?: { idioma?: string | null };
  };
  return usuario.user_metadata?.idioma ?? null;
}

export async function dolaresEIdiomaDeFabrica(sesion: SesionDePrueba): Promise<void> {
  await pedir(sesion.entorno, '/rest/v1/ajustes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken: sesion.accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(DOLARES_E_IDIOMA_DE_FABRICA),
  });
}

export async function vaciarTaller(sesion: SesionDePrueba): Promise<void> {
  await vaciarLaVidriera(sesion);
  await vaciarArchivos(sesion);
  await vaciarAnotaciones(sesion);
  await vaciarMovimientos(sesion);
  await vaciarProyectos(sesion);
  await vaciarClientes(sesion);
  await sacarLaFila(sesion);
  await archivarLosTesorosDelDueno(sesion);
  await restablecerElPresupuestoDelTaller(sesion);
  await dolaresEIdiomaDeFabrica(sesion);
}

export async function crearCliente(
  { entorno, accessToken }: SesionDePrueba,
  nombre: string,
  extra: { telefono?: string; direccion?: string } = {},
): Promise<string> {
  const filas = (await pedir(entorno, '/rest/v1/clientes', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ nombre, ...extra }),
  })) as { id: string }[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta de cliente no devolvió la fila');
  return fila.id;
}

export async function leerProyecto(
  { entorno, accessToken }: SesionDePrueba,
  titulo: string,
): Promise<FilaDeProyecto | undefined> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/proyectos?select=${COLUMNAS_DEL_PROYECTO}&deleted_at=is.null&titulo=eq.${encodeURIComponent(titulo)}`,
    { accessToken },
  )) as FilaDeProyecto[];
  return filas[0];
}

export interface ContactoLeido {
  id: string;
  estado: string;
  fecha_visita: string | null;
  vencimiento_presupuesto: string | null;
  presupuesto_centavos: number | null;
  presupuesto_diseno: boolean;
  presupuesto_despiece: boolean;
  presupuesto_cotizacion: boolean;
  presupuesto_pdf: boolean;
  visita_hecha: boolean;
  visita_importante: boolean;
}

export async function leerContacto(
  { entorno, accessToken }: SesionDePrueba,
  titulo: string,
): Promise<ContactoLeido | undefined> {
  const columnas =
    'id,estado,fecha_visita,vencimiento_presupuesto,presupuesto_centavos,presupuesto_diseno,presupuesto_despiece,presupuesto_cotizacion,presupuesto_pdf,visita_hecha,visita_importante';
  const filas = (await pedir(
    entorno,
    `/rest/v1/proyectos?select=${columnas}&deleted_at=is.null&titulo=eq.${encodeURIComponent(titulo)}`,
    { accessToken },
  )) as ContactoLeido[];
  return filas[0];
}

export async function contarHijos(
  { entorno, accessToken }: SesionDePrueba,
  tabla: 'pagos' | 'gastos',
  proyectoId: string,
): Promise<number> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/${tabla}?select=id&deleted_at=is.null&proyecto_id=eq.${proyectoId}`,
    { accessToken },
  )) as { id: string }[];
  return filas.length;
}

export async function montosDe(
  { entorno, accessToken }: SesionDePrueba,
  tabla: 'pagos' | 'gastos',
  proyectoId: string,
): Promise<number[]> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/${tabla}?select=monto_centavos&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=monto_centavos`,
    { accessToken },
  )) as { monto_centavos: number }[];
  return filas.map((fila) => fila.monto_centavos);
}

export interface FilaDePago {
  id: string;
  fecha: string;
  concepto: string;
  monto_centavos: number;
  ya_en_la_apertura: boolean;
}

export async function pagosDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDePago[]> {
  return (await pedir(
    entorno,
    `/rest/v1/pagos?select=id,fecha,concepto,monto_centavos,ya_en_la_apertura&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=id`,
    { accessToken },
  )) as FilaDePago[];
}

export interface PagoEnSuMoneda extends FilaDePago {
  moneda: MonedaDePrueba;
  cotizacion_centavos: number | null;
  tesoro_id: string | null;
}

export async function pagosEnSuMonedaDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<PagoEnSuMoneda[]> {
  return (await pedir(
    entorno,
    `/rest/v1/pagos?select=id,fecha,concepto,monto_centavos,ya_en_la_apertura,moneda,cotizacion_centavos,tesoro_id&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=fecha,created_at`,
    { accessToken },
  )) as PagoEnSuMoneda[];
}

export async function dolarDelDiaPorRest(
  sesion: SesionDePrueba,
  dolar: number | null,
  fecha: string | null = dolar === null ? null : hoyEnElTaller(),
): Promise<void> {
  await escribirAjustes(sesion, { dolar_del_dia_centavos: dolar, dolar_del_dia_el: fecha });
}

export interface ContactoDePrueba {
  id: string;
  clienteId: string;
  titulo: string;
}

export async function contactoPorRpc(
  sesion: SesionDePrueba,
  datos: {
    titulo: string;
    estado?: string;
    sena?: number;
    gasto?: number;
    visita?: string | null;
    telefono?: string;
    moneda?: MonedaDePrueba;
  },
): Promise<ContactoDePrueba> {
  const { titulo, estado = 'contacto', sena = 0, gasto = 0, visita = null, telefono = '' } = datos;
  const clienteId = await crearCliente(sesion, `Cliente de ${titulo}`, { telefono });
  const id = crypto.randomUUID();
  const hoy = hoyEnElTaller();

  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo,
      estado,
      presupuesto_centavos: null,
      comprobante: 'sin_comprobante',
      fecha_visita: visita,
      ...(datos.moneda === undefined ? {} : { moneda: datos.moneda }),
    },
    pagos:
      sena === 0
        ? []
        : [
            {
              id: crypto.randomUUID(),
              fecha: hoy,
              concepto: 'Seña de la visita',
              monto_centavos: sena,
            },
          ],
    gastos:
      gasto === 0
        ? []
        : [
            {
              id: crypto.randomUUID(),
              fecha: hoy,
              descripcion: 'Nafta de la visita',
              monto_centavos: gasto,
            },
          ],
  });
  return { id, clienteId, titulo };
}

export interface DistribucionCongelada {
  estado: string;
  version: number;
  fecha_cobro: string | null;
  dist_cobrado_centavos: number | null;
  dist_gastos_centavos: number | null;
  dist_diezmo_centavos: number | null;
  dist_sueldo_centavos: number | null;
  dist_fijos_centavos: number | null;
  dist_remanente_centavos: number | null;
  dist_tope_fijos_centavos: number | null;
  dist_fijos_previo_centavos: number | null;
  dist_sueldo_previo_centavos: number | null;
  reparto_ya_en_la_apertura: boolean;
}

export async function distribucionDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<DistribucionCongelada | undefined> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/proyectos?select=estado,version,fecha_cobro,dist_cobrado_centavos,dist_gastos_centavos,dist_diezmo_centavos,dist_sueldo_centavos,dist_fijos_centavos,dist_remanente_centavos,dist_tope_fijos_centavos,dist_fijos_previo_centavos,dist_sueldo_previo_centavos,reparto_ya_en_la_apertura&id=eq.${proyectoId}`,
    { accessToken },
  )) as DistribucionCongelada[];
  return filas[0];
}

export async function cobrarPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  argumentos: Record<string, unknown>,
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/cobrar_proyecto', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(argumentos),
  });
}

export async function ajustarTaller(
  { entorno, accessToken }: SesionDePrueba,
  cambios: Record<string, number>,
): Promise<void> {
  await pedir(entorno, '/rest/v1/ajustes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(cambios),
  });
}

const COLUMNAS_DE_LOS_AJUSTES = [
  'sueldo_mensual_centavos',
  'costos_fijos_centavos',
  'meta_cocos_centavos',
  'tasa_cocos_anual_bp',
  'sena_bp',
  'cobro_alias',
  'cobro_cbu',
  'cobro_titular',
  'cobro_cuit',
  'cobro_link',
  'resena_link',
  'presupuesto_vale_dias',
  'relevamiento_centavos',
  'instagram_link',
  'facebook_link',
  'tiktok_link',
  'idioma_de_los_clientes',
  'dolar_del_dia_centavos',
  'dolar_del_dia_el',
  'cobro_dolares_cbu',
  'cobro_dolares_alias',
] as const;

export type AjustesDePrueba = Record<
  (typeof COLUMNAS_DE_LOS_AJUSTES)[number],
  number | string | null
>;

export async function leerAjustes({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<AjustesDePrueba> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/ajustes?select=${COLUMNAS_DE_LOS_AJUSTES.join(',')}&deleted_at=is.null`,
    { accessToken },
  )) as AjustesDePrueba[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el taller de prueba no tiene ajustes');
  return fila;
}

export async function escribirAjustes(
  { entorno, accessToken }: SesionDePrueba,
  ajustes: Partial<AjustesDePrueba>,
): Promise<void> {
  await pedir(entorno, '/rest/v1/ajustes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(ajustes),
  });
}

export async function clientesPorRest(
  { entorno, accessToken }: SesionDePrueba,
  filas: readonly Record<string, unknown>[],
): Promise<string[]> {
  const creadas = (await pedir(entorno, '/rest/v1/clientes', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(filas),
  })) as { id: string }[];
  return creadas.map((fila) => fila.id);
}

export async function movimientosPorRest(
  { entorno, accessToken }: SesionDePrueba,
  filas: readonly Record<string, unknown>[],
): Promise<void> {
  await pedir(entorno, '/rest/v1/movimientos', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(filas),
  });
}

export async function anotacionesPorRest(
  { entorno, accessToken }: SesionDePrueba,
  filas: readonly Record<string, unknown>[],
): Promise<void> {
  await pedir(entorno, '/rest/v1/anotaciones', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(filas),
  });
}

export async function formasDeCobroPorRest(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
  formas: { sena?: readonly string[] | null; saldo?: readonly string[] | null },
): Promise<void> {
  await pedir(entorno, `/rest/v1/proyectos?id=eq.${proyectoId}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      ...(formas.sena === undefined ? {} : { cobro_sena: formas.sena }),
      ...(formas.saldo === undefined ? {} : { cobro_saldo: formas.saldo }),
    }),
  });
}

export interface CobroDelTallerDePrueba {
  alias: string;
  cbu: string;
  titular: string;
  cuit: string;
  link?: string;
}

export async function ajustarCobroDelTaller(
  { entorno, accessToken }: SesionDePrueba,
  cobro: CobroDelTallerDePrueba,
): Promise<void> {
  await pedir(entorno, '/rest/v1/ajustes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      cobro_alias: cobro.alias,
      cobro_cbu: cobro.cbu,
      cobro_titular: cobro.titular,
      cobro_cuit: cobro.cuit,
      cobro_link: cobro.link ?? '',
    }),
  });
}

export async function guardarProyectoPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  pedido: {
    proyecto: Record<string, unknown>;
    pagos: unknown[];
    gastos: unknown[];
    opciones?: unknown[];
    necesidades?: unknown[];
    proximos?: unknown[];
  },
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/guardar_proyecto', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      p_proyecto: pedido.proyecto,
      p_pagos: pedido.pagos,
      p_gastos: pedido.gastos,
      p_opciones: pedido.opciones ?? null,
      p_necesidades: pedido.necesidades ?? null,
      p_proximos: pedido.proximos ?? null,
    }),
  });
}

export interface FilaDeProximoContacto {
  id: string;
  fecha: string;
  nota: string;
  etapa_previa: string;
  hecho_el: string | null;
  resultado: string | null;
  respuesta: string;
  importante: boolean;
}

export async function proximosContactosDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeProximoContacto[]> {
  return (await pedir(
    entorno,
    `/rest/v1/proximos_contactos?select=id,fecha,nota,etapa_previa,hecho_el,resultado,respuesta,importante&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as FilaDeProximoContacto[];
}

export async function seguimientoPorRpc(
  sesion: SesionDePrueba,
  datos: { titulo: string; fecha: string; nota?: string; telefono?: string },
): Promise<ContactoDePrueba> {
  const contacto = await contactoPorRpc(sesion, {
    titulo: datos.titulo,
    estado: 'presupuesto_enviado',
    telefono: datos.telefono,
  });
  const fila = await leerProyecto(sesion, datos.titulo);
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id: contacto.id,
      version: fila?.version ?? 1,
      cliente_id: contacto.clienteId,
      titulo: datos.titulo,
      estado: 'en_seguimiento',
      presupuesto_centavos: null,
      comprobante: 'sin_comprobante',
    },
    pagos: [],
    gastos: [],
    proximos: [
      {
        id: crypto.randomUUID(),
        fecha: datos.fecha,
        nota: datos.nota ?? '',
        etapa_previa: 'presupuesto_enviado',
      },
    ],
  });
  return contacto;
}

export interface FilaDeNecesidad {
  id: string;
  tipo: string;
  nombre: string;
  cantidad: number | null;
  listo: boolean;
}

export async function necesidadesDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeNecesidad[]> {
  return (await pedir(
    entorno,
    `/rest/v1/necesidades?select=id,tipo,nombre,cantidad,listo&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as FilaDeNecesidad[];
}

export interface FilaDeOpcion {
  id: string;
  descripcion: string;
  monto_centavos: number;
  aprobada: boolean;
}

export async function opcionesDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeOpcion[]> {
  return (await pedir(
    entorno,
    `/rest/v1/opciones_de_presupuesto?select=id,descripcion,monto_centavos,aprobada&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=monto_centavos`,
    { accessToken },
  )) as FilaDeOpcion[];
}

export interface FilaDelPresupuestoDePrueba {
  id: string;
  numero: string | null;
  borrador_version: number;
  aceptado_el: string | null;
}

export async function presupuestoDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDelPresupuestoDePrueba | undefined> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/presupuestos?select=id,numero,borrador_version,aceptado_el&deleted_at=is.null&proyecto_id=eq.${proyectoId}`,
    { accessToken },
  )) as FilaDelPresupuestoDePrueba[];
  return filas[0];
}

export interface FilaDeRevisionDePrueba {
  revision: number;
  numero: string;
  mandado_el: string;
  vale_hasta: string | null;
  que_cambio: string | null;
}

export async function revisionesDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeRevisionDePrueba[]> {
  return (await pedir(
    entorno,
    `/rest/v1/revisiones_del_presupuesto?select=revision,numero,mandado_el,vale_hasta,que_cambio&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=revision`,
    { accessToken },
  )) as FilaDeRevisionDePrueba[];
}

export interface PresupuestoDelTallerDePrueba {
  taller_titular: string;
  taller_cuit: string;
  taller_domicilio: string;
  plantilla_del_presupuesto: { avisos: { texto: string; tildadaPorDefecto: boolean }[] } | null;
  plantilla_del_presupuesto_version: number;
}

export async function presupuestoDelTallerDe({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<PresupuestoDelTallerDePrueba> {
  const filas = (await pedir(
    entorno,
    '/rest/v1/ajustes?select=taller_titular,taller_cuit,taller_domicilio,plantilla_del_presupuesto,plantilla_del_presupuesto_version&deleted_at=is.null',
    { accessToken },
  )) as PresupuestoDelTallerDePrueba[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el taller de prueba no tiene ajustes');
  return fila;
}

export async function restablecerElPresupuestoDelTaller(sesion: SesionDePrueba): Promise<void> {
  const { entorno, accessToken } = sesion;
  const actual = await presupuestoDelTallerDe(sesion);
  if (actual.plantilla_del_presupuesto !== null) {
    await pedir(entorno, '/rest/v1/rpc/guardar_la_plantilla_del_presupuesto', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        p_version: actual.plantilla_del_presupuesto_version,
        p_plantilla: null,
      }),
    });
  }
  await pedir(entorno, '/rest/v1/ajustes?deleted_at=is.null', {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      taller_titular: '',
      taller_cuit: '',
      taller_condicion_fiscal: null,
      taller_domicilio: '',
      taller_telefono: '',
      taller_email: '',
    }),
  });
}

export interface PreferenciasDeAvisosDePrueba {
  zona: string;
  hora: string;
  avisos: Record<string, { activo: boolean; anticipacion: number }>;
}

export interface EstadoDeLosAvisosDePrueba {
  suscripto: boolean;
  dispositivos: number;
  preferencias: PreferenciasDeAvisosDePrueba | null;
}

export async function estadoDeLosAvisosPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  endpoint: string | null,
): Promise<EstadoDeLosAvisosDePrueba> {
  return (await pedir(entorno, '/rest/v1/rpc/estado_de_mis_avisos', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(endpoint === null ? {} : { p_endpoint: endpoint }),
  })) as EstadoDeLosAvisosDePrueba;
}

export async function darDeBajaAvisosPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  endpoint: string,
): Promise<void> {
  await pedir(entorno, '/rest/v1/rpc/dar_de_baja_suscripcion', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ p_endpoint: endpoint }),
  });
}

export async function guardarPreferenciasDeAvisosPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  preferencias: PreferenciasDeAvisosDePrueba,
): Promise<void> {
  await pedir(entorno, '/rest/v1/rpc/guardar_preferencias_de_avisos', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      p_zona: preferencias.zona,
      p_hora: preferencias.hora,
      p_avisos: preferencias.avisos,
    }),
  });
}

export interface FilaDeEnlace {
  id: string;
  proyecto_id: string;
  token_hash: string;
  token: string | null;
  revocado_at: string | null;
  visitas: number;
}

export function hashDeToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function enlacePorRest(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
  token: string,
  { conLaDireccion = true } = {},
): Promise<FilaDeEnlace> {
  const filas = (await pedir(entorno, '/rest/v1/enlaces_publicos', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      proyecto_id: proyectoId,
      token_hash: hashDeToken(token),
      ...(conLaDireccion ? { token } : {}),
    }),
  })) as FilaDeEnlace[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta del enlace no devolvió la fila');
  return fila;
}

export async function enlacesDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeEnlace[]> {
  return (await pedir(
    entorno,
    `/rest/v1/enlaces_publicos?select=id,proyecto_id,token_hash,token,revocado_at,visitas&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as FilaDeEnlace[];
}

export async function revocarEnlacePorRest(
  { entorno, accessToken }: SesionDePrueba,
  id: string,
): Promise<void> {
  await pedir(entorno, `/rest/v1/enlaces_publicos?id=eq.${id}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ revocado_at: new Date().toISOString() }),
  });
}

export async function archivoPorRest(
  { entorno, accessToken }: SesionDePrueba,
  datos: { proyectoId: string; nombre: string; tipo?: string; visible?: boolean },
): Promise<FilaDeArchivo> {
  const { proyectoId, nombre, tipo = 'application/pdf', visible = false } = datos;
  const filas = (await pedir(entorno, '/rest/v1/archivos', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      proyecto_id: proyectoId,
      nombre,
      tipo,
      bytes: 1_000,
      ancho: tipo === 'application/pdf' ? null : 800,
      alto: tipo === 'application/pdf' ? null : 600,
    }),
  })) as FilaDeArchivo[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta del archivo no devolvió la fila');
  if (visible) {
    await pedir(entorno, `/rest/v1/archivos?id=eq.${fila.id}`, {
      method: 'PATCH',
      accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ visible_para_cliente: true }),
    });
  }
  return fila;
}

export async function visibilidadDelArchivo(
  { entorno, accessToken }: SesionDePrueba,
  id: string,
): Promise<boolean | undefined> {
  const filas = (await pedir(entorno, `/rest/v1/archivos?select=visible_para_cliente&id=eq.${id}`, {
    accessToken,
  })) as { visible_para_cliente: boolean }[];
  return filas[0]?.visible_para_cliente;
}

export interface FilaDeEncuestaEnviada {
  id: string;
  proyecto_id: string;
  token: string;
  revocada_at: string | null;
  recordada_at: string | null;
}

export async function encuestaPorRest(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
  token: string,
): Promise<FilaDeEncuestaEnviada> {
  const filas = (await pedir(entorno, '/rest/v1/encuestas_enviadas', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      proyecto_id: proyectoId,
      token_hash: hashDeToken(token),
      token,
    }),
  })) as FilaDeEncuestaEnviada[];
  const fila = filas[0];
  if (fila === undefined) throw new Error('el alta de la encuesta no devolvió la fila');
  return fila;
}

export async function encuestasDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<FilaDeEncuestaEnviada[]> {
  return (await pedir(
    entorno,
    `/rest/v1/encuestas_enviadas?select=id,proyecto_id,token,revocada_at,recordada_at&deleted_at=is.null&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as FilaDeEncuestaEnviada[];
}

export async function revocarEncuestaPorRest(
  { entorno, accessToken }: SesionDePrueba,
  id: string,
): Promise<void> {
  await pedir(entorno, `/rest/v1/encuestas_enviadas?id=eq.${id}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ revocada_at: new Date().toISOString() }),
  });
}

export async function contestarComoCliente(
  { entorno }: SesionDePrueba,
  token: string,
  respuesta: unknown,
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/contestar_encuesta', {
    method: 'POST',
    body: JSON.stringify({ p_token: token, p_respuesta: respuesta }),
  });
}

export async function encuestaComoCliente(
  { entorno }: SesionDePrueba,
  token: string,
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/encuesta_compartida', {
    method: 'POST',
    body: JSON.stringify({ p_token: token }),
  });
}

export async function preguntasConTexto(
  { entorno, accessToken }: SesionDePrueba,
  texto: string,
): Promise<{ id: string }[]> {
  return (await pedir(
    entorno,
    `/rest/v1/preguntas?select=id&deleted_at=is.null&texto=eq.${encodeURIComponent(texto)}`,
    { accessToken },
  )) as { id: string }[];
}

export async function borrarPreguntasConTexto(
  { entorno, accessToken }: SesionDePrueba,
  texto: string,
): Promise<void> {
  await pedir(
    entorno,
    `/rest/v1/preguntas?deleted_at=is.null&texto=eq.${encodeURIComponent(texto)}`,
    {
      method: 'PATCH',
      accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    },
  );
}

const ORDEN_DE_FABRICA: readonly (readonly [string, number])[] = [
  ['¿Qué tan conforme quedaste con el mueble?', 10],
  ['¿Y con los tiempos de entrega?', 20],
  ['¿Cómo fue hablar con el taller mientras duró el trabajo?', 30],
  ['¿Se lo recomendarías a alguien?', 40],
  ['¿Qué podríamos hacer mejor?', 50],
];

export async function ordenarLaEncuestaBase({
  entorno,
  accessToken,
}: SesionDePrueba): Promise<void> {
  const vivas = (await pedir(
    entorno,
    '/rest/v1/preguntas?select=id,texto,orden&proyecto_id=is.null&deleted_at=is.null&archivada_at=is.null',
    { accessToken },
  )) as { id: string; texto: string; orden: number }[];
  for (const [texto, orden] of ORDEN_DE_FABRICA) {
    for (const fila of vivas.filter((viva) => viva.texto === texto && viva.orden !== orden)) {
      await pedir(entorno, `/rest/v1/preguntas?id=eq.${fila.id}`, {
        method: 'PATCH',
        accessToken,
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ orden }),
      });
    }
  }
}

export async function borrarProyectoPorRest(
  { entorno, accessToken }: SesionDePrueba,
  id: string,
): Promise<void> {
  await pedir(entorno, `/rest/v1/proyectos?id=eq.${id}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
}

export function diaDesdeHoy(dias: number): string {
  const fecha = new Date(`${hoyEnElTaller()}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export function diaHabilDesdeHoy(dias: number): string {
  for (let extra = dias; ; extra += 1) {
    const fecha = diaDesdeHoy(extra);
    if (new Date(`${fecha}T12:00:00Z`).getUTCDay() !== 0) return fecha;
  }
}

export interface EntregaLeida {
  id: string;
  estado: string;
  version: number;
  listo_el: string | null;
  entrega_estimada: string | null;
  entrega_comprometida: string | null;
  entrega_comprometida_franja: string | null;
  fecha_entrega: string | null;
}

export async function entregaDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<EntregaLeida | undefined> {
  const filas = (await pedir(
    entorno,
    `/rest/v1/proyectos?select=id,estado,version,listo_el,entrega_estimada,entrega_comprometida,entrega_comprometida_franja,fecha_entrega&id=eq.${proyectoId}`,
    { accessToken },
  )) as EntregaLeida[];
  return filas[0];
}

export async function entregaPorRest(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
  cambios: Partial<
    Pick<EntregaLeida, 'listo_el' | 'entrega_comprometida' | 'entrega_comprometida_franja'>
  >,
): Promise<void> {
  await pedir(entorno, `/rest/v1/proyectos?id=eq.${proyectoId}`, {
    method: 'PATCH',
    accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(cambios),
  });
}

export interface PropuestaParaPedir {
  id: string;
  forma: 'un_dia' | 'sus_dias';
  fecha: string | null;
  franja: 'manana' | 'tarde' | null;
}

export async function proponerPorRpc(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
  propuesta: PropuestaParaPedir | null,
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/proponer_la_entrega', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ p_proyecto_id: proyectoId, p_propuesta: propuesta }),
  });
}

export interface PropuestaLeida extends PropuestaParaPedir {
  cerrada_at: string | null;
}

export async function propuestasDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<PropuestaLeida[]> {
  return (await pedir(
    entorno,
    `/rest/v1/propuestas_de_entrega?select=id,forma,fecha,franja,cerrada_at&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as PropuestaLeida[];
}

export interface RespuestaDeEntregaLeida {
  id: string;
  propuesta_id: string;
  respuesta: string;
  dias: { fecha: string; franjas: string[] }[];
  nota: string;
  leida_at: string | null;
}

export async function respuestasDeEntregaDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<RespuestaDeEntregaLeida[]> {
  return (await pedir(
    entorno,
    `/rest/v1/respuestas_de_entrega?select=id,propuesta_id,respuesta,dias,nota,leida_at&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as RespuestaDeEntregaLeida[];
}

export interface CambioDeFechaLeido {
  tipo: string;
  fecha: string | null;
  franja: string | null;
  origen: string;
}

export async function cambiosDeFechaDe(
  { entorno, accessToken }: SesionDePrueba,
  proyectoId: string,
): Promise<CambioDeFechaLeido[]> {
  return (await pedir(
    entorno,
    `/rest/v1/cambios_de_fecha?select=tipo,fecha,franja,origen&proyecto_id=eq.${proyectoId}&order=created_at`,
    { accessToken },
  )) as CambioDeFechaLeido[];
}

export async function responderComoCliente(
  { entorno }: SesionDePrueba,
  token: string,
  respuesta: unknown,
): Promise<unknown> {
  return pedir(entorno, '/rest/v1/rpc/responder_la_entrega', {
    method: 'POST',
    body: JSON.stringify({ p_token: token, p_respuesta: respuesta }),
  });
}

export interface TrabajoListo {
  id: string;
  token: string;
  titulo: string;
  cliente: string;
}

export async function trabajoListoConEnlace(
  sesion: SesionDePrueba,
  { titulo, cliente, listo = true }: { titulo: string; cliente: string; listo?: boolean },
): Promise<TrabajoListo> {
  const clienteId = await crearCliente(sesion, cliente, { direccion: 'Olazábal 1240, Ituzaingó' });
  const id = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo,
      estado: 'en_curso',
      presupuesto_centavos: 150_000_000,
      comprobante: 'sin_comprobante',
      direccion_entrega: 'Olazábal 1240, Ituzaingó',
      fecha_inicio: diaDesdeHoy(-20),
      entrega_estimada: diaDesdeHoy(10),
      tipo_de_proyecto: 'Placard',
    },
    pagos: [
      {
        id: crypto.randomUUID(),
        fecha: diaDesdeHoy(-20),
        concepto: 'Seña',
        monto_centavos: 75_000_000,
      },
    ],
    gastos: [],
  });
  if (listo) await entregaPorRest(sesion, id, { listo_el: diaDesdeHoy(-1) });
  const token = `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
  await enlacePorRest(sesion, id, token);
  return { id, token, titulo, cliente };
}

const DESVIOS_SEMBRADOS = [0, 2, 5, -1, 8, 3, 1, -4, 10, 0, 2, 6] as const;

const TIPOS_SEMBRADOS = ['Placard', 'Cocina', 'Placard', 'Vestidor', 'Placard', null] as const;

export async function sembrarEntregas(
  sesion: SesionDePrueba,
  desde: number,
  hasta: number,
): Promise<void> {
  const cliente = await crearCliente(sesion, `Cliente del analítico ${String(desde)}`);
  for (let indice = desde; indice < hasta; indice += 1) {
    const id = crypto.randomUUID();
    const estimada = diaDesdeHoy(-40 + indice);
    const desvio = DESVIOS_SEMBRADOS[indice % DESVIOS_SEMBRADOS.length] ?? 0;
    const base = {
      id,
      cliente_id: cliente,
      titulo: `Entrega ${String(indice + 1)}`,
      presupuesto_centavos: 50_000_000,
      comprobante: 'sin_comprobante',
      fecha_inicio: diaDesdeHoy(-70 + indice),
      entrega_estimada: estimada,
      tipo_de_proyecto: TIPOS_SEMBRADOS[indice % TIPOS_SEMBRADOS.length] ?? null,
    };
    const creado = (await guardarProyectoPorRpc(sesion, {
      proyecto: { ...base, version: null, estado: 'en_curso' },
      pagos: [],
      gastos: [],
    })) as { proyecto: { version: number } };
    await guardarProyectoPorRpc(sesion, {
      proyecto: {
        ...base,
        version: creado.proyecto.version,
        estado: 'entregado',
        fecha_entrega: diaDesdeHoy(-40 + indice + desvio),
      },
      pagos: [],
      gastos: [],
    });
  }
}
