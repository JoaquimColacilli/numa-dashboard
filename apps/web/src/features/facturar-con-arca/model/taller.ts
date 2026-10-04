import {
  categoriaLeida,
  conceptoLeido,
  esAmbienteDeArca,
  type AmbienteDeArca,
  type CategoriaDelMonotributo,
  type ConceptoDeArca,
} from '@maun/domain';

import type { TallerQueFactura } from '@/entities/factura';
import type { FilaDe } from '@/shared/api';

type AjustesQuePuedenFaltar = Partial<FilaDe<'ajustes'>> | undefined;

export interface FacturacionDelTaller extends TallerQueFactura {
  ambiente: AmbienteDeArca | null;
  puntoDeVenta: number | null;
  concepto: ConceptoDeArca;
  categoria: CategoriaDelMonotributo | null;
  desde: string | null;
}

export function facturacionDelTaller(ajustes: AjustesQuePuedenFaltar): FacturacionDelTaller {
  const crudo = ajustes?.facturacion_ambiente;
  const ambiente = esAmbienteDeArca(crudo) ? crudo : null;
  return {
    ambiente,
    conectado: ambiente !== null,
    enPrueba: ambiente === 'homologacion',
    monotributista: ajustes?.taller_condicion_fiscal === 'monotributo',
    puntoDeVenta: ajustes?.facturacion_punto_de_venta ?? null,
    concepto: conceptoLeido(ajustes?.facturacion_concepto),
    categoria: categoriaLeida(ajustes?.facturacion_categoria),
    desde: ajustes?.facturacion_desde ?? null,
  };
}
