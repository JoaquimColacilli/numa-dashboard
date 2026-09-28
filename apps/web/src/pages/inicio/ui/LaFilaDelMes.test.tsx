import {
  centavos,
  puntosBasicos,
  tipoDelPaso,
  type EstadoDelDiezmo,
  type FilaDelMes,
  type ParteDelMes,
  type PasoDelMes,
} from '@maun/domain';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';

import { LaFilaDelMes } from './LaFilaDelMes';
import { Metas } from './Metas';

function tesoro(
  id: string,
  clave: TesoroDelTaller['clave'],
  nombre: string,
  tinta: TesoroDelTaller['tinta'],
  extra: Partial<TesoroDelTaller> = {},
): TesoroDelTaller {
  return {
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: centavos(0),
    ...extra,
  };
}

const TESOROS = [
  tesoro('hogar', 'hogar', 'Hogar', 'hogar'),
  tesoro('maun', 'maun', 'Maun', 'maun'),
  tesoro('diezmo', 'diezmo', 'Diezmo', 'diezmo'),
  tesoro('cocos', 'cocos', 'Cocos', 'cocos', {
    saldo: centavos(341_500_000),
    meta: centavos(10_000_000_000),
  }),
  tesoro('iibb', null, 'Ingresos Brutos', 'petroleo'),
  tesoro('fijos', null, 'Gastos fijos', 'grana'),
  tesoro('materiales', null, 'Materiales', 'mostaza'),
  tesoro('inmuebles', null, 'Inmuebles', 'ciruela', {
    saldo: centavos(102_000_000),
    meta: centavos(2_000_000_000),
  }),
];

function paso(
  tesoroId: string,
  clase: PasoDelMes['clase'],
  objetivo: number,
  recibido: number,
  extra: Partial<PasoDelMes> = {},
): PasoDelMes {
  const falta = Math.max(0, objetivo - recibido);
  return {
    tesoro: tesoroId,
    clase,
    tipo: tipoDelPaso(clase),
    modo: 'mes',
    objetivo: centavos(objetivo),
    recibido: centavos(recibido),
    cubierto: centavos(0),
    lleva: centavos(recibido),
    falta: centavos(falta),
    completo: falta === 0,
    aPagar: null,
    vencimientos: [],
    meta: null,
    ...extra,
  };
}

function parte(tesoroId: string, porcentaje: number): ParteDelMes {
  return {
    tesoro: tesoroId,
    porcentaje: puntosBasicos(porcentaje),
    hastaLaMeta: false,
    recibido: centavos(0),
    meta: null,
  };
}

const SEPTIEMBRE: FilaDelMes = {
  mes: '2026-09',
  cobros: 2,
  ingreso: centavos(270_000_000),
  diezmo: centavos(27_000_000),
  apartado: centavos(36_450_000),
  obligaciones: [
    {
      tesoro: 'iibb',
      porcentaje: puntosBasicos(350),
      base: 'cobrado',
      diezmo: false,
      apartado: centavos(9_450_000),
      aPagar: centavos(9_450_000),
    },
    {
      tesoro: 'diezmo',
      porcentaje: puntosBasicos(1000),
      base: 'ingreso',
      diezmo: true,
      apartado: centavos(27_000_000),
      aPagar: centavos(0),
    },
  ],
  pasos: [
    paso('hogar', 'sueldo', 180_000_000, 180_000_000),
    paso('fijos', 'fijos', 90_000_000, 0, {
      modo: 'saldo',
      lleva: centavos(63_000_000),
      falta: centavos(27_000_000),
    }),
    paso('materiales', 'prioridad', 30_000_000, 0),
  ],
  reparto: [parte('cocos', 5000), parte('inmuebles', 3000)],
  superavit: { tesoro: 'maun', recibido: centavos(0) },
  enElTaller: centavos(0),
  repartoEmpezo: false,
};

function llano(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

afterEach(() => {
  cleanup();
});

function montar(delMes: FilaDelMes = SEPTIEMBRE) {
  render(
    <MemoryRouter>
      <LaFilaDelMes delMes={delMes} tesoros={TESOROS} hoy="2026-09-27" />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: 'La fila de septiembre' });
}

