import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLAVE_DE_LA_FACTURA,
  CLAVE_DE_LA_NOTA_DE_CREDITO,
  type PedidoDeLaFactura,
  type PedidoDeLaNotaDeCredito,
} from '@/entities/factura';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { HojaDeLaFactura } from './HojaDeLaFactura';
import { ListaDePagos } from './ListaDePagos';

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
  taller_cuit: '20-11111111-2',
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

const CLIENTE = {
  ...METADATOS,
  id: 'c',
  nombre: 'Lucía Gómez',
  telefono: '',
  email: '',
  direccion: '',
  zona: '',
  notas: '',
  cuit: '',
  dni: '',
  razon_social: '',
  domicilio_fiscal: '',
  condicion_fiscal: 'consumidor_final',
  origen_contacto: null,
  origen_detalle: '',
} satisfies FilaDe<'clientes'>;

const PROYECTO = {
  ...METADATOS,
  version: 3,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Placard de pino',
  descripcion: '',
  estado: 'en_curso',
  presupuesto_centavos: 96_000_000,
  sena_bp: 5000,
  forma_pago: null,
  cobro_sena: null,
  cobro_saldo: null,
  moneda: 'ARS',
  cobra_en: ['ARS'],
  costos_cotizacion_centavos: null,
  comprobante: 'sin_comprobante',
  fecha_visita: null,
  visita_hora: null,
  ultimo_contacto: null,
  fecha_inicio: '2026-10-03',
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

const PAGO = {
  ...METADATOS,
  id: 'pago',
  proyecto_id: 'p',
  fecha: HOY,
  concepto: 'Seña',
  monto_centavos: 45_000_000,
  ya_en_la_apertura: false,
  moneda: 'ARS',
  cotizacion_centavos: null,
  tesoro_id: null,
} satisfies FilaDe<'pagos'>;

function factura(extra: Partial<FilaDe<'comprobantes'>> = {}): FilaDe<'comprobantes'> {
  return {
    ...METADATOS,
    id: 'f1',
    proyecto_id: 'p',
    pago_id: 'pago',
    tipo: 'factura_c',
    ambiente: 'produccion',
    estado: 'autorizada',
    cuit_emisor: '20-11111111-2',
    punto_de_venta: 3,
    numero: 42,
    fecha: HOY,
    cae: '76398765432109',
    cae_vence: '2026-10-13',
    concepto: 1,
    importe_centavos: 45_000_000,
    moneda: 'ARS',
    doc_tipo: 99,
    doc_nro: '0',
    condicion_iva_receptor: 5,
    receptor_condicion: 'consumidor_final',
    receptor_nombre: 'Lucía Gómez',
    receptor_domicilio: '',
    emisor: {
      razonSocial: 'Martín Rivas',
      nombreDelTaller: 'MAUN Muebles',
      domicilio: 'Pasaje Los Robles 450',
      cuit: '20-11111111-2',
      ingresosBrutos: '901-123456-7',
      inicioDeActividades: '2019-03-01',
    },
    detalle: 'Seña — Placard de pino',
    asociado_id: null,
    rechazo: null,
    intentos: 1,
    emitiendo_hasta: null,
    ultimo_error: null,
    pedida_at: '2026-10-03T14:00:00Z',
    autorizada_at: '2026-10-03T14:00:05Z',
    ...extra,
  };
}

function taller({
  ajustes = {},
  cliente = {},
  pago = {},
  comprobantes = [],
}: {
  ajustes?: Partial<FilaDe<'ajustes'>>;
  cliente?: Partial<FilaDe<'clientes'>>;
  pago?: Partial<FilaDe<'pagos'>>;
  comprobantes?: FilaDe<'comprobantes'>[];
} = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'MAUN Muebles' } };
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', { ...AJUSTES, ...ajustes });
  replica = aplicarFilaLocal(replica, 'clientes', { ...CLIENTE, ...cliente });
  replica = aplicarFilaLocal(replica, 'proyectos', PROYECTO);
  replica = aplicarFilaLocal(replica, 'pagos', { ...PAGO, ...pago });
  for (const comprobante of comprobantes) {
    replica = aplicarFilaLocal(replica, 'comprobantes', comprobante);
  }
  return replica;
}

