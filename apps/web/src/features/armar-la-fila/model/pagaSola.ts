import {
  CATEGORIA_DE_LA_PLATA_DE_ANTES,
  CATEGORIA_DE_YA_NO_ESTA,
  cicloDeLaFecha,
  pasanAPagarseSolos,
  plataDeAntesDelCiclo,
  type DatosDelMes,
  type Fila,
  type Money,
} from '@maun/domain';

import type { MovimientoNuevo } from '@/shared/api';

export type QueHacerConLaPlata =
  { que: 'maun' } | { que: 'otro'; hacia: string | null } | { que: 'ya-no-esta' };

export interface QueSePagaSolo {
  tesoro: string;
  desde: string;
  plataDeAntes: Money;
}

export function loQueSePagaSolo(
  guardada: Fila,
  fila: Fila,
  datos: Pick<DatosDelMes, 'liquidaciones' | 'coberturas' | 'saldos' | 'gastos'>,
  hoy: string,
): QueSePagaSolo[] {
  return pasanAPagarseSolos(guardada, fila).flatMap((paso) => {
    if (paso.dia === null) return [];
    return [
      {
        tesoro: paso.tesoro,
        desde: cicloDeLaFecha(hoy, paso.dia).hasta,
        plataDeAntes: plataDeAntesDelCiclo(paso, datos, hoy),
      },
    ];
  });
}

export function faltaElegir(
  pagos: readonly QueSePagaSolo[],
  elegidos: Readonly<Record<string, QueHacerConLaPlata | undefined>>,
): boolean {
  return pagos.some((pago) => {
    if (pago.plataDeAntes <= 0) return false;
    const elegido = elegidos[pago.tesoro];
    return elegido === undefined || (elegido.que === 'otro' && elegido.hacia === null);
  });
}

export function movimientosDeLaPlataDeAntes(
  pagos: readonly QueSePagaSolo[],
  elegidos: Readonly<Record<string, QueHacerConLaPlata | undefined>>,
  maun: string,
  hoy: string,
  nuevoId: () => string,
): MovimientoNuevo[] {
  return pagos.flatMap((pago): MovimientoNuevo[] => {
    const elegido = elegidos[pago.tesoro];
    if (pago.plataDeAntes <= 0 || elegido === undefined) return [];
    const comun = {
      id: nuevoId(),
      fecha: hoy,
      monto_centavos: pago.plataDeAntes,
      desde_id: pago.tesoro,
      descripcion: '',
    };
    if (elegido.que === 'ya-no-esta') {
      return [{ ...comun, tipo: 'ajuste', hacia_id: null, categoria: CATEGORIA_DE_YA_NO_ESTA }];
    }
    const hacia = elegido.que === 'maun' ? maun : elegido.hacia;
    if (hacia === null || hacia === pago.tesoro) return [];
    return [
      {
        ...comun,
        tipo: 'transferencia',
        hacia_id: hacia,
        categoria: CATEGORIA_DE_LA_PLATA_DE_ANTES,
      },
    ];
  });
}
