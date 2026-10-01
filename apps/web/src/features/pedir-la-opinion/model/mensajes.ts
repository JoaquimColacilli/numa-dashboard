import { diasEntre, elMueble, enPalabras, primeraPalabra } from '@maun/domain';

function saludo(cliente: string): string {
  const nombre = primeraPalabra(cliente);
  return nombre === '' ? 'Hola' : `Hola ${nombre}`;
}

export function mensajeDelPedido(cliente: string, trabajo: string, enlace: string): string {
  return `${saludo(cliente)}, ya terminamos tu ${elMueble(trabajo)}. ¿Nos contás en un minuto cómo te fue? ${enlace}`;
}

export function mensajeDelRecordatorio(cliente: string, trabajo: string, enlace: string): string {
  return `${saludo(cliente)}, te escribo de nuevo por si se te pasó: ¿nos contás cómo te fue con tu ${elMueble(trabajo)}? Es un minuto. ${enlace}`;
}

export function despuesDeLaEntrega(entrega: string | null, contestada: string): string {
  if (entrega === null) return '';
  const dias = diasEntre(entrega, contestada);
  if (dias < 0) return '';
  if (dias === 0) return ', el mismo día de la entrega';
  return `, ${enPalabras(dias, 'masculino')} ${dias === 1 ? 'día' : 'días'} después de la entrega`;
}
