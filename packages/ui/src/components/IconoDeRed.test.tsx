import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IconoDeRed, type RedConIcono } from './IconoDeRed.tsx';

const REDES: readonly RedConIcono[] = ['instagram', 'facebook', 'tiktok'];

function dibujo(red: RedConIcono, tamano?: number): SVGSVGElement {
  const { container } = render(<IconoDeRed red={red} tamano={tamano} />);
  const svg = container.querySelector('svg');
  if (svg === null) throw new Error('No se dibujó el ícono.');
  return svg;
}

describe('IconoDeRed', () => {
  it('cada red dibuja su propio trazo, de 30 px y fuera del árbol de accesibilidad', () => {
    const trazos = REDES.map((red) => {
      const svg = dibujo(red);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      expect(svg).toHaveAttribute('width', '30');
      expect(svg).toHaveAttribute('height', '30');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('data-red', red);
      expect(svg.classList.contains('ilustracion')).toBe(false);
      return svg.querySelector('path')?.getAttribute('d') ?? '';
    });
    expect(new Set(trazos).size).toBe(3);
    expect(trazos.every((trazo) => trazo.startsWith('M'))).toBe(true);
  });

  it('Instagram y TikTok van en el color del texto, sin un fondo', () => {
    for (const red of ['instagram', 'tiktok'] as const) {
      const svg = dibujo(red);
      expect(svg.querySelector('path')).toHaveAttribute('fill', 'currentColor');
      expect(svg.querySelector('circle')).toBeNull();
    }
  });

  it('Facebook es el círculo azul con la f blanca, el mismo en los dos temas', () => {
    const svg = dibujo('facebook');
    expect(svg.querySelector('path')).toHaveAttribute('fill', 'var(--color-facebook)');
    expect(svg.querySelector('circle')).toHaveAttribute('fill', 'var(--color-paper-fijo)');
    expect(svg.firstElementChild?.tagName.toLowerCase()).toBe('circle');
  });

  it('el tamaño lo puede elegir quien lo usa', () => {
    expect(dibujo('tiktok', 24)).toHaveAttribute('width', '24');
  });
});
