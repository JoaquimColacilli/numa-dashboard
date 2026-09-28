import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { formatearPesos } from '@/shared/lib';
import {
  TABLAS_REPLICADAS,
  type MovimientoNuevo,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { HojaDeArchivar } from './HojaDeArchivar';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  registrarMovimiento: vi.fn(() => new Promise(() => undefined)),
  archivarElTesoro: vi.fn(() => new Promise(() => undefined)),
}));

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000006';

function filaDeTesoro(id: string, clave: string | null, nombre: string, tinta: string) {
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
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function ingreso(hacia: string, clave: string | null, monto: number) {
  return {
    id: `i-${hacia}`,
    household_id: 'h',
    fecha: '2026-09-10',
    tipo: 'ingreso',
    tesoro_origen: null,
    tesoro_destino: clave,
    desde_id: null,
    hacia_id: hacia,
    cubre_el_mes: null,
    monto_centavos: monto,
    categoria: '',
    descripcion: '',
    proyecto_id: null,
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function gasto(desde: string, monto: number) {
  return {
    ...ingreso(desde, null, monto),
    id: `g-${desde}`,
    tipo: 'gasto',
    desde_id: desde,
    hacia_id: null,
  };
}

function replicaDelTaller({
  herramientas = 15_000_000,
  fila = null,
}: { herramientas?: number; fila?: unknown } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.ajustes = {
    a: { id: 'a', household_id: 'h', meta_cocos_centavos: 0, tasa_cocos_anual_bp: 0, fila },
  };
  const tesoros = [
    filaDeTesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
    filaDeTesoro(MAUN, 'maun', 'Maun', 'maun'),
    filaDeTesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
    filaDeTesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
    filaDeTesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((una) => [una.id, una]));
  const movimientos = [
    ingreso(MAUN, 'maun', 124_800_000),
    ingreso(HOGAR, 'hogar', 41_230_000),
    ingreso(DIEZMO, 'diezmo', 27_000_000),
    ...(herramientas > 0
      ? [ingreso(HERRAMIENTAS, null, herramientas)]
      : herramientas < 0
        ? [gasto(HERRAMIENTAS, -herramientas)]
        : []),
  ];
  tablas.movimientos = Object.fromEntries(movimientos.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(replica: Replica) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replica}>
        <HojaDeArchivar tesoroId={HERRAMIENTAS} alCerrar={alCerrar} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    encoladas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          variables: mutacion.state.variables,
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

describe('archivar un tesoro', () => {
  it('pregunta a dónde va la plata, con Maun elegido, y dice cómo queda', () => {
    montar(replicaDelTaller());
    expect(screen.getByRole('heading', { name: 'Archivar Herramientas' })).toBeInTheDocument();
    expect(
      screen.getByText(`Tiene ${formatearPesos(15_000_000)}`.replace(/\s/g, ' ')),
    ).toBeInTheDocument();

    const destinos = screen.getByRole('group', { name: 'A dónde pasa la plata' });
    const opciones = within(destinos).getAllByRole('radio');
    expect(opciones.map((opcion) => opcion.closest('label')?.textContent)).toEqual([
      `Maunqueda en ${formatearPesos(139_800_000)}`,
      `Hogartiene ${formatearPesos(41_230_000)}`,
      `Cocostiene ${formatearPesos(0)}`,
    ]);
    expect(opciones[0]).toBeChecked();
    expect(
      screen.getByRole('button', { name: `Pasar ${formatearPesos(15_000_000)} a Maun y archivar` }),
    ).toBeInTheDocument();
  });

  it('encola la transferencia antes que el archivo', () => {
    const { encoladas, alCerrar } = montar(replicaDelTaller());
    fireEvent.click(screen.getByRole('radio', { name: /Hogar/ }));
    fireEvent.click(
      screen.getByRole('button', {
        name: `Pasar ${formatearPesos(15_000_000)} a Hogar y archivar`,
      }),
    );

    const [transferencia, archivo] = encoladas();
    expect(transferencia?.clave).toEqual(['movimientos', 'registrar']);
    expect(transferencia?.variables).toMatchObject({
      tipo: 'transferencia',
      desde_id: HERRAMIENTAS,
      hacia_id: HOGAR,
      tesoro_origen: null,
      tesoro_destino: 'hogar',
      monto_centavos: 15_000_000,
      cubre_el_mes: null,
      categoria: 'Archivo de un tesoro',
    } satisfies Partial<MovimientoNuevo>);
    expect(archivo?.clave).toEqual(['tesoros', 'archivar']);
    expect(archivo?.variables).toMatchObject({ id: HERRAMIENTAS, previo: null });
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('sin plata no pregunta el destino y solo archiva', () => {
    const { encoladas } = montar(replicaDelTaller({ herramientas: 0 }));
    expect(screen.queryByRole('group')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Archivar Herramientas' }));
    expect(encoladas().map((una) => una.clave)).toEqual([['tesoros', 'archivar']]);
  });

  it('si debe plata, la trae del elegido', () => {
    const { encoladas } = montar(replicaDelTaller({ herramientas: -500_000 }));
    expect(screen.getByRole('group', { name: 'De dónde sale la plata' })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: `Pasar ${formatearPesos(500_000)} desde Maun y archivar`,
      }),
    );
    expect(encoladas()[0]?.variables).toMatchObject({
      desde_id: MAUN,
      hacia_id: HERRAMIENTAS,
      monto_centavos: 500_000,
    });
  });

  it('si está en la fila no deja archivar y dice por qué', () => {
    const fila = {
      pasos: [{ tesoro: HERRAMIENTAS, clase: 'prioridad', tope: 100, renglones: [], desde: null }],
      reparto: [],
      sueldoPorTrabajo: false,
    };
    const { encoladas, alCerrar } = montar(replicaDelTaller({ fila }));
    expect(screen.getByText('Todavía no se puede archivar Herramientas.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sacalo de la fila, cobrá el trabajo reabierto que lo usa y pasá su plata a otro tesoro. Después archivalo.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /archivar/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(alCerrar).toHaveBeenCalledOnce();
    expect(encoladas()).toEqual([]);
  });
});
