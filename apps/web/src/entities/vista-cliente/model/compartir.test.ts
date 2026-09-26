import { afterEach, describe, expect, it, vi } from 'vitest';

import { compartirDelSistema, compartirLaRed, type CompartirDelSistema } from './compartir';

const DATOS = { title: 'Taller MAUN', url: 'https://www.instagram.com/taller.maun/' };

function delSistema(extra: Partial<CompartirDelSistema> = {}): CompartirDelSistema {
  return {
    compartir: vi.fn(() => Promise.resolve()),
    puede: () => true,
    ...extra,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('compartir las redes del taller', () => {
  it('con el compartir del sistema, comparte el nombre del taller y el link de la red', async () => {
    const sistema = delSistema();
    const copiar = vi.fn();
    expect(await compartirLaRed(DATOS, { delSistema: sistema, copiar })).toBe('compartido');
    expect(sistema.compartir).toHaveBeenCalledWith(DATOS);
    expect(copiar).not.toHaveBeenCalled();
  });

  it('si la persona cierra el menú, no pasa nada', async () => {
    const cancelar = Object.assign(new Error('Share canceled'), { name: 'AbortError' });
    const sistema = delSistema({ compartir: () => Promise.reject(cancelar) });
    expect(await compartirLaRed(DATOS, { delSistema: sistema, copiar: vi.fn() })).toBe('cancelado');
  });

  it('si el sistema falla por otra cosa, es un fallo', async () => {
    const sistema = delSistema({ compartir: () => Promise.reject(new Error('NotAllowedError')) });
    expect(await compartirLaRed(DATOS, { delSistema: sistema, copiar: vi.fn() })).toBe('fallo');
  });

  it('sin compartir del sistema, o si no lo puede compartir, copia el link', async () => {
    const copiar = vi.fn(() => Promise.resolve('copiado' as const));
    expect(await compartirLaRed(DATOS, { delSistema: undefined, copiar })).toBe('copiado');
    expect(copiar).toHaveBeenCalledWith(DATOS.url);

    const noPuede = delSistema({ puede: () => false });
    expect(await compartirLaRed(DATOS, { delSistema: noPuede, copiar })).toBe('copiado');
    expect(noPuede.compartir).not.toHaveBeenCalled();
  });

  it('si tampoco se puede copiar, es un fallo', async () => {
    expect(
      await compartirLaRed(DATOS, {
        delSistema: undefined,
        copiar: () => Promise.resolve('nada' as const),
      }),
    ).toBe('fallo');
  });

  it('el compartir del sistema existe solo si están las dos funciones', () => {
    vi.stubGlobal('navigator', { share: () => Promise.resolve() });
    expect(compartirDelSistema()).toBeUndefined();
    vi.stubGlobal('navigator', { share: () => Promise.resolve(), canShare: () => true });
    expect(compartirDelSistema()?.puede(DATOS)).toBe(true);
  });
});
