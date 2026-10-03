import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  contestarLaEntrega,
  esFalloDeRed,
  motivoDelRechazoDeLaEntrega,
  type ResultadoDeResponder,
} from '@/shared/api';

import type { MandarLaEntrega, ResultadoDeMandar } from '../model/mandar';
import { claveDeLaVistaCompartida } from './consulta';

export function resultadoDeResponder(estado: ResultadoDeResponder): ResultadoDeMandar {
  switch (estado) {
    case 'guardada':
      return { tipo: 'guardada' };
    case 'ya_confirmada':
      return { tipo: 'ya-confirmada' };
    case 'cambio':
      return { tipo: 'cambio' };
  }
}

export function resultadoDelError(error: unknown): ResultadoDeMandar {
  if (esFalloDeRed(error)) return { tipo: 'error', motivo: 'sin-senal' };
  return { tipo: 'error', motivo: motivoDelRechazoDeLaEntrega(error) ?? 'no-se-pudo' };
}

export function useMandarLaEntrega(token: string): MandarLaEntrega {
  const cliente = useQueryClient();
  return useCallback(
    async (respuesta) => {
      const releer = () => cliente.refetchQueries({ queryKey: claveDeLaVistaCompartida(token) });
      try {
        const estado = await contestarLaEntrega(token, respuesta);
        await releer();
        return resultadoDeResponder(estado);
      } catch (error) {
        if (!esFalloDeRed(error)) await releer();
        return resultadoDelError(error);
      }
    },
    [cliente, token],
  );
}
