import { afterEach, describe, expect, it, vi } from 'vitest';

import { anotarQueSeEntendio, escalaDelZoom, rigeDesde, yaSeEntendio } from './rotulo';

afterEach(() => {
  vi.unstubAllGlobals();
  try {
    localStorage.clear();
  } catch {
    return;
  }
});

describe('el rótulo del plano', () => {
  it('escribe el zoom como la escala de un plano', () => {
    expect(escalaDelZoom(1)).toBe('1:1');
    expect(escalaDelZoom(1.03)).toBe('1:1');
    expect(escalaDelZoom(1 / 1.2)).toBe('1:1,2');
    expect(escalaDelZoom(0.625)).toBe('1:1,6');
    expect(escalaDelZoom(1.3)).toBe('1,3:1');
  });

  it('rige desde el último guardado, o de Ajustes si nunca se guardó', () => {
    expect(rigeDesde(true, '2026-09-01T15:00:00Z')).toBe('01/09/26');
    expect(rigeDesde(true, '2026-09-02T02:00:00Z')).toBe('01/09/26');
    expect(rigeDesde(false, null)).toBe('de Ajustes');
    expect(rigeDesde(false, '2026-09-01T15:00:00Z')).toBe('de Ajustes');
  });
});

describe('la primera vez', () => {
  it('se recuerda en el dispositivo', () => {
    expect(yaSeEntendio()).toBe(false);
    anotarQueSeEntendio();
    expect(yaSeEntendio()).toBe(true);
  });

  it('sin almacenamiento, se muestra y no rompe', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(yaSeEntendio()).toBe(false);
    expect(() => {
      anotarQueSeEntendio();
    }).not.toThrow();
  });
});
