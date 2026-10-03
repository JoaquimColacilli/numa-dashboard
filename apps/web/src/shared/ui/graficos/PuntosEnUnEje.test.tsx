import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEleccion } from './eleccion';
import {
  PuntosEnUnEje,
  RenglonesDePuntos,
  type CotaDelEje,
  type MedianaDelEje,
  type PuntoDelEje,
} from './PuntosEnUnEje';

const ANCHO = 516;

function conAncho(ancho: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: ancho,
    height: 0,
    top: 0,
    left: 0,
    right: ancho,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

const PUNTOS: PuntoDelEje[] = [
  { clave: 'a', dias: 14, forma: 'a-tiempo', etiqueta: null, nombre: 'Escritorio: 14 días' },
  { clave: 'b', dias: 22, forma: 'a-tiempo', etiqueta: null, nombre: 'Placard: 22 días' },
  { clave: 'c', dias: 22, forma: 'a-tiempo', etiqueta: null, nombre: 'Placard chico: 22 días' },
  { clave: 'd', dias: 38, forma: 'tarde', etiqueta: '+3', nombre: 'Cocina en L: 38 días, tarde' },
  { clave: 'e', dias: 45, forma: 'sin-fecha', etiqueta: null, nombre: 'Rack: 45 días' },
];

function Arnes({
  mediana = { dias: 23, texto: 'la mitad, en menos de 23 días' },
  cota = { desde: 14, hasta: 45, texto: 'de 14 a 45 días' },
  alAbrir,
}: {
  mediana?: MedianaDelEje | null;
  cota?: CotaDelEje | null;
  alAbrir?: (clave: string) => void;
}) {
  const eleccion = useEleccion();
  return (
    <>
      <PuntosEnUnEje
        nombre="Cuántos días tardó cada trabajo"
        puntos={PUNTOS}
        maximo={50}
        mediana={mediana}
        cota={cota}
        eleccion={eleccion}
        alAbrir={alAbrir}
      />
      <output aria-label="elegida">{eleccion.elegida ?? ''}</output>
    </>
  );
}

function circuloDe(contenedor: HTMLElement, clave: string): SVGCircleElement | null {
  return contenedor.querySelector(`[data-punto="${clave}"] circle:not([data-realce])`);
}

beforeEach(() => {
  conAncho(ANCHO);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('los puntos sobre el eje de días', () => {
  it('cada trabajo es un punto en su día, y los que caen juntos se apilan', () => {
    const { container } = render(<Arnes />);
    const x = (dias: number) => 8 + (dias / 50) * (ANCHO - 16);
    expect(Number(circuloDe(container, 'a')?.getAttribute('cx'))).toBeCloseTo(x(14));
    const b = circuloDe(container, 'b');
    const c = circuloDe(container, 'c');
    expect(b?.getAttribute('cx')).toBe(c?.getAttribute('cx'));
    expect(Number(b?.getAttribute('cy')) - Number(c?.getAttribute('cy'))).toBe(13);
  });

  it('la forma dice cómo llegó: lleno a tiempo, hueco tarde con sus días de atraso, gris sin fecha', () => {
    const { container } = render(<Arnes />);
    expect(circuloDe(container, 'a')).toHaveClass('fill-ink');
    expect(circuloDe(container, 'd')).toHaveClass('fill-paper', 'stroke-ink');
    expect(circuloDe(container, 'e')).toHaveClass('fill-contexto');
    expect(container.querySelector('[data-punto="d"] text')?.textContent).toBe('+3');
  });

  it('la mediana es una línea de eje con su frase, y la cota va del menor al mayor', () => {
    const { container } = render(<Arnes />);
    expect(container.querySelector('[data-mediana] line')).toHaveAttribute(
      'stroke-dasharray',
      '12 3 2 3',
    );
    expect(screen.getByText('la mitad, en menos de 23 días')).toBeInTheDocument();
    expect(screen.getByText('de 14 a 45 días')).toBeInTheDocument();
    expect(container.querySelector('[data-cota] path')?.getAttribute('d')).toMatch(/v10.*v10.*H/u);
  });

  it('si el rótulo no entra entre las flechas de la cota, va debajo y la cota se ve entera', () => {
    const { container } = render(
      <Arnes cota={{ desde: 30, hasta: 36, texto: 'de 30 a 36 días' }} />,
    );
    const yDeLaCota = 66 + 36;
    expect(container.querySelector('[data-cota] rect')).toBeNull();
    expect(screen.getByText('de 30 a 36 días')).toHaveAttribute('y', String(yDeLaCota + 20));
    expect(container.querySelector('svg')).toHaveAttribute('height', String(66 + 72));
  });

  it('con lugar, el rótulo va sobre la cota, tapando su tramo del medio', () => {
    const { container } = render(<Arnes />);
    expect(container.querySelector('[data-cota] rect')).not.toBeNull();
    expect(screen.getByText('de 14 a 45 días')).toHaveAttribute('y', String(66 + 36 + 4));
    expect(container.querySelector('svg')).toHaveAttribute('height', String(66 + 58));
  });

  it('sin mediana ni cota, el dibujo es más bajo y no las muestra', () => {
    const { container } = render(<Arnes mediana={null} cota={null} />);
    expect(container.querySelector('[data-mediana]')).toBeNull();
    expect(container.querySelector('[data-cota]')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('height', String(66 + 26));
  });

  it('cada punto tiene 24 px para el dedo y, si dos se pisan, gana el más cercano', () => {
    const { container } = render(<Arnes />);
    const lista = screen.getByRole('listbox', { name: 'Cuántos días tardó cada trabajo' });
    const c = circuloDe(container, 'c');
    const cx = Number(c?.getAttribute('cx'));
    const cy = Number(c?.getAttribute('cy'));
    fireEvent.pointerDown(lista, {
      pointerType: 'touch',
      buttons: 1,
      clientX: cx + 2,
      clientY: cy - 3,
    });
    expect(screen.getByRole('status', { name: 'elegida' })).toHaveTextContent('c');
    fireEvent.pointerDown(lista, {
      pointerType: 'touch',
      buttons: 1,
      clientX: cx,
      clientY: cy + 11,
    });
    expect(screen.getByRole('status', { name: 'elegida' })).toHaveTextContent('b');
    expect(container.querySelector('[data-punto="b"] [data-realce]')).not.toBeNull();
    fireEvent.pointerDown(lista, { pointerType: 'touch', buttons: 1, clientX: 2, clientY: 2 });
    expect(screen.getByRole('status', { name: 'elegida' })).toHaveTextContent('b');
  });

  it('se recorre con las flechas, Enter abre el elegido y Escape lo borra', () => {
    const alAbrir = vi.fn();
    render(<Arnes alAbrir={alAbrir} />);
    const opciones = screen.getAllByRole('option');
    expect(opciones.map((opcion) => opcion.getAttribute('aria-label'))).toEqual(
      PUNTOS.map((punto) => punto.nombre),
    );
    act(() => {
      opciones[0]?.focus();
    });
    const lista = screen.getByRole('listbox');
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('status', { name: 'elegida' })).toHaveTextContent('c');
    fireEvent.keyDown(lista, { key: 'Enter' });
    expect(alAbrir).toHaveBeenCalledWith('c');
    fireEvent.keyDown(lista, { key: 'Escape' });
    expect(screen.getByRole('status', { name: 'elegida' })).toHaveTextContent('');
  });
});

describe('los renglones de puntos por tipo', () => {
  const RENGLONES = [
    {
      clave: 'placares',
      nombre: 'Placares',
      detalle: '5 trabajos',
      dias: [19, 21, 22, 24, 31],
      mediana: 22,
      medianaTexto: '22 días',
    },
  ];

  it('en la compu, el nombre a la izquierda, los puntos y la marca de eje en la mediana', () => {
    const { container } = render(<RenglonesDePuntos renglones={RENGLONES} maximo={50} />);
    expect(screen.getByText('Placares')).toHaveAttribute('translate', 'no');
    expect(screen.getByText('22 días')).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(5);
    expect(container.querySelector('svg')).toHaveAttribute('width', String(ANCHO - 118 - 78));
    expect(container.querySelector('[data-mediana]')).toHaveAttribute(
      'stroke-dasharray',
      '6 2 1.5 2',
    );
  });

  it('angosto, el nombre va arriba con cuántos trabajos son', () => {
    cleanup();
    vi.restoreAllMocks();
    conAncho(320);
    const { container } = render(<RenglonesDePuntos renglones={RENGLONES} maximo={50} />);
    expect(screen.getByText('Placares · 5 trabajos')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('width', String(320 - 78));
  });
});
