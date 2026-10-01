import { describe, expect, it } from 'vitest';

import {
  esIdioma,
  ETIQUETAS_DE_IDIOMA,
  etiquetaDelIdioma,
  IDIOMA_BASE,
  idiomaDeLaEtiqueta,
  idiomaDelNavegador,
  idiomaLeido,
  IDIOMAS,
} from './idioma.ts';

describe('los idiomas', () => {
  it('son español, inglés y portugués de Brasil, con el español de base', () => {
    expect(IDIOMAS).toEqual(['es', 'en', 'pt-BR']);
    expect(IDIOMA_BASE).toBe('es');
  });

  it('cada uno tiene su etiqueta', () => {
    expect(ETIQUETAS_DE_IDIOMA).toEqual({ es: 'es-AR', en: 'en-US', 'pt-BR': 'pt-BR' });
    expect(etiquetaDelIdioma('pt-BR')).toBe('pt-BR');
  });

  it('se reconoce uno de la lista, y lo demás se lee como español', () => {
    expect(esIdioma('en')).toBe(true);
    expect(esIdioma('pt')).toBe(false);
    expect(esIdioma(undefined)).toBe(false);
    expect(idiomaLeido('pt-BR')).toBe('pt-BR');
    expect(idiomaLeido('fr')).toBe('es');
    expect(idiomaLeido(null)).toBe('es');
  });

  it('una etiqueta del navegador se compara por idioma y no por región', () => {
    expect(idiomaDeLaEtiqueta('pt-PT')).toBe('pt-BR');
    expect(idiomaDeLaEtiqueta('es-419')).toBe('es');
    expect(idiomaDeLaEtiqueta('EN_gb')).toBe('en');
    expect(idiomaDeLaEtiqueta(' en ')).toBe('en');
    expect(idiomaDeLaEtiqueta('fr-FR')).toBeNull();
    expect(idiomaDeLaEtiqueta('constructor')).toBeNull();
    expect(idiomaDeLaEtiqueta('')).toBeNull();
  });

  it('el del navegador es el primero de los tres que aparece, y si no hay ninguno, español', () => {
    expect(idiomaDelNavegador(['fr-FR', 'pt-BR', 'en-US'])).toBe('pt-BR');
    expect(idiomaDelNavegador(['en-GB', 'es-AR'])).toBe('en');
    expect(idiomaDelNavegador(['de-DE', 'fr'])).toBe('es');
    expect(idiomaDelNavegador([])).toBe('es');
  });
});