describe('La fila del mes en Inicio', () => {
  it('se ordena por tipo: obligaciones, compromisos y ahorros, numerados seguido', () => {
    const fila = montar();
    expect(llano(within(fila).getByText(/de ingreso en/).textContent)).toBe(
      '$ 2.700.000 de ingreso en 2 cobros',
    );

    const grupos = within(fila).getAllByRole('group');
    expect(grupos.map((grupo) => grupo.getAttribute('aria-label'))).toEqual([
      'Obligaciones',
      'Compromisos',
      'Ahorros',
    ]);
    expect(
      grupos.map((grupo) => within(grupo).getByRole('button').getAttribute('aria-label')),
    ).toEqual(['Qué son las obligaciones', 'Qué son los compromisos', 'Qué son los ahorros']);
    const renglones = (nombre: string) =>
      within(within(fila).getByRole('group', { name: nombre }))
        .getAllByRole('listitem')
        .map((renglon) => llano(renglon.textContent));

    expect(renglones('Obligaciones')).toEqual([
      '1Ingresos Brutos · 3,5% sobre lo que cobrás$ 94.500 apartadoA pagar $ 94.500',
      '2Diezmo · 10% sobre el ingreso$ 270.000 apartadoAl día',
    ]);
    expect(renglones('Compromisos')).toEqual([
      '3Hogar · sueldo$ 1.800.000 de $ 1.800.000Cubierto',
      '4Gastos fijos · se renueva al pagar$ 630.000 de $ 900.000Faltan $ 270.000',
    ]);
    expect(renglones('Ahorros')).toEqual(['5Materiales · por mes$ 0 de $ 300.000Espera su turno']);

    const barras = within(fila).getAllByRole('progressbar');
    expect(barras.map((barra) => barra.getAttribute('aria-label'))).toEqual([
      'Paso 3: Hogar',
      'Paso 4: Gastos fijos',
      'Paso 5: Materiales',
    ]);
    expect(barras.map((barra) => barra.getAttribute('aria-valuenow'))).toEqual(['100', '70', '0']);
    expect(
      barras.map((barra) => barra.querySelector<HTMLElement>('[data-dia-del-mes]')?.style.left),
    ).toEqual(['90%', '90%', '90%']);
    expect(
      within(fila)
        .getAllByRole('list')
        .map((lista) => lista.getAttribute('start')),
    ).toEqual(['1', '3', '5']);
  });

  it('un ahorro por trabajo no lleva barra: dice cuánto recibió en el mes', () => {
    const fila = montar({
      ...SEPTIEMBRE,
      pasos: [
        paso('materiales', 'prioridad', 10_000_000, 20_000_000, {
          modo: 'trabajo',
          lleva: centavos(0),
          falta: null,
        }),
      ],
    });
    expect(within(fila).queryByRole('progressbar')).toBeNull();
    expect(within(fila).queryByRole('group', { name: 'Compromisos' })).toBeNull();
    expect(llano(within(fila).getByRole('group', { name: 'Ahorros' }).textContent)).toContain(
      'Materiales · por trabajo$ 100.000 por cobroRecibió $ 200.000 este mes',
    );
  });

  it('lleva a la fila en Tesoros, explica qué es con sus palabras y dice cuándo se reparte lo que sobra', () => {
    const fila = montar();
    expect(within(fila).getByRole('link', { name: 'Ver la fila' })).toHaveAttribute(
      'href',
      '/tesoros',
    );
    expect(
      within(fila).getByRole('button', { name: 'Qué es la fila del mes' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Así va el mes: cada cobro aparta las obligaciones, llena los compromisos y los ahorros en este orden, y lo que sobra se reparte. La raya fina marca el día de hoy.',
      ),
    ).toBeInTheDocument();
    expect(llano(within(fila).getByText(/^Se reparte/).textContent)).toBe(
      'Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan $ 570.000. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
    expect(screen.queryByText(/Progreso|Sueldo del mes|de ganancia en|primero/)).toBeNull();
  });
});

describe('Las metas en Inicio', () => {
  it('una barra por cada tesoro con meta, y el diezmo pagado', () => {
    const diezmo = {
      situacion: 'debe',
      importe: centavos(27_000_000),
      generado: centavos(243_000_000),
      pagado: centavos(216_000_000),
    } as unknown as EstadoDelDiezmo;
    render(<Metas tesoros={TESOROS} diezmo={diezmo} tintaDelDiezmo="diezmo" />);

    const metas = screen.getByRole('region', { name: 'Metas' });
    const barras = within(metas).getAllByRole('progressbar');
    expect(barras.map((barra) => barra.getAttribute('aria-label'))).toEqual([
      'Cocos',
      'Inmuebles',
      'Diezmo pagado',
    ]);
    expect(barras.map((barra) => llano(barra.getAttribute('aria-valuetext')))).toEqual([
      '$ 3.415.000 de $ 100.000.000',
      '$ 1.020.000 de $ 20.000.000',
      '$ 2.160.000 de $ 2.430.000',
    ]);
    expect(barras[1]?.querySelector('.bg-ciruela')).not.toBeNull();
  });
});
