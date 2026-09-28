import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PagoParaRegistrar } from '@/entities/movimiento';
import type { InsumosDeLosTrabajos } from '@/entities/proyecto';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  borradorDeLaFila,
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
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(10_000_000),
      renglones: [{ nombre: 'Luz', monto: centavos(10_000_000), dia: null }],
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
  reparto: [
    { tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false },
    { tesoro: INMUEBLES, porcentaje: puntosBasicos(3000), hastaLaMeta: false },
  ],
  superavit: MAUN,
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

function replicaDelTaller(saldos: { diezmo?: number } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  if (saldos.diezmo !== undefined) {
    tablas.movimientos = {
      m: {
        id: 'm',
        household_id: 'h',
        tipo: 'ajuste',
        fecha: '2026-09-01',
        tesoro_origen: null,
        tesoro_destino: 'diezmo',
        desde_id: null,
        hacia_id: DIEZMO,
        cubre_el_mes: null,
        monto_centavos: saldos.diezmo,
        categoria: 'Ajuste',
        descripcion: '',
        proyecto_id: null,
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
        deleted_at: null,
        version: 1,
      },
    };
  }
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
  alRegistrarElPago,
  insumos,
  replica = REPLICA,
}: {
  inicial: string;
  alEditarTesoro: (tesoro: string) => void;
  conFlechas?: boolean;
  alRegistrarElPago?: (pago: PagoParaRegistrar) => void;
  insumos?: InsumosDeLosTrabajos;
  replica?: Replica;
}) {
  const borrador = useBorradorDeLaFila('a');
  const vista = vistaDeLaFila(replica, borrador, HOY);
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
      alRegistrarElPago={alRegistrarElPago}
      insumos={insumos}
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
  it('un paso recién sumado con monto $ 0 no se ve completo: pide el monto', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarAlFinal(GUARDADA, HERRAMIENTAS, null));
    montar(`paso-${HERRAMIENTAS}`);

    const nivel = screen.getByRole('meter', { name: 'Herramientas en septiembre' });
    expect(nivel).toHaveAttribute('aria-valuenow', '0');
    expect(nivel).toHaveAttribute('aria-valuetext', 'Sin monto todavía');
    expect(screen.getByText('Poné el monto')).toBeInTheDocument();
    expect(screen.queryByText('Completo')).toBeNull();
  });

  it('un compromiso elige cómo se llena, y un ahorro fijo cómo se aparta', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`paso-${FIJOS}`);
    const comoSeLlena = screen.getByRole('radiogroup', { name: 'Cómo se llena Gastos fijos' });
    fireEvent.click(within(comoSeLlena).getByRole('radio', { name: 'Se renueva al pagar' }));
    expect(borradorDeLaFila()?.fila.pasos[1]?.modo).toBe('saldo');
    expect(screen.getByRole('region', { name: 'Lo apartado' })).toBeInTheDocument();
    cleanup();

    montar(`paso-${MATERIALES}`);
    const comoSeAparta = screen.getByRole('radiogroup', { name: 'Cómo se aparta Materiales' });
    expect(
      within(comoSeAparta)
        .getAllByRole('radio')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Por mes', 'Se repone al usarlo', 'Por trabajo']);
  });

  it('en un compromiso, cada renglón lleva su día de pago', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`paso-${FIJOS}`);
    fireEvent.change(screen.getByRole('combobox', { name: 'Día de pago de Luz' }), {
      target: { value: '10' },
    });
    expect(borradorDeLaFila()?.fila.pasos[1]?.renglones[0]?.dia).toBe(10);
  });

  it('una obligación: porcentaje, sobre qué se calcula, su lugar entre las obligaciones y el candado del diezmo', () => {
    empezarElBorrador('a', 4, {
      ...GUARDADA,
      obligaciones: [
        { tesoro: HERRAMIENTAS, porcentaje: puntosBasicos(350), base: 'cobrado' },
        ...GUARDADA.obligaciones,
      ],
    });
    montar(`obligacion-${HERRAMIENTAS}`);
    fireEvent.click(screen.getByRole('radio', { name: 'El ingreso' }));
    expect(borradorDeLaFila()?.fila.obligaciones[0]?.base).toBe('ingreso');
    fireEvent.click(screen.getByRole('button', { name: 'Bajar' }));
    expect(borradorDeLaFila()?.fila.obligaciones.map((obligacion) => obligacion.tesoro)).toEqual([
      DIEZMO,
      HERRAMIENTAS,
    ]);
    expect(screen.getByRole('button', { name: 'Sacar de las obligaciones' })).toBeInTheDocument();
    cleanup();

    montar('diezmo');
    expect(screen.getByText(/El diezmo no se puede sacar de la fila/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sacar de las obligaciones' })).toBeNull();
  });

  it('una obligación con plata a pagar ofrece «Registrar el pago»', () => {
    const alRegistrarElPago = vi.fn();
    render(
      <Panel
        inicial="diezmo"
        alEditarTesoro={() => undefined}
        alRegistrarElPago={alRegistrarElPago}
        replica={replicaDelTaller({ diezmo: 5_000_000 })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Registrar el pago' }));
    expect(alRegistrarElPago).toHaveBeenCalledWith({
      tesoro: { id: DIEZMO, clave: 'diezmo' },
      monto: 5_000_000,
      categoria: null,
    });
  });

  it('el superávit se elige entre los tesoros que pueden recibir lo que sobra', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar('resto');
    const donde = screen.getByRole('radiogroup', { name: 'Dónde cae lo que sobra' });
    expect(
      within(donde)
        .getAllByRole('radio')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Maun', 'Herramientas']);
    fireEvent.click(within(donde).getByRole('radio', { name: /Herramientas/ }));
    expect(borradorDeLaFila()?.fila.superavit).toBe(HERRAMIENTAS);
  });

  it('un tesoro del estante ofrece los lugares de la fila que le tocan', () => {
    empezarElBorrador('a', 4, GUARDADA);
    montar(`estante-${HERRAMIENTAS}`);
    const lugares = screen.getByRole('region', { name: 'Sumarlo a la fila' });
    expect(
      within(lugares)
        .getAllByRole('button')
        .map((boton) => [boton.textContent, (boton as HTMLButtonElement).disabled]),
    ).toEqual([
      ['Como obligación', false],
      ['Como compromiso', false],
      ['Como ahorro fijo', false],
      ['En el reparto', false],
      ['Que reciba lo que sobra', false],
    ]);
    fireEvent.click(within(lugares).getByRole('button', { name: 'Como obligación' }));
    expect(borradorDeLaFila()?.fila.obligaciones.at(-1)).toEqual({
      tesoro: HERRAMIENTAS,
      porcentaje: 0,
      base: 'ingreso',
    });
  });

  it('los insumos muestran lo que queda de cada trabajo en curso, con el enlace a su ficha', () => {
    render(
      <MemoryRouter>
        <Panel
          inicial="insumos"
          alEditarTesoro={() => undefined}
          insumos={{
            total: centavos(60_000_000),
            trabajos: [
              {
                proyectoId: 'p1',
                titulo: 'Cocina integral',
                entro: centavos(100_000_000),
                gastado: centavos(40_000_000),
                queda: centavos(60_000_000),
                tallerPuso: null,
              },
            ],
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Cocina integral/ })).toHaveAttribute(
      'href',
      '/proyectos/p1',
    );
    expect(screen.getByText(/^En 1 trabajo en curso/)).toBeInTheDocument();
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

  it('la lista de tesoros va agrupada por tipo, con el número de cada uno en la fila', () => {
    montar('nada');
    const lista = screen.getByRole('region', { name: 'Lista de tesoros' });
    expect(
      within(lista)
        .getAllByRole('group')
        .map((grupo) => grupo.getAttribute('aria-label')),
    ).toEqual(['Obligaciones', 'Compromisos', 'Ahorros', 'Superávit', 'Estante']);
    const compromisos = within(lista).getByRole('group', { name: 'Compromisos' });
    const hogar = within(compromisos).getByRole('button', { name: /^Hogar/ });
    expect(hogar).toHaveAccessibleName(/el 2 de la fila,\s*sueldo, por mes/);
    const ahorros = within(lista).getByRole('group', { name: 'Ahorros' });
    expect(within(ahorros).getByRole('button', { name: /^Cocos/ })).toHaveAccessibleName(
      /50% de lo que sobra/,
    );
  });

  it('sin nada elegido, el resumen del mes dice ingreso, obligaciones, compromisos, ahorro y superávit', () => {
    montar('nada');
    const mes = screen.getByRole('region', { name: 'Septiembre' });
    expect(within(mes).getByText(/^Ingreso en 0 cobros/)).toBeInTheDocument();
    expect(within(mes).getByText('Obligaciones apartadas')).toBeInTheDocument();
    expect(within(mes).getByText('Falta para los compromisos')).toBeInTheDocument();
    expect(within(mes).getByText('Ahorrado')).toBeInTheDocument();
    expect(within(mes).getByText('Superávit')).toBeInTheDocument();
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

  it('un paso dice su tipo y su lugar, y también se edita', () => {
    render(<Hoja elegido={`paso-${FIJOS}`} alEditarTesoro={() => undefined} />);
    const hoja = screen.getByRole('dialog', { name: 'Gastos fijos' });
    expect(
      within(hoja).getByText('Compromiso · 3 de 4', { selector: 'header span' }),
    ).toBeInTheDocument();
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
