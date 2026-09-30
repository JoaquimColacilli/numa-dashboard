import { useCallback, useEffect, useRef, useState } from 'react';

export interface Visor {
  abierta: string | null;
  abrir: (id: string, desde: HTMLElement) => void;
  cerrar: () => void;
}

export function useVisor(): Visor {
  const [abierta, setAbierta] = useState<string | null>(null);
  const desde = useRef<HTMLElement | null>(null);

  const abrir = useCallback((id: string, boton: HTMLElement) => {
    desde.current = boton;
    setAbierta(id);
  }, []);

  const cerrar = useCallback(() => {
    setAbierta(null);
  }, []);

  useEffect(() => {
    if (abierta !== null) return;
    const boton = desde.current;
    desde.current = null;
    boton?.focus();
  }, [abierta]);

  return { abierta, abrir, cerrar };
}
