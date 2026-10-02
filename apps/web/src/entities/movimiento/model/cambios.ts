import {
  centavosEn,
  cotizacionDelCambio,
  importeDelTaller,
  MONEDA_DEL_TALLER,
  negar,
  pesosDeDolares,
  type Cotizacion,
  type Moneda,
  type Money,
  type MovimientoDelLibro,
} from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { diaYMesCorto, formatearPesos } from '@/shared/lib';

export type TipoDeCambio = 'compra' | 'venta';

export interface UltimoCambio {
  tipo: TipoDeCambio;
  fecha: string;
  cotizacion: Cotizacion;
}

export function cotizacionDeUnCambio(
  movimiento: Pick<MovimientoDelLibro, 'tipo' | 'monto' | 'montoDestino' | 'desdeId' | 'haciaId'>,
  monedaDe: (tesoro: string) => Moneda | undefined,
): { tipo: TipoDeCambio; cotizacion: Cotizacion } | null {
  const { montoDestino, desdeId, haciaId } = movimiento;
  if (movimiento.tipo !== 'cambio' || montoDestino === undefined || montoDestino === null) {
    return null;
  }
  if (desdeId === null || haciaId === null) return null;
  const origen = monedaDe(desdeId);
  const destino = monedaDe(haciaId);
  if (origen === MONEDA_DEL_TALLER && destino === 'USD') {
    const cotizacion = cotizacionDelCambio(
      importeDelTaller(movimiento.monto),
      centavosEn('USD', montoDestino),
    );
    return cotizacion === null ? null : { tipo: 'compra', cotizacion };
  }
  if (origen === 'USD' && destino === MONEDA_DEL_TALLER) {
    const cotizacion = cotizacionDelCambio(
      importeDelTaller(montoDestino),
      centavosEn('USD', movimiento.monto),
    );
    return cotizacion === null ? null : { tipo: 'venta', cotizacion };
  }
  return null;
}

export function ultimoCambio(
  movimientos: readonly MovimientoDelLibro[],
  monedaDe: (tesoro: string) => Moneda | undefined,
): UltimoCambio | null {
  let ultimo: (UltimoCambio & { id: string }) | null = null;
  for (const movimiento of movimientos) {
    const cambio = cotizacionDeUnCambio(movimiento, monedaDe);
    if (cambio === null) continue;
    const masNuevo =
      ultimo === null ||
      movimiento.fecha > ultimo.fecha ||
      (movimiento.fecha === ultimo.fecha && movimiento.id > ultimo.id);
    if (masNuevo) ultimo = { ...cambio, fecha: movimiento.fecha, id: movimiento.id };
  }
  return ultimo === null
    ? null
    : { tipo: ultimo.tipo, fecha: ultimo.fecha, cotizacion: ultimo.cotizacion };
}

export function ultimoCambioEntre(
  movimientos: readonly MovimientoDelLibro[],
  tesoros: readonly { id: string; moneda: Moneda }[],
): UltimoCambio | null {
  const monedas = new Map(tesoros.map((tesoro) => [tesoro.id, tesoro.moneda]));
  return ultimoCambio(movimientos, (tesoro) => monedas.get(tesoro));
}

export function equivalenteEnPesos(
  dolares: Money<'USD'>,
  cambio: UltimoCambio | null,
): string | null {
  if (cambio === null || dolares === 0) return null;
  const pesos =
    dolares < 0
      ? negar(pesosDeDolares(negar(dolares), cambio.cotizacion))
      : pesosDeDolares(dolares, cambio.cotizacion);
  const { tesoros } = mensajes();
  const decir =
    cambio.tipo === 'compra' ? tesoros.equivalenteDeLaCompra : tesoros.equivalenteDeLaVenta;
  return decir(
    formatearPesos(pesos),
    formatearPesos(cambio.cotizacion),
    diaYMesCorto(cambio.fecha),
  );
}
