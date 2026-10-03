export type FormasDelPlural = { readonly other: string } & {
  readonly [Forma in Exclude<Intl.LDMLPluralRule, 'other'> | '=0']?: string;
};

const REGLAS = new Map<string, Intl.PluralRules>();
const NUMEROS = new Map<string, Intl.NumberFormat>();

function delCache<T>(cache: Map<string, T>, etiqueta: string, crear: () => T): T {
  const hallado = cache.get(etiqueta);
  if (hallado !== undefined) return hallado;
  const nuevo = crear();
  cache.set(etiqueta, nuevo);
  return nuevo;
}

export function crearPlural(etiqueta: string): (n: number, formas: FormasDelPlural) => string {
  const reglas = delCache(REGLAS, etiqueta, () => new Intl.PluralRules(etiqueta));
  const numero = delCache(NUMEROS, etiqueta, () => new Intl.NumberFormat(etiqueta));
  return (n, formas) => {
    const forma = (n === 0 ? formas['=0'] : undefined) ?? formas[reglas.select(n)] ?? formas.other;
    return forma.replaceAll('#', numero.format(n));
  };
}
