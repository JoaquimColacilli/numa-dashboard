import { centavos, type Money } from '@maun/domain';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatearPesos, type TintaDeTesoro } from '@/shared/lib';

import type { Despiece, PiezaDelDespiece } from '../model/despiece';
import { DistribucionDespiece } from './DistribucionDespiece';

const HOGAR = 'hogar-1';
const MAUN = 'maun-1';
const FIJOS = 'fijos-1';
const COCOS = 'cocos-1';

function pantallaDe(ancho: number) {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: consulta.includes('1280') ? ancho >= 1280 : ancho >= 768,
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

function pieza(
  id: string,
  tipo: PiezaDelDespiece['tipo'],
  etiqueta: string,
  tesoro: string,
  nombre: string,
  tinta: TintaDeTesoro,
  monto: number,
  base: number,
): PiezaDelDespiece {
  return {
    id,
    tipo,
    etiqueta,
    tesoro,
    nombre,
    tinta,
    icono: 'vault',
    monto: centavos(monto),
    falta: centavos(0),
    cubierto: false,
    parte: base === 0 ? 0 : monto / base,
  };
}

function despiece(modo: Despiece['modo'], cobrado: number, gastos: number): Despiece {
  const neta = cobrado - gastos;
  const base = neta > 0 ? neta : 0;
  const diezmo = Math.round(base * 0.1);
  const sueldo = Math.round(base * 0.48);
  const fijos = Math.round(base * 0.12);
  const cocos = Math.round(base * 0.2);
  const resto = base - diezmo - sueldo - fijos - cocos;
  return {
    modo,
    cobrado: centavos(cobrado),
    gastos: centavos(gastos),
    neta: centavos(neta),
    piezas: [
      pieza('diezmo', 'diezmo', 'Diezmo 10%', 'diezmo-1', 'Diezmo', 'diezmo', diezmo, base),
      pieza(`paso-${HOGAR}`, 'paso', 'Sueldo', HOGAR, 'Hogar', 'hogar', sueldo, base),
      pieza(`paso-${FIJOS}`, 'paso', 'Gastos fijos', FIJOS, 'Gastos fijos', 'grana', fijos, base),
      pieza(`parte-${COCOS}`, 'parte', '50% de lo que sobra', COCOS, 'Cocos', 'cocos', cocos, base),
      pieza('resto', 'resto', 'El resto', MAUN, 'Maun', 'maun', resto, base),
    ],
  };
}

function region(): HTMLElement {
  return screen.getByRole('region', { name: 'Distribución de la ganancia' });
}

function renglon(texto: string): HTMLElement {
  const elemento = screen.getByText(texto).closest('li');
  if (elemento === null) throw new Error(`No hay renglón con «${texto}».`);
  return elemento;
}

beforeEach(() => {
  pantallaDe(390);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('la distribución de la ganancia', () => {
  it('cobrado, es el tablero cortado en una pieza por paso y por parte, cada una en su tinta', () => {
    const cobrado = despiece('real', 72_500_000, 14_500_000);
    render(<DistribucionDespiece despiece={cobrado} />);

    const dibujo = region().querySelector('[data-lamina] svg.ilustracion');
    expect(dibujo).not.toBeNull();
    expect(
      [...region().querySelectorAll('[data-pieza]')].map((una) => una.getAttribute('data-pieza')),
    ).toEqual(
      expect.arrayContaining([
        'diezmo',
        `paso-${HOGAR}`,
        `paso-${FIJOS}`,
        `parte-${COCOS}`,
        'resto',
      ]),
    );
    expect(region().querySelectorAll('[data-pieza]')).toHaveLength(5);
    expect(region().querySelector('[data-pieza="diezmo"] > title')?.textContent).toBe(
      `Diezmo 10%: ${formatearPesos(centavos(5_800_000))}`,
    );
    expect(region().querySelector(`[data-pieza="paso-${HOGAR}"] > title`)?.textContent).toBe(
      `Sueldo a Hogar: ${formatearPesos(centavos(27_840_000))}`,
    );
    expect(region().querySelector(`[data-pieza="paso-${HOGAR}"] .hogar`)).not.toBeNull();
    expect(region().querySelector(`[data-pieza="paso-${FIJOS}"] .grana`)).not.toBeNull();
    expect(region().querySelector(`[data-pieza="parte-${COCOS}"] .cocos`)).not.toBeNull();
    expect(region().querySelector('[data-pieza="diezmo"] .diezmo')).not.toBeNull();
    expect(region().querySelector('rect.trazos')).toBeNull();
    expect(region().querySelector('[data-pieza][style]')).toBeNull();
  });

  it('cada renglón dice a qué tesoro va, salvo cuando la etiqueta ya lo nombra', () => {
    render(<DistribucionDespiece despiece={despiece('real', 72_500_000, 14_500_000)} />);

    expect(renglon('Sueldo')).toHaveTextContent('a HOGAR');
    expect(renglon('50% de lo que sobra')).toHaveTextContent('a COCOS');
    expect(renglon('El resto')).toHaveTextContent('a MAUN');
    expect(renglon('Diezmo 10%')).not.toHaveTextContent(/ a /);
    expect(renglon('Gastos fijos')).not.toHaveTextContent('a GASTOS FIJOS');
    expect(region()).not.toHaveTextContent('cuatro tesoros');
  });

  it('se corta con el corte solo cuando se pide', () => {
    render(<DistribucionDespiece despiece={despiece('real', 72_500_000, 14_500_000)} animar />);

    const piezas = [...region().querySelectorAll<SVGGElement>('[data-pieza]')];
    expect(piezas).toHaveLength(5);
    for (const una of piezas) expect(una.style.animationName).toBe('maun-corte');
  });

  it('en proyección es el plano de trazos, sin ningún tesoro pintado y sin moverse', () => {
    render(
      <DistribucionDespiece despiece={despiece('proyeccion', 72_500_000, 14_500_000)} animar />,
    );

    expect(region().querySelectorAll('[data-pieza] rect.trazos')).toHaveLength(5);
    expect(
      region().querySelector(
        ['hogar', 'maun', 'diezmo', 'cocos', 'grana', 'mostaza', 'petroleo', 'ciruela']
          .map((tinta) => `[data-lamina] .${tinta}`)
          .join(', '),
      ),
    ).toBeNull();
    expect(region().querySelector('[data-pieza][style]')).toBeNull();
    expect(region().querySelector(`[data-pieza="paso-${HOGAR}"] > title`)?.textContent).toMatch(
      /^Sueldo a Hogar: /,
    );
  });

  it('en el celular rotula solo los porcentajes y desde la tablet también el tesoro', () => {
    const cobrado = despiece('real', 72_500_000, 14_500_000);
    const celular = render(<DistribucionDespiece despiece={cobrado} />);
    const rotulos = () => [...region().querySelectorAll('.rotulo')].map((r) => r.textContent);
    expect(rotulos()).toContain('48%');
    expect(rotulos()).not.toContain('Hogar 48%');
    celular.unmount();

    pantallaDe(1440);
    render(<DistribucionDespiece despiece={cobrado} />);
    expect(rotulos()).toContain('Hogar 48%');
    expect(region().querySelector('.cota')).toBeNull();
  });

  it('un paso en cero porque el mes ya estaba cubierto lo dice, sin pedir lo que falta', () => {
    const base = despiece('proyeccion', 72_500_000, 14_500_000);
    const cubierto: Despiece = {
      ...base,
      piezas: base.piezas.map((una) =>
        una.id === `paso-${HOGAR}` ? { ...una, monto: centavos(0), parte: 0, cubierto: true } : una,
      ),
    };
    render(<DistribucionDespiece despiece={cubierto} />);
    const sueldo = renglon('Sueldo');
    expect(sueldo).toHaveTextContent('ya lo cubrieron otros cobros del mes');
    expect(sueldo).not.toHaveTextContent('faltan');
    expect(region().querySelectorAll('[data-pieza]')).toHaveLength(4);
  });

  it('un paso que no llegó a su tope dice cuánto le falta', () => {
    const base = despiece('real', 72_500_000, 14_500_000);
    const falta: Money = centavos(27_000_000);
    const conFaltante: Despiece = {
      ...base,
      piezas: base.piezas.map((una) => (una.id === `paso-${FIJOS}` ? { ...una, falta } : una)),
    };
    render(<DistribucionDespiece despiece={conFaltante} />);
    expect(renglon('Gastos fijos').textContent).toContain(`faltan ${formatearPesos(falta)}`);
  });

  it('con la neta en cero o menos, la caja punteada y ningún dibujo', () => {
    const sinCobrar = render(<DistribucionDespiece despiece={despiece('proyeccion', 0, 0)} />);
    expect(region().querySelector('svg')).toBeNull();
    expect(region().querySelector('[data-lamina]')).toBeNull();
    expect(screen.getByText(/Todavía no entró plata de este trabajo/)).toHaveClass('border-dashed');
    expect(screen.getByText(/Todavía no entró plata de este trabajo/)).not.toHaveTextContent(
      'cuatro tesoros',
    );
    sinCobrar.unmount();

    render(<DistribucionDespiece despiece={despiece('real', 10_000_000, 15_000_000)} />);
    expect(region().querySelector('svg')).toBeNull();
    expect(screen.getByText(/Los gastos se comieron lo cobrado/)).toHaveClass('border-dashed');
  });
});
