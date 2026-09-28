import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import {
  TABLAS_REPLICADAS,
  type Replica,
  type TablaReplicada,
  type TesoroNuevo,
} from '@/shared/api';

import type { DondeVa } from '../model/lugar';
import { HojaDeTesoroNuevo } from './HojaDeTesoroNuevo';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  crearTesoro: vi.fn(() => new Promise(() => undefined)),
}));

function filaDeTesoro(id: string, clave: string | null, nombre: string, tinta: string, orden = 0) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.ajustes = {
    a: { id: 'a', household_id: 'h', meta_cocos_centavos: 0, tasa_cocos_anual_bp: 0, fila: null },
  };
  const tesoros = [
    filaDeTesoro('01900000-0000-7000-8000-000000000001', 'hogar', 'Hogar', 'hogar'),
    filaDeTesoro('01900000-0000-7000-8000-000000000002', 'maun', 'Maun', 'maun'),
    filaDeTesoro('01900000-0000-7000-8000-000000000003', 'diezmo', 'Diezmo', 'diezmo'),
    filaDeTesoro('01900000-0000-7000-8000-000000000004', 'cocos', 'Cocos', 'cocos'),
    filaDeTesoro('01900000-0000-7000-8000-000000000006', null, 'Herramientas', 'grana', 4),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((fila) => [fila.id, fila]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const FILA: Fila = {
  pasos: [],
  reparto: [{ tesoro: '01900000-0000-7000-8000-000000000006', porcentaje: puntosBasicos(8000) }],
  sueldoPorTrabajo: false,
};

function montar(props: { fila?: Fila } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  const alCrear = vi.fn<(tesoro: TesoroNuevo, dondeVa: DondeVa) => void>();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaDelTaller()}>
        <HojaDeTesoroNuevo alCerrar={alCerrar} alCrear={alCrear} {...props} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    alCrear,
    encoladas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          variables: mutacion.state.variables as TesoroNuevo,
        })),
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
  vi.unstubAllGlobals();
});

describe('la hoja de un tesoro nuevo', () => {
  it('sin nombre no crea nada y lo dice en el campo', () => {
    const { encoladas, alCrear } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAccessibleDescription(
      'Ponele un nombre, de hasta 24 letras.',
    );
    expect(encoladas()).toEqual([]);
    expect(alCrear).not.toHaveBeenCalled();
  });

  it('muestra cómo se ve y avisa si otro usa el mismo color', () => {
    montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Vacaciones' },
    });
    expect(screen.getByText('Vacaciones', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mostaza' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Grana' }));
    expect(
      screen.getByText(/También la usa Herramientas: se distinguen por el nombre y el ícono\./),
    ).toBeInTheDocument();
  });

  it('crea el tesoro al final de los del dueño y le dice a la página dónde va', () => {
    const { encoladas, alCrear, alCerrar } = montar({ fila: FILA });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: ' Vacaciones ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Para qué es' }), {
      target: { value: 'El viaje de enero' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Petróleo' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Avión' }));

    const donde = screen.getByRole('group', { name: 'Dónde va' });
    fireEvent.click(within(donde).getByRole('radio', { name: /En el reparto/ }));
    const porcentaje = screen.getByRole('textbox', { name: 'Porcentaje de lo que sobra (%)' });
    expect(porcentaje).toHaveValue('10');
    expect(porcentaje).toHaveAccessibleDescription(
      'Queda libre el 20% del reparto: con 10%, Maun se queda con el otro 10%.',
    );
    fireEvent.change(porcentaje, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));

    const [alta] = encoladas();
    expect(alta?.clave).toEqual(['tesoros', 'crear']);
    expect(alta?.variables).toMatchObject({
      nombre: 'Vacaciones',
      descripcion: 'El viaje de enero',
      tinta: 'petroleo',
      icono: 'plane',
      meta_centavos: null,
      rinde_anual_bp: null,
      orden: 5,
    });
    expect(alCrear).toHaveBeenCalledWith(alta?.variables, { lugar: 'reparto', porcentaje: 1500 });
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('como paso pide el tope y lo entrega', () => {
    const { alCrear, encoladas } = montar({ fila: FILA });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Materiales' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /Como paso, al final/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByRole('textbox', { name: 'Tope por mes' })).toHaveAccessibleDescription(
      /Poné hasta cuánto recibe por mes\./,
    );
    expect(encoladas()).toEqual([]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Tope por mes' }), {
      target: { value: '300.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Materiales' }), {
      lugar: 'paso',
      tope: centavos(30_000_000),
    });
  });

  it('al estante no toca la fila', () => {
    const { alCrear } = montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Auto' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Auto' }), {
      lugar: 'estante',
    });
  });
});
