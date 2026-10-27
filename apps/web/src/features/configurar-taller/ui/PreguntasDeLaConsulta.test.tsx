import { TOPE_DE_PREGUNTAS, type PreguntaDeLaConsulta } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_AJUSTES, type EdicionDeAjustes } from '@/entities/replica';
import type { FilaDe, Json } from '@/shared/api';

import { PreguntasDeLaConsulta } from './PreguntasDeLaConsulta';

const DEMORA_MS = 900;

const AJUSTES = {
  id: 'aj',
  household_id: 'h',
  preguntas_de_la_consulta: null,
} as FilaDe<'ajustes'>;

const DOMICILIO: PreguntaDeLaConsulta = { id: 'domicilio', rotulo: 'Domicilio', ayuda: '' };
const ACCESO: PreguntaDeLaConsulta = {
  id: 'acceso',
  rotulo: 'Acceso al lugar',
  ayuda: 'Escaleras, piso, tamaño del ascensor.',
};
const URGENCIA: PreguntaDeLaConsulta = {
  id: 'urgencia',
  rotulo: 'Urgencia',
  ayuda: 'Para cuándo lo necesita.',
};

function conPreguntas(preguntas: readonly PreguntaDeLaConsulta[]): FilaDe<'ajustes'> {
  return { ...AJUSTES, preguntas_de_la_consulta: preguntas as unknown as Json };
}

function montar(ajustes = AJUSTES) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const { rerender } = render(
    <QueryClientProvider client={queryClient}>
      <PreguntasDeLaConsulta ajustes={ajustes} />
    </QueryClientProvider>,
  );
  return {
    guardados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter(
          (mutacion) => mutacion.options.mutationKey?.join('/') === CLAVE_DE_AJUSTES.join('/'),
        )
        .map((mutacion) => mutacion.state.variables as EdicionDeAjustes),
    conLosAjustes: (nuevos: FilaDe<'ajustes'>) => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <PreguntasDeLaConsulta ajustes={nuevos} />
        </QueryClientProvider>,
      );
    },
  };
}

function campos(): HTMLInputElement[] {
  return screen.getAllByRole<HTMLInputElement>('textbox', { name: /^Pregunta \d+$/ });
}

function rotulos(): string[] {
  return campos().map((campo) => campo.value);
}

function lasGuardadas(guardado: EdicionDeAjustes | undefined): unknown {
  return guardado?.cambios.preguntas_de_la_consulta;
}

