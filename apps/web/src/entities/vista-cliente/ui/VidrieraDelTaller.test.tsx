import { VIDRIERA_VACIA, type VidrieraDelTaller as Vidriera } from '@maun/domain';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EL_TALLER_EN_LAS_REDES,
  MAS_TRABAJOS_DEL_TALLER,
  VidrieraDelTaller,
} from './VidrieraDelTaller';

vi.mock('@/shared/api', () => ({
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
}));

const REDES = {
  instagram: 'https://www.instagram.com/taller.maun/',
  facebook: 'https://www.facebook.com/tallermaun',
  tiktok: 'https://www.tiktok.com/@taller.maun',
};

function fotos(cantidad: number): Vidriera['fotos'] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: `f${String(indice + 1)}`,
    ruta: `h/vidriera/f${String(indice + 1)}.webp`,
    rutaMini: `h/vidriera/f${String(indice + 1)}.mini.webp`,
    ancho: 900,
    alto: 1200,
  }));
}

function montar(vidriera: Vidriera) {
  return render(<VidrieraDelTaller vidriera={vidriera} taller="Taller MAUN" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('la vidriera del taller en la página del cliente', () => {
  it('sin fotos ni redes no aparece', () => {
    const { container } = montar(VIDRIERA_VACIA);
    expect(container).toBeEmptyDOMElement();
  });

  it('con fotos se llama «Más trabajos del taller» y cada foto abre la completa aparte', () => {
    montar({ ...VIDRIERA_VACIA, fotos: fotos(2) });
    expect(screen.getByRole('region', { name: MAS_TRABAJOS_DEL_TALLER })).toBeInTheDocument();

    const enlaces = within(screen.getByRole('list')).getAllByRole('link');
    expect(enlaces.map((enlace) => enlace.getAttribute('aria-label'))).toEqual([
      'Foto 1 de 2',
      'Foto 2 de 2',
    ]);
    expect(enlaces[0]).toHaveAttribute('href', 'https://cdn.maun.test/h/vidriera/f1.webp');
    expect(enlaces[0]).toHaveAttribute('target', '_blank');
    expect(enlaces[0]).toHaveAttribute('rel', 'noopener noreferrer');

    const miniatura = enlaces[0]?.querySelector('img');
    expect(miniatura).toHaveAttribute('src', 'https://cdn.maun.test/h/vidriera/f1.mini.webp');
    expect(miniatura).toHaveAttribute('alt', '');
    expect(miniatura).toHaveAttribute('width', '900');
    expect(miniatura).toHaveAttribute('height', '1200');
    expect(miniatura).toHaveAttribute('loading', 'lazy');
    expect(miniatura).toHaveAttribute('decoding', 'async');
  });

  it('solo con redes se llama «El taller en las redes», y cada red se nombra', () => {
    montar({ ...VIDRIERA_VACIA, redes: REDES });
    expect(screen.getByRole('region', { name: EL_TALLER_EN_LAS_REDES })).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();

    const instagram = screen.getByRole('link', { name: '@taller.maun en Instagram' });
    expect(instagram).toHaveAttribute('href', REDES.instagram);
    expect(instagram).toHaveTextContent('@taller.maun');
    expect(screen.getByRole('link', { name: 'Facebook del taller' })).toHaveAttribute(
      'href',
      REDES.facebook,
    );
    expect(screen.getByRole('link', { name: 'TikTok del taller' })).toHaveAttribute(
      'href',
      REDES.tiktok,
    );
    for (const enlace of screen.getAllByRole('link')) {
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
      expect(enlace.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('sin redes no hay «Compartir»', () => {
    montar({ ...VIDRIERA_VACIA, fotos: fotos(1) });
    expect(screen.queryByRole('button', { name: 'Compartir' })).toBeNull();
  });

  it('los botones del carrusel aparecen solo si las fotos no entran, y corren de a un ancho', () => {
    let desplazado = 0;
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
      return this.tagName === 'UL' ? 600 : 0;
    });
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
      return this.tagName === 'UL' ? 300 : 0;
    });
    vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockImplementation(() => desplazado);
    const correr = vi.fn(function (this: HTMLElement, opciones: ScrollToOptions) {
      desplazado += opciones.left ?? 0;
      this.dispatchEvent(new Event('scrollend'));
      this.dispatchEvent(new Event('scroll'));
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      configurable: true,
      value: correr,
    });

    vi.useFakeTimers();
    montar({ ...VIDRIERA_VACIA, fotos: fotos(8) });

    const anteriores = screen.getByRole('button', { name: 'Fotos anteriores' });
    const siguientes = screen.getByRole('button', { name: 'Fotos siguientes' });
    const lista = screen.getByRole('list');
    expect(anteriores).toHaveAttribute('aria-controls', lista.id);
    expect(anteriores).toHaveAttribute('aria-disabled', 'true');
    expect(siguientes).not.toHaveAttribute('aria-disabled');

    fireEvent.click(anteriores);
    expect(correr).not.toHaveBeenCalled();

    fireEvent.click(siguientes);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(correr).toHaveBeenCalledWith({ left: 300, behavior: 'instant' });
    expect(siguientes).toHaveAttribute('aria-disabled', 'true');
    expect(anteriores).not.toHaveAttribute('aria-disabled');
    vi.useRealTimers();
  });

  it('una foto que se enfoca con el teclado y no se ve entera se corre al principio de la tira; tocada, no', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this.tagName === 'UL') return new DOMRect(0, 0, 356, 128);
      const numero = Number(/^Foto (\d) de 6$/.exec(this.getAttribute('aria-label') ?? '')?.[1]);
      return new DOMRect(16 + (numero - 1) * 104, 0, 96, 128);
    });
    let conTeclado = true;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      return selector === ':focus-visible' ? conTeclado : this.closest(selector) === this;
    });
    const mostrar = vi.fn(function (this: HTMLElement) {
      return this.getAttribute('aria-label');
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mostrar,
    });
    montar({ ...VIDRIERA_VACIA, fotos: fotos(6) });

    act(() => {
      screen.getByRole('link', { name: 'Foto 3 de 6' }).focus();
    });
    expect(mostrar).not.toHaveBeenCalled();

    act(() => {
      screen.getByRole('link', { name: 'Foto 4 de 6' }).focus();
    });
    expect(mostrar).toHaveBeenCalledExactlyOnceWith({
      block: 'nearest',
      inline: 'start',
      behavior: 'instant',
    });
    expect(mostrar).toHaveReturnedWith('Foto 4 de 6');

    conTeclado = false;
    act(() => {
      screen.getByRole('link', { name: 'Foto 5 de 6' }).focus();
    });
    expect(mostrar).toHaveBeenCalledOnce();
  });

  it('con fotos que entran no hay botones', () => {
    montar({ ...VIDRIERA_VACIA, fotos: fotos(2) });
    expect(screen.queryByRole('button', { name: 'Fotos siguientes' })).toBeNull();
  });
});

