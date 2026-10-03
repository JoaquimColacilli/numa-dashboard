import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  editarAjustes,
  filaPorId,
  type CambiosDeAjustes,
  type FilaDe,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

export const CLAVE_DE_AJUSTES = ['ajustes', 'editar'] as const;

const REINTENTOS = 5;
const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface EdicionDeAjustes {
  id: string;
  cambios: CambiosDeAjustes;
  previos: CambiosDeAjustes;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

const CAMBIAN_LA_FILA_DE_SIEMPRE = [
  'sueldo_mensual_centavos',
  'costos_fijos_centavos',
  'sueldo_tope_mensual',
] as const;

const CAMBIAN_EL_PERDIDO = ['perdido_con_sueldo', 'perdido_con_diezmo'] as const;

export function cambiaElReparto(
  actual: FilaDe<'ajustes'>,
  cambios: Partial<FilaDe<'ajustes'>>,
): boolean {
  const distinto = (columna: keyof FilaDe<'ajustes'>) =>
    columna in cambios && cambios[columna] !== actual[columna];
  const sinFila = ((actual as Partial<FilaDe<'ajustes'>>).fila ?? null) === null;
  return (
    (sinFila && CAMBIAN_LA_FILA_DE_SIEMPRE.some(distinto)) || CAMBIAN_EL_PERDIDO.some(distinto)
  );
}

function conAjustes(
  replica: Replica,
  id: string,
  cambios: CambiosDeAjustes,
  sentido: 1 | -1,
): Replica {
  const actual = filaPorId(replica, 'ajustes', id);
  if (!actual) return replica;
  const revision = (actual as Partial<FilaDe<'ajustes'>>).fila_version ?? 0;
  return aplicarFilaLocal(replica, 'ajustes', {
    ...actual,
    ...cambios,
    fila_version: cambiaElReparto(actual, cambios) ? revision + sentido : revision,
  });
}

export const MUTACION_DE_AJUSTES: MutationOptions<FilaDe<'ajustes'>, unknown, EdicionDeAjustes> = {
  mutationKey: CLAVE_DE_AJUSTES,
  mutationFn: ({ id, cambios }) => editarAjustes(id, cambios),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ id, cambios }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) => conAjustes(replica, id, cambios, 1));
    await guardarCacheAhora();
  },
  onSuccess: (fila, _variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'ajustes', fila));
  },
  onError: (_error, { id, previos }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => conAjustes(replica, id, previos, -1));
  },
};
