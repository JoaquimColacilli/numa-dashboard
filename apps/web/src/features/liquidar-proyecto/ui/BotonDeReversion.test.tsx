import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Proyecto, ReversionDeProyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import { formatearPesos } from '@/shared/lib';

import { BotonDeReversion } from './BotonDeReversion';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';

const FILA_DEL_COBRO = { pasos: [], reparto: [], sueldoPorTrabajo: false };

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function tesoro(id: string, clave: FilaDe<'tesoros'>['clave'], nombre: string, tinta: string) {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    moneda: 'ARS',
  } satisfies FilaDe<'tesoros'>;
}

function cobrado(extra: Partial<Proyecto> = {}): Proyecto {
  return {
    ...METADATOS,
    id: 'p',
    titulo: 'Placard de tres puertas',
    estado: 'cobrado',
    version: 6,
    fecha_cobro: '2026-09-23',
    dist_cobrado_centavos: 1_000_000,
    dist_gastos_centavos: 0,
    dist_diezmo_bp: 1000,
    dist_diezmo_centavos: 100_000,
    dist_tope_sueldo_centavos: 0,
    dist_tope_fijos_centavos: 0,
    dist_sueldo_centavos: 0,
    dist_fijos_centavos: 0,
    dist_remanente_centavos: 900_000,
    dist_objetivo_sueldo_centavos: 0,
    dist_objetivo_fijos_centavos: 0,
    dist_sueldo_mensual: true,
    dist_fila_version: 4,
    dist_fila: FILA_DEL_COBRO,
    reparto_ya_en_la_apertura: false,
    ...extra,
  } as unknown as Proyecto;
}

function reparto(
  id: string,
  posicion: number,
  tesoroId: string,
  nombre: string,
  monto: number,
  tipo: 'paso' | 'parte' = 'paso',
): FilaDe<'repartos'> {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p',
    posicion,
    tesoro_id: tesoroId,
    nombre,
    tipo,
    clase: tipo === 'paso' ? 'prioridad' : null,
    modo: tipo === 'paso' ? 'mes' : null,
    base: null,
    objetivo_centavos: tipo === 'paso' ? monto : null,
    previo_centavos: tipo === 'paso' ? 0 : null,
    tope_centavos: tipo === 'paso' ? monto : null,
    por_mes: tipo === 'paso' ? true : null,
    porcentaje_bp: tipo === 'parte' ? 5000 : null,
    monto_centavos: monto,
    fecha: '2026-09-23',
    ya_en_la_apertura: false,
  };
}

const REPARTOS = [
  reparto('r1', 1, HOGAR, 'Hogar', 300_000),
  reparto('r2', 2, FIJOS, 'Gastos fijos', 200_000),
  reparto('r3', 3, COCOS, 'Cocos', 200_000, 'parte'),
];

function taller(
  proyecto: Proyecto,
  repartos: readonly FilaDe<'repartos'>[],
  porTrabajo = false,
): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  if (porTrabajo) {
    replica = aplicarFilaLocal(replica, 'ajustes', {
      ...METADATOS,
      id: 'a1',
      sueldo_tope_mensual: false,
      fila: null,
    } as unknown as FilaDe<'ajustes'>);
  }
  for (const fila of [
    tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
    tesoro(MAUN, 'maun', 'Maun', 'maun'),
    tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
    tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
    tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
  ]) {
    replica = aplicarFilaLocal(replica, 'tesoros', fila);
  }
  replica = aplicarFilaLocal(replica, 'proyectos', proyecto);
  for (const fila of repartos) replica = aplicarFilaLocal(replica, 'repartos', fila);
  return replica;
}

function montar(proyecto: Proyecto, repartos: readonly FilaDe<'repartos'>[], porTrabajo = false) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={taller(proyecto, repartos, porTrabajo)}>
        <BotonDeReversion proyecto={proyecto} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reabrir el cobro' }));
  return {
    reversiones: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[1] === 'revertir')
        .map((mutacion) => mutacion.state.variables as ReversionDeProyecto),
  };
}

