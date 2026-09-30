import { centavos } from '@maun/domain';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DatosDelReparto } from '../model/disposicion';
import { CuerpoDelReparto } from './Fichas';

function reparto(prueba: number | null): DatosDelReparto {
  return {
    armando: false,
    probando: prueba !== null,
    mes: 'septiembre',
    escala: [],
    aTesoros: 0,
    prueba: prueba === null ? null : centavos(prueba),
  };
}

describe('la ficha de lo que sobra', () => {
  it('con un monto largo en la prueba, la cifra se achica para que «Lo que sobra» se lea entero', () => {
    for (const [prueba, clase] of [
      [999_999_918, null],
      [1_111_111_101, 'text-body-sm'],
      [11_111_111_011, 'text-label'],
    ] as const) {
      const { unmount } = render(<CuerpoDelReparto data={reparto(prueba)} elegida={false} />);
      const cifra = screen.getByText(/^\$\s[\d.,]+$/);
      if (clase === null) expect(cifra.className).toBe('');
      else expect(cifra).toHaveClass(clase);
      expect(screen.getByText('Lo que sobra')).toBeInTheDocument();
      unmount();
    }
  });
});
