import { centavos } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EdicionDeMovimiento } from '@/entities/movimiento';
import type { TesoroDelTaller } from '@/entities/tesoro';
import type { FilaDe, MovimientoNuevo, Tesoro } from '@/shared/api';
import type { TintaDeTesoro } from '@/shared/lib';

import { HojaDeMovimiento, type HojaDeMovimientoProps } from './HojaDeMovimiento';

const ID = {
  hogar: '0192aaaa-0000-7000-8000-000000000001',
  maun: '0192aaaa-0000-7000-8000-000000000002',
  diezmo: '0192aaaa-0000-7000-8000-000000000003',
  cocos: '0192aaaa-0000-7000-8000-000000000004',
  materiales: '0192aaaa-0000-7000-8000-000000000005',
  herramientas: '0192aaaa-0000-7000-8000-000000000006',
};

function tesoro(
  id: string,
  clave: Tesoro | null,
  nombre: string,
  tinta: TintaDeTesoro,
  saldo: number,
  archivado = false,
): TesoroDelTaller {
  return {
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado,
    saldo: centavos(saldo),
  };
}

const TESOROS: readonly TesoroDelTaller[] = [
  tesoro(ID.hogar, 'hogar', 'Hogar', 'hogar', 10_000_000),
  tesoro(ID.maun, 'maun', 'Maun', 'maun', 50_000_000),
  tesoro(ID.diezmo, 'diezmo', 'Diezmo', 'diezmo', 3_000_000),
  tesoro(ID.cocos, 'cocos', 'Cocos', 'cocos', 20_000_000),
  tesoro(ID.materiales, null, 'Materiales', 'mostaza', 5_000_000),
  tesoro(ID.herramientas, null, 'Herramientas', 'grana', 0, true),
];

const DE_SIEMPRE: readonly TesoroDelTaller[] = [
  tesoro('hogar', 'hogar', 'Hogar', 'hogar', 0),
  tesoro('maun', 'maun', 'Maun', 'maun', 0),
  tesoro('diezmo', 'diezmo', 'Diezmo', 'diezmo', 0),
  tesoro('cocos', 'cocos', 'Cocos', 'cocos', 0),
];

function montar(props: Partial<HojaDeMovimientoProps> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <HojaDeMovimiento
        tesoros={TESOROS}
        tesorosSincronizados
        metaCocos={0}
        alCerrar={alCerrar}
        {...props}
      />
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    enviados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => mutacion.state.variables),
  };
}

function grupo(nombre: string): HTMLElement {
  return screen.getByRole('group', { name: nombre });
}

function nombresDe(elemento: HTMLElement): string[] {
  return within(elemento)
    .getAllByRole('button')
    .map((boton) => boton.textContent);
}

function escribirElMonto(texto: string): void {
  fireEvent.paste(screen.getByRole('textbox', { name: 'Cuánta plata' }), {
    clipboardData: { getData: () => texto },
  });
}

function cargar(): void {
  fireEvent.click(
    screen.getByRole('button', { name: /^(Cargar el movimiento|Guardar los cambios)$/ }),
  );
}

