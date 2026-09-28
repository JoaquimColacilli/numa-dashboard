import { centavos, type EventoPropio, type EventoVencimiento } from '@maun/domain';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FilaDeEvento, type AccionesDeLaAgenda } from './FilaDeEvento';
import { useAccionesConFoco } from './useAccionesConFoco';

afterEach(() => {
  cleanup();
});

function anotacion(id: string, texto: string, hecha: boolean): EventoPropio {
  return {
    clase: 'propia',
    id,
    categoria: 'taller',
    fecha: '2026-09-25',
    hora: null,
    texto,
    proyectoId: null,
    proyecto: null,
    hecha,
    importante: false,
  };
}

function terminarLaAnimacion(elemento: Element): void {
  fireEvent.animationEnd(elemento);
  fireEvent(elemento, new Event('webkitAnimationEnd', { bubbles: true }));
}

function ElDia({ inicial }: { inicial: EventoPropio[] }) {
  const [eventos, setEventos] = useState(inicial);
  const { raiz, acciones } = useAccionesConFoco<HTMLDivElement>({
    alAbrirTrabajo: vi.fn(),
    alMarcar: vi.fn(),
    alBorrar: vi.fn(),
    alTildar: (tildado) => {
      setEventos((previos) =>
        previos.map((evento) =>
          evento.id === tildado.id ? { ...evento, hecha: !evento.hecha } : evento,
        ),
      );
    },
  });
  const fila = (evento: EventoPropio) => (
    <FilaDeEvento key={evento.id} evento={evento} hoy="2026-09-25" acciones={acciones} enElDia />
  );
  return (
    <div ref={raiz}>
      <ul aria-label="Pendiente">{eventos.filter((evento) => !evento.hecha).map(fila)}</ul>
      <ul aria-label="Hecho">{eventos.filter((evento) => evento.hecha).map(fila)}</ul>
    </div>
  );
}

function renglon(lista: string, texto: string): HTMLElement {
  const fila = within(screen.getByRole('list', { name: lista }))
    .getByRole('checkbox', { name: texto })
    .closest('li');
  if (fila === null) throw new Error(`no está el renglón de ${texto}`);
  return fila;
}

