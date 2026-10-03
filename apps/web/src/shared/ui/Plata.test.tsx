import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fijarElIdiomaEnUso } from '@/shared/lib';

import { AdornoDePlata, MoneyInput } from './Plata';

afterEach(() => {
  act(() => {
    fijarElIdiomaEnUso('es');
  });
});

describe('el adorno de la plata', () => {
  it('es «$» en castellano, y en inglés y portugués dice la moneda', () => {
    const { container, rerender } = render(<AdornoDePlata className="text-text-3" />);
    expect(container.textContent).toBe('$');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('translate', 'no');

    act(() => {
      fijarElIdiomaEnUso('en');
    });
    expect(container.textContent).toBe('ARS');

    rerender(<AdornoDePlata moneda="USD" />);
    expect(container.textContent).toBe('US$');
  });
});

describe('el campo de plata de la app', () => {
  it('usa los separadores y el marcador del idioma en uso', () => {
    render(<MoneyInput aria-label="Monto" value={150_000} onChange={vi.fn()} conMarcador />);
    const campo = screen.getByLabelText('Monto');
    expect(campo).toHaveValue('1.500');
    expect(campo).toHaveAttribute('placeholder', '$ 0');

    act(() => {
      fijarElIdiomaEnUso('en');
    });
    expect(campo).toHaveValue('1,500');
    expect(campo).toHaveAttribute('placeholder', 'ARS 0');
  });

  it('sin marcador deja el placeholder que le pasan', () => {
    render(
      <MoneyInput aria-label="Monto" value={null} onChange={vi.fn()} placeholder="Opcional" />,
    );
    expect(screen.getByLabelText('Monto')).toHaveAttribute('placeholder', 'Opcional');
  });
});
