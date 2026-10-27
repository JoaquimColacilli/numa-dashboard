import {
  borradorNuevo,
  centavosEn,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  huecosDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  type BorradorDelPresupuesto,
  type FechasDelPresupuesto,
  type Moneda,
} from '@maun/domain';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatosDelDocumento } from '@/shared/idioma-del-cliente';
import { SeccionesEnFilas } from '@/shared/ui';

import type { ValoresDelEditor } from '../model/valores';
import {
  CasillasDelBorrador,
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
  faltaMedir: false,
  idNuevo: () => 'm1',
});

function huecos(fechas: FechasDelPresupuesto | null): HuecosDelEditor {
  return {
    valores: huecosDelPresupuesto(
      {
        plazoDeFabricacion: 30,
        plantilla: PLANTILLA_DE_SIEMPRE,
        modificacion: null,
        abonado: centavosEn('USD', 0),
        monedaDeLoAbonado: 'USD',
        senaBp: puntosBasicos(5_000),
        fechas,
        sena: null,
      },
      formatosDelDocumento('es'),
    ),
    abonado: centavosEn('USD', 0),
  };
}

const HUECOS = huecos({ listoPara: '2026-11-12', senaAntesDel: '2026-10-03' });

const ESTIMATIVO: BorradorDelPresupuesto = { ...BORRADOR, estimativo: true, pideFecha: true };

const cambios = vi.fn<(siguiente: BorradorDelPresupuesto) => void>();

function ultimo(): BorradorDelPresupuesto | undefined {
  return cambios.mock.lastCall?.[0];
}

function ConElBorrador({
  inicial = BORRADOR,
  children,
}: {
  inicial?: BorradorDelPresupuesto;
  children: (
    borrador: BorradorDelPresupuesto,
    alCambiar: (siguiente: BorradorDelPresupuesto) => void,
  ) => ReactNode;
}) {
  const [borrador, setBorrador] = useState(inicial);
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

function formaDePago(moneda: Moneda, cobraEn: readonly Moneda[] | null, inicial = BORRADOR) {
  render(
    <ConElBorrador inicial={inicial}>
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
  function Valores({ estimativo = false }: { estimativo?: boolean }) {
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
          estimativo={estimativo}
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

  it('en un estimativo no va la cuenta de la seña', () => {
    render(<Valores estimativo />);
    const seccion = screen.getByRole('region', { name: /Valores/ });
    expect(
      within(seccion).getByText('Un estimativo no pide seña: la pide el presupuesto.'),
    ).toBeInTheDocument();
    expect(within(seccion).queryByText('US$ 1.200')).toBeNull();
    expect(within(seccion).queryByText('US$ 1.117,24')).toBeNull();
  });
});

describe('un estimativo en el borrador', () => {
  function avisos(conHuecos: HuecosDelEditor, inicial = BORRADOR) {
    render(
      <ConElBorrador inicial={inicial}>
        {(borrador, alCambiar) => (
          <CasillasDelBorrador
            borrador={borrador}
            alCambiar={alCambiar}
            numero={5}
            grupo="avisos"
            clausulas={PLANTILLA_DE_SIEMPRE.avisos}
            huecos={conHuecos}
          />
        )}
      </ConElBorrador>,
    );
  }

  function elDelPlazo(): HTMLElement {
    return screen.getByRole('checkbox', { name: /^Debido a la agenda del taller/ });
  }

  it('no lleva la forma de pago', () => {
    formaDePago('ARS', null, ESTIMATIVO);
    expect(
      screen.getByText('Un estimativo no lleva la forma de pago: va en el presupuesto.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Forma de pago' })).toBeNull();

    cleanup();
    formaDePago('ARS', null);
    expect(screen.getByRole('radiogroup', { name: 'Forma de pago' })).toBeInTheDocument();
  });

  it('el aviso con las fechas no va: queda sin tildar y dice por qué', () => {
    avisos(huecos(null), ESTIMATIVO);
    expect(elDelPlazo()).toBeDisabled();
    expect(elDelPlazo()).not.toBeChecked();
    expect(
      screen.getByText('No va en un estimativo: la lleva el presupuesto, con sus fechas.'),
    ).toBeInTheDocument();
  });

  it('con las fechas, el aviso va tildado y dice la entrega y la seña', () => {
    avisos(HUECOS);
    expect(elDelPlazo()).toBeEnabled();
    expect(elDelPlazo()).toBeChecked();
    expect(elDelPlazo()).toHaveAccessibleName(
      /la fecha estimada de entrega es el 12 de noviembre de 2026\. A fin de poder confirmar estos plazos, se deberá concretar la seña acordada del 50% de la opción que elijas antes del 3 de octubre de 2026\./,
    );
    expect(
      screen.queryByText('No va en un estimativo: la lleva el presupuesto, con sus fechas.'),
    ).toBeNull();
  });
});
