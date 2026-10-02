import { useCallback, useState, type ReactNode } from 'react';

import { HojaDeTesoroNuevo } from '@/features/editar-tesoro';

type AlCrear = (tesoroId: string) => void;

export interface ConTesoroEnDolaresNuevoProps {
  children: (pedir: (alCrear: AlCrear) => void) => ReactNode;
}

export function ConTesoroEnDolaresNuevo({ children }: ConTesoroEnDolaresNuevoProps) {
  const [alCrear, setAlCrear] = useState<{ avisar: AlCrear } | null>(null);
  const pedir = useCallback((avisar: AlCrear) => {
    setAlCrear({ avisar });
  }, []);
  return (
    <>
      {children(pedir)}
      {alCrear !== null && (
        <HojaDeTesoroNuevo
          monedaInicial="USD"
          alCerrar={() => {
            setAlCrear(null);
          }}
          alCrear={(tesoro) => {
            alCrear.avisar(tesoro.id);
          }}
        />
      )}
    </>
  );
}
