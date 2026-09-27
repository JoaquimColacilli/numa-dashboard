import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CrearCuentaPage } from './CrearCuentaPage';

vi.mock('@/features/crear-cuenta', () => ({
  FormularioDeRegistro: ({ alCrear }: { alCrear: (email: string) => void }) => (
    <button
      type="button"
      onClick={() => {
        alCrear('nuevo@taller.com.ar');
      }}
    >
      Crear la cuenta
    </button>
  ),
  ConfirmacionDelAlta: ({ alCambiar }: { alCambiar: () => void }) => (
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

describe('Creá tu cuenta', () => {
  it('mide en el formulario, saluda en «Revisá tu correo» sin trazar nada, y vuelve a medir al cambiar el mail', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/acceso/crear-cuenta']}>
        <CrearCuentaPage />
      </MemoryRouter>,
    );
    expect(laPose(container)).toBe('midiendo');

    fireEvent.click(screen.getByRole('button', { name: 'Crear la cuenta' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revisá tu correo');
    expect(laPose(container)).toBe('saludando');
    expect(container.querySelector('.trazar')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Creá tu cuenta');
    expect(laPose(container)).toBe('midiendo');
  });
});
