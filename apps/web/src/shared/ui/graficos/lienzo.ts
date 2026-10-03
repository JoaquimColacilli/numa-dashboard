import { useCallback, useState } from 'react';

export function useAnchoDelLienzo(): readonly [
  (elemento: HTMLElement | null) => (() => void) | undefined,
  number,
] {
  const [ancho, setAncho] = useState(0);
  const medirAl = useCallback((elemento: HTMLElement | null) => {
    if (elemento === null) return undefined;
    const medir = () => {
      setAncho(Math.floor(elemento.getBoundingClientRect().width));
    };
    medir();
    if (!('ResizeObserver' in globalThis)) return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => {
      observador.disconnect();
    };
  }, []);
  return [medirAl, ancho];
}

export function anchoDelTexto(texto: string, tamano = 12): number {
  return texto.length * tamano * 0.56;
}
