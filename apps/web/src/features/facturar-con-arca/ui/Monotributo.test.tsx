import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_LA_ALERTA_REVISADA, type AlertaRevisada } from '@/entities/factura';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Json,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { cobrosSinFacturar, datosDelMonotributo } from '../model/monotributo';
import { AlertasDeLaFacturacion } from './AlertasDeLaFacturacion';
import { TarjetaDelMonotributo } from './TarjetaDelMonotributo';

const HOY = '2026-10-03';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const AJUSTES = {
  ...METADATOS,
  id: 'a1',
  taller_titular: 'Martín Rivas',
  taller_condicion_fiscal: 'monotributo',
  taller_domicilio: 'Pasaje Los Robles 450',
  facturacion_ambiente: 'produccion',
  facturacion_cuit: '20-11111111-2',
  facturacion_punto_de_venta: 3,
  facturacion_desde: '2026-09-03',
  facturacion_alertas: [],
  facturacion_concepto: 1,
  facturacion_categoria: 'D',
  facturacion_ingresos_brutos: '901-123456-7',
  facturacion_inicio_de_actividades: '2019-03-01',
} as unknown as FilaDe<'ajustes'>;

function proyecto(id: string, titulo: string, moneda = 'ARS'): FilaDe<'proyectos'> {
  return {
    ...METADATOS,
    version: 3,
    id,
    cliente_id: 'c',
    titulo,
    descripcion: '',
    estado: 'en_curso',
    presupuesto_centavos: 100_000_000,
    sena_bp: 5000,
    forma_pago: null,
    cobro_sena: null,
    cobro_saldo: null,
    moneda,
    cobra_en: [moneda],
    costos_cotizacion_centavos: null,
    comprobante: 'sin_comprobante',
    fecha_visita: null,
    visita_hora: null,
    ultimo_contacto: null,
    fecha_inicio: '2026-09-10',
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
  } satisfies FilaDe<'proyectos'>;
}

function pago(
  id: string,
  proyectoId: string,
  fecha: string,
  extra: Partial<FilaDe<'pagos'>> = {},
): FilaDe<'pagos'> {
  return {
    ...METADATOS,
    id,
    proyecto_id: proyectoId,
    fecha,
    concepto: 'Seña',
    monto_centavos: 10_000_000,
    ya_en_la_apertura: false,
    moneda: 'ARS',
    cotizacion_centavos: null,
    tesoro_id: null,
    ...extra,
  };
}

function factura(
  id: string,
  pagoId: string,
  extra: Partial<FilaDe<'comprobantes'>> = {},
): FilaDe<'comprobantes'> {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p1',
    pago_id: pagoId,
    tipo: 'factura_c',
    ambiente: 'produccion',
    estado: 'autorizada',
    fecha: '2026-09-20',
    importe_centavos: 2_450_000_000,
    pedida_at: '2026-09-20T12:00:00Z',
    ...extra,
  } as unknown as FilaDe<'comprobantes'>;
}

function taller({
  ajustes = {},
  pagos = [],
  comprobantes = [],
}: {
  ajustes?: Partial<FilaDe<'ajustes'>>;
  pagos?: FilaDe<'pagos'>[];
  comprobantes?: FilaDe<'comprobantes'>[];
} = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', { ...AJUSTES, ...ajustes });
  replica = aplicarFilaLocal(replica, 'proyectos', proyecto('p1', 'Placard de pino'));
  replica = aplicarFilaLocal(replica, 'proyectos', proyecto('p2', 'Vestidor', 'USD'));
  for (const uno of pagos) replica = aplicarFilaLocal(replica, 'pagos', uno);
  for (const uno of comprobantes) replica = aplicarFilaLocal(replica, 'comprobantes', uno);
  return replica;
}

function montar(replica: Replica, componente: 'tarjeta' | 'alertas' = 'tarjeta') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          {componente === 'tarjeta' ? (
            <TarjetaDelMonotributo hoy={HOY} />
          ) : (
            <AlertasDeLaFacturacion />
          )}
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return queryClient;
}

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
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

