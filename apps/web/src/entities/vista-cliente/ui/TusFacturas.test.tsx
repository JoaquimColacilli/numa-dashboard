import {
  centavos,
  VIDRIERA_VACIA,
  vistaDelCliente,
  type FacturaDelCliente,
  type Idioma,
  type TrabajoDelCliente,
} from '@maun/domain';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cargarMensajesDelCliente,
  ConElIdiomaDelCliente,
  formatosDelCliente,
} from '@/shared/idioma-del-cliente';
import { olvidarLasFacturasGuardadas } from '@/shared/pdf';

import { VistaDelCliente } from './VistaDelCliente';

vi.mock('@/shared/api', () => ({
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
}));

const HOY = '2026-10-04';

const EMISOR = {
  nombreDelTaller: 'Taller MAUN',
  razonSocial: 'Ana Gutiérrez',
  domicilio: 'Olazábal 1240, CABA',
  cuit: '20-11111111-2',
  ingresosBrutos: '901-123456-7',
  inicioDeActividades: '2019-03-01',
};

const RECEPTOR = {
  nombre: 'Marcela Duarte',
  condicion: 'consumidor_final',
  docTipo: 99,
  docNro: '0',
  domicilio: '',
} as const;

const DE_LA_VISITA: FacturaDelCliente = {
  id: 'c41',
  tipo: 'factura_c',
  puntoDeVenta: 3,
  numero: 41,
  fecha: '2026-09-12',
  importe: centavos(3_000_000),
  detalle: 'Seña de la visita — Placard 3 puertas',
  cae: '76398765432108',
  caeVence: '2026-09-22',
  prueba: false,
  emisor: EMISOR,
  receptor: RECEPTOR,
  anuladaPor: null,
  anulaA: null,
};

const DE_LA_SENA: FacturaDelCliente = {
  ...DE_LA_VISITA,
  id: 'c42',
  numero: 42,
  fecha: '2026-10-03',
  importe: centavos(45_000_000),
  detalle: 'Seña — Placard 3 puertas',
  cae: '76398765432109',
  caeVence: '2026-10-13',
};

const NOTA: FacturaDelCliente = {
  ...DE_LA_SENA,
  id: 'n7',
  tipo: 'nota_de_credito_c',
  numero: 7,
  fecha: '2026-10-04',
  cae: '76398765432110',
  caeVence: '2026-10-14',
  anulaA: { puntoDeVenta: 3, numero: 42, fecha: '2026-10-03' },
};

const ANULADA: FacturaDelCliente = {
  ...DE_LA_SENA,
  anuladaPor: { puntoDeVenta: 3, numero: 7, fecha: '2026-10-04' },
};

function trabajo(idioma: Idioma, cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
  return {
    taller: 'Taller MAUN',
    cliente: 'Marcela Duarte',
    trabajo: 'Placard 3 puertas',
    idioma,
    direccion: 'Olazábal 1240, Ituzaingó',
    estado: 'en_curso',
    precio: centavos(96_000_000),
    sena: centavos(45_000_000),
    fechas: {
      estimativo: null,
      presupuesto: '2026-09-20',
      aprobado: '2026-10-03',
      inicio: null,
      entregaPautada: '2026-11-14',
      listo: null,
      entregado: null,
      cobro: null,
      valeHasta: null,
    },
    visita: { dia: '2026-09-12', hecha: true },
    entrega: { comprometida: null, propuesta: null, respuesta: null },
    pago: {
      instancia: 'saldo',
      formas: ['efectivo'],
      monto: centavos(48_000_000),
      siguiente: null,
    },
    cobro: { alias: null, cbu: null, titular: null, cuit: null, link: null },
    pagos: [
      {
        id: 'p1',
        fecha: '2026-09-12',
        concepto: 'Seña de la visita',
        monto: centavos(3_000_000),
      },
      { id: 'p2', fecha: '2026-10-03', concepto: 'Seña', monto: centavos(45_000_000) },
    ],
    archivos: [],
    vidriera: VIDRIERA_VACIA,
    valorDelRelevamiento: null,
    facturas: [DE_LA_VISITA, DE_LA_SENA],
    ...cambios,
  };
}

