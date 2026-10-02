import { mensajes } from '@/shared/idioma';
import { etiquetaActual, fechaDelRotulo, hoyEnElTaller } from '@/shared/lib';

const DECIMALES = new Map<string, Intl.NumberFormat>();

function decimal(numero: number): string {
  const etiqueta = etiquetaActual();
  let formato = DECIMALES.get(etiqueta);
  if (formato === undefined) {
    formato = new Intl.NumberFormat(etiqueta, { maximumFractionDigits: 1 });
    DECIMALES.set(etiqueta, formato);
  }
  return formato.format(numero);
}

export function escalaDelZoom(zoom: number): string {
  if (!Number.isFinite(zoom) || zoom <= 0 || Math.abs(zoom - 1) < 0.05) return '1:1';
  return zoom > 1 ? `${decimal(zoom)}:1` : `1:${decimal(1 / zoom)}`;
}

export function rigeDesde(guardada: boolean, guardadaEn: string | null): string {
  const deAjustes = mensajes().paginaTesoros.rotulo.deAjustes;
  if (!guardada || guardadaEn === null) return deAjustes;
  const fecha = new Date(guardadaEn);
  return Number.isNaN(fecha.getTime()) ? deAjustes : fechaDelRotulo(hoyEnElTaller(fecha));
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
