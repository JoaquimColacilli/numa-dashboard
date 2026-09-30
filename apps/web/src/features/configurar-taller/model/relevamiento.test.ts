import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import {
  cambioDelRelevamiento,
  VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE,
  valorDelRelevamiento,
} from './relevamiento';

function ajustes(valor?: number | null): FilaDe<'ajustes'> {
  return (
    valor === undefined ? { id: 'aj' } : { id: 'aj', relevamiento_centavos: valor }
  ) as FilaDe<'ajustes'>;
}

describe('el valor del relevamiento en Ajustes', () => {
  it('muestra el guardado, vacío si no tiene, y el de siempre si la fila todavía no trae la columna', () => {
    expect(valorDelRelevamiento(ajustes(15_000_000))).toBe(15_000_000);
    expect(valorDelRelevamiento(ajustes(null))).toBeNull();
    expect(valorDelRelevamiento(ajustes())).toBe(VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE);
    expect(VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE).toBe(12_000_000);
  });

  it('vacío o en 0 se guarda sin valor', () => {
    expect(cambioDelRelevamiento(ajustes(12_000_000), null)).toEqual({
      relevamiento_centavos: null,
    });
    expect(cambioDelRelevamiento(ajustes(12_000_000), 0)).toEqual({
      relevamiento_centavos: null,
    });
  });

  it('solo manda la columna si cambió, también con la fila que no la trae', () => {
    expect(cambioDelRelevamiento(ajustes(12_000_000), 12_000_000)).toEqual({});
    expect(cambioDelRelevamiento(ajustes(null), 0)).toEqual({});
    expect(cambioDelRelevamiento(ajustes(), 12_000_000)).toEqual({});
    expect(cambioDelRelevamiento(ajustes(), 15_000_000)).toEqual({
      relevamiento_centavos: 15_000_000,
    });
  });
});