beforeEach(() => {
  onlineManager.setOnline(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

describe('lo que preguntás en una consulta', () => {
  it('arranca con las de siempre: el domicilio, el acceso al lugar y la urgencia, con sus ayudas', () => {
    const { guardados } = montar();

    expect(rotulos()).toEqual(['Domicilio', 'Acceso al lugar', 'Urgencia']);
    expect(screen.getByRole('textbox', { name: 'Ayuda de «Acceso al lugar»' })).toHaveValue(
      'Escaleras, piso, tamaño del ascensor.',
    );
    expect(screen.getByRole('textbox', { name: 'Ayuda de «Urgencia»' })).toHaveValue(
      'Para cuándo lo necesita.',
    );
    expect(
      screen.getByText('Es la dirección del trabajo, la de entrega: va primero y no se borra.'),
    ).toBeInTheDocument();
    expect(guardados()).toEqual([]);
  });

  it('con las suyas guardadas, arranca con esas', () => {
    montar(conPreguntas([DOMICILIO, { id: 'medidas', rotulo: 'Medidas', ayuda: '' }]));

    expect(rotulos()).toEqual(['Domicilio', 'Medidas']);
  });

  it('sumar una la agrega vacía al final, con el foco, y no se guarda hasta que tenga rótulo', () => {
    vi.useFakeTimers();
    const { guardados } = montar();

    fireEvent.click(screen.getByRole('button', { name: 'Sumar una pregunta' }));
    expect(rotulos()).toEqual(['Domicilio', 'Acceso al lugar', 'Urgencia', '']);
    expect(document.activeElement).toBe(campos()[3]);
    expect(screen.getByText('Escribí la pregunta para que se guarde.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(DEMORA_MS);
    });
    expect(guardados()).toEqual([]);

    const nueva = campos()[3];
    if (nueva === undefined) throw new Error('falta la pregunta nueva');
    fireEvent.change(nueva, { target: { value: '  Medidas  ' } });
    act(() => {
      vi.advanceTimersByTime(DEMORA_MS);
    });
    const [guardado] = guardados();
    expect(lasGuardadas(guardado)).toEqual([
      DOMICILIO,
      ACCESO,
      URGENCIA,
      {
        id: expect.stringMatching(/^[a-z0-9][a-z0-9-]*$/) as unknown,
        rotulo: 'Medidas',
        ayuda: '',
      },
    ]);
  });

  it('cambiar un rótulo lo guarda recién después de la demora, con las preguntas de la consulta', () => {
    vi.useFakeTimers();
    const { guardados } = montar();

    fireEvent.change(screen.getByRole('textbox', { name: 'Pregunta 3' }), {
      target: { value: 'Para cuándo' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Sin guardar');
    act(() => {
      vi.advanceTimersByTime(DEMORA_MS - 1);
    });
    expect(guardados()).toEqual([]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Pregunta 3' }), {
      target: { value: 'Para cuándo lo quiere' },
    });
    act(() => {
      vi.advanceTimersByTime(DEMORA_MS - 1);
    });
    expect(guardados()).toEqual([]);
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(guardados()).toEqual([
      {
        id: 'aj',
        cambios: {
          preguntas_de_la_consulta: [
            DOMICILIO,
            ACCESO,
            { ...URGENCIA, rotulo: 'Para cuándo lo quiere' },
          ],
        },
        previos: { preguntas_de_la_consulta: null },
      },
    ]);
  });

  it('«Subir» y «Bajar» la mueven y lo guardan en el momento; la primera no sube y la última no baja', () => {
    const { guardados } = montar();

    expect(screen.getByRole('button', { name: 'Subir «Acceso al lugar»' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar «Urgencia»' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Bajar «Acceso al lugar»' }));
    expect(rotulos()).toEqual(['Domicilio', 'Urgencia', 'Acceso al lugar']);
    expect(lasGuardadas(guardados()[0])).toEqual([DOMICILIO, URGENCIA, ACCESO]);

    fireEvent.click(screen.getByRole('button', { name: 'Subir «Acceso al lugar»' }));
    expect(rotulos()).toEqual(['Domicilio', 'Acceso al lugar', 'Urgencia']);
    expect(screen.queryByRole('button', { name: 'Subir «Domicilio»' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bajar «Domicilio»' })).toBeNull();
  });

  it('borrar la guarda sin ella, y «Deshacer» la vuelve a su lugar', () => {
    const { guardados, conLosAjustes } = montar();

    fireEvent.click(screen.getByRole('button', { name: 'Borrar «Acceso al lugar»' }));
    expect(rotulos()).toEqual(['Domicilio', 'Urgencia']);
    expect(screen.getByText('Borraste «Acceso al lugar».')).toBeInTheDocument();
    expect(screen.getByText('Lo que ya te contestaron queda en cada trabajo.')).toBeInTheDocument();
    expect(lasGuardadas(guardados()[0])).toEqual([DOMICILIO, URGENCIA]);

    conLosAjustes(conPreguntas([DOMICILIO, URGENCIA]));
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));

    expect(rotulos()).toEqual(['Domicilio', 'Acceso al lugar', 'Urgencia']);
    expect(screen.queryByText('Borraste «Acceso al lugar».')).toBeNull();
    expect(lasGuardadas(guardados()[1])).toEqual([DOMICILIO, ACCESO, URGENCIA]);
  });

  it('el domicilio no se borra ni se mueve, y sin nombre no se guarda', () => {
    vi.useFakeTimers();
    const { guardados } = montar();

    expect(screen.queryByRole('button', { name: 'Borrar «Domicilio»' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Borrar «Urgencia»' })).toBeInTheDocument();

    const domicilio = screen.getByRole('textbox', { name: 'Pregunta 1' });
    fireEvent.change(domicilio, { target: { value: '  ' } });
    expect(domicilio).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Ponele un nombre: sin nombre no se guarda.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(DEMORA_MS);
    });
    expect(guardados()).toEqual([]);
  });

  it(`entran ${String(TOPE_DE_PREGUNTAS)} como mucho: llena, no ofrece sumar otra`, () => {
    montar();

    for (let cuantas = 3; cuantas < TOPE_DE_PREGUNTAS; cuantas += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Sumar una pregunta' }));
    }

    expect(campos()).toHaveLength(TOPE_DE_PREGUNTAS);
    expect(screen.queryByRole('button', { name: 'Sumar una pregunta' })).toBeNull();
    expect(
      screen.getByText('Entran 12 como mucho: para sumar otra, borrá una.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Borrar «Urgencia»' }));
    expect(campos()).toHaveLength(TOPE_DE_PREGUNTAS - 1);
    expect(screen.getByRole('button', { name: 'Sumar una pregunta' })).toBeInTheDocument();
  });
});
