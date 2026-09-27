import type { QueryClient } from '@tanstack/react-query';

import { traerLaReplicaSiFalta } from '@/entities/replica';
import { claimsGuardados } from '@/shared/api';

const PREFIJO_DEL_ACCESO = '/acceso';

export function traerLaReplicaDeLaSesionGuardada(queryClient: QueryClient, ruta: string): boolean {
  if (ruta.startsWith(PREFIJO_DEL_ACCESO)) return false;
  const sesion = claimsGuardados();
  return sesion !== undefined && traerLaReplicaSiFalta(queryClient, sesion.usuarioId);
}
