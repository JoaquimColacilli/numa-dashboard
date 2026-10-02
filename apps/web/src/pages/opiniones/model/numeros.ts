import { mensajes } from '@/shared/idioma';
import { etiquetaActual } from '@/shared/lib';

export function porcentajeConLaCuenta(parte: number, total: number): string {
  if (total === 0) return '—';
  return mensajes().paginaOpiniones.porcentaje(Math.round((parte * 100) / total), parte, total);
}

export function promedioLegible(decimas: number): string {
  return new Intl.NumberFormat(etiquetaActual(), { maximumFractionDigits: 1 }).format(decimas / 10);
}
