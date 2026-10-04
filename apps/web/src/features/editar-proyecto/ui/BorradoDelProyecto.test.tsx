import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Proyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { BorradoDelProyecto } from './BorradoDelProyecto';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const PROYECTO = {
  ...METADATOS,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Placard de pino',
  estado: 'en_curso',
} as unknown as Proyecto;

function conUnaFactura(ambiente: string): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'proyectos', PROYECTO);
  return aplicarFilaLocal(replica, 'comprobantes', {
    ...METADATOS,
    id: 'f1',
    proyecto_id: 'p',
    pago_id: 'pago',
    tipo: 'factura_c',
    ambiente,
    estado: 'anulada',
    pedida_at: '2026-10-03T14:00:00Z',
  } as unknown as FilaDe<'comprobantes'>);
}

function montar(replica: Replica) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProveedorDeReplica replica={replica}>
        <BorradoDelProyecto proyecto={PROYECTO} variante="proyecto" alBorrar={() => undefined} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Borrar' }));
  return screen.getByRole('alertdialog', { name: '¿Borrás «Placard de pino»?' });
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

describe('borrar un trabajo con facturas de ARCA', () => {
  it('con una factura de verdad, aunque esté anulada, no ofrece borrarlo y dice qué hacer', () => {
    const dialogo = montar(conUnaFactura('produccion'));
    expect(dialogo).toHaveTextContent(
      'Este trabajo tiene facturas de ARCA y no se puede borrar. Si no sigue, dalo por perdido.',
    );
    expect(within(dialogo).queryByRole('button', { name: 'Borrar el proyecto' })).toBeNull();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('con una de prueba se borra como siempre', () => {
    const dialogo = montar(conUnaFactura('homologacion'));
    expect(within(dialogo).getByRole('button', { name: 'Borrar el proyecto' })).toBeEnabled();
  });
});
