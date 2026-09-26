import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Ilustracion } from '../ilustracion/Ilustracion.tsx';
import { EstadoVacio } from './EstadoVacio.tsx';
import { TarjetaConLamina } from './TarjetaConLamina.tsx';

describe('TarjetaConLamina', () => {
  it('pone la lámina primero y el texto después, en una tarjeta que decide sus columnas por su ancho', () => {
    const { container } = render(
      <TarjetaConLamina dibujo={<Ilustracion nombre="se-corto" />} aria-label="Aviso">
        <h1>No pudimos leer tus datos</h1>
      </TarjetaConLamina>,
    );
    const tarjeta = screen.getByRole('region', { name: 'Aviso' });
    const grilla = tarjeta.firstElementChild;
    const [lamina, texto] = [...(grilla?.children ?? [])];

    expect(tarjeta).toHaveClass(
      '@container/con-lamina',
      'rounded-panel',
      'border-hairline',
      'bg-paper',
    );
    expect(grilla).toHaveClass('grid-cols-1', '@min-[40rem]/con-lamina:grid-cols-2');
    expect(grilla?.className).not.toMatch(/\b(order-|col-start|row-start|flex-row-reverse)/);
    expect(lamina).toHaveAttribute('data-lamina');
    expect(lamina).toHaveAttribute('aria-hidden', 'true');
    expect(texto).toContainElement(screen.getByRole('heading', { level: 1 }));
    expect(container.querySelectorAll('svg.ilustracion')).toHaveLength(1);
  });

  it('apilada va en filas en todos los anchos: la lámina arriba, de alto fijo, y el texto abajo desde arriba', () => {
    render(
      <TarjetaConLamina
        dibujo={<Ilustracion nombre="se-corto" />}
        aria-label="Tu mueble"
        lamina="[&>svg]:w-56 @min-[40rem]/con-lamina:[&>svg]:w-72"
        apilada
      >
        <h1>Placard de tres cuerpos con cajonera y estante para el hall de entrada</h1>
      </TarjetaConLamina>,
    );
    const tarjeta = screen.getByRole('region', { name: 'Tu mueble' });
    const grilla = tarjeta.firstElementChild;
    const [lamina, texto] = [...(grilla?.children ?? [])];

    expect(tarjeta).toHaveClass('@container/con-lamina');
    expect(grilla).toHaveClass('grid', 'grid-cols-1');
    expect(grilla?.className).not.toMatch(/grid-cols-2|order-|col-start|row-start/);
    expect(lamina).toHaveAttribute('data-lamina');
    expect(lamina).toHaveClass('h-49', '@min-[40rem]/con-lamina:h-60', '[&>svg]:w-56');
    expect(lamina?.className).not.toMatch(/h-auto|min-h-70/);
    expect(texto).toContainElement(screen.getByRole('heading', { level: 1 }));
    expect(texto).toHaveClass('px-3.5', 'pt-4', 'pb-3.5');
    expect(texto?.className).not.toMatch(/justify-center|px-8|py-8/);
  });

  it('sin apilada sigue poniendo la lámina al lado desde 40rem, como en los otros lugares', () => {
    render(
      <TarjetaConLamina dibujo={<Ilustracion nombre="se-corto" />} aria-label="Aviso">
        <h1>No pudimos leer tus datos</h1>
      </TarjetaConLamina>,
    );
    const grilla = screen.getByRole('region', { name: 'Aviso' }).firstElementChild;
    const [lamina, texto] = [...(grilla?.children ?? [])];

    expect(lamina).toHaveClass(
      '@min-[40rem]/con-lamina:h-auto',
      '@min-[40rem]/con-lamina:min-h-70',
    );
    expect(texto).toHaveClass('@min-[40rem]/con-lamina:justify-center');
  });

  it('suma las clases de la lámina que le pasa quien la ubica', () => {
    render(
      <TarjetaConLamina dibujo={<Ilustracion nombre="gracias" />} lamina="[&>svg]:w-56" como="div">
        <p>Gracias</p>
      </TarjetaConLamina>,
    );

    expect(document.querySelector('[data-lamina]')).toHaveClass('lamina', 'h-49', '[&>svg]:w-56');
  });
});

describe('EstadoVacio', () => {
  it('es una sección nombrada por su único h2, con el detalle y las acciones abajo', () => {
    render(
      <EstadoVacio
        ilustracion="sin-proyectos"
        titulo="Todavía no hay proyectos activos"
        detalle="Acá están los trabajos que te aprobaron."
      >
        <button type="button">Cargar un proyecto</button>
      </EstadoVacio>,
    );

    const seccion = screen.getByRole('region', { name: 'Todavía no hay proyectos activos' });
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveClass('font-semibold');
    expect(seccion).toContainElement(screen.getByRole('button', { name: 'Cargar un proyecto' }));
    expect(seccion.querySelectorAll('svg.ilustracion')).toHaveLength(1);
  });

  it('acepta un nombre propio para la región y no lleva acciones si no se las pasan', () => {
    render(
      <EstadoVacio
        ilustracion="agenda-vacia"
        titulo="Todavía no hay nada en el mes"
        detalle="Las visitas y las entregas aparecen solas."
        etiqueta="El mes está vacío"
      />,
    );

    expect(screen.getByRole('region', { name: 'El mes está vacío' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
