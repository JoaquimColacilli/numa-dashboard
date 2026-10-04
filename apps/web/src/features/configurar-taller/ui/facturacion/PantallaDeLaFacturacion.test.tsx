import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_AJUSTES, type EdicionDeAjustes } from '@/entities/replica';
import type { EstadoDeLaFacturacion, FilaDe } from '@/shared/api';

import { ConexionConArca } from './ConexionConArca';
import { PantallaDeLaFacturacion } from './PantallaDeLaFacturacion';

const AJUSTES = {
  id: 'a1',
  household_id: 'h',
  taller_titular: 'Taller de Prueba Ñandú',
  taller_cuit: '20-11111111-2',
  taller_condicion_fiscal: 'monotributo',
  taller_domicilio: 'Calle Falsa 123, Rosario',
  facturacion_ambiente: 'homologacion',
  facturacion_cuit: '20-11111111-2',
  facturacion_punto_de_venta: 1,
  facturacion_desde: '2026-09-03',
  facturacion_concepto: 1,
  facturacion_categoria: 'D',
  facturacion_ingresos_brutos: '',
  facturacion_inicio_de_actividades: null,
  facturacion_alertas: [],
  version: 4,
  deleted_at: null,
} as unknown as FilaDe<'ajustes'>;

const ESTADO: EstadoDeLaFacturacion = {
  conectada: true,
  ambiente: 'homologacion',
  prendido: true,
  servidor: 'ok',
  login: 'ok',
  esperarHasta: null,
  ultimoNumero: 12,
  certificadoVence: '2028-10-02',
  certificado: null,
};

function montar(ajustes: Partial<FilaDe<'ajustes'>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={['/ajustes/facturacion']}>
      <QueryClientProvider client={queryClient}>
        <PantallaDeLaFacturacion ajustes={{ ...AJUSTES, ...ajustes }} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return {
    guardados: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((una) => una.options.mutationKey?.join('/') === CLAVE_DE_AJUSTES.join('/'))
        .map((una) => una.state.variables as EdicionDeAjustes),
  };
}

function seccion(nombre: string): HTMLElement {
  return screen.getByRole('region', { name: nombre });
}

function guardar(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
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
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
});

