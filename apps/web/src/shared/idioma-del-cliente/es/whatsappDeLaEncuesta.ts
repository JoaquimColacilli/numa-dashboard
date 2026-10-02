import { elMueble } from '@maun/domain';

function saludo(nombre: string | null): string {
  return nombre === null ? 'Hola' : `Hola ${nombre}`;
}

export const whatsappDeLaEncuesta = {
  pedido: (nombre: string | null, trabajo: string, enlace: string): string =>
    `${saludo(nombre)}, ya terminamos tu ${elMueble(trabajo)}. ¿Nos contás en un minuto cómo te fue? ${enlace}`,
  recordatorio: (nombre: string | null, trabajo: string, enlace: string): string =>
    `${saludo(nombre)}, te escribo de nuevo por si se te pasó: ¿nos contás cómo te fue con tu ${elMueble(trabajo)}? Es un minuto. ${enlace}`,
} as const;
