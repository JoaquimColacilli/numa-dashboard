import { CERO, enPesos, restar, type Fila, type Money, type Plata } from '@maun/domain';

import { DESCRIPCION_DEL_TIPO, tiposDelTesoro } from '@/entities/fila';
import type { FraseDelDiezmo } from '@/entities/movimiento';
import { saldoEnPesos, type TesoroDelTaller } from '@/entities/tesoro';
import { formatearPesos } from '@/shared/lib';

export const TESOROS_EN_UNA_FILA = 4;

export function porcentajeDeLaMeta(saldo: Plata, meta: Plata): number {
  if (saldo.moneda !== meta.moneda || meta.importe <= 0) return 0;
  return Math.floor((saldo.importe * 100) / meta.importe);
}

export function conLaMetaDeCocos(
  tesoros: readonly TesoroDelTaller[],
  metaDeCocos: Money,
): TesoroDelTaller[] {
  return tesoros.map((tesoro) =>
    tesoro.clave === 'cocos' && tesoro.meta === null && metaDeCocos > 0
      ? { ...tesoro, meta: enPesos(metaDeCocos) }
      : tesoro,
  );
}

export function tipoEnLaTarjeta(fila: Fila, tesoro: string): string | null {
  const tipos = [
    ...new Set(tiposDelTesoro(fila, tesoro).map((tipo) => DESCRIPCION_DEL_TIPO[tipo])),
  ];
  if (tipos.length === 0) return null;
  const texto = tipos.join(' y ');
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

export function tiposEnLasTarjetas(
  fila: Fila,
  tesoros: readonly Pick<TesoroDelTaller, 'id'>[],
): Map<string, string> {
  const tipos = new Map<string, string>();
  for (const tesoro of tesoros) {
    const tipo = tipoEnLaTarjeta(fila, tesoro.id);
    if (tipo !== null) tipos.set(tesoro.id, tipo);
  }
  return tipos;
}

export function fraseDeLosInsumosDeMaun(insumos: Money, saldo: Money): string | null {
  if (insumos === 0) return null;
  if (insumos < 0) return `puso ${formatearPesos(restar(CERO, insumos))} en los trabajos`;
  return saldo < insumos
    ? `no alcanza para ${formatearPesos(insumos)} de insumos`
    : `${formatearPesos(insumos)} son insumos`;
}

export function detalleDeLaTarjeta(
  tesoro: Pick<TesoroDelTaller, 'clave' | 'descripcion' | 'meta' | 'saldo'>,
  diezmo: FraseDelDiezmo,
  insumos: Money = CERO,
): string {
  if (tesoro.clave === 'diezmo') return diezmo.detalle;
  const saldoDeMaun = tesoro.clave === 'maun' ? saldoEnPesos(tesoro) : null;
  if (saldoDeMaun !== null) {
    const deLosInsumos = fraseDeLosInsumosDeMaun(insumos, saldoDeMaun);
    if (deLosInsumos !== null) return deLosInsumos;
  }
  if (tesoro.meta !== null && tesoro.meta.importe > 0) {
    return `${String(porcentajeDeLaMeta(tesoro.saldo, tesoro.meta))}% de la meta`;
  }
  return tesoro.descripcion;
}

export interface TesoroConMeta {
  tesoro: TesoroDelTaller;
  meta: Plata;
}

export function tesorosConMeta(tesoros: readonly TesoroDelTaller[]): TesoroConMeta[] {
  return tesoros.flatMap((tesoro) =>
    tesoro.meta !== null && tesoro.meta.importe > 0 ? [{ tesoro, meta: tesoro.meta }] : [],
  );
}
