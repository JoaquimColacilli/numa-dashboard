import type { Mensajes } from '@/shared/idioma';

export type TextosDeLib = Mensajes['lib'];

let leer: (() => TextosDeLib) | null = null;

export function fijarLosTextosDeLib(lector: () => TextosDeLib): void {
  leer = lector;
}

export function textosDeLib(): TextosDeLib {
  if (leer === null) throw new Error('fijarLosTextosDeLib');
  return leer();
}
