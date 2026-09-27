import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  filaPorId,
  householdDe,
  moverEnLaVidrieraDelTaller,
  quitarFilaLocal,
  sacarDeLaVidriera,
  sumarALaVidriera,
  type FilaDe,
  type FotoDeLaVidrieraNueva,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

export type FotoEnLaVidriera = FilaDe<'fotos_de_la_vidriera'>;

export const CLAVE_DE_FOTO_DE_LA_VIDRIERA = ['vidriera', 'sumar'] as const;
export const CLAVE_DE_ORDEN_DE_LA_VIDRIERA = ['vidriera', 'ordenar'] as const;
export const CLAVE_DE_BAJA_DE_LA_VIDRIERA = ['vidriera', 'sacar'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface AltaEnLaVidriera {
  nueva: FotoDeLaVidrieraNueva;
  previa: FotoEnLaVidriera | null;
}

export interface OrdenEnLaVidriera {
  id: string;
  orden: number;
  previo: number;
}

export interface BajaDeLaVidriera {
  id: string;
  sacadaEn: string;
  previa: FotoEnLaVidriera;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function conLaFoto(replica: Replica, { nueva, previa }: AltaEnLaVidriera): Replica {
  const household = householdDe(replica);
  if (!household) return replica;

  const ahora = new Date().toISOString();
  const fila = {
    ...nueva,
    household_id: household.id,
    created_at: previa?.created_at ?? ahora,
    updated_at: ahora,
    deleted_at: null,
    version: previa === null ? 1 : previa.version + 1,
  } satisfies FotoEnLaVidriera;

  return aplicarFilaLocal(replica, 'fotos_de_la_vidriera', fila);
}

function conElOrden(replica: Replica, id: string, orden: number): Replica {
  const actual = filaPorId(replica, 'fotos_de_la_vidriera', id);
  if (!actual || actual.orden === orden) return replica;
  return aplicarFilaLocal(replica, 'fotos_de_la_vidriera', {
    ...actual,
    orden,
    updated_at: new Date().toISOString(),
    version: actual.version + 1,
  });
}

export const MUTACION_DE_FOTO_DE_LA_VIDRIERA: MutationOptions<
  FotoEnLaVidriera,
  unknown,
  AltaEnLaVidriera
> = {
  mutationKey: CLAVE_DE_FOTO_DE_LA_VIDRIERA,
  mutationFn: ({ nueva, previa }) => sumarALaVidriera(nueva, previa !== null),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async (alta, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conLaFoto(replica, alta));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _alta, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'fotos_de_la_vidriera', fila));
  },
  onError: (_error, { nueva }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) =>
      quitarFilaLocal(replica, 'fotos_de_la_vidriera', nueva.id),
    );
  },
};

export const MUTACION_DE_ORDEN_DE_LA_VIDRIERA: MutationOptions<
  FotoEnLaVidriera,
  unknown,
  OrdenEnLaVidriera
> = {
  mutationKey: CLAVE_DE_ORDEN_DE_LA_VIDRIERA,
  mutationFn: ({ id, orden }) => moverEnLaVidrieraDelTaller(id, orden),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ id, orden }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conElOrden(replica, id, orden));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _orden, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'fotos_de_la_vidriera', fila));
  },
  onError: (_error, { id, previo }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conElOrden(replica, id, previo));
  },
};

export const MUTACION_DE_BAJA_DE_LA_VIDRIERA: MutationOptions<
  FotoEnLaVidriera,
  unknown,
  BajaDeLaVidriera
> = {
  mutationKey: CLAVE_DE_BAJA_DE_LA_VIDRIERA,
  mutationFn: ({ id, sacadaEn }) => sacarDeLaVidriera(id, sacadaEn),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ id }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => quitarFilaLocal(replica, 'fotos_de_la_vidriera', id));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _baja, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'fotos_de_la_vidriera', fila));
  },
  onError: (_error, { previa }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'fotos_de_la_vidriera', previa));
  },
};
