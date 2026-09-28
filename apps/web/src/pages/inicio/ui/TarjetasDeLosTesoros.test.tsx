import { centavos } from '@maun/domain';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import type { FraseDelDiezmo } from '@/entities/movimiento';
import type { TesoroDelTaller } from '@/entities/tesoro';

import { conLaMetaDeCocos } from '../model/tesoros';
import { TarjetasDeLosTesoros } from './TarjetasDeLosTesoros';

const FIJOS = '01900000-0000-7000-8000-000000000005';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000008';

function tesoro(
  id: string,
  clave: TesoroDelTaller['clave'],
  nombre: string,
  extra: Partial<TesoroDelTaller> = {},
): TesoroDelTaller {
  return {
    id,
    clave,
    nombre,
    descripcion: `Para qué es ${nombre}`,
    tinta: clave ?? 'grana',
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: centavos(100_000),
    ...extra,
  };
}

const LOS_CUATRO = [
  tesoro('h', 'hogar', 'Hogar', { descripcion: 'La plata de la familia' }),
  tesoro('m', 'maun', 'Maun'),
  tesoro('d', 'diezmo', 'Diezmo'),
  tesoro('c', 'cocos', 'Cocos', { saldo: centavos(341_500_000) }),
];

const LOS_OCHO = [
  ...LOS_CUATRO,
  tesoro(FIJOS, null, 'Gastos fijos', { descripcion: 'Alquiler, luz y el ayudante' }),
  tesoro('mat', null, 'Materiales', { tinta: 'mostaza' }),
  tesoro('inm', null, 'Inmuebles', { tinta: 'ciruela', meta: centavos(2_000_000_000) }),
  tesoro(HERRAMIENTAS, null, 'Herramientas', {
    tinta: 'petroleo',
    saldo: centavos(15_000_000),
    meta: centavos(90_000_000),
  }),
];

const DEBE: FraseDelDiezmo = {
  antes: 'Debés',
  importe: '$ 270.000',
  despues: '',
  frase: 'Debés $ 270.000',
  detalle: 'de lo que ya cobraste y todavía no diste',
};

function DondeEsta() {
  const { pathname, search } = useLocation();
  return <output data-testid="donde">{`${pathname}${search}`}</output>;
}

function montar(tesoros: readonly TesoroDelTaller[]) {
  render(
    <MemoryRouter>
      <TarjetasDeLosTesoros tesoros={tesoros} diezmo={DEBE} />
      <DondeEsta />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: 'Tesoros' });
}

afterEach(() => {
  cleanup();
});

describe('las tarjetas de los tesoros en Inicio', () => {
  it('con los cuatro de siempre van en una fila, como siempre', () => {
    const tablero = montar(LOS_CUATRO);

    expect(tablero).toHaveClass('grid-cols-2', '@min-[54rem]/tablero:grid-flow-col');
    expect(tablero.style.getPropertyValue('--tarjeta-minima')).toBe('');
    expect(
      within(tablero)
        .getAllByRole('button')
        .map((boton) => boton.textContent),
    ).toEqual([
      expect.stringMatching(/^Hogar/),
      expect.stringMatching(/^Maun/),
      expect.stringMatching(/^Diezmo/),
      expect.stringMatching(/^Cocos/),
    ]);
  });

  it('con más tesoros, cada uno lleva su tarjeta y el tablero reparte las columnas por el ancho', () => {
    const tablero = montar(LOS_OCHO);

    expect(tablero).toHaveClass(
      'grid-cols-2',
      '@min-[1px]/tablero:grid-cols-[repeat(auto-fit,minmax(min(var(--tarjeta-minima),100%),1fr))]',
    );
    expect(tablero.style.getPropertyValue('--tarjeta-minima')).toBe('13.25rem');
    expect(tablero.className).not.toMatch(/(^|\s)(md|lg|xl):grid-cols/);
    const tarjetas = within(tablero).getAllByRole('button');
    expect(tarjetas).toHaveLength(8);
    expect(tarjetas.map((tarjeta) => tarjeta.parentElement)).toEqual(tarjetas.map(() => tablero));
  });

  it('cada tarjeta ocupa tres filas del tablero, así los montos de una fila quedan a la misma altura', () => {
    const tablero = montar(LOS_OCHO);
    for (const tarjeta of within(tablero).getAllByRole('button')) {
      expect(tarjeta).toHaveClass('row-span-3', 'grid-rows-subgrid');
    }
    const materiales = within(tablero).getByRole('button', { name: /^Materiales/ });
    const detalle = within(materiales).getByTitle(/.+/);
    expect(detalle).toHaveClass('line-clamp-1');
    expect(detalle).toHaveTextContent(detalle.title);
    const diezmo = within(tablero).getByRole('button', { name: /^Diezmo/ });
    expect(diezmo.querySelector('.line-clamp-1')).toBeNull();
  });

  it('el diezmo dice su deuda, las que tienen meta cuánto llevan y las demás para qué son', () => {
    const tablero = montar(LOS_OCHO);
    const tarjeta = (nombre: string) =>
      within(tablero).getByRole('button', { name: new RegExp(`^${nombre}`) });

    expect(tarjeta('Diezmo')).toHaveTextContent('Debés');
    expect(tarjeta('Diezmo')).toHaveTextContent('de lo que ya cobraste y todavía no diste');
    expect(tarjeta('Herramientas')).toHaveTextContent('16% de la meta');
    expect(tarjeta('Inmuebles')).toHaveTextContent('0% de la meta');
    expect(tarjeta('Gastos fijos')).toHaveTextContent('Alquiler, luz y el ayudante');
    expect(tarjeta('Hogar')).toHaveTextContent('La plata de la familia');
    expect(tarjeta('Herramientas').querySelector('span[aria-hidden].bg-petroleo')).not.toBeNull();
  });

  it('la meta de Cocos sale de los ajustes aunque los tesoros todavía no hayan llegado', () => {
    const conMeta = conLaMetaDeCocos(LOS_CUATRO, centavos(10_000_000_000));
    const tablero = montar(conMeta);

    expect(within(tablero).getByRole('button', { name: /^Cocos/ })).toHaveTextContent(
      '3% de la meta',
    );
    expect(conLaMetaDeCocos(LOS_CUATRO, centavos(0))).toEqual(LOS_CUATRO);
  });

  it('una tarjeta en negativo lo dice y no lleva canto', () => {
    const tablero = montar([
      ...LOS_CUATRO,
      tesoro(FIJOS, null, 'Gastos fijos', { saldo: centavos(-5_000_000) }),
    ]);
    const fijos = within(tablero).getByRole('button', { name: /^Gastos fijos/ });

    expect(fijos).toHaveTextContent('en negativo');
    expect(fijos).toHaveTextContent('gastó más de lo que entró');
    expect(fijos.querySelector('span[aria-hidden].bg-grana')).toBeNull();
  });

  it('cada una lleva a Finanzas filtrada por ese tesoro, y el diezmo a su pantalla', () => {
    const tablero = montar(LOS_OCHO);
    const donde = screen.getByTestId('donde');

    fireEvent.click(within(tablero).getByRole('button', { name: /^Cocos/ }));
    expect(donde).toHaveTextContent('/finanzas?tesoro=cocos');

    fireEvent.click(within(tablero).getByRole('button', { name: /^Herramientas/ }));
    expect(donde).toHaveTextContent(`/finanzas?tesoro=${HERRAMIENTAS}`);

    fireEvent.click(within(tablero).getByRole('button', { name: /^Diezmo/ }));
    expect(donde).toHaveTextContent('/diezmo');
  });
});
