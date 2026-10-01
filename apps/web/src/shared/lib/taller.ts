export const TALLER_DE_RESPALDO = 'Taller MAUN';

export function nombreDelTaller(nombre: string | null | undefined): string {
  const limpio = (nombre ?? '').trim();
  return limpio === '' ? TALLER_DE_RESPALDO : limpio;
}
