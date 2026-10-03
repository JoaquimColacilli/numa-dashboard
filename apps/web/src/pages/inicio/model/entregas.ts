import type { AvisoDeEntrega } from '@/entities/entrega';
import { fechaConSuFranja } from '@/entities/proyecto';
import { mensajes } from '@/shared/idioma';

export function tituloDelAviso(aviso: AvisoDeEntrega, hoy: string): string {
  const textos = mensajes().paginaInicio.respuestas;
  const sinNombre = aviso.cliente === '';
  if (aviso.respuesta === 'mis_dias') {
    return sinNombre ? textos.tuClienteTePasoSusDias : textos.tePasoSusDias(aviso.cliente);
  }
  if (aviso.fecha === null) {
    return sinNombre
      ? textos.tuClienteAceptoElDiaQueLePropusiste
      : textos.aceptoElDiaQueLePropusiste(aviso.cliente);
  }
  const fecha = fechaConSuFranja(aviso.fecha, aviso.franja, hoy);
  return sinNombre ? textos.tuClienteAceptoEl(fecha) : textos.aceptoEl(aviso.cliente, fecha);
}
