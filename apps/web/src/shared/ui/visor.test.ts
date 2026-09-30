import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useVisor } from './visor';

function conAnchoUtil(ancho: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    get: () => ancho,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document.documentElement, 'clientWidth');
  document.documentElement.style.removeProperty('--barra-del-documento');
});

describe('useVisor', () => {
  it('al abrir anota el ancho de la barra del documento, así la página no salta cuando se traba', () => {
    vi.stubGlobal('innerWidth', 1440);
    conAnchoUtil(1425);
    const { result } = renderHook(() => useVisor());

    act(() => {
      result.current.abrir('a1', document.createElement('button'));
    });

    expect(result.current.abierta).toBe('a1');
    expect(document.documentElement.style.getPropertyValue('--barra-del-documento')).toBe('15px');
  });

  it('sin barra, o con una que flota encima, anota cero', () => {
    vi.stubGlobal('innerWidth', 390);
    conAnchoUtil(390);
    const { result } = renderHook(() => useVisor());

    act(() => {
      result.current.abrir('a1', document.createElement('button'));
    });

    expect(document.documentElement.style.getPropertyValue('--barra-del-documento')).toBe('0px');
  });
});
