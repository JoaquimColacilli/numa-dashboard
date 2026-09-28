import { cambiosDeLaFila, type CambioDeLaFila, type Fila } from '@maun/domain';
import { useSyncExternalStore } from 'react';

export interface BorradorDeLaFila {
  ajustesId: string;
  version: number;
  base: Fila;
  fila: Fila;
  atras: readonly Fila[];
  adelante: readonly Fila[];
  pasadoAMensual: boolean;
  ultimaClave: string | null;
}

let actual: BorradorDeLaFila | null = null;
const oyentes = new Set<() => void>();

function poner(siguiente: BorradorDeLaFila | null): void {
  actual = siguiente;
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

const leer = () => actual;

export function borradorDeLaFila(): BorradorDeLaFila | null {
  return actual;
}

export function empezarElBorrador(ajustesId: string, version: number, guardada: Fila): void {
  poner({
    ajustesId,
    version,
    base: guardada,
    fila: { ...guardada, sueldoPorTrabajo: false },
    atras: [],
    adelante: [],
    pasadoAMensual: guardada.sueldoPorTrabajo,
    ultimaClave: null,
  });
}

export function cambiarElBorrador(fila: Fila, clave: string | null = null): void {
  if (actual === null || fila === actual.fila) return;
  const juntar = clave !== null && clave === actual.ultimaClave;
  poner({
    ...actual,
    fila,
    atras: juntar ? actual.atras : [...actual.atras, actual.fila],
    adelante: [],
    ultimaClave: clave,
  });
}

export function deshacerElBorrador(): void {
  const previa = actual?.atras.at(-1);
  if (actual === null || previa === undefined) return;
  poner({
    ...actual,
    fila: previa,
    atras: actual.atras.slice(0, -1),
    adelante: [actual.fila, ...actual.adelante],
    ultimaClave: null,
  });
}

export function rehacerElBorrador(): void {
  const siguiente = actual?.adelante[0];
  if (actual === null || siguiente === undefined) return;
  poner({
    ...actual,
    fila: siguiente,
    atras: [...actual.atras, actual.fila],
    adelante: actual.adelante.slice(1),
    ultimaClave: null,
  });
}

export function descartarElBorrador(): void {
  poner(null);
}

export function cortarLaJunta(): void {
  if (actual === null || actual.ultimaClave === null) return;
  poner({ ...actual, ultimaClave: null });
}

export function useBorradorDeLaFila(ajustesId: string | null): BorradorDeLaFila | null {
  const borrador = useSyncExternalStore(suscribir, leer, leer);
  return borrador !== null && borrador.ajustesId === ajustesId ? borrador : null;
}

export function cambiosDelBorrador(borrador: BorradorDeLaFila): CambioDeLaFila[] {
  return cambiosDeLaFila(borrador.base, borrador.fila);
}

export function cuantosCambios(borrador: BorradorDeLaFila | null): number {
  if (borrador === null) return 0;
  return cambiosDelBorrador(borrador).length + (borrador.pasadoAMensual ? 1 : 0);
}
