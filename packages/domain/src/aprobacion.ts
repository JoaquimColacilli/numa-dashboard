import { largoDelTexto, sinBlancosEnLasPuntas, tieneTexto } from './encuesta.ts';
import type { EstadoProyecto } from './estados.ts';
import { diasEntre, esFechaQueExiste, sumarDias } from './fechas.ts';
import type { DocumentoDelPresupuesto } from './presupuesto.ts';
import { vencioElPresupuesto } from './vigencia.ts';

export const FRANJAS_DE_LA_VISITA = ['manana', 'tarde', 'me_da_igual'] as const;

export type FranjaDeLaVisita = (typeof FRANJAS_DE_LA_VISITA)[number];

export const DESDE_CUANTOS_DIAS_PARA_MEDIR = 2;

export const HASTA_CUANTOS_DIAS_PARA_MEDIR = 60;

export const LARGO_MAXIMO_DE_LA_NOTA_DE_LA_VISITA = 300;

export const HORA_DE_LA_VISITA: Readonly<Record<FranjaDeLaVisita, string | null>> = {
  manana: '10:00',
  tarde: '15:00',
  me_da_igual: null,
};

export const MOTIVOS_DE_LA_APROBACION = [
  'forma',
  'opcion',
  'dia',
  'fuera',
  'franja',
  'largo',
  'revision',
  'respondida',
] as const;

export type MotivoDeLaAprobacion = (typeof MOTIVOS_DE_LA_APROBACION)[number];

export type MotivoDeLaValidacionDeLaAprobacion = Exclude<
  MotivoDeLaAprobacion,
  'revision' | 'respondida'
>;

export interface AprobacionParaMandar {
  id: string;
  revision_id: string;
  opcion_id: string | null;
  dia: string | null;
  franja: FranjaDeLaVisita | null;
  nota: string;
}

export interface VisitaPropuesta {
  dia: string;
  franja: FranjaDeLaVisita;
}

export interface RespuestaAlPresupuesto {
  id: string;
  revisionId: string;
  opcionId: string | null;
  dia: string | null;
  franja: FranjaDeLaVisita | null;
  nota: string;
  respondidaEl: string;
  atendidaEn: string | null;
}

export interface DiasParaMedir {
  desde: string;
  hasta: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DIA = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const CLAVES_DE_LA_APROBACION = [
  'dia',
  'franja',
  'id',
  'nota',
  'opcion_id',
  'revision_id',
] as const;

const ANTES_DE_APROBAR_NO: readonly EstadoProyecto[] = [
  'en_curso',
  'entregado',
  'cobrado',
  'perdido',
];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function tieneJusto(objeto: Record<string, unknown>, claves: readonly string[]): boolean {
  const suyas = Object.keys(objeto).sort();
  return suyas.length === claves.length && suyas.every((clave, indice) => clave === claves[indice]);
}

function esUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID.test(valor);
}

export function esFranjaDeLaVisita(valor: unknown): valor is FranjaDeLaVisita {
  return FRANJAS_DE_LA_VISITA.some((franja) => franja === valor);
}

export function diasParaMedir(hoy: string): DiasParaMedir {
  return {
    desde: sumarDias(hoy, DESDE_CUANTOS_DIAS_PARA_MEDIR),
    hasta: sumarDias(hoy, HASTA_CUANTOS_DIAS_PARA_MEDIR),
  };
}

export function sePuedeElegirParaMedir(fecha: string, hoy: string): boolean {
  if (!DIA.test(fecha) || !esFechaQueExiste(fecha)) return false;
  const distancia = diasEntre(hoy, fecha);
  return distancia >= DESDE_CUANTOS_DIAS_PARA_MEDIR && distancia <= HASTA_CUANTOS_DIAS_PARA_MEDIR;
}

export function esperaRespuesta(
  estado: EstadoProyecto,
  valeHasta: string | null,
  hoy: string,
): boolean {
  return !ANTES_DE_APROBAR_NO.includes(estado) && !vencioElPresupuesto(valeHasta, hoy);
}

export function armarAprobacion(
  id: string,
  revisionId: string,
  opcionId: string | null,
  visita: VisitaPropuesta | null,
  nota: string,
): AprobacionParaMandar {
  return {
    id,
    revision_id: revisionId,
    opcion_id: opcionId,
    dia: visita?.dia ?? null,
    franja: visita?.franja ?? null,
    nota: visita === null ? '' : sinBlancosEnLasPuntas(nota),
  };
}

function opcionesDe(documento: Pick<DocumentoDelPresupuesto, 'valores'>): readonly string[] | null {
  const { valores } = documento;
  if (valores === null) return [];
  return valores.tipo === 'opciones' ? valores.opciones.map((opcion) => opcion.id) : null;
}

export function validarAprobacion(
  aprobacion: unknown,
  documento: Pick<DocumentoDelPresupuesto, 'valores' | 'pideFecha'>,
  hoy: string,
): MotivoDeLaValidacionDeLaAprobacion | null {
  if (!esObjeto(aprobacion) || !tieneJusto(aprobacion, CLAVES_DE_LA_APROBACION)) return 'forma';
  const { opcion_id: opcion, dia, franja, nota } = aprobacion;
  if (!esUuid(aprobacion.id) || !esUuid(aprobacion.revision_id)) return 'forma';
  if (!(opcion === null || typeof opcion === 'string')) return 'forma';
  if (
    !(dia === null || typeof dia === 'string') ||
    !(franja === null || typeof franja === 'string')
  ) {
    return 'forma';
  }
  if (typeof nota !== 'string') return 'forma';

  const opciones = opcionesDe(documento);
  if (opciones === null ? opcion !== null : opcion === null || !opciones.includes(opcion)) {
    return 'opcion';
  }

  if (!documento.pideFecha) {
    return dia === null && franja === null && !tieneTexto(nota) ? null : 'dia';
  }
  if (dia === null) return 'dia';
  if (!sePuedeElegirParaMedir(dia, hoy)) return 'fuera';
  if (!esFranjaDeLaVisita(franja)) return 'franja';
  return largoDelTexto(sinBlancosEnLasPuntas(nota)) > LARGO_MAXIMO_DE_LA_NOTA_DE_LA_VISITA
    ? 'largo'
    : null;
}

export function horaDeLaVisita(franja: FranjaDeLaVisita | null): string | null {
  return franja === null ? null : HORA_DE_LA_VISITA[franja];
}

export function letraDeLaRespuesta(
  documento: Pick<DocumentoDelPresupuesto, 'valores'>,
  opcionId: string | null,
): string | null {
  if (opcionId === null || documento.valores?.tipo !== 'opciones') return null;
  return documento.valores.opciones.find((opcion) => opcion.id === opcionId)?.letra ?? null;
}

export function estaPendiente(respuesta: Pick<RespuestaAlPresupuesto, 'atendidaEn'>): boolean {
  return respuesta.atendidaEn === null;
}
