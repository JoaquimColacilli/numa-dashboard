import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import type { EdicionDeAjustes } from '../api/mutacion';
import {
  FormularioDeConfiguracion,
  type ParteDeLaConfiguracion,
} from './FormularioDeConfiguracion';

const HOUSEHOLD = { id: 'h', nombre: 'Taller MAUN' } as FilaDe<'households'>;

const AJUSTES = {
  id: 'aj',
  household_id: 'h',
  sueldo_mensual_centavos: 180_000_000,
  costos_fijos_centavos: 90_000_000,
  meta_cocos_centavos: 1_000_000_000,
  tasa_cocos_anual_bp: 4000,
  sueldo_tope_mensual: true,
  sena_bp: 5000,
  presupuesto_vale_dias: 15,
} as FilaDe<'ajustes'>;

function montar(partes?: readonly ParteDeLaConfiguracion[]) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioDeConfiguracion household={HOUSEHOLD} ajustes={AJUSTES} partes={partes} />
    </QueryClientProvider>,
  );
  return {
    guardados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map((mutacion) => mutacion.state.variables as EdicionDeAjustes),
  };
}

function campos(): HTMLElement[] {
  return screen.getAllByRole('textbox');
}

function pegar(etiqueta: string, texto: string): void {
  fireEvent.paste(screen.getByLabelText(etiqueta), { clipboardData: { getData: () => texto } });
}

beforeEach(() => {
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  onlineManager.setOnline(true);
});

describe('la configuración del taller por partes', () => {
  it('entera, como en la primera configuración, lleva los siete campos, la meta y la tasa de Cocos incluidas', () => {
    montar();
    expect(campos()).toHaveLength(7);
    expect(screen.getByLabelText('Meta de Cocos')).toBeInTheDocument();
    expect(screen.getByLabelText('Tasa anual de Cocos (%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar la configuración' })).toBeInTheDocument();
  });

  it('el reparto es el sueldo y los costos fijos, y guarda solo esas dos columnas', () => {
    const { guardados } = montar(['reparto']);
    expect(campos()).toHaveLength(2);
    expect(screen.queryByLabelText('Meta de Cocos')).toBeNull();
    expect(screen.queryByLabelText('Nombre del taller')).toBeNull();

    pegar('Sueldo que te asignás', '2.000.000');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar el sueldo y los costos' }));

    expect(guardados()).toEqual([
      {
        id: 'aj',
        cambios: { sueldo_mensual_centavos: 200_000_000 },
        previos: { sueldo_mensual_centavos: 180_000_000 },
      },
    ]);
  });

  it('el taller es el nombre, la seña y los días del presupuesto, sin tocar el reparto ni Cocos', () => {
    const { guardados } = montar(['taller']);
    expect(campos()).toHaveLength(3);
    expect(screen.queryByLabelText('Sueldo que te asignás')).toBeNull();
    expect(screen.queryByLabelText('Tasa anual de Cocos (%)')).toBeNull();

    fireEvent.change(screen.getByLabelText('Días que vale un presupuesto'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar la configuración' }));

    expect(guardados()).toEqual([
      { id: 'aj', cambios: { presupuesto_vale_dias: 30 }, previos: { presupuesto_vale_dias: 15 } },
    ]);
  });
});