describe('los cobros sin facturar', () => {
  it('los pagos en pesos, vivos, desde la conexión y sin factura de verdad, del más viejo al más nuevo', () => {
    const replica = taller({
      pagos: [
        pago('nuevo', 'p1', '2026-10-01'),
        pago('viejo', 'p1', '2026-09-10'),
        pago('antes', 'p1', '2026-09-01'),
        pago('facturado', 'p1', '2026-09-20'),
        pago('de-prueba', 'p1', '2026-09-21'),
        pago('apertura', 'p1', '2026-09-22', { ya_en_la_apertura: true }),
        pago('en-dolares', 'p1', '2026-09-23', { moneda: 'USD' }),
        pago('de-un-trabajo-en-dolares', 'p2', '2026-09-24'),
        pago('borrado', 'p1', '2026-09-25', { deleted_at: '2026-09-26T00:00:00Z' }),
      ],
      comprobantes: [
        factura('f1', 'facturado'),
        factura('f2', 'de-prueba', { ambiente: 'homologacion' }),
      ],
    });
    expect(cobrosSinFacturar(replica, '2026-09-03').map(({ pago: uno }) => uno.id)).toEqual([
      'viejo',
      'de-prueba',
      'nuevo',
    ]);
  });
});

describe('los datos de la tarjeta', () => {
  it('sin conectar no hay tarjeta', () => {
    expect(
      datosDelMonotributo(taller({ ajustes: { facturacion_ambiente: null } }), HOY),
    ).toBeNull();
  });

  it('en prueba no cuenta nada', () => {
    const datos = datosDelMonotributo(
      taller({
        ajustes: { facturacion_ambiente: 'homologacion' },
        comprobantes: [factura('f1', 'x')],
      }),
      HOY,
    );
    expect(datos?.facturado).toBe(0);
    expect(datos?.tope?.nivel).toBe('bien');
  });
});

