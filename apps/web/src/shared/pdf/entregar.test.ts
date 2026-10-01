import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  compartirElArchivo,
  descargarElArchivo,
  esUnIphoneConLaAppInstalada,
  LO_QUE_DURA_EL_ENLACE_MS,
  sePuedenCompartirArchivos,
  TIPO_DEL_PDF,
} from './entregar';

const ARCHIVO = new File(['%PDF-1.3'], 'Presupuesto 20260826-01 - Florencia Sosa.pdf', {
  type: TIPO_DEL_PDF,
});

const EN_UN_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)';

let descargados: string[] = [];
const soltar = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  descargados = [];
  soltar.mockClear();
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:presupuesto',
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', { value: soltar, configurable: true });
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

function conCompartir(comparte: boolean, share: () => Promise<void>) {
  const compartir = vi.fn(share);
  vi.stubGlobal('navigator', { userAgent: '', canShare: () => comparte, share: compartir });
  return compartir;
}

describe('descargar el PDF', () => {
  it('baja el archivo con su nombre y suelta el enlace al minuto', () => {
    descargarElArchivo(ARCHIVO);

    expect(descargados).toEqual(['Presupuesto 20260826-01 - Florencia Sosa.pdf']);
    expect(document.querySelector('a[download]')).toBeNull();
    vi.advanceTimersByTime(LO_QUE_DURA_EL_ENLACE_MS - 1);
    expect(soltar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(soltar).toHaveBeenCalledWith('blob:presupuesto');
  });
});

describe('compartir el PDF', () => {
  it('donde el aparato comparte archivos, comparte solo el archivo y el título', () => {
    const compartir = conCompartir(true, () => Promise.resolve());

    compartirElArchivo(ARCHIVO, 'Presupuesto 20260826-01');

    expect(compartir).toHaveBeenCalledWith({
      files: [ARCHIVO],
      title: 'Presupuesto 20260826-01',
    });
    expect(descargados).toEqual([]);
  });

  it('si no comparte archivos, lo baja', () => {
    const compartir = conCompartir(false, () => Promise.resolve());

    compartirElArchivo(ARCHIVO, 'Presupuesto 20260826-01');

    expect(compartir).not.toHaveBeenCalled();
    expect(descargados).toEqual([ARCHIVO.name]);
  });

  it('cerrar la hoja o tocar dos veces no es un error', async () => {
    for (const nombre of ['AbortError', 'InvalidStateError']) {
      conCompartir(true, () => Promise.reject(new DOMException('cerrada', nombre)));
      compartirElArchivo(ARCHIVO, 'Presupuesto 20260826-01');
      await vi.runAllTimersAsync();
    }
    expect(descargados).toEqual([]);
  });

  it('cualquier otro error de compartir termina en la descarga', async () => {
    conCompartir(true, () => Promise.reject(new DOMException('no', 'NotAllowedError')));

    compartirElArchivo(ARCHIVO, 'Presupuesto 20260826-01');
    await vi.runAllTimersAsync();

    expect(descargados).toEqual([ARCHIVO.name]);
  });

  it('sin canShare no hay cómo compartir', () => {
    vi.stubGlobal('navigator', { userAgent: '' });
    expect(sePuedenCompartirArchivos()).toBe(false);
  });
});

describe('el iPhone con la app instalada', () => {
  it('se reconoce por el aparato y la pantalla completa', () => {
    vi.stubGlobal('navigator', { userAgent: EN_UN_IPHONE, standalone: true });
    expect(esUnIphoneConLaAppInstalada()).toBe(true);
  });

  it('en Safari, sin instalar, no', () => {
    vi.stubGlobal('navigator', { userAgent: EN_UN_IPHONE, standalone: false });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(esUnIphoneConLaAppInstalada()).toBe(false);
  });
});
