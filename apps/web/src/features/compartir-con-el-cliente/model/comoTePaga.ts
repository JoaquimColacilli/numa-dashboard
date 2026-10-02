import { instanciasPendientes, type FormaDeCobro, type InstanciaDePago } from '@maun/domain';

import {
  formasDelTrabajo,
  senaDelProyecto,
  senaDelTaller,
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
