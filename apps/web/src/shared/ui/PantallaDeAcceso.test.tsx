import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PantallaDeAcceso } from './PantallaDeAcceso';

const LEMA =
  'Cuánto falta cobrar, qué se entrega esta semana y a dónde va cada peso cuando se cobra.';

const FOTO = 'https://fotos.ejemplo/persona.webp';

function enUnaPantallaDeCelular(): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: false,
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

function conLaVentanaVisibleDe(alto: number): void {
  vi.stubGlobal('visualViewport', {
    height: alto,
    offsetTop: 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
}

function elPanel(): HTMLElement {
  return screen.getByRole('complementary');
}

beforeEach(() => {
  enUnaPantallaDeCelular();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('el panel de las pantallas de acceso', () => {
  it('lleva el logotipo de NUMA, en el color del panel, y no el nombre del taller', () => {
    render(
      <PantallaDeAcceso titulo="Entrar">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const panel = elPanel();
    const marca = within(panel).getByRole('img', { name: 'NUMA' });
    expect(marca).toHaveAttribute('stroke', 'currentColor');
    expect(panel).toHaveClass('text-sobre-marca');
    expect(marca.parentElement).toHaveClass('h-[30px]');
    expect(panel).not.toHaveTextContent('MAUN');
  });
});

describe('el dibujo del panel', () => {
  it('con una pose, el panel lleva una sola lámina de la marca con un solo dibujo, y el hueco dice la pose', () => {
    const { container } = render(
      <PantallaDeAcceso titulo="Entrá al taller" pose="trabajando">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const panel = elPanel();
    const laminas = container.querySelectorAll('[data-lamina]');

    expect(laminas).toHaveLength(1);
    const [lamina] = laminas;
    expect(panel).toContainElement(lamina as HTMLElement);
    expect(lamina).toHaveClass('lamina', 'lamina-de-la-marca');
    expect(lamina).toHaveAttribute('aria-hidden', 'true');
    expect(lamina?.querySelectorAll('svg.ilustracion')).toHaveLength(1);
    expect(panel.querySelector('[data-pose]')).toHaveAttribute('data-pose', 'trabajando');
    expect(panel.querySelector('[data-pose]')).toContainElement(lamina as HTMLElement);
    expect(container.querySelector('svg.ilustracion title, svg.ilustracion text')).toBeNull();
  });

  it('con una pose, el lema queda para la compu: por debajo de lg le deja su lugar al dibujo', () => {
    render(
      <PantallaDeAcceso titulo="Entrá al taller" pose="trabajando">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const lema = within(elPanel()).getByText(LEMA);

    expect(lema).toHaveClass('hidden', 'lg:block');
  });

  it('con la persona del bloqueo no hay dibujo: está su foto', () => {
    const { container } = render(
      <PantallaDeAcceso
        titulo="Hola, Ana"
        persona={{ nombre: 'Ana', email: 'ana@taller.com.ar', foto: FOTO }}
      >
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const panel = elPanel();

    expect(container.querySelector('[data-lamina]')).toBeNull();
    expect(container.querySelector('[data-pose]')).toBeNull();
    expect(panel.querySelector('[data-foto]')).not.toBeNull();
    expect(panel.querySelector(`img[src="${FOTO}"]`)).not.toBeNull();
    expect(within(panel).getByText('Ana')).toBeInTheDocument();
    expect(within(panel).queryByText(LEMA)).toBeNull();
  });

  it('sin pose ni persona queda el lema, como antes', () => {
    const { container } = render(
      <PantallaDeAcceso titulo="Entrar">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const lema = within(elPanel()).getByText(LEMA);

    expect(container.querySelector('[data-lamina]')).toBeNull();
    expect(container.querySelector('[data-pose]')).toBeNull();
    expect(lema).not.toHaveClass('hidden');
  });

  it('con la ventana visible baja en el celular, como con el teclado abierto, no se monta el dibujo', () => {
    conLaVentanaVisibleDe(460);
    const { container } = render(
      <PantallaDeAcceso titulo="Entrá al taller" pose="trabajando">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );

    expect(container.querySelector('[data-lamina]')).toBeNull();
    expect(container.querySelector('[data-pose]')).toBeNull();
    expect(container.querySelector('svg.ilustracion')).toBeNull();
    expect(within(elPanel()).queryByText(LEMA)).toBeNull();
  });

  it('con la ventana visible alta en el celular, el dibujo está', () => {
    conLaVentanaVisibleDe(844);
    const { container } = render(
      <PantallaDeAcceso titulo="Entrá al taller" pose="trabajando">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );

    expect(container.querySelectorAll('[data-lamina]')).toHaveLength(1);
  });

  it('la tilde del pulgar se traza solo si la pantalla lo pide', () => {
    const conTrazo = render(
      <PantallaDeAcceso titulo="Listo, ya entraste" pose="pulgar" animarElDibujo>
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    expect(conTrazo.container.querySelectorAll('.trazar')).toHaveLength(1);
    conTrazo.unmount();

    const quieta = render(
      <PantallaDeAcceso titulo="Listo, ya entraste" pose="pulgar">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    expect(quieta.container.querySelectorAll('.trazar')).toHaveLength(0);
  });

  it('el dibujo no cambia a dónde va el foco: sigue yendo al título', () => {
    render(
      <PantallaDeAcceso titulo="Creá tu cuenta" pose="midiendo">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Creá tu cuenta' })).toHaveFocus();
  });
});
