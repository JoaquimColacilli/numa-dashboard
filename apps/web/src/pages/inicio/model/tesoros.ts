import { CERO, enPesos, restar, type Fila, type Money, type Plata } from '@maun/domain';

import { nombreDeLoQueEs, paraCuandoEsLaMeta } from '@/entities/fila';
import type { FraseDelDiezmo } from '@/entities/movimiento';
import { saldoEnPesos, type TesoroDelTaller } from '@/entities/tesoro';
import { mensajes } from '@/shared/idioma';
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

export function tipoEnLaTarjeta(
  fila: Fila,
  tesoro: Pick<TesoroDelTaller, 'id' | 'clave' | 'meta' | 'moneda'>,
): string {
  return nombreDeLoQueEs(fila, tesoro);
}

export function tiposEnLasTarjetas(
  fila: Fila,
  tesoros: readonly Pick<TesoroDelTaller, 'id' | 'clave' | 'meta' | 'moneda'>[],
): Map<string, string> {
  return new Map(tesoros.map((tesoro) => [tesoro.id, tipoEnLaTarjeta(fila, tesoro)]));
}

export function fraseDeLosInsumosDeMaun(insumos: Money, saldo: Money): string | null {
  const textos = mensajes().paginaInicio.tarjetas;
  if (insumos === 0) return null;
  if (insumos < 0) return textos.pusoEnLosTrabajos(formatearPesos(restar(CERO, insumos)));
  return saldo < insumos
    ? textos.noAlcanzaParaLosInsumos(formatearPesos(insumos))
    : textos.sonInsumos(formatearPesos(insumos));
}

export interface DetalleDeLaTarjeta {
  texto: string;
  delDueno: boolean;
}

export function detalleDeLaTarjeta(
  tesoro: Pick<TesoroDelTaller, 'clave' | 'descripcion' | 'meta' | 'metaFecha' | 'saldo'>,
  diezmo: FraseDelDiezmo,
  insumos: Money = CERO,
): DetalleDeLaTarjeta {
  if (tesoro.clave === 'diezmo') return { texto: diezmo.detalle, delDueno: false };
  const saldoDeMaun = tesoro.clave === 'maun' ? saldoEnPesos(tesoro) : null;
  if (saldoDeMaun !== null) {
    const deLosInsumos = fraseDeLosInsumosDeMaun(insumos, saldoDeMaun);
    if (deLosInsumos !== null) return { texto: deLosInsumos, delDueno: false };
  }
  if (tesoro.meta !== null && tesoro.meta.importe > 0) {
    const textos = mensajes().paginaInicio.tarjetas;
    const porcentaje = porcentajeDeLaMeta(tesoro.saldo, tesoro.meta);
    const para = paraCuandoEsLaMeta(tesoro.metaFecha);
    return {
      texto: para === null ? textos.deLaMeta(porcentaje) : textos.deLaMetaPara(porcentaje, para),
      delDueno: false,
    };
  }
  return { texto: tesoro.descripcion, delDueno: true };
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
