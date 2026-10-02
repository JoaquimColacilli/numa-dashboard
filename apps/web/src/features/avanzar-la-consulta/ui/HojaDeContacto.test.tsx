import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuardadoDeProyecto, Proyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type FilaDe, type Replica, type TablaReplicada } from '@/shared/api';

import { HojaDeContacto } from './HojaDeContacto';

const HOY = '2026-09-14';
const DOLARES = 'tesoro-usd';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function proyecto(extra: Partial<Proyecto> = {}): Proyecto {
  return {
    ...METADATOS,
    version: 3,
    id: 'p',
    cliente_id: 'c',
    titulo: 'Placard',
    descripcion: '',
    estado: 'a_presupuestar',
    presupuesto_centavos: null,
    sena_bp: null,
    forma_pago: null,
    cobro_sena: null,
    cobro_saldo: null,
    moneda: 'USD',
    cobra_en: ['ARS'],
    costos_cotizacion_centavos: null,
    comprobante: 'sin_comprobante',
    fecha_visita: null,
    visita_hora: null,
    ultimo_contacto: null,
    fecha_inicio: null,
    entrega_estimada: null,
    entrega_hora: null,
    fecha_entrega: null,
    direccion_entrega: '',
    notas: '',
    vencimiento_presupuesto: null,
    costo_madera_centavos: null,
    costo_herrajes_centavos: null,
    costo_flete_centavos: null,
    costo_ayudante_centavos: null,
    fecha_cobro: null,
    dist_cobrado_centavos: null,
    dist_gastos_centavos: null,
    dist_diezmo_bp: null,
    dist_tope_sueldo_centavos: null,
    dist_tope_fijos_centavos: null,
    dist_diezmo_centavos: null,
    dist_sueldo_centavos: null,
    dist_fijos_centavos: null,
    dist_remanente_centavos: null,
    dist_objetivo_sueldo_centavos: null,
    dist_objetivo_fijos_centavos: null,
    dist_sueldo_mensual: null,
    dist_sueldo_previo_centavos: null,
    dist_fijos_previo_centavos: null,
    dist_liquidado_at: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fecha_cobro: null,
    reapertura_fila: null,
    dist_fila_version: null,
    dist_fila: null,
    dist_previo: null,
    reparto_ya_en_la_apertura: false,
    presupuesto_vale_hasta: null,
    listo_el: null,
    entrega_comprometida: null,
    entrega_comprometida_franja: null,
    tipo_de_proyecto: null,
    presupuesto_diseno: false,
    presupuesto_despiece: false,
    presupuesto_cotizacion: false,
    presupuesto_pdf: false,
    visita_hecha: false,
    visita_importante: false,
    entrega_importante: false,
    presupuesto_importante: false,
    ...extra,
  };
}

function taller({
  conTesoroEnDolares = true,
  dolarDelDia = 154_000,
}: { conTesoroEnDolares?: boolean; dolarDelDia?: number | null } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.clientes = {
    c: { ...METADATOS, id: 'c', nombre: 'Marcela Duarte', telefono: '11 5555-0000' },
  };
  tablas.ajustes = {
    aj: {
      ...METADATOS,
      id: 'aj',
      sena_bp: 5000,
      dolar_del_dia_centavos: dolarDelDia,
      dolar_del_dia_el: dolarDelDia === null ? null : HOY,
    },
  };
  if (conTesoroEnDolares) {
    tablas.tesoros = {
      [DOLARES]: {
        ...METADATOS,
        id: DOLARES,
        clave: null,
        moneda: 'USD',
        nombre: 'Dólares',
        descripcion: '',
        tinta: 'grana',
        icono: 'banknote',
        meta_centavos: null,
        rinde_anual_bp: null,
        orden: 1,
        archivado_at: null,
      } satisfies Partial<FilaDe<'tesoros'>>,
    };
  }
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(
  replica: Replica,
  fila: Proyecto,
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <HojaDeContacto
            proyecto={fila}
            alCerrar={vi.fn()}
            alCrearUnTesoroEnDolares={alCrearUnTesoroEnDolares}
          />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return {
    pagos: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .flatMap((mutacion) => (mutacion.state.variables as GuardadoDeProyecto).pedido.pagos),
  };
}

function escribirLaSena(texto: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: 'Seña cobrada' }), {
    target: { value: texto },
  });
}

