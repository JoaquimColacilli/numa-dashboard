import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  cambiarElBorrador,
  descartarElBorrador,
  empezarElBorrador,
  useBorradorDeLaFila,
} from '../model/borrador';
import { sumarAlFinal } from '../model/edicion';
import { fichaVigente, SIN_PRUEBA, vistaDeLaFila } from '../model/vista';
import { HojaDeLaFicha } from './HojaDeLaFicha';
import { PanelDeDetalle } from './PanelDeDetalle';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const INMUEBLES = '01900000-0000-7000-8000-000000000008';
const HOY = '2026-09-27';

const GUARDADA: Fila = {
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: '2026-09',
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(10_000_000),
      renglones: [{ nombre: 'Luz', monto: centavos(10_000_000) }],
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
  reparto: [
    { tesoro: COCOS, porcentaje: puntosBasicos(5000) },
    { tesoro: INMUEBLES, porcentaje: puntosBasicos(3000) },
  ],
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
      sueldo_mensual_centavos: 100_000_000,
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
    tesoro(INMUEBLES, null, 'Inmuebles', 'ciruela'),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const REPLICA = replicaDelTaller();

function Panel({
  inicial,
  alEditarTesoro,
  conFlechas,
}: {
  inicial: string;
  alEditarTesoro: (tesoro: string) => void;
  conFlechas?: boolean;
}) {
  const borrador = useBorradorDeLaFila('a');
  const vista = vistaDeLaFila(REPLICA, borrador, HOY);
  const [elegido, setElegido] = useState<string | null>(inicial);
  return (
    <PanelDeDetalle
      vista={vista}
      elegido={fichaVigente(vista, elegido)}
      prueba={SIN_PRUEBA}
      resultado={null}
      alElegir={setElegido}
      alProbar={() => undefined}
      alCubrir={() => undefined}
      alEditarTesoro={alEditarTesoro}
      conFlechas={conFlechas}
    />
  );
}

function montar(inicial: string, conFlechas?: boolean) {
  const alEditarTesoro = vi.fn();
  render(<Panel inicial={inicial} alEditarTesoro={alEditarTesoro} conFlechas={conFlechas} />);
  return { alEditarTesoro };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  descartarElBorrador();
  vi.unstubAllGlobals();
});

describe('el panel de detalle', () => {
  it('un paso recién sumado con tope $ 0 no se ve completo: pide el tope', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarAlFinal(GUARDADA, HERRAMIENTAS, null));
    montar(`paso-${HERRAMIENTAS}`);

    const nivel = screen.getByRole('meter', { name: 'Herramientas en septiembre' });
    expect(nivel).toHaveAttribute('aria-valuenow', '0');
    expect(nivel).toHaveAttribute('aria-valuetext', 'Sin tope todavía');
    expect(screen.getByText('Poné el tope')).toBeInTheDocument();
    expect(screen.queryByText('Completo')).toBeNull();
  });

  it('en el reparto, cada tesoro y el resto llevan su lápiz para editarlo', () => {
    const { alEditarTesoro } = montar('reparto');
    const reparto = screen.getByRole('region', { name: 'Reparto' });
    expect(
      within(reparto)
        .getAllByRole('button', { name: /^Editar / })
        .map((boton) => boton.getAttribute('aria-label')),
    ).toEqual(['Editar Cocos', 'Editar Inmuebles', 'Editar Maun']);
    fireEvent.click(within(reparto).getByRole('button', { name: 'Editar Cocos' }));
    expect(alEditarTesoro).toHaveBeenCalledWith(COCOS);
  });

  it('con los porcentajes pasados de 100% dice solo el problema, sin la línea que no aplica', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar('reparto');
    fireEvent.change(screen.getByRole('textbox', { name: 'Porcentaje de Inmuebles' }), {
      target: { value: '60' },
    });
    expect(screen.getByText('Los porcentajes suman más de 100%.')).toBeInTheDocument();
    expect(screen.queryByText(/El reparto llega al 100%/)).toBeNull();
    expect(screen.queryByText(/Los porcentajes suman 110%/)).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: 'Porcentaje de Inmuebles' }), {
      target: { value: '50' },
    });
    expect(screen.getByText(/El reparto llega al 100%/)).toBeInTheDocument();
  });

  it('sin flechas, el tesoro del estante no invita a unir una flecha', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`estante-${HERRAMIENTAS}`, false);
    expect(
      screen.getByText('Ahora no recibe plata de los cobros. Elegí dónde va.'),
    ).toBeInTheDocument();
  });

  it('con flechas, sí', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`estante-${HERRAMIENTAS}`);
    expect(
      screen.getByText(/Uní una flecha hasta su ficha o elegí dónde va\./),
    ).toBeInTheDocument();
  });

  it('al sacar un paso de la fila, el foco pasa al tesoro en el estante', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`paso-${MATERIALES}`);
    const sacar = screen.getByRole('button', { name: 'Sacar de la fila' });
    sacar.focus();
    fireEvent.click(sacar);
    const titulo = screen.getByRole('heading', { level: 2, name: 'Materiales' });
    expect(screen.getByText('En el estante')).toBeInTheDocument();
    expect(titulo).toHaveFocus();
  });

  it('al subir un paso hasta el primer lugar, el foco pasa a Bajar', async () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`paso-${FIJOS}`);
    const subir = screen.getByRole('button', { name: 'Subir' });
    subir.focus();
    fireEvent.click(subir);
    expect(screen.getByRole('button', { name: 'Subir' })).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bajar' })).toHaveFocus();
    });
  });

  it('en la lista de tesoros, el globo dice el número y el renglón dice solo la clase', () => {
    montar('nada');
    const lista = screen.getByRole('region', { name: 'Lista de tesoros' });
    const hogar = within(lista).getByRole('button', { name: /^Hogar/ });
    expect(hogar).toHaveAccessibleName(/paso 1,\s*sueldo/);
    expect(within(hogar).getByText('paso 1,', { selector: '.sr-only' })).toBeInTheDocument();
  });
});

