import { HITOS_DEL_CAMINO } from '@maun/domain';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MENSAJES_DEL_CLIENTE_EN_CASTELLANO } from '@/shared/idioma-del-cliente';

import { AyudaDeLaVista } from './AyudaDeLaVista';

const {
  hitos,
  listoParaEntregar: LISTO_PARA_ENTREGAR,
  nota: NOTA_DEL_RELEVAMIENTO,
  relevamientoTecnico: RELEVAMIENTO_TECNICO,
  titularListo: TITULAR_LISTO,
} = MENSAJES_DEL_CLIENTE_EN_CASTELLANO.vista.delDominio;

const HITO_DEL_ESTIMATIVO = hitos.estimativo;

const HITOS = HITOS_DEL_CAMINO.map((id) => hitos[id]);

function abrir(): void {
  render(<AyudaDeLaVista />);
  fireEvent.click(screen.getByRole('button', { name: 'Cómo lo ve tu cliente' }));
}

function tocar(nombre: string): void {
  fireEvent.click(screen.getByRole('button', { name: nombre }));
}

describe('la ayuda de la vista del cliente', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('abre el modal en la primera lámina', () => {
    abrir();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('El enlace y la pantalla');
    expect(screen.getByText('1 de 9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeDisabled();
  });

  it('avanza y vuelve con los dos botones', () => {
    abrir();

    tocar('Siguiente');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Antes del presupuesto');

    tocar('Siguiente');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'El presupuesto y la aprobación',
    );

    tocar('Atrás');
    tocar('Atrás');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('El enlace y la pantalla');
  });

  it('explica cada paso y la nota con el mismo nombre que le muestra la pantalla al cliente', () => {
    abrir();

    const leido = screen.getByRole('dialog').textContent;
    for (const hito of [HITO_DEL_ESTIMATIVO, ...HITOS]) {
      expect(leido).toContain(hito.etiqueta);
    }
    expect(leido).toContain(NOTA_DEL_RELEVAMIENTO.pendiente.titulo);
  });

  it('cuenta el relevamiento técnico que lee mientras falta ir a medir, y dónde se cambia el valor', () => {
    abrir();
    tocar('Siguiente');

    const leido = screen.getByRole('dialog').textContent;
    expect(screen.getByText(RELEVAMIENTO_TECNICO)).toBeInTheDocument();
    expect(leido).toContain('en Ajustes, en «Tu taller»');
    expect(leido).toContain('lee qué es pero no el precio');
    expect(leido).not.toContain('lo próximo es ir a medir');
  });

  it('cuenta cómo se coordina la entrega cuando el mueble está listo', () => {
    abrir();

    const leido = screen.getByRole('dialog').textContent;
    expect(leido).toContain(TITULAR_LISTO);
    expect(leido).toContain(LISTO_PARA_ENTREGAR);
    expect(leido).toContain('«Me queda bien»');
    expect(leido).toContain('«No puedo ese día»');
    expect(leido).toContain('«Fecha estimada de entrega»');
    expect(leido).not.toContain('pautada');
  });

  it('cuenta el presupuesto que le mandás, y que las opciones que no eligió desaparecen al aprobar', () => {
    abrir();
    tocar('Siguiente');
    tocar('Siguiente');
    tocar('Siguiente');

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'El presupuesto que le mandás',
    );
    const leido = screen.getByRole('dialog').textContent;
    expect(leido).toContain('lo puede bajar en PDF');
    expect(leido).toContain('deja de pedirle la seña');
    expect(leido).toContain('por fuera de la app');
    expect(leido).toContain('las que no eligió desaparecen');
    expect(leido).not.toContain('ni las opciones que no te aprobó');
  });

  it('deja ver una lámina por vez', () => {
    abrir();

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    tocar('Siguiente');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('la última lámina cierra el modal', () => {
    abrir();

    while (screen.queryByRole('button', { name: 'Siguiente' }) !== null) {
      tocar('Siguiente');
    }
    tocar('Listo');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
