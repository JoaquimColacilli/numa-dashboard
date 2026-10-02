import { afterEach, describe, expect, it, vi } from 'vitest';

import { en } from './en';
import { ptBR } from './pt-BR';

async function cargaNueva() {
  vi.resetModules();
  const tienda = await import('./mensajes');
  const lib = await import('@/shared/lib');
  const { es } = await import('./es');
  return { ...tienda, idiomaEnUso: lib.idiomaEnUso, es };
}

afterEach(() => {
  vi.doUnmock('./en');
  document.documentElement.lang = 'es-AR';
});

describe('los mensajes de la app', () => {
  it('arrancan en castellano, sin esperar nada', async () => {
    const { mensajes, empezarConElIdioma, estadoDeLosMensajes, es } = await cargaNueva();
    expect(mensajes()).toBe(es);
    const camino = empezarConElIdioma('es');
    expect(estadoDeLosMensajes().arrancando).toBeNull();
    await expect(camino).resolves.toBe(true);
    expect(mensajes()).toBe(es);
  });

  it('inglés y portugués llegan con su import, y cambian el lang del documento', async () => {
    const { mensajes, usarIdioma } = await cargaNueva();
    await usarIdioma('en');
    expect(mensajes()).toEqual(en);
    expect(document.documentElement.lang).toBe('en-US');
    await usarIdioma('pt-BR');
    expect(mensajes()).toEqual(ptBR);
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('una carga que llega tarde no pisa a la última elección', async () => {
    let soltar: (() => void) | undefined;
    vi.doMock('./en', async () => {
      await new Promise<void>((resolver) => {
        soltar = resolver;
      });
      return { en };
    });
    const { mensajes, usarIdioma } = await cargaNueva();

    const primero = usarIdioma('en');
    await expect(usarIdioma('pt-BR')).resolves.toBe(true);
    await vi.waitFor(() => {
      expect(soltar).toBeDefined();
    });
    soltar?.();
    await expect(primero).resolves.toBe(false);
    expect(mensajes()).toEqual(ptBR);
  });

  it('al arrancar en otro idioma, mientras llega su catálogo queda marcado como arrancando', async () => {
    const { empezarConElIdioma, estadoDeLosMensajes } = await cargaNueva();
    const camino = empezarConElIdioma('pt-BR');
    expect(estadoDeLosMensajes().arrancando).toEqual({ idioma: 'pt-BR', seudo: false });
    await camino;
    expect(estadoDeLosMensajes()).toMatchObject({ idioma: 'pt-BR', arrancando: null });
  });

  it('si el catálogo no llega (sin señal y sin el chunk), queda el de antes y deja de arrancar', async () => {
    vi.doMock('./en', () => {
      throw new Error('sin señal');
    });
    const { empezarConElIdioma, estadoDeLosMensajes, mensajes, es } = await cargaNueva();
    await expect(empezarConElIdioma('en')).rejects.toThrow();
    expect(estadoDeLosMensajes()).toMatchObject({ idioma: 'es', arrancando: null });
    expect(mensajes()).toBe(es);
  });

  it('el seudoidioma es el castellano pasado, con las fechas y la plata del castellano', async () => {
    const { mensajes, usarIdioma, idiomaEnUso } = await cargaNueva();
    await usarIdioma('en', true);
    expect(mensajes().comun.idioma).toBe('⟦Îðîöɱá~~~⟧');
    expect(idiomaEnUso()).toEqual({ idioma: 'es', seudo: true });
    expect(document.documentElement.lang).toBe('es-AR');
  });
});