function conEspacios(texto: string): string {
  return texto.replace(/\s+/gu, ' ');
}

async function dibujar(idioma: Idioma, datos: TrabajoDelCliente) {
  const m = await cargarMensajesDelCliente(idioma);
  return render(
    <ConElIdiomaDelCliente idioma={idioma}>
      <VistaDelCliente vista={vistaDelCliente(datos, HOY, m.vista.delDominio)} hoy={HOY} />
    </ConElIdiomaDelCliente>,
  );
}

interface PedidoDeFactura {
  id: number;
  factura: unknown;
}

let pedidos: PedidoDeFactura[] = [];
let descargados: string[] = [];
let sale: 'bien' | 'mal' = 'bien';

class TrabajadorDePrueba extends EventTarget {
  postMessage(pedido: PedidoDeFactura) {
    pedidos.push(pedido);
    const respuesta =
      sale === 'bien'
        ? { id: pedido.id, listo: true, bytes: new ArrayBuffer(8) }
        : { id: pedido.id, listo: false, motivo: 'se rompió' };
    queueMicrotask(() => {
      this.dispatchEvent(new MessageEvent('message', { data: respuesta }));
    });
  }

  terminate() {
    return undefined;
  }
}

beforeAll(async () => {
  await Promise.all([cargarMensajesDelCliente('en'), cargarMensajesDelCliente('pt-BR')]);
}, 60_000);

