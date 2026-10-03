import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Replica } from '@/shared/api';

import { agruparPorDia, lineasDelTaller, TODOS_LOS_TESOROS } from '../model/libro';
import { ListaDelLibro } from './ListaDelLibro';

const MAUN_ID = '0192aaaa-0000-7000-8000-000000000002';
const DOLARES_ID = '0192aaaa-0000-7000-8000-000000000009';

const TESOROS = [
  {
    id: MAUN_ID,
    clave: 'maun' as const,
    moneda: 'ARS' as const,
    nombre: 'Maun',
    tinta: 'maun' as const,
    icono: 'hammer' as const,
  },
  {
    id: DOLARES_ID,
    clave: null,
    moneda: 'USD' as const,
    nombre: 'Dólares',
    tinta: 'petroleo' as const,
    icono: 'vault' as const,
  },
];

type MovimientoDePrueba = { id: string } & Record<string, unknown>;

function replicaCon(movimientos: readonly MovimientoDePrueba[]): Replica {
  const tesoros = Object.fromEntries(
    TESOROS.map((tesoro, orden) => [
      tesoro.id,
      {
        ...tesoro,
        descripcion: '',
        meta_centavos: null,
        rinde_anual_bp: null,
        orden,
        archivado_at: null,
        created_at: '2026-09-27T10:00:00Z',
      },
    ]),
  );
  return {
    usuarioId: 'u',
    cursor: '',
    reconciliadoEn: '',
    tablas: {
      tesoros,
      movimientos: Object.fromEntries(
        movimientos.map((movimiento) => [
          movimiento.id,
          {
            fecha: '2026-09-20',
            tesoro_origen: null,
            tesoro_destino: null,
            desde_id: null,
            hacia_id: null,
            monto_destino_centavos: null,
            categoria: '',
            descripcion: '',
            proyecto_id: null,
            ...movimiento,
          },
        ]),
      ),
    },
  } as unknown as Replica;
}

const DEL_DIA: readonly MovimientoDePrueba[] = [
  {
    id: 'm1',
    tipo: 'ingreso',
    tesoro_destino: 'maun',
    hacia_id: MAUN_ID,
    monto_centavos: 1_000_000,
  },
  { id: 'm2', tipo: 'ingreso', hacia_id: DOLARES_ID, monto_centavos: 5_000 },
  {
    id: 'm3',
    tipo: 'cambio',
    tesoro_origen: 'maun',
    desde_id: MAUN_ID,
    hacia_id: DOLARES_ID,
    monto_centavos: 72_500_000,
    monto_destino_centavos: 50_000,
  },
];

function montar(tesoro: string) {
  const lineas = lineasDelTaller(replicaCon(DEL_DIA), TESOROS);
  render(
    <ListaDelLibro
      dias={agruparPorDia(
        lineas.filter(
          (linea) =>
            tesoro === TODOS_LOS_TESOROS || linea.desdeId === tesoro || linea.haciaId === tesoro,
        ),
        tesoro,
      )}
      tesoro={tesoro}
      hoy="2026-09-30"
      sinConfirmar={() => false}
      alAbrir={() => undefined}
    />,
  );
}

function llano(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

afterEach(() => {
  cleanup();
});

describe('el neto del día por moneda', () => {
  it('por moneda: con «Todos», los pesos y los dólares van cada uno con lo suyo, y un cambio no suma', () => {
    montar(TODOS_LOS_TESOROS);
    const dia = screen.getByRole('region');
    const encabezado = dia.firstElementChild?.lastElementChild;
    expect(llano(encabezado?.textContent)).toBe('+$ 10.000 · +US$ 50');
  });

  it('el renglón de un cambio muestra los dos importes y a cuánto quedó el dólar', () => {
    montar(TODOS_LOS_TESOROS);
    const cambio = screen.getByRole('button', { name: /Compra de dólares/ });
    expect(llano(cambio.textContent)).toContain('−$ 725.000 → +US$ 500 · a $ 1.450');
    expect(within(cambio).getByText('Maun')).toBeInTheDocument();
    expect(within(cambio).getByText('Dólares')).toBeInTheDocument();
  });

  it('filtrado por un tesoro, el cambio cuenta su lado con su importe', () => {
    montar(DOLARES_ID);
    const dia = screen.getByRole('region');
    expect(llano(dia.firstElementChild?.lastElementChild?.textContent)).toBe('+US$ 550');
    const cambio = screen.getByRole('button', { name: /Compra de dólares/ });
    expect(llano(cambio.textContent)).toContain('+US$ 500');
    expect(llano(cambio.textContent)).not.toContain('725.000');
    cleanup();

    montar(MAUN_ID);
    expect(llano(screen.getByRole('region').firstElementChild?.lastElementChild?.textContent)).toBe(
      '−$ 715.000',
    );
  });
});
