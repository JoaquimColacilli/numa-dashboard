import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Moneda } from '@maun/domain';

import type { TesoroQueRecibeDolares, ValorDelPago } from '../model/pago';
import { CamposDelPago } from './CamposDelPago';

const DOLARES: TesoroQueRecibeDolares = { id: 'usd', nombre: 'Dólares' };
const AHORRO: TesoroQueRecibeDolares = { id: 'ahorro', nombre: 'Ahorro en dólares' };

function Prueba({
  inicial,
  monedaDelTrabajo,
  tesoros = [DOLARES],
  alCrear,
}: {
  inicial: ValorDelPago;
  monedaDelTrabajo: Moneda;
  tesoros?: readonly TesoroQueRecibeDolares[];
  alCrear?: () => void;
}) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <CamposDelPago
        valor={valor}
        alCambiar={setValor}
        monedaDelTrabajo={monedaDelTrabajo}
        tesorosEnDolares={tesoros}
        alCrearUnTesoroEnDolares={alCrear}
      />
      <output>{JSON.stringify(valor)}</output>
    </>
  );
}

function valor(): Record<string, unknown> {
  return JSON.parse(screen.getByRole('status').textContent) as Record<string, unknown>;
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('la fila de un pago', () => {
  it('en un trabajo en pesos se ve como siempre, y pasar a dólares queda a un toque', () => {
    render(
      <Prueba
        inicial={{ moneda: 'ARS', monto: null, cotizacion: null, tesoroId: null }}
        monedaDelTrabajo="ARS"
      />,
    );
    expect(screen.queryByRole('textbox', { name: 'Dólar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pasar a dólares' }));
    expect(valor()).toMatchObject({ moneda: 'USD', tesoroId: 'usd' });
    expect(screen.getByRole('textbox', { name: 'Dólar' })).toHaveAccessibleDescription(
      'El que acordaste con tu cliente ese día.',
    );
    expect(screen.getByText('Entra a «Dólares».')).toBeInTheDocument();
  });

  it('dice cuánto descuenta del precio un pago en pesos de un trabajo en dólares', () => {
    render(
      <Prueba
        inicial={{ moneda: 'ARS', monto: 184_800_000, cotizacion: 154_000, tesoroId: null }}
        monedaDelTrabajo="USD"
      />,
    );
    expect(screen.getByText(/Descuenta US\$\s1\.200 del precio\./u)).toBeInTheDocument();
  });

  it('con varios tesoros en dólares pregunta a cuál entra, y sin ninguno ofrece crearlo', () => {
    const alCrear = vi.fn();
    const { unmount } = render(
      <Prueba
        inicial={{ moneda: 'USD', monto: 50_000, cotizacion: 150_000, tesoroId: null }}
        monedaDelTrabajo="USD"
        tesoros={[DOLARES, AHORRO]}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Entra a' }), {
      target: { value: 'ahorro' },
    });
    expect(valor()).toMatchObject({ tesoroId: 'ahorro' });
    unmount();

    render(
      <Prueba
        inicial={{ moneda: 'USD', monto: 50_000, cotizacion: 150_000, tesoroId: null }}
        monedaDelTrabajo="USD"
        tesoros={[]}
        alCrear={alCrear}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Crear un tesoro en dólares' }));
    expect(alCrear).toHaveBeenCalledTimes(1);
  });
});