describe('Ajustes › Facturación', () => {
  it('conectada en prueba: el rótulo, el aviso del modo prueba y sin renovar', () => {
    montar();
    const conexion = seccion('La conexión con ARCA');
    expect(conexion).toHaveTextContent('ARCAEn prueba');
    expect(conexion).toHaveTextContent('CUIT20-11111111-2');
    expect(conexion).toHaveTextContent('Punto de venta00001');
    expect(conexion).toHaveTextContent('Desde3/9/2026');
    expect(conexion).toHaveTextContent(
      'Estás en modo prueba: las facturas salen con «Prueba» y no valen para ARCA.',
    );
    expect(within(conexion).queryByRole('link', { name: 'Renovar el certificado' })).toBeNull();
  });

  it('sin conectar lleva al asistente, y en producción deja renovar', () => {
    montar({ facturacion_ambiente: null, facturacion_punto_de_venta: null });
    const conexion = seccion('La conexión con ARCA');
    expect(conexion).toHaveTextContent(
      'Todavía no está conectada. Se conecta una sola vez, con un trámite en ARCA.',
    );
    expect(within(conexion).getByRole('link', { name: 'Conectar con ARCA' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion/conectar',
    );
  });

  it('conectada en producción: «Conectada» y «Renovar el certificado»', () => {
    montar({ facturacion_ambiente: 'produccion', facturacion_punto_de_venta: 3 });
    const conexion = seccion('La conexión con ARCA');
    expect(conexion).toHaveTextContent('ARCAConectada');
    expect(conexion).not.toHaveTextContent('Estás en modo prueba');
    expect(within(conexion).getByRole('link', { name: 'Renovar el certificado' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion/conectar',
    );
  });

  it('sin señal, «Probar la conexión» se apaga y dice por qué', () => {
    montar();
    expect(screen.getByRole('button', { name: 'Probar la conexión' })).toBeDisabled();
    expect(screen.getByText('Para probar la conexión necesitás señal.')).toBeInTheDocument();
  });

  it('la condición del taller sale de Tu presupuesto, y si no es monotributo lo avisa', () => {
    montar({ taller_condicion_fiscal: 'responsable_inscripto' });
    const datos = seccion('Tus datos en las facturas');
    expect(datos).toHaveTextContent('Nombre o razón socialTaller de Prueba Ñandú');
    expect(datos).toHaveTextContent('DomicilioCalle Falsa 123, Rosario');
    expect(datos).toHaveTextContent('IVA Responsable Inscripto');
    expect(datos).toHaveTextContent('NUMA factura solo si sos monotributista.');
    expect(
      within(datos).getByRole('link', { name: 'Se cambia en Tu presupuesto' }),
    ).toHaveAttribute('href', '/ajustes/presupuesto');
  });

  it('una sola barra guarda Ingresos Brutos, el inicio, qué factura y la categoría', () => {
    const { guardados } = montar();
    expect(screen.queryByRole('button', { name: 'Guardar los cambios' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Ingresos Brutos'), {
      target: { value: '  901-123456-7 ' },
    });
    fireEvent.change(screen.getByLabelText('Inicio de actividades'), {
      target: { value: '2019-03-01' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Servicios' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Tu categoría del monotributo' }), {
      target: { value: 'E' },
    });

    const barra = screen.getByRole('status');
    expect(barra).toHaveTextContent('Sin guardar');
    expect(barra).toHaveTextContent('4 cambios');
    expect(barra).toHaveTextContent(
      ': Ingresos Brutos, el inicio de actividades, qué facturás y tu categoría',
    );
    guardar();

    expect(guardados()).toEqual([
      {
        id: 'a1',
        cambios: {
          facturacion_ingresos_brutos: '901-123456-7',
          facturacion_inicio_de_actividades: '2019-03-01',
          facturacion_concepto: 2,
          facturacion_categoria: 'E',
        },
        previos: {
          facturacion_ingresos_brutos: '',
          facturacion_inicio_de_actividades: null,
          facturacion_concepto: 1,
          facturacion_categoria: 'D',
        },
      },
    ]);
    expect(screen.queryByRole('button', { name: 'Guardar los cambios' })).toBeNull();
    expect(screen.getByLabelText('Ingresos Brutos')).toHaveValue('901-123456-7');
  });

  it('Ingresos Brutos de más de 40 caracteres no se guarda y dice qué revisar', () => {
    const { guardados } = montar();
    fireEvent.change(screen.getByLabelText('Ingresos Brutos'), {
      target: { value: '1'.repeat(41) },
    });
    guardar();
    expect(guardados()).toEqual([]);
    expect(screen.getByLabelText('Ingresos Brutos')).toHaveAccessibleDescription(
      'No puede pasar de 40 caracteres.',
    );
    expect(screen.getByRole('status')).toHaveTextContent('No se guardó: revisá Ingresos Brutos.');
  });

  it('con productos avisa el precio máximo de un mueble; con servicios no', () => {
    montar();
    const concepto = seccion('Qué facturás');
    expect(within(concepto).getByRole('radio', { name: 'Productos' })).toBeChecked();
    expect(concepto).toHaveTextContent(
      /ningún mueble que vendas puede valer más de \$\s716\.840,77/,
    );
    fireEvent.click(within(concepto).getByRole('radio', { name: 'Servicios' }));
    expect(concepto).not.toHaveTextContent('ningún mueble');
  });

  it('la categoría muestra el tope de cada letra, sin centavos', () => {
    montar();
    const categoria = screen.getByRole('combobox', { name: 'Tu categoría del monotributo' });
    expect(categoria).toHaveValue('D');
    expect(categoria).toHaveAccessibleDescription(
      'Se revisa hasta el 5 de febrero y el 5 de agosto, con lo que facturaste en los últimos 12 meses.',
    );
    const opciones = within(categoria).getAllByRole('option');
    expect(opciones).toHaveLength(12);
    expect(opciones[0]).toHaveTextContent('Sin elegir');
    expect(opciones[4]).toHaveTextContent(/^D · hasta \$\s30\.628\.651 por año$/);
  });
});

describe('Probar la conexión', () => {
  function probarCon(probar: () => Promise<EstadoDeLaFacturacion>) {
    onlineManager.setOnline(true);
    render(
      <MemoryRouter>
        <ConexionConArca
          conexion={{
            ambiente: 'homologacion',
            cuit: '20-11111111-2',
            puntoDeVenta: 1,
            desde: null,
          }}
          probar={probar}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Probar la conexión' }));
  }

  it('anda: la última factura y el vencimiento del certificado', async () => {
    probarCon(() => Promise.resolve(ESTADO));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'ARCA contesta y NUMA entra bien. La última factura C es la 00000012.El certificado vence el 2/10/2028.',
    );
  });

  it('sin facturas todavía en el punto de venta', async () => {
    probarCon(() => Promise.resolve({ ...ESTADO, ultimoNumero: 0 }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Todavía no hay facturas en este punto de venta.',
    );
  });

  it('esperando: la hora en que se puede probar de nuevo', async () => {
    probarCon(() =>
      Promise.resolve({
        ...ESTADO,
        login: 'esperando',
        esperarHasta: '2026-10-03T18:42:00Z',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Esperando a ARCA: probá de nuevo a las 15:42.',
    );
  });

  it('con el certificado rechazado', async () => {
    probarCon(() => Promise.resolve({ ...ESTADO, login: 'rechazado' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'NUMA no pudo entrar a ARCA con el certificado.',
    );
  });

  it('si la función falla, lo dice sin inventar nada', async () => {
    probarCon(() => Promise.reject(new Error('sin respuesta')));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No se pudo probar la conexión. Probá de nuevo en un rato.',
    );
  });

  it('con la facturación de verdad apagada', async () => {
    probarCon(() => Promise.resolve({ ...ESTADO, prendido: false }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'La facturación de verdad todavía no está prendida.',
    );
  });
});
