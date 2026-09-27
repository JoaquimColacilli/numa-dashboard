import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { debeReintentarse, sincronizar, type Replica } from '@/shared/api';
import { claveDeReplica } from '@/shared/lib';

const REINTENTOS = 3;

export function opcionesDeLaReplica(queryClient: QueryClient, usuarioId: string) {
  const clave = claveDeReplica(usuarioId);
  return queryOptions({
    queryKey: clave,
    queryFn: () =>
      sincronizar({
        leerReplica: () => queryClient.getQueryData<Replica>(clave),
        usuarioId,
        ahora: Date.now(),
        hayPendientes: queryClient.getMutationCache().findAll({ status: 'pending' }).length > 0,
      }),
    retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useReplica(usuarioId: string): UseQueryResult<Replica> {
  const queryClient = useQueryClient();
  return useQuery(opcionesDeLaReplica(queryClient, usuarioId));
}

export function traerLaReplicaSiFalta(queryClient: QueryClient, usuarioId: string): boolean {
  if (queryClient.getQueryData(claveDeReplica(usuarioId)) !== undefined) return false;
  queryClient.query(opcionesDeLaReplica(queryClient, usuarioId)).catch(() => undefined);
  return true;
}
