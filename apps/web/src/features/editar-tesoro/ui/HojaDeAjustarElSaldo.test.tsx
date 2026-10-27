import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tesoroPorId, tesorosDelTaller, type TesoroDelTaller } from '@/entities/tesoro';
import {
  TABLAS_REPLICADAS,
  type MovimientoNuevo,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import { formatearPesos } from '@/shared/lib';

import { HojaDeAjustarElSaldo } from './HojaDeAjustarElSaldo';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  registrarMovimiento: vi.fn(() => new Promise(() => undefined)),
}));

const HERRAMIENTAS = '01900000-0000-7000-8000-000000000006';
const HOY = '2026-10-26';

function filaDeTesoro(id: string, clave: string | null, nombre: string, tinta: string) {
  return {
    id,
    household_id: 'h',
    clave,
    moneda: 'ARS',
    nombre,
    descripcion: '',
    tinta,
    icono: 'wrench',
    meta_centavos: null,
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

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  const tesoros = [
    filaDeTesoro('01900000-0000-7000-8000-000000000002', 'maun', 'Maun', 'maun'),
    filaDeTesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((fila) => [fila.id, fila]));
  tablas.movimientos = {
    i: {
      id: 'i',
      household_id: 'h',
      fecha: '2026-10-01',
      tipo: 'ingreso',
      tesoro_origen: null,
      tesoro_destino: null,
      desde_id: null,
      hacia_id: HERRAMIENTAS,
      cubre_el_mes: null,
      vencimiento: null,
      monto_centavos: 15_000_000,
      monto_destino_centavos: null,
      categoria: '',
      descripcion: '',
      proyecto_id: null,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
      deleted_at: null,
      version: 1,
    },
  };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function herramientas(): TesoroDelTaller {
  const tesoro = tesoroPorId(tesorosDelTaller(replicaDelTaller()), HERRAMIENTAS);
  if (tesoro === undefined) throw new Error('No está Herramientas');
  return tesoro;
}

function montar({ conVolver = true }: { conVolver?: boolean } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  const alVolver = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <HojaDeAjustarElSaldo
        tesoro={herramientas()}
        alCerrar={alCerrar}
        {...(conVolver ? { alVolver } : {})}
      />
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    alVolver,
    movimientos: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          movimiento: mutacion.state.variables as MovimientoNuevo,
        })),
  };
}

function enVivo(): string {
  return screen.getByRole('status').textContent.replace(/\s/g, ' ');
}

function pesos(centavos: number): string {
  return formatearPesos(centavos).replace(/\s/g, ' ');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
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

describe('ajustar el saldo de un tesoro', () => {
  it('arranca con lo que tiene y dice en vivo cuánto se suma o se resta', () => {
    montar();
    expect(
      screen.getByRole('heading', { name: 'Ajustar el saldo de Herramientas' }),
    ).toBeInTheDocument();
    const tieneAhora = screen.getByRole('textbox', { name: 'Tiene ahora' });
    expect(tieneAhora).toHaveValue('150.000');
    expect(enVivo()).toBe('Queda igual');
    const ajustar = screen.getByRole('button', { name: 'Ajustar' });
    expect(ajustar).toBeDisabled();

    fireEvent.change(tieneAhora, { target: { value: '200.000' } });
    expect(enVivo()).toBe(`Se suman ${pesos(5_000_000)}`);
    expect(ajustar).toBeEnabled();

    fireEvent.change(tieneAhora, { target: { value: '120.000' } });
    expect(enVivo()).toBe(`Se restan ${pesos(3_000_000)}`);
    expect(ajustar).toBeEnabled();

    fireEvent.change(tieneAhora, { target: { value: '150.000' } });
    expect(enVivo()).toBe('Queda igual');
    expect(ajustar).toBeDisabled();
  });

  it('ofrece los motivos para tocar, y uno escrito los reemplaza', () => {
    montar();
    const porQue = screen.getByRole('group', { name: 'Por qué (opcional)' });
    const motivos = within(porQue)
      .getAllByRole('button')
      .map((boton) => [boton.textContent, boton.getAttribute('aria-pressed')]);
    expect(motivos).toEqual([
      ['Intereses', 'false'],
      ['Venta', 'false'],
      ['Corrección', 'false'],
    ]);
    fireEvent.click(within(porQue).getByRole('button', { name: 'Venta' }));
    expect(within(porQue).getByRole('button', { name: 'Venta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(within(porQue).getByRole('button', { name: 'Venta' }));
    expect(within(porQue).getByRole('button', { name: 'Venta' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(within(porQue).getByRole('button', { name: 'Intereses' }));
    fireEvent.change(within(porQue).getByRole('textbox', { name: 'O escribilo' }), {
      target: { value: 'Me olvidé de anotarlo' },
    });
    expect(within(porQue).getByRole('button', { name: 'Intereses' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('manda un ajuste por la diferencia, que resta del tesoro, con el motivo elegido', () => {
    const { movimientos, alCerrar } = montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tiene ahora' }), {
      target: { value: '120.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Venta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));

    expect(movimientos()).toEqual([
      {
        clave: ['movimientos', 'registrar'],
        movimiento: {
          id: expect.any(String) as string,
          fecha: HOY,
          tipo: 'ajuste',
          desde_id: HERRAMIENTAS,
          hacia_id: null,
          monto_centavos: 3_000_000,
          categoria: 'Venta',
          descripcion: '',
        },
      },
    ]);
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('lo que se suma entra al tesoro, con el motivo escrito y la fecha elegida', () => {
    const { movimientos } = montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tiene ahora' }), {
      target: { value: '160.000' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'O escribilo' }), {
      target: { value: '  Me olvidé   de anotarlo ' },
    });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-10-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
    expect(movimientos()[0]?.movimiento).toMatchObject({
      fecha: '2026-10-20',
      tipo: 'ajuste',
      desde_id: null,
      hacia_id: HERRAMIENTAS,
      monto_centavos: 1_000_000,
      categoria: 'Me olvidé de anotarlo',
    });
  });

  it('con «Apertura» de motivo, el ajuste va sin categoría', () => {
    const { movimientos } = montar();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tiene ahora' }), {
      target: { value: '160.000' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'O escribilo' }), {
      target: { value: 'Apertura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
    expect(movimientos()[0]?.movimiento.categoria).toBe('');
  });

  it('la fecha es hoy o un día que ya pasó', () => {
    const { movimientos } = montar();
    const fecha = screen.getByLabelText('Fecha');
    expect(fecha).toHaveValue(HOY);
    fireEvent.change(screen.getByRole('textbox', { name: 'Tiene ahora' }), {
      target: { value: '160.000' },
    });
    fireEvent.change(fecha, { target: { value: '2026-10-27' } });
    expect(fecha).toHaveAccessibleDescription(/Elegí hoy o un día que ya pasó\./);
    const ajustar = screen.getByRole('button', { name: 'Ajustar' });
    expect(ajustar).toBeDisabled();
    fireEvent.click(ajustar);
    expect(movimientos()).toEqual([]);
  });

  it('«Volver» vuelve a la hoja del tesoro sin mandar nada', () => {
    const conVolver = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(conVolver.alVolver).toHaveBeenCalledOnce();
    expect(conVolver.alCerrar).not.toHaveBeenCalled();
    expect(conVolver.movimientos()).toEqual([]);
  });

  it('sin a dónde volver, «Volver» cierra', () => {
    const { alCerrar } = montar({ conVolver: false });
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(alCerrar).toHaveBeenCalledOnce();
  });
});
