import { PLANTILLA_DE_SIEMPRE } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_AJUSTES, type EdicionDeAjustes } from '@/entities/replica';
import type { FilaDe, Json } from '@/shared/api';

import { CLAVE_DE_LA_PLANTILLA, type GuardadoDeLaPlantilla } from '../../api/plantilla';
import { PantallaDelPresupuestoDelTaller } from './PantallaDelPresupuestoDelTaller';

const AJUSTES = {
  id: 'a1',
  household_id: 'h',
  sena_bp: 5000,
  relevamiento_centavos: 12_000_000,
  cobro_titular: '',
  cobro_cuit: '',
  taller_titular: 'Ana Pérez',
  taller_cuit: '27-12345678-9',
  taller_condicion_fiscal: 'monotributo',
  taller_domicilio: 'Av. Siempreviva 742',
  taller_telefono: '',
  taller_email: '',
  plantilla_del_presupuesto: null,
  plantilla_del_presupuesto_version: 0,
  version: 4,
  deleted_at: null,
} as unknown as FilaDe<'ajustes'>;

function montar(ajustes: FilaDe<'ajustes'> = AJUSTES) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={['/ajustes/presupuesto']}>
      <QueryClientProvider client={queryClient}>
        <PantallaDelPresupuestoDelTaller nombreDelTaller="Taller de prueba" ajustes={ajustes} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const mutaciones = () => queryClient.getMutationCache().getAll();
  return {
    datos: () =>
      mutaciones()
        .filter((una) => una.options.mutationKey?.join('/') === CLAVE_DE_AJUSTES.join('/'))
        .map((una) => una.state.variables as EdicionDeAjustes),
    textos: () =>
      mutaciones()
        .filter((una) => una.options.mutationKey?.join('/') === CLAVE_DE_LA_PLANTILLA.join('/'))
        .map((una) => una.state.variables as GuardadoDeLaPlantilla),
  };
}

function botonDeGuardar(): HTMLElement | null {
  return screen.queryByRole('button', { name: 'Guardar los cambios' });
}

