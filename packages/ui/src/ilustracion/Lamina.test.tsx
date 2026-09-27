import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Eliseo } from './Eliseo.tsx';
import { Ilustracion } from './Ilustracion.tsx';
import { Lamina } from './Lamina.tsx';

describe('Lamina', () => {
  it('es el lugar del dibujo: no se lee y suma las clases de quien la ubica', () => {
    const { container } = render(
      <Lamina className="h-44">
        <Ilustracion nombre="sin-proyectos" />
      </Lamina>,
    );
    const lamina = container.firstElementChild;

    expect(lamina).toHaveAttribute('aria-hidden', 'true');
    expect(lamina).toHaveAttribute('data-lamina');
    expect(lamina).toHaveClass('lamina', 'h-44');
    expect(lamina?.querySelectorAll('svg.ilustracion')).toHaveLength(1);
    expect(lamina).not.toHaveClass('lamina-de-la-marca');
  });

  it('la del panel de la marca suma su clase y sigue siendo un solo dibujo que no se lee', () => {
    const { container } = render(
      <Lamina deLaMarca className="h-full">
        <Eliseo pose="trabajando" />
      </Lamina>,
    );
    const lamina = container.firstElementChild;

    expect(lamina).toHaveAttribute('aria-hidden', 'true');
    expect(lamina).toHaveAttribute('data-lamina');
    expect(lamina).toHaveClass('lamina', 'lamina-de-la-marca', 'h-full');
    expect(lamina?.querySelectorAll('svg.ilustracion')).toHaveLength(1);
    expect(container.querySelectorAll('[data-lamina]')).toHaveLength(1);
  });
});
