import {
  centavos,
  enPesos,
  filaDeSiempre,
  plata,
  puntosBasicos,
  type Fila,
  type Money,
} from '@maun/domain';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import type { FraseDelDiezmo } from '@/entities/movimiento';
import type { TesoroDelTaller } from '@/entities/tesoro';

import { conLaMetaDeCocos, tipoEnLaTarjeta, tiposEnLasTarjetas } from '../model/tesoros';
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
    moneda: 'ARS',
    nombre,
    descripcion: `Para qué es ${nombre}`,
    tinta: clave ?? 'grana',
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(centavos(100_000)),
    ...extra,
  };
}

const LOS_CUATRO = [
  tesoro('h', 'hogar', 'Hogar', { descripcion: 'La plata de la familia' }),
  tesoro('m', 'maun', 'Maun'),
  tesoro('d', 'diezmo', 'Diezmo'),
  tesoro('c', 'cocos', 'Cocos', { saldo: enPesos(centavos(341_500_000)) }),
];

const LOS_OCHO = [
  ...LOS_CUATRO,
  tesoro(FIJOS, null, 'Gastos fijos', { descripcion: 'Alquiler, luz y el ayudante' }),
  tesoro('mat', null, 'Materiales', { tinta: 'mostaza' }),
  tesoro('inm', null, 'Inmuebles', { tinta: 'ciruela', meta: enPesos(centavos(2_000_000_000)) }),
  tesoro(HERRAMIENTAS, null, 'Herramientas', {
    tinta: 'petroleo',
    saldo: enPesos(centavos(15_000_000)),
    meta: enPesos(centavos(90_000_000)),
  }),
];

const DEBE: FraseDelDiezmo = {
  situacion: 'debe',
  titulo: 'Debés',
  importe: '$ 270.000',
  frase: 'Debés $ 270.000',
  detalle: 'de lo que ya cobraste y todavía no diste',
};

function DondeEsta() {
  const { pathname, search } = useLocation();
  return <output data-testid="donde">{`${pathname}${search}`}</output>;
}

function montar(
  tesoros: readonly TesoroDelTaller[],
  tipos?: ReadonlyMap<string, string>,
  insumos?: Money,
) {
  render(
    <MemoryRouter>
      <TarjetasDeLosTesoros tesoros={tesoros} diezmo={DEBE} tipos={tipos} insumos={insumos} />
      <DondeEsta />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: 'Tesoros' });
}

const FILA_DE_TIPOS: Fila = {
  obligaciones: [{ tesoro: 'd', porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: 'h',
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(90_000_000), dia: 10 }],
      desde: null,
      modo: 'saldo',
      hastaLaMeta: false,
    },
    {
      tesoro: 'mat',
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: 'c', porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: 'm',
  sueldoPorTrabajo: false,
};

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

  it('la tarjeta de un tesoro en dólares va en dólares, con su meta en dólares', () => {
    const tablero = montar([
      ...LOS_CUATRO,
      tesoro('usd', null, 'Dólares', {
        moneda: 'USD',
        saldo: plata('USD', 125_000),
        meta: plata('USD', 500_000),
      }),
    ]);
    const dolares = within(tablero).getByRole('button', { name: /^Dólares/ });
    expect(dolares.textContent.replace(/\s+/g, ' ')).toContain('US$ 1.250');
    expect(dolares).toHaveTextContent('25% de la meta');
  });

  it('una tarjeta en negativo lo dice y no lleva canto', () => {
    const tablero = montar([
      ...LOS_CUATRO,
      tesoro(FIJOS, null, 'Gastos fijos', { saldo: enPesos(centavos(-5_000_000)) }),
    ]);
    const fijos = within(tablero).getByRole('button', { name: /^Gastos fijos/ });

    expect(fijos).toHaveTextContent('en negativo');
    expect(fijos).toHaveTextContent('gastó más de lo que entró');
    expect(fijos.querySelector('span[aria-hidden].bg-grana')).toBeNull();
  });

  it('cada tarjeta dice el tipo de su tesoro en la fila; lo del estante no lleva tipo', () => {
    const tipos = tiposEnLasTarjetas(FILA_DE_TIPOS, LOS_OCHO);
    const tablero = montar(LOS_OCHO, tipos);
    const tipoDe = (nombre: string) =>
      within(tablero)
        .getByRole('button', { name: new RegExp(`^${nombre}`) })
        .querySelector('[data-tipo-del-tesoro]')?.textContent ?? null;

    expect(tipoDe('Diezmo')).toBe('Obligación');
    expect(tipoDe('Hogar')).toBe('Compromiso');
    expect(tipoDe('Gastos fijos')).toBe('Compromiso');
    expect(tipoDe('Materiales')).toBe('Ahorro');
    expect(tipoDe('Cocos')).toBe('Ahorro');
    expect(tipoDe('Maun')).toBe('Superávit');
    expect(tipoDe('Inmuebles')).toBeNull();
    expect(tipoDe('Herramientas')).toBeNull();
  });

  it('Maun en la fila de siempre es compromiso y superávit a la vez', () => {
    const deSiempre = filaDeSiempre(
      {
        sueldoMensual: centavos(180_000_000),
        costosFijos: centavos(90_000_000),
        sueldoTopeMensual: true,
      },
      { hogar: 'h', maun: 'm', diezmo: 'd' },
    );
    expect(tipoEnLaTarjeta(deSiempre, 'm')).toBe('Compromiso y superávit');
    expect(tipoEnLaTarjeta(deSiempre, 'h')).toBe('Compromiso');
    expect(tipoEnLaTarjeta(deSiempre, 'c')).toBeNull();
  });

  it('la de Maun dice cuánto de su saldo son insumos, si no le alcanza, o cuánto puso en los trabajos', () => {
    const conSaldo = LOS_CUATRO.map((uno) =>
      uno.clave === 'maun' ? { ...uno, saldo: enPesos(centavos(124_800_000)) } : uno,
    );
    const tablero = montar(conSaldo, undefined, centavos(60_000_000));
    const maun = within(tablero).getByRole('button', { name: /^Maun/ });
    expect(maun.textContent.replace(/\s+/g, ' ')).toContain('$ 600.000 son insumos');
    expect(within(tablero).getByRole('button', { name: /^Hogar/ })).toHaveTextContent(
      'La plata de la familia',
    );
    cleanup();

    const corto = montar(LOS_CUATRO, undefined, centavos(60_000_000));
    expect(
      within(corto).getByRole('button', { name: /^Maun/ }).textContent.replace(/\s+/g, ' '),
    ).toContain('no alcanza para $ 600.000 de insumos');
    cleanup();

    const otro = montar(LOS_CUATRO, undefined, centavos(-15_000_000));
    expect(
      within(otro).getByRole('button', { name: /^Maun/ }).textContent.replace(/\s+/g, ' '),
    ).toContain('puso $ 150.000 en los trabajos');
    cleanup();

    const sinInsumos = montar(LOS_CUATRO, undefined, centavos(0));
    expect(within(sinInsumos).getByRole('button', { name: /^Maun/ })).toHaveTextContent(
      'Para qué es Maun',
    );
  });

  it('el saldo sigue siendo el primer monto de la tarjeta, antes que los insumos', () => {
    const tablero = montar(LOS_CUATRO, new Map([['m', 'Superávit']]), centavos(60_000_000));
    const texto = within(tablero).getByRole('button', { name: /^Maun/ }).textContent;
    expect(/\$\s?([\d.]+)/.exec(texto)?.[1]).toBe('1.000');
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
