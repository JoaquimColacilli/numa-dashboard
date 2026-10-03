import { useState } from 'react';

export interface Eleccion {
  readonly elegida: string | null;
  readonly senalada: string | null;
  readonly mostrada: string | null;
  elegir: (clave: string | null) => void;
  senalar: (clave: string | null) => void;
}

export function useEleccion(inicial: string | null = null): Eleccion {
  const [elegida, elegir] = useState<string | null>(inicial);
  const [senalada, senalar] = useState<string | null>(null);
  return { elegida, senalada, mostrada: senalada ?? elegida, elegir, senalar };
}
