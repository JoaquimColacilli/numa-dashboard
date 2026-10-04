import {
  centavos,
  documentoDelReceptor,
  esCondicionDelReceptor,
  loQueFaltaParaFacturar,
  monedaLeida,
  operacionDelTrabajo,
  type ClienteDeLaFactura,
  type DocumentoOLoQueFalta,
  type LoQueFaltaParaFacturar,
  type Money,
} from '@maun/domain';

import type { FilaDe } from '@/shared/api';

import { datosDelTallerQueFactura } from './taller';

export function clienteDeLaFactura(
  cliente: Partial<FilaDe<'clientes'>> | undefined,
): ClienteDeLaFactura {
  const condicion = cliente?.condicion_fiscal;
  return {
    condicion: esCondicionDelReceptor(condicion) ? condicion : 'consumidor_final',
    cuit: cliente?.cuit ?? '',
    dni: cliente?.dni ?? '',
    nombre: cliente?.nombre ?? '',
    razonSocial: cliente?.razon_social ?? '',
    domicilioFiscal: cliente?.domicilio_fiscal ?? '',
    direccion: cliente?.direccion ?? '',
  };
}

export interface LoQueSeFactura {
  ajustes: Partial<FilaDe<'ajustes'>> | undefined;
  proyecto: Pick<FilaDe<'proyectos'>, 'moneda' | 'deleted_at' | 'presupuesto_centavos'>;
  cliente: ClienteDeLaFactura;
  pago: { moneda: string; borrado: boolean; yaEnLaApertura: boolean };
  cobrado: Money;
}

function precioDe(proyecto: LoQueSeFactura['proyecto']): Money | null {
  return proyecto.presupuesto_centavos === null ? null : centavos(proyecto.presupuesto_centavos);
}

export function faltasParaFacturar(datos: LoQueSeFactura): LoQueFaltaParaFacturar[] {
  const { proyecto, pago, cliente, cobrado } = datos;
  return loQueFaltaParaFacturar({
    taller: datosDelTallerQueFactura(datos.ajustes),
    trabajo: {
      moneda: monedaLeida(proyecto.moneda),
      borrado: proyecto.deleted_at !== null,
      precio: precioDe(proyecto),
      cobrado,
    },
    pago: {
      moneda: monedaLeida(pago.moneda),
      borrado: pago.borrado,
      yaEnLaApertura: pago.yaEnLaApertura,
    },
    cliente,
  });
}

export function documentoParaFacturar(datos: LoQueSeFactura): DocumentoOLoQueFalta {
  return documentoDelReceptor(
    datos.cliente,
    operacionDelTrabajo(precioDe(datos.proyecto), datos.cobrado),
  );
}
