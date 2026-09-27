import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useReplica } from '@/entities/replica';
import { CLAVE_DE_SESION, sincronizar, type Replica } from '@/shared/api';
import { claveDeReplica } from '@/shared/lib';

import { traerLaReplicaDeLaSesionGuardada } from './replica-al-abrir';

vi.mock('@/shared/api', async (original) => ({
  ...(await original<typeof import('@/shared/api')>()),
  sincronizar: vi.fn(),
}));

const USUARIO = '0199aaaa-0000-7000-8000-000000000001';

function replicaDe(usuarioId: string): Replica {
  return { usuarioId, cursor: 'c', reconciliadoEn: 'r', tablas: {} } as unknown as Replica;
}

let queryClient: QueryClient;
let soltar: (replica: Replica) => void = () => undefined;

beforeEach(() => {
  queryClient = new QueryClient();
  vi.mocked(sincronizar).mockImplementation(
    () =>
      new Promise<Replica>((resolver) => {
        soltar = resolver;
      }),
  );
  localStorage.setItem(CLAVE_DE_SESION, JSON.stringify({ user: { id: USUARIO } }));
});

afterEach(() => {
  queryClient.clear();
  localStorage.clear();
  vi.mocked(sincronizar).mockReset();
});

describe('la réplica que falta sale apenas se sabe', () => {
  it('con la sesión guardada y sin réplica, el pedido sale con la clave de la réplica', () => {
    expect(traerLaReplicaDeLaSesionGuardada(queryClient, '/')).toBe(true);

    expect(sincronizar).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sincronizar).mock.calls[0]?.[0]).toMatchObject({ usuarioId: USUARIO });
    expect(queryClient.getQueryState(claveDeReplica(USUARIO))?.fetchStatus).toBe('fetching');
  });

  it('useReplica se engancha al pedido en vuelo en vez de hacer otro', async () => {
    traerLaReplicaDeLaSesionGuardada(queryClient, '/proyectos');
    const envoltorio = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useReplica(USUARIO), { wrapper: envoltorio });

    soltar(replicaDe(USUARIO));

    await waitFor(() => {
      expect(result.current.data?.usuarioId).toBe(USUARIO);
    });
    expect(sincronizar).toHaveBeenCalledTimes(1);
  });

  it('con la réplica ya guardada no pide nada: la trae la pantalla, por delta', () => {
    queryClient.setQueryData(claveDeReplica(USUARIO), replicaDe(USUARIO));

    expect(traerLaReplicaDeLaSesionGuardada(queryClient, '/')).toBe(false);
    expect(sincronizar).not.toHaveBeenCalled();
  });

  it('sin sesión guardada no pide nada', () => {
    localStorage.clear();

    expect(traerLaReplicaDeLaSesionGuardada(queryClient, '/')).toBe(false);
    expect(sincronizar).not.toHaveBeenCalled();
  });

  it('en el acceso no pide nada: ahí la sesión puede estar cambiando por el enlace de un correo', () => {
    expect(traerLaReplicaDeLaSesionGuardada(queryClient, '/acceso')).toBe(false);
    expect(traerLaReplicaDeLaSesionGuardada(queryClient, '/acceso/nueva-contrasena')).toBe(false);
    expect(sincronizar).not.toHaveBeenCalled();
  });
});
