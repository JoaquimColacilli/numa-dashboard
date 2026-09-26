import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import type { FotoEnLaVidriera, OrdenEnLaVidriera } from '../api/mutacion';
import {
  FotosDeLaVidriera,
  LA_VIDRIERA_ESTA_LLENA,
  SIN_FOTOS_EN_LA_VIDRIERA,
  SIN_NADA_EN_LA_VIDRIERA,
} from './FotosDeLaVidriera';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
}));

function foto(id: string, orden: number, archivo: string | null = null): FotoEnLaVidriera {
  return {
    id,
    household_id: 'h',
    orden,
    tipo: 'image/webp',
    bytes: 300_000,
    ancho: 900,
    alto: 1200,
    archivo_de_origen: archivo,
    created_at: '2026-09-26T10:00:00Z',
    updated_at: '2026-09-26T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaCon(fotos: FotoEnLaVidriera[]): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.archivos = { ar1: { id: 'ar1', proyecto_id: 'p1' } };
  tablas.proyectos = { p1: { id: 'p1', titulo: 'Placard de tres cuerpos' } };
  tablas.fotos_de_la_vidriera = Object.fromEntries(fotos.map((una) => [una.id, una]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(fotos: FotoEnLaVidriera[], hayRedes = false) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaCon(fotos)}>
        <FotosDeLaVidriera hayRedes={hayRedes} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    mandadas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          variables: mutacion.state.variables as OrdenEnLaVidriera,
        })),
  };
}

function filas(): HTMLElement[] {
  return within(screen.getByRole('list', { name: /Las fotos de tu vidriera/ })).getAllByRole(
    'listitem',
  );
}

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
  vi.unstubAllGlobals();
});

describe('las fotos de la vidriera en Ajustes', () => {
  it('van en el orden del cliente, con la miniatura, de dónde salieron y cuántas son de doce', () => {
    montar([foto('b', 1), foto('a', 0, 'ar1'), foto('c', 2)]);

    expect(screen.getByText('3 de 12')).toBeInTheDocument();
    const [primera, segunda] = filas();
    expect(primera).toHaveTextContent('Foto 1 de 3');
    expect(primera).toHaveTextContent('De «Placard de tres cuerpos»');
    expect(segunda).toHaveTextContent('Subida para la vidriera');

    const miniatura = primera?.querySelector('img');
    expect(miniatura).toHaveAttribute('src', 'https://cdn.maun.test/h/vidriera/a.mini.webp');
    expect(miniatura).toHaveAttribute('alt', '');
    expect(miniatura).toHaveAttribute('width', '48');
    expect(miniatura).toHaveAttribute('height', '64');
  });

  it('en las puntas, mover no está disponible pero se puede enfocar y dice por qué fila es', () => {
    montar([foto('a', 0), foto('b', 1)]);
    const [primera, ultima] = filas();

    const antes = within(primera as HTMLElement).getByRole('button', { name: 'Mover antes' });
    expect(antes).toHaveAttribute('aria-disabled', 'true');
    expect(antes).not.toBeDisabled();
    expect(antes).toHaveAccessibleDescription(/Foto 1 de 2/);
    expect(
      within(ultima as HTMLElement).getByRole('button', { name: 'Mover después' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(primera as HTMLElement).getByRole('button', { name: 'Mover después' }),
    ).not.toHaveAttribute('aria-disabled');
  });

  it('mover cambia el orden por la cola, y tocar una punta no manda nada', () => {
    const { mandadas } = montar([foto('a', 0), foto('b', 1), foto('c', 2)]);
    const [primera] = filas();

    fireEvent.click(within(primera as HTMLElement).getByRole('button', { name: 'Mover antes' }));
    expect(mandadas()).toEqual([]);

    fireEvent.click(within(primera as HTMLElement).getByRole('button', { name: 'Mover después' }));
    expect(mandadas()).toEqual([
      { clave: ['vidriera', 'ordenar'], variables: { id: 'b', orden: 0, previo: 1 } },
      { clave: ['vidriera', 'ordenar'], variables: { id: 'a', orden: 1, previo: 0 } },
    ]);
  });

  it('sacar va por la cola', () => {
    const { mandadas } = montar([foto('a', 0)]);
    fireEvent.click(within(filas()[0] as HTMLElement).getByRole('button', { name: 'Sacar' }));
    const [baja] = mandadas();
    expect(mandadas()).toHaveLength(1);
    expect(baja?.clave).toEqual(['vidriera', 'sacar']);
    expect(baja?.variables).toMatchObject({ id: 'a' });
  });

  it('«Sumar fotos» abre la hoja, y con doce fotos se apaga y dice por qué', () => {
    montar([foto('a', 0)]);
    fireEvent.click(screen.getByRole('button', { name: 'Sumar fotos' }));
    expect(screen.getByRole('dialog', { name: 'Sumar fotos a la vidriera' })).toBeInTheDocument();
    cleanup();

    montar(Array.from({ length: 12 }, (_, indice) => foto(`f${String(indice)}`, indice)));
    expect(screen.getByRole('button', { name: 'Sumar fotos' })).toBeDisabled();
    expect(screen.getByText(LA_VIDRIERA_ESTA_LLENA)).toBeInTheDocument();
    expect(screen.getByText('12 de 12')).toBeInTheDocument();
  });

  it('sin fotos dice qué ve el cliente, con redes o sin nada', () => {
    montar([], true);
    expect(screen.getByText(SIN_FOTOS_EN_LA_VIDRIERA)).toBeInTheDocument();
    expect(screen.getByText('0 de 12')).toBeInTheDocument();
    cleanup();

    montar([]);
    expect(screen.getByText(SIN_NADA_EN_LA_VIDRIERA)).toBeInTheDocument();
  });
});
