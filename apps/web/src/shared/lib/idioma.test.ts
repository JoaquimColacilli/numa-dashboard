import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CLAVE_DEL_IDIOMA,
  CLAVE_DEL_SEUDOIDIOMA,
  estadoDelSeudoidioma,
  etiquetaActual,
  fijarElIdiomaEnUso,
  guardarElIdioma,
  idiomaActual,
  idiomaEnUso,
  idiomaGuardadoDe,
  olvidarElIdioma,
  suscribirseAlIdioma,
} from './idioma';

afterEach(() => {
  fijarElIdiomaEnUso('es');
  localStorage.clear();
});

describe('el idioma en uso', () => {
  it('arranca en castellano, con la etiqueta de la Argentina', () => {
    expect(idiomaActual()).toBe('es');
    expect(etiquetaActual()).toBe('es-AR');
  });

  it('al cambiarlo pone el lang del documento y avisa a quien escucha, una sola vez', () => {
    const oyente = vi.fn();
    const dejar = suscribirseAlIdioma(oyente);

    fijarElIdiomaEnUso('pt-BR');
    fijarElIdiomaEnUso('pt-BR');

    expect(idiomaEnUso()).toEqual({ idioma: 'pt-BR', seudo: false });
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(oyente).toHaveBeenCalledTimes(1);

    dejar();
    fijarElIdiomaEnUso('en');
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(document.documentElement.lang).toBe('en-US');
  });

  it('el seudoidioma es castellano por debajo: sus fechas y su plata, y el lang de la Argentina', () => {
    fijarElIdiomaEnUso('es', true);
    expect(idiomaEnUso()).toEqual({ idioma: 'es', seudo: true });
    expect(document.documentElement.lang).toBe('es-AR');
  });
});

describe('la copia local del idioma', () => {
  it('es de la persona: otra persona en el mismo aparato no la lee', () => {
    guardarElIdioma('ana', 'en');
    expect(idiomaGuardadoDe('ana')).toBe('en');
    expect(idiomaGuardadoDe('beto')).toBeNull();
    olvidarElIdioma();
    expect(idiomaGuardadoDe('ana')).toBeNull();
  });

  it('lo que no es una copia que se entienda no cuenta', () => {
    localStorage.setItem(CLAVE_DEL_IDIOMA, '{roto');
    expect(idiomaGuardadoDe('ana')).toBeNull();
    localStorage.setItem(CLAVE_DEL_IDIOMA, JSON.stringify({ usuarioId: 'ana', idioma: 'fr' }));
    expect(idiomaGuardadoDe('ana')).toBeNull();
    localStorage.setItem(CLAVE_DEL_IDIOMA, 'null');
    expect(idiomaGuardadoDe('ana')).toBeNull();
  });
});

describe('la clave del seudoidioma', () => {
  it('solo vale activo o disponible', () => {
    expect(estadoDelSeudoidioma()).toBeNull();
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'activo');
    expect(estadoDelSeudoidioma()).toBe('activo');
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'disponible');
    expect(estadoDelSeudoidioma()).toBe('disponible');
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'si');
    expect(estadoDelSeudoidioma()).toBeNull();
  });
});
