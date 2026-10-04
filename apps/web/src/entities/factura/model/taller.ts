import {
  categoriaLeida,
  conceptoLeido,
  CONDICIONES_FISCALES,
  esAmbienteDeArca,
  type AmbienteDeArca,
  type CategoriaDelMonotributo,
  type ConceptoDeArca,
  type CondicionFiscal,
  type TallerQueFactura as DatosDelTallerQueFactura,
} from '@maun/domain';

import type { FilaDe } from '@/shared/api';

import type { TallerQueFactura } from './situacion';

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

function condicionDelTaller(valor: string | null | undefined): CondicionFiscal | null {
  return CONDICIONES_FISCALES.find((condicion) => condicion === valor) ?? null;
}

export function datosDelTallerQueFactura(
  ajustes: AjustesQuePuedenFaltar,
): DatosDelTallerQueFactura {
  return {
    condicion: condicionDelTaller(ajustes?.taller_condicion_fiscal),
    razonSocial: ajustes?.taller_titular ?? '',
    domicilio: ajustes?.taller_domicilio ?? '',
    ingresosBrutos: ajustes?.facturacion_ingresos_brutos ?? '',
    inicioDeActividades: ajustes?.facturacion_inicio_de_actividades ?? null,
  };
}
