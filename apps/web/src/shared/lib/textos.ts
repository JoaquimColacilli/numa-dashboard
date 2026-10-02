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

export function tablaDeLib<T extends object>(elegir: (textos: TextosDeLib) => T): T {
  const actual = () => elegir(textosDeLib());
  return new Proxy({} as T, {
    get: (_objetivo, clave) => Reflect.get(actual(), clave),
    has: (_objetivo, clave) => Reflect.has(actual(), clave),
    ownKeys: () => Reflect.ownKeys(actual()),
    getOwnPropertyDescriptor: (_objetivo, clave) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(actual(), clave);
      return descriptor === undefined ? undefined : { ...descriptor, configurable: true };
    },
  });
}
