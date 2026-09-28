import { centavos } from '@maun/domain';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InsumosDelTrabajo } from './InsumosDelTrabajo';

afterEach(() => {
  cleanup();
});

function llano(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

function numeros(region: HTMLElement): string[] {
  return within(region)
    .getAllByRole('definition')
    .map((valor) => llano(valor.textContent));
}

describe('los insumos en la ficha del trabajo', () => {
  it('dicen lo que entró, lo gastado y lo que queda en Maun', () => {
    render(
      <InsumosDelTrabajo
        insumos={{
          proyectoId: 'p',
          titulo: 'Vestidor',
          entro: centavos(100_000_000),
          gastado: centavos(40_000_000),
          queda: centavos(60_000_000),
          tallerPuso: null,
        }}
      />,
    );
    const region = screen.getByRole('region', { name: 'Insumos del trabajo' });
    expect(
      within(region)
        .getAllByRole('term')
        .map((clave) => clave.textContent),
    ).toEqual(['Entró', 'Gastado', 'Queda']);
    expect(numeros(region)).toEqual(['$ 1.000.000', '$ 400.000', '$ 600.000']);
    expect(within(region).queryByText(/El taller puso/)).toBeNull();
    expect(within(region).getByRole('button', { name: 'Qué son los insumos' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Lo que queda de la seña de cada trabajo en curso: lo que te pagaron menos lo que ya gastaste en ese trabajo. Está en Maun hasta que el trabajo se cobra.',
      ),
    ).toBeInTheDocument();
  });

  it('si se gastó más de lo que entró, no queda nada y dice cuánto puso el taller', () => {
    render(
      <InsumosDelTrabajo
        insumos={{
          proyectoId: 'p',
          titulo: 'Alacena',
          entro: centavos(10_000_000),
          gastado: centavos(25_000_000),
          queda: centavos(-15_000_000),
          tallerPuso: centavos(15_000_000),
        }}
      />,
    );
    const region = screen.getByRole('region', { name: 'Insumos del trabajo' });
    expect(numeros(region)).toEqual(['$ 100.000', '$ 250.000', 'Nada']);
    expect(llano(within(region).getByText(/El taller puso/).textContent)).toBe(
      'El taller puso $ 150.000.',
    );
  });
});
