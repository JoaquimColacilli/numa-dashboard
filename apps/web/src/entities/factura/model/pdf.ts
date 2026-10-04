import {
  centavos,
  esCondicionDelReceptor,
  esTipoDeComprobante,
  type TipoDeDocumento,
} from '@maun/domain';

import type { Json } from '@/shared/api';
import type { EmisorEnPdf, FacturaEnPdf } from '@/shared/pdf';

import { esDePrueba, type Comprobante } from './situacion';

function textoDe(objeto: Readonly<Record<string, Json | undefined>>, clave: string): string {
  const valor = objeto[clave];
  return typeof valor === 'string' ? valor : '';
}

export function emisorDe(emisor: Json): EmisorEnPdf {
  const objeto =
    typeof emisor === 'object' && emisor !== null && !Array.isArray(emisor) ? emisor : {};
  const inicio = textoDe(objeto, 'inicioDeActividades');
  return {
    nombreDelTaller: textoDe(objeto, 'nombreDelTaller'),
    razonSocial: textoDe(objeto, 'razonSocial'),
    domicilio: textoDe(objeto, 'domicilio'),
    cuit: textoDe(objeto, 'cuit'),
    ingresosBrutos: textoDe(objeto, 'ingresosBrutos'),
    inicioDeActividades: inicio === '' ? null : inicio,
  };
}

function esDocumento(valor: number): valor is TipoDeDocumento {
  return valor === 80 || valor === 96 || valor === 99;
}

export function facturaEnPdf(
  comprobante: Comprobante,
  anulada: Comprobante | null = null,
): FacturaEnPdf | null {
  const { numero, fecha, cae, cae_vence: caeVence } = comprobante;
  if (
    numero === null ||
    fecha === null ||
    cae === null ||
    caeVence === null ||
    !esTipoDeComprobante(comprobante.tipo) ||
    !esCondicionDelReceptor(comprobante.receptor_condicion) ||
    !esDocumento(comprobante.doc_tipo)
  ) {
    return null;
  }
  const anulaA =
    comprobante.tipo === 'nota_de_credito_c' &&
    anulada !== null &&
    anulada.numero !== null &&
    anulada.fecha !== null
      ? { puntoDeVenta: anulada.punto_de_venta, numero: anulada.numero, fecha: anulada.fecha }
      : null;
  return {
    tipo: comprobante.tipo,
    prueba: esDePrueba(comprobante),
    puntoDeVenta: comprobante.punto_de_venta,
    numero,
    fecha,
    cae,
    caeVence,
    importe: centavos(comprobante.importe_centavos),
    detalle: comprobante.detalle,
    emisor: emisorDe(comprobante.emisor),
    receptor: {
      nombre: comprobante.receptor_nombre,
      condicion: comprobante.receptor_condicion,
      docTipo: comprobante.doc_tipo,
      docNro: comprobante.doc_nro,
      domicilio: comprobante.receptor_domicilio,
    },
    anulaA,
  };
}
