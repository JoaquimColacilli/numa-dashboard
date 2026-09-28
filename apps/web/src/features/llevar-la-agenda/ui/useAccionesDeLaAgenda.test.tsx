import { centavos, type EventoVencimiento } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { useAccionesDeLaAgenda } from './useAccionesDeLaAgenda';

const MAUN = '01900000-0000-7000-8000-000000000002';
const FIJOS = '01900000-0000-7000-8000-000000000005';

function filaDeTesoro(id: string, clave: string | null, nombre: string) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
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

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.tesoros = Object.fromEntries(
    [filaDeTesoro(MAUN, 'maun', 'Maun'), filaDeTesoro(FIJOS, null, 'Gastos fijos')].map((fila) => [
      fila.id,
      fila,
    ]),
  );
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function vencimiento(tesoro: string, renglon: string, fecha: string): EventoVencimiento {
  return {
    clase: 'vencimiento',
    id: `vencimiento:${tesoro}:0:${fecha}`,
    categoria: 'vencimiento',
    fecha,
    hora: null,
    tesoro,
    nombreDelTesoro: '',
    renglon,
    monto: centavos(50_000_000),
    hecha: false,
    importante: false,
  };
}

function fondoDe(estado: unknown): string {
  if (typeof estado !== 'object' || estado === null || !('fondo' in estado)) return '';
  const fondo: unknown = estado.fondo;
  if (typeof fondo !== 'object' || fondo === null || !('pathname' in fondo)) return '';
  return typeof fondo.pathname === 'string' ? fondo.pathname : '';
}

function Acciones({ evento }: { evento: EventoVencimiento }) {
  const acciones = useAccionesDeLaAgenda();
  const location = useLocation();
  const { pathname, search } = location;
  const fondo = fondoDe(location.state);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          acciones.alRegistrarElPago?.(evento);
        }}
      >
        Pagar
      </button>
      <button
        type="button"
        onClick={() => {
          acciones.alAbrirVencimiento?.(evento);
        }}
      >
        Abrir
      </button>
      <output data-testid="donde">{`${pathname}${search}`}</output>
      <output data-testid="fondo">{fondo}</output>
    </>
  );
}

function montar(evento: EventoVencimiento) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProveedorDeReplica replica={replicaDelTaller()}>
        <MemoryRouter initialEntries={['/agenda']}>
          <Acciones evento={evento} />
        </MemoryRouter>
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-28T15:00:00-03:00'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('registrar el pago de un vencimiento desde la agenda', () => {
  it('abre la hoja del gasto de ese tesoro, con el monto y el renglón, encima de la agenda', () => {
    montar(vencimiento(FIJOS, 'Alquiler', '2026-09-10'));
    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(screen.getByTestId('donde')).toHaveTextContent(
      `/finanzas/nuevo?clase=gasto_tesoro&tesoro=${FIJOS}&monto=50000000&categoria=Alquiler`,
    );
    expect(screen.getByTestId('fondo')).toHaveTextContent('/agenda');
  });

  it('desde Maun va como gasto del taller, y uno de un mes que pasó lleva su día', () => {
    montar(vencimiento(MAUN, 'Costos fijos', '2026-08-10'));
    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(screen.getByTestId('donde')).toHaveTextContent(
      '/finanzas/nuevo?clase=gasto_maun&monto=50000000&categoria=Costos+fijos&fecha=2026-08-10',
    );
  });

  it('abrirlo lleva a Tesoros con ese compromiso elegido', () => {
    montar(vencimiento(FIJOS, 'Alquiler', '2026-09-10'));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByTestId('donde')).toHaveTextContent(`/tesoros?tesoro=${FIJOS}`);
  });
});
