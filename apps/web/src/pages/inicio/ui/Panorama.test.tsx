import { centavos } from '@maun/domain';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PanoramaDelTaller } from '../model/panorama';
import { Panorama } from './Panorama';

const PANORAMA: PanoramaDelTaller = {
  paraPagar: centavos(132_700_000),
  ahorros: centavos(413_100_000),
  superavit: centavos(36_500_000),
  insumos: centavos(82_000_000),
  compromisoDeMaun: centavos(0),
  tesorosParaPagar: 3,
  tesorosDeAhorro: 4,
  tesoroDelSuperavit: 's',
  trabajosConInsumos: 2,
};

afterEach(() => {
  cleanup();
});

function llano(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

describe('el panorama de Inicio', () => {
  it('es una línea de cuatro cifras, con su (i)', () => {
    render(<Panorama panorama={PANORAMA} nombreDelSuperavit="Superávit" />);
    const panorama = screen.getByRole('region', { name: 'Panorama' });

    expect(
      within(panorama)
        .getAllByRole('term')
        .map((clave) => clave.textContent),
    ).toEqual(['Para pagar', 'Ahorros', 'Superávit', 'Insumos de los trabajos']);
    expect(
      within(panorama)
        .getAllByRole('definition')
        .map((valor) => llano(valor.textContent)),
    ).toEqual([
      '$ 1.327.000',
      'en 3 tesoros',
      '$ 4.131.000',
      'en 4 tesoros',
      '$ 365.000',
      'en Superávit',
      '$ 820.000',
      'de 2 trabajos',
    ]);
    expect(
      within(panorama).getByRole('button', { name: 'Qué es el panorama' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dónde está la plata y para qué la podés usar.')).toBeInTheDocument();
    expect(panorama.querySelectorAll('[data-monto]')).toHaveLength(4);
  });

  it('un superávit en negativo se ve en alerta', () => {
    render(
      <Panorama
        panorama={{ ...PANORAMA, superavit: centavos(-5_000_000) }}
        nombreDelSuperavit="Maun"
      />,
    );
    const superavit = screen
      .getByRole('region', { name: 'Panorama' })
      .querySelector('[data-cifra-del-panorama="superavit"] [data-monto]');
    expect(superavit).toHaveClass('text-alerta');
  });
});