function guardar(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
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
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('la seña cobrada, en un trabajo en dólares', () => {
  it('en pesos viene con el dólar del día, dice cuánto descuenta y viaja con su dólar', () => {
    const { pagos } = montar(taller(), proyecto());

    escribirLaSena('184.800');
    expect(screen.getByRole('textbox', { name: 'Dólar' })).toHaveValue('1.540');
    expect(screen.getByText(/^Descuenta US\$\s120 del precio\.$/u)).toBeInTheDocument();
    expect(
      screen.getByText('Lo que te dejó en la visita. Entra a la caja del taller.'),
    ).toBeInTheDocument();

    guardar();
    expect(pagos()).toEqual([
      expect.objectContaining({
        fecha: HOY,
        concepto: 'Seña de la visita',
        monto_centavos: 18_480_000,
        moneda: 'ARS',
        cotizacion_centavos: 154_000,
        tesoro_id: null,
      }),
    ]);
  });

  it('en pesos sin el dólar del día de hoy pide a cuánto se tomó, y sin él no guarda', () => {
    const { pagos } = montar(taller({ dolarDelDia: null }), proyecto());

    escribirLaSena('184.800');
    const dolar = screen.getByRole('textbox', { name: 'Dólar' });
    expect(dolar).toHaveValue('');

    guardar();
    expect(pagos()).toEqual([]);
    expect(dolar).toHaveAccessibleDescription('¿A cuánto se tomó?');
  });

  it('en dólares entra al tesoro en dólares y viaja con su moneda, su dólar y su tesoro', () => {
    const { pagos } = montar(taller(), proyecto());

    fireEvent.click(screen.getByRole('button', { name: 'Pasar a dólares' }));
    escribirLaSena('100');
    expect(screen.getByText('Entra a «Dólares».')).toBeInTheDocument();
    expect(screen.getByText('Lo que te dejó en la visita.')).toBeInTheDocument();

    guardar();
    expect(pagos()).toEqual([
      expect.objectContaining({
        monto_centavos: 10_000,
        moneda: 'USD',
        cotizacion_centavos: 154_000,
        tesoro_id: DOLARES,
      }),
    ]);
  });

  it('sin tesoro en dólares ofrece crearlo, y no guarda una seña en dólares sin adónde entrar', () => {
    const alCrear = vi.fn();
    const { pagos } = montar(taller({ conTesoroEnDolares: false }), proyecto(), alCrear);

    fireEvent.click(screen.getByRole('button', { name: 'Pasar a dólares' }));
    escribirLaSena('100');
    fireEvent.click(screen.getByRole('button', { name: 'Crear un tesoro en dólares' }));
    expect(alCrear).toHaveBeenCalledTimes(1);

    guardar();
    expect(pagos()).toEqual([]);
    expect(screen.getByRole('alert')).toHaveTextContent('Elegí a qué tesoro en dólares entra.');
  });
});

describe('la seña cobrada, en un trabajo en pesos', () => {
  it('se ve y se guarda como siempre: sin dólar y con las claves de un pago en pesos', () => {
    const { pagos } = montar(taller(), proyecto({ moneda: 'ARS', cobra_en: null }));

    escribirLaSena('150.000');
    expect(screen.queryByRole('textbox', { name: 'Dólar' })).toBeNull();

    guardar();
    expect(pagos()).toEqual([
      expect.objectContaining({
        monto_centavos: 15_000_000,
        moneda: 'ARS',
        cotizacion_centavos: null,
        tesoro_id: null,
      }),
    ]);
  });
});
