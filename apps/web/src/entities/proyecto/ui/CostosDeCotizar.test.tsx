import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Proyecto } from '../model/catalogos';
import { CostosDeCotizar } from './CostosDeCotizar';

const EN_DOLARES = {
  id: 'p',
  titulo: 'Vestidor',
  version: 4,
  estado: 'a_presupuestar',
  moneda: 'USD',
  presupuesto_centavos: 300_000,
  costo_madera_centavos: 154_000_000,
  costo_herrajes_centavos: null,
  costo_flete_centavos: null,
  costo_ayudante_centavos: null,
  costos_cotizacion_centavos: 154_000,
} as unknown as Proyecto;

function montar(proyecto: Proyecto) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CostosDeCotizar proyecto={proyecto} />
    </QueryClientProvider>,
  );
  return {
    pedidos: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[1] === 'costos')
        .map((mutacion) => mutacion.state.variables as { cambios: Record<string, unknown> }),
  };
}

function valorDe(clave: string): string | undefined {
  return screen.getByText(clave).nextElementSibling?.textContent.replace(/\s+/g, ' ');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  onlineManager.setOnline(false);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('los costos de un trabajo en dólares', () => {
  it('con el dólar para los costos, muestra cada costo también en dólares y el margen en dólares', () => {
    montar(EN_DOLARES);

    expect(screen.getByRole('textbox', { name: 'Dólar para los costos' })).toHaveValue('1.540');
    expect(screen.getByRole('textbox', { name: 'Madera' })).toHaveValue('1.540.000');
    expect(screen.getByText(/^≈ US\$\s1\.000$/u)).toBeInTheDocument();
    expect(valorDe('Costo estimado')).toBe('US$ 1.000');
    expect(valorDe('Presupuesto')).toBe('US$ 3.000');
    expect(valorDe('Te queda, si te lo aprueban')).toBe('US$ 2.000');
  });

  it('un costo escrito en dólares se guarda en pesos con ese dólar, junto con el dólar', () => {
    const { pedidos } = montar(EN_DOLARES);

    const [, herrajes] = screen.getAllByRole('button', { name: 'Pasar a dólares' });
    if (herrajes === undefined) throw new Error('falta el botón de los herrajes');
    fireEvent.click(herrajes);
    fireEvent.change(screen.getByRole('textbox', { name: 'Herrajes' }), {
      target: { value: '500' },
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(pedidos()).toEqual([
      expect.objectContaining({
        cambios: {
          costo_madera_centavos: 154_000_000,
          costo_herrajes_centavos: 77_000_000,
          costo_flete_centavos: null,
          costo_ayudante_centavos: null,
          costos_cotizacion_centavos: 154_000,
        },
      }),
    ]);
    expect(valorDe('Costo estimado')).toBe('US$ 1.500');
  });

  it('sin el dólar para los costos no muestra el margen y lo pide', () => {
    montar({ ...EN_DOLARES, costos_cotizacion_centavos: null });

    expect(valorDe('Costo estimado')).toBe('$ 1.540.000');
    expect(
      screen.getByText('Cargá el dólar para los costos y acá va lo que te queda, en dólares.'),
    ).toBeInTheDocument();
    for (const boton of screen.getAllByRole('button', { name: 'Pasar a dólares' })) {
      expect(boton).toBeDisabled();
    }
  });

  it('en un trabajo en pesos los costos se ven como siempre, sin el dólar', () => {
    const { pedidos } = montar({ ...EN_DOLARES, moneda: 'ARS', presupuesto_centavos: 300_000_000 });

    expect(screen.queryByRole('textbox', { name: 'Dólar para los costos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pasar a dólares' })).toBeNull();
    expect(valorDe('Te queda, si te lo aprueban')).toBe('$ 1.460.000');

    fireEvent.change(screen.getByRole('textbox', { name: 'Flete' }), {
      target: { value: '10.000' },
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(pedidos()[0]?.cambios).not.toHaveProperty('costos_cotizacion_centavos');
  });
});
