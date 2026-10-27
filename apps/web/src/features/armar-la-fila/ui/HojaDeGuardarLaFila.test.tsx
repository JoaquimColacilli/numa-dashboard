import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import {
  TABLAS_REPLICADAS,
  type MovimientoNuevo,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import { formatearPesos } from '@/shared/lib';

import type { GuardadoDeLaFila } from '../api/mutacion';
import {
  borradorDeLaFila,
  cambiarElBorrador,
  descartarElBorrador,
  empezarElBorrador,
} from '../model/borrador';
import {
  conDia,
  conDiaDePago,
  conModo,
  conMontoFijo,
  conPagaSola,
  conRenglones,
  conSuperavit,
  conTope,
  moverUnLugar,
  sacar,
  sumarAlFinal,
  sumarAlReparto,
  sumarComoObligacion,
} from '../model/edicion';
import { vistaDeLaFila } from '../model/vista';
import { HojaDeGuardarLaFila } from './HojaDeGuardarLaFila';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  guardarLaFila: vi.fn(() => new Promise(() => undefined)),
  registrarMovimiento: vi.fn(() => new Promise(() => undefined)),
}));

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
  obligaciones: [
    { tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso', montoFijo: null },
  ],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
      dia: null,
      pagaSola: false,
      pagaSolaDesde: null,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(10_000_000),
      renglones: [{ nombre: 'Luz', monto: centavos(10_000_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
      dia: null,
      pagaSola: false,
      pagaSolaDesde: null,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
      dia: null,
      pagaSola: false,
      pagaSolaDesde: null,
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
    meta_fecha: null,
    orden: 0,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function transferencia(desde: string, hacia: string, monto: number, fecha: string) {
  return {
    id: `t-${hacia}`,
    household_id: 'h',
    fecha,
    tipo: 'transferencia',
    tesoro_origen: null,
    tesoro_destino: null,
    desde_id: desde,
    hacia_id: hacia,
    cubre_el_mes: null,
    vencimiento: null,
    monto_centavos: monto,
    monto_destino_centavos: null,
    categoria: '',
    descripcion: '',
    proyecto_id: null,
    created_at: `${fecha}T10:00:00Z`,
    updated_at: `${fecha}T10:00:00Z`,
    deleted_at: null,
    version: 1,
  };
}

function replicaDelTaller(movimientos: readonly ReturnType<typeof transferencia>[] = []): Replica {
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
  tablas.movimientos = Object.fromEntries(movimientos.map((uno) => [uno.id, uno]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function fila(): Fila {
  const actual = borradorDeLaFila();
  if (actual === null) throw new Error('No hay borrador');
  return actual.fila;
}

function montar(
  monto: number | null = null,
  movimientos: readonly ReturnType<typeof transferencia>[] = [],
) {
  const replica = replicaDelTaller(movimientos);
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replica}>
        <HojaDeGuardarLaFila
          vista={vistaDeLaFila(replica, borradorDeLaFila(), HOY)}
          monto={monto === null ? null : centavos(monto)}
          alCerrar={alCerrar}
        />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    encoladas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[0] === 'ajustes')
        .map((mutacion) => mutacion.state.variables as GuardadoDeLaFila),
    movimientos: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.[0] === 'movimientos')
        .map((mutacion) => mutacion.state.variables as MovimientoNuevo),
  };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  descartarElBorrador();
  vi.unstubAllGlobals();
});

function iconosDeLosCambios(): string[] {
  const lista = screen.getByRole('region', { name: /Cambia/ }).querySelector('ul');
  if (lista === null) return [];
  return [...lista.querySelectorAll('li')].map((renglon) => {
    const clases = renglon.querySelector('svg')?.getAttribute('class') ?? '';
    return clases.split(' ').find((clase) => clase.startsWith('lucide-')) ?? '';
  });
}

describe('la hoja de guardar la fila', () => {
  it('dice la revisión que va a ser y un renglón por cambio, cada uno con su ícono', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    cambiarElBorrador(sumarAlFinal(fila(), HERRAMIENTAS, null, centavos(10_000_000)));
    cambiarElBorrador(moverUnLugar(fila(), FIJOS, -1));
    cambiarElBorrador(
      conRenglones(fila(), FIJOS, [
        { nombre: 'Luz y gas', monto: centavos(10_000_000), dia: null },
      ]),
    );
    cambiarElBorrador(sacar(fila(), INMUEBLES));
    cambiarElBorrador({
      ...fila(),
      reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(6000), hastaLaMeta: false }],
    });
    montar();

    expect(screen.getByText('Pasa a ser la revisión 5')).toBeInTheDocument();
    expect(screen.getByText('Cambian 7 cosas')).toBeInTheDocument();
    expect(iconosDeLosCambios().sort()).toEqual(
      [
        'lucide-arrow-up-down',
        'lucide-arrow-up-down',
        'lucide-list-checks',
        'lucide-minus',
        'lucide-percent',
        'lucide-plus',
        'lucide-ruler',
      ].sort(),
    );
    expect(screen.getByText(/: de \$\s?300\.000 a \$\s?350\.000 por mes\./)).toBeInTheDocument();
    expect(
      screen.getByText(/entra como ahorro fijo 5, con \$\s?100\.000 por mes\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/sale del reparto y vuelve al estante\./)).toBeInTheDocument();
  });

  it('las obligaciones, los modos, los días y el superávit llevan su renglón', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(
      sumarComoObligacion(fila(), HERRAMIENTAS, {
        porcentaje: puntosBasicos(350),
        base: 'cobrado',
        posicion: 0,
      }),
    );
    cambiarElBorrador(conModo(fila(), FIJOS, 'saldo'));
    cambiarElBorrador(conDia(fila(), FIJOS, 0, 10));
    cambiarElBorrador(sacar(fila(), INMUEBLES));
    cambiarElBorrador(conSuperavit(fila(), INMUEBLES));
    montar();

    const renglones = within(screen.getByRole('region', { name: /Cambia/ })).getAllByRole(
      'listitem',
    );
    expect(renglones.map((renglon) => renglon.textContent.replace(/\s/g, ' '))).toEqual([
      'Herramientas entra como obligación 1, con el 3,5% sobre lo que cobrás.',
      'Gastos fijos cambia los días de pago.',
      'Gastos fijos ahora se renueva al pagar.',
      'Inmuebles sale del reparto y vuelve al estante.',
      'Inmuebles recibe lo que sobra, en lugar de Maun.',
    ]);
    expect(iconosDeLosCambios()).toEqual([
      'lucide-plus',
      'lucide-calendar',
      'lucide-refresh-cw',
      'lucide-minus',
      'lucide-coins',
    ]);
  });

  it('sacar un paso de la fila y sumar un tesoro al reparto llevan su renglón', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sacar(fila(), MATERIALES));
    cambiarElBorrador(sumarAlReparto(fila(), HERRAMIENTAS, puntosBasicos(1000)));
    montar();

    expect(screen.getByText('Cambian 2 cosas')).toBeInTheDocument();
    expect(iconosDeLosCambios()).toEqual(['lucide-minus', 'lucide-plus']);
    const renglones = within(screen.getByRole('region', { name: /Cambia/ })).getAllByRole(
      'listitem',
    );
    expect(renglones.map((renglon) => renglon.textContent)).toEqual([
      'Materiales vuelve al estante con lo que tiene.',
      'Herramientas entra al reparto con el 10% de lo que sobra.',
    ]);
  });

  it('compara el mismo cobro solo con los tesoros que cambian', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    montar();

    expect(screen.getByText(/Con un cobro de \$\s?2\.000\.000/)).toBeInTheDocument();
    const tabla = screen.getByRole('table');
    const nombres = within(tabla)
      .getAllByRole('rowheader')
      .map((celda) => celda.textContent);
    expect(nombres).toEqual(['Maun', 'Cocos', 'Materiales', 'Inmuebles']);
    const materiales = within(tabla).getByRole('row', { name: /Materiales/ });
    expect(materiales).toHaveTextContent(/300\.000.*350\.000/);
  });

  it('con un monto probado, compara con ese cobro', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    montar(300_000_000);
    expect(screen.getByText(/Con un cobro de \$\s?3\.000\.000/)).toBeInTheDocument();
  });

  it('avisa sin frenar si un paso queda con monto $ 0', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(sumarAlFinal(fila(), HERRAMIENTAS, null));
    montar();
    expect(screen.getByText(/queda con monto \$\s?0/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar la fila' })).toBeEnabled();
  });

  it('guarda con la versión que vio, con la fecha del tope y deja de editar', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conTope(fila(), MATERIALES, centavos(35_000_000)));
    const { encoladas, alCerrar } = montar();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar la fila' }));

    const [guardado] = encoladas();
    expect(guardado?.ajustesId).toBe('a');
    expect(guardado?.fila?.obligaciones).toEqual(GUARDADA.obligaciones);
    expect(guardado?.fila?.superavit).toBe(MAUN);
    expect(guardado?.version).toBe(4);
    expect(guardado?.fila?.pasos.find((paso) => paso.tesoro === MATERIALES)).toMatchObject({
      tope: 35_000_000,
      desde: '2026-09',
    });
    expect(guardado?.previa).toEqual({
      fila: GUARDADA,
      fila_version: 4,
      fila_guardada_at: '2026-09-01T12:00:00Z',
    });
    expect(alCerrar).toHaveBeenCalled();
    expect(borradorDeLaFila()).toBeNull();
  });

  it('el monto fijo, el día de pago y «se paga sola» llevan su renglón', () => {
    empezarElBorrador('a', 4, {
      ...GUARDADA,
      obligaciones: [
        { tesoro: HERRAMIENTAS, porcentaje: puntosBasicos(350), base: 'cobrado', montoFijo: null },
        ...GUARDADA.obligaciones,
      ],
    });
    cambiarElBorrador(conMontoFijo(fila(), HERRAMIENTAS, centavos(5_000_000)));
    cambiarElBorrador(conDiaDePago(fila(), FIJOS, 15));
    cambiarElBorrador(conPagaSola(fila(), FIJOS, true, HOY));
    montar();

    const renglones = within(screen.getByRole('region', { name: /Cambia/ })).getAllByRole(
      'listitem',
    );
    expect(renglones.map((renglon) => renglon.textContent.replace(/\s/g, ' '))).toEqual([
      `Herramientas se lleva ${formatearPesos(5_000_000).replace(/\s/g, ' ')} fijos de cada cobro.`,
      'Gastos fijos se paga el 15 de cada mes.',
      'Gastos fijos se paga sola el día de pago.',
    ]);
    expect(iconosDeLosCambios()).toEqual([
      'lucide-coins',
      'lucide-calendar',
      'lucide-calendar-check',
    ]);
  });

  it('con un compromiso que pasa a pagarse solo y plata de antes, no guarda hasta elegir qué hacer con ella', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conDiaDePago(fila(), FIJOS, 10));
    cambiarElBorrador(conPagaSola(fila(), FIJOS, true, '2026-09-20'));
    const { encoladas, movimientos } = montar(null, [
      transferencia(MAUN, FIJOS, 5_000_000, '2026-09-01'),
    ]);

    expect(screen.getByText(/se paga solo desde el 10 de octubre/)).toHaveTextContent(
      'Gastos fijos se paga solo desde el 10 de octubre: ese día NUMA anota el pago y, si no juntó el tope, lo que falta lo pone Maun.',
    );
    const plataDeAntes = screen.getByRole('group', {
      name: `Gastos fijos tiene ${formatearPesos(5_000_000)} de antes de su ciclo. ¿Qué hacés con esa plata?`,
    });
    expect(
      within(plataDeAntes)
        .getAllByRole('radio')
        .map((opcion) => opcion.closest('label')?.textContent),
    ).toEqual([
      'Pasarla a Maun',
      'Pasarla a otro tesoro',
      'Ya no estáSale del saldo con un ajuste: es plata que ya no tenés.',
    ]);
    const guardar = screen.getByRole('button', { name: 'Guardar la fila' });
    expect(guardar).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Elegí qué hacer con la plata de antes para poder guardar.',
    );

    fireEvent.click(within(plataDeAntes).getByRole('radio', { name: 'Pasarla a otro tesoro' }));
    const aCual = screen.getByRole('combobox', {
      name: 'A qué tesoro pasás la plata de Gastos fijos',
    });
    expect(
      within(aCual)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Elegí uno', 'Hogar', 'Cocos', 'Materiales', 'Herramientas', 'Inmuebles']);
    expect(guardar).toBeDisabled();
    fireEvent.change(aCual, { target: { value: HERRAMIENTAS } });
    expect(guardar).toBeEnabled();
    expect(screen.queryByRole('status')).toBeNull();

    fireEvent.click(guardar);

    const [guardado] = encoladas();
    expect(guardado?.fila?.pasos.find((paso) => paso.tesoro === FIJOS)).toMatchObject({
      modo: 'mes',
      dia: 10,
      pagaSola: true,
      pagaSolaDesde: HOY,
    });
    expect(guardado?.fila?.pasos.find((paso) => paso.tesoro === HOGAR)).toMatchObject({
      pagaSola: false,
      pagaSolaDesde: null,
    });
    expect(movimientos()).toEqual([
      {
        id: expect.any(String) as string,
        fecha: HOY,
        tipo: 'transferencia',
        monto_centavos: 5_000_000,
        desde_id: FIJOS,
        hacia_id: HERRAMIENTAS,
        categoria: 'Plata de antes de su ciclo',
        descripcion: '',
      },
    ]);
  });

  it('la plata de antes que ya no está sale con un ajuste, y sin plata de antes no pregunta nada', () => {
    empezarElBorrador('a', 4, GUARDADA);
    cambiarElBorrador(conDiaDePago(fila(), FIJOS, 10));
    cambiarElBorrador(conPagaSola(fila(), FIJOS, true, HOY));
    const { movimientos } = montar(null, [transferencia(MAUN, FIJOS, 5_000_000, '2026-09-01')]);

    fireEvent.click(screen.getByRole('radio', { name: /^Ya no está/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar la fila' }));

    expect(movimientos()).toEqual([
      expect.objectContaining({
        tipo: 'ajuste',
        monto_centavos: 5_000_000,
        desde_id: FIJOS,
        hacia_id: null,
        categoria: 'Ya no está',
      }) as MovimientoNuevo,
    ]);
  });

  it('dice que el sueldo pasa a contarse por mes', () => {
    empezarElBorrador('a', 0, { ...GUARDADA, sueldoPorTrabajo: true });
    montar();
    expect(screen.getByText(/El sueldo pasa a contarse por mes/)).toBeInTheDocument();
    expect(screen.getByText('Cambia una cosa')).toBeInTheDocument();
  });
});
