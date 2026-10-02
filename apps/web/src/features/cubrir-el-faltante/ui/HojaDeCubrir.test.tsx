import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import {
  TABLAS_REPLICADAS,
  type MovimientoNuevo,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import { avisosDeLaMeta, formatearPesos } from '@/shared/lib';

import { HojaDeCubrir } from './HojaDeCubrir';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  registrarMovimiento: vi.fn(() => new Promise(() => undefined)),
}));

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const DOLARES = '01900000-0000-7000-8000-000000000006';

function filaDeTesoro(
  id: string,
  clave: string | null,
  nombre: string,
  tinta: string,
  moneda = 'ARS',
) {
  return {
    id,
    household_id: 'h',
    clave,
    moneda,
    nombre,
    descripcion: '',
    tinta,
    icono: 'receipt',
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

function replicaDelTaller(fila: unknown = null, conDolares = false): Replica {
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
    filaDeTesoro(FIJOS, null, 'Gastos fijos', 'grana'),
    ...(conDolares ? [filaDeTesoro(DOLARES, null, 'Dólares', 'petroleo', 'USD')] : []),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((una) => [una.id, una]));
  const movimientos = [
    ingreso(MAUN, 'maun', 124_800_000),
    ingreso(HOGAR, 'hogar', 41_230_000),
    ingreso(DIEZMO, 'diezmo', 27_000_000),
    ingreso(COCOS, 'cocos', 341_500_000),
    ingreso(FIJOS, null, 13_000_000),
    ...(conDolares ? [ingreso(DOLARES, null, 50_000)] : []),
  ];
  tablas.movimientos = Object.fromEntries(movimientos.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(
  tesoroDelPaso = FIJOS,
  faltante = 27_000_000,
  fila: unknown = null,
  conDolares = false,
) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaDelTaller(fila, conDolares)}>
        <HojaDeCubrir
          tesoroDelPaso={tesoroDelPaso}
          mes="2026-09"
          faltante={faltante}
          alCerrar={alCerrar}
        />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    encolados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          movimiento: mutacion.state.variables as MovimientoNuevo,
          silencioso: avisosDeLaMeta(mutacion.meta)?.silencioso,
        })),
  };
}

function pesos(centavos: number): string {
  return formatearPesos(centavos).replace(/\s/g, ' ');
}

