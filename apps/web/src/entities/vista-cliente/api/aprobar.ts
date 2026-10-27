import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  aprobarElPresupuestoDelCliente,
  esFalloDeRed,
  motivoDelRechazoDeLaAprobacion,
} from '@/shared/api';

import type { AprobarElPresupuesto, ResultadoDeAprobar } from '../model/aprobar';
import { claveDeLaVistaCompartida } from './consulta';

export function resultadoDeNoAprobar(error: unknown): ResultadoDeAprobar {
  if (esFalloDeRed(error)) return { tipo: 'error', motivo: 'sin-senal' };
  return { tipo: 'error', motivo: motivoDelRechazoDeLaAprobacion(error) ?? 'no-se-pudo' };
}

export function useAprobarElPresupuesto(token: string): AprobarElPresupuesto {
  const cliente = useQueryClient();
  return useCallback(
    async (aprobacion) => {
      const releer = () => cliente.refetchQueries({ queryKey: claveDeLaVistaCompartida(token) });
      try {
        await aprobarElPresupuestoDelCliente(token, aprobacion);
        await releer();
        return { tipo: 'guardada' };
      } catch (error) {
        if (!esFalloDeRed(error)) await releer();
        return resultadoDeNoAprobar(error);
      }
    },
    [cliente, token],
  );
}