function montar(replica: Replica, alEditarElCliente = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const pagos = Object.values(replica.tablas.pagos);
  const vista = render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <ListaDePagos
            pagos={pagos}
            moneda="ARS"
            hoy={HOY}
            alEditarElCliente={alEditarElCliente}
          />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const variables = (clave: readonly string[]) =>
    queryClient
      .getMutationCache()
      .getAll()
      .filter((una) => una.options.mutationKey?.join('/') === clave.join('/'))
      .map((una) => una.state.variables);
  return {
    queryClient,
    alEditarElCliente,
    rerender: (otra: Replica) => {
      vista.rerender(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <ProveedorDeReplica replica={otra}>
              <ListaDePagos
                pagos={pagos}
                moneda="ARS"
                hoy={HOY}
                alEditarElCliente={alEditarElCliente}
              />
            </ProveedorDeReplica>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    },
    facturas: () => variables(CLAVE_DE_LA_FACTURA) as PedidoDeLaFactura[],
    notas: () => variables(CLAVE_DE_LA_NOTA_DE_CREDITO) as PedidoDeLaNotaDeCredito[],
  };
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

describe('el pago y su factura', () => {
  it('sin facturar ofrece «Facturar» con un nombre que dice qué pago', () => {
    montar(taller());
    expect(screen.getByText('Sin facturar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Facturar el pago de \$\s450\.000 del 3 de octubre$/ }),
    ).toBeInTheDocument();
  });

  it('con el taller sin conectar, el renglón queda como hoy', () => {
    montar(taller({ ajustes: { facturacion_ambiente: null } }));
    expect(screen.queryByText('Sin facturar')).toBeNull();
    expect(screen.queryByRole('button', { name: /Facturar/ })).toBeNull();
  });

  it('autorizada abre su hoja, con el rótulo y el anular', () => {
    const { notas } = montar(taller({ comprobantes: [factura()] }));
    fireEvent.click(screen.getByRole('button', { name: 'Factura C 00003-00000042' }));

    const hoja = screen.getByRole('dialog', { name: 'Factura C 00003-00000042' });
    expect(hoja).toHaveTextContent('CAE76398765432109');
    expect(hoja).toHaveTextContent('Vence el CAE13/10/2026');
    expect(within(hoja).getByRole('button', { name: 'Ver el PDF' })).toBeInTheDocument();

    fireEvent.click(within(hoja).getByRole('button', { name: 'Anular la factura' }));
    const anular = screen.getByRole('alertdialog', {
      name: '¿Anulás la factura C 00003-00000042?',
    });
    expect(anular).toHaveTextContent(
      /Sale una nota de crédito C por \$\s450\.000 para Lucía Gómez\. Queda en ARCA y no se borra\./,
    );
    fireEvent.click(within(anular).getByRole('button', { name: 'Emitir la nota de crédito' }));
    expect(notas()).toEqual([
      {
        pedido: { id: expect.any(String) as unknown, facturaId: 'f1' },
        pagoId: 'pago',
        proyectoId: 'p',
      },
    ]);
  });

  it('anulada: lo dice, ofrece facturar de nuevo y la hoja muestra la nota', () => {
    montar(
      taller({
        comprobantes: [
          factura({ estado: 'anulada' }),
          factura({
            id: 'n1',
            tipo: 'nota_de_credito_c',
            asociado_id: 'f1',
            numero: 7,
            fecha: '2026-10-04',
            pedida_at: '2026-10-03T14:30:00Z',
          }),
        ],
      }),
    );
    expect(screen.getByRole('button', { name: /^Facturar el pago de/ })).toHaveTextContent(
      'Facturar',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Factura C 00003-00000042, anulada' }));
    const hoja = screen.getByRole('dialog', { name: 'Factura C 00003-00000042' });
    expect(hoja).toHaveTextContent(
      'Anulada con la nota de crédito C 00003-00000007 del 4/10/2026.',
    );
    expect(within(hoja).getByRole('button', { name: 'Ver el PDF de la nota' })).toBeInTheDocument();
    expect(within(hoja).queryByRole('button', { name: 'Anular la factura' })).toBeNull();
  });

  it('rechazada dice el motivo de ARCA y deja volver a pedir', () => {
    montar(
      taller({
        comprobantes: [
          factura({
            estado: 'rechazada',
            numero: null,
            cae: null,
            rechazo: { errores: [{ codigo: 10242, mensaje: 'La condición no corresponde' }] },
          }),
        ],
      }),
    );
    expect(
      screen.getByText('ARCA no la autorizó: revisá la condición frente al IVA del cliente.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver a pedir' })).toBeInTheDocument();
  });

  it('en prueba, cada estado con factura lleva «Prueba»', () => {
    montar(taller({ comprobantes: [factura({ ambiente: 'homologacion' })] }));
    expect(screen.getByText('Prueba')).toBeInTheDocument();
  });

  it('anuncia una vez cuando la factura queda autorizada, no al entrar', () => {
    const { rerender } = montar(
      taller({
        comprobantes: [
          factura({ estado: 'pedida', numero: null, pedida_at: '2026-10-03T17:55:00Z' }),
        ],
      }),
    );
    expect(screen.getByText('Pidiéndole la factura a ARCA…')).toBeInTheDocument();
    const anuncio = document.querySelector('[aria-live="polite"]');
    expect(anuncio).toHaveTextContent('');
    rerender(taller({ comprobantes: [factura({ version: 2 })] }));
    expect(anuncio).toHaveTextContent('La factura C 00003-00000042 quedó autorizada.');
  });
});

describe('la hoja «Facturar este pago»', () => {
  function abrir(replica: Replica = taller()) {
    const montada = montar(replica);
    fireEvent.click(screen.getByRole('button', { name: /^Facturar el pago/ }));
    return { ...montada, hoja: screen.getByRole('dialog', { name: 'Facturar este pago' }) };
  }

  it('muestra todo lo que sale, y emitir la pide por la cola y cierra', () => {
    const { hoja, facturas } = abrir();
    expect(hoja).toHaveTextContent('ComprobanteFactura C');
    expect(hoja).toHaveTextContent('Punto de venta00003');
    expect(hoja).toHaveTextContent('NúmeroEl que siga');
    expect(hoja).toHaveTextContent('FechaHoy, 3/10');
    expect(hoja).toHaveTextContent('ParaLucía GómezConsumidor final');
    expect(within(hoja).getByLabelText('Detalle')).toHaveValue('Seña — Placard de pino');
    expect(hoja).toHaveTextContent('Qué facturás: Productos · se cambia en Ajustes');
    expect(hoja).toHaveTextContent(
      'Una factura emitida no se borra. Si te equivocás, se anula con una nota de crédito.',
    );
    expect(hoja).toHaveTextContent('Sin señal: la factura sale cuando vuelva.');

    fireEvent.click(
      within(hoja).getByRole('button', { name: /^Emitir la factura de \$\s450\.000$/ }),
    );
    expect(facturas()).toEqual([
      {
        pedido: {
          id: expect.any(String) as unknown,
          pagoId: 'pago',
          detalle: 'Seña — Placard de pino',
        },
        proyectoId: 'p',
      },
    ]);
  });

  it('con producción y categoría, el tope con esta factura', () => {
    const { hoja } = abrir();
    expect(hoja).toHaveTextContent(
      /Con esta factura llevás \$\s450\.000 facturados en los últimos 12 meses\. Tu categoría D llega a \$\s30\.628\.651\./,
    );
  });

  it('en prueba, con «Prueba» en el título y el aviso, sin el tope', () => {
    const { hoja } = abrir(taller({ ajustes: { facturacion_ambiente: 'homologacion' } }));
    expect(within(hoja).getByText('Prueba')).toBeInTheDocument();
    expect(hoja).toHaveTextContent('Estás en modo prueba: la factura no vale para ARCA.');
    expect(hoja).not.toHaveTextContent('Con esta factura llevás');
  });

  it('un cobro de hace más de dos días avisa que sale con la fecha de hoy', () => {
    const { hoja } = abrir(taller({ pago: { fecha: '2026-09-20' } }));
    expect(hoja).toHaveTextContent('Este cobro es del 20/9: la factura sale con fecha de hoy.');
  });

  it('a un responsable inscripto sin CUIT le falta el CUIT: lo dice y deja cargarlo', () => {
    const { hoja, alEditarElCliente } = abrir(
      taller({
        cliente: {
          condicion_fiscal: 'responsable_inscripto',
          razon_social: 'Carpintería Pérez SRL',
          domicilio_fiscal: 'Av. Siempre Viva 742',
        },
      }),
    );
    expect(hoja).toHaveTextContent('ParaCarpintería Pérez SRLResponsable inscripto · sin CUIT');
    expect(hoja).toHaveTextContent(
      'A Carpintería Pérez SRL le falta el CUIT. Cargalo en su ficha para poder facturarle.',
    );
    expect(within(hoja).getByRole('button', { name: /^Emitir la factura/ })).toBeDisabled();
    fireEvent.click(within(hoja).getByRole('button', { name: 'Cargar el CUIT' }));
    expect(alEditarElCliente).toHaveBeenCalledWith('c');
  });

  it('sin los datos del taller, los nombra juntos y lleva a completarlos', () => {
    const { hoja } = abrir(
      taller({
        ajustes: { facturacion_ingresos_brutos: '', facturacion_inicio_de_actividades: null },
      }),
    );
    expect(hoja).toHaveTextContent(
      'Faltan tus datos de facturación: tu número de Ingresos Brutos y tu inicio de actividades.',
    );
    expect(within(hoja).getByRole('link', { name: 'Completarlos' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion',
    );
  });

  it('sin detalle no la pide y dice qué falta', () => {
    const { hoja, facturas } = abrir();
    fireEvent.change(within(hoja).getByLabelText('Detalle'), { target: { value: '  ' } });
    fireEvent.click(within(hoja).getByRole('button', { name: /^Emitir la factura/ }));
    expect(facturas()).toEqual([]);
    expect(within(hoja).getByLabelText('Detalle')).toHaveAccessibleDescription(
      /Escribí el detalle de la factura\./,
    );
  });
});

describe('la hoja de la factura', () => {
  it('a revisar: explica y no ofrece el PDF ni anular', () => {
    const queryClient = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProveedorDeReplica
            replica={taller({ comprobantes: [factura({ estado: 'a_revisar', cae: null })] })}
          >
            <HojaDeLaFactura facturaId="f1" alCerrar={() => undefined} />
          </ProveedorDeReplica>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const hoja = screen.getByRole('dialog');
    expect(hoja).toHaveTextContent(
      'NUMA le pidió a ARCA la factura C 00003-00000042 y no sabe si quedó autorizada.',
    );
    expect(within(hoja).queryByRole('button', { name: 'Ver el PDF' })).toBeNull();
    expect(within(hoja).queryByRole('button', { name: 'Anular la factura' })).toBeNull();
  });
});
