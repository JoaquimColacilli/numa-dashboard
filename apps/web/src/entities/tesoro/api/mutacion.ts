import { monedaLeida } from '@maun/domain';
import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  archivarElTesoro,
  crearTesoro,
  debeReintentarse,
  editarTesoro,
  filaPorId,
  householdDe,
  quitarFilaLocal,
  type CambiosDeTesoro,
  type FilaDe,
  type Replica,
  type TesoroNuevo,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

export const CLAVE_DE_TESORO_NUEVO = ['tesoros', 'crear'] as const;
export const CLAVE_DE_TESORO = ['tesoros', 'editar'] as const;
export const CLAVE_DE_ARCHIVO_DE_TESORO = ['tesoros', 'archivar'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface EdicionDeTesoro {
  id: string;
  cambios: CambiosDeTesoro;
  previos: CambiosDeTesoro;
}

export interface ArchivoDeTesoro {
  id: string;
  archivadoEn: string | null;
  previo: string | null;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function conTesoroNuevo(replica: Replica, nuevo: TesoroNuevo): Replica {
  const household = householdDe(replica);
  if (!household) return replica;

  const ahora = new Date().toISOString();
  const fila = {
    ...nuevo,
    household_id: household.id,
    clave: null,
    moneda: monedaLeida(nuevo.moneda),
    archivado_at: null,
    created_at: ahora,
    updated_at: ahora,
    deleted_at: null,
    version: 1,
  } satisfies FilaDe<'tesoros'>;

  return aplicarFilaLocal(replica, 'tesoros', fila);
}

function conCambios(replica: Replica, id: string, cambios: Partial<FilaDe<'tesoros'>>): Replica {
  const actual = filaPorId(replica, 'tesoros', id);
  if (!actual) return replica;
  return aplicarFilaLocal(replica, 'tesoros', { ...actual, ...cambios });
}

export const MUTACION_DE_TESORO_NUEVO: MutationOptions<FilaDe<'tesoros'>, unknown, TesoroNuevo> = {
  mutationKey: CLAVE_DE_TESORO_NUEVO,
  mutationFn: crearTesoro,
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async (nuevo, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conTesoroNuevo(replica, nuevo));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _nuevo, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'tesoros', fila));
  },
  onError: (_error, nuevo, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => quitarFilaLocal(replica, 'tesoros', nuevo.id));
  },
};

export const MUTACION_DE_TESORO: MutationOptions<FilaDe<'tesoros'>, unknown, EdicionDeTesoro> = {
  mutationKey: CLAVE_DE_TESORO,
  mutationFn: ({ id, cambios }) => editarTesoro(id, cambios),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ id, cambios }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conCambios(replica, id, cambios));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'tesoros', fila));
  },
  onError: (_error, { id, previos }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conCambios(replica, id, previos));
  },
};

export const MUTACION_DE_ARCHIVO_DE_TESORO: MutationOptions<
  FilaDe<'tesoros'>,
  unknown,
  ArchivoDeTesoro
> = {
  mutationKey: CLAVE_DE_ARCHIVO_DE_TESORO,
  mutationFn: ({ id, archivadoEn }) => archivarElTesoro(id, archivadoEn),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ id, archivadoEn }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conCambios(replica, id, { archivado_at: archivadoEn }));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'tesoros', fila));
  },
  onError: (_error, { id, previo }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conCambios(replica, id, { archivado_at: previo }));
  },
};
