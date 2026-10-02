import {
  borradorNuevo,
  centavos,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  plata,
  puntosBasicos,
  valoresDelTrabajo,
  type DocumentoDelPresupuesto,
  type ValoresDelPresupuesto,
} from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpcionDePresupuesto, Proyecto, ResumenDeProyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';
import { formatearPesos, formatearPorcentaje } from '@/shared/lib';

import { PantallaDePasaje } from './PantallaDePasaje';

const HOY = '2026-09-14';

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
  titulo: 'Placard de tres puertas',
  estado: 'presupuesto_enviado',
  version: 3,
  presupuesto_centavos: 1_000_000,
  forma_pago: null,
  fecha_inicio: null,
  entrega_estimada: null,
  direccion_entrega: '',
  comprobante: 'sin_comprobante',
  sena_bp: null,
} as unknown as Proyecto;

function documento(plazo: number, valores: ValoresDelPresupuesto | null): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: {
        ...borradorNuevo({
          titulo: 'Placard de tres puertas',
          obra: '',
          plantilla: PLANTILLA_DE_SIEMPRE,
          validezDias: 15,
          idNuevo: () => 'm1',
        }),
        plazoDeFabricacion: plazo,
      },
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: {
        nombre: 'Taller de prueba',
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      },
      cliente: 'Marcela Duarte',
      moneda: 'ARS',
      cobraEn: null,
      valores,
      senaBp: puntosBasicos(5000),
      abonado: centavos(0),
    },
    { plata: (importe) => formatearPesos(importe), porcentaje: formatearPorcentaje },
  );
}

function opcion(id: string, monto: number): OpcionDePresupuesto {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p',
    descripcion: id === 'o1' ? 'Frentes en melamina' : 'Frentes laqueados',
    monto_centavos: monto,
    aprobada: false,
  };
}

function taller(mandado: DocumentoDelPresupuesto | null): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  if (mandado !== null) {
    tablas.presupuestos = {
      b1: {
        ...METADATOS,
        id: 'b1',
        proyecto_id: 'p',
        contenido: {},
        borrador_version: 2,
        numero: '20260910-01',
        aceptado_el: null,
      },
    };
    tablas.revisiones_del_presupuesto = {
      r1: {
        ...METADATOS,
        id: 'r1',
        presupuesto_id: 'b1',
        proyecto_id: 'p',
        revision: 1,
        numero: '20260910-01',
        mandado_el: '2026-09-10',
        vale_hasta: '2026-09-25',
        que_cambio: null,
        contenido: mandado,
      },
    };
  }
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(
  replica: Replica,
  { proyecto = PROYECTO, opciones = [] as OpcionDePresupuesto[] } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const resumen = {
    proyecto,
    cliente: undefined,
    nombreDelCliente: 'Marcela Duarte',
    fase: 'consultas',
    moneda: 'ARS',
    precio: plata('ARS', proyecto.presupuesto_centavos ?? 0),
    cobradoEnSuMoneda: plata('ARS', 0),
    cobradoEnPesos: centavos(0),
    enMaun: centavos(0),
    enDolares: [],
    gastos: centavos(0),
    saldo:
      proyecto.presupuesto_centavos === null ? null : plata('ARS', proyecto.presupuesto_centavos),
    entrega: { fecha: null, comprometida: false, franja: null },
    urgencia: undefined,
  } as unknown as ResumenDeProyecto;
  render(
    <MemoryRouter initialEntries={['/proyectos/p/aprobar']}>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <PantallaDePasaje resumen={resumen} opciones={opciones} />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function campo(etiqueta: string): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>(etiqueta);
}

function enUnRenglon(elemento: HTMLElement): string {
  return elemento.textContent.replace(/\s+/g, ' ');
}

function botonDePasar(): HTMLElement {
  return screen.getByRole('button', { name: /Pasar a Proyectos/ });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
  onlineManager.setOnline(false);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('el pasaje con un presupuesto mandado', () => {
  it('calcula la entrega con el plazo del presupuesto y lo dice', () => {
    montar(taller(documento(30, valoresDelTrabajo(centavos(1_000_000), []))));

    expect(campo('Fecha de inicio').value).toBe(HOY);
    expect(campo('Entrega estimada').value).toBe('2026-10-26');
    expect(campo('Entrega estimada')).toHaveAccessibleDescription(
      'Calculada a 30 días hábiles del inicio, el plazo del presupuesto.',
    );

    fireEvent.change(campo('Fecha de inicio'), { target: { value: '2026-09-21' } });
    expect(campo('Entrega estimada').value).toBe('2026-11-02');
  });

  it('sin presupuesto mandado, siguen los 21 días hábiles', () => {
    montar(taller(null));

    expect(campo('Entrega estimada').value).toBe('2026-10-13');
    expect(campo('Entrega estimada')).toHaveAccessibleDescription(
      'Calculada a 21 días hábiles del inicio.',
    );
  });

  it('si aprueba otro importe que el del presupuesto, lo avisa antes de confirmar', () => {
    montar(taller(documento(30, valoresDelTrabajo(centavos(1_000_000), []))), {
      proyecto: { ...PROYECTO, presupuesto_centavos: 1_200_000 },
    });

    const aviso = screen.getByText(/Acordado al aprobar/);
    expect(enUnRenglon(aviso)).toBe(
      'En el presupuesto Nº 20260910-01 dice $ 10.000. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 12.000».',
    );
    expect(botonDePasar()).toHaveAttribute('aria-describedby', aviso.id);

    fireEvent.change(campo('Presupuesto aprobado'), { target: { value: '10.000' } });
    expect(screen.queryByText(/Acordado al aprobar/)).toBeNull();
    expect(botonDePasar()).not.toHaveAttribute('aria-describedby');
  });

  it('con opciones, avisa solo si la que elige cambió de importe desde que se mandó', () => {
    montar(
      taller(
        documento(
          21,
          valoresDelTrabajo(null, [
            { id: 'o1', descripcion: 'Frentes en melamina', monto: centavos(1_000_000) },
            { id: 'o2', descripcion: 'Frentes laqueados', monto: centavos(1_500_000) },
          ]),
        ),
      ),
      { opciones: [opcion('o1', 1_000_000), opcion('o2', 1_600_000)] },
    );

    fireEvent.click(screen.getByRole('radio', { name: /Frentes en melamina/ }));
    expect(screen.queryByText(/Acordado al aprobar/)).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: /Frentes laqueados/ }));
    expect(enUnRenglon(screen.getByText(/Acordado al aprobar/))).toBe(
      'En el presupuesto Nº 20260910-01 dice $ 15.000. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 16.000».',
    );
  });
});
