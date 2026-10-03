import {
  instanciasPendientes,
  MONEDA_DEL_TALLER,
  type FormaDeCobro,
  type InstanciaDePago,
  type Moneda,
} from '@maun/domain';

import {
  cobraEnDolares,
  cobraEnPesos,
  elTallerRecibeDolares,
  elTallerRecibeTransferencias,
  formasDelTrabajo,
  monedasGuardadas,
  senaDelProyecto,
  senaDelTaller,
  type FormasDeCobroDelTrabajo,
  type Proyecto,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import type { FilaDe } from '@/shared/api';

export interface FilaDeCobro {
  instancia: InstanciaDePago;
  formas: readonly FormaDeCobro[];
}

export function filasDeCobro(
  resumen: ResumenDeProyecto,
  ajustes: FilaDe<'ajustes'> | undefined,
): readonly FilaDeCobro[] {
  const { proyecto } = resumen;
  const pendientes = instanciasPendientes({
    presupuesto: proyecto.presupuesto_centavos === null ? null : resumen.precio.importe,
    cobrado: resumen.cobradoEnSuMoneda.importe,
    porcentajeDelTaller: senaDelTaller(ajustes),
    porcentajeDelTrabajo: senaDelProyecto(proyecto),
  });

  return pendientes.map((instancia) => ({
    instancia,
    formas: formasDelTrabajo(proyecto, instancia, ajustes),
  }));
}

export const COBROS_DEL_TRABAJO = ['pesos', 'dolares', 'pesosODolares'] as const;

export type CobroDelTrabajo = (typeof COBROS_DEL_TRABAJO)[number];

const MONEDAS_DE_CADA_COBRO: Readonly<Record<CobroDelTrabajo, readonly Moneda[]>> = {
  pesos: [MONEDA_DEL_TALLER],
  dolares: ['USD'],
  pesosODolares: [MONEDA_DEL_TALLER, 'USD'],
};

export function cobroElegido(proyecto: Proyecto): CobroDelTrabajo {
  if (!cobraEnDolares(proyecto)) return 'pesos';
  return cobraEnPesos(proyecto) ? 'pesosODolares' : 'dolares';
}

export function cambioDelCobro(
  proyecto: Proyecto,
  cobro: CobroDelTrabajo,
): FormasDeCobroDelTrabajo | null {
  if (cobroElegido(proyecto) === cobro) return null;
  const guardadas = monedasGuardadas(proyecto);
  return {
    id: proyecto.id,
    cambios: { cobra_en: [...MONEDAS_DE_CADA_COBRO[cobro]] },
    previos: { cobra_en: guardadas === null ? null : [...guardadas] },
    version: proyecto.version,
  };
}

export interface CuentasQueFaltan {
  enPesos: boolean;
  enDolares: boolean;
}

export function cuentasQueFaltan(
  proyecto: Proyecto,
  ajustes: FilaDe<'ajustes'> | undefined,
): CuentasQueFaltan {
  return {
    enPesos: cobraEnPesos(proyecto) && !elTallerRecibeTransferencias(ajustes),
    enDolares: cobraEnDolares(proyecto) && !elTallerRecibeDolares(ajustes),
  };
}
