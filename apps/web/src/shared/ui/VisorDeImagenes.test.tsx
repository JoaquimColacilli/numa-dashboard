import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VisorDeImagenes, type ImagenDelVisor } from './VisorDeImagenes';

const FOTOS: ImagenDelVisor[] = [
  { id: 'a', nombre: 'Frente.jpeg', url: 'https://cdn.test/a.webp', ancho: 2000, alto: 1500 },
  { id: 'b', nombre: 'Interior.jpeg', url: 'https://cdn.test/b.webp', ancho: 1500, alto: 2000 },
  { id: 'c', nombre: 'Detalle.PNG', url: 'https://cdn.test/c.webp', ancho: null, alto: null },
];

describe('el visor de imágenes', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('abre en la foto tocada, con su nombre, la foto completa, cuántas hay y cómo abrirla aparte', () => {
    render(<VisorDeImagenes imagenes={FOTOS} inicial="b" alCerrar={() => undefined} />);

    const visor = screen.getByRole('dialog', { name: 'Interior.jpeg' });
    expect(within(visor).getByRole('img', { name: 'Interior.jpeg' })).toHaveAttribute(
      'src',
      'https://cdn.test/b.webp',
    );
    expect(visor).toHaveTextContent('2 de 3');
    const aparte = within(visor).getByRole('link', { name: 'Abrir en otra pestaña' });
    expect(aparte).toHaveAttribute('href', 'https://cdn.test/b.webp');
    expect(aparte).toHaveAttribute('target', '_blank');
    expect(aparte).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('las flechas pasan de foto aunque el foco esté en la X, y dan la vuelta', () => {
    render(<VisorDeImagenes imagenes={FOTOS} inicial="c" alCerrar={() => undefined} />);

    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.keyDown(cerrar, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: 'Frente.jpeg' })).toBeInTheDocument();
    fireEvent.keyDown(cerrar, { key: 'ArrowLeft' });
    expect(screen.getByRole('dialog', { name: 'Detalle.PNG' })).toBeInTheDocument();
  });

  it('con una sola foto no hay flechas ni cuenta', () => {
    render(<VisorDeImagenes imagenes={FOTOS.slice(0, 1)} inicial="a" alCerrar={() => undefined} />);

    const visor = screen.getByRole('dialog', { name: 'Frente.jpeg' });
    expect(within(visor).queryByRole('button', { name: 'Siguiente' })).toBeNull();
    expect(visor).not.toHaveTextContent('1 de 1');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cerrar' }), { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: 'Frente.jpeg' })).toBeInTheDocument();
  });

  it('sin acciones no ofrece borrar ni dice cuánto pesa, y con ellas las pone al lado de la navegación', () => {
    const { unmount } = render(
      <VisorDeImagenes imagenes={FOTOS} inicial="a" alCerrar={() => undefined} />,
    );
    expect(screen.queryByRole('button', { name: /Borrar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('1 de 3');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('·');
    unmount();

    const alBorrar = vi.fn();
    render(
      <VisorDeImagenes
        imagenes={FOTOS}
        inicial="a"
        alCerrar={() => undefined}
        detalle={() => '120 KB'}
        acciones={(imagen) => (
          <button
            type="button"
            onClick={() => {
              alBorrar(imagen.id);
            }}
          >
            Borrar
          </button>
        )}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('1 de 3 · 120 KB');
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(alBorrar).toHaveBeenCalledWith('a');
  });

  it('con un título aparte, la hoja se llama así y cada foto lleva su nombre como texto alternativo', () => {
    render(
      <VisorDeImagenes
        titulo="Más trabajos del taller"
        imagenes={[
          {
            id: 'f1',
            nombre: 'Foto 1 de 2',
            url: 'https://cdn.test/f1.webp',
            ancho: 900,
            alto: 1200,
          },
          {
            id: 'f2',
            nombre: 'Foto 2 de 2',
            url: 'https://cdn.test/f2.webp',
            ancho: 900,
            alto: 1200,
          },
        ]}
        inicial="f2"
        alCerrar={() => undefined}
      />,
    );

    const visor = screen.getByRole('dialog', { name: 'Más trabajos del taller' });
    expect(within(visor).getByRole('img', { name: 'Foto 2 de 2' })).toHaveAttribute(
      'src',
      'https://cdn.test/f2.webp',
    );
    expect(visor).toHaveTextContent('2 de 2');
  });
});
