import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComparacionMensual } from './ComparacionMensual';

function dibujar() {
  return render(
    <ComparacionMensual
      titulo="Este mes contra el anterior"
      etiquetaPrevia="Agosto"
      etiquetaActual="Septiembre"
      barras={[
        {
          id: 'ingresos',
          etiqueta: 'Ingresos',
          previo: 100_000,
          actual: 120_000,
          tono: 'text-hogar',
        },
        {
          id: 'gastos',
          etiqueta: 'Gastos',
          previo: 80_000,
          actual: 60_000,
          tono: 'text-alerta',
          mejorSiBaja: true,
        },
      ]}
    />,
  );
}

describe('la comparación del mes', () => {
  it('el mes anterior va en el gris de contexto, en sus columnas y en el cuadradito de la leyenda', () => {
    const { container } = dibujar();

    const anteriores = [...container.querySelectorAll('svg g')].map((grupo) =>
      grupo.querySelector('rect'),
    );
    expect(anteriores).toHaveLength(2);
    for (const columna of anteriores) expect(columna).toHaveClass('fill-contexto');

    const cuadraditos = container.querySelectorAll('section > div span[aria-hidden]');
    expect(cuadraditos[0]).toHaveClass('bg-contexto');
    expect(cuadraditos[1]).toHaveClass('bg-ink');
    expect(container.innerHTML).not.toMatch(/\b(fill|bg)-border\b/);
  });
});
