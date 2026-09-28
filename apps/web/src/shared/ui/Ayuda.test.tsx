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
