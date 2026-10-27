import type { AprobacionDeLaVista, AprobacionParaMandar, MotivoDeLaAprobacion } from '@maun/domain';

export type MotivoDeNoAprobar = MotivoDeLaAprobacion | 'sin-senal' | 'no-se-pudo';

export type ResultadoDeAprobar =
  { tipo: 'guardada' } | { tipo: 'error'; motivo: MotivoDeNoAprobar };

export type AprobarElPresupuesto = (
  aprobacion: AprobacionParaMandar,
) => Promise<ResultadoDeAprobar>;

export type AprobacionHecha = Extract<AprobacionDeLaVista, { situacion: 'aprobada' }>;

export function aprobacionHecha(
  aprobacion: AprobacionParaMandar,
  letra: string | null,
  hoy: string,
): AprobacionHecha {
  return {
    situacion: 'aprobada',
    opcionId: aprobacion.opcion_id,
    letra,
    respondidaEl: hoy,
    dia: aprobacion.dia,
    franja: aprobacion.franja,
  };
}
