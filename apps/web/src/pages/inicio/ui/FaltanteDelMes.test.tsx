import { centavos } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import type { FaltanteEnInicio } from '../model/la-fila';
import { FaltanteDelMes } from './FaltanteDelMes';

const MAUN = '01900000-0000-7000-8000-000000000002';
const FIJOS = '01900000-0000-7000-8000-000000000005';

function filaDeTesoro(id: string, clave: string | null, nombre: string, tinta: string) {
  return {
    id,
    household_id: 'h',
    clave,
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

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.ajustes = {
    a: { id: 'a', household_id: 'h', meta_cocos_centavos: 0, tasa_cocos_anual_bp: 0, fila: null },
  };
  const tesoros = [
    filaDeTesoro(MAUN, 'maun', 'Maun', 'maun'),
    filaDeTesoro(FIJOS, null, 'Gastos fijos', 'grana'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((una) => [una.id, una]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const GASTOS_FIJOS: FaltanteEnInicio = {
  tesoro: FIJOS,
  nombre: 'gastos fijos',
  falta: centavos(27_000_000),
};

function montar(faltantes: readonly FaltanteEnInicio[], hoy: string, sePuedeCubrir = true) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ProveedorDeReplica replica={replicaDelTaller()}>
        <FaltanteDelMes
          faltantes={faltantes}
          mes="2026-09"
          hoy={hoy}
          sePuedeCubrir={sePuedeCubrir}
        />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
}

function llano(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('el faltante de los gastos fijos en Inicio', () => {
  it('dice cuánto falta, cuántos días quedan y abre la hoja para cubrirlo con otro tesoro', () => {
    montar([GASTOS_FIJOS], '2026-09-27');

    const aviso = screen.getByRole('region', { name: 'Falta para gastos fijos' });
    const [faltan, dias] = within(aviso).getAllByRole('paragraph');
    expect(llano(faltan?.textContent ?? null)).toBe(
      'Faltan $ 270.000 para gastos fijos de septiembre.',
    );
    expect(llano(dias?.textContent ?? null)).toBe(
      'Quedan 3 días del mes. El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.',
    );

    fireEvent.click(within(aviso).getByRole('button', { name: 'Elegir de qué tesoro sacar' }));
    const hoja = screen.getByRole('dialog', { name: /Cubrir los gastos fijos/ });
    expect(hoja).toHaveTextContent(/Faltan \$\s270\.000 en septiembre/);
    expect(
      within(hoja).getByRole('button', { name: /Pasar .* a Gastos fijos/ }),
    ).toBeInTheDocument();
  });

  it('en la primera quincena lleva solo la primera frase, y el botón queda', () => {
    montar([GASTOS_FIJOS], '2026-09-10');

    const aviso = screen.getByRole('region', { name: 'Falta para gastos fijos' });
    expect(within(aviso).getAllByRole('paragraph')).toHaveLength(1);
    expect(within(aviso).queryByText(/Quedan/)).toBeNull();
    expect(
      within(aviso).getByRole('button', { name: 'Elegir de qué tesoro sacar' }),
    ).toBeInTheDocument();
  });

  it('sin los tesoros del taller todavía, avisa pero no ofrece cubrir', () => {
    montar([GASTOS_FIJOS], '2026-09-27', false);

    const aviso = screen.getByRole('region', { name: 'Falta para gastos fijos' });
    expect(within(aviso).queryByRole('button')).toBeNull();
  });

  it('sin faltante no dice nada', () => {
    const { container } = montar([], '2026-09-27');
    expect(container).toBeEmptyDOMElement();
  });
});