function movimiento(extra: Partial<FilaDe<'movimientos'>>): FilaDe<'movimientos'> {
  return {
    id: 'm1',
    household_id: 'h',
    fecha: '2026-09-20',
    tipo: 'transferencia',
    tesoro_origen: 'maun',
    tesoro_destino: null,
    desde_id: ID.maun,
    hacia_id: ID.materiales,
    cubre_el_mes: null,
    monto_centavos: 15_000_000,
    categoria: '',
    descripcion: 'Para los materiales',
    proyecto_id: null,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

beforeEach(() => {
  onlineManager.setOnline(false);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
  vi.unstubAllGlobals();
});

describe('la hoja de un movimiento entre tesoros', () => {
  it('es la novena clase: dos selectores con los tesoros vivos, sin el diezmo y sin el mismo en los dos lados', () => {
    montar();
    fireEvent.click(screen.getByRole('radio', { name: 'Entre tesoros' }));

    expect(screen.getByRole('radio', { name: 'Entre tesoros' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(nombresDe(grupo('Sale de'))).toEqual(['Hogar', 'Maun', 'Cocos', 'Materiales']);
    expect(nombresDe(grupo('Entra a'))).toEqual(['Hogar', 'Cocos', 'Materiales']);
    expect(within(grupo('Sale de')).getByRole('button', { name: 'Maun' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo('Entra a')).getByRole('button', { name: 'Materiales' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/Pasa de Maun a Materiales/)).toBeInTheDocument();
  });

  it('elegir como origen el que ya era el destino da vuelta el pase', () => {
    montar({ claseInicial: 'entre_tesoros' });
    fireEvent.click(within(grupo('Sale de')).getByRole('button', { name: 'Materiales' }));

    expect(within(grupo('Sale de')).getByRole('button', { name: 'Materiales' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(nombresDe(grupo('Entra a'))).toEqual(['Hogar', 'Maun', 'Cocos']);
    expect(within(grupo('Entra a')).getByRole('button', { name: 'Maun' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('manda los dos ids, y la clave del que es de los de siempre', () => {
    const { enviados, alCerrar } = montar({ claseInicial: 'entre_tesoros' });
    escribirElMonto('150.000');
    cargar();

    expect(alCerrar).toHaveBeenCalled();
    const [nuevo] = enviados() as MovimientoNuevo[];
    expect(nuevo).toMatchObject({
      tipo: 'transferencia',
      tesoro_origen: 'maun',
      tesoro_destino: null,
      desde_id: ID.maun,
      hacia_id: ID.materiales,
      monto_centavos: 15_000_000,
    });
  });

  it('sin los tesoros en la réplica, manda solo las claves', () => {
    const { enviados } = montar({
      claseInicial: 'entre_tesoros',
      tesoros: DE_SIEMPRE,
      tesorosSincronizados: false,
    });
    fireEvent.click(within(grupo('Entra a')).getByRole('button', { name: 'Cocos' }));
    escribirElMonto('1.000');
    cargar();

    const [nuevo] = enviados() as MovimientoNuevo[];
    expect(nuevo).toMatchObject({
      tipo: 'transferencia',
      tesoro_origen: 'maun',
      tesoro_destino: 'cocos',
    });
    expect(nuevo).not.toHaveProperty('desde_id');
    expect(nuevo).not.toHaveProperty('hacia_id');
  });

  it('una clase de las de siempre también manda los dos lados con su id', () => {
    const { enviados } = montar({ claseInicial: 'gasto_hogar' });
    escribirElMonto('2.500');
    cargar();

    expect((enviados() as MovimientoNuevo[])[0]).toMatchObject({
      tipo: 'gasto',
      tesoro_origen: 'hogar',
      desde_id: ID.hogar,
      tesoro_destino: null,
      hacia_id: null,
    });
  });

  it('al editar arranca con los lados del movimiento y manda los dos juntos, con lo que había', () => {
    const { enviados } = montar({ movimiento: movimiento({}) });

    expect(screen.getByRole('radio', { name: 'Entre tesoros' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(within(grupo('Entra a')).getByRole('button', { name: 'Materiales' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Gasto' }));
    cargar();

    const [edicion] = enviados() as EdicionDeMovimiento[];
    expect(edicion?.cambios).toMatchObject({
      tipo: 'gasto',
      tesoro_origen: 'hogar',
      desde_id: ID.hogar,
      tesoro_destino: null,
      hacia_id: null,
    });
    expect(edicion?.previos).toMatchObject({
      tipo: 'transferencia',
      tesoro_origen: 'maun',
      desde_id: ID.maun,
      tesoro_destino: null,
      hacia_id: ID.materiales,
    });
  });

  it('un tesoro archivado no se ofrece, salvo en el movimiento que ya lo usa', () => {
    montar({ movimiento: movimiento({ hacia_id: ID.herramientas }) });
    expect(nombresDe(grupo('Sale de'))).toContain('Herramientas');
    cleanup();

    montar({ claseInicial: 'entre_tesoros' });
    expect(nombresDe(grupo('Sale de'))).not.toContain('Herramientas');
  });

  it('lo que cubre el faltante de un mes sigue siendo entre tesoros', () => {
    montar({ movimiento: movimiento({ cubre_el_mes: '2026-09-01' }) });
    expect(screen.getByRole('radio', { name: 'Gasto' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Entre tesoros' })).toBeEnabled();
    expect(screen.getByText(/gastos fijos de septiembre/)).toBeInTheDocument();
  });
});

function categorias(): string[] {
  return within(screen.getByRole('combobox', { name: 'Categoría' }))
    .getAllByRole('option')
    .map((opcion) => opcion.textContent);
}

describe('la hoja de un gasto de un tesoro', () => {
  it('es la décima clase: sale de un tesoro del dueño, con los renglones si es un compromiso', () => {
    montar({
      claseInicial: 'gasto_tesoro',
      renglones: new Map([[ID.materiales, ['Placas', 'Herrajes']]]),
    });
    expect(nombresDe(grupo('Detalle del tipo'))).toEqual([
      'Del hogar',
      'Del taller',
      'De un tesoro',
    ]);
    expect(nombresDe(grupo('Sale de'))).toEqual(['Materiales']);
    expect(categorias()).toEqual(['Placas', 'Herrajes', 'Otro']);
    expect(screen.getByText(/Sale de Materiales y se va/)).toBeInTheDocument();
  });

  it('abre con el tesoro, el monto y la categoría puestos, y manda el gasto desde su id', () => {
    const { enviados, alCerrar } = montar({
      claseInicial: 'gasto_tesoro',
      tesoroInicial: ID.materiales,
      montoInicial: 50_000_000,
      categoriaInicial: 'Alquiler',
    });
    expect(categorias()).toContain('Alquiler');
    cargar();

    expect(alCerrar).toHaveBeenCalled();
    expect((enviados() as MovimientoNuevo[])[0]).toMatchObject({
      tipo: 'gasto',
      tesoro_origen: null,
      desde_id: ID.materiales,
      tesoro_destino: null,
      hacia_id: null,
      monto_centavos: 50_000_000,
      categoria: 'Alquiler',
    });
  });

  it('desde Maun el pago va como gasto del taller, con la categoría que se le pasó', () => {
    const { enviados } = montar({
      claseInicial: 'gasto_maun',
      montoInicial: 10_000,
      categoriaInicial: 'Costos fijos',
    });
    cargar();
    expect((enviados() as MovimientoNuevo[])[0]).toMatchObject({
      tipo: 'gasto',
      tesoro_origen: 'maun',
      desde_id: ID.maun,
      categoria: 'Costos fijos',
      monto_centavos: 10_000,
    });
  });

  it('el pago de un vencimiento de un mes que ya pasó arranca con su día; uno que no llegó, no', () => {
    const { enviados } = montar({
      claseInicial: 'gasto_tesoro',
      tesoroInicial: ID.materiales,
      montoInicial: 50_000_000,
      categoriaInicial: 'Alquiler',
      fechaInicial: '2026-08-10',
    });
    expect(screen.getByLabelText('Otra fecha')).toHaveValue('2026-08-10');
    cargar();
    expect((enviados() as MovimientoNuevo[])[0]).toMatchObject({
      fecha: '2026-08-10',
      categoria: 'Alquiler',
    });
    cleanup();

    montar({ claseInicial: 'gasto_tesoro', fechaInicial: '2999-01-01' });
    expect(screen.getByLabelText('Otra fecha')).not.toHaveValue('2999-01-01');
  });

  it('al editar un gasto de un tesoro arranca con ese tesoro elegido', () => {
    montar({
      movimiento: movimiento({
        tipo: 'gasto',
        tesoro_origen: null,
        desde_id: ID.materiales,
        hacia_id: null,
        categoria: 'Compra',
      }),
    });
    expect(
      within(grupo('Detalle del tipo')).getByRole('button', { name: 'De un tesoro' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(grupo('Sale de')).getByRole('button', { name: 'Materiales' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('sin un tesoro del dueño no se ofrece', () => {
    montar({ tesoros: DE_SIEMPRE, tesorosSincronizados: false });
    fireEvent.click(screen.getByRole('radio', { name: 'Gasto' }));
    expect(nombresDe(grupo('Detalle del tipo'))).toEqual(['Del hogar', 'Del taller']);
  });

  it('sin tesoro elegido no carga y lo dice', () => {
    const { enviados } = montar({ claseInicial: 'gasto_tesoro', tesoros: DE_SIEMPRE });
    escribirElMonto('1.000');
    cargar();
    expect(screen.getByText('Elegí de qué tesoro sale la plata.')).toBeInTheDocument();
    expect(enviados()).toEqual([]);
  });
});
