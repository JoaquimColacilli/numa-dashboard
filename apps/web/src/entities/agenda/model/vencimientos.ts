import type { EventoVencimiento, RangoDeLaAgenda, VencimientoDeLaAgenda } from '@maun/domain';

import { datosDeLaAgendaDeLaReplica, type Replica } from '@/shared/api';
import { PARAMETRO_DE_TESORO, RUTA_DE_TESOROS } from '@/shared/lib';

export function vencimientosDeLaReplica(
  replica: Replica,
  rango: RangoDeLaAgenda,
): VencimientoDeLaAgenda[] {
  return datosDeLaAgendaDeLaReplica(replica, rango).vencimientos.filter(
    (vencimiento) => vencimiento.fecha >= rango.desde && vencimiento.fecha <= rango.hasta,
  );
}

export function rutaDelVencimiento(vencimiento: Pick<EventoVencimiento, 'tesoro'>): string {
  const parametros = new URLSearchParams({ [PARAMETRO_DE_TESORO]: vencimiento.tesoro });
  return `${RUTA_DE_TESOROS}?${parametros.toString()}`;
}

export function sePuedeRegistrarElPago(
  vencimiento: Pick<EventoVencimiento, 'fecha' | 'hecha'>,
  hoy: string,
): boolean {
  return !vencimiento.hecha && vencimiento.fecha.slice(0, 7) <= hoy.slice(0, 7);
}

export function fechaDelPagoPropuesta(
  vencimiento: Pick<EventoVencimiento, 'fecha'>,
  hoy: string,
): string | null {
  return vencimiento.fecha.slice(0, 7) < hoy.slice(0, 7) ? vencimiento.fecha : null;
}
