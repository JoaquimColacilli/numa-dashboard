import { sumarDias, type Tesoro } from '@maun/domain';

import { TESOROS_EN_ORDEN } from './tesoros';

export function rutaDelProyecto(id: string): string {
  return `/proyectos/${id}`;
}

export function rutaDelCliente(id: string): string {
  return `/clientes/${id}`;
}

export function rutaDeEdicion(id: string): string {
  return `/proyectos/${id}/editar`;
}

export function rutaDeCobro(id: string): string {
  return `/proyectos/${id}/cobrar`;
}

export function rutaDeCierre(id: string): string {
  return `/proyectos/${id}/cerrar`;
}

export function rutaDeAprobacion(id: string): string {
  return `/proyectos/${id}/aprobar`;
}

export const RUTA_DE_PROYECTO_NUEVO = '/proyectos/nuevo';

export const PARAMETRO_DE_ENTREGA = 'entrega';

export function rutaDeProyectoNuevo(entrega?: string): string {
  return entrega === undefined
    ? RUTA_DE_PROYECTO_NUEVO
    : `${RUTA_DE_PROYECTO_NUEVO}?${new URLSearchParams({ [PARAMETRO_DE_ENTREGA]: entrega }).toString()}`;
}

export const RUTA_DE_PROYECTOS = '/proyectos';

export const RUTA_DE_CONSULTAS = '/consultas';
export const RUTA_DE_SEGUIMIENTO = '/proyectos?etapa=seguimiento';
export const RUTA_DEL_HISTORIAL = '/proyectos?etapa=historial';
export const RUTA_DEL_ANALITICO = '/proyectos/analitico';

export const RUTA_DE_CONTACTO_NUEVO = '/consultas/nueva';

export const PARAMETRO_DE_VISITA = 'visita';

export function rutaDeContactoNuevo(visita?: string): string {
  return visita === undefined
    ? RUTA_DE_CONTACTO_NUEVO
    : `${RUTA_DE_CONTACTO_NUEVO}?${new URLSearchParams({ [PARAMETRO_DE_VISITA]: visita }).toString()}`;
}

