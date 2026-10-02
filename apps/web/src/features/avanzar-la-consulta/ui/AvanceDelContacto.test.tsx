import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { situacionDelContacto, type Proyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { AvanceDelContacto } from './AvanceDelContacto';

const HOY = '2026-09-14';

const A_PRESUPUESTAR = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-10T12:00:00Z',
  deleted_at: null,
  version: 2,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Placard',
  estado: 'a_presupuestar',
  presupuesto_centavos: null,
  moneda: 'ARS',
  cobra_en: null,
  fecha_visita: '2026-09-10',
  visita_hecha: true,
  ultimo_contacto: '2026-09-10',
  vencimiento_presupuesto: '2026-09-17',
  presupuesto_vale_hasta: null,
  presupuesto_diseno: false,
  presupuesto_despiece: false,
  presupuesto_cotizacion: false,
  presupuesto_pdf: false,
} as unknown as Proyecto;

function taller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function Ubicacion() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacion">{pathname}</output>;
}

function montar(proyecto: Proyecto) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={taller()}>
        <MemoryRouter initialEntries={['/proyectos/p']}>
          <Routes>
            <Route
              path="/proyectos/p"
              element={
                <AvanceDelContacto
                  proyecto={proyecto}
                  etapa="a_presupuestar"
                  situacion={situacionDelContacto(proyecto, proyecto.updated_at, HOY, 0)}
                  cobrado={0}
                  conOpciones={false}
                  alAgendar={vi.fn()}
                />
              }
            />
            <Route path="/proyectos/p/presupuesto" element={<Ubicacion />} />
          </Routes>
        </MemoryRouter>
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    guardados: () => queryClient.getMutationCache().getAll(),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

describe('«Mandé el presupuesto» sin el documento', () => {
  it('en un trabajo en pesos pregunta cuánto presupuestaste, como siempre', () => {
    montar(A_PRESUPUESTAR);

    fireEvent.click(screen.getByRole('button', { name: 'Mandé el presupuesto' }));

    expect(screen.getByRole('textbox', { name: 'Cuánto presupuestaste' })).toBeInTheDocument();
  });

  it('en un trabajo en dólares lleva a armar el presupuesto, que sale con su referencia y su cláusula', () => {
    const { guardados } = montar({ ...A_PRESUPUESTAR, moneda: 'USD' });

    fireEvent.click(screen.getByRole('button', { name: 'Mandé el presupuesto' }));

    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/proyectos/p/presupuesto');
    expect(guardados()).toEqual([]);
  });
});