function Hoja({
  elegido,
  alEditarTesoro,
}: {
  elegido: string;
  alEditarTesoro: (id: string) => void;
}) {
  const borrador = useBorradorDeLaFila('a');
  const vista = vistaDeLaFila(REPLICA, borrador, HOY);
  return (
    <HojaDeLaFicha
      vista={vista}
      elegido={elegido}
      prueba={SIN_PRUEBA}
      resultado={null}
      alElegir={() => undefined}
      alProbar={() => undefined}
      alCubrir={() => undefined}
      alEditarTesoro={alEditarTesoro}
      alCerrar={() => undefined}
    />
  );
}

describe('la hoja de una ficha en el celular', () => {
  it('un tesoro del estante se edita desde la hoja: nombre, color, meta y archivar', () => {
    const alEditarTesoro = vi.fn();
    render(<Hoja elegido={`estante-${HERRAMIENTAS}`} alEditarTesoro={alEditarTesoro} />);
    const hoja = screen.getByRole('dialog', { name: 'Herramientas' });
    fireEvent.click(within(hoja).getByRole('button', { name: 'Editar Herramientas' }));
    expect(alEditarTesoro).toHaveBeenCalledWith(HERRAMIENTAS);
  });

  it('un paso dice su lugar y también se edita', () => {
    render(<Hoja elegido={`paso-${FIJOS}`} alEditarTesoro={() => undefined} />);
    const hoja = screen.getByRole('dialog', { name: 'Gastos fijos' });
    expect(within(hoja).getByText('Paso 2 de 3', { selector: 'header span' })).toBeInTheDocument();
    expect(within(hoja).getByRole('button', { name: 'Editar Gastos fijos' })).toBeInTheDocument();
  });

  it('en el reparto, cada tesoro se edita desde su renglón', () => {
    render(<Hoja elegido={`parte-${COCOS}`} alEditarTesoro={() => undefined} />);
    const hoja = screen.getByRole('dialog', { name: 'Lo que sobra' });
    expect(within(hoja).getByRole('button', { name: 'Editar Cocos' })).toBeInTheDocument();
    expect(within(hoja).getByRole('button', { name: 'Editar Maun' })).toBeInTheDocument();
  });

  it('editando, el estante del celular no habla de flechas', () => {
    empezarElBorrador('a', 4, GUARDADA);
    render(<Hoja elegido={`estante-${HERRAMIENTAS}`} alEditarTesoro={() => undefined} />);
    expect(
      screen.getByText('Ahora no recibe plata de los cobros. Elegí dónde va.'),
    ).toBeInTheDocument();
  });
});
