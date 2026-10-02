import {
  borradorNuevo,
  PLANTILLA_DE_SIEMPRE,
  type BorradorDelPresupuesto,
  type ReferenciaEnPesos,
} from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvioDelPresupuesto, FilaDelPresupuesto } from '@/entities/presupuesto';
import type { Proyecto } from '@/entities/proyecto';
import { CLAVE_DE_AJUSTES, ProveedorDeReplica, type EdicionDeAjustes } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { documentoDeHoy } from '../model/documento';
import { envioDelPresupuesto } from '../model/envio';
import { HojaDeMandar } from './HojaDeMandar';

const HOY = '2026-10-02';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const BORRADOR: BorradorDelPresupuesto = {
  ...borradorNuevo({
    titulo: 'Placard de tres puertas',
    obra: '',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  }),
  muebles: [{ id: 'm1', nombre: 'Placard', descripcion: 'Tres puertas corredizas.' }],
};

function proyecto(moneda: 'ARS' | 'USD'): Proyecto {
  return {
    ...METADATOS,
    id: 'p',
    cliente_id: 'c',
    titulo: 'Placard de tres puertas',
    estado: 'a_presupuestar',
    version: 3,
    presupuesto_centavos: 240_000,
    sena_bp: null,
    moneda,
    cobra_en: null,
    direccion_entrega: '',
  } as unknown as Proyecto;
}

const PRESUPUESTO = {
  ...METADATOS,
  id: 'b1',
  proyecto_id: 'p',
  contenido: BORRADOR,
  borrador_version: 2,
  numero: null,
  aceptado_el: null,
} as unknown as FilaDelPresupuesto;

function taller(uno: Proyecto, dolar: { valor: number; el: string } | null): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    sena_bp: 5000,
    dolar_del_dia_centavos: dolar?.valor ?? null,
    dolar_del_dia_el: dolar?.el ?? null,
  } as unknown as FilaDe<'ajustes'>);
  replica = aplicarFilaLocal(replica, 'clientes', {
    ...METADATOS,
    id: 'c',
    nombre: 'Marcela Duarte',
    telefono: '',
  } as unknown as FilaDe<'clientes'>);
  replica = aplicarFilaLocal(replica, 'proyectos', uno);
  return aplicarFilaLocal(replica, 'presupuestos', PRESUPUESTO);
}

function montar(uno: Proyecto, replica: Replica) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const referencias: (ReferenciaEnPesos | null)[] = [];
  const armarElEnvio = (queCambio: string, referencia: ReferenciaEnPesos | null) => {
    referencias.push(referencia);
    return envioDelPresupuesto({
      proyecto: uno,
      proximos: [],
      presupuesto: PRESUPUESTO,
      revisiones: [],
      documento: documentoDeHoy({ replica, proyecto: uno, borrador: BORRADOR, referencia }),
      idioma: 'es',
      queCambio,
      hoy: HOY,
      validezDias: 15,
      revisionId: 'r1',
      momento: `${HOY}T15:00:00Z`,
    });
  };
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <HojaDeMandar
            revision={1}
            numero={null}
            documento={documentoDeHoy({ replica, proyecto: uno, borrador: BORRADOR })}
            hoy={HOY}
            valeHasta="2026-10-17"
            pasaAPresupuestoEnviado={false}
            tildaLaTarea={false}
            todoGuardado
            cliente="Marcela Duarte"
            trabajo="Placard de tres puertas"
            telefono=""
            enlace={{ url: null, crear: () => null }}
            armarElEnvio={armarElEnvio}
            alIrAlCampo={() => undefined}
            alCerrar={() => undefined}
          />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const variables = (clave: readonly string[]) =>
    queryClient
      .getMutationCache()
      .getAll()
      .filter((mutacion) => mutacion.options.mutationKey?.join('/') === clave.join('/'))
      .map((mutacion) => mutacion.state.variables);
  return {
    referencias,
    ajustes: () => variables(CLAVE_DE_AJUSTES) as EdicionDeAjustes[],
    envios: () => variables(['presupuestos', 'mandar']) as EnvioDelPresupuesto[],
  };
}

