import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SIN_SENAL_PARA_ARCHIVOS } from '@/entities/archivo';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  copiarEnElBucketDeArchivos,
  TABLAS_REPLICADAS,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import type { AltaEnLaVidriera } from '../api/mutacion';
import { HojaDeSumarFotos } from './HojaDeSumarFotos';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
  copiarEnElBucketDeArchivos: vi.fn(() => Promise.resolve()),
}));

function imagen(id: string, proyecto: string, visible = true, creado = '2026-09-20T10:00:00Z') {
  return {
    id,
    household_id: 'h',
    proyecto_id: proyecto,
    nombre: `${id}.jpg`,
    tipo: 'image/webp',
    bytes: 250_000,
    ancho: 2000,
    alto: 1500,
    visible_para_cliente: visible,
    created_at: creado,
    updated_at: creado,
    deleted_at: null,
    version: 1,
  };
}

function enLaVidriera(id: string, orden: number, origen: string | null = null) {
  return {
    id,
    household_id: 'h',
    orden,
    tipo: 'image/webp',
    bytes: 1,
    ancho: 900,
    alto: 1200,
    archivo_de_origen: origen,
    created_at: '2026-09-26T10:00:00Z',
    updated_at: '2026-09-26T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaCon(vidriera: ReturnType<typeof enLaVidriera>[]): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.proyectos = {
    p1: { id: 'p1', titulo: 'Placard' },
    p2: { id: 'p2', titulo: 'Vestidor' },
  };
  const archivos = [
    imagen('a1', 'p1', true, '2026-09-21T10:00:00Z'),
    imagen('a2', 'p1', false, '2026-09-20T10:00:00Z'),
    imagen('b1', 'p2', true, '2026-09-19T10:00:00Z'),
    imagen('b2', 'p2', true, '2026-09-18T10:00:00Z'),
  ];
  tablas.archivos = Object.fromEntries(archivos.map((fila) => [fila.id, fila]));
  tablas.fotos_de_la_vidriera = Object.fromEntries(vidriera.map((fila) => [fila.id, fila]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(vidriera: ReturnType<typeof enLaVidriera>[] = []) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaCon(vidriera)}>
        <HojaDeSumarFotos alCerrar={alCerrar} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    sumadas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => mutacion.state.variables as AltaEnLaVidriera),
  };
}

function foto(nombre: string): HTMLElement {
  return screen.getByRole('button', { name: nombre });
}

beforeEach(() => {
  onlineManager.setOnline(true);
  vi.mocked(copiarEnElBucketDeArchivos).mockClear();
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

describe('sumar fotos a la vidriera', () => {
  it('abre en «De tus trabajos», y las pestañas se recorren con las flechas', () => {
    montar();
    const pestanas = screen.getAllByRole('tab');
    expect(pestanas.map((una) => una.textContent)).toEqual(['De tus trabajos', 'Subir nuevas']);
    expect(pestanas[0]).toHaveAttribute('aria-selected', 'true');
    expect(pestanas[1]).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel', { name: 'De tus trabajos' })).toBeVisible();

    act(() => {
      pestanas[0]?.focus();
    });
    fireEvent.keyDown(pestanas[0] as HTMLElement, { key: 'ArrowRight' });
    expect(pestanas[1]).toHaveAttribute('aria-selected', 'true');
    expect(pestanas[1]).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Subir nuevas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Elegir fotos' })).toBeInTheDocument();

    fireEvent.keyDown(pestanas[1] as HTMLElement, { key: 'Home' });
    expect(pestanas[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('muestra las fotos por trabajo, lo más nuevo primero, con la que ya está y la que no compartiste', () => {
    montar([enLaVidriera('v1', 0, 'b2')]);

    const placard = screen.getByRole('region', { name: 'Placard' });
    expect(
      within(placard)
        .getAllByRole('button')
        .map((boton) => boton.getAttribute('aria-label')),
    ).toEqual(['Foto 1 de «Placard»', 'Foto 2 de «Placard»']);
    expect(foto('Foto 2 de «Placard»')).toHaveAccessibleDescription('Sin compartir');

    const yaEsta = foto('Foto 2 de «Vestidor»');
    expect(yaEsta).toHaveAttribute('aria-disabled', 'true');
    expect(yaEsta).toHaveAccessibleDescription('Ya está en tu vidriera');
    fireEvent.click(yaEsta);
    expect(yaEsta).toHaveAttribute('aria-pressed', 'false');
  });

  it('elegir marca la foto, y con los lugares llenos las demás no entran y dicen por qué', () => {
    montar(Array.from({ length: 10 }, (_, indice) => enLaVidriera(`v${String(indice)}`, indice)));

    fireEvent.click(foto('Foto 1 de «Placard»'));
    expect(foto('Foto 1 de «Placard»')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sumar 1 foto' })).toBeEnabled();

    fireEvent.click(foto('Foto 1 de «Vestidor»'));
    const otra = foto('Foto 2 de «Vestidor»');
    expect(otra).toHaveAttribute('aria-disabled', 'true');
    expect(otra).toHaveAccessibleDescription('Elegiste 2: es lo que entra en tu vidriera.');
    fireEvent.click(otra);
    expect(otra).toHaveAttribute('aria-pressed', 'false');
  });

  it('si elegiste una sin compartir, avisa antes en la misma hoja, y se puede revisar o sumar igual', async () => {
    const { sumadas, alCerrar } = montar([enLaVidriera('v1', 4)]);

    fireEvent.click(foto('Foto 2 de «Placard»'));
    fireEvent.click(foto('Foto 1 de «Vestidor»'));
    fireEvent.click(screen.getByRole('button', { name: 'Sumar 2 fotos' }));

    expect(screen.getByText(/está sin compartir: el cliente de ese trabajo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sumar igual' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar' }));
    expect(screen.queryByRole('button', { name: 'Sumar igual' })).toBeNull();
    expect(copiarEnElBucketDeArchivos).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sumar 2 fotos' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sumar igual' }));
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect(alCerrar).toHaveBeenCalledOnce();
    });
    expect(copiarEnElBucketDeArchivos).toHaveBeenCalledTimes(4);
    expect(sumadas().map((alta) => [alta.nueva.archivo_de_origen, alta.nueva.orden])).toEqual([
      ['a2', 5],
      ['b1', 6],
    ]);
  });

  it('sin señal no empieza y lo dice', () => {
    montar();
    onlineManager.setOnline(false);
    fireEvent.click(foto('Foto 1 de «Placard»'));
    fireEvent.click(screen.getByRole('button', { name: 'Sumar 1 foto' }));
    expect(screen.getByRole('alert')).toHaveTextContent(SIN_SENAL_PARA_ARCHIVOS);
    expect(copiarEnElBucketDeArchivos).not.toHaveBeenCalled();
  });
});
