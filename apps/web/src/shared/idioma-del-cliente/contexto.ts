import type { Idioma } from '@maun/domain';
import { createContext, useContext } from 'react';

import type { MensajesDelCliente } from './es';
import type { FormatosDelCliente } from './formatos';

export interface ElIdiomaDelCliente {
  idioma: Idioma;
  m: MensajesDelCliente;
  f: FormatosDelCliente;
}

export const ContextoDelCliente = createContext<ElIdiomaDelCliente | null>(null);

function useElIdiomaDelCliente(): ElIdiomaDelCliente {
  const valor = useContext(ContextoDelCliente);
  if (valor === null) throw new Error('ConElIdiomaDelCliente');
  return valor;
}

export function useMensajesDelCliente(): MensajesDelCliente {
  return useElIdiomaDelCliente().m;
}

export function useFormatosDelCliente(): FormatosDelCliente {
  return useElIdiomaDelCliente().f;
}

export function useIdiomaDelCliente(): Idioma {
  return useElIdiomaDelCliente().idioma;
}

export function useElIdiomaDelClienteSiHay(): ElIdiomaDelCliente | null {
  return useContext(ContextoDelCliente);
}