export function fechaDelEnlace(valor: string | null): string | undefined {
  if (valor === null || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
  try {
    return sumarDias(valor, 0) === valor ? valor : undefined;
  } catch {
    return undefined;
  }
}

export const RUTA_DE_FINANZAS = '/finanzas';

export const PARAMETRO_DE_TESORO = 'tesoro';

const FORMA_DE_UN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function esTesoro(valor: string): valor is Tesoro {
  return (TESOROS_EN_ORDEN as readonly string[]).includes(valor);
}

export function tesoroDelParametro(valor: string | null): string {
  if (valor === null) return 'todos';
  return esTesoro(valor) || FORMA_DE_UN_ID.test(valor) ? valor : 'todos';
}

export type TesoroDeLaRuta = Tesoro | { id: string; clave: Tesoro | null };

export function parametroDelTesoro(tesoro: TesoroDeLaRuta): string {
  return typeof tesoro === 'string' ? tesoro : (tesoro.clave ?? tesoro.id);
}

export function rutaDeFinanzasDelTesoro(tesoro: TesoroDeLaRuta): string {
  return `${RUTA_DE_FINANZAS}?${new URLSearchParams({ [PARAMETRO_DE_TESORO]: parametroDelTesoro(tesoro) }).toString()}`;
}

export const RUTA_DE_MOVIMIENTO_NUEVO = '/finanzas/nuevo';

export interface MovimientoPropuesto {
  clase?: string;
  tesoro?: string;
  hacia?: string;
  monto?: number;
  categoria?: string;
  fecha?: string;
}

const LARGO_MAXIMO_DE_LA_CATEGORIA = 80;

export function rutaDeMovimientoNuevo(opciones: MovimientoPropuesto = {}): string {
  const parametros = new URLSearchParams();
  if (opciones.clase !== undefined) parametros.set('clase', opciones.clase);
  if (opciones.tesoro !== undefined) parametros.set('tesoro', opciones.tesoro);
  if (opciones.hacia !== undefined) parametros.set('hacia', opciones.hacia);
  if (opciones.monto !== undefined) parametros.set('monto', String(opciones.monto));
  if (opciones.categoria !== undefined) parametros.set('categoria', opciones.categoria);
  if (opciones.fecha !== undefined) parametros.set('fecha', opciones.fecha);
  const texto = parametros.toString();
  return texto === '' ? RUTA_DE_MOVIMIENTO_NUEVO : `${RUTA_DE_MOVIMIENTO_NUEVO}?${texto}`;
}

function idDelParametro(valor: string | null): string | null {
  return valor === null || !FORMA_DE_UN_ID.test(valor) ? null : valor;
}

export function movimientoPropuesto(parametros: URLSearchParams): MovimientoPropuesto {
  const clase = parametros.get('clase');
  const tesoro = idDelParametro(parametros.get('tesoro'));
  const hacia = idDelParametro(parametros.get('hacia'));
  const monto = Number(parametros.get('monto') ?? '');
  const categoria = parametros.get('categoria')?.trim() ?? '';
  const fecha = fechaDelEnlace(parametros.get('fecha'));
  return {
    ...(clase === null ? {} : { clase }),
    ...(tesoro === null ? {} : { tesoro }),
    ...(hacia === null ? {} : { hacia }),
    ...(Number.isSafeInteger(monto) && monto > 0 ? { monto } : {}),
    ...(categoria === '' || categoria.length > LARGO_MAXIMO_DE_LA_CATEGORIA ? {} : { categoria }),
    ...(fecha === undefined ? {} : { fecha }),
  };
}

export function rutaDelMovimiento(id: string): string {
  return `/finanzas/${id}`;
}

export const RUTA_DE_DIEZMO = '/diezmo';

export const RUTA_DE_TESOROS = '/tesoros';

export const RUTA_DE_AJUSTES = '/ajustes';

export const RUTA_DE_AVISOS = '/ajustes/avisos';

export const RUTA_DEL_PRESUPUESTO_EN_AJUSTES = '/ajustes/presupuesto';

export const RUTA_DE_AGENDA = '/agenda';

export const RUTA_DE_ANOTAR = '/agenda/anotar';

export function rutaDeAnotar(fecha?: string): string {
  return fecha === undefined
    ? RUTA_DE_ANOTAR
    : `${RUTA_DE_ANOTAR}?${new URLSearchParams({ fecha }).toString()}`;
}

export function rutaDeCompartir(id: string): string {
  return `/proyectos/${id}/compartir`;
}

export function rutaDelPresupuesto(id: string): string {
  return `/proyectos/${id}/presupuesto`;
}

export function rutaDeLaVistaDelCliente(id: string): string {
  return `/proyectos/${id}/vista-cliente`;
}

export const RUTA_DE_OPINIONES = '/opiniones';

export const RUTA_DE_PREGUNTAS = '/opiniones/preguntas';

export const PARAMETRO_DE_RESPUESTA = 'respuesta';

export function rutaDeLaRespuesta(id: string): string {
  return `${RUTA_DE_OPINIONES}?${new URLSearchParams({ [PARAMETRO_DE_RESPUESTA]: id }).toString()}`;
}

export function rutaDeLaPregunta(id: string): string {
  return `${RUTA_DE_OPINIONES}#pregunta-${id}`;
}

export const PREFIJO_DE_LA_VISTA_PUBLICA = '/v/';

export const RUTA_DE_LA_VISTA_PUBLICA = `${PREFIJO_DE_LA_VISTA_PUBLICA}:token`;

export function esLaVistaPublica(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_DE_LA_VISTA_PUBLICA);
}

export const PREFIJO_DE_LA_ENCUESTA_PUBLICA = '/o/';

export const RUTA_DE_LA_ENCUESTA_PUBLICA = `${PREFIJO_DE_LA_ENCUESTA_PUBLICA}:token`;

export function esLaEncuestaPublica(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_DE_LA_ENCUESTA_PUBLICA);
}

export function esUnaPaginaPublica(ruta: string): boolean {
  return esLaVistaPublica(ruta) || esLaEncuestaPublica(ruta);
}
