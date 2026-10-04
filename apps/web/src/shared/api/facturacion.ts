import {
  bajarElPedidoDelCertificado,
  conectarConArca,
  descartarLaAlertaDeFacturacion,
  pedirLaFactura,
  pedirLaNotaDeCredito,
  subirElCertificado,
  traerElEstadoDeLaFacturacion,
  type AlertaParaDescartar,
  type Contestado,
  type EstadoDeLaFacturacion,
  type FacturaParaPedir,
  type FilaDe,
  type MotivoDeLaConexion,
  type MotivoDeLaSubida,
  type MotivoDelPedido,
  type NotaDeCreditoParaPedir,
} from '@maun/db';

import { clienteMaun } from './cliente';

export function pedirLaFacturaDelPago(pedido: FacturaParaPedir): Promise<FilaDe<'comprobantes'>> {
  return pedirLaFactura(clienteMaun(), pedido);
}

export function pedirLaNotaDeCreditoDeLaFactura(
  pedido: NotaDeCreditoParaPedir,
): Promise<FilaDe<'comprobantes'>> {
  return pedirLaNotaDeCredito(clienteMaun(), pedido);
}

export function marcarLaAlertaRevisada(alerta: AlertaParaDescartar): Promise<FilaDe<'ajustes'>> {
  return descartarLaAlertaDeFacturacion(clienteMaun(), alerta);
}

export function estadoDeLaFacturacion(): Promise<EstadoDeLaFacturacion> {
  return traerElEstadoDeLaFacturacion(clienteMaun());
}

export function bajarElPedidoDelCertificadoDeArca(): Promise<Contestado<string, MotivoDelPedido>> {
  return bajarElPedidoDelCertificado(clienteMaun());
}

export function subirElCertificadoDeArca(
  certificado: string,
): Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaSubida>> {
  return subirElCertificado(clienteMaun(), certificado);
}

export function conectarElTallerConArca(
  puntoDeVenta: number,
): Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaConexion>> {
  return conectarConArca(clienteMaun(), puntoDeVenta);
}
