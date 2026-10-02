import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { EdicionDeAjustes } from '@/entities/replica';
import type { FilaDe } from '@/shared/api';

import { MENSAJE_DE_LA_RED } from '../model/redes';
import { FormularioDeRedes } from './FormularioDeRedes';

const AJUSTES = {
  id: 'aj',
  household_id: 'h',
  instagram_link: '',
  facebook_link: '',
  tiktok_link: '',
} as FilaDe<'ajustes'>;

function montar(ajustes: FilaDe<'ajustes'> = AJUSTES) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioDeRedes ajustes={ajustes} />
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

function campo(nombre: string): HTMLInputElement {
  return screen.getByRole('textbox', { name: nombre });
}

function escribir(nombre: string, texto: string): void {
  fireEvent.change(campo(nombre), { target: { value: texto } });
}

function guardar(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar las redes' }));
}

beforeEach(() => {
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
});

describe('las redes del taller en Ajustes', () => {
  it('guarda cada link en su forma canónica y después muestra @usuario', () => {
    const { guardados } = montar();

    escribir('Instagram', 'https://www.instagram.com/Taller.Maun/?igsh=abc');
    escribir('TikTok', 'tiktok.com/@taller.maun');
    guardar();

    expect(guardados()).toHaveLength(1);
    expect(guardados()[0]).toMatchObject({
      id: 'aj',
      cambios: {
        instagram_link: 'https://www.instagram.com/taller.maun/',
        tiktok_link: 'https://www.tiktok.com/@taller.maun',
      },
      previos: { instagram_link: '', tiktok_link: '' },
    });
    expect(campo('Instagram')).toHaveValue('@taller.maun');
    expect(campo('TikTok')).toHaveValue('@taller.maun');
    expect(campo('Facebook')).toHaveValue('');
  });

  it('lo que no es un perfil no se guarda, y el error va en su campo', () => {
    const { guardados } = montar();

    escribir('Instagram', 'https://www.instagram.com/reel/C1a2b3/');
    escribir('Facebook', 'https://www.facebook.com/share/p/1AbC/');
    guardar();

    expect(guardados()).toEqual([]);
    expect(campo('Instagram')).toHaveAccessibleDescription(
      MENSAJE_DE_LA_RED.instagram['no-es-un-perfil'],
    );
    expect(campo('Facebook')).toHaveAccessibleDescription(
      MENSAJE_DE_LA_RED.facebook['no-es-un-perfil'],
    );

    escribir('Instagram', '@taller.maun');
    expect(campo('Instagram')).not.toHaveAccessibleDescription(
      MENSAJE_DE_LA_RED.instagram['no-es-un-perfil'],
    );
  });

  it('sin cambios no manda nada', () => {
    const { guardados } = montar({
      ...AJUSTES,
      instagram_link: 'https://www.instagram.com/taller.maun/',
    });
    expect(campo('Instagram')).toHaveValue('@taller.maun');
    guardar();
    expect(guardados()).toEqual([]);
  });
});
