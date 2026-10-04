import { rechazoDeLaBase, SIN_PERMISO, type RechazoDeLaBase } from '@maun/db';
import { LO_QUE_FALTA_PARA_FACTURAR, type LoQueFaltaParaFacturar } from '@maun/domain';

import { mensajes, type Mensajes } from '@/shared/idioma';
import { frasesDeLoQueFaltaParaFacturar } from '@/shared/lib';

export type OperacionRechazada =
  | 'cobro'
  | 'cierre'
  | 'reapertura'
  | 'reactivacion'
  | 'proyecto'
  | 'baja-de-proyecto'
  | 'baja-de-cliente'
  | 'fila'
  | 'tesoro'
  | 'presupuesto'
  | 'plantilla'
  | 'factura'
  | 'nota-de-credito'
  | 'guardado';

export interface ContextoDelRechazo {
  operacion: OperacionRechazada;
  sujeto?: string;
  estado?: 'cobrado' | 'perdido';
}

export interface RechazoTraducido {
  titulo: string;
  queHacer: string;
  codigo: string;
}

type TextosDeLosRechazos = Mensajes['api']['rechazos'];

interface TituloYQueHacer {
  titulo: string;
  queHacer: string;
}

const CONTEXTO_GENERICO: ContextoDelRechazo = { operacion: 'guardado' };

const SIMPLES = [
  'MN004',
  'MN005',
  'MN009',
  'MN013',
  'MN014',
  'MN017',
  'MN018',
  'MN019',
  'MN022',
  'MN023',
  'MN025',
  'MN026',
  'MN027',
  'MN028',
  'MN029',
  'MN030',
  'MN032',
  'MN033',
  'MN034',
  'MN035',
  'MN036',
  'MN037',
  'MN038',
  'MN039',
  'MN040',
] as const satisfies readonly (keyof TextosDeLosRechazos)[];

type CodigoSimple = (typeof SIMPLES)[number];

const MOTIVO_DE_LA_ENTREGA: Readonly<Record<string, 'sinListo' | 'comprometida' | 'fecha'>> = {
  sin_listo: 'sinListo',
  comprometida: 'comprometida',
  fecha: 'fecha',
};

const POR_EL_MENSAJE_DE_LA_BASE: Readonly<
  Record<string, (r: TextosDeLosRechazos) => TituloYQueHacer>
> = {
  'Ese cliente ya contestó': (r) => ({ titulo: r.MN012.encuesta, queHacer: r.siSigueIgual }),
  'Ese cliente ya contestó: sus preguntas quedan como están': (r) => r.MN012.preguntas,
  'La opinión se le pide al cliente cuando el trabajo está entregado': (r) => r.MN015.sinEntregar,
  'La encuesta no tiene preguntas': (r) => r.MN015.sinPreguntas,
};

function esSimple(codigo: string): codigo is CodigoSimple {
  return (SIMPLES as readonly string[]).includes(codigo);
}

function sujetoDe(contexto: ContextoDelRechazo): string | undefined {
  return contexto.sujeto === undefined || contexto.sujeto.trim() === ''
    ? undefined
    : contexto.sujeto;
}

function elTrabajo(contexto: ContextoDelRechazo, r: TextosDeLosRechazos): string {
  const sujeto = sujetoDe(contexto);
  return sujeto === undefined ? r.esteTrabajo : r.trabajo(sujeto);
}

function comoQuedo(contexto: ContextoDelRechazo): 'cobrado' | 'perdido' {
  return contexto.estado === 'perdido' ? 'perdido' : 'cobrado';
}

function esDelCobro(contexto: ContextoDelRechazo): boolean {
  return contexto.operacion === 'cobro' || contexto.operacion === 'cierre';
}

function detalleDe(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const { details } = error as Record<string, unknown>;
  return typeof details === 'string' ? details : '';
}

function yaEstaLiquidado(contexto: ContextoDelRechazo, r: TextosDeLosRechazos): TituloYQueHacer {
  const { MN001 } = r;
  const trabajo = elTrabajo(contexto, r);
  const estado = comoQuedo(contexto);
  if (esDelCobro(contexto)) {
    return { titulo: MN001.cobro[estado](trabajo), queHacer: MN001.cobro.queHacer };
  }
  if (contexto.operacion === 'baja-de-proyecto') {
    return { titulo: MN001.baja[estado](trabajo), queHacer: MN001.baja.queHacer };
  }
  return { titulo: MN001.otro[estado](trabajo), queHacer: MN001.salida[estado] };
}

function cambioDesdeQueLoViste(
  contexto: ContextoDelRechazo,
  r: TextosDeLosRechazos,
): TituloYQueHacer {
  const { MN006 } = r;
  if (esDelCobro(contexto)) return MN006.cobro;
  if (contexto.operacion === 'fila') return MN006.fila;
  const titulo = MN006.cambio(elTrabajo(contexto, r));
  return contexto.operacion === 'reapertura' || contexto.operacion === 'reactivacion'
    ? { titulo, queHacer: MN006.desdeLaFicha }
    : { titulo, queHacer: MN006.desdeOtroLado };
}

