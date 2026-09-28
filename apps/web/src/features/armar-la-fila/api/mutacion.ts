import type { Fila } from '@maun/domain';
import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  filaPorId,
  guardarLaFila,
  type FilaDe,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

export const CLAVE_DE_LA_FILA = ['ajustes', 'guardar-la-fila'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface LoQueGuardaLaFila {
  fila: FilaDe<'ajustes'>['fila'];
  fila_version: number;
  fila_guardada_at: string | null;
}

export interface GuardadoDeLaFila {
  ajustesId: string;
  version: number;
  fila: Fila | null;
  guardadaEn: string;
  previa: LoQueGuardaLaFila;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function conLaFila(replica: Replica, id: string, fila: LoQueGuardaLaFila): Replica {
  const actual = filaPorId(replica, 'ajustes', id);
  if (!actual) return replica;
  return aplicarFilaLocal(replica, 'ajustes', { ...actual, ...fila });
}

export const MUTACION_DE_LA_FILA: MutationOptions<FilaDe<'ajustes'>, unknown, GuardadoDeLaFila> = {
  mutationKey: CLAVE_DE_LA_FILA,
  mutationFn: ({ version, fila }) => guardarLaFila(version, fila),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ ajustesId, version, fila, guardadaEn }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      conLaFila(replica, ajustesId, {
        fila: fila as unknown as FilaDe<'ajustes'>['fila'],
        fila_version: version + 1,
        fila_guardada_at: guardadaEn,
      }),
    );
    await guardarCacheAhora();
  },
  onSuccess: (fila, _variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'ajustes', fila));
  },
  onError: (_error, { ajustesId, previa }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conLaFila(replica, ajustesId, previa));
  },
};