describe('compartir las redes', () => {
  it('con el compartir del teléfono, comparte el nombre del taller y el link de la primera red', async () => {
    const compartir = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { share: compartir, canShare: () => true });
    montar({ ...VIDRIERA_VACIA, redes: { ...REDES, instagram: null } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
      await Promise.resolve();
    });
    expect(compartir.mock.calls).toEqual([[{ title: 'Taller MAUN', url: REDES.facebook }]]);
    expect(screen.getByRole('button', { name: 'Compartir' })).toBeInTheDocument();
  });

  it('sin compartir del teléfono, copia el link y dice «Copiado»', async () => {
    const escribir = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText: escribir } });
    montar({ ...VIDRIERA_VACIA, redes: REDES });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
      await Promise.resolve();
    });
    expect(escribir).toHaveBeenCalledWith(REDES.instagram);
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument();
  });

  it('si no se puede ni compartir ni copiar, muestra el link para copiarlo a mano', async () => {
    const cancelar = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    vi.stubGlobal('navigator', { share: cancelar, canShare: () => true });
    montar({ ...VIDRIERA_VACIA, redes: REDES });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
      await Promise.resolve();
    });
    expect(screen.getByText(REDES.instagram)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar el enlace' })).toBeInTheDocument();
  });
});
