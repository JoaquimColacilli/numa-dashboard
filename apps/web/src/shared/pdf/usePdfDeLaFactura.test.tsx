import { centavos } from '@maun/domain';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FacturaEnPdf } from './tipos';
import { olvidarLasFacturasGuardadas, usePdfDeLaFactura } from './usePdfDeLaFactura';

const FACTURA: FacturaEnPdf = {
  tipo: 'factura_c',
  prueba: true,
  puntoDeVenta: 2,
  numero: 42,
  fecha: '2026-10-03',
  cae: '76398765432109',
  caeVence: '2026-10-13',
  importe: centavos(45_000_000),
  detalle: 'Seña — Vanitory Chico',
  emisor: {
    nombreDelTaller: 'Taller MAUN',
    razonSocial: 'Julián Ferro',
    domicilio: 'Pasaje Los Aromos 120, Haedo',
    cuit: '20-11111111-2',
    ingresosBrutos: '901-123456-7',
    inicioDeActividades: '2019-03-01',
  },
  receptor: {
    nombre: 'Lucía Gómez',
    condicion: 'consumidor_final',
    docTipo: 99,
    docNro: '0',
    domicilio: '',
  },
  anulaA: null,
};

interface Pendiente {
  resolver: (archivo: Blob) => void;
}

let pendientes: Pendiente[] = [];
let descargados: string[] = [];

const generar = vi.fn(
  () =>
    new Promise<Blob>((resolver) => {
      pendientes.push({ resolver });
    }),
);

async function terminar(): Promise<void> {
  await act(async () => {
    pendientes[0]?.resolver(new Blob(['%PDF-1.3'], { type: 'application/pdf' }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  pendientes = [];
  descargados = [];
  generar.mockClear();
  olvidarLasFacturasGuardadas();
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:pdf', configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => undefined, configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    descargados.push(this.download);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('el PDF de la factura', () => {
  it('no se prepara solo, y el archivo se llama como el comprobante y su cliente', () => {
    const { result } = renderHook(() => usePdfDeLaFactura(FACTURA, { generar }));
    expect(result.current.estado).toBe('sin-preparar');
    expect(generar).not.toHaveBeenCalled();
    expect(result.current.nombre).toBe('Factura C 00002-00000042 - Lucía Gómez.pdf');
  });

  it('«Ver el PDF» lo prepara y lo baja cuando está listo; el segundo toque no lo vuelve a armar', async () => {
    const { result } = renderHook(() => usePdfDeLaFactura(FACTURA, { generar }));
    act(() => {
      result.current.descargar();
    });
    expect(result.current.estado).toBe('preparando');
    expect(result.current.esperando).toBe('descargar');
    await terminar();
    expect(result.current.estado).toBe('listo');
    expect(descargados).toEqual(['Factura C 00002-00000042 - Lucía Gómez.pdf']);

    act(() => {
      result.current.descargar();
    });
    expect(generar).toHaveBeenCalledOnce();
    expect(descargados).toHaveLength(2);
  });

  it('el primer toque de «Compartir» lo prepara sin compartir; el segundo comparte el archivo', async () => {
    const compartirConElAparato = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', {
      userAgent: '',
      canShare: () => true,
      share: compartirConElAparato,
    });
    const { result } = renderHook(() => usePdfDeLaFactura(FACTURA, { generar }));
    act(() => {
      result.current.compartir();
    });
    await terminar();
    expect(compartirConElAparato).not.toHaveBeenCalled();
    act(() => {
      result.current.compartir();
    });
    expect(compartirConElAparato).toHaveBeenCalledOnce();
    expect(compartirConElAparato.mock.calls[0]).toEqual([
      expect.objectContaining({ title: 'Factura C 00002-00000042' }),
    ]);
  });
});
