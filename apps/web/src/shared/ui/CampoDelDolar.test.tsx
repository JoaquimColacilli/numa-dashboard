import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { olvidarLaSugerenciaDelDolar, RUTAS_DEL_DOLAR } from '@/shared/api';

import { CampoDelDolar } from './CampoDelDolar';
import { errorDelDolar } from './dolar';

const BOLSA = { compra: 1548, venta: 1560, fechaActualizacion: '2026-10-02T21:05:00.000Z' };
const BLUE = { compra: 1535, venta: 1555, fechaActualizacion: '2026-10-02T21:05:00.000Z' };

function conLaApi(responde: boolean): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((ruta: string) =>
      responde
        ? Promise.resolve(
            new Response(JSON.stringify(ruta === RUTAS_DEL_DOLAR.mep ? BOLSA : BLUE), {
              status: 200,
            }),
          )
        : Promise.reject(new TypeError('Failed to fetch')),
    ),
  );
}

function Prueba({ delDia = null }: { delDia?: { valor: number } | null }) {
  const [valor, setValor] = useState<number | null>(null);
  return (
    <>
      <CampoDelDolar value={valor} onChange={setValor} delDia={delDia} />
      <output>{valor === null ? 'vacío' : String(valor)}</output>
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  olvidarLaSugerenciaDelDolar();
});

describe('el campo del dólar', () => {
  it('sugiere el MEP y el blue con su hora, y un toque pone el valor en el campo', async () => {
    conLaApi(true);
    render(<Prueba />);
    const venta = await screen.findByRole('button', { name: /MEP de venta/ });
    expect(screen.getByRole('button', { name: /blue de compra/i })).toBeInTheDocument();
    expect(screen.getByText('18:05')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('vacío');
    fireEvent.click(venta);
    expect(screen.getByRole('status')).toHaveTextContent('156000');
  });

  it('el dólar del día va primero, antes que la sugerencia', async () => {
    conLaApi(true);
    render(<Prueba delDia={{ valor: 154_000 }} />);
    await screen.findByRole('button', { name: /MEP de venta/ });
    const botones = screen.getAllByRole('button');
    expect(botones[0]).toHaveAccessibleName(/dólar del día/);
    fireEvent.click(botones[0] ?? fallar());
    expect(screen.getByRole('status')).toHaveTextContent('154000');
  });

  it('sin señal el campo anda igual, sin sugerencia y sin aviso de error', async () => {
    conLaApi(false);
    render(<Prueba />);
    const campo = screen.getByRole('textbox', { name: 'Dólar' });
    fireEvent.change(campo, { target: { value: '1540' } });
    expect(screen.getByRole('status')).toHaveTextContent('154000');
    await new Promise((listo) => setTimeout(listo, 0));
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('pide un dólar dentro del rango', () => {
    expect(errorDelDolar(null)).toBe('¿A cuánto se tomó?');
    expect(errorDelDolar(null, false)).toBeUndefined();
    expect(errorDelDolar(154_000)).toBeUndefined();
    expect(errorDelDolar(99)?.replace(/\s/g, ' ')).toBe('El dólar va de $ 1 a $ 100.000.');
  });
});

function fallar(): never {
  throw new Error('Falta un botón.');
}