function seccion(nombre: string): HTMLElement {
  return screen.getByRole('region', { name: nombre });
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
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('tu presupuesto en Ajustes', () => {
  it('sin cambios no hay barra; con un dato y un número, una sola barra guarda los dos', () => {
    const { datos, textos } = montar();
    expect(botonDeGuardar()).toBeNull();

    const tusDatos = seccion('Tus datos en el presupuesto');
    expect(tusDatos).toHaveTextContent('Ana Pérez · CUIT 27-12345678-9');
    fireEvent.click(within(tusDatos).getByRole('button', { name: 'Cambiar tus datos' }));
    fireEvent.change(within(tusDatos).getByLabelText('Teléfono'), {
      target: { value: '11 5555-0000' },
    });
    fireEvent.change(screen.getByLabelText('Plazo de fabricación (días hábiles)'), {
      target: { value: '40' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Sin guardar');
    expect(screen.getAllByRole('button', { name: 'Guardar los cambios' })).toHaveLength(1);
    const guardar = botonDeGuardar();
    if (guardar === null) throw new Error('falta la barra');
    fireEvent.click(guardar);

    expect(datos()).toEqual([
      {
        id: 'a1',
        cambios: { taller_telefono: '11 5555-0000' },
        previos: { taller_telefono: '' },
      },
    ]);
    const [guardado] = textos();
    expect(guardado?.version).toBe(0);
    expect(guardado?.ajustesId).toBe('a1');
    expect(guardado?.plantilla).toEqual({ ...PLANTILLA_DE_SIEMPRE, plazoDeFabricacion: 40 });
    expect(guardado?.previa).toEqual({
      plantilla_del_presupuesto: null,
      plantilla_del_presupuesto_version: 0,
    });
    expect(botonDeGuardar()).toBeNull();
  });

  it('con un problema no guarda nada y dice qué revisar', () => {
    const { datos, textos } = montar();
    fireEvent.change(screen.getByLabelText('Garantía (meses)'), { target: { value: '3' } });
    const guardar = botonDeGuardar();
    if (guardar === null) throw new Error('falta la barra');
    fireEvent.click(guardar);

    expect(datos()).toEqual([]);
    expect(textos()).toEqual([]);
    expect(screen.getByLabelText('Garantía (meses)')).toHaveAccessibleDescription(
      'La ley pide por lo menos 6 meses.',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'No se guardó: revisá los meses de garantía.',
    );
  });

  it('quitar un aviso guardado lo deja tachado hasta guardar, y se puede deshacer', () => {
    const { textos } = montar();
    const avisos = seccion('Avisos');
    const [primero] = within(avisos).getAllByRole('button', { name: /^Cambiar:/ });
    if (primero === undefined) throw new Error('faltan avisos');
    fireEvent.click(primero);
    fireEvent.click(within(avisos).getByRole('button', { name: 'Quitar este aviso' }));

    expect(avisos).toHaveTextContent('Se va cuando guardes.');
    fireEvent.click(within(avisos).getByRole('button', { name: 'Deshacer' }));
    expect(avisos).not.toHaveTextContent('Se va cuando guardes.');
    expect(botonDeGuardar()).toBeNull();

    const [otraVez] = within(avisos).getAllByRole('button', { name: /^Cambiar:/ });
    if (otraVez === undefined) throw new Error('faltan avisos');
    fireEvent.click(otraVez);
    fireEvent.click(within(avisos).getByRole('button', { name: 'Quitar este aviso' }));
    const guardar = botonDeGuardar();
    if (guardar === null) throw new Error('falta la barra');
    fireEvent.click(guardar);
    expect(textos()[0]?.plantilla?.avisos).toEqual(PLANTILLA_DE_SIEMPRE.avisos.slice(1));
  });

  it('volver a los textos de siempre pregunta, guarda la plantilla vacía y no toca los datos', () => {
    const propia = { ...PLANTILLA_DE_SIEMPRE, plazoDeFabricacion: 35 };
    const { datos, textos } = montar({
      ...AJUSTES,
      plantilla_del_presupuesto: propia as unknown as Json,
      plantilla_del_presupuesto_version: 3,
    });
    const deSiempre = seccion('Los textos de siempre');
    expect(deSiempre).toHaveTextContent('Cambiaste 1 cosa');
    fireEvent.click(
      within(deSiempre).getByRole('button', { name: 'Volver a los textos de siempre' }),
    );

    const pregunta = screen.getByRole('alertdialog', { name: '¿Volvés a los textos de siempre?' });
    expect(pregunta).toHaveTextContent('El plazo vuelve a 30 días hábiles.');
    fireEvent.click(within(pregunta).getByRole('button', { name: 'Volver a los de siempre' }));

    expect(textos()).toEqual([
      {
        ajustesId: 'a1',
        version: 3,
        plantilla: null,
        previa: {
          plantilla_del_presupuesto: propia,
          plantilla_del_presupuesto_version: 3,
        },
      },
    ]);
    expect(datos()).toEqual([]);
    expect(screen.getByLabelText('Plazo de fabricación (días hábiles)')).toHaveValue('30');
    expect(botonDeGuardar()).toBeNull();
  });

  it('salir con cambios sin guardar pregunta antes', () => {
    montar();
    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    expect(screen.queryByRole('alertdialog', { name: '¿Cerrar sin guardar?' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Modificaciones incluidas'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    const pregunta = screen.getByRole('alertdialog', { name: '¿Cerrar sin guardar?' });
    fireEvent.click(within(pregunta).getByRole('button', { name: 'Seguir editando' }));
    expect(screen.getByLabelText('Modificaciones incluidas')).toHaveValue('3');
  });

  it('sin datos propios, ofrece usar el titular y el CUIT de «Cómo te pagan»', () => {
    montar({
      ...AJUSTES,
      taller_titular: '',
      taller_cuit: '',
      taller_domicilio: '',
      cobro_titular: 'Mariano Ruiz',
      cobro_cuit: '20301112220',
    });
    const tusDatos = seccion('Tus datos en el presupuesto');
    fireEvent.click(within(tusDatos).getByRole('button', { name: 'Usar el titular y el CUIT' }));

    expect(within(tusDatos).getByLabelText('Nombre o razón social')).toHaveValue('Mariano Ruiz');
    expect(within(tusDatos).getByLabelText('CUIT')).toHaveValue('20-30111222-0');
    expect(
      within(tusDatos).queryByRole('button', { name: 'Usar el titular y el CUIT' }),
    ).toBeNull();
  });
});