function botonDeMandar(): HTMLElement {
  return screen.getByRole('button', { name: 'Mandar' });
}

const PREGUNTA = '¿A cuánto está hoy el dólar del presupuesto?';

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('mandar un presupuesto en dólares', () => {
  it('si el dólar del día no es de hoy, lo pide: sin él no deja mandar', () => {
    const uno = proyecto('USD');
    montar(uno, taller(uno, { valor: 150_000, el: '2026-09-30' }));

    expect(screen.getByLabelText(PREGUNTA)).toHaveAccessibleDescription(
      'Hace falta para mandarlo: cada total en dólares lleva al lado sus pesos con este dólar. Queda como el dólar del día, y en este presupuesto no cambia más.',
    );
    expect(botonDeMandar()).toBeDisabled();
    expect(
      screen.getByText(
        'Cada total en dólares lleva sus pesos con el dólar de hoy, y no se recalcula más.',
      ),
    ).toBeInTheDocument();
  });

  it('al mandarlo, lo guarda como dólar del día con la fecha de hoy y lo congela en la referencia', () => {
    const uno = proyecto('USD');
    const { referencias, ajustes, envios } = montar(
      uno,
      taller(uno, { valor: 150_000, el: '2026-09-30' }),
    );

    fireEvent.change(screen.getByLabelText(PREGUNTA), { target: { value: '1540' } });
    expect(
      screen.getByText(/^Cada total en dólares lleva sus pesos con el dólar a \$\s1\.540 de hoy/),
    ).toBeInTheDocument();
    fireEvent.click(botonDeMandar());

    expect(referencias).toEqual([{ cotizacion: 154_000, fecha: HOY }]);
    expect(ajustes()).toEqual([
      {
        id: 'a1',
        cambios: { dolar_del_dia_centavos: 154_000, dolar_del_dia_el: HOY },
        previos: { dolar_del_dia_centavos: 150_000, dolar_del_dia_el: '2026-09-30' },
      },
    ]);
    const [envio] = envios();
    expect(envio?.pedido.documento).toMatchObject({
      forma: 2,
      moneda: 'USD',
      referencia: { cotizacion: 154_000, fecha: HOY },
    });
  });

  it('un dólar fuera de rango dice por qué y no deja mandar', () => {
    const uno = proyecto('USD');
    montar(uno, taller(uno, null));

    fireEvent.change(screen.getByLabelText(PREGUNTA), { target: { value: '0,5' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/\$/);
    expect(botonDeMandar()).toBeDisabled();
  });

  it('con el dólar del día de hoy no lo pide, y lo usa sin volver a guardarlo', () => {
    const uno = proyecto('USD');
    const { referencias, ajustes, envios } = montar(uno, taller(uno, { valor: 154_000, el: HOY }));

    expect(screen.queryByLabelText(PREGUNTA)).toBeNull();
    fireEvent.click(botonDeMandar());

    expect(referencias).toEqual([{ cotizacion: 154_000, fecha: HOY }]);
    expect(ajustes()).toEqual([]);
    expect(envios()).toHaveLength(1);
  });

  it('un presupuesto en pesos se manda como siempre: sin dólar y sin referencia', () => {
    const uno = proyecto('ARS');
    const { referencias, ajustes, envios } = montar(uno, taller(uno, null));

    expect(screen.queryByLabelText(PREGUNTA)).toBeNull();
    expect(screen.queryByText(/lleva sus pesos/)).toBeNull();
    fireEvent.click(botonDeMandar());

    expect(referencias).toEqual([null]);
    expect(ajustes()).toEqual([]);
    expect(envios()[0]?.pedido.documento.forma).toBe(1);
  });
});
