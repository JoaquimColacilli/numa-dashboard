import {
  borradorNuevo,
  centavosEn,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  huecosDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  type BorradorDelPresupuesto,
  type Moneda,
} from '@maun/domain';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatosDelDocumento } from '@/shared/idioma-del-cliente';
import { SeccionesEnFilas } from '@/shared/ui';

import type { ValoresDelEditor } from '../model/valores';
import {
  FormaDePagoDelBorrador,
  ModificacionDelBorrador,
  MonedaDeLoAbonado,
  ValoresDelBorrador,
  type HuecosDelEditor,
} from './SeccionesDelBorrador';

const BORRADOR: BorradorDelPresupuesto = borradorNuevo({
  titulo: 'Placard',
  obra: '',
  plantilla: PLANTILLA_DE_SIEMPRE,
  validezDias: 15,
  idNuevo: () => 'm1',
});

const HUECOS: HuecosDelEditor = {
  valores: huecosDelPresupuesto(
    {
      plazoDeFabricacion: 30,
      plantilla: PLANTILLA_DE_SIEMPRE,
      modificacion: null,
      abonado: centavosEn('USD', 0),
      monedaDeLoAbonado: 'USD',
      senaBp: puntosBasicos(5_000),
    },
    formatosDelDocumento('es'),
  ),
  abonado: centavosEn('USD', 0),
};

const cambios = vi.fn<(siguiente: BorradorDelPresupuesto) => void>();

function ultimo(): BorradorDelPresupuesto | undefined {
  return cambios.mock.lastCall?.[0];
}

function ConElBorrador({
  children,
}: {
  children: (
    borrador: BorradorDelPresupuesto,
    alCambiar: (siguiente: BorradorDelPresupuesto) => void,
  ) => ReactNode;
}) {
  const [borrador, setBorrador] = useState(BORRADOR);
  return (
    <SeccionesEnFilas>
      {children(borrador, (siguiente) => {
        cambios(siguiente);
        setBorrador(siguiente);
      })}
    </SeccionesEnFilas>
  );
}

afterEach(() => {
  cleanup();
  cambios.mockClear();
});

function formaDePago(moneda: Moneda, cobraEn: readonly Moneda[] | null) {
  render(
    <ConElBorrador>
      {(borrador, alCambiar) => (
        <FormaDePagoDelBorrador
          borrador={borrador}
          alCambiar={alCambiar}
          plantilla={PLANTILLA_DE_SIEMPRE}
          huecos={HUECOS}
          moneda={moneda}
          cobraEn={cobraEn}
        />
      )}
    </ConElBorrador>,
  );
}

describe('la cláusula de la moneda en el borrador', () => {
  it('en un trabajo con dólares va la de su combinación, y retocada queda para este trabajo', () => {
    formaDePago('USD', null);
    const campo = screen.getByLabelText('Lo que dice de la moneda, para este trabajo');
    expect(campo).toHaveValue(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos);

    fireEvent.change(campo, { target: { value: 'Se paga en pesos al dólar MEP.' } });
    expect(ultimo()?.clausulaDeLaMoneda).toBe('Se paga en pesos al dólar MEP.');
    expect(
      screen.getByText('Retocada para este trabajo. La de siempre sigue igual en Ajustes.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Volver a la de siempre' }));
    expect(ultimo()?.clausulaDeLaMoneda).toBeNull();
    expect(campo).toHaveValue(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos);
  });

  it('en un trabajo en pesos que te paga en dólares también va, con la suya', () => {
    formaDePago('ARS', ['USD']);
    expect(screen.getByLabelText('Lo que dice de la moneda, para este trabajo')).toHaveValue(
      CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.pesosEnDolares,
    );
  });

  it('en un trabajo en pesos que te paga en pesos no hay cláusula', () => {
    formaDePago('ARS', null);
    expect(screen.queryByLabelText('Lo que dice de la moneda, para este trabajo')).toBeNull();
  });
});

describe('el valor de una modificación en el borrador', () => {
  it('arranca en el de la plantilla y se puede pasar a dólares', () => {
    render(
      <ConElBorrador>
        {(borrador, alCambiar) => (
          <ModificacionDelBorrador
            borrador={borrador}
            alCambiar={alCambiar}
            plantilla={PLANTILLA_DE_SIEMPRE}
          />
        )}
      </ConElBorrador>,
    );
    const campo = screen.getByLabelText('Valor de una modificación de más');
    expect(campo).toHaveValue('50.000');

    fireEvent.click(screen.getByRole('button', { name: 'Pasar a dólares' }));
    expect(ultimo()?.modificacion).toEqual({ importe: 5_000_000, moneda: 'USD' });
    fireEvent.change(campo, { target: { value: '40' } });
    expect(ultimo()?.modificacion).toEqual({ importe: 4_000, moneda: 'USD' });

    fireEvent.change(campo, { target: { value: '50.000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pasar a pesos' }));
    expect(ultimo()?.modificacion).toBeNull();
  });
});

describe('lo que ya pagó en un trabajo en dólares', () => {
  it('va en dólares de entrada y se puede pasar a pesos', () => {
    render(
      <ConElBorrador>
        {(borrador, alCambiar) => (
          <MonedaDeLoAbonado
            borrador={borrador}
            alCambiar={alCambiar}
            enDolares="US$ 82,76"
            enPesos="$ 120.000"
          />
        )}
      </ConElBorrador>,
    );
    const grupo = screen.getByRole('radiogroup', {
      name: 'Lo que ya pagó, en el aviso del relevamiento',
    });
    expect(within(grupo).getByRole('radio', { name: 'En dólares: US$ 82,76' })).toBeChecked();

    fireEvent.click(within(grupo).getByRole('radio', { name: 'En pesos: $ 120.000' }));
    expect(ultimo()?.monedaDeLoAbonado).toBe('ARS');
    expect(screen.getByText(/El PDF no lo resta de la seña en dólares/)).toBeInTheDocument();

    fireEvent.click(within(grupo).getByRole('radio', { name: 'En dólares: US$ 82,76' }));
    expect(ultimo()?.monedaDeLoAbonado).toBeNull();
  });
});

describe('los valores en dólares', () => {
  function Valores() {
    const [valores, setValores] = useState<ValoresDelEditor>({
      total: centavosEn('USD', 240_000),
      opciones: [],
    });
    return (
      <SeccionesEnFilas>
        <ValoresDelBorrador
          valores={valores}
          alCambiar={setValores}
          senaBp={puntosBasicos(5_000)}
          senaPropia={false}
          abonado={centavosEn('USD', 8_276)}
          moneda="USD"
        />
      </SeccionesEnFilas>
    );
  }

  it('el total, la seña y lo pagado van en dólares', () => {
    render(<Valores />);
    expect(screen.getByLabelText('Total del presupuesto')).toHaveValue('2.400');
    const seccion = screen.getByRole('region', { name: /Valores/ });
    expect(within(seccion).getByText('US$')).toBeInTheDocument();
    expect(within(seccion).getByText('US$ 1.200')).toBeInTheDocument();
    expect(within(seccion).getByText('US$ 82,76')).toBeInTheDocument();
    expect(within(seccion).getByText('US$ 1.117,24')).toBeInTheDocument();
    expect(within(seccion).queryByText(/^\$/)).toBeNull();
  });
});
