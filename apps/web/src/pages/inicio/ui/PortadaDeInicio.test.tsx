import { centavos } from '@maun/domain';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CorteDelMes, ParteDelCorte } from '@/entities/proyecto';

const HOY = '2026-09-24';

function parte(
  tesoro: string,
  clave: ParteDelCorte['clave'],
  nombre: string,
  tinta: ParteDelCorte['tinta'],
  monto: number,
): ParteDelCorte {
  return { tesoro, clave, nombre, tinta, monto: centavos(monto) };
}

const CORTE: CorteDelMes = {
  trabajos: 1,
  tablero: centavos(320_000_000),
  partes: [
    parte('h', 'hogar', 'Hogar', 'hogar', 180_000_000),
    parte('m', 'maun', 'Maun', 'maun', 81_000_000),
    parte('d', 'diezmo', 'Diezmo', 'diezmo', 29_000_000),
  ],
  gastos: centavos(30_000_000),
};

const CON_LA_FILA: CorteDelMes = {
  trabajos: 2,
  tablero: centavos(270_000_000),
  partes: [
    parte('h', 'hogar', 'Hogar', 'hogar', 180_000_000),
    parte('f', null, 'Gastos fijos', 'grana', 63_000_000),
    parte('d', 'diezmo', 'Diezmo', 'diezmo', 27_000_000),
  ],
  gastos: centavos(0),
};

const SIN_NADA_COBRADO: CorteDelMes = {
  trabajos: 1,
  tablero: centavos(0),
  partes: [],
  gastos: centavos(0),
};

