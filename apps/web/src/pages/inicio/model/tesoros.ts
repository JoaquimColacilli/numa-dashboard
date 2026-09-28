import type { Money } from '@maun/domain';

import type { FraseDelDiezmo } from '@/entities/movimiento';
import type { TesoroDelTaller } from '@/entities/tesoro';

export const TESOROS_EN_UNA_FILA = 4;

export function porcentajeDeLaMeta(saldo: Money, meta: Money): number {
  return meta <= 0 ? 0 : Math.floor((saldo * 100) / meta);
}

export function conLaMetaDeCocos(
  tesoros: readonly TesoroDelTaller[],
  metaDeCocos: Money,
): TesoroDelTaller[] {
  return tesoros.map((tesoro) =>
    tesoro.clave === 'cocos' && tesoro.meta === null && metaDeCocos > 0
      ? { ...tesoro, meta: metaDeCocos }
      : tesoro,
  );
}

export function detalleDeLaTarjeta(
  tesoro: Pick<TesoroDelTaller, 'clave' | 'descripcion' | 'meta' | 'saldo'>,
  diezmo: FraseDelDiezmo,
): string {
  if (tesoro.clave === 'diezmo') return diezmo.detalle;
  if (tesoro.meta !== null && tesoro.meta > 0) {
    return `${String(porcentajeDeLaMeta(tesoro.saldo, tesoro.meta))}% de la meta`;
  }
  return tesoro.descripcion;
}

export interface TesoroConMeta {
  tesoro: TesoroDelTaller;
  meta: Money;
}

export function tesorosConMeta(tesoros: readonly TesoroDelTaller[]): TesoroConMeta[] {
  return tesoros.flatMap((tesoro) =>
    tesoro.meta !== null && tesoro.meta > 0 ? [{ tesoro, meta: tesoro.meta }] : [],
  );
}
