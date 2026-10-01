export const IDIOMAS = ['es', 'en', 'pt-BR'] as const;

export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_BASE = 'es' satisfies Idioma;

export const ETIQUETAS_DE_IDIOMA: Readonly<Record<Idioma, string>> = {
  es: 'es-AR',
  en: 'en-US',
  'pt-BR': 'pt-BR',
};

const IDIOMA_DE_CADA_LENGUA: ReadonlyMap<string, Idioma> = new Map<string, Idioma>([
  ['es', 'es'],
  ['en', 'en'],
  ['pt', 'pt-BR'],
]);

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);
}

export function idiomaLeido(valor: unknown): Idioma {
  return esIdioma(valor) ? valor : IDIOMA_BASE;
}

export function etiquetaDelIdioma(idioma: Idioma): string {
  return ETIQUETAS_DE_IDIOMA[idioma];
}

export function idiomaDeLaEtiqueta(etiqueta: string): Idioma | null {
  const lengua = etiqueta
    .trim()
    .toLowerCase()
    .replace(/[-_].*$/, '');
  return IDIOMA_DE_CADA_LENGUA.get(lengua) ?? null;
}

export function idiomaDelNavegador(etiquetas: readonly string[]): Idioma {
  for (const etiqueta of etiquetas) {
    const idioma = idiomaDeLaEtiqueta(etiqueta);
    if (idioma !== null) return idioma;
  }
  return IDIOMA_BASE;
}
