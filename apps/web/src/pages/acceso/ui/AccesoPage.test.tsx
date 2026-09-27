import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccesoPage } from './AccesoPage';

vi.mock('@/entities/sesion', async (original) => ({
  ...(await original<typeof import('@/entities/sesion')>()),
  useSesion: () => ({ tipo: 'anonimo', vencida: false }),
}));

vi.mock('@/features/iniciar-sesion', () => ({
  FormularioDeIngreso: () => <form aria-label="Entrar" />,
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

describe('Entrá al taller', () => {
  it('lleva a Eliseo trabajando, sin nada que se trace', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/acceso']}>
        <AccesoPage />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-pose]')).toHaveAttribute('data-pose', 'trabajando');
    expect(container.querySelectorAll('[data-lamina]')).toHaveLength(1);
    expect(container.querySelector('.trazar')).toBeNull();
  });
});