describe('tildar en la agenda', () => {
  it('lo que ya estaba hecho al abrir el día se ve hecho, sin dibujarse', () => {
    render(<ElDia inicial={[anotacion('a', 'Pasar por el corralón', true)]} />);
    const fila = renglon('Hecho', 'Pasar por el corralón');
    expect(fila.querySelector('svg.tilde')).not.toHaveAttribute('data-dibujar');
    expect(fila.querySelector('.tachado-que-corre')).toBeNull();
  });

  it('lo recién tildado dibuja la tilde y la línea, aunque el renglón cambie de lista', () => {
    render(
      <ElDia
        inicial={[
          anotacion('a', 'Lijar la puerta', false),
          anotacion('b', 'Pasar por el corralón', true),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lijar la puerta' }));

    const fila = renglon('Hecho', 'Lijar la puerta');
    expect(within(fila).getByRole('checkbox')).toHaveFocus();
    expect(fila.querySelector('svg.tilde')).toHaveAttribute('data-dibujar');
    const linea = fila.querySelector('.tachado-que-corre');
    expect(linea).toHaveAttribute('aria-hidden', 'true');
    expect(linea?.parentElement).toHaveClass('line-through', 'decoration-transparent');

    const otra = renglon('Hecho', 'Pasar por el corralón');
    expect(otra.querySelector('svg.tilde')).not.toHaveAttribute('data-dibujar');
    expect(otra.querySelector('.tachado-que-corre')).toBeNull();

    if (linea) terminarLaAnimacion(linea);
    expect(fila.querySelector('.tachado-que-corre')).toBeNull();
    expect(fila.querySelector('svg.tilde')).not.toHaveAttribute('data-dibujar');
    expect(within(fila).getByText('Lijar la puerta')).toHaveClass('line-through');
    expect(within(fila).getByText('Lijar la puerta')).not.toHaveClass('decoration-transparent');
  });

  it('al destildar, todo vuelve en el acto', () => {
    render(<ElDia inicial={[anotacion('a', 'Lijar la puerta', false)]} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lijar la puerta' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lijar la puerta' }));
    const fila = renglon('Pendiente', 'Lijar la puerta');
    expect(fila.querySelector('svg.tilde')).toBeNull();
    expect(fila.querySelector('.tachado-que-corre')).toBeNull();
    expect(within(fila).getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });
});

const ALQUILER: EventoVencimiento = {
  clase: 'vencimiento',
  id: 'vencimiento:fijos:0:2026-09-10',
  categoria: 'vencimiento',
  fecha: '2026-09-10',
  hora: null,
  tesoro: 'fijos',
  nombreDelTesoro: 'Gastos fijos',
  renglon: 'Alquiler',
  monto: centavos(27_000_000),
  hecha: false,
  importante: false,
};

function accionesDelVencimiento() {
  const alRegistrarElPago = vi.fn();
  const alAbrirVencimiento = vi.fn();
  const alMarcar = vi.fn();
  const basicas: AccionesDeLaAgenda = {
    alAbrirTrabajo: vi.fn(),
    alTildar: vi.fn(),
    alMarcar,
    alBorrar: vi.fn(),
  };
  return {
    basicas,
    acciones: { ...basicas, alRegistrarElPago, alAbrirVencimiento },
    alRegistrarElPago,
    alAbrirVencimiento,
    alMarcar,
  };
}

describe('un vencimiento en la agenda', () => {
  it('en el día dice de dónde sale y ofrece registrar el pago, sin casilla ni marca', () => {
    const { acciones, alRegistrarElPago, alAbrirVencimiento, alMarcar } = accionesDelVencimiento();
    render(
      <ul>
        <FilaDeEvento evento={ALQUILER} hoy="2026-09-08" acciones={acciones} enElDia />
      </ul>,
    );
    const fila = screen.getByRole('listitem');
    expect(fila).toHaveAttribute('data-vencimiento', ALQUILER.id);
    expect(within(fila).getByText('Vence')).toBeInTheDocument();
    expect(within(fila).getByText('Alquiler')).toBeInTheDocument();
    expect(within(fila).getByText(/de Gastos fijos/)).toBeInTheDocument();
    expect(
      within(fila).getByText('Sale del día de pago de un compromiso de la fila.'),
    ).toBeInTheDocument();
    expect(within(fila).queryByRole('checkbox')).toBeNull();

    fireEvent.click(within(fila).getByRole('button', { name: 'Registrar el pago' }));
    expect(alRegistrarElPago).toHaveBeenCalledWith(ALQUILER);
    fireEvent.click(within(fila).getByRole('button', { name: 'Ver en Tesoros' }));
    expect(alAbrirVencimiento).toHaveBeenCalledWith(ALQUILER);
    expect(alMarcar).not.toHaveBeenCalled();
  });

  it('en la lista, tocarlo lo abre; sin a dónde ir, abre el día', () => {
    const { acciones, alAbrirVencimiento, basicas } = accionesDelVencimiento();
    render(
      <ul>
        <FilaDeEvento evento={ALQUILER} hoy="2026-09-08" acciones={acciones} />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Alquiler/ }));
    expect(alAbrirVencimiento).toHaveBeenCalledWith(ALQUILER);
    cleanup();

    const alAbrirElDia = vi.fn();
    render(
      <ul>
        <FilaDeEvento
          evento={ALQUILER}
          hoy="2026-09-08"
          acciones={basicas}
          alAbrirElDia={alAbrirElDia}
        />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Alquiler/ }));
    expect(alAbrirElDia).toHaveBeenCalledWith('2026-09-10');
  });

  it('pagado, se ve hecho, dice «Pagado» y no ofrece registrar el pago', () => {
    const { acciones } = accionesDelVencimiento();
    render(
      <ul>
        <FilaDeEvento
          evento={{ ...ALQUILER, hecha: true }}
          hoy="2026-09-12"
          acciones={acciones}
          enElDia
        />
      </ul>,
    );
    expect(screen.getByText(', pagado')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Registrar el pago' })).toBeNull();
    cleanup();

    render(
      <ul>
        <FilaDeEvento evento={{ ...ALQUILER, hecha: true }} hoy="2026-09-12" acciones={acciones} />
      </ul>,
    );
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar el pago' })).toBeNull();
  });

  it('en la lista, el que no se pagó lleva «Registrar el pago» al lado del renglón', () => {
    const { acciones, alRegistrarElPago, alAbrirVencimiento } = accionesDelVencimiento();
    render(
      <ul>
        <FilaDeEvento evento={ALQUILER} hoy="2026-09-28" acciones={acciones} />
      </ul>,
    );
    expect(screen.getByText('venció hace 18 días')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar el pago' }));
    expect(alRegistrarElPago).toHaveBeenCalledWith(ALQUILER);
    expect(alAbrirVencimiento).not.toHaveBeenCalled();
  });

  it('uno de un mes que todavía no llegó no se registra: dice desde cuándo', () => {
    const { acciones } = accionesDelVencimiento();
    render(
      <ul>
        <FilaDeEvento evento={ALQUILER} hoy="2026-08-28" acciones={acciones} enElDia />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: 'Registrar el pago' })).toBeNull();
    expect(
      screen.getByText(
        'Sale del día de pago de un compromiso de la fila. El pago se registra desde el mes en que vence.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver en Tesoros' })).toBeInTheDocument();
  });
});
