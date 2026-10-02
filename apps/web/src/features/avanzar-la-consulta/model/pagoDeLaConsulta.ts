import { MONEDA_DEL_TALLER, monedaLeida, necesitaCotizacion, type Moneda } from '@maun/domain';

import {
  conOtraMoneda,
  dolarDelDiaDelTaller,
  dolarDelDiaParaUnPago,
  erroresDelValorDelPago,
  importeDelValor,
  monedaDeUnPagoNuevo,
  tesorosQueRecibenDolares,
  type DolarDelDiaDelTaller,
  type ErroresDelPago,
  type Pago,
  type Proyecto,
  type TesoroQueRecibeDolares,
  type ValorDelPago,
} from '@/entities/proyecto';
import { loQueDescuentaElPago, monedaDelTrabajo, type Replica } from '@/shared/api';

export interface ParaLosPagos {
  tesorosEnDolares: readonly TesoroQueRecibeDolares[];
  dolarDelDia: DolarDelDiaDelTaller | null;
}

export const SIN_DOLARES: ParaLosPagos = { tesorosEnDolares: [], dolarDelDia: null };

export function paraLosPagos(replica: Replica): ParaLosPagos {
  return {
    tesorosEnDolares: tesorosQueRecibenDolares(replica),
    dolarDelDia: dolarDelDiaDelTaller(replica),
  };
}

export function monedaDeLaConsulta(proyecto: Proyecto | undefined): Moneda {
  return proyecto === undefined ? MONEDA_DEL_TALLER : monedaDelTrabajo(proyecto);
}

export function pagoNuevo(
  proyecto: Proyecto | undefined,
  fecha: string,
  para: ParaLosPagos,
  monto: number | null = null,
): ValorDelPago {
  const delTrabajo = monedaDeLaConsulta(proyecto);
  const moneda = monedaDeUnPagoNuevo(proyecto, delTrabajo);
  const cotizacion = dolarDelDiaParaUnPago({ moneda, fecha }, delTrabajo, para.dolarDelDia);
  return conOtraMoneda(
    { moneda, monto, cotizacion, tesoroId: null },
    moneda,
    para.tesorosEnDolares,
  );
}

export function valorDelPagoGuardado(pago: Pago): ValorDelPago {
  const leido = pago as Partial<Pago>;
  return {
    moneda: monedaLeida(leido.moneda),
    monto: pago.monto_centavos,
    cotizacion: leido.cotizacion_centavos ?? null,
    tesoroId: leido.tesoro_id ?? null,
  };
}

export interface ClavesDelPago {
  moneda: Moneda;
  cotizacion_centavos: number | null;
  tesoro_id: string | null;
}

export function clavesDelPago(
  valor: Pick<ValorDelPago, 'moneda' | 'cotizacion' | 'tesoroId'>,
  delTrabajo: Moneda,
): ClavesDelPago {
  return {
    moneda: valor.moneda,
    cotizacion_centavos: necesitaCotizacion(valor.moneda, delTrabajo) ? valor.cotizacion : null,
    tesoro_id: valor.moneda === MONEDA_DEL_TALLER ? null : valor.tesoroId,
  };
}

export function mismasClaves(una: ClavesDelPago, otra: ClavesDelPago): boolean {
  return (
    una.moneda === otra.moneda &&
    una.cotizacion_centavos === otra.cotizacion_centavos &&
    una.tesoro_id === otra.tesoro_id
  );
}

export function cuantoDescuenta(valor: ValorDelPago, delTrabajo: Moneda): number | null {
  const importe = importeDelValor(valor);
  return importe === null ? null : loQueDescuentaElPago(importe, delTrabajo);
}

export function erroresDelPago(
  valor: ValorDelPago,
  delTrabajo: Moneda,
  tesorosEnDolares: readonly TesoroQueRecibeDolares[],
): ErroresDelPago {
  if ((valor.monto ?? 0) <= 0) return {};
  return erroresDelValorDelPago(valor, delTrabajo, tesorosEnDolares);
}

export function hayErroresEnElPago(errores: ErroresDelPago): boolean {
  return errores.cotizacion !== undefined || errores.tesoro !== undefined;
}
