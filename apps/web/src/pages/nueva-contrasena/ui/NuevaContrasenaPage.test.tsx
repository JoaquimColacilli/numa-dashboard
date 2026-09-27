import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EstadoSesion } from '@/entities/sesion';

import { NuevaContrasenaPage } from './NuevaContrasenaPage';

const sesion = vi.hoisted((): { actual: EstadoSesion } => ({ actual: { tipo: 'cargando' } }));

vi.mock('@/entities/sesion', async (original) => ({
  ...(await original<typeof import('@/entities/sesion')>()),
  useSesion: () => sesion.actual,
}));

vi.mock('@/features/recuperar-acceso', async (original) => ({
  ...(await original<typeof import('@/features/recuperar-acceso')>()),
  FormularioDeNuevaContrasena: ({ alCambiar }: { alCambiar: () => void }) => (
    <button type="button" onClick={alCambiar}>
      Guardar la contraseña
    </button>
  ),
}));

const ACTIVA = {
  tipo: 'activa',
  usuarioId: '00000000-0000-4000-8000-000000000001',
  email: 'vos@taller.com.ar',
  nombre: '',
  foto: '',
} as const;

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

function montar(): HTMLElement {
  return render(
    <MemoryRouter initialEntries={['/acceso/nueva-contrasena']}>
      <QueryClientProvider client={new QueryClient()}>
        <NuevaContrasenaPage />
      </QueryClientProvider>
    </MemoryRouter>,
  ).container;
}

function laPose(contenedor: HTMLElement): string | null {
  return contenedor.querySelector('[data-pose]')?.getAttribute('data-pose') ?? null;
}

describe('el enlace de la contraseña nueva', () => {
  it.each([
    ['Un segundo', { tipo: 'cargando' }],
    ['Este enlace no sirve', { tipo: 'anonimo', vencida: false }],
    ['Esta pantalla se abre desde el correo', { ...ACTIVA, porRecuperacion: false }],
    ['Poné una contraseña nueva', { ...ACTIVA, porRecuperacion: true }],
  ] satisfies [string, EstadoSesion][])('«%s» piensa, sin trazar nada', (titulo, estado) => {
    sesion.actual = estado;
    const contenedor = montar();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(titulo);
    expect(laPose(contenedor)).toBe('pensando');
    expect(contenedor.querySelector('.trazar')).toBeNull();
  });

  it('«Listo, ya entraste» levanta el pulgar y traza la tilde al llegar, en el mismo panel', () => {
    sesion.actual = { ...ACTIVA, porRecuperacion: true };
    const contenedor = montar();
    const hueco = contenedor.querySelector('[data-pose]');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar la contraseña' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Listo, ya entraste');
    expect(laPose(contenedor)).toBe('pulgar');
    expect(contenedor.querySelectorAll('.trazar')).toHaveLength(1);
    expect(contenedor.querySelector('[data-pose]')).toBe(hueco);
  });
});
