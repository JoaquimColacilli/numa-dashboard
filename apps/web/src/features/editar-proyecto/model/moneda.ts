import {
  centavosEn,
  cotizacionLeida,
  dolaresDePesos,
  leerDocumento,
  MONEDA_DEL_TALLER,
  pesosDeDolares,
  type Cotizacion,
  type Moneda,
} from '@maun/domain';

import { presupuestoDelTrabajo, ultimaRevision } from '@/entities/presupuesto';
import type { FilaDePago, FormularioDeProyecto } from '@/entities/proyecto';
import type { Replica } from '@/shared/api';
import { errorDelDolar } from '@/shared/ui';

export type QueHacerConLosImportes = 'pasarlos' | 'dejarlosEnBlanco';

export interface CambioDeMoneda {
  hacia: Moneda;
  conLosImportes: QueHacerConLosImportes;
  dolar: number | null;
  dolaresDeLosPagos: Readonly<Record<string, number | null>>;
}

export interface ErroresDelCambio {
  dolar?: string;
  pagos: Readonly<Record<string, string>>;
}

type LoQueCambia = Pick<FormularioDeProyecto, 'moneda' | 'presupuesto' | 'opciones' | 'pagos'>;

export function hayImportes(
  valores: Pick<FormularioDeProyecto, 'presupuesto' | 'opciones'>,
): boolean {
  return (
    (valores.presupuesto ?? 0) > 0 || valores.opciones.some((opcion) => (opcion.monto ?? 0) > 0)
  );
}

export function pagosQuePidenSuDolar(
  pagos: readonly FilaDePago[],
  hacia: Moneda,
): readonly FilaDePago[] {
  if (hacia === MONEDA_DEL_TALLER) return [];
  return pagos.filter((pago) => pago.moneda === MONEDA_DEL_TALLER && (pago.monto ?? 0) > 0);
}

export function convertir(monto: number | null, hacia: Moneda, dolar: Cotizacion): number | null {
  if (monto === null || monto < 0) return monto;
  return hacia === MONEDA_DEL_TALLER
    ? pesosDeDolares(centavosEn('USD', monto), dolar)
    : dolaresDePesos(centavosEn(MONEDA_DEL_TALLER, monto), dolar);
}

export function erroresDelCambio(
  valores: Pick<FormularioDeProyecto, 'presupuesto' | 'opciones' | 'pagos'>,
  cambio: CambioDeMoneda,
): ErroresDelCambio {
  const pagos: Record<string, string> = {};
  for (const pago of pagosQuePidenSuDolar(valores.pagos, cambio.hacia)) {
    const error = errorDelDolar(cambio.dolaresDeLosPagos[pago.id] ?? null);
    if (error !== undefined) pagos[pago.id] = error;
  }
  const conDolar = hayImportes(valores) && cambio.conLosImportes === 'pasarlos';
  const dolar = conDolar ? errorDelDolar(cambio.dolar) : undefined;
  return dolar === undefined ? { pagos } : { dolar, pagos };
}

export function hayErroresEnElCambio(errores: ErroresDelCambio): boolean {
  return errores.dolar !== undefined || Object.keys(errores.pagos).length > 0;
}

export function conLaOtraMoneda(valores: LoQueCambia, cambio: CambioDeMoneda): LoQueCambia {
  const dolar = cotizacionLeida(cambio.dolar);
  const importe = (monto: number | null) =>
    cambio.conLosImportes === 'dejarlosEnBlanco' || dolar === null
      ? null
      : convertir(monto, cambio.hacia, dolar);
  return {
    moneda: cambio.hacia,
    presupuesto: importe(valores.presupuesto),
    opciones: valores.opciones.map((opcion) => ({ ...opcion, monto: importe(opcion.monto) })),
    pagos: valores.pagos.map((pago) => {
      const suDolar = cambio.dolaresDeLosPagos[pago.id];
      return suDolar === undefined ? pago : { ...pago, cotizacion: suDolar };
    }),
  };
}

export function monedaDeLoMandado(replica: Replica, proyectoId: string | undefined): Moneda | null {
  if (proyectoId === undefined) return null;
  const presupuesto = presupuestoDelTrabajo(replica, proyectoId);
  if (presupuesto === null) return null;
  const ultima = ultimaRevision(replica, presupuesto.id);
  if (ultima === null) return null;
  const documento = leerDocumento(ultima.contenido);
  if (documento === null) return null;
  return documento.forma === 2 ? documento.moneda : MONEDA_DEL_TALLER;
}
