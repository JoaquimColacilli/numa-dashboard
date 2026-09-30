import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Ayuda, DEMORA_DE_LA_AYUDA_MS, RESPIRO_DE_LA_AYUDA_MS } from './Ayuda';

function cambiar(elemento: HTMLElement, abrir: boolean): void {
  const abierto = elemento.hasAttribute('data-abierto');
  if (abierto === abrir) return;
  const estados = { newState: abrir ? 'open' : 'closed', oldState: abrir ? 'closed' : 'open' };
  elemento.dispatchEvent(Object.assign(new Event('beforetoggle'), estados));
  if (abrir) elemento.setAttribute('data-abierto', '');
  else elemento.removeAttribute('data-abierto');
  elemento.dispatchEvent(Object.assign(new Event('toggle'), estados));
}

function objetivoDe(evento: Event): HTMLElement | null {
  const boton = (evento.target as Element).closest('[popovertarget]');
  const id = boton?.getAttribute('popovertarget');
  return id ? document.getElementById(id) : null;
}

beforeAll(() => {
  if ('showPopover' in HTMLElement.prototype) return;
  Object.assign(HTMLElement.prototype, {
    showPopover(this: HTMLElement) {
      cambiar(this, true);
    },
    hidePopover(this: HTMLElement) {
      cambiar(this, false);
    },
  });
  document.addEventListener('click', (evento) => {
    const objetivo = objetivoDe(evento);
    if (objetivo) cambiar(objetivo, !objetivo.hasAttribute('data-abierto'));
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      const objetivo = objetivoDe(evento);
      if (objetivo) cambiar(objetivo, !objetivo.hasAttribute('data-abierto'));
    }
    if (evento.key === 'Escape') {
      for (const abierto of document.querySelectorAll<HTMLElement>('[popover][data-abierto]')) {
        cambiar(abierto, false);
      }
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function armar() {
  render(
    <p>
      La fila <Ayuda que="Qué es la fila">Cada cobro entra arriba y baja por la fila.</Ayuda>
    </p>,
  );
  const boton = screen.getByRole('button', { name: 'Qué es la fila' });
  const globo = document.getElementById(boton.getAttribute('popovertarget') ?? '') as HTMLElement;
  return { boton, globo };
}

function unCuadro(): Promise<void> {
  return new Promise((listo) => {
    requestAnimationFrame(() => {
      listo();
    });
  });
}

function conCaja(elemento: HTMLElement, arriba: () => number): void {
  vi.spyOn(elemento, 'getBoundingClientRect').mockImplementation(() => {
    const top = arriba();
    return {
      top,
      bottom: top + 20,
      left: 40,
      right: 60,
      width: 20,
      height: 20,
      x: 40,
      y: top,
      toJSON: () => ({}),
    };
  });
}

function conAlto(globo: HTMLElement, alto: number): void {
  Object.defineProperty(globo, 'offsetHeight', { configurable: true, get: () => alto });
  Object.defineProperty(globo, 'offsetWidth', { configurable: true, get: () => 300 });
}

function conLoQueSeVe(alto: number) {
  const vista = Object.assign(new EventTarget(), {
    offsetTop: 0,
    offsetLeft: 0,
    width: 390,
    height: alto,
  });
  vi.stubGlobal('visualViewport', vista);
  return vista;
}

describe('la ayuda (i)', () => {
  it('es un botón con su nombre y su texto va aparte, en el cuerpo del documento', () => {
    const { boton, globo } = armar();
    expect(globo.parentElement).toBe(document.body);
    expect(globo).toHaveAttribute('popover', 'auto');
    expect(globo).toHaveTextContent('Cada cobro entra arriba y baja por la fila.');
    expect(boton).not.toHaveTextContent('Cada cobro');
  });

  it('abre con el toque y se cierra con otro', () => {
    const { boton, globo } = armar();
    fireEvent.click(boton);
    expect(globo).toHaveAttribute('data-abierto');
    fireEvent.click(boton);
    expect(globo).not.toHaveAttribute('data-abierto');
  });

  it('abre con Enter y se cierra con Escape', () => {
    const { boton, globo } = armar();
    boton.focus();
    fireEvent.keyDown(boton, { key: 'Enter' });
    expect(globo).toHaveAttribute('data-abierto');
    fireEvent.keyDown(document.activeElement ?? boton, { key: 'Escape' });
    expect(globo).not.toHaveAttribute('data-abierto');
  });

  it('Escape cierra solo la ayuda: lo que la contiene no recibe la tecla como suya', () => {
    const alTeclear = vi.fn((evento: { key: string; defaultPrevented: boolean }) => ({
      key: evento.key,
      atendida: evento.defaultPrevented,
    }));
    render(
      <section
        aria-label="Panel"
        onKeyDown={(evento) => {
          alTeclear(evento);
        }}
      >
        <Ayuda que="Qué es cada clase de paso">Sueldo, gastos fijos y prioridad.</Ayuda>
      </section>,
    );
    const boton = screen.getByRole('button', { name: 'Qué es cada clase de paso' });
    const globo = document.getElementById(boton.getAttribute('popovertarget') ?? '') as HTMLElement;
    fireEvent.click(boton);
    expect(globo).toHaveAttribute('data-abierto');

    fireEvent.keyDown(boton, { key: 'Escape' });
    expect(globo).not.toHaveAttribute('data-abierto');
    expect(alTeclear.mock.results.at(-1)?.value).toEqual({ key: 'Escape', atendida: true });

    fireEvent.keyDown(boton, { key: 'Escape' });
    expect(alTeclear.mock.results.at(-1)?.value).toEqual({ key: 'Escape', atendida: false });
  });

  it('con el mouse abre recién a los 350 ms de pasar encima', () => {
    vi.useFakeTimers();
    const { boton, globo } = armar();
    fireEvent.pointerEnter(boton, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(DEMORA_DE_LA_AYUDA_MS - 1);
    });
    expect(globo).not.toHaveAttribute('data-abierto');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(globo).toHaveAttribute('data-abierto');
  });

  it('no se cierra al pasar el mouse al globo, y sí al irse de los dos', () => {
    vi.useFakeTimers();
    const { boton, globo } = armar();
    fireEvent.pointerEnter(boton, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(DEMORA_DE_LA_AYUDA_MS);
    });
    fireEvent.pointerLeave(boton, { pointerType: 'mouse' });
    fireEvent.pointerEnter(globo, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(RESPIRO_DE_LA_AYUDA_MS * 2);
    });
    expect(globo).toHaveAttribute('data-abierto');

    fireEvent.pointerLeave(globo, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(RESPIRO_DE_LA_AYUDA_MS);
    });
    expect(globo).not.toHaveAttribute('data-abierto');
  });

  it('se cierra cuando se desplaza lo de afuera, y no cuando se desplaza su propio texto', () => {
    const { boton, globo } = armar();
    const principal = document.createElement('main');
    document.body.append(principal);
    fireEvent.click(boton);
    fireEvent.scroll(globo);
    expect(globo).toHaveAttribute('data-abierto');

    fireEvent.scroll(principal);
    expect(globo).not.toHaveAttribute('data-abierto');
    principal.remove();
  });

  it('se cierra cuando su botón se mueve, como al correr el plano, y no antes', async () => {
    const { boton, globo } = armar();
    let arriba = 100;
    conCaja(boton, () => arriba);
    fireEvent.click(boton);
    await unCuadro();
    await unCuadro();
    expect(globo).toHaveAttribute('data-abierto');

    arriba = 60;
    await unCuadro();
    expect(globo).not.toHaveAttribute('data-abierto');
  });

  it('si cambia el alto de lo que se ve, como al girar el celular, se reubica y sigue abierta', async () => {
    const { boton, globo } = armar();
    let arriba = 100;
    conCaja(boton, () => arriba);
    conAlto(globo, 120);
    fireEvent.click(boton);
    await unCuadro();
    expect(globo.style.top).toBe('128px');

    arriba = 400;
    vi.stubGlobal('innerHeight', 450);
    fireEvent(window, new Event('resize'));
    await unCuadro();
    expect(globo).toHaveAttribute('data-abierto');
    expect(globo.style.top).toBe('272px');

    arriba = 150;
    vi.stubGlobal('innerHeight', 700);
    await unCuadro();
    expect(globo).toHaveAttribute('data-abierto');
    expect(globo.style.top).toBe('178px');
  });

  it('con el teclado abierto se acomoda a lo que queda a la vista', async () => {
    const vista = conLoQueSeVe(800);
    const { boton, globo } = armar();
    conCaja(boton, () => 300);
    conAlto(globo, 120);
    fireEvent.click(boton);
    await unCuadro();
    expect(globo.style.top).toBe('328px');

    vista.height = 420;
    vista.dispatchEvent(new Event('resize'));
    expect(globo).toHaveAttribute('data-abierto');
    expect(globo.style.top).toBe('172px');
  });

  it('si no entra ni abajo ni arriba, queda adentro de lo que se ve', async () => {
    conLoQueSeVe(400);
    const { boton, globo } = armar();
    conCaja(boton, () => 200);
    conAlto(globo, 300);
    fireEvent.click(boton);
    await unCuadro();
    expect(globo.style.top).toBe('88px');
    expect(globo.style.maxHeight).toBe('');
  });

  it('si ni siquiera entra en lo que se ve, lo ocupa entero y el texto se desplaza adentro', async () => {
    conLoQueSeVe(400);
    const { boton, globo } = armar();
    conCaja(boton, () => 200);
    conAlto(globo, 600);
    fireEvent.click(boton);
    await unCuadro();
    expect(globo.style.top).toBe('12px');
    expect(globo.style.maxHeight).toBe('376px');
    expect(globo).toHaveClass('overflow-y-auto', 'overscroll-contain');
  });

  it('con el dedo no espera: pasar encima no la abre, el toque sí', () => {
    vi.useFakeTimers();
    const { boton, globo } = armar();
    fireEvent.pointerEnter(boton, { pointerType: 'touch' });
    act(() => {
      vi.advanceTimersByTime(DEMORA_DE_LA_AYUDA_MS * 2);
    });
    expect(globo).not.toHaveAttribute('data-abierto');
    fireEvent.click(boton);
    expect(globo).toHaveAttribute('data-abierto');
  });
});
