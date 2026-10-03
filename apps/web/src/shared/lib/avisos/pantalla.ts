import { useSyncExternalStore } from 'react';

import { tablaDeLib, textosDeLib, type TextosDeLib } from '../textos';

export type TonoDelAviso = 'hecho' | 'en-cola' | 'error';

export interface AccionDelAviso {
  etiqueta: string;
  alTocar: () => void;
}

export interface AvisoEnPantalla {
  id: number;
  clave: string;
  tono: TonoDelAviso;
  texto: string;
  detalle: string | null;
  veces: number;
  accion: AccionDelAviso | null;
}

export interface TextosDeAviso {
  hecho: string;
  enCola: string;
  error: string;
}

export interface AvisosDeUnaMutacion extends TextosDeAviso {
  que: QueSeGuarda;
  sujeto: string | null;
  errorEnPantalla: boolean;
  silencioso: boolean;
}

export type MetaDeLosAvisos = Omit<AvisosDeUnaMutacion, keyof TextosDeAviso>;

export const TEXTOS_DE_AVISO: TextosDeLib['avisos'] = tablaDeLib((textos) => textos.avisos);

export type QueSeGuarda = keyof TextosDeLib['avisos'];

export function metaDeAvisos(
  que: QueSeGuarda,
  opciones: { errorEnPantalla?: boolean; sujeto?: string; silencioso?: boolean } = {},
): { avisos: MetaDeLosAvisos } {
  return {
    avisos: {
      que,
      sujeto: opciones.sujeto ?? null,
      errorEnPantalla: opciones.errorEnPantalla ?? false,
      silencioso: opciones.silencioso ?? false,
    },
  };
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor !== '';
}

function esQueSeGuarda(valor: unknown): valor is QueSeGuarda {
  return typeof valor === 'string' && Object.hasOwn(textosDeLib().avisos, valor);
}

export function avisosDeLaMeta(meta: unknown): AvisosDeUnaMutacion | undefined {
  if (typeof meta !== 'object' || meta === null || !('avisos' in meta)) return undefined;
  const { avisos } = meta;
  if (typeof avisos !== 'object' || avisos === null) return undefined;
  const posible = avisos as Partial<Record<keyof MetaDeLosAvisos, unknown>>;
  if (!esQueSeGuarda(posible.que)) return undefined;
  const { hecho, enCola, error } = textosDeLib().avisos[posible.que];
  return {
    que: posible.que,
    sujeto: esTexto(posible.sujeto) ? posible.sujeto : null,
    hecho,
    enCola,
    error,
    errorEnPantalla: posible.errorEnPantalla === true,
    silencioso: posible.silencioso === true,
  };
}

const DURACION_MS: Readonly<Record<TonoDelAviso, number | null>> = {
  hecho: 5000,
  'en-cola': 8000,
  error: null,
};

const MAXIMO_DE_TRANSITORIOS = 3;

let avisos: readonly AvisoEnPantalla[] = [];
let proximoId = 1;
const relojes = new Map<number, ReturnType<typeof setTimeout>>();
const oyentes = new Set<() => void>();

function publicar(nuevos: readonly AvisoEnPantalla[]): void {
  avisos = nuevos;
  for (const avisar of oyentes) avisar();
}

function cancelarReloj(id: number): void {
  const reloj = relojes.get(id);
  if (reloj !== undefined) clearTimeout(reloj);
  relojes.delete(id);
}

export function descartarDePantalla(id: number): void {
  cancelarReloj(id);
  publicar(avisos.filter((aviso) => aviso.id !== id));
}

export interface NuevoAviso {
  clave: string;
  tono: TonoDelAviso;
  texto: string;
  detalle?: string;
  textoParaVarios?: (veces: number) => string;
  reemplaza?: string;
  accion?: AccionDelAviso;
}

export function avisoEnPantalla(id: number): AvisoEnPantalla | undefined {
  return avisos.find((aviso) => aviso.id === id);
}

export function avisarEnPantalla({
  clave,
  tono,
  texto,
  detalle,
  textoParaVarios,
  reemplaza,
  accion,
}: NuevoAviso): number {
  const previo =
    avisos.find((aviso) => aviso.clave === clave) ??
    (reemplaza === undefined ? undefined : avisos.find((aviso) => aviso.clave === reemplaza));
  const veces = previo?.clave === clave && previo.tono === tono ? previo.veces + 1 : 1;
  const aviso: AvisoEnPantalla = {
    id: previo?.id ?? proximoId,
    clave,
    tono,
    texto: veces > 1 && textoParaVarios !== undefined ? textoParaVarios(veces) : texto,
    detalle: detalle ?? null,
    veces,
    accion: accion ?? null,
  };

  if (previo === undefined) proximoId += 1;
  else cancelarReloj(previo.id);
  const siguientes =
    previo === undefined
      ? [...avisos, aviso]
      : avisos.map((otro) => (otro === previo ? aviso : otro));
  const transitorios = siguientes.filter((otro) => otro.tono !== 'error');
  const sobran = new Set(
    transitorios.slice(0, Math.max(0, transitorios.length - MAXIMO_DE_TRANSITORIOS)),
  );
  for (const viejo of sobran) cancelarReloj(viejo.id);
  publicar(siguientes.filter((otro) => !sobran.has(otro)));

  const duracion = DURACION_MS[tono];
  if (duracion !== null) {
    relojes.set(
      aviso.id,
      setTimeout(() => {
        descartarDePantalla(aviso.id);
      }, duracion),
    );
  }
  return aviso.id;
}

export function vaciarAvisosEnPantalla(): void {
  for (const id of relojes.keys()) cancelarReloj(id);
  publicar([]);
}

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

function leer(): readonly AvisoEnPantalla[] {
  return avisos;
}

export function useAvisosEnPantalla(): readonly AvisoEnPantalla[] {
  return useSyncExternalStore(suscribir, leer, leer);
}