beforeEach(() => {
  pedidos = [];
  descargados = [];
  sale = 'bien';
  olvidarLasFacturasGuardadas();
  vi.stubGlobal('Worker', TrabajadorDePrueba);
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:pdf', configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => undefined, configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    descargados.push(this.download);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('«Tus facturas» en la página del cliente', () => {
  it('va después de «Lo que pagaste», con un renglón por factura: el número, la fecha, el importe y «Descargar»', async () => {
    await dibujar('es', trabajo('es'));
    const f = formatosDelCliente('es');

    const facturas = screen.getByRole('region', { name: 'Tus facturas' });
    expect(screen.getByRole('region', { name: 'Lo que pagaste' }).nextElementSibling).toBe(
      facturas,
    );
    const [visita, sena] = within(facturas).getAllByRole('listitem');
    if (visita === undefined || sena === undefined) throw new Error('faltan los renglones');
    expect(visita).toHaveTextContent(
      conEspacios(
        `Factura C 00003-00000041${f.fechaLarga('2026-09-12', HOY)}${f.pesos(3_000_000)}`,
      ),
    );
    expect(sena).toHaveTextContent(
      conEspacios(
        `Factura C 00003-00000042${f.fechaLarga('2026-10-03', HOY)}${f.pesos(45_000_000)}`,
      ),
    );
    expect(
      within(visita).getByRole('button', { name: 'Descargar Factura C 00003-00000041' }),
    ).toBeInTheDocument();
    expect(within(facturas).queryByRole('button', { name: /^Compartir/ })).toBeNull();
    expect(within(facturas).queryByText('Prueba')).toBeNull();
    expect(within(facturas).queryByText('Anulada')).toBeNull();
  });

  it('la nota de crédito dice qué factura anula, la anulada lo dice al lado, y la de prueba lleva «Prueba»', async () => {
    await dibujar('es', trabajo('es', { facturas: [ANULADA, { ...NOTA, prueba: true }] }));

    const [factura, nota] = within(
      screen.getByRole('region', { name: 'Tus facturas' }),
    ).getAllByRole('listitem');
    if (factura === undefined || nota === undefined) throw new Error('faltan los renglones');
    expect(within(factura).getByText('Anulada')).toBeInTheDocument();
    expect(within(factura).queryByText('Prueba')).toBeNull();
    expect(nota).toHaveTextContent('Nota de crédito C 00003-00000007');
    expect(nota).toHaveTextContent('Anula la factura C 00003-00000042.');
    expect(within(nota).getByText('Prueba')).toBeInTheDocument();
    expect(within(nota).queryByText('Anulada')).toBeNull();
  });

  it('sin facturas no hay sección, y la página queda como estaba', async () => {
    await dibujar('es', trabajo('es', { facturas: [] }));
    expect(screen.queryByRole('region', { name: 'Tus facturas' })).toBeNull();
  });

  it('con un teléfono que comparte archivos, cada factura suma «Compartir»', async () => {
    vi.stubGlobal('navigator', {
      userAgent: '',
      canShare: () => true,
      share: vi.fn(() => Promise.resolve()),
    });
    await dibujar('es', trabajo('es'));
    const facturas = screen.getByRole('region', { name: 'Tus facturas' });
    expect(
      within(facturas).getByRole('button', { name: 'Compartir Factura C 00003-00000042' }),
    ).toBeInTheDocument();
    expect(within(facturas).getAllByRole('button', { name: /^Compartir/ })).toHaveLength(2);
  });

  it('«Descargar» arma el PDF de esa factura, con sus datos tal cual, y lo baja con su nombre', async () => {
    await dibujar('es', trabajo('es'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar Factura C 00003-00000042' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(descargados).toEqual(['Factura C 00003-00000042 - Marcela Duarte.pdf']);
    });
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.factura).toEqual({
      tipo: 'factura_c',
      prueba: false,
      puntoDeVenta: 3,
      numero: 42,
      fecha: '2026-10-03',
      cae: '76398765432109',
      caeVence: '2026-10-13',
      importe: 45_000_000,
      detalle: 'Seña — Placard 3 puertas',
      emisor: EMISOR,
      receptor: RECEPTOR,
      anulaA: null,
    });
    expect(screen.getAllByRole('status').map((estado) => estado.textContent)).toContain(
      'El PDF está listo.',
    );
  });

  it('si el PDF no sale, lo dice en el renglón', async () => {
    sale = 'mal';
    await dibujar('es', trabajo('es'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar Factura C 00003-00000041' }));
      await Promise.resolve();
    });

    const [visita] = within(screen.getByRole('region', { name: 'Tus facturas' })).getAllByRole(
      'listitem',
    );
    if (visita === undefined) throw new Error('falta el renglón');
    expect(await within(visita).findByRole('alert')).toHaveTextContent(
      'No pudimos armar el PDF. Tocá de nuevo para probar otra vez.',
    );
    expect(descargados).toEqual([]);
  });

  it('en inglés, la sección habla inglés, el nombre de cada comprobante queda igual y el PDF es el mismo', async () => {
    await dibujar('en', trabajo('en', { facturas: [ANULADA, { ...NOTA, prueba: true }] }));

    const facturas = screen.getByRole('region', { name: 'Your invoices' });
    const [factura, nota] = within(facturas).getAllByRole('listitem');
    if (factura === undefined || nota === undefined) throw new Error('faltan los renglones');
    expect(within(factura).getByText('Voided')).toBeInTheDocument();
    expect(nota).toHaveTextContent('Nota de crédito C 00003-00000007');
    expect(nota).toHaveTextContent('Voids Factura C 00003-00000042.');
    expect(within(nota).getByText('Test')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        within(nota).getByRole('button', { name: 'Download Nota de crédito C 00003-00000007' }),
      );
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(descargados).toEqual(['Nota de crédito C 00003-00000007 - Marcela Duarte.pdf']);
    });
    expect(pedidos[0]?.factura).toMatchObject({
      tipo: 'nota_de_credito_c',
      prueba: true,
      anulaA: { puntoDeVenta: 3, numero: 42, fecha: '2026-10-03' },
    });
    expect(Object.keys(pedidos[0]?.factura ?? {})).not.toContain('idioma');
  });

  it('en portugués, lo mismo con sus palabras', async () => {
    await dibujar('pt-BR', trabajo('pt-BR', { facturas: [ANULADA, NOTA] }));

    const facturas = screen.getByRole('region', { name: 'Suas notas fiscais' });
    const [factura, nota] = within(facturas).getAllByRole('listitem');
    if (factura === undefined || nota === undefined) throw new Error('faltan os renglones');
    expect(within(factura).getByText('Anulada')).toBeInTheDocument();
    expect(nota).toHaveTextContent('Anula a Factura C 00003-00000042.');
    expect(
      within(factura).getByRole('button', { name: 'Baixar Factura C 00003-00000042' }),
    ).toBeInTheDocument();
  });
});
