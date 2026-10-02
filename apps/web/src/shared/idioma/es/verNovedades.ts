import { mesEnUnaFrase } from '@/shared/lib';

export const verNovedades = {
  titulo: 'Novedades de la app',
  cerrar: 'Cerrar las novedades',
  verLasNovedades: 'Ver las novedades',
  sinFecha: 'Versión sin fecha',
  version: (fecha: string, vez: number) =>
    `Versión del ${String(Number(fecha.slice(8, 10)))} de ${mesEnUnaFrase(fecha, 'es')} de ${fecha.slice(0, 4)}${vez > 1 ? ` (${String(vez)})` : ''}`,
} as const;
