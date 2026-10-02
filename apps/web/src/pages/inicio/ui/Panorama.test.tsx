import { centavos, filaDelMes, filaDeSiempre } from '@maun/domain';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { tesorosDelTaller } from '@/entities/tesoro';
import { datosDelLibro, TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { panoramaDelTaller, type PanoramaDelTaller } from '../model/panorama';
import { Panorama } from './Panorama';

const PANORAMA: PanoramaDelTaller = {
  paraPagar: centavos(132_700_000),
  ahorros: centavos(413_100_000),
  superavit: centavos(36_500_000),
  insumos: centavos(82_000_000),
  compromisoDeMaun: centavos(0),
  tesorosParaPagar: 3,
  tesorosDeAhorro: 4,
  tesoroDelSuperavit: 's',
  trabajosConInsumos: 2,
};

afterEach(() => {
  cleanup();
});

function llano(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const VACACIONES = '01900000-0000-7000-8000-000000000005';
const DOLARES = '01900000-0000-7000-8000-000000000006';
const SISTEMA = { hogar: HOGAR, maun: MAUN, diezmo: DIEZMO };

function filaDeTesoro(id: string, clave: string | null, nombre: string, moneda = 'ARS') {
  return {
    id,
    household_id: 'h',
    clave,
    moneda,
    nombre,
    descripcion: '',
    tinta: clave ?? 'grana',
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

function movimiento(id: string, fecha: string, extra: Record<string, unknown>) {
  return {
    id,
    household_id: 'h',
    fecha,
    tipo: 'ingreso',
    tesoro_origen: null,
    tesoro_destino: null,
    desde_id: null,
    hacia_id: null,
    cubre_el_mes: null,
    monto_centavos: 0,
    monto_destino_centavos: null,
    categoria: '',
    descripcion: '',
    proyecto_id: null,
    created_at: `${fecha}T10:00:00Z`,
    updated_at: `${fecha}T10:00:00Z`,
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

function replicaConDolares(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  const tesoros = [
    filaDeTesoro(HOGAR, 'hogar', 'Hogar'),
    filaDeTesoro(MAUN, 'maun', 'Maun'),
    filaDeTesoro(DIEZMO, 'diezmo', 'Diezmo'),
    filaDeTesoro(COCOS, 'cocos', 'Cocos'),
    filaDeTesoro(VACACIONES, null, 'Vacaciones'),
    filaDeTesoro(DOLARES, null, 'Dólares', 'USD'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((uno) => [uno.id, uno]));
  const movimientos = [
    movimiento('m1', '2026-09-10', { hacia_id: VACACIONES, monto_centavos: 1_000_000 }),
    movimiento('m2', '2026-09-12', { hacia_id: DOLARES, monto_centavos: 50_000 }),
    movimiento('m3', '2026-09-28', {
      tipo: 'cambio',
      tesoro_origen: 'maun',
      desde_id: MAUN,
      hacia_id: DOLARES,
      monto_centavos: 72_500_000,
      monto_destino_centavos: 50_000,
    }),
  ];
  tablas.movimientos = Object.fromEntries(movimientos.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function panoramaDeLaReplica(replica: Replica): PanoramaDelTaller {
  const fila = filaDeSiempre(
    { sueldoMensual: centavos(0), costosFijos: centavos(0), sueldoTopeMensual: true },
    SISTEMA,
  );
  const delMes = filaDelMes(
    fila,
    SISTEMA,
    { liquidaciones: [], coberturas: [], saldos: new Map(), metas: new Map(), gastos: [] },
    '2026-09',
  );
  return panoramaDelTaller({
    fila,
    delMes,
    sistema: SISTEMA,
    tesoros: tesorosDelTaller(replica),
    movimientos: datosDelLibro(replica).movimientos,
    insumos: centavos(0),
    trabajosConInsumos: 0,
  });
}

describe('el panorama de Inicio', () => {
  it('es una línea de cuatro cifras, con su (i)', () => {
    render(<Panorama panorama={PANORAMA} nombreDelSuperavit="Superávit" />);
    const panorama = screen.getByRole('region', { name: 'Panorama' });

    expect(
      within(panorama)
        .getAllByRole('term')
        .map((clave) => clave.textContent),
    ).toEqual(['Para pagar', 'Ahorros', 'Superávit', 'Insumos de los trabajos']);
    expect(
      within(panorama)
        .getAllByRole('definition')
        .map((valor) => llano(valor.textContent)),
    ).toEqual([
      '$ 1.327.000',
      'en 3 tesoros',
      '$ 4.131.000',
      'en 4 tesoros',
      '$ 365.000',
      'en Superávit',
      '$ 820.000',
      'de 2 trabajos',
    ]);
    expect(
      within(panorama).getByRole('button', { name: 'Qué es el panorama' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dónde está la plata y para qué la podés usar.')).toBeInTheDocument();
    expect(panorama.querySelectorAll('[data-monto]')).toHaveLength(4);
  });

  it('por moneda: «Ahorros» cuenta solo los pesos, y los dólares van en su línea con el equivalente', () => {
    render(
      <Panorama panorama={panoramaDeLaReplica(replicaConDolares())} nombreDelSuperavit="Maun" />,
    );
    const panorama = screen.getByRole('region', { name: 'Panorama' });
    const ahorros = panorama.querySelector('[data-cifra-del-panorama="ahorros"]');
    expect(llano(ahorros?.textContent)).toBe('Ahorros$ 10.000en 2 tesoros');

    const enDolares = panorama.querySelector('[data-cifra-del-panorama="en-dolares"]');
    expect(llano(enDolares?.textContent)).toBe(
      'En dólaresUS$ 1.000en un tesoro≈ $ 1.450.000 a $ 1.450, tu última compra (28 sep)',
    );
    expect(enDolares?.querySelector('[data-equivalente-en-pesos]')).not.toBeNull();
  });

  it('un superávit en negativo se ve en alerta', () => {
    render(
      <Panorama
        panorama={{ ...PANORAMA, superavit: centavos(-5_000_000) }}
        nombreDelSuperavit="Maun"
      />,
    );
    const superavit = screen
      .getByRole('region', { name: 'Panorama' })
      .querySelector('[data-cifra-del-panorama="superavit"] [data-monto]');
    expect(superavit).toHaveClass('text-alerta');
  });
});
