import { IDIOMA_BASE, type Idioma } from '@maun/domain';

import { estadoDelSeudoidioma, seudoCatalogo } from '@/shared/lib';

import { es, type MensajesDelCliente } from './es';

const CARGADORES: Readonly<Record<Exclude<Idioma, 'es'>, () => Promise<MensajesDelCliente>>> = {
  en: () => import('./en').then((modulo) => modulo.en),
  'pt-BR': () => import('./pt-BR').then((modulo) => modulo.ptBR),
};

const cargados = new Map<Idioma, MensajesDelCliente>([[IDIOMA_BASE, es]]);
const enCamino = new Map<Idioma, Promise<MensajesDelCliente>>();
const oyentes = new Set<() => void>();
let enSeudo: MensajesDelCliente | undefined;

export function conElSeudoidioma(): boolean {
  return estadoDelSeudoidioma() === 'activo';
}

export function idiomaQueSeEscribe(idioma: Idioma): Idioma {
  return conElSeudoidioma() ? IDIOMA_BASE : idioma;
}

export function mensajesDelClienteListos(idioma: Idioma): MensajesDelCliente | undefined {
  if (conElSeudoidioma()) {
    enSeudo ??= seudoCatalogo(es);
    return enSeudo;
  }
  return cargados.get(idioma);
}

export function cargarMensajesDelCliente(idioma: Idioma): Promise<MensajesDelCliente> {
  const listos = mensajesDelClienteListos(idioma);
  if (listos !== undefined) return Promise.resolve(listos);
  const pedido = enCamino.get(idioma);
  if (pedido !== undefined) return pedido;
  const nuevo = CARGADORES[idioma as Exclude<Idioma, 'es'>]()
    .then((m) => {
      cargados.set(idioma, m);
      for (const oyente of oyentes) oyente();
      return m;
    })
    .finally(() => {
      enCamino.delete(idioma);
    });
  enCamino.set(idioma, nuevo);
  return nuevo;
}

export function suscribirseALosMensajesDelCliente(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
