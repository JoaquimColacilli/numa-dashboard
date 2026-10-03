import { diasEntre, primeraPalabra } from '@maun/domain';

import type { MensajesDelCliente } from '@/shared/idioma-del-cliente';

export type TextosDelWhatsapp = MensajesDelCliente['whatsappDeLaEncuesta'];

export function nombreDelCliente(cliente: string): string | null {
  const nombre = primeraPalabra(cliente);
  return nombre === '' ? null : nombre;
}

export function mensajeDelPedido(
  textos: TextosDelWhatsapp,
  cliente: string,
  trabajo: string,
  enlace: string,
): string {
  return textos.pedido(nombreDelCliente(cliente), trabajo, enlace);
}

export function mensajeDelRecordatorio(
  textos: TextosDelWhatsapp,
  cliente: string,
  trabajo: string,
  enlace: string,
): string {
  return textos.recordatorio(nombreDelCliente(cliente), trabajo, enlace);
}

export function diasDespuesDeLaEntrega(entrega: string | null, contestada: string): number | null {
  if (entrega === null) return null;
  const dias = diasEntre(entrega, contestada);
  return dias < 0 ? null : dias;
}