describe('la tarjeta del monotributo', () => {
  it('lo facturado, la barra contra el tope de la categoría y la recategorización', () => {
    montar(taller({ comprobantes: [factura('f1', 'x')] }));
    const tarjeta = screen.getByRole('region', { name: 'Monotributo' });
    expect(tarjeta).toHaveTextContent('Categoría D');
    expect(tarjeta).toHaveTextContent(/\$\s24\.500\.000/);
    expect(tarjeta).toHaveTextContent('facturados en los últimos 12 meses, de nov. 2025 a hoy');
    expect(within(tarjeta).getByRole('img')).toHaveAccessibleName(
      /^79 % del tope de la categoría D, \$\s30\.628\.651$/,
    );
    expect(tarjeta).toHaveTextContent(/79 % de \$\s30\.628\.651/);
    expect(tarjeta).toHaveTextContent('tope de la D');
    expect(tarjeta).not.toHaveTextContent('Te acercás');
    expect(tarjeta).toHaveTextContent('Próxima recategorizaciónhasta el 5 de febrero');
    expect(tarjeta).toHaveTextContent('Todos tus cobros desde el 3/9 tienen factura.');
  });

  it('cerca del tope lo dice con el color y con palabras', () => {
    montar(taller({ comprobantes: [factura('f1', 'x', { importe_centavos: 2_500_000_000 })] }));
    expect(screen.getByText('Te acercás al tope de la D.')).toBeInTheDocument();
  });

  it('sin categoría lleva a elegirla', () => {
    montar(taller({ ajustes: { facturacion_categoria: null } }));
    const tarjeta = screen.getByRole('region', { name: 'Monotributo' });
    expect(tarjeta).toHaveTextContent('Sin categoría');
    expect(tarjeta).toHaveTextContent(
      'Elegí tu categoría en Ajustes para ver cuánto te falta para el tope.',
    );
    expect(within(tarjeta).getByRole('link', { name: 'Elegir la categoría' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion',
    );
  });

  it('en prueba lo dice y no cuenta nada', () => {
    montar(taller({ ajustes: { facturacion_ambiente: 'homologacion' } }));
    expect(
      screen.getByText('En modo prueba no cuenta nada: las facturas de prueba no son de verdad.'),
    ).toBeInTheDocument();
  });

  it('los cobros sin facturar abren su hoja, y cada uno se factura desde ahí', () => {
    montar(
      taller({
        pagos: [pago('uno', 'p1', '2026-09-10'), pago('dos', 'p1', '2026-10-01')],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: '2 cobros sin facturar' }));
    const hoja = screen.getByRole('dialog', { name: 'Cobros sin facturar' });
    expect(hoja).toHaveTextContent(
      'Lo que cobraste en pesos desde el 3/9 y todavía no tiene factura.',
    );
    const renglones = within(hoja).getAllByRole('listitem');
    expect(renglones.map((renglon) => renglon.textContent)).toEqual([
      expect.stringMatching(/^SeñaPlacard de pino · 10 de septiembre\$\s100\.000Facturar$/),
      expect.stringMatching(/^SeñaPlacard de pino · 1 de octubre\$\s100\.000Facturar$/),
    ]);
    fireEvent.click(
      within(hoja).getByRole('button', {
        name: /^Facturar el pago de \$\s100\.000 del 10 de septiembre$/,
      }),
    );
    expect(screen.getByRole('dialog', { name: 'Facturar este pago' })).toBeInTheDocument();
  });

  it('sin conectar no se ve', () => {
    montar(taller({ ajustes: { facturacion_ambiente: null } }));
    expect(screen.queryByRole('region', { name: 'Monotributo' })).toBeNull();
  });
});

describe('las alertas de la facturación en Inicio', () => {
  function conAlertas(alertas: Json[], extra: Partial<FilaDe<'ajustes'>> = {}): Replica {
    return taller({ ajustes: { facturacion_alertas: alertas, ...extra } });
  }

  it('una factura que NUMA no hizo, con «Ya lo revisé» por la cola', () => {
    const queryClient = montar(
      conAlertas([
        {
          codigo: 'fuera-de-numa',
          tipo: 'factura_c',
          puntoDeVenta: 3,
          numeroArca: 45,
          numeroNuma: 44,
          descartada: false,
        },
      ]),
      'alertas',
    );
    const alerta = screen.getByRole('region', { name: 'ARCA tiene una factura que NUMA no hizo' });
    expect(alerta).toHaveTextContent(
      'En el punto de venta 00003, ARCA va por la factura C 00000045 y NUMA hizo hasta la 00000044. Si la hiciste por otro lado, está todo bien; si no, revisala en ARCA.',
    );
    fireEvent.click(within(alerta).getByRole('button', { name: 'Ya lo revisé' }));
    const [revisada] = queryClient
      .getMutationCache()
      .getAll()
      .filter(
        (mutacion) =>
          mutacion.options.mutationKey?.join('/') === CLAVE_DE_LA_ALERTA_REVISADA.join('/'),
      )
      .map((mutacion) => mutacion.state.variables as AlertaRevisada);
    expect(revisada?.alerta).toEqual({ codigo: 'fuera-de-numa', numero: 45 });
  });

  it('una nota de crédito a revisar lleva al trabajo', () => {
    montar(
      conAlertas([
        {
          codigo: 'a-revisar',
          comprobanteId: 'n1',
          proyectoId: 'p1',
          tipo: 'nota_de_credito_c',
          puntoDeVenta: 3,
          numero: 7,
          cliente: 'Lucía Gómez',
        },
      ]),
      'alertas',
    );
    const alerta = screen.getByRole('region', {
      name: 'Hay una nota de crédito para revisar en ARCA',
    });
    expect(alerta).toHaveTextContent(
      'NUMA pidió la nota de crédito C 00003-00000007 de Lucía Gómez y no sabe si quedó autorizada.',
    );
    expect(within(alerta).getByRole('link', { name: 'Ver el trabajo' })).toHaveAttribute(
      'href',
      '/proyectos/p1',
    );
  });

  it('el certificado por vencer y la entrada que falla', () => {
    montar(
      conAlertas([
        { codigo: 'certificado-por-vencer', vence: '2026-10-25' },
        { codigo: 'sin-acceso', desde: '2026-10-03T09:15:00Z' },
      ]),
      'alertas',
    );
    const certificado = screen.getByRole('region', {
      name: 'El certificado de ARCA vence el 25/10/2026',
    });
    expect(
      within(certificado).getByRole('link', { name: 'Renovar el certificado' }),
    ).toHaveAttribute('href', '/ajustes/facturacion/conectar');
    const acceso = screen.getByRole('region', { name: 'NUMA no pudo entrar a ARCA' });
    expect(acceso).toHaveTextContent('Las facturas pedidas esperan. Probá la conexión en Ajustes.');
    expect(within(acceso).getByRole('link', { name: 'Probar la conexión' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion',
    );
  });

  it('una revisada no vuelve, y sin conectar no hay ninguna', () => {
    montar(
      conAlertas([
        {
          codigo: 'fuera-de-numa',
          tipo: 'factura_c',
          puntoDeVenta: 3,
          numeroArca: 45,
          numeroNuma: null,
          descartada: true,
        },
      ]),
      'alertas',
    );
    expect(screen.queryByRole('region')).toBeNull();
    cleanup();
    montar(
      conAlertas([{ codigo: 'sin-acceso', desde: null }], { facturacion_ambiente: null }),
      'alertas',
    );
    expect(screen.queryByRole('region')).toBeNull();
  });
});
