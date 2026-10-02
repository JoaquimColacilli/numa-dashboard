import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EdicionDeAjustes } from '@/entities/replica';
import type { FilaDe } from '@/shared/api';
import { hoyEnElTaller } from '@/shared/lib';

import { FormularioDeCobro } from './FormularioDeCobro';

const CBU = '0110001312345678901233';

const AJUSTES = {
  id: 'aj',
  household_id: 'h',
  cobro_alias: '',
  cobro_cbu: '',
  cobro_titular: '',
  cobro_cuit: '',
  cobro_link: '',
  cobro_dolares_alias: '',
  cobro_dolares_cbu: '',
  dolar_del_dia_centavos: null,
  dolar_del_dia_el: null,
} as unknown as FilaDe<'ajustes'>;

function montar(ajustes: FilaDe<'ajustes'> = AJUSTES) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioDeCobro ajustes={ajustes} />
    </QueryClientProvider>,
  );
  return {
    guardados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => mutacion.state.variables as EdicionDeAjustes),
  };
}

function escribir(nombre: string, texto: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: nombre }), { target: { value: texto } });
}

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
  vi.unstubAllGlobals();
});

describe('cómo te pagan, en dólares', () => {
  it('guarda la cuenta en dólares y el dólar del día con la fecha de hoy', () => {
    const { guardados } = montar();

    escribir('CBU de la cuenta en dólares', CBU);
    escribir('Dólar del día', '1540');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los datos' }));

    expect(guardados()).toHaveLength(1);
    expect(guardados()[0]).toMatchObject({
      cambios: {
        cobro_dolares_cbu: CBU,
        dolar_del_dia_centavos: 154_000,
        dolar_del_dia_el: hoyEnElTaller(),
      },
    });
  });

  it('dice de qué día es el dólar cargado', () => {
    montar({ ...AJUSTES, dolar_del_dia_centavos: 150_000, dolar_del_dia_el: '2026-09-28' });
    expect(screen.getByRole('textbox', { name: 'Dólar del día' })).toHaveAccessibleDescription(
      /Lo cargaste el 28 de septiembre/,
    );
  });
});
