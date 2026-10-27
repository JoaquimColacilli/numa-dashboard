import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_PROYECTO, type GuardadoDeProyecto, type Proyecto } from '@/entities/proyecto';
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
    respuestas_de_la_consulta: [],
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
    c: {
      ...METADATOS,
      id: 'c',
      nombre: 'Marcela Duarte',
      telefono: '11 5555-0000',
      direccion: 'Olazábal 1240, Ituzaingó',
    },
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
  fila: Proyecto | undefined,
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void,
  visitaPropuesta: { dia: string; hora: string | null } | null = null,
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
            visitaPropuesta={visitaPropuesta}
            alCerrar={vi.fn()}
            alCrearUnTesoroEnDolares={alCrearUnTesoroEnDolares}
          />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const guardados = () =>
    queryClient
      .getMutationCache()
      .getAll()
      .filter((mutacion) => mutacion.options.mutationKey?.join('/') === CLAVE_DE_PROYECTO.join('/'))
      .map((mutacion) => mutacion.state.variables as GuardadoDeProyecto);
  return {
    guardados,
    pagos: () => guardados().flatMap((guardado) => guardado.pedido.pagos),
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

describe('para el estimativo, en una consulta nueva', () => {
  function elBloque(): HTMLElement {
    return screen.getByRole('region', { name: 'Para el estimativo' });
  }

  function elegirElCliente(): void {
    fireEvent.change(screen.getByRole('combobox', { name: 'Cliente' }), {
      target: { value: 'Marcela' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Marcela Duarte/ }));
  }

  it('aparece con las preguntas del taller, sin contestar: «0 de 3»', () => {
    montar(taller(), undefined);

    const bloque = elBloque();
    expect(bloque).toHaveTextContent('0 de 3');
    expect(within(bloque).getByLabelText('Domicilio')).toHaveValue('');
    expect(within(bloque).getByLabelText('Acceso al lugar')).toHaveAttribute(
      'placeholder',
      'Escaleras, piso, tamaño del ascensor.',
    );
    expect(within(bloque).getByLabelText('Urgencia')).toHaveAttribute(
      'placeholder',
      'Para cuándo lo necesita.',
    );
  });

  it('«Usar la del cliente» completa el domicilio con la dirección del cliente elegido', () => {
    montar(taller(), undefined);

    expect(within(elBloque()).queryByRole('button', { name: /^Usar la del cliente/ })).toBeNull();
    elegirElCliente();
    fireEvent.click(
      within(elBloque()).getByRole('button', {
        name: 'Usar la del cliente: Olazábal 1240, Ituzaingó',
      }),
    );

    expect(within(elBloque()).getByLabelText('Domicilio')).toHaveValue('Olazábal 1240, Ituzaingó');
    expect(elBloque()).toHaveTextContent('1 de 3');
    expect(within(elBloque()).queryByRole('button', { name: /^Usar la del cliente/ })).toBeNull();
  });

  it('al guardar, el pedido lleva el domicilio como dirección del trabajo y las respuestas', () => {
    const { guardados } = montar(taller(), undefined);

    elegirElCliente();
    fireEvent.change(screen.getByLabelText('Qué pide'), { target: { value: 'Placard' } });
    fireEvent.change(within(elBloque()).getByLabelText('Domicilio'), {
      target: { value: '  Gorriti 4500, Palermo  ' },
    });
    fireEvent.change(within(elBloque()).getByLabelText('Acceso al lugar'), {
      target: { value: ' Tercer piso, por escalera ' },
    });
    expect(elBloque()).toHaveTextContent('2 de 3');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contacto' }));

    const [guardado] = guardados();
    expect(guardado?.pedido.version).toBeNull();
    expect(guardado?.pedido.datos.direccion_entrega).toBe('Gorriti 4500, Palermo');
    expect(guardado?.respuestas).toEqual([
      { id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Tercer piso, por escalera' },
    ]);
  });

  it('editando una consulta que ya existe, el bloque no aparece', () => {
    montar(
      taller(),
      proyecto({ moneda: 'ARS', cobra_en: null, direccion_entrega: 'Belgrano 123' }),
    );

    expect(screen.queryByRole('region', { name: 'Para el estimativo' })).toBeNull();
    expect(screen.queryByLabelText('Domicilio')).toBeNull();
  });
});

describe('la visita que propuso el cliente al aprobar', () => {
  it('la hoja arranca con ese día y esa hora, y al guardar la agenda', () => {
    const { guardados } = montar(
      taller(),
      proyecto({ estado: 'presupuesto_estimativo', moneda: 'ARS', cobra_en: null }),
      undefined,
      { dia: '2026-09-21', hora: '15:00' },
    );

    expect(screen.getByLabelText('Visita')).toHaveValue('2026-09-21');
    expect(screen.getByLabelText('Hora de la visita')).toHaveValue('15:00');

    guardar();
    expect(guardados()[0]?.pedido.datos).toMatchObject({
      fecha_visita: '2026-09-21',
      visita_hora: '15:00',
    });
  });

  it('si le dio igual el horario, va sin hora', () => {
    montar(
      taller(),
      proyecto({ estado: 'presupuesto_estimativo', moneda: 'ARS', cobra_en: null }),
      undefined,
      { dia: '2026-09-21', hora: null },
    );

    expect(screen.getByLabelText('Visita')).toHaveValue('2026-09-21');
    expect(screen.getByLabelText('Hora de la visita')).toHaveValue('');
  });
});