function loQueVuelve(): string[][] {
  const lista = screen.getByRole('list', { name: 'Lo que vuelve a la caja del taller' });
  return within(lista)
    .getAllByRole('listitem')
    .map((renglon) =>
      [...renglon.querySelectorAll('span:not([aria-hidden])')].map((parte) => parte.textContent),
    );
}

beforeEach(() => {
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
});

describe('reabrir un cobro', () => {
  it('por la fila, dice qué vuelve de cada tesoro a la caja del taller, sacado de sus repartos', () => {
    montar(cobrado(), REPARTOS);
    expect(loQueVuelve()).toEqual([
      ['Diezmo', formatearPesos(100_000)],
      ['Hogar', formatearPesos(300_000)],
      ['Gastos fijos', formatearPesos(200_000)],
      ['Cocos', formatearPesos(200_000)],
    ]);
  });

  it('manda los repartos del proyecto para sacarlos de la réplica, y guarda la fila del cobro', () => {
    const { reversiones } = montar(cobrado(), REPARTOS);
    fireEvent.click(screen.getByRole('button', { name: 'Reabrir y deshacer el reparto' }));

    const [enviada] = reversiones();
    expect(enviada?.pedido).toEqual({
      proyectoId: 'p',
      version: 6,
      desde: 'cobrado',
      hacia: 'entregado',
    });
    expect(enviada?.repartos?.map((fila) => fila.id)).toEqual(['r1', 'r2', 'r3']);
    expect(enviada?.optimista).toMatchObject({
      estado: 'entregado',
      version: 7,
      dist_fila_version: null,
      reapertura_fila: { version: 4, fila: FILA_DEL_COBRO },
    });
  });

  it('por el camino de antes, vuelven el diezmo y el sueldo, y no hay repartos que sacar', () => {
    const deAntes = cobrado({
      dist_fila_version: null,
      dist_fila: null,
      dist_diezmo_centavos: 7_000_000,
      dist_sueldo_centavos: 50_000_000,
      dist_fijos_centavos: 13_000_000,
      dist_remanente_centavos: 0,
      dist_cobrado_centavos: 70_000_000,
    });
    const { reversiones } = montar(deAntes, []);
    expect(loQueVuelve()).toEqual([
      ['Diezmo', formatearPesos(7_000_000)],
      ['Hogar', formatearPesos(50_000_000)],
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Reabrir y deshacer el reparto' }));
    expect(reversiones()[0]?.repartos).toEqual([]);
    expect(reversiones()[0]?.optimista.reapertura_fila).toBeNull();
  });

  it('avisa que al volver a cobrarlo el sueldo cuenta lo que ya recibió ese mes', () => {
    montar(cobrado({ dist_fila: { ...FILA_DEL_COBRO, sueldoPorTrabajo: true } }), REPARTOS);
    expect(screen.getByRole('region', { name: 'Reabrir el cobro' })).toHaveTextContent(
      'Lo que sí mira es lo que tu sueldo ya recibió ese mes, como en un cobro nuevo.',
    );
  });

  it('en un taller que sigue con el sueldo por trabajo, no lo promete', () => {
    montar(cobrado(), REPARTOS, true);
    expect(screen.getByRole('region', { name: 'Reabrir el cobro' })).not.toHaveTextContent(
      'ya recibió ese mes',
    );
  });

  it('si el reparto ya estaba en los saldos de la apertura, no promete mover plata', () => {
    montar(cobrado({ reparto_ya_en_la_apertura: true }), REPARTOS);
    expect(screen.queryByRole('list', { name: 'Lo que vuelve a la caja del taller' })).toBeNull();
    expect(screen.getByText(/ya estaba en tus saldos/)).toBeInTheDocument();
  });
});
