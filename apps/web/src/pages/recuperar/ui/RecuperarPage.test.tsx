import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecuperarPage } from './RecuperarPage';

vi.mock('@/features/recuperar-acceso', async (original) => ({
  ...(await original<typeof import('@/features/recuperar-acceso')>()),
  FormularioDePedido: ({ alPedir }: { alPedir: (email: string) => void }) => (
    <button
      type="button"
      onClick={() => {
        alPedir('vos@taller.com.ar');
      }}
    >
      Mandarme el enlace
    </button>
  ),
  ConfirmacionDelPedido: ({ alCambiar }: { alCambiar: () => void }) => (
    <button type="button" onClick={alCambiar}>
      Cambiar
    </button>
  ),
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: false,
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function laPose(contenedor: HTMLElement): string | null {
  return contenedor.querySelector('[data-pose]')?.getAttribute('data-pose') ?? null;
}

describe('Recuperá el acceso', () => {
  it('piensa en el formulario y saluda en «Revisá tu correo», sin trazar nada', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/acceso/recuperar']}>
        <RecuperarPage />
      </MemoryRouter>,
    );
    expect(laPose(container)).toBe('pensando');

    fireEvent.click(screen.getByRole('button', { name: 'Mandarme el enlace' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revisá tu correo');
    expect(laPose(container)).toBe('saludando');
    expect(container.querySelector('.trazar')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(laPose(container)).toBe('pensando');
  });
});
