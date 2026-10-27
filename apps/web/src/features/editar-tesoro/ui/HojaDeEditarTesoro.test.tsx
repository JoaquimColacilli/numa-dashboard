import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import type { EdicionDeTesoro } from '@/entities/tesoro';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { HojaDeEditarTesoro } from './HojaDeEditarTesoro';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  editarTesoro: vi.fn(() => new Promise(() => undefined)),
}));

const COCOS = '01900000-0000-7000-8000-000000000004';
const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000006';
const DOLARES = '01900000-0000-7000-8000-000000000007';

function filaDeTesoro(
  id: string,
  clave: string | null,
  nombre: string,
  tinta: string,
  icono: string,
  meta: number | null = null,
  moneda = 'ARS',
) {
  return {
    id,
    household_id: 'h',
    clave,
    moneda,
    nombre,
    descripcion: clave === null ? 'Para la sierra nueva' : '',
    tinta,
    icono,
    meta_centavos: meta,
    meta_fecha: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaDelTaller({
  conDolares = false,
  metaDeCocos = null,
  fila = null,
}: { conDolares?: boolean; metaDeCocos?: number | null; fila?: unknown } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.ajustes = {
    a: {
      id: 'a',
      household_id: 'h',
      meta_cocos_centavos: 1_000_000_000,
      tasa_cocos_anual_bp: 4000,
      fila,
    },
  };
  const tesoros = [
    filaDeTesoro(HOGAR, 'hogar', 'Hogar', 'hogar', 'house'),
    filaDeTesoro(MAUN, 'maun', 'Maun', 'maun', 'hammer'),
    filaDeTesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo', 'church'),
    filaDeTesoro(COCOS, 'cocos', 'Cocos', 'cocos', 'piggy-bank', metaDeCocos),
    filaDeTesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo', 'wrench', 90_000_000),
    ...(conDolares
      ? [filaDeTesoro(DOLARES, null, 'Dólares', 'mostaza', 'vault', 200_000, 'USD')]
      : []),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((fila) => [fila.id, fila]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(tesoroId: string, replica: Replica = replicaDelTaller()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replica}>
        <HojaDeEditarTesoro tesoroId={tesoroId} alCerrar={alCerrar} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    ediciones: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => mutacion.state.variables as EdicionDeTesoro),
  };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('editar un tesoro', () => {
  it('la moneda se ve y no se toca, y la meta de uno en dólares va en dólares', () => {
    const { ediciones } = montar(DOLARES, replicaDelTaller({ conDolares: true }));
    expect(screen.getByText('En dólares')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: '¿En qué moneda?' })).toBeNull();
    const meta = screen.getByRole('textbox', { name: 'Meta' });
    expect(meta).toHaveValue('2.000');
    expect(meta).toHaveAttribute('placeholder', 'US$ 0');
    fireEvent.change(meta, { target: { value: '2.500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(ediciones()[0]).toMatchObject({ id: DOLARES, cambios: { meta_centavos: 250_000 } });
    expect(ediciones()[0]?.cambios).not.toHaveProperty('moneda');
  });

  it('uno en pesos dice «En pesos»', () => {
    montar(HERRAMIENTAS);
    expect(screen.getByText('En pesos')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Meta' })).not.toHaveAttribute('placeholder');
  });

  it('manda solo lo que cambió', () => {
    const { ediciones, alCerrar } = montar(HERRAMIENTAS);
    expect(screen.getByRole('heading', { name: 'Herramientas' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Meta' })).toHaveValue('900.000');

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Herramientas del taller' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Ciruela' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(ediciones()).toEqual([
      {
        id: HERRAMIENTAS,
        cambios: { nombre: 'Herramientas del taller', tinta: 'ciruela' },
        previos: { nombre: 'Herramientas', tinta: 'petroleo' },
      },
    ]);
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('sin cambios no manda nada', () => {
    const { ediciones, alCerrar } = montar(HERRAMIENTAS);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(ediciones()).toEqual([]);
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('la meta de Cocos va por el tesoro, junto con el nombre, y ya no tiene rinde', () => {
    const { ediciones } = montar(COCOS, replicaDelTaller({ metaDeCocos: 1_000_000_000 }));
    expect(screen.getByText('Nombre, color, ícono y meta')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Rinde por año (%)' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Meta' })).toHaveValue('10.000.000');
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Casa propia' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Meta' }), {
      target: { value: '12.000.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(ediciones()).toEqual([
      {
        id: COCOS,
        cambios: { nombre: 'Casa propia', meta_centavos: 1_200_000_000 },
        previos: { nombre: 'Cocos', meta_centavos: 1_000_000_000 },
      },
    ]);
  });

  it('la meta de Cocos que estaba en los ajustes se ve, y al cambiarla queda en el tesoro', () => {
    const { ediciones } = montar(COCOS);
    expect(screen.getByRole('textbox', { name: 'Meta' })).toHaveValue('10.000.000');
    fireEvent.change(screen.getByRole('textbox', { name: 'Meta' }), {
      target: { value: '12.000.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(ediciones()).toEqual([
      { id: COCOS, cambios: { meta_centavos: 1_200_000_000 }, previos: { meta_centavos: null } },
    ]);
  });

  it('Cocos se archiva como cualquier tesoro; los de siempre no, y el hogar no tiene meta', () => {
    montar(COCOS);
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeInTheDocument();
    cleanup();

    montar(HOGAR);
    expect(screen.queryByRole('button', { name: 'Archivar' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Meta' })).toBeNull();
    expect(screen.getByText('Nombre, color e ícono')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Casa' })).toBeChecked();
  });

  it('una deuda no lleva meta', () => {
    montar(
      HERRAMIENTAS,
      replicaDelTaller({
        fila: {
          obligaciones: [
            { tesoro: HERRAMIENTAS, porcentaje: 350, base: 'cobrado' },
            { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' },
          ],
          pasos: [],
          reparto: [],
          sueldoPorTrabajo: false,
        },
      }),
    );
    expect(screen.queryByRole('textbox', { name: 'Meta' })).toBeNull();
    expect(screen.queryByLabelText('Para cuándo')).toBeNull();
  });

  it('la fecha de la meta va de hoy en adelante, y se guarda con la meta', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-26T15:00:00-03:00'));
    const { ediciones, alCerrar } = montar(HERRAMIENTAS);
    fireEvent.change(screen.getByLabelText('Para cuándo'), { target: { value: '2026-10-25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByLabelText('Para cuándo')).toHaveAccessibleDescription(
      /La fecha va de hoy en adelante\./,
    );
    expect(ediciones()).toEqual([]);
    expect(alCerrar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Para cuándo'), { target: { value: '2027-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(ediciones()).toEqual([
      { id: HERRAMIENTAS, cambios: { meta_fecha: '2027-01-15' }, previos: { meta_fecha: null } },
    ]);
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('«Ajustar el saldo» abre su hoja, y «Volver» vuelve con lo que había escrito', () => {
    montar(HERRAMIENTAS);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Herramientas viejas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar el saldo' }));
    expect(
      screen.getByRole('heading', { name: 'Ajustar el saldo de Herramientas' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Herramientas viejas');
  });

  it('«Archivar» abre la hoja de archivar, y «No archivar» vuelve con lo que había escrito', () => {
    montar(HERRAMIENTAS);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Herramientas viejas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }));
    expect(screen.getByRole('heading', { name: 'Archivar Herramientas' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'No archivar' }));
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Herramientas viejas');
  });
});
