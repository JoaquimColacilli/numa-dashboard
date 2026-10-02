import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LiquidacionDeProyecto, Proyecto, ResumenDeProyecto } from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { PantallaDeLiquidacion } from './PantallaDeLiquidacion';

const HOY = '2026-09-27';
const DIA_DEL_PAGO = '2026-09-23';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(300_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(200_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(200_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

const PROYECTO = {
  ...METADATOS,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Placard de tres puertas',
  estado: 'entregado',
  version: 5,
  presupuesto_centavos: 1_000_000,
  fecha_cobro: null,
  dist_cobrado_centavos: null,
  dist_fila_version: null,
  reapertura_fecha_cobro: null,
  reapertura_objetivo_sueldo_centavos: null,
  reapertura_objetivo_fijos_centavos: null,
  reapertura_sueldo_mensual: null,
  reapertura_fila: null,
  reparto_ya_en_la_apertura: false,
} as unknown as Proyecto;

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

function taller({ conTesoros = true }: { conTesoros?: boolean } = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    sueldo_mensual_centavos: 300_000,
    costos_fijos_centavos: 200_000,
    sueldo_tope_mensual: true,
    perdido_con_sueldo: false,
    perdido_con_diezmo: true,
    fila: (conTesoros ? FILA : null) as unknown as FilaDe<'ajustes'>['fila'],
    fila_version: 4,
    fila_guardada_at: null,
  } as unknown as FilaDe<'ajustes'>);
  if (conTesoros) {
    for (const fila of [
      tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
      tesoro(MAUN, 'maun', 'Maun', 'maun'),
      tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
      tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
      tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
    ]) {
      replica = aplicarFilaLocal(replica, 'tesoros', fila);
    }
  }
  replica = aplicarFilaLocal(replica, 'proyectos', PROYECTO);
  return aplicarFilaLocal(replica, 'pagos', {
    ...METADATOS,
    id: 'pago',
    proyecto_id: 'p',
    fecha: DIA_DEL_PAGO,
    concepto: 'Todo junto',
    monto_centavos: 1_000_000,
    ya_en_la_apertura: false,
    moneda: 'ARS',
    cotizacion_centavos: null,
    tesoro_id: null,
  });
}

const RESUMEN = {
  proyecto: PROYECTO,
  cliente: undefined,
  nombreDelCliente: 'Marcela Duarte',
  fase: 'activos',
  presupuesto: centavos(1_000_000),
  cobrado: centavos(1_000_000),
  gastos: centavos(0),
  saldo: centavos(0),
  entrega: { fecha: null, comprometida: false, franja: null },
  urgencia: undefined,
} as unknown as ResumenDeProyecto;

function montar(replica: Replica, resumen = RESUMEN) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={['/proyectos/p/cobrar']}>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <PantallaDeLiquidacion resumen={resumen} destino="cobrado" />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return {
    liquidaciones: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[1] === 'liquidar')
        .map((mutacion) => mutacion.state.variables as LiquidacionDeProyecto),
  };
}

