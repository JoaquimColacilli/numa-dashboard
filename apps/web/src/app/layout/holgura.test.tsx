import { act, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHolguraInferior } from './holgura';

const FONDO = 800;

function Pantalla({
  enElCelular,
  conLaBarra,
  conElIndicador = false,
}: {
  enElCelular: boolean;
  conLaBarra: boolean;
  conElIndicador?: boolean;
}) {
  const principal = useRef<HTMLElement>(null);
  const [pie, setPie] = useState<HTMLDivElement | null>(null);
  const holgura = useHolguraInferior(pie, principal, enElCelular);
  return (
    <>
      <div ref={setPie} data-lo-que-flota-abajo>
        {conElIndicador && <p data-alto={40} />}
        {conLaBarra && <nav data-barra-inferior data-alto={91} />}
      </div>
      <main ref={principal}>
        <output>{holgura.contenido}</output>
      </main>
    </>
  );
}

function holguraDelContenido(): number {
  return Number(screen.getByRole('status').textContent);
}

function cambiaElTamano() {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

function pasaUnCuadro() {
  act(() => {
    vi.runAllTimers();
  });
}

let campo: HTMLInputElement;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (!this.hasAttribute('data-lo-que-flota-abajo')) return new DOMRect(0, 0, 390, FONDO);
    const alto = Array.from(this.children).reduce(
      (suma, hijo) => suma + Number(hijo.getAttribute('data-alto')),
      0,
    );
    return new DOMRect(0, FONDO - alto, 390, alto);
  });
  campo = document.createElement('input');
  document.body.append(campo);
});

afterEach(() => {
  campo.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('en el celular', () => {
  it('si el foco sale de un campo antes de que vuelva la barra, el contenido no pierde su holgura', () => {
    const { rerender } = render(<Pantalla enElCelular conLaBarra />);
    expect(holguraDelContenido()).toBe(103);

    act(() => {
      campo.focus();
    });
    rerender(<Pantalla enElCelular conLaBarra={false} />);
    cambiaElTamano();
    expect(holguraDelContenido()).toBe(103);

    act(() => {
      campo.blur();
    });
    pasaUnCuadro();
    expect(holguraDelContenido()).toBe(103);

    rerender(<Pantalla enElCelular conLaBarra />);
    cambiaElTamano();
    expect(holguraDelContenido()).toBe(103);
  });

  it('con la barra de vuelta, la holgura sigue a lo que flota', () => {
    const { rerender } = render(<Pantalla enElCelular conLaBarra conElIndicador />);
    expect(holguraDelContenido()).toBe(143);

    rerender(<Pantalla enElCelular conLaBarra />);
    cambiaElTamano();
    expect(holguraDelContenido()).toBe(103);
  });
});

describe('en la compu', () => {
  it('cuando se va lo único que flotaba y ya no se escribe, el contenido deja de reservarle lugar', () => {
    const { rerender } = render(<Pantalla enElCelular={false} conLaBarra={false} conElIndicador />);
    expect(holguraDelContenido()).toBe(52);

    act(() => {
      campo.focus();
    });
    rerender(<Pantalla enElCelular={false} conLaBarra={false} />);
    cambiaElTamano();
    expect(holguraDelContenido()).toBe(52);

    act(() => {
      campo.blur();
    });
    pasaUnCuadro();
    expect(holguraDelContenido()).toBe(0);
  });
});
