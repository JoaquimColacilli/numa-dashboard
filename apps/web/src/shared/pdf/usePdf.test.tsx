import {
  centavos,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  borradorNuevo,
  puntosBasicos,
  valoresDelTrabajo,
  type DocumentoDelPresupuesto,
} from '@maun/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cargarMensajesDelCliente } from '@/shared/idioma-del-cliente';

import type { PresupuestoEnPdf } from './tipos';
import { DEMORA_PARA_PREPARAR_MS, olvidarLosPdfGuardados, usePdfDelPresupuesto } from './usePdf';

function documento(): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: borradorNuevo({
        titulo: 'Escritorio',
        obra: '',
        plantilla: PLANTILLA_DE_SIEMPRE,
        validezDias: 15,
        idNuevo: () => 'm1',
      }),
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: {
        nombre: 'Taller MAUN',
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      },
      cliente: 'Lucía Ferreyra',
      moneda: 'ARS',
      cobraEn: null,
      valores: valoresDelTrabajo(centavos(124_800_000), []),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(0),
    },
    {
      plata: (importe) => String(importe),
      porcentaje: (puntos) => String(puntos / 100),
      modificaciones: String,
      meses: String,
    },
  );
}

const MANDADO: PresupuestoEnPdf = {
  documento: documento(),
  idioma: 'es',
  numero: '20260910-01',
  revision: 1,
  mandadoEl: '2026-09-10',
  valeHasta: '2026-09-25',
  queCambio: null,
  aceptado: null,
  borrador: false,
};

interface Pendiente {
  resolver: (archivo: Blob) => void;
  rechazar: (error: Error) => void;
}

let pendientes: Pendiente[] = [];
let descargados: string[] = [];

const generar = vi.fn(
  () =>
    new Promise<Blob>((resolver, rechazar) => {
      pendientes.push({ resolver, rechazar });
    }),
);

async function terminar(cual = 0): Promise<void> {
  await act(async () => {
    pendientes[cual]?.resolver(new Blob(['%PDF-1.3'], { type: 'application/pdf' }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  pendientes = [];
  descargados = [];
  generar.mockClear();
  olvidarLosPdfGuardados();
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:pdf', configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => undefined, configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    descargados.push(this.download);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('el PDF del presupuesto', () => {
  it('no se prepara solo: en la página del cliente lo pide el primer toque', () => {
    const { result } = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar }));

    expect(result.current.estado).toBe('sin-preparar');
    expect(generar).not.toHaveBeenCalled();
    expect(result.current.nombre).toBe('Presupuesto 20260910-01 - Lucía Ferreyra.pdf');
  });

  it('«Descargar» lo prepara en ese botón y lo baja solo cuando está listo', async () => {
    const { result } = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar }));

    act(() => {
      result.current.descargar();
    });
    expect(result.current.estado).toBe('preparando');
    expect(result.current.esperando).toBe('descargar');
    expect(descargados).toEqual([]);

    await terminar();

    expect(result.current.estado).toBe('listo');
    expect(descargados).toEqual(['Presupuesto 20260910-01 - Lucía Ferreyra.pdf']);
  });

  it('el primer toque de «Compartir» lo prepara sin bajarlo; el segundo comparte', async () => {
    const compartirConElAparato = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', {
      userAgent: '',
      canShare: () => true,
      share: compartirConElAparato,
    });
    const { result } = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar }));

    act(() => {
      result.current.compartir();
    });
    expect(result.current.esperando).toBe('compartir');
    await terminar();
    expect(result.current.estado).toBe('listo');
    expect(compartirConElAparato).not.toHaveBeenCalled();
    expect(descargados).toEqual([]);

    act(() => {
      result.current.compartir();
    });
    expect(compartirConElAparato).toHaveBeenCalledOnce();
  });

  it('los mismos datos no se vuelven a generar: el archivo queda guardado por su firma', async () => {
    const primero = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar }));
    act(() => {
      primero.result.current.descargar();
    });
    await terminar();

    const segundo = renderHook(() =>
      usePdfDelPresupuesto({ ...MANDADO, documento: { ...MANDADO.documento } }, { generar }),
    );
    expect(segundo.result.current.estado).toBe('listo');
    act(() => {
      segundo.result.current.descargar();
    });
    expect(generar).toHaveBeenCalledOnce();
    expect(descargados).toHaveLength(2);
  });

  it('en la app del dueño se prepara al abrir, con una demora', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar, alAbrir: true }));

    expect(generar).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(DEMORA_PARA_PREPARAR_MS);
    });
    expect(generar).toHaveBeenCalledOnce();
    expect(result.current.estado).toBe('preparando');
    expect(result.current.esperando).toBeNull();
    await terminar();
    expect(result.current.estado).toBe('listo');
    expect(descargados).toEqual([]);
  });

  it('si no se pudo armar, lo dice y otro toque prueba de nuevo', async () => {
    const { result } = renderHook(() => usePdfDelPresupuesto(MANDADO, { generar }));

    act(() => {
      result.current.descargar();
    });
    await act(async () => {
      pendientes[0]?.rechazar(new Error('sin fuentes'));
      await Promise.resolve();
    });
    expect(result.current.estado).toBe('fallo');

    act(() => {
      result.current.descargar();
    });
    expect(generar).toHaveBeenCalledTimes(2);
  });

  it('si cambian los datos, el de antes no se baja con el nombre del nuevo', async () => {
    const { result, rerender } = renderHook(
      ({ presupuesto }) => usePdfDelPresupuesto(presupuesto, { generar }),
      { initialProps: { presupuesto: MANDADO } },
    );
    act(() => {
      result.current.descargar();
    });
    rerender({ presupuesto: { ...MANDADO, revision: 2, queCambio: 'Otra cosa.' } });
    await terminar();

    expect(descargados).toEqual([]);
    expect(result.current.estado).toBe('sin-preparar');
  });

  it('el archivo se llama en el idioma del presupuesto', async () => {
    await cargarMensajesDelCliente('en');
    const { result } = renderHook(() =>
      usePdfDelPresupuesto({ ...MANDADO, idioma: 'en' }, { generar }),
    );

    expect(result.current.nombre).toBe('Quote 20260910-01 - Lucía Ferreyra.pdf');
    act(() => {
      result.current.descargar();
    });
    await terminar();
    expect(descargados).toEqual(['Quote 20260910-01 - Lucía Ferreyra.pdf']);
  });

  it('si el idioma todavía no llegó, lo trae junto con el PDF y lo baja con su nombre', async () => {
    const { result } = renderHook(() =>
      usePdfDelPresupuesto({ ...MANDADO, idioma: 'pt-BR', revision: 2 }, { generar }),
    );

    act(() => {
      result.current.descargar();
    });
    await terminar();
    await waitFor(() => {
      expect(descargados).toEqual(['Orçamento 20260910-01 Rev 2 - Lucía Ferreyra.pdf']);
      expect(result.current.estado).toBe('listo');
    });
    expect(result.current.nombre).toBe('Orçamento 20260910-01 Rev 2 - Lucía Ferreyra.pdf');
  });
});