function botonDeCobrar(): HTMLElement {
  return screen.getByRole('button', { name: /^Cobrar y repartir/ });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
  onlineManager.setOnline(false);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('cobrar por la fila', () => {
  it('muestra una línea por paso y por parte con su tesoro, y lo que recibe cada uno', () => {
    montar(taller());

    const despiece = screen.getByRole('region', { name: 'Distribución del ingreso' });
    const renglones = within(despiece).getAllByRole('listitem');
    expect(renglones.map((renglon) => renglon.firstElementChild?.nextSibling?.textContent)).toEqual(
      [
        'Diezmo 10% sobre el ingreso',
        'Sueldoa HOGAR',
        'Gastos fijos',
        '50% de lo que sobraa COCOS',
        'El restoa MAUN',
      ],
    );
    expect(
      within(despiece)
        .getAllByRole('group')
        .map((grupo) => grupo.getAttribute('aria-label')),
    ).toEqual(['Obligaciones', 'Compromisos', 'Ahorros', 'Superávit']);
    expect(despiece).not.toHaveTextContent('cuatro tesoros');
    expect(
      screen.getByText(/^Se reparte el ingreso/, { exact: false }).textContent.replace(/\s+/g, ' '),
    ).toBe(
      'Se reparte el ingreso de este trabajo: $ 10.000 (lo cobrado menos los gastos). Van $ 1.000 a Diezmo, $ 3.000 a Hogar, $ 2.000 a Gastos fijos, $ 2.000 a Cocos y $ 2.000 a Maun. Los saldos de los tesoros se mueven con esto. Si te equivocaste, se reabre desde la ficha y el reparto se deshace.',
    );
    expect(screen.queryByText(/ganancia/i)).toBeNull();
    expect(botonDeCobrar()).toBeEnabled();
  });

  it('al confirmar manda el pedido por la fila con un id por reparto y las filas optimistas', () => {
    const { liquidaciones } = montar(taller());
    fireEvent.click(botonDeCobrar());

    const [enviada] = liquidaciones();
    expect(enviada).toBeDefined();
    if (enviada === undefined) return;

    const { pedido, optimista, repartos = [], plan } = enviada;
    expect(pedido).toMatchObject({
      proyectoId: 'p',
      version: 5,
      destino: 'cobrado',
      fecha: DIA_DEL_PAGO,
      cobradoCentavos: 1_000_000,
      sueldoCentavos: 0,
      fijosCentavos: 0,
      remanenteCentavos: 900_000,
    });
    const viajan = pedido.porLaFila?.repartos ?? [];
    expect(pedido.porLaFila?.version).toBe(4);
    expect(viajan.map((uno) => [uno.posicion, uno.tesoro_id, uno.monto_centavos])).toEqual([
      [1, HOGAR, 300_000],
      [2, FIJOS, 200_000],
      [3, COCOS, 200_000],
    ]);
    for (const uno of viajan) expect(uno.id).toMatch(UUID);
    expect(new Set(viajan.map((uno) => uno.id)).size).toBe(3);

    expect(repartos.map((fila) => [fila.id, fila.posicion, fila.nombre, fila.tipo])).toEqual([
      [viajan[0]?.id, 1, 'Hogar', 'paso'],
      [viajan[1]?.id, 2, 'Gastos fijos', 'paso'],
      [viajan[2]?.id, 3, 'Cocos', 'parte'],
    ]);
    expect(optimista).toMatchObject({
      estado: 'cobrado',
      version: 6,
      dist_fila_version: 4,
      dist_remanente_centavos: 900_000,
    });
    expect(plan?.pasos.map((paso) => paso.tesoro)).toEqual([HOGAR, FIJOS]);
    expect(plan?.reparto).toEqual([{ tesoro: COCOS, porcentaje: 5000, hastaLaMeta: false }]);
    expect(plan?.obligaciones).toEqual([
      { tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso', diezmo: true },
    ]);
  });

  it('un reabierto que se había cobrado por trabajo descuenta lo que el sueldo ya recibió ese mes', () => {
    const reabierto = {
      ...PROYECTO,
      reapertura_fecha_cobro: '2026-09-20',
      reapertura_objetivo_sueldo_centavos: 300_000,
      reapertura_objetivo_fijos_centavos: 0,
      reapertura_sueldo_mensual: true,
      reapertura_fila: {
        version: 0,
        fila: {
          ...FILA,
          pasos: FILA.pasos.filter((paso) => paso.clase === 'sueldo'),
          reparto: [],
          sueldoPorTrabajo: true,
        },
      },
    } as unknown as Proyecto;
    let replica = aplicarFilaLocal(taller(), 'proyectos', reabierto);
    replica = aplicarFilaLocal(replica, 'gastos', {
      ...METADATOS,
      id: 'gasto',
      proyecto_id: 'p',
      fecha: DIA_DEL_PAGO,
      descripcion: 'Placas',
      monto_centavos: 700_000,
    });
    replica = aplicarFilaLocal(replica, 'proyectos', {
      ...PROYECTO,
      id: 'antes',
      estado: 'cobrado',
      fecha_cobro: '2026-09-05',
      dist_cobrado_centavos: 300_000,
      dist_fila_version: 4,
    } as unknown as Proyecto);
    replica = aplicarFilaLocal(replica, 'repartos', {
      ...METADATOS,
      id: 'r-antes',
      proyecto_id: 'antes',
      posicion: 1,
      tesoro_id: HOGAR,
      nombre: 'Hogar',
      tipo: 'paso',
      clase: 'sueldo',
      modo: 'mes',
      base: null,
      objetivo_centavos: 300_000,
      previo_centavos: 0,
      tope_centavos: 300_000,
      por_mes: true,
      porcentaje_bp: null,
      monto_centavos: 200_000,
      fecha: '2026-09-05',
      ya_en_la_apertura: false,
    });
    const { liquidaciones } = montar(replica, {
      ...RESUMEN,
      proyecto: reabierto,
      gastos: centavos(700_000),
    });

    const despiece = screen.getByRole('region', { name: 'Distribución del ingreso' });
    expect(despiece).not.toHaveTextContent('faltan');
    expect(
      screen.getByText(/^Se reparte el ingreso/, { exact: false }).textContent.replace(/\s+/g, ' '),
    ).toContain('Van $ 300 a Diezmo, $ 1.000 a Hogar y $ 1.700 a Maun.');

    fireEvent.click(botonDeCobrar());
    const [enviada] = liquidaciones();
    expect(enviada?.pedido).toMatchObject({
      fecha: '2026-09-20',
      remanenteCentavos: 270_000,
      porLaFila: { version: 0, previo: { [HOGAR]: 200_000 } },
    });
    expect(
      enviada?.pedido.porLaFila?.repartos.map((uno) => [uno.tesoro_id, uno.monto_centavos]),
    ).toEqual([[HOGAR, 100_000]]);
  });

  it('sin los tesoros del taller todavía, no deja cobrar y dice por qué', () => {
    const { liquidaciones } = montar(taller({ conTesoros: false }));

    expect(botonDeCobrar()).toBeDisabled();
    const aviso = screen.getByText(/Estamos trayendo los tesoros del taller/);
    expect(botonDeCobrar()).toHaveAttribute('aria-describedby', aviso.id);
    fireEvent.click(botonDeCobrar());
    expect(liquidaciones()).toEqual([]);
  });
});
