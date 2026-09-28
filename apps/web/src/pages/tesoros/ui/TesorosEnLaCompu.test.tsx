import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { descartarElBorrador } from '@/features/armar-la-fila';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { usePantallaDeTesoros } from '../model/pantalla';
import type { LienzoProps } from './lienzo/Lienzo';
import { HojasDeTesoros } from './HojasDeTesoros';
import { TesorosEnLaCompu } from './TesorosEnLaCompu';

vi.mock('./LienzoPerezoso', () => ({
  LienzoPerezoso: ({ vista, alElegir }: LienzoProps) => (
    <div>
      {[
        ...vista.fila.pasos.map((paso) => `paso-${paso.tesoro}`),
        ...vista.estante.map((suelto) => `estante-${suelto.id}`),
      ].map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            alElegir(id);
          }}
        >
          {`Elegir ${id}`}
        </button>
      ))}
    </div>
  ),
}));

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';

const GUARDADA: Fila = {
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(180_000_000),
      renglones: [],
      desde: '2026-09',
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(90_000_000),
      renglones: [{ nombre: 'Alquiler del galpón', monto: centavos(90_000_000) }],
      desde: '2026-09',
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000) }],
  sueldoPorTrabajo: false,
};

function tesoro(id: string, clave: string | null, nombre: string, tinta: string) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
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

function Pantalla() {
  const pantalla = usePantallaDeTesoros();
  return (
    <>
      <TesorosEnLaCompu pantalla={pantalla} ancho="tablet" />
      <HojasDeTesoros pantalla={pantalla} />
    </>
  );
}

function montar() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaDelTaller()}>
        <Pantalla />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
}

function cambiar(elemento: HTMLElement, abrir: boolean): void {
  if (elemento.hasAttribute('data-abierto') === abrir) return;
  const estados = { newState: abrir ? 'open' : 'closed', oldState: abrir ? 'closed' : 'open' };
  elemento.dispatchEvent(Object.assign(new Event('beforetoggle'), estados));
  if (abrir) elemento.setAttribute('data-abierto', '');
  else elemento.removeAttribute('data-abierto');
  elemento.dispatchEvent(Object.assign(new Event('toggle'), estados));
}

beforeAll(() => {
  if ('showPopover' in HTMLElement.prototype) return;
  Object.assign(HTMLElement.prototype, {
    showPopover(this: HTMLElement) {
      cambiar(this, true);
    },
    hidePopover(this: HTMLElement) {
      cambiar(this, false);
    },
  });
  document.addEventListener('click', (evento) => {
    const boton = (evento.target as Element).closest('[popovertarget]');
    const id = boton?.getAttribute('popovertarget');
    const globo = id ? document.getElementById(id) : null;
    if (globo) cambiar(globo, !globo.hasAttribute('data-abierto'));
  });
});

beforeEach(() => {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: consulta.includes('768'),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  descartarElBorrador();
  vi.unstubAllGlobals();
});

describe('Tesoros en la tablet vertical', () => {
  it('el panel de abajo de un tesoro del estante abre «Editar tesoro»', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: `Elegir estante-${HERRAMIENTAS}` }));
    const panel = screen.getByRole('region', { name: 'Herramientas' });
    expect(within(panel).getByText('En el estante')).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: 'Editar Herramientas' }));
    const hoja = screen.getByRole('dialog', { name: 'Herramientas' });
    expect(within(hoja).getByRole('button', { name: 'Archivar' })).toBeInTheDocument();
  });

  it('con una ayuda abierta, Escape cierra la ayuda y el panel queda; otro Escape cierra el panel', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: `Elegir paso-${MATERIALES}` }));
    const panel = screen.getByRole('region', { name: 'Materiales' });
    const ayuda = within(panel).getByRole('button', { name: 'Qué es cada clase de paso' });
    const globo = document.getElementById(ayuda.getAttribute('popovertarget') ?? '') as HTMLElement;
    fireEvent.click(ayuda);
    expect(globo).toHaveAttribute('data-abierto');

    fireEvent.keyDown(ayuda, { key: 'Escape' });
    expect(globo).not.toHaveAttribute('data-abierto');
    expect(screen.getByRole('region', { name: 'Materiales' })).toBeInTheDocument();

    fireEvent.keyDown(ayuda, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: 'Materiales' })).toBeNull();
  });

  it('al sacar el paso elegido y deshacer, el panel sigue al tesoro', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Editar la fila' }));
    fireEvent.click(screen.getByRole('button', { name: `Elegir paso-${MATERIALES}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Sacar de la fila' }));
    expect(
      within(screen.getByRole('region', { name: 'Materiales' })).getByText('En el estante'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    const panel = screen.getByRole('region', { name: 'Materiales' });
    expect(within(panel).getByText('Paso 3 de 3 · Prioridad')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Sacar de la fila' })).toBeInTheDocument();
  });
});
