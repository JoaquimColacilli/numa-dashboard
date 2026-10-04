import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  gastoVacio,
  pagoVacio,
  valoresDelFormulario,
  type FilaDeGasto,
  type FilaDePago,
  type FormularioDeProyecto,
} from '@/entities/proyecto';

import { FilasDinamicas } from './FilasDinamicas';

function Categorias({ control }: { control: Control<FormularioDeProyecto> }) {
  const gastos = useWatch({ control, name: 'gastos' });
  return (
    <output aria-label="categorías">{gastos.map((gasto) => gasto.categoria).join(',')}</output>
  );
}

function Arnes({ gastos }: { gastos: FilaDeGasto[] }) {
  const { control, register, formState } = useForm<FormularioDeProyecto>({
    defaultValues: {
      ...valoresDelFormulario(undefined, [], [], [], { hoy: '2026-10-03' }),
      gastos,
    },
  });
  const campos = useFieldArray({ control, name: 'gastos', keyName: 'clave' });
  return (
    <>
      <FilasDinamicas
        lista="gastos"
        control={control}
        register={register}
        errores={formState.errors}
        campos={campos}
        bloqueado={false}
      />
      <Categorias control={control} />
    </>
  );
}

function leidas(): string {
  return screen.getByRole('status', { name: 'categorías' }).textContent;
}

function ArnesDePagos({ pagos, facturados }: { pagos: FilaDePago[]; facturados: Set<string> }) {
  const { control, register, setValue, formState } = useForm<FormularioDeProyecto>({
    defaultValues: {
      ...valoresDelFormulario(undefined, [], [], [], { hoy: '2026-10-03' }),
      pagos,
    },
  });
  const campos = useFieldArray({ control, name: 'pagos', keyName: 'clave' });
  return (
    <FilasDinamicas
      lista="pagos"
      control={control}
      register={register}
      setValue={setValue}
      errores={formState.errors}
      campos={campos}
      bloqueado={false}
      delPago={{
        monedaDelTrabajo: 'ARS',
        monedaNueva: 'ARS',
        tesorosEnDolares: [],
        dolarDelDia: null,
        facturados,
      }}
    />
  );
}

describe('un pago con factura de ARCA en el formulario del trabajo', () => {
  afterEach(() => {
    cleanup();
  });

  it('queda quieto salvo el concepto, sin el tacho y con el porqué', () => {
    render(
      <ArnesDePagos
        pagos={[
          { ...pagoVacio('p1', '2026-10-01', 'ARS', null), detalle: 'Seña', monto: 45_000_000 },
          { ...pagoVacio('p2', '2026-10-02', 'ARS', null), detalle: 'Saldo', monto: 10_000_000 },
        ]}
        facturados={new Set(['p1'])}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Concepto 1' })).toBeEnabled();
    expect(screen.getByLabelText('Fecha 1')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Monto 1' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Quitar concepto 1' })).toBeNull();
    expect(
      screen.getByText('Tiene una factura de ARCA: para cambiarlo, anulala primero.'),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Fecha 2')).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Monto 2' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Quitar concepto 2' })).toBeEnabled();
  });
});

describe('la categoría de cada gasto en el formulario del trabajo', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('se elige entre las cinco, sin ninguna elegida de antemano', () => {
    render(
      <Arnes gastos={[{ ...gastoVacio('x1', '2026-10-01'), detalle: 'Placas', monto: 800 }]} />,
    );

    const categoria = screen.getByRole('combobox', { name: 'Categoría 1' });
    expect(categoria).toHaveValue('');
    expect(
      within(categoria)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Sin elegir', 'Madera', 'Herrajes', 'Flete', 'Ayudante', 'Otro']);

    fireEvent.change(categoria, { target: { value: 'flete' } });
    expect(leidas()).toBe('flete');
  });

  it('trae la que tenía el gasto, y un gasto nuevo arranca sin elegir', () => {
    render(
      <Arnes
        gastos={[{ ...gastoVacio('x1', '2026-10-01'), detalle: 'Bisagras', categoria: 'herrajes' }]}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Categoría 1' })).toHaveValue('herrajes');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar un gasto' }));
    expect(screen.getByRole('combobox', { name: 'Categoría 2' })).toHaveValue('');
    expect(leidas()).toBe('herrajes,');
  });
});
