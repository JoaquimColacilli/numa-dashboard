import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BarraDeDeshacer,
  BotonDeLaFila,
  CampoConUnidad,
  Casilla,
  DatoFijo,
  ESPERA_DEL_DESHACER_MS,
  TextoQueCrece,
} from './listas';

afterEach(() => {
  vi.useRealTimers();
});

describe('la casilla', () => {
  it('en el renglón es la caja sola, para ir adentro del label de quien la usa', () => {
    const alCambiar = vi.fn();
    render(
      <label>
        <Casilla tildada={false} alCambiar={alCambiar} />
        Sin mesada
      </label>,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sin mesada' }));
    expect(alCambiar).toHaveBeenCalledWith(true);
  });

  it('suelta tiene su zona de 44 px y su nombre', () => {
    const { container } = render(
      <Casilla forma="suelta" tildada etiqueta="Viene tildada: Sin mesada" alCambiar={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox', { name: 'Viene tildada: Sin mesada' })).toBeChecked();
    expect(container.querySelector('label')).toHaveClass('size-11');
  });

  it('con etiqueta la escribe al lado', () => {
    render(
      <Casilla forma="con-etiqueta" tildada={false} etiqueta="Viene tildada" alCambiar={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox', { name: 'Viene tildada' })).not.toHaveAttribute(
      'aria-label',
    );
  });

  it('la tilde se dibuja solo cuando el dedo recién tildó, no al montarse', () => {
    const { container, rerender } = render(<Casilla tildada alCambiar={vi.fn()} etiqueta="Va" />);
    expect(container.querySelector('svg')).not.toHaveAttribute('data-dibujar');
    rerender(<Casilla tildada={false} alCambiar={vi.fn()} etiqueta="Va" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Va' }));
    rerender(<Casilla tildada alCambiar={vi.fn()} etiqueta="Va" />);
    expect(container.querySelector('svg')).toHaveAttribute('data-dibujar');
  });

  it('deshabilitada no cambia', () => {
    render(<Casilla tildada={false} deshabilitada etiqueta="Seña" alCambiar={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Seña' })).toBeDisabled();
  });
});

describe('el texto que crece', () => {
  it('lleva una copia escondida que le da el alto', () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <TextoQueCrece aria-label="Descripción" valor={'Dos\nrenglones'} alCambiar={alCambiar} />,
    );
    const copia = container.querySelector('[aria-hidden]');
    expect(copia).toHaveTextContent('Dos renglones');
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), {
      target: { value: 'Otro' },
    });
    expect(alCambiar).toHaveBeenCalledWith('Otro');
  });
});

describe('el campo con su unidad', () => {
  it('solo deja números y dice la unidad', () => {
    const alCambiar = vi.fn();
    render(
      <CampoConUnidad
        id="dias"
        etiqueta="Cuántos días vale"
        unidad="días corridos"
        valor="15"
        alCambiar={alCambiar}
        ayuda="Vence el 18 de septiembre."
      />,
    );
    const campo = screen.getByRole('textbox', { name: 'Cuántos días vale' });
    expect(campo).toHaveAccessibleDescription('días corridos Vence el 18 de septiembre.');
    fireEvent.change(campo, { target: { value: '2a0' } });
    expect(alCambiar).toHaveBeenCalledWith('20');
  });
});

describe('el dato fijo', () => {
  it('es una clave y su valor', () => {
    render(
      <dl>
        <DatoFijo clave="Cliente" valor="Paula Benítez" nota="Sale de la ficha." />
      </dl>,
    );
    expect(screen.getByText('Cliente').tagName).toBe('DT');
    expect(screen.getByText('Paula Benítez')).toBeInTheDocument();
    expect(screen.getByText('Sale de la ficha.')).toBeInTheDocument();
  });
});

describe('el botón de la fila', () => {
  it('tiene 44 px, su nombre y pasa lo demás al botón', () => {
    const alTocar = vi.fn();
    render(
      <BotonDeLaFila icono="trash-2" etiqueta="Quitar Alacena" alTocar={alTocar} data-mover="x" />,
    );
    const boton = screen.getByRole('button', { name: 'Quitar Alacena' });
    expect(boton).toHaveClass('size-11');
    expect(boton).toHaveAttribute('data-mover', 'x');
    fireEvent.click(boton);
    expect(alTocar).toHaveBeenCalledOnce();
  });
});

describe('la barra de deshacer', () => {
  it('se vence sola a los siete segundos, y deshacer no espera', () => {
    vi.useFakeTimers();
    const alVencer = vi.fn();
    const alDeshacer = vi.fn();
    render(
      <BarraDeDeshacer texto="Quitaste Alacena." alDeshacer={alDeshacer} alVencer={alVencer} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Quitaste Alacena.');
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(alDeshacer).toHaveBeenCalledOnce();
    act(() => {
      vi.advanceTimersByTime(ESPERA_DEL_DESHACER_MS - 1);
    });
    expect(alVencer).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(alVencer).toHaveBeenCalledOnce();
  });
});
