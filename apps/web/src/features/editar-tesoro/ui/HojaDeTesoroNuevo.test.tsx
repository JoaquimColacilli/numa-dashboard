import { centavos, puntosBasicos, type Fila, type Moneda } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import {
  TABLAS_REPLICADAS,
  type Replica,
  type TablaReplicada,
  type TesoroNuevo,
} from '@/shared/api';

import type { DondeVa, LugarDelTesoro } from '../model/lugar';
import { HojaDeTesoroNuevo } from './HojaDeTesoroNuevo';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  crearTesoro: vi.fn(() => new Promise(() => undefined)),
}));

function filaDeTesoro(id: string, clave: string | null, nombre: string, tinta: string, orden = 0) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    meta_fecha: null,
    rinde_anual_bp: null,
    orden,
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
    a: { id: 'a', household_id: 'h', meta_cocos_centavos: 0, tasa_cocos_anual_bp: 0, fila: null },
  };
  const tesoros = [
    filaDeTesoro('01900000-0000-7000-8000-000000000001', 'hogar', 'Hogar', 'hogar'),
    filaDeTesoro('01900000-0000-7000-8000-000000000002', 'maun', 'Maun', 'maun'),
    filaDeTesoro('01900000-0000-7000-8000-000000000003', 'diezmo', 'Diezmo', 'diezmo'),
    filaDeTesoro('01900000-0000-7000-8000-000000000004', 'cocos', 'Cocos', 'cocos'),
    filaDeTesoro('01900000-0000-7000-8000-000000000006', null, 'Herramientas', 'grana', 4),
  ];
  tablas.tesoros = Object.fromEntries(tesoros.map((fila) => [fila.id, fila]));
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const FILA: Fila = {
  obligaciones: [
    {
      tesoro: '01900000-0000-7000-8000-000000000003',
      porcentaje: puntosBasicos(1000),
      base: 'ingreso',
      montoFijo: null,
    },
  ],
  pasos: [],
  reparto: [
    {
      tesoro: '01900000-0000-7000-8000-000000000006',
      porcentaje: puntosBasicos(8000),
      hastaLaMeta: false,
    },
  ],
  superavit: '01900000-0000-7000-8000-000000000002',
  sueldoPorTrabajo: false,
};

function montar(
  props: {
    fila?: Fila;
    lugarInicial?: LugarDelTesoro;
    despuesDe?: string | null;
    monedaInicial?: Moneda;
  } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  const alCrear =
    vi.fn<(tesoro: TesoroNuevo, dondeVa: DondeVa, despuesDe: string | null | undefined) => void>();
  render(
    <QueryClientProvider client={queryClient}>
      <ProveedorDeReplica replica={replicaDelTaller()}>
        <HojaDeTesoroNuevo alCerrar={alCerrar} alCrear={alCrear} {...props} />
      </ProveedorDeReplica>
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    alCrear,
    encoladas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => ({
          clave: mutacion.options.mutationKey,
          variables: mutacion.state.variables as TesoroNuevo,
        })),
  };
}

function elegirElTipo(tipo: RegExp) {
  fireEvent.click(
    within(screen.getByRole('group', { name: '¿Qué es?' })).getByRole('radio', { name: tipo }),
  );
}

