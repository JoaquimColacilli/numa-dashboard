import { IDIOMA_BASE, type Idioma } from '@maun/domain';
import { useSyncExternalStore } from 'react';

import { fijarElIdiomaEnUso, seudoCatalogo } from '@/shared/lib';

import { es, type Mensajes } from './es';

const CARGADORES: Readonly<Record<Exclude<Idioma, 'es'>, () => Promise<Mensajes>>> = {
  en: () => import('./en').then((modulo) => modulo.en),
  'pt-BR': () => import('./pt-BR').then((modulo) => modulo.ptBR),
};

export interface PedidoDeIdioma {
  idioma: Idioma;
  seudo: boolean;
}

export interface EstadoDeLosMensajes {
  readonly idioma: Idioma;
  readonly seudo: boolean;
  readonly m: Mensajes;
  readonly arrancando: PedidoDeIdioma | null;
}

let estado: EstadoDeLosMensajes = { idioma: IDIOMA_BASE, seudo: false, m: es, arrancando: null };
let pedidos = 0;
let enSeudo: Mensajes | undefined;
const cargados = new Map<Idioma, Mensajes>([['es', es]]);
const oyentes = new Set<() => void>();

function publicar(siguiente: EstadoDeLosMensajes): void {
  estado = siguiente;
  for (const oyente of oyentes) oyente();
}

function seudoDelEspanol(): Mensajes {
  enSeudo ??= seudoCatalogo(es);
  return enSeudo;
}

function pedidoDe(idioma: Idioma, seudo: boolean): PedidoDeIdioma {
  return seudo ? { idioma: IDIOMA_BASE, seudo } : { idioma, seudo };
}

function poner(pedido: PedidoDeIdioma, m: Mensajes): void {
  fijarElIdiomaEnUso(pedido.idioma, pedido.seudo);
  publicar({ idioma: pedido.idioma, seudo: pedido.seudo, m, arrancando: null });
}

export async function cargarMensajes(idioma: Idioma): Promise<Mensajes> {
  const hallado = cargados.get(idioma);
  if (hallado !== undefined) return hallado;
  const m = await CARGADORES[idioma as Exclude<Idioma, 'es'>]();
  cargados.set(idioma, m);
  return m;
}

export async function usarIdioma(idioma: Idioma, seudo = false): Promise<boolean> {
  const este = ++pedidos;
  const pedido = pedidoDe(idioma, seudo);
  try {
    const m = pedido.seudo ? seudoDelEspanol() : await cargarMensajes(pedido.idioma);
    if (este !== pedidos) return false;
    poner(pedido, m);
    return true;
  } catch (error) {
    if (este === pedidos && estado.arrancando !== null) publicar({ ...estado, arrancando: null });
    throw error;
  }
}

export function empezarConElIdioma(idioma: Idioma, seudo = false): Promise<boolean> {
  const pedido = pedidoDe(idioma, seudo);
  const listos = pedido.seudo ? seudoDelEspanol() : cargados.get(pedido.idioma);
  if (listos !== undefined) {
    ++pedidos;
    poner(pedido, listos);
    return Promise.resolve(true);
  }
  publicar({ ...estado, arrancando: pedido });
  return usarIdioma(idioma, seudo);
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function leer(): EstadoDeLosMensajes {
  return estado;
}

export function mensajes(): Mensajes {
  return estado.m;
}

export function estadoDeLosMensajes(): EstadoDeLosMensajes {
  return estado;
}

export function useEstadoDeLosMensajes(): EstadoDeLosMensajes {
  return useSyncExternalStore(suscribir, leer, leer);
}

export function useMensajes(): Mensajes {
  return useEstadoDeLosMensajes().m;
}

export function useIdioma(): Idioma {
  return useEstadoDeLosMensajes().idioma;
}

export function useIdiomaQueSeVe(): PedidoDeIdioma {
  const { idioma, seudo, arrancando } = useEstadoDeLosMensajes();
  return arrancando ?? { idioma, seudo };
}
