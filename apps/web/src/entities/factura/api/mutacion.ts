import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  filaPorId,
  marcarLaAlertaRevisada,
  pedirLaFacturaDelPago,
  pedirLaNotaDeCreditoDeLaFactura,
  type AlertaParaDescartar,
  type FacturaParaPedir,
  type FilaDe,
  type NotaDeCreditoParaPedir,
  type Replica,
} from '@/shared/api';
import { claveDeTodaReplica, COLA_DE_SALIDA, guardarCacheAhora } from '@/shared/lib';

import { conLaAlertaRevisada } from '../model/alertas';

export const CLAVE_DE_LA_FACTURA = ['comprobantes', 'pedir-la-factura'] as const;
export const CLAVE_DE_LA_NOTA_DE_CREDITO = ['comprobantes', 'pedir-la-nota-de-credito'] as const;
export const CLAVE_DE_LA_ALERTA_REVISADA = ['ajustes', 'alerta-de-la-facturacion'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface PedidoDeLaFactura {
  pedido: FacturaParaPedir;
  proyectoId: string;
}

export interface PedidoDeLaNotaDeCredito {
  pedido: NotaDeCreditoParaPedir;
  pagoId: string;
  proyectoId: string;
}

export interface AlertaRevisada {
  alerta: AlertaParaDescartar;
  previos: FilaDe<'ajustes'>;
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function comprobanteSiNoEsViejo(replica: Replica, fila: FilaDe<'comprobantes'>): Replica {
  const actual = filaPorId(replica, 'comprobantes', fila.id);
  if (actual && actual.version > fila.version) return replica;
  return aplicarFilaLocal(replica, 'comprobantes', fila);
}

function ajustesSiNoSonViejos(replica: Replica, fila: FilaDe<'ajustes'>): Replica {
  const actual = filaPorId(replica, 'ajustes', fila.id);
  if (actual && actual.version > fila.version) return replica;
  return aplicarFilaLocal(replica, 'ajustes', fila);
}

export const MUTACION_DE_LA_FACTURA: MutationOptions<
  FilaDe<'comprobantes'>,
  unknown,
  PedidoDeLaFactura
> = {
  mutationKey: CLAVE_DE_LA_FACTURA,
  mutationFn: ({ pedido }) => pedirLaFacturaDelPago(pedido),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async () => {
    await guardarCacheAhora();
  },
  onSuccess: (fila, _pedido, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => comprobanteSiNoEsViejo(replica, fila));
  },
};

export const MUTACION_DE_LA_NOTA_DE_CREDITO: MutationOptions<
  FilaDe<'comprobantes'>,
  unknown,
  PedidoDeLaNotaDeCredito
> = {
  mutationKey: CLAVE_DE_LA_NOTA_DE_CREDITO,
  mutationFn: ({ pedido }) => pedirLaNotaDeCreditoDeLaFactura(pedido),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async () => {
    await guardarCacheAhora();
  },
  onSuccess: (fila, _pedido, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => comprobanteSiNoEsViejo(replica, fila));
  },
};

export const MUTACION_DE_LA_ALERTA_REVISADA: MutationOptions<
  FilaDe<'ajustes'>,
  unknown,
  AlertaRevisada
> = {
  mutationKey: CLAVE_DE_LA_ALERTA_REVISADA,
  mutationFn: ({ alerta }) => marcarLaAlertaRevisada(alerta),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ alerta, previos }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      aplicarFilaLocal(replica, 'ajustes', conLaAlertaRevisada(previos, alerta)),
    );
    await guardarCacheAhora();
  },
  onSuccess: (fila, _revisada, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => ajustesSiNoSonViejos(replica, fila));
  },
  onError: (_error, { previos }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'ajustes', previos));
  },
};
