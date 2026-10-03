import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { plataCompacta } from '@/shared/lib';

import { Columnas, type ColumnaDelGrafico } from './Columnas';
import { useEleccion } from './eleccion';

const MESES = ['jul', 'ago', 'sept', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun'];
const PESOS = [2.9, 3.4, 2.1, 3.9, 4.2, 3.1, 2.6, 3.5, 4.3, 4.1, 5.2, 3.2];

const HISTORIA: ColumnaDelGrafico[] = MESES.map((mes, indice) => ({
  clave: `m${String(indice)}`,
  etiqueta: mes,
  anio: indice < 6 ? '2026' : '2027',
  valor: Math.round((PESOS[indice] ?? 0) * 100_000_000),
  valorTexto: `$ ${String(PESOS[indice]).replace('.', ',')} M`,
  enPeriodo: indice >= 9,
  enCurso: indice === 11,
  sinRegistro: false,
  nombre: `${mes}: $ ${String(PESOS[indice])} M`,
}));

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

function Arnes({
  columnas = HISTORIA,
  alAbrir,
}: {
  columnas?: ColumnaDelGrafico[];
  alAbrir?: (clave: string) => void;
}) {
  const eleccion = useEleccion();
  return (
    <>
      <Columnas
        nombre="Lo que te dejaron, mes por mes"
        columnas={columnas}
        eleccion={eleccion}
        formatoDelEje={(valor) => plataCompacta(valor, 'es')}
        sinRegistro="sin registro"
        nota="* junio, hasta hoy."
        alAbrir={alAbrir}
      />
      <output aria-label="elegida">{eleccion.elegida ?? ''}</output>
      <output aria-label="mostrada">{eleccion.mostrada ?? ''}</output>
    </>
  );
}

function leido(nombre: string): string {
  return screen.getByRole('status', { name: nombre }).textContent;
}

beforeEach(() => {
  conAncho(600);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('las columnas de lo que te dejaron', () => {
  it('se dibujan al ancho real, con la grilla en 0, la mitad y un techo redondo', () => {
    const { container } = render(<Arnes />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('height', '228');
    const rotulos = [...container.querySelectorAll('svg > g > text')].map((t) => t.textContent);
    expect(rotulos.slice(0, 3)).toEqual(['0', '$ 3 M', '$ 6 M']);
    expect(container.querySelectorAll('[data-columna]')).toHaveLength(12);
  });

  it('las del período van en tinta, las de antes en el gris de contexto y el mes en curso hueco con trazos', () => {
    const { container } = render(<Arnes />);
    const columna = (clave: string) => container.querySelector(`[data-columna="${clave}"]`);
    expect(columna('m0')?.querySelector('path')).toHaveClass('fill-contexto');
    expect(columna('m10')?.querySelector('path')).toHaveClass('fill-ink');
    const enCurso = columna('m11')?.querySelectorAll('path');
    expect(enCurso?.[0]).toHaveClass('opacity-18');
    expect(enCurso?.[1]).toHaveAttribute('stroke-dasharray', '4 3');
    expect(container.textContent).toContain('jun*');
    expect(screen.getByText('* junio, hasta hoy.')).toBeInTheDocument();
  });

  it('la columna más alta lleva su valor arriba, y ninguna otra hasta que se elige', () => {
    const { container } = render(<Arnes />);
    const altura = container.querySelector('[data-columna="m10"] path')?.getAttribute('d') ?? '';
    expect(altura).toMatch(/^M[\d.]+ 198V/u);
    expect(screen.getByText('$ 5,2 M')).toBeInTheDocument();
    expect(screen.queryByText('$ 4,3 M')).toBeNull();
    expect(container.querySelector('[data-franja]')).toBeNull();
  });

  it('es una lista de meses con nombre, explorable con el teclado', () => {
    const alAbrir = vi.fn();
    render(<Arnes alAbrir={alAbrir} />);
    const lista = screen.getByRole('listbox', { name: 'Lo que te dejaron, mes por mes' });
    const opciones = screen.getAllByRole('option');
    expect(opciones).toHaveLength(12);
    expect(opciones[10]).toHaveAccessibleName('may: $ 5.2 M');
    expect(opciones.filter((opcion) => opcion.tabIndex === 0)).toHaveLength(1);

    act(() => {
      opciones[0]?.focus();
    });
    expect(leido('elegida')).toBe('m0');
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(leido('elegida')).toBe('m1');
    expect(document.activeElement).toBe(opciones[1]);
    fireEvent.keyDown(lista, { key: 'End' });
    expect(leido('elegida')).toBe('m11');
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(leido('elegida')).toBe('m11');
    fireEvent.keyDown(lista, { key: 'Home' });
    expect(leido('elegida')).toBe('m0');
    expect(screen.getByRole('option', { selected: true })).toBe(opciones[0]);
    fireEvent.keyDown(lista, { key: 'Enter' });
    expect(alAbrir).toHaveBeenCalledWith('m0');
    fireEvent.keyDown(lista, { key: 'Escape' });
    expect(leido('elegida')).toBe('');
  });

  it('con el mouse, pasar muestra el mes, salir lo borra y el clic lo deja elegido con su franja', () => {
    const { container } = render(<Arnes />);
    const lista = screen.getByRole('listbox');
    const centroDe = (indice: number) => 38 + ((600 - 38) / 12) * (indice + 0.5);
    fireEvent.pointerMove(lista, {
      pointerType: 'mouse',
      buttons: 0,
      clientX: centroDe(3),
      clientY: 50,
    });
    expect(leido('mostrada')).toBe('m3');
    expect(leido('elegida')).toBe('');
    fireEvent.pointerLeave(lista, { pointerType: 'mouse' });
    expect(leido('mostrada')).toBe('');
    fireEvent.pointerDown(lista, {
      pointerType: 'mouse',
      buttons: 1,
      clientX: centroDe(8),
      clientY: 50,
    });
    expect(leido('elegida')).toBe('m8');
    expect(container.querySelector('[data-columna="m8"] [data-franja]')).not.toBeNull();
    expect(screen.getByText('$ 4,3 M')).toBeInTheDocument();
  });

  it('con el dedo, tocar elige, arrastrar mueve la elección al mes más cercano y soltar la deja', () => {
    render(<Arnes />);
    const lista = screen.getByRole('listbox');
    expect(lista).toHaveClass('touch-pan-y');
    fireEvent.pointerDown(lista, { pointerType: 'touch', buttons: 1, clientX: 60, clientY: 80 });
    expect(leido('elegida')).toBe('m0');
    fireEvent.pointerMove(lista, { pointerType: 'touch', buttons: 1, clientX: 590, clientY: 80 });
    expect(leido('elegida')).toBe('m11');
    fireEvent.pointerLeave(lista, { pointerType: 'touch' });
    expect(leido('elegida')).toBe('m11');
  });

  it('en el celular entran los meses que tienen 24 px de banda, los últimos, y el alto se achica', () => {
    cleanup();
    vi.restoreAllMocks();
    conAncho(254);
    const { container } = render(<Arnes />);
    expect(container.querySelector('svg')).toHaveAttribute('height', '202');
    expect(screen.getAllByRole('option')).toHaveLength(9);
    expect(screen.getAllByRole('option')[0]).toHaveAccessibleName('oct: $ 3.9 M');
  });

  it('los meses sin registro no se dibujan ni se eligen: una línea de puntos lo dice', () => {
    const conHueco = HISTORIA.map((columna, indice) =>
      indice < 5 ? { ...columna, sinRegistro: true } : columna,
    );
    const { container } = render(<Arnes columnas={conHueco} />);
    expect(container.querySelectorAll('[data-columna]')).toHaveLength(7);
    expect(screen.getAllByRole('option')).toHaveLength(7);
    expect(container.querySelector('[data-vacio] line[stroke-dasharray="2 3"]')).not.toBeNull();
    expect(screen.getByText('sin registro')).toBeInTheDocument();
  });

  it('un mes que dio pérdida baja desde el cero y el eje lo muestra', () => {
    const conPerdida = HISTORIA.map((columna, indice) =>
      indice === 2 ? { ...columna, valor: -150_000_000, valorTexto: '−$ 1,5 M' } : columna,
    );
    const { container } = render(<Arnes columnas={conPerdida} />);
    const rotulos = [...container.querySelectorAll('svg > g > text')].map((t) => t.textContent);
    expect(rotulos.slice(0, 4)).toEqual(['−$ 2 M', '0', '$ 3 M', '$ 6 M']);
    const camino = container.querySelector('[data-columna="m2"] path')?.getAttribute('d') ?? '';
    const [, , base] = /^M([\d.]+) ([\d.]+)V/u.exec(camino) ?? [];
    const cero = container.querySelector('line.stroke-border')?.getAttribute('y1');
    expect(base).toBe(cero);
  });
});
