import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeSesion } from '@/entities/sesion';
import { estadoDeLosMensajes, usarIdioma } from '@/shared/idioma';
import { CLAVE_DEL_SEUDOIDIOMA, idiomaGuardadoDe } from '@/shared/lib';

import { IdiomaDeLaCuenta } from './IdiomaDeLaCuenta';

const PERSONA = {
  usuarioId: '00000000-0000-4000-8000-000000000001',
  email: 'vos@taller.com.ar',
  nombre: 'Eliseo',
  foto: '',
};

function montar(idioma: 'en' | 'pt-BR' | null) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProveedorDeSesion sesion={{ ...PERSONA, idioma }}>
        <IdiomaDeLaCuenta />
      </ProveedorDeSesion>
    </QueryClientProvider>,
  );
}

afterEach(async () => {
  cleanup();
  localStorage.clear();
  await usarIdioma('es');
});

describe('el idioma de la cuenta en la app abierta', () => {
  it('pone el de la cuenta y deja su copia en el aparato', async () => {
    montar('pt-BR');

    await vi.waitFor(() => {
      expect(estadoDeLosMensajes().idioma).toBe('pt-BR');
    });
    expect(idiomaGuardadoDe(PERSONA.usuarioId)).toBe('pt-BR');
  });

  it('una cuenta sin idioma queda en español', async () => {
    montar(null);

    await vi.waitFor(() => {
      expect(idiomaGuardadoDe(PERSONA.usuarioId)).toBe('es');
    });
    expect(estadoDeLosMensajes()).toMatchObject({ idioma: 'es', seudo: false });
  });

  it('con el seudoidioma prendido en el aparato, no lo pisa', async () => {
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'activo');
    await usarIdioma('es', true);

    montar('en');

    await vi.waitFor(() => {
      expect(idiomaGuardadoDe(PERSONA.usuarioId)).toBe('en');
    });
    expect(estadoDeLosMensajes().seudo).toBe(true);
  });
});
