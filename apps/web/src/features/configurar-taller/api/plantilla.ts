import type { PlantillaDelPresupuesto } from '@maun/domain';
import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  filaPorId,
  guardarLosTextosDelPresupuesto,
  type FilaDe,
  type Json,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

export const CLAVE_DE_LA_PLANTILLA = ['ajustes', 'plantilla-del-presupuesto'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface LoQueGuardaLaPlantilla {
  plantilla_del_presupuesto: Json | null;
  plantilla_del_presupuesto_version: number;
}

export interface GuardadoDeLaPlantilla {
  ajustesId: string;
  version: number;
  plantilla: PlantillaDelPresupuesto | null;
  previa: LoQueGuardaLaPlantilla;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function conLaPlantilla(replica: Replica, id: string, plantilla: LoQueGuardaLaPlantilla): Replica {
  const actual = filaPorId(replica, 'ajustes', id);
  if (!actual) return replica;
  return aplicarFilaLocal(replica, 'ajustes', { ...actual, ...plantilla });
}

export const MUTACION_DE_LA_PLANTILLA: MutationOptions<
  FilaDe<'ajustes'>,
  unknown,
  GuardadoDeLaPlantilla
> = {
  mutationKey: CLAVE_DE_LA_PLANTILLA,
  mutationFn: ({ version, plantilla }) => guardarLosTextosDelPresupuesto(version, plantilla),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ ajustesId, version, plantilla }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      conLaPlantilla(replica, ajustesId, {
        plantilla_del_presupuesto: plantilla as unknown as Json,
        plantilla_del_presupuesto_version: version + 1,
      }),
    );
    await guardarCacheAhora();
  },
  onSuccess: (ajustes, _variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'ajustes', ajustes));
  },
  onError: (_error, { ajustesId, previa }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conLaPlantilla(replica, ajustesId, previa));
  },
};