function valoresDeComoRecibe(): string[] {
  return within(screen.getByRole('group', { name: '¿Cómo recibe plata?' }))
    .getAllByRole('radio')
    .map((opcion) => (opcion as HTMLInputElement).value);
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('la hoja de un tesoro nuevo', () => {
  it('pregunta primero qué es, y hasta elegirlo no se puede crear', () => {
    montar();
    const queEs = screen.getByRole('group', { name: '¿Qué es?' });
    expect(
      within(queEs)
        .getAllByRole('radio')
        .map((opcion) => opcion.closest('label')?.textContent),
    ).toEqual([
      'CajaStock del taller, una caja chica',
      'Deuda destinadaIngresos Brutos',
      'Deuda obligatoriaEl alquiler, los sueldos',
      'MetaUna máquina, el galpón',
    ]);
    expect(screen.queryByRole('textbox', { name: 'Nombre' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Crear el tesoro' })).toBeDisabled();

    elegirElTipo(/^Caja/);
    expect(screen.queryByRole('group', { name: '¿Qué es?' })).toBeNull();
    expect(screen.getByText('Caja', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear el tesoro' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(screen.getByRole('group', { name: '¿Qué es?' })).toBeInTheDocument();
  });

  it('pregunta la moneda: en dólares va solo al estante y la meta se escribe en dólares', () => {
    const { encoladas, alCrear } = montar({ fila: FILA, lugarInicial: 'reparto' });
    elegirElTipo(/^Meta/);
    const moneda = screen.getByRole('radiogroup', { name: '¿En qué moneda?' });
    expect(within(moneda).getByRole('radio', { name: 'Pesos' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(
      screen.getByText(
        'La moneda no se cambia después. Un tesoro en dólares va al estante: la fila reparte pesos.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^En el reparto/ })).toBeChecked();

    fireEvent.click(within(moneda).getByRole('radio', { name: 'Dólares' }));
    const lugares = screen.getByRole('group', { name: '¿Cómo recibe plata?' });
    expect(
      within(lugares)
        .getAllByRole('radio')
        .map((opcion) => opcion.closest('label')?.textContent),
    ).toEqual(['Al estanteLa fila reparte pesos: un tesoro en dólares queda en el estante.']);
    expect(within(lugares).getByRole('radio')).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Objetivo' })).toHaveAttribute(
      'placeholder',
      'US$ 0',
    );
    expect(screen.getByRole('radio', { name: 'Billetes' })).toBeChecked();

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Dólares' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Objetivo' }), {
      target: { value: '1.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(encoladas()[0]?.variables).toMatchObject({
      nombre: 'Dólares',
      moneda: 'USD',
      icono: 'banknote',
      meta_centavos: 100_000,
    });
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ moneda: 'USD' }),
      { lugar: 'estante' },
      undefined,
    );
  });

  it('uno en dólares es una caja o una meta: las deudas no se ofrecen', () => {
    montar({ monedaInicial: 'USD' });
    expect(screen.getByText('Caja', { selector: 'span' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    const queEs = within(screen.getByRole('group', { name: '¿Qué es?' }));
    expect(queEs.getByRole('radio', { name: /^Caja/ })).toBeEnabled();
    expect(queEs.getByRole('radio', { name: /^Deuda destinada/ })).toBeDisabled();
    expect(queEs.getByRole('radio', { name: /^Deuda obligatoria/ })).toBeDisabled();
    expect(queEs.getByRole('radio', { name: /^Meta/ })).toBeEnabled();
    expect(
      queEs.getByText('Un tesoro en dólares es una caja o una meta: la fila reparte pesos.'),
    ).toBeInTheDocument();
  });

  it('en pesos sigue como siempre y lo manda en pesos', () => {
    const { encoladas } = montar();
    elegirElTipo(/^Caja/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Vacaciones' },
    });
    expect(screen.queryByRole('textbox', { name: 'Objetivo' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Caja fuerte' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(encoladas()[0]?.variables).toMatchObject({
      nombre: 'Vacaciones',
      moneda: 'ARS',
      icono: 'vault',
      meta_centavos: null,
      meta_fecha: null,
    });
  });

  it('una meta pide el objetivo, y puede llevar para cuándo', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-26T15:00:00-03:00'));
    const { encoladas, alCrear } = montar();
    elegirElTipo(/^Meta/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Galpón' },
    });
    expect(screen.getByRole('textbox', { name: 'Objetivo' })).not.toHaveAttribute('placeholder');
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByRole('textbox', { name: 'Objetivo' })).toHaveAccessibleDescription(
      /Poné el objetivo: hasta cuánto junta\./,
    );
    expect(encoladas()).toEqual([]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Objetivo' }), {
      target: { value: '1.000.000' },
    });
    fireEvent.change(screen.getByLabelText('Para cuándo'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByLabelText('Para cuándo')).toHaveAccessibleDescription(
      /La fecha va de hoy en adelante\./,
    );
    expect(encoladas()).toEqual([]);

    fireEvent.change(screen.getByLabelText('Para cuándo'), { target: { value: '2027-06-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(encoladas()[0]?.variables).toMatchObject({
      nombre: 'Galpón',
      meta_centavos: 100_000_000,
      meta_fecha: '2027-06-30',
    });
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Galpón' }),
      { lugar: 'estante' },
      undefined,
    );
  });

  it('sin nombre no crea nada y lo dice en el campo', () => {
    const { encoladas, alCrear } = montar();
    elegirElTipo(/^Caja/);
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAccessibleDescription(
      'Ponele un nombre, de hasta 24 letras.',
    );
    expect(encoladas()).toEqual([]);
    expect(alCrear).not.toHaveBeenCalled();
  });

  it('muestra cómo se ve y avisa si otro usa el mismo color', () => {
    montar();
    elegirElTipo(/^Caja/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Vacaciones' },
    });
    expect(screen.getByText('Vacaciones', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mostaza' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Grana' }));
    expect(
      screen.getByText(/También la usa Herramientas: se distinguen por el nombre y el ícono\./),
    ).toBeInTheDocument();
  });

  it('crea el tesoro al final de los del dueño y le dice a la página dónde va', () => {
    const { encoladas, alCrear, alCerrar } = montar({ fila: FILA });
    elegirElTipo(/^Caja/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: ' Vacaciones ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Para qué es' }), {
      target: { value: 'El viaje de enero' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Petróleo' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Avión' }));

    const comoRecibe = screen.getByRole('group', { name: '¿Cómo recibe plata?' });
    fireEvent.click(within(comoRecibe).getByRole('radio', { name: /En el reparto/ }));
    const porcentaje = screen.getByRole('textbox', { name: 'Porcentaje de lo que sobra (%)' });
    expect(porcentaje).toHaveValue('10');
    expect(porcentaje).toHaveAccessibleDescription(
      'Queda libre el 20% del reparto: con 10%, Maun se queda con el otro 10%.',
    );
    fireEvent.change(porcentaje, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));

    const [alta] = encoladas();
    expect(alta?.clave).toEqual(['tesoros', 'crear']);
    expect(alta?.variables).toMatchObject({
      nombre: 'Vacaciones',
      descripcion: 'El viaje de enero',
      tinta: 'petroleo',
      icono: 'plane',
      meta_centavos: null,
      meta_fecha: null,
      orden: 5,
    });
    expect(alCrear).toHaveBeenCalledWith(
      alta?.variables,
      { lugar: 'reparto', porcentaje: 1500 },
      undefined,
    );
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it('cada tipo ofrece sus lugares: una caja también lo que sobra, una meta no', () => {
    montar({ fila: FILA });
    elegirElTipo(/^Caja/);
    expect(valoresDeComoRecibe()).toEqual(['estante', 'ahorro-fijo', 'reparto', 'superavit']);
    const comoRecibe = within(screen.getByRole('group', { name: '¿Cómo recibe plata?' }));
    expect(comoRecibe.getByRole('radio', { name: /Al estante/ })).toBeChecked();
    expect(
      comoRecibe.getByRole('radio', { name: /Recibe lo que sobra, en lugar de Maun/ }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    elegirElTipo(/^Meta/);
    expect(valoresDeComoRecibe()).toEqual(['estante', 'ahorro-fijo', 'reparto']);
  });

  it('una deuda obligatoria sugiere nombres, pide el tope y el día de pago, y se paga sola', () => {
    const { alCrear, encoladas } = montar({ fila: FILA });
    elegirElTipo(/^Deuda obligatoria/);
    expect(screen.queryByRole('group', { name: '¿Cómo recibe plata?' })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: '¿En qué moneda?' })).toBeNull();
    const sugeridos = screen.getByRole('group', { name: 'Nombres sugeridos' });
    expect(
      within(sugeridos)
        .getAllByRole('button')
        .map((boton) => boton.textContent),
    ).toEqual(['Gastos fijos', 'Sueldos', 'Alquiler', 'Cuotas']);
    fireEvent.click(within(sugeridos).getByRole('button', { name: 'Alquiler' }));
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Alquiler');
    expect(within(sugeridos).getByRole('button', { name: 'Alquiler' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Día de pago' })).toHaveValue('10');
    expect(screen.getByRole('switch', { name: 'Se paga sola' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Día de pago' }), {
      target: { value: '32' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(screen.getByRole('textbox', { name: 'Tope' })).toHaveAccessibleDescription(
      /Poné hasta cuánto recibe\./,
    );
    expect(screen.getByRole('textbox', { name: 'Día de pago' })).toHaveAccessibleDescription(
      /El día de pago va del 1 al 31\./,
    );
    expect(encoladas()).toEqual([]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Tope' }), {
      target: { value: '300.000' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Día de pago' }), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Se paga sola' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Alquiler', icono: 'building-2', moneda: 'ARS' }),
      { lugar: 'compromiso', monto: centavos(30_000_000), dia: 5, pagaSola: false },
      undefined,
    );
  });

  it('como deuda destinada, «Ingresos Brutos» se calcula sobre lo que cobrás y va antes del diezmo', () => {
    const { alCrear } = montar({ fila: FILA });
    elegirElTipo(/^Deuda destinada/);
    fireEvent.click(screen.getByRole('button', { name: 'Ingresos Brutos' }));
    const seLleva = screen.getByRole('radiogroup', { name: 'Se lleva' });
    expect(within(seLleva).getByRole('radio', { name: 'Un porcentaje' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const base = screen.getByRole('radiogroup', { name: 'Sobre qué se calcula' });
    expect(within(base).getByRole('radio', { name: 'Lo que cobrás' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Antes del diezmo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Porcentaje (%)' }), {
      target: { value: '3,5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ingresos Brutos', icono: 'landmark' }),
      {
        lugar: 'obligacion',
        porcentaje: 350,
        base: 'cobrado',
        antesDelDiezmo: true,
        montoFijo: null,
      },
      undefined,
    );
  });

  it('una deuda destinada también se lleva un monto fijo de cada cobro', () => {
    const { alCrear } = montar({ fila: FILA });
    elegirElTipo(/^Deuda destinada/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Préstamo' },
    });
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Se lleva' })).getByRole('radio', {
        name: 'Un monto fijo',
      }),
    );
    expect(screen.queryByRole('textbox', { name: 'Porcentaje (%)' })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: 'Sobre qué se calcula' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(
      screen.getByRole('textbox', { name: 'Monto de cada cobro' }),
    ).toHaveAccessibleDescription(/Poné hasta cuánto recibe\./);
    expect(alCrear).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Monto de cada cobro' }), {
      target: { value: '50.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Préstamo' }),
      {
        lugar: 'obligacion',
        porcentaje: 100,
        base: 'ingreso',
        antesDelDiezmo: false,
        montoFijo: centavos(5_000_000),
      },
      undefined,
    );
  });

  it('pedida desde un lugar de la fila, ya sabe qué es, dice dónde entra y entra ahí', () => {
    const { alCrear } = montar({ fila: FILA, lugarInicial: 'compromiso', despuesDe: null });
    expect(screen.queryByRole('group', { name: '¿Qué es?' })).toBeNull();
    expect(screen.getByText('Deuda obligatoria', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Al principio de su tipo')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Luz' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Tope' }), {
      target: { value: '50.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Luz' }),
      { lugar: 'compromiso', monto: centavos(5_000_000), dia: 10, pagaSola: true },
      null,
    );
  });

  it('pedida como ahorro fijo desde la fila, la caja entra ahí y dice dónde', () => {
    const { alCrear } = montar({ fila: FILA, lugarInicial: 'ahorro-fijo', despuesDe: null });
    elegirElTipo(/^Caja/);
    expect(screen.getByRole('radio', { name: /Como ahorro fijo/ })).toBeChecked();
    expect(screen.getByText('Al principio de su tipo')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Stock' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Monto' }), {
      target: { value: '50.000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Stock' }),
      { lugar: 'ahorro-fijo', monto: centavos(5_000_000) },
      null,
    );
  });

  it('al estante no toca la fila', () => {
    const { alCrear } = montar();
    elegirElTipo(/^Caja/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Auto' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear el tesoro' }));
    expect(alCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Auto' }),
      { lugar: 'estante' },
      undefined,
    );
  });
});
