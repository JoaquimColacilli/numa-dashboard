import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeSesion, type CambioDelIdioma } from '@/entities/sesion';
import { estadoDeLosMensajes, usarIdioma } from '@/shared/idioma';
import { CLAVE_DEL_SEUDOIDIOMA, idiomaGuardadoDe } from '@/shared/lib';

import { SelectorDeIdioma } from './SelectorDeIdioma';

const PERSONA = {
  usuarioId: '00000000-0000-4000-8000-000000000001',
  email: 'vos@taller.com.ar',
  nombre: 'Eliseo',
  foto: '',
};

function montar(idioma: 'es' | 'en' | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeSesion sesion={{ ...PERSONA, idioma }}>
        <SelectorDeIdioma />
      </ProveedorDeSesion>
    </QueryClientProvider>,
  );
  return {
    pedidos: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[1] === 'idioma')
        .map((mutacion) => mutacion.state.variables as CambioDelIdioma),
  };
}

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.stubEnv('DEV', false);
});

afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  onlineManager.setOnline(true);
  localStorage.clear();
  await usarIdioma('es');
});

describe('el idioma de la app', () => {
  it('ofrece los tres idiomas con su propio nombre y elige el de la cuenta', () => {
    montar();

    expect(
      screen.getAllByRole('radio').map((opcion) => opcion.closest('label')?.textContent),
    ).toEqual(['Español', 'English', 'Português']);
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(
      screen.getByText('Lo elegís para tu cuenta: vale en todos tus aparatos.'),
    ).toBeInTheDocument();
  });

  it('elegir otro lo guarda en la cuenta por la cola, deja la copia del aparato y cambia la app', async () => {
    const { pedidos } = montar();

    fireEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(pedidos()).toEqual([{ idioma: 'en' }]);
    expect(idiomaGuardadoDe(PERSONA.usuarioId)).toBe('en');
    expect(await screen.findByText('App language')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(estadoDeLosMensajes().idioma).toBe('en');
  });

  it('el idioma que ya tiene la cuenta no se vuelve a mandar', () => {
    const { pedidos } = montar('en');

    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(pedidos()).toEqual([]);
  });

  it('el seudoidioma aparece solo con la clave del aparato, y vale solo en él', async () => {
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'disponible');
    const { pedidos } = montar();

    fireEvent.click(screen.getByRole('radio', { name: 'Seudoidioma' }));

    expect(localStorage.getItem(CLAVE_DEL_SEUDOIDIOMA)).toBe('activo');
    expect(pedidos()).toEqual([]);
    await vi.waitFor(() => {
      expect(estadoDeLosMensajes().seudo).toBe(true);
    });

    fireEvent.click(screen.getByRole('radio', { name: /Español/ }));
    expect(localStorage.getItem(CLAVE_DEL_SEUDOIDIOMA)).toBe('disponible');
    await vi.waitFor(() => {
      expect(estadoDeLosMensajes().seudo).toBe(false);
    });
  });
});
