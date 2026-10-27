import {
  ajusteDelSaldo,
  motivoDelAjuste,
  type AjusteDelSaldo,
  type Moneda,
  type Money,
  type MOTIVOS_DEL_AJUSTE,
} from '@maun/domain';

import type { MovimientoNuevo } from '@/shared/api';

export type MotivoDeLaLista = (typeof MOTIVOS_DEL_AJUSTE)[number];

export type MotivoDelAjuste =
  { de: 'lista'; motivo: MotivoDeLaLista } | { de: 'libre'; texto: string };

export const SIN_MOTIVO: MotivoDelAjuste = { de: 'libre', texto: '' };

export function categoriaDelAjuste(motivo: MotivoDelAjuste): string {
  return motivo.de === 'lista' ? motivo.motivo : (motivoDelAjuste(motivo.texto) ?? '');
}

export function diferenciaDelAjuste<M extends Moneda>(
  saldo: Money<M>,
  tieneAhora: Money<M> | null,
): AjusteDelSaldo<M> | null {
  return tieneAhora === null ? null : ajusteDelSaldo(saldo, tieneAhora);
}

export function movimientoDelAjuste({
  id,
  tesoro,
  ajuste,
  motivo,
  fecha,
}: {
  id: string;
  tesoro: string;
  ajuste: AjusteDelSaldo;
  motivo: MotivoDelAjuste;
  fecha: string;
}): MovimientoNuevo {
  return {
    id,
    fecha,
    tipo: 'ajuste',
    desde_id: ajuste.sentido === 'resta' ? tesoro : null,
    hacia_id: ajuste.sentido === 'suma' ? tesoro : null,
    monto_centavos: ajuste.monto,
    categoria: categoriaDelAjuste(motivo),
    descripcion: '',
  };
}
