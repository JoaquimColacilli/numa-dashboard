import { ZONA_DEL_TALLER } from '@/shared/lib';

const DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

const FECHA_DEL_ROTULO = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  timeZone: ZONA_DEL_TALLER,
});

export function escalaDelZoom(zoom: number): string {
  if (!Number.isFinite(zoom) || zoom <= 0 || Math.abs(zoom - 1) < 0.05) return '1:1';
  return zoom > 1 ? `${DECIMAL.format(zoom)}:1` : `1:${DECIMAL.format(1 / zoom)}`;
}

export function rigeDesde(guardada: boolean, guardadaEn: string | null): string {
  if (!guardada || guardadaEn === null) return 'de Ajustes';
  const fecha = new Date(guardadaEn);
  return Number.isNaN(fecha.getTime()) ? 'de Ajustes' : FECHA_DEL_ROTULO.format(fecha);
}

const CLAVE_DE_LO_ENTENDIDO = 'maun:tesoros-entendido';

export function yaSeEntendio(): boolean {
  try {
    return globalThis.localStorage.getItem(CLAVE_DE_LO_ENTENDIDO) === '1';
  } catch {
    return false;
  }
}

export function anotarQueSeEntendio(): void {
  try {
    globalThis.localStorage.setItem(CLAVE_DE_LO_ENTENDIDO, '1');
  } catch {
    return;
  }
}
