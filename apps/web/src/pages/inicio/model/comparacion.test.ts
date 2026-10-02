import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { mensajes, usarIdioma } from '@/shared/idioma';

import { comparacionConElMesAnterior } from './comparacion';

const OCTUBRE = '2026-10';

function comparar(valor: number, previo: number): string {
  return comparacionConElMesAnterior(
    centavos(valor),
    centavos(previo),
    OCTUBRE,
    mensajes().paginaInicio,
  );
}

describe('la comparación con el mes anterior', () => {
  it('sin nada el mes anterior no dice nada', () => {
    expect(comparar(1_200_000, 0)).toBe('');
  });

  it('dice cuánto subió o bajó, con su signo', () => {
    expect(comparar(1_100_000, 1_000_000)).toBe('+10% vs. septiembre');
    expect(comparar(900_000, 1_000_000)).toBe('−10% vs. septiembre');
  });

  it('una baja que redondea a cero es un cero sin signo menos, en los tres idiomas', async () => {
    try {
      expect(comparar(1_200_000, 1_201_000)).toBe('+0% vs. septiembre');
      await usarIdioma('en');
      expect(comparar(1_200_000, 1_201_000)).toBe('+0% vs. September');
      await usarIdioma('pt-BR');
      expect(comparar(1_200_000, 1_201_000)).toBe('+0% vs. setembro');
    } finally {
      await usarIdioma('es');
    }
  });
});