function noSePuedeDesdeAca(contexto: ContextoDelRechazo, r: TextosDeLosRechazos): TituloYQueHacer {
  const { MN007 } = r;
  switch (contexto.operacion) {
    case 'cobro':
      return { titulo: MN007.cobro.titulo(elTrabajo(contexto, r)), queHacer: MN007.cobro.queHacer };
    case 'cierre':
      return {
        titulo: MN007.cierre.titulo(elTrabajo(contexto, r)),
        queHacer: MN007.cierre.queHacer,
      };
    case 'reapertura':
      return { titulo: MN007.reapertura(elTrabajo(contexto, r)), queHacer: MN007.verLaFicha };
    case 'reactivacion':
      return { titulo: MN007.reactivacion(elTrabajo(contexto, r)), queHacer: MN007.verLaFicha };
    default:
      return MN007.formulario;
  }
}

function laEntrega(
  error: unknown,
  rechazo: RechazoDeLaBase,
  r: TextosDeLosRechazos,
): TituloYQueHacer {
  const detalle = detalleDe(error);
  const motivo = Object.hasOwn(MOTIVO_DE_LA_ENTREGA, detalle)
    ? MOTIVO_DE_LA_ENTREGA[detalle]
    : undefined;
  if (motivo !== undefined) return r.MN021[motivo];
  return { titulo: `${rechazo.mensaje}.`, queHacer: r.MN021.noSeGuardoNada(rechazo.hint) };
}

function esLoQueFalta(codigo: string): codigo is LoQueFaltaParaFacturar {
  return (LO_QUE_FALTA_PARA_FACTURAR as readonly string[]).includes(codigo);
}

function loQueFaltaParaFacturar(
  rechazo: RechazoDeLaBase,
  contexto: ContextoDelRechazo,
  r: TextosDeLosRechazos,
): TituloYQueHacer {
  const codigos = rechazo.hint
    .split(',')
    .map((codigo) => codigo.trim())
    .filter(esLoQueFalta);
  const [primera] = frasesDeLoQueFaltaParaFacturar(codigos, sujetoDe(contexto) ?? null);
  return { titulo: primera?.texto ?? r.MN041.titulo, queHacer: r.MN041.queHacer };
}

function traduccionDe(
  error: unknown,
  rechazo: RechazoDeLaBase,
  contexto: ContextoDelRechazo,
  r: TextosDeLosRechazos,
): TituloYQueHacer | undefined {
  const { codigo } = rechazo;
  if (codigo === SIN_PERMISO) return r.sinPermiso;
  if (esSimple(codigo)) return r[codigo];
  switch (codigo) {
    case 'MN001':
      return yaEstaLiquidado(contexto, r);
    case 'MN002':
      return { titulo: r.MN002.titulo(elTrabajo(contexto, r)), queHacer: r.MN002.queHacer };
    case 'MN003': {
      const cliente = sujetoDe(contexto);
      return {
        titulo: cliente === undefined ? r.MN003.sinCliente : r.MN003.titulo(cliente),
        queHacer: r.MN003.queHacer,
      };
    }
    case 'MN006':
      return cambioDesdeQueLoViste(contexto, r);
    case 'MN007':
      return noSePuedeDesdeAca(contexto, r);
    case 'MN008':
      return {
        titulo: r.MN008.titulo,
        queHacer: esDelCobro(contexto) ? r.MN008.alCobrar : r.MN008.queHacer,
      };
    case 'MN016':
      return {
        titulo: esDelCobro(contexto) ? r.MN016.delCobro : r.MN016.deUnPago,
        queHacer: r.MN016.queHacer,
      };
    case 'MN021':
      return laEntrega(error, rechazo, r);
    case 'MN024': {
      const tesoro = sujetoDe(contexto);
      return {
        titulo: tesoro === undefined ? r.MN024.sinTesoro : r.MN024.titulo(tesoro),
        queHacer: r.MN024.queHacer,
      };
    }
    case 'MN031':
      return {
        titulo: contexto.operacion === 'plantilla' ? r.MN031.plantilla : r.MN031.presupuesto,
        queHacer: r.MN031.queHacer,
      };
    case 'MN041':
      return loQueFaltaParaFacturar(rechazo, contexto, r);
    case 'MN042':
      return detalleDe(error) === 'nota' ? r.MN042.nota : r.MN042.factura;
    case 'MN043':
      return detalleDe(error) === 'trabajo' ? r.MN043.trabajo : r.MN043.pago;
    case 'MN012':
    case 'MN015':
      return Object.hasOwn(POR_EL_MENSAJE_DE_LA_BASE, rechazo.mensaje)
        ? POR_EL_MENSAJE_DE_LA_BASE[rechazo.mensaje]?.(r)
        : undefined;
    default:
      return undefined;
  }
}

export function traducirRechazo(
  error: unknown,
  contexto: ContextoDelRechazo = CONTEXTO_GENERICO,
): RechazoTraducido | undefined {
  const rechazo = rechazoDeLaBase(error);
  if (!rechazo) return undefined;

  const r = mensajes().api.rechazos;
  const traducido = traduccionDe(error, rechazo, contexto, r);
  if (traducido !== undefined) {
    return { titulo: traducido.titulo, queHacer: traducido.queHacer, codigo: rechazo.codigo };
  }

  return {
    titulo: rechazo.mensaje,
    queHacer: rechazo.hint === '' ? r.siSigueIgual : rechazo.hint,
    codigo: rechazo.codigo,
  };
}
