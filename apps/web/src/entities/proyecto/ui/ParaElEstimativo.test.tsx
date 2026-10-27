import { preguntasDeSiempre, type RespuestaDeLaConsulta } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLAVE_DE_PROYECTO,
  CLAVE_DE_RESPUESTAS_DE_LA_CONSULTA,
  type GuardadoDeProyecto,
  type RespuestasDelTrabajo,
} from '../api/mutacion';
import type { Proyecto } from '../model/catalogos';
import { ParaElEstimativo } from './ParaElEstimativo';

const DEMORA_MS = 900;

const PREGUNTAS = preguntasDeSiempre('es');

const DEL_ACCESO: RespuestaDeLaConsulta = {
  id: 'acceso',
  pregunta: 'Acceso al lugar',
  respuesta: 'Tercer piso, por escalera.',
};

function proyecto(cambios: Record<string, unknown> = {}): Proyecto {
  return {
    id: 'p',
    cliente_id: 'c',
    titulo: 'Vestidor',
    version: 4,
    estado: 'contacto',
    direccion_entrega: '',
    respuestas_de_la_consulta: [],
    ...cambios,
  } as unknown as Proyecto;
}

function variables<T>(cliente: QueryClient, clave: readonly string[]): T[] {
  return cliente
    .getMutationCache()
    .getAll()
    .filter((mutacion) => mutacion.options.mutationKey?.join('/') === clave.join('/'))
    .map((mutacion) => mutacion.state.variables as T);
}

function montar(fila: Proyecto, domicilioDelCliente = '') {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <ParaElEstimativo
        proyecto={fila}
        preguntas={PREGUNTAS}
        domicilioDelCliente={domicilioDelCliente}
      />
    </QueryClientProvider>,
  );
  return {
    unmount,
    respuestas: () =>
      variables<RespuestasDelTrabajo>(queryClient, CLAVE_DE_RESPUESTAS_DE_LA_CONSULTA),
    proyectos: () => variables<GuardadoDeProyecto>(queryClient, CLAVE_DE_PROYECTO),
  };
}

function esperar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  onlineManager.setOnline(false);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('para el estimativo, en la ficha de la consulta', () => {
  it('dice cuántas están contestadas, «N de M», con el domicilio entre ellas', () => {
    montar(
      proyecto({ direccion_entrega: 'Gorriti 4500', respuestas_de_la_consulta: [DEL_ACCESO] }),
    );

    expect(screen.getByText('2 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Domicilio')).toHaveValue('Gorriti 4500');
    expect(screen.getByLabelText('Acceso al lugar')).toHaveValue('Tercer piso, por escalera.');
    expect(screen.getByLabelText('Urgencia')).toHaveValue('');
  });

  it('la ayuda de cada pregunta va como texto de ejemplo dentro del campo', () => {
    montar(proyecto());

    expect(screen.getByText('0 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Acceso al lugar')).toHaveAttribute(
      'placeholder',
      'Escaleras, piso, tamaño del ascensor.',
    );
    expect(screen.getByLabelText('Urgencia')).toHaveAttribute(
      'placeholder',
      'Para cuándo lo necesita.',
    );
    expect(screen.getByLabelText('Domicilio')).not.toHaveAttribute('placeholder');
  });

  it('con el domicilio vacío ofrece «Usar la del cliente: …», que lo completa', () => {
    montar(proyecto(), 'Olazábal 1240, Ituzaingó');

    fireEvent.click(
      screen.getByRole('button', { name: 'Usar la del cliente: Olazábal 1240, Ituzaingó' }),
    );

    expect(screen.getByLabelText('Domicilio')).toHaveValue('Olazábal 1240, Ituzaingó');
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Usar la del cliente/ })).toBeNull();
  });

  it('con el domicilio escrito, o sin dirección del cliente, no lo ofrece', () => {
    montar(proyecto({ direccion_entrega: 'Gorriti 4500' }), 'Olazábal 1240, Ituzaingó');
    expect(screen.queryByRole('button', { name: /^Usar la del cliente/ })).toBeNull();
    cleanup();

    montar(proyecto(), '  ');
    expect(screen.queryByRole('button', { name: /^Usar la del cliente/ })).toBeNull();
  });

  it('una respuesta se guarda sola después de la demora, por la mutación de las respuestas', () => {
    const { respuestas, proyectos } = montar(proyecto({ respuestas_de_la_consulta: [DEL_ACCESO] }));

    fireEvent.change(screen.getByLabelText('Urgencia'), {
      target: { value: '  Para fin de mes  ' },
    });
    esperar(DEMORA_MS - 1);
    expect(respuestas()).toEqual([]);
    esperar(1);

    expect(respuestas()).toEqual([
      {
        id: 'p',
        respuestas: [
          DEL_ACCESO,
          { id: 'urgencia', pregunta: 'Urgencia', respuesta: 'Para fin de mes' },
        ],
        previas: [DEL_ACCESO],
        version: 4,
      },
    ]);
    expect(proyectos()).toEqual([]);
  });

  it('el domicilio se guarda por la mutación del proyecto, como la dirección del trabajo', () => {
    const { respuestas, proyectos } = montar(proyecto());

    fireEvent.change(screen.getByLabelText('Domicilio'), {
      target: { value: '  Gorriti 4500, Palermo  ' },
    });
    esperar(DEMORA_MS - 1);
    expect(proyectos()).toEqual([]);
    esperar(1);

    const [guardado] = proyectos();
    expect(guardado?.pedido).toMatchObject({ id: 'p', version: 4, pagos: [], gastos: [] });
    expect(guardado?.pedido.datos.direccion_entrega).toBe('Gorriti 4500, Palermo');
    expect(respuestas()).toEqual([]);
  });

  it('lo que todavía no se guardó se manda al cerrar la ficha, sin esperar la demora', () => {
    const { respuestas, unmount } = montar(proyecto());

    fireEvent.change(screen.getByLabelText('Acceso al lugar'), { target: { value: 'Ascensor' } });
    unmount();

    expect(respuestas()).toEqual([
      {
        id: 'p',
        respuestas: [{ id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Ascensor' }],
        previas: [],
        version: 4,
      },
    ]);
  });

  it('una pregunta que ya no está en Ajustes sigue con lo que contestó, y no cuenta en el total', () => {
    montar(
      proyecto({
        respuestas_de_la_consulta: [{ id: 'medidas', pregunta: 'Medidas', respuesta: '2,40 m' }],
      }),
    );

    expect(screen.getByLabelText('Medidas')).toHaveValue('2,40 m');
    expect(screen.getByText('0 de 3')).toBeInTheDocument();
  });
});
