export function textosDelIdioma<T extends object>(leer: () => T): T {
  return new Proxy({} as T, {
    get: (_objetivo, clave) => Reflect.get(leer(), clave),
    has: (_objetivo, clave) => Reflect.has(leer(), clave),
    ownKeys: () => Reflect.ownKeys(leer()),
    getOwnPropertyDescriptor: (_objetivo, clave) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(leer(), clave);
      return descriptor === undefined ? undefined : { ...descriptor, configurable: true };
    },
  });
}
