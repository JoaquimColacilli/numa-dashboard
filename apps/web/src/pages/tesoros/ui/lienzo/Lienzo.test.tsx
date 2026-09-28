import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  descartarElBorrador,
  empezarElBorrador,
  fichaVigente,
  useBorradorDeLaFila,
  vistaDeLaFila,
} from '@/features/armar-la-fila';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import Lienzo from './Lienzo';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const HOY = '2026-09-27';

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
    tesoro(MATERIALES, null, 'Materiales', 'mostaza'),
    tesoro(HERRAMIENTAS, null, 'Herramientas', 'petroleo'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const REPLICA = replicaDelTaller();
const RELLENO = { arriba: 28, abajo: 28, izquierda: 40, derecha: 40 };

function ElLienzo() {
  const borrador = useBorradorDeLaFila('a');
  const vista = vistaDeLaFila(REPLICA, borrador, HOY);
  const [pedido, setPedido] = useState<string | null>(null);
  const elegido = fichaVigente(vista, pedido);
  return (
    <>
      <output data-testid="elegido">{elegido ?? 'nada'}</output>
      <Lienzo
        vista={vista}
        resultado={null}
        elegido={elegido}
        alElegir={setPedido}
        modo="editar"
        pie="rotulo"
        revision={4}
        rige="01/09/26"
        relleno={RELLENO}
      />
    </>
  );
}

class ObservadorQuieto {
  observe(): void {
    return undefined;
  }
  unobserve(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

class MatrizDePrueba {
  m22: number;
  constructor(transformacion?: string) {
    const escala = /scale\(([\d.]+)\)/.exec(transformacion ?? '')?.[1];
    this.m22 = escala === undefined ? 1 : Number(escala);
  }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ObservadorQuieto);
  vi.stubGlobal('DOMMatrixReadOnly', MatrizDePrueba);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  descartarElBorrador();
});

function ficha(id: string): HTMLElement {
  const encontrada = document.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  if (encontrada === null) throw new Error(`No está la ficha ${id}`);
  return encontrada;
}

describe('el lienzo con el teclado', () => {
  it('Enter elige la ficha, Escape la suelta y el foco sigue en ella', async () => {
    render(<ElLienzo />);
    const materiales = ficha(`paso-${MATERIALES}`);
    materiales.focus();
    fireEvent.keyDown(materiales, { key: 'Enter' });
    expect(screen.getByTestId('elegido')).toHaveTextContent(`paso-${MATERIALES}`);

    fireEvent.keyDown(materiales, { key: 'Escape' });
    expect(screen.getByTestId('elegido')).toHaveTextContent('nada');
    await new Promise((listo) => requestAnimationFrame(listo));
    expect(ficha(`paso-${MATERIALES}`)).toHaveFocus();
  });

  it('editando, Suprimir saca el paso y el foco pasa a su ficha en el estante; deshacer lo devuelve', async () => {
    empezarElBorrador('a', 4, GUARDADA);
    render(<ElLienzo />);
    const materiales = ficha(`paso-${MATERIALES}`);
    materiales.focus();
    fireEvent.keyDown(materiales, { key: 'Enter' });
    fireEvent.keyDown(materiales, { key: 'Delete' });
    expect(screen.getByTestId('elegido')).toHaveTextContent(`estante-${MATERIALES}`);
    await waitFor(() => {
      expect(ficha(`estante-${MATERIALES}`)).toHaveFocus();
    });

    fireEvent.keyDown(ficha(`estante-${MATERIALES}`), { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('elegido')).toHaveTextContent(`paso-${MATERIALES}`);
    await waitFor(() => {
      expect(ficha(`paso-${MATERIALES}`)).toHaveFocus();
    });
  });
});