function renglon(nombre: string): HTMLElement {
  const casilla = screen.getByRole('checkbox', { name: new RegExp(nombre) });
  const item = casilla.closest('li');
  if (!item) throw new Error(`No está el renglón de ${nombre}`);
  return item;
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

describe('cubrir el faltante de los gastos fijos', () => {
  it('con un compromiso que se renueva al pagar, habla de su monto y no del mes', () => {
    montar(FIJOS, 27_000_000, {
      pasos: [
        {
          tesoro: FIJOS,
          clase: 'fijos',
          tope: 90_000_000,
          renglones: [{ nombre: 'Alquiler', monto: 90_000_000, dia: 10 }],
          desde: null,
          modo: 'saldo',
          hastaLaMeta: false,
        },
      ],
      reparto: [],
      sueldoPorTrabajo: false,
    });
    expect(
      screen.getByText(`Faltan ${pesos(27_000_000)} para completar su monto`),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lo que pases queda en el tesoro/)).toBeInTheDocument();
    expect(screen.queryByText(/en septiembre/)).not.toBeInTheDocument();
  });

  it('viene con Maun elegido y todo el faltante, sin el diezmo ni el mismo paso', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Cubrir los gastos fijos' })).toBeInTheDocument();
    expect(screen.getByText(`Faltan ${pesos(27_000_000)} en septiembre`)).toBeInTheDocument();

    const casillas = within(screen.getByRole('list', { name: 'De qué tesoro sale' })).getAllByRole(
      'checkbox',
    );
    expect(
      casillas.map((casilla) => casilla.closest('label')?.querySelector('.truncate')?.textContent),
    ).toEqual(['Maun', 'Hogar', 'Cocos']);
    expect(casillas[0]).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Cuánto sale de Maun' })).toHaveValue('270.000');
    expect(
      within(renglon('Maun')).getByText(`Maun queda en ${pesos(97_800_000)}`),
    ).toBeInTheDocument();
    expect(
      within(renglon('Cocos')).getByText('Es el ahorro invertido: si lo usás, la meta se atrasa.'),
    ).toBeInTheDocument();
    expect(within(renglon('Hogar')).getByText('Es la plata de la familia.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Pasar ${formatearPesos(27_000_000)} a Gastos fijos` }),
    ).toBeEnabled();
  });

  it('no deja pasar más que el faltante', () => {
    const { encolados } = montar();
    fireEvent.click(screen.getByRole('checkbox', { name: /Cocos/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuánto sale de Cocos' }), {
      target: { value: '50.000' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      `Te pasás por ${pesos(5_000_000)}: faltan ${pesos(27_000_000)}.`,
    );
    const boton = screen.getByRole('button', { name: /^Pasar/ });
    expect(boton).toBeDisabled();
    fireEvent.click(boton);
    expect(encolados()).toEqual([]);
  });

  it('no deja sacar más de lo que tiene cada uno', () => {
    montar(FIJOS, 60_000_000);
    fireEvent.click(screen.getByRole('checkbox', { name: /Maun/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Hogar/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuánto sale de Hogar' }), {
      target: { value: '500.000' },
    });
    const campo = screen.getByRole('textbox', { name: 'Cuánto sale de Hogar' });
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(
      `No alcanza: Hogar tiene ${formatearPesos(41_230_000)}.`,
    );
    expect(screen.getByRole('button', { name: /^Pasar/ })).toBeDisabled();
  });

  it('arma una transferencia por tesoro, hacia el paso, con el mes que cubre', () => {
    const { encolados, alCerrar } = montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuánto sale de Maun' }), {
      target: { value: '200.000' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /Cocos/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuánto sale de Cocos' }), {
      target: { value: '70.000' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: `Pasar ${formatearPesos(27_000_000)} a Gastos fijos` }),
    );

    const [deMaun, deCocos] = encolados();
    expect(deMaun?.clave).toEqual(['movimientos', 'registrar']);
    expect(deMaun?.movimiento).toMatchObject({
      tipo: 'transferencia',
      tesoro_origen: 'maun',
      tesoro_destino: null,
      desde_id: MAUN,
      hacia_id: FIJOS,
      cubre_el_mes: '2026-09-01',
      monto_centavos: 20_000_000,
    } satisfies Partial<MovimientoNuevo>);
    expect(deCocos?.movimiento).toMatchObject({
      tesoro_origen: 'cocos',
      desde_id: COCOS,
      hacia_id: FIJOS,
      cubre_el_mes: '2026-09-01',
      monto_centavos: 7_000_000,
    });
    expect([deMaun?.silencioso, deCocos?.silencioso]).toEqual([true, false]);
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('por moneda: un tesoro en dólares no cubre los gastos fijos, que son en pesos', () => {
    montar(FIJOS, 27_000_000, null, true);
    const casillas = within(screen.getByRole('list', { name: 'De qué tesoro sale' })).getAllByRole(
      'checkbox',
    );
    expect(
      casillas.map((casilla) => casilla.closest('label')?.querySelector('.truncate')?.textContent),
    ).toEqual(['Maun', 'Hogar', 'Cocos']);
    expect(screen.queryByText(/Dólares/)).toBeNull();
  });

  it('si el paso es Maun, Maun no aparece y no viene nada elegido', () => {
    montar(MAUN);
    expect(screen.queryByRole('checkbox', { name: /Maun/ })).toBeNull();
    expect(
      screen.getAllByRole('checkbox').every((casilla) => !(casilla as HTMLInputElement).checked),
    ).toBe(true);
    expect(screen.getByRole('button', { name: /^Pasar/ })).toBeDisabled();
  });
});
