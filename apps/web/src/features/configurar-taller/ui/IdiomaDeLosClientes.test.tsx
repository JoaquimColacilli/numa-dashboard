import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ProveedorDeReplica, type EdicionDeAjustes } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { IdiomaDeLosClientes } from './IdiomaDeLosClientes';

const AJUSTES = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
  id: 'a1',
  idioma_de_los_clientes: 'es',
  plantilla_del_presupuesto: null,
} as unknown as FilaDe<'ajustes'>;

function taller(ajustes: FilaDe<'ajustes'>, conPreguntas = false): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', ajustes);
  if (conPreguntas) {
    replica = aplicarFilaLocal(replica, 'preguntas', {
      id: 'p1',
      deleted_at: null,
      version: 1,
    } as unknown as FilaDe<'preguntas'>);
  }
  return replica;
}

function montar(ajustes: FilaDe<'ajustes'>, conPreguntas = false) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={taller(ajustes, conPreguntas)}>
        <IdiomaDeLosClientes ajustes={ajustes} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    ediciones: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[0] === 'ajustes')
        .map((mutacion) => mutacion.state.variables as EdicionDeAjustes),
  };
}

beforeEach(() => {
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
});

describe('el idioma de los clientes', () => {
  it('ofrece los tres idiomas, con el de los clientes elegido y para qué vale', () => {
    montar(AJUSTES);

    expect(screen.getByRole('group', { name: 'Tus clientes leen en' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(
      screen.getByText(
        'Es el idioma de su página, del presupuesto en PDF, de la encuesta y de los mensajes que les mandás. Lo que escribiste vos queda como lo escribiste.',
      ),
    ).toBeInTheDocument();
  });

  it('elegir otro lo guarda en los ajustes del taller', () => {
    const { ediciones } = montar(AJUSTES);

    fireEvent.click(screen.getByRole('radio', { name: 'Português' }));

    expect(ediciones()).toEqual([
      {
        id: 'a1',
        cambios: { idioma_de_los_clientes: 'pt-BR' },
        previos: { idioma_de_los_clientes: 'es' },
      },
    ]);
  });

  it('en otro idioma, con textos del dueño, avisa que esos siguen como los escribió', () => {
    montar({ ...AJUSTES, idioma_de_los_clientes: 'en' }, true);

    expect(
      screen.getByText(
        'Tus textos del presupuesto y tus preguntas de la encuesta siguen como los escribiste: revisalos si querés que tu cliente los lea en inglés.',
      ),
    ).toBeInTheDocument();
  });

  it('en español, o sin textos propios, no avisa nada', () => {
    montar(AJUSTES, true);
    expect(screen.queryByText(/siguen como los escribiste/)).toBeNull();
    cleanup();

    montar({ ...AJUSTES, idioma_de_los_clientes: 'en' });
    expect(screen.queryByText(/siguen como los escribiste/)).toBeNull();
  });
});
