import {
  centavos,
  puntosBasicos,
  type EstadoDelDiezmo,
  type FilaDelMes,
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
): PasoDelMes {
  const falta = Math.max(0, objetivo - recibido);
  return {
    tesoro: tesoroId,
    clase,
    objetivo: centavos(objetivo),
    recibido: centavos(recibido),
    cubierto: centavos(0),
    falta: centavos(falta),
    completo: falta === 0,
  };
}

const SEPTIEMBRE: FilaDelMes = {
  mes: '2026-09',
  cobros: 2,
  ganancia: centavos(270_000_000),
  diezmo: centavos(27_000_000),
  pasos: [
    paso('materiales', 'prioridad', 30_000_000, 0),
    paso('hogar', 'sueldo', 180_000_000, 180_000_000),
    paso('fijos', 'fijos', 90_000_000, 63_000_000),
  ],
  reparto: [
    { tesoro: 'cocos', porcentaje: puntosBasicos(5000), recibido: centavos(0) },
    { tesoro: 'inmuebles', porcentaje: puntosBasicos(3000), recibido: centavos(0) },
  ],
  enElTaller: centavos(0),
  repartoEmpezo: false,
};

function llano(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

afterEach(() => {
  cleanup();
});

describe('La fila del mes en Inicio', () => {
  it('sigue el orden de la fila, con el diezmo primero, y cada paso dice cuánto lleva y cómo está', () => {
    render(
      <MemoryRouter>
        <LaFilaDelMes delMes={SEPTIEMBRE} tesoros={TESOROS} diezmo="diezmo" hoy="2026-09-27" />
      </MemoryRouter>,
    );

    const fila = screen.getByRole('region', { name: 'La fila de septiembre' });
    expect(llano(within(fila).getByText(/de ganancia en/).textContent)).toBe(
      '$ 2.700.000 de ganancia en 2 cobros',
    );
    const renglones = within(within(fila).getByRole('list')).getAllByRole('listitem');
    expect(renglones.map((renglon) => llano(renglon.textContent))).toEqual([
      'Diezmo · primero$ 270.000 apartado',
      '1Materiales · prioridad$ 0 de $ 300.000Espera su turno',
      '2Hogar · sueldo$ 1.800.000 de $ 1.800.000Cubierto',
      '3Gastos fijos$ 630.000 de $ 900.000Faltan $ 270.000',
    ]);

    const barras = within(fila).getAllByRole('progressbar');
    expect(barras.map((barra) => barra.getAttribute('aria-label'))).toEqual([
      'Paso 1: Materiales',
      'Paso 2: Hogar',
      'Paso 3: Gastos fijos',
    ]);
    expect(barras.map((barra) => barra.getAttribute('aria-valuenow'))).toEqual(['0', '100', '70']);
    expect(
      barras.map((barra) => barra.querySelector<HTMLElement>('[data-dia-del-mes]')?.style.left),
    ).toEqual(['90%', '90%', '90%']);
  });

  it('lleva a la fila en Tesoros, explica qué es y dice cuándo se reparte lo que sobra', () => {
    render(
      <MemoryRouter>
        <LaFilaDelMes delMes={SEPTIEMBRE} tesoros={TESOROS} diezmo="diezmo" hoy="2026-09-27" />
      </MemoryRouter>,
    );

    const fila = screen.getByRole('region', { name: 'La fila de septiembre' });
    expect(within(fila).getByRole('link', { name: 'Ver la fila' })).toHaveAttribute(
      'href',
      '/tesoros',
    );
    expect(
      within(fila).getByRole('button', { name: 'Qué es la fila del mes' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Así va el mes: cada cobro llena los topes en este orden y lo que sobra se reparte. La raya fina marca el día de hoy.',
      ),
    ).toBeInTheDocument();
    expect(llano(within(fila).getByText(/^Se reparte/).textContent)).toBe(
      'Se reparte cuando se llenan los topes: faltan $ 570.000. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
    expect(screen.queryByText(/Progreso|Sueldo del mes/)).toBeNull();
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
