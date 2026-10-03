import type {
  CoordinacionDeLaEntrega,
  MotivoDeLaEntrega,
  RespuestaDeEntregaParaMandar,
} from '@maun/domain';

export type MotivoDelError = MotivoDeLaEntrega | 'sin-senal' | 'no-se-pudo';

export type ResultadoDeMandar =
  | { tipo: 'guardada' }
  | { tipo: 'ya-confirmada' }
  | { tipo: 'cambio' }
  | { tipo: 'error'; motivo: MotivoDelError };

export type MandarLaEntrega = (
  respuesta: RespuestaDeEntregaParaMandar,
) => Promise<ResultadoDeMandar>;

export type CoordinacionConPedido = Exclude<CoordinacionDeLaEntrega, { situacion: 'sin-pedido' }>;
