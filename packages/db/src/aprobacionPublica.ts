import {
  MOTIVOS_DE_LA_APROBACION,
  type AprobacionParaMandar,
  type MotivoDeLaAprobacion,
} from '@maun/domain';

import type { ClienteMaun } from './cliente.ts';
import type { Json } from './database.types.ts';
import { RespuestaInvalidaError } from './replica.ts';

export const CODIGO_DEL_RECHAZO_DE_LA_APROBACION = 'MN050';

export type ResultadoDeAprobar = 'guardada';

export function leerResultadoDeAprobar(valor: unknown): ResultadoDeAprobar {
  if (
    typeof valor !== 'object' ||
    valor === null ||
    Array.isArray(valor) ||
    (valor as Record<string, unknown>).estado !== 'guardada'
  ) {
    throw new RespuestaInvalidaError('El presupuesto no devolvió si se guardó la respuesta.');
  }
  return 'guardada';
}

export function motivoDelRechazoDeLaAprobacion(error: unknown): MotivoDeLaAprobacion | null {
  if (typeof error !== 'object' || error === null) return null;
  const { code, details } = error as Record<string, unknown>;
  if (code !== CODIGO_DEL_RECHAZO_DE_LA_APROBACION) return null;
  return MOTIVOS_DE_LA_APROBACION.find((motivo) => motivo === details) ?? null;
}

export async function aprobarElPresupuesto(
  cliente: ClienteMaun,
  token: string,
  aprobacion: AprobacionParaMandar,
): Promise<ResultadoDeAprobar> {
  const { data, error } = await cliente.rpc('responder_el_presupuesto', {
    p_token: token,
    p_respuesta: aprobacion as unknown as Json,
  });
  if (error) throw error;
  return leerResultadoDeAprobar(data);
}
