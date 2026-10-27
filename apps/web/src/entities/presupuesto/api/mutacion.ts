import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  guardarElBorradorDelPresupuesto,
  mandarElPresupuestoAlCliente,
  marcarLaRespuestaAlPresupuestoAtendida,
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
import type { FilaDeRespuesta } from '../model/respuesta';

export const CLAVE_DEL_BORRADOR = ['presupuestos', 'borrador'] as const;
export const CLAVE_DEL_ENVIO = ['presupuestos', 'mandar'] as const;
export const CLAVE_DE_LA_RESPUESTA_ATENDIDA = ['presupuestos', 'respuesta-atendida'] as const;

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

export interface RespuestaAtendida {
  respuesta: FilaDeRespuesta;
  momento: string;
}

export const MUTACION_DE_LA_RESPUESTA_ATENDIDA: MutationOptions<
  FilaDeRespuesta,
  unknown,
  RespuestaAtendida
> = {
  mutationKey: CLAVE_DE_LA_RESPUESTA_ATENDIDA,
  mutationFn: ({ respuesta, momento }) =>
    marcarLaRespuestaAlPresupuestoAtendida(respuesta.id, momento),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ respuesta, momento }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      aplicarFilaLocal(replica, 'respuestas_al_presupuesto', {
        ...respuesta,
        atendida_at: momento,
        updated_at: momento,
        version: respuesta.version + 1,
      }),
    );
    await guardarCacheAhora();
  },
  onSuccess: (fila, _atendida, _contexto, { client }) => {
    cambiarReplicas(client, (replica) =>
      aplicarFilaLocal(replica, 'respuestas_al_presupuesto', fila),
    );
  },
  onError: (_error, { respuesta }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) =>
      aplicarFilaLocal(replica, 'respuestas_al_presupuesto', respuesta),
    );
  },
};

export function atenderLaRespuesta(
  cliente: QueryClient,
  respuesta: FilaDeRespuesta,
  meta: MutationOptions['meta'],
  momento: string = new Date().toISOString(),
): void {
  if (respuesta.atendida_at !== null) return;
  void cliente
    .getMutationCache()
    .build(cliente, { ...MUTACION_DE_LA_RESPUESTA_ATENDIDA, meta })
    .execute({ respuesta, momento })
    .catch(() => undefined);
}
