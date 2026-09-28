import type { CambiosDeMovimiento, FilaDe, Tesoro } from '@/shared/api';

export interface LadoDelMovimiento {
  id: string;
  clave: Tesoro | null;
}

export type LadosDelMovimiento = Pick<
  CambiosDeMovimiento,
  'tesoro_origen' | 'tesoro_destino' | 'desde_id' | 'hacia_id'
>;

export function ladosDelMovimiento(
  desde: LadoDelMovimiento | null,
  hacia: LadoDelMovimiento | null,
  conIds: boolean,
): LadosDelMovimiento {
  const claves = { tesoro_origen: desde?.clave ?? null, tesoro_destino: hacia?.clave ?? null };
  if (!conIds) return claves;
  return { ...claves, desde_id: desde?.id ?? null, hacia_id: hacia?.id ?? null };
}

export function ladosDeLaFila(fila: FilaDe<'movimientos'>, conIds: boolean): LadosDelMovimiento {
  const claves = { tesoro_origen: fila.tesoro_origen, tesoro_destino: fila.tesoro_destino };
  if (!conIds) return claves;
  const conColumnas = fila as Partial<FilaDe<'movimientos'>>;
  return {
    ...claves,
    desde_id: conColumnas.desde_id ?? null,
    hacia_id: conColumnas.hacia_id ?? null,
  };
}
