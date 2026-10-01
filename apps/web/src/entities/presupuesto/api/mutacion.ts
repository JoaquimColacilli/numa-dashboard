import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  guardarElBorradorDelPresupuesto,
  mandarElPresupuestoAlCliente,
  type FilaDe,
  type PresupuestoMandado,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

import {
  conElBorradorGuardado,
  conElPresupuestoMandado,
  conLoMandado,
  sinElBorradorGuardado,
  sinElPresupuestoMandado,
  type EnvioDelPresupuesto,
  type GuardadoDelBorrador,
} from '../model/replica';

export const CLAVE_DEL_BORRADOR = ['presupuestos', 'borrador'] as const;
export const CLAVE_DEL_ENVIO = ['presupuestos', 'mandar'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

export const MUTACION_DEL_BORRADOR: MutationOptions<
  FilaDe<'presupuestos'>,
  unknown,
  GuardadoDelBorrador
> = {
  mutationKey: CLAVE_DEL_BORRADOR,
  mutationFn: ({ pedido }) => guardarElBorradorDelPresupuesto(pedido),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async (guardado, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conElBorradorGuardado(replica, guardado));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _guardado, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'presupuestos', fila));
  },
  onError: (_error, guardado, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => sinElBorradorGuardado(replica, guardado));
  },
};

export const MUTACION_DEL_ENVIO: MutationOptions<PresupuestoMandado, unknown, EnvioDelPresupuesto> =
  {
    mutationKey: CLAVE_DEL_ENVIO,
    mutationFn: ({ pedido }) => mandarElPresupuestoAlCliente(pedido),
    scope: COLA_DE_SALIDA,
    gcTime: DURACION_DEL_RECHAZO_MS,
    retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
    onMutate: async (envio, { client }) => {
      await client.cancelQueries({ queryKey: claveDeTodaReplica() });
      cambiarReplicas(client, (replica) => conElPresupuestoMandado(replica, envio));
      await guardarCacheAhora();
    },
    onSuccess: (mandado, _envio, _contexto, { client }) => {
      cambiarReplicas(client, (replica) => conLoMandado(replica, mandado));
    },
    onError: (_error, envio, _contexto, { client }) => {
      cambiarReplicas(client, (replica) => sinElPresupuestoMandado(replica, envio));
    },
  };