function pantallaDe(ancho: number) {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: consulta.includes('1280') ? ancho >= 1280 : ancho >= 768,
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

async function portadaNueva() {
  vi.resetModules();
  const { PortadaDeInicio } = await import('./PortadaDeInicio');
  return function montar(corte: CorteDelMes | null, arranque = false) {
    const { container, unmount } = render(
      <MemoryRouter>
        <PortadaDeInicio hoy={HOY} corte={corte} arranque={arranque} />
      </MemoryRouter>,
    );
    return { container, unmount };
  };
}

function dibujoDe(container: HTMLElement): SVGSVGElement {
  const dibujos = container.querySelectorAll<SVGSVGElement>('svg.ilustracion');
  expect(dibujos).toHaveLength(1);
  const [dibujo] = dibujos;
  if (dibujo === undefined) throw new Error('sin dibujo');
  expect(dibujo.closest('[data-lamina]')).not.toBeNull();
  return dibujo;
}

function seCorta(container: HTMLElement): boolean {
  const piezas = [...container.querySelectorAll<SVGGElement>('[data-pieza]')];
  expect(piezas.length).toBeGreaterThan(0);
  return piezas.every((pieza) => pieza.style.animationName === 'maun-corte');
}

beforeAll(async () => {
  await import('./PortadaDeInicio');
}, 30_000);

beforeEach(() => {
  pantallaDe(390);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('la portada de Inicio', { timeout: 20_000 }, () => {
  it('con trabajos cerrados en el mes cuenta el corte y lo dibuja cortado', async () => {
    const montar = await portadaNueva();
    const { container } = montar(CORTE);

    const portada = screen.getByRole('region', { name: 'El corte de septiembre' });
    expect(
      within(portada).getByText(
        'Un trabajo cerrado en septiembre: 56% al hogar, 25% al taller y 9% al diezmo. Lo demás fueron gastos.',
      ),
    ).toBeInTheDocument();
    const dibujo = dibujoDe(container);
    expect(
      [...dibujo.querySelectorAll('[data-pieza]')].map((pieza) => pieza.getAttribute('data-pieza')),
    ).toEqual(expect.arrayContaining(['hogar', 'maun', 'diezmo', 'gastos']));
    expect(dibujo.querySelector('.mano')).toBeNull();
  });

  it('con la fila, nombra al hogar y al diezmo como siempre y a los demás tesoros por su nombre, cada uno con su tinta', async () => {
    const montar = await portadaNueva();
    const { container } = montar(CON_LA_FILA);

    const portada = screen.getByRole('region', { name: 'El corte de septiembre' });
    expect(
      within(portada).getByText(
        '2 trabajos cerrados en septiembre: 67% al hogar, 23% a Gastos fijos y 10% al diezmo.',
      ),
    ).toBeInTheDocument();
    const dibujo = dibujoDe(container);
    expect(
      [...dibujo.querySelectorAll('[data-pieza]')].map((pieza) => pieza.getAttribute('data-pieza')),
    ).toEqual(expect.arrayContaining(['hogar', 'f', 'diezmo']));
    expect(dibujo.querySelector('[data-pieza="f"] .grana')).not.toBeNull();
    expect(dibujo.querySelector('[data-pieza="gastos"]')).toBeNull();
  });

  it('la medida de lo cobrado va desde la tablet, no en el celular', async () => {
    const montar = await portadaNueva();
    const celular = montar(CORTE);
    expect(celular.container.querySelector('.cota')).toBeNull();
    celular.unmount();

    pantallaDe(1440);
    const { container } = montar(CORTE);
    expect(container.querySelector('.cota')?.textContent).toMatch(/3\.200\.000/);
  });

  it('sin trabajos cerrados, o sin nada cobrado, el tablero sigue entero', async () => {
    const montar = await portadaNueva();
    const sinCorte = montar(null);

    expect(screen.getByRole('region', { name: 'El corte de septiembre' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Septiembre todavía no se cortó. Cuando cierres un trabajo, acá vas a ver a dónde va cada peso.',
      ),
    ).toBeInTheDocument();
    const dibujo = dibujoDe(sinCorte.container);
    expect(dibujo.querySelector('[data-pieza], .mano')).toBeNull();
    expect(dibujo.querySelector('.eje')).not.toBeNull();
    sinCorte.unmount();

    const { container } = montar(SIN_NADA_COBRADO);
    expect(
      screen.getByText(
        'Un trabajo cerrado en septiembre, sin nada cobrado: no hubo nada para repartir.',
      ),
    ).toBeInTheDocument();
    expect(dibujoDe(container).querySelector('[data-pieza]')).toBeNull();
  });

  it('si falta configurar, gana el arranque aunque haya corte', async () => {
    const montar = await portadaNueva();
    const { container } = montar(CORTE, true);

    const portada = screen.getByRole('region', { name: 'El taller arranca acá' });
    expect(within(portada).getByRole('heading', { level: 2 })).toHaveTextContent(
      'El taller arranca acá',
    );
    expect(
      within(portada).getByRole('button', { name: 'Cargar sueldo y costos fijos' }),
    ).toBeInTheDocument();
    expect(
      within(portada).getByRole('button', { name: 'Cargar el primer proyecto' }),
    ).toBeInTheDocument();
    const dibujo = dibujoDe(container);
    expect(dibujo.querySelector('.mano')).not.toBeNull();
    expect(dibujo.querySelector('[data-pieza]')).toBeNull();
    expect(screen.queryByText(/El corte de/)).toBeNull();
  });

  it('el corte se anima la primera vez que se muestra y la segunda ya no', async () => {
    const montar = await portadaNueva();
    const primera = montar(CORTE);
    expect(seCorta(primera.container)).toBe(true);
    primera.unmount();

    const { container } = montar(CORTE);
    expect(container.querySelector('[data-pieza][style]')).toBeNull();
  });

  it('la marca del arranque se traza la primera vez, y eso ya gasta el corte de la sesión', async () => {
    const montar = await portadaNueva();
    const arranque = montar(null, true);
    expect(arranque.container.querySelector('.mano.trazar')).not.toBeNull();
    arranque.unmount();

    const otraVez = montar(null, true);
    expect(otraVez.container.querySelector('.mano')).not.toBeNull();
    expect(otraVez.container.querySelector('.trazar')).toBeNull();
    otraVez.unmount();

    const { container } = montar(CORTE);
    expect(container.querySelector('[data-pieza][style]')).toBeNull();
  });

  it('el tablero sin cortar no se mueve ni gasta el corte de la sesión', async () => {
    const montar = await portadaNueva();
    const sinCorte = montar(null);
    expect(sinCorte.container.querySelector('[style], .trazar')).toBeNull();
    sinCorte.unmount();

    const { container } = montar(CORTE);
    expect(seCorta(container)).toBe(true);
  });
});
