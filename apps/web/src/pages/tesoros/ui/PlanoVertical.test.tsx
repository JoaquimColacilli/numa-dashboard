import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  borradorDeLaFila,
  descartarElBorrador,
  empezarElBorrador,
  probarLaFila,
  vistaDeLaFila,
} from '@/features/armar-la-fila';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { PlanoVertical } from './PlanoVertical';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const HOY = '2026-09-27';

const GUARDADA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [
        { nombre: 'Alquiler del galpón', monto: centavos(50_000_000), dia: null },
        { nombre: 'Luz y gas', monto: centavos(6_000_000), dia: null },
        { nombre: 'Ayudante', monto: centavos(34_000_000), dia: null },
      ],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function tesoro(id: string, clave: string | null, nombre: string, tinta: string) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: nombre === 'Herramientas' ? 'Para la sierra nueva' : '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller MAUN' } };
  tablas.ajustes = {
    a: {
      id: 'a',
      household_id: 'h',
      sueldo_mensual_centavos: 180_000_000,
      costos_fijos_centavos: 0,
      sueldo_tope_mensual: true,
      perdido_con_sueldo: false,
      perdido_con_diezmo: true,
      meta_cocos_centavos: 0,
      tasa_cocos_anual_bp: 0,
      fila: GUARDADA,
      fila_version: 4,
      fila_guardada_at: '2026-09-01T12:00:00Z',
    },
  };
  const tesoros = [
    tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
    tesoro(MAUN, 'maun', 'Maun', 'maun'),
    tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
    tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
    tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
    tesoro(MATERIALES, null, 'Materiales', 'mostaza'),
    tesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar({ monto }: { monto?: number } = {}) {
  const replica = replicaDelTaller();
  const vista = vistaDeLaFila(replica, borradorDeLaFila(), HOY);
  const resultado =
    monto === undefined
      ? null
      : probarLaFila(
          replica,
          vista.fila,
          { monto: centavos(monto), cobrado: null, enCero: false },
          HOY,
        );
  const alTocar = vi.fn();
  const alSumar = vi.fn();
  const alNuevo = vi.fn();
  render(
    <PlanoVertical
      vista={vista}
      resultado={resultado}
      elegido={null}
      alTocar={alTocar}
      alSumar={alSumar}
      alNuevo={alNuevo}
    />,
  );
  return { alTocar, alSumar, alNuevo };
}

afterEach(() => {
  descartarElBorrador();
});

function fichasDe(region: HTMLElement): (string | null)[] {
  return within(region)
    .getAllByRole('button')
    .filter((boton) => boton.hasAttribute('aria-roledescription'))
    .map((ficha) => ficha.getAttribute('aria-label'));
}

describe('el plano vertical del celular', () => {
  it('muestra los grupos con el nombre de su tipo, el reparto, el superávit y el estante, y cada ficha se toca', () => {
    const { alTocar, alNuevo } = montar();
    const fila = screen.getByRole('region', { name: 'La fila' });
    const fichas = fichasDe(fila);
    expect(fichas[0]).toMatch(/^Obligación 1 de 4: Diezmo, 10% sobre el ingreso/);
    expect(fichas[1]).toMatch(/^Compromiso 2 de 4: Hogar, sueldo/);
    expect(fichas[2]).toMatch(/^Compromiso 3 de 4: Gastos fijos/);
    expect(fichas[3]).toMatch(/^Ahorro fijo 4 de 4: Materiales/);
    expect(fichas[4]).toMatch(/^Lo que sobra se reparte: Cocos 50%, Maun 50%/);
    expect(fichas[5]).toMatch(/^Ahorro: Cocos, 50% de lo que sobra/);
    expect(fichas[6]).toMatch(/^Superávit: Maun recibe el resto/);
    for (const grupo of ['Obligaciones', 'Compromisos', 'Ahorros']) {
      expect(within(fila).getByText(grupo)).toBeInTheDocument();
    }
    expect(
      within(fila).getByRole('button', { name: 'Qué son las obligaciones' }),
    ).toBeInTheDocument();
    expect(
      within(fila).getByRole('button', { name: 'Qué son los compromisos' }),
    ).toBeInTheDocument();
    expect(within(fila).getByRole('button', { name: 'Qué son los ahorros' })).toBeInTheDocument();
    expect(within(fila).getByText('Alquiler del galpón')).toBeInTheDocument();
    expect(
      within(fila).getByText(/^Ingreso de septiembre: \$\s0 en 0 cobros$/),
    ).toBeInTheDocument();

    fireEvent.click(within(fila).getByRole('button', { name: /^Ahorro fijo 4 de 4/ }));
    expect(alTocar).toHaveBeenCalledWith(`paso-${MATERIALES}`);

    const estante = screen.getByRole('region', { name: 'Estante' });
    expect(within(estante).getByText('Herramientas')).toBeInTheDocument();
    expect(within(estante).getByText('No reciben de los cobros')).toBeInTheDocument();
    fireEvent.click(within(estante).getByRole('button', { name: 'Nuevo tesoro' }));
    expect(alNuevo).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Sumar acá' })).toBeNull();
  });

  it('en la prueba, cada flecha lleva lo que baja y cada paso lo que recibe', () => {
    montar({ monto: 200_000_000 });
    const fila = screen.getByRole('region', { name: 'La fila' });
    expect(
      within(fila).getByText(/^Prueba: un trabajo que deja \$\s2\.000\.000$/),
    ).toBeInTheDocument();
    expect(within(fila).getByText(/^\+ \$\s1\.800\.000$/)).toBeInTheDocument();
    expect(within(fila).getAllByText(/^\$\s1\.800\.000$/)).toHaveLength(2);
    expect(within(fila).getByText('Ingreso libre')).toBeInTheDocument();
    expect(within(fila).getByText('Ganancia')).toBeInTheDocument();
    expect(within(fila).getAllByText('completa el monto')).toHaveLength(1);
    expect(within(fila).getAllByText('no le llega nada')).toHaveLength(2);
  });

  it('en la prueba, el ingreso libre y la ganancia llevan el monto aparte, del otro lado de la flecha, para no salirse de la pantalla', () => {
    montar({ monto: 200_000_000 });
    const fila = screen.getByRole('region', { name: 'La fila' });
    for (const nombre of ['Ingreso libre', 'Ganancia']) {
      const rotulo = within(fila).getByText(nombre).parentElement as HTMLElement;
      expect(rotulo).not.toHaveTextContent('$');
      const conector = rotulo.parentElement?.parentElement as HTMLElement;
      const monto = within(conector).getByText(/^\$\s[\d.]+$/);
      expect(monto).toHaveClass('right-1/2');
      expect(monto).not.toContainElement(rotulo);
    }
  });

  it('editando, cada obligación y cada paso tienen Subir, Bajar y Editar, y cada flecha «Sumar acá»', () => {
    empezarElBorrador('a', 4, GUARDADA);
    const { alSumar, alTocar } = montar();
    expect(screen.getAllByRole('button', { name: 'Sumar acá' })).toHaveLength(5);
    const diezmo = screen.getByRole('group', { name: 'Lugar de Diezmo' });
    expect(within(diezmo).getByRole('button', { name: 'Subir' })).toBeDisabled();
    expect(within(diezmo).getByRole('button', { name: 'Bajar' })).toBeDisabled();
    const hogar = screen.getByRole('group', { name: 'Lugar de Hogar' });
    expect(within(hogar).getByRole('button', { name: 'Subir' })).toBeDisabled();
    const materiales = screen.getByRole('group', { name: 'Lugar de Materiales' });
    expect(within(materiales).getByRole('button', { name: 'Subir' })).toBeDisabled();

    fireEvent.click(within(hogar).getByRole('button', { name: 'Bajar' }));
    expect(borradorDeLaFila()?.fila.pasos.map((paso) => paso.tesoro)).toEqual([
      FIJOS,
      HOGAR,
      MATERIALES,
    ]);

    fireEvent.click(within(hogar).getByRole('button', { name: 'Editar' }));
    expect(alTocar).toHaveBeenCalledWith(`paso-${HOGAR}`);

    fireEvent.click(screen.getAllByRole('button', { name: 'Sumar acá' })[0] as HTMLElement);
    expect(alSumar).toHaveBeenCalledWith(
      { fuente: 'origen', despuesDe: null, lugares: ['obligacion'] },
      expect.any(HTMLElement),
    );

    const estante = screen.getByRole('region', { name: 'Estante' });
    expect(within(estante).getByText('Tiene')).toBeInTheDocument();
    expect(screen.queryByText('Uní una flecha acá')).toBeNull();
  });
});
