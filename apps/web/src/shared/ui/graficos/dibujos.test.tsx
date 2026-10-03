import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ColumnasChicas, type ColumnaChica } from './ColumnasChicas';
import { Pesas, type PesaDelGrafico } from './Pesas';
import { PistaDeAvance } from './PistaDeAvance';

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DOCE: ColumnaChica[] = Array.from({ length: 12 }, (_, indice) => ({
  clave: `m${String(indice)}`,
  valor: (indice + 1) * 10_000_000,
  enPeriodo: indice >= 9,
  enCurso: indice === 11,
  sinRegistro: false,
}));

describe('las columnas chicas del resumen', () => {
  it('van sin ejes ni valores, escondidas para el lector, con el primer mes y la llave del período', () => {
    conAncho(320);
    const { container } = render(
      <ColumnasChicas columnas={DOCE} primerRotulo="jul 2026" rotuloDelPeriodo="el período" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('height', '68');
    expect(container.querySelectorAll('path.fill-ink:not(.opacity-18)')).toHaveLength(2);
    expect(container.querySelectorAll('path.opacity-18')).toHaveLength(1);
    expect(container.querySelectorAll('path.fill-contexto')).toHaveLength(9);
    expect(screen.getByText('jul 2026')).toBeInTheDocument();
    expect(container.querySelector('[data-llave]')).not.toBeNull();
    expect(screen.getByText('el período')).toBeInTheDocument();
  });

  it('si la llave no entra sin pisar el primer mes, queda solo el rótulo del primer mes', () => {
    conAncho(120);
    const { container } = render(
      <ColumnasChicas columnas={DOCE} primerRotulo="jul 2026" rotuloDelPeriodo="el período" />,
    );
    expect(container.querySelector('[data-llave]')).toBeNull();
    expect(screen.getByText('jul 2026')).toBeInTheDocument();
  });
});

const PESAS: PesaDelGrafico[] = [
  {
    clave: 'v',
    nombre: 'Vanitory con cajones',
    estimado: 60,
    real: 63,
    realTexto: '$ 63',
    descripcion: 'Vanitory con cajones: estimaste $ 60 y te quedaron $ 63',
  },
  {
    clave: 'c',
    nombre: 'Cocina en L',
    estimado: 45,
    real: 39,
    realTexto: '$ 39',
    descripcion: 'Cocina en L: estimaste $ 45 y te quedaron $ 39',
  },
];

describe('lo que estimaste y lo que te quedó', () => {
  it('un círculo hueco en lo estimado y uno lleno en lo que quedó, sobre un eje sin el cero', () => {
    conAncho(600);
    const { container } = render(
      <Pesas filas={PESAS} formatoDelEje={(valor) => `$ ${String(valor)}`} />,
    );
    const x0 = Math.min(200, 600 * 0.36) + 12;
    const x = (valor: number) => x0 + ((valor - 30) / (70 - 30)) * (600 - 34 - x0);
    const vanitory = container.querySelector('[data-pesa="v"]');
    expect(Number(vanitory?.querySelector('[data-estimado]')?.getAttribute('cx'))).toBeCloseTo(
      x(60),
    );
    expect(Number(vanitory?.querySelector('[data-real]')?.getAttribute('cx'))).toBeCloseTo(x(63));
    expect(vanitory?.querySelector('[data-real]')).toHaveClass('fill-ink');
    expect(vanitory?.querySelector('[data-estimado]')).toHaveClass('fill-paper');
    const rotulos = [...container.querySelectorAll('svg > g:not([data-pesa]) > text')].map(
      (t) => t.textContent,
    );
    expect(rotulos).toEqual(['$ 30', '$ 40', '$ 50', '$ 60', '$ 70']);
  });

  it('el dibujo está escondido y una lista lo dice con palabras', () => {
    conAncho(600);
    const { container } = render(<Pesas filas={PESAS} formatoDelEje={String} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('list')).toHaveClass('sr-only');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      PESAS.map((pesa) => pesa.descripcion),
    );
  });

  it('angosto, el nombre va arriba de su renglón y entero', () => {
    conAncho(340);
    const { container } = render(<Pesas filas={PESAS} formatoDelEje={String} />);
    const nombre = container.querySelector('[data-pesa="v"] text');
    expect(nombre?.textContent).toBe('Vanitory con cajones');
    expect(nombre).toHaveAttribute('y', '14');
    expect(container.querySelector('svg')).toHaveAttribute('height', String(2 * 44 + 24));
  });
});

describe('la pista de un trabajo en curso', () => {
  it('la barra hasta hoy, los trazos hasta lo prometido con su tope y la marca de la mediana', () => {
    conAncho(302);
    const { container } = render(
      <PistaDeAvance dias={15} prometido={30} mediana={23} maximo={45} />,
    );
    const x = (dias: number) => (dias / 45) * 300 + 1;
    expect(container.querySelector('[data-hasta-hoy]')?.getAttribute('d')).toContain(
      `H${String(x(15) - 3)}`,
    );
    const trazos = container.querySelector('[data-hasta-lo-prometido]');
    expect(trazos).toHaveAttribute('stroke-dasharray', '4 3');
    expect(Number(trazos?.getAttribute('x2'))).toBeCloseTo(x(30));
    expect(container.querySelector('[data-prometido]')?.getAttribute('d')).toBe(
      `M${String(x(30))} 3v12`,
    );
    expect(Number(container.querySelector('[data-mediana]')?.getAttribute('x1'))).toBeCloseTo(
      x(23),
    );
  });

  it('pasado lo prometido no hay trazos, y lo que pasa del máximo se queda en el borde', () => {
    conAncho(302);
    const { container } = render(
      <PistaDeAvance dias={60} prometido={30} mediana={null} maximo={45} />,
    );
    expect(container.querySelector('[data-hasta-lo-prometido]')).toBeNull();
    expect(container.querySelector('[data-mediana]')).toBeNull();
    expect(container.querySelector('[data-hasta-hoy]')?.getAttribute('d')).toContain('H298');
  });
});
