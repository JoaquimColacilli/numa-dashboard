import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cliente } from '@/entities/cliente';
import type { ClienteNuevo, DatosDeCliente } from '@/shared/api';

import { HojaDeCliente } from './HojaDeCliente';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  crearCliente: vi.fn(() => new Promise(() => undefined)),
  editarCliente: vi.fn(() => new Promise(() => undefined)),
}));

const CLIENTE: Cliente = {
  id: 'c1',
  household_id: 'h',
  nombre: 'Lucía Gómez',
  zona: '',
  telefono: '',
  email: '',
  direccion: '',
  origen_contacto: null,
  origen_detalle: '',
  condicion_fiscal: 'consumidor_final',
  cuit: '',
  dni: '',
  razon_social: '',
  domicilio_fiscal: '',
  notas: '',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  deleted_at: null,
  version: 1,
};

function montar(cliente?: Cliente) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const alCerrar = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <HojaDeCliente {...(cliente === undefined ? {} : { cliente })} alCerrar={alCerrar} />
    </QueryClientProvider>,
  );
  return {
    alCerrar,
    encoladas: () =>
      queryClient
        .getMutationCache()
        .getAll()
        .map(
          (mutacion) =>
            mutacion.state.variables as ClienteNuevo | { cambios: Partial<DatosDeCliente> },
        ),
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
  vi.unstubAllGlobals();
});

describe('el DNI y el CUIT del consumidor final', () => {
  it('con «Consumidor final» pide el DNI y el CUIT, opcionales y con su ayuda', () => {
    montar();
    expect(screen.getByLabelText('DNI')).toHaveAccessibleDescription(
      'Hace falta para facturar trabajos de $ 10.000.000 o más.',
    );
    expect(screen.getByLabelText('CUIT')).toHaveAccessibleDescription(
      'Si te pide la factura con su CUIT.',
    );
    expect(screen.queryByLabelText('Razón social')).not.toBeInTheDocument();
  });

  it('con otra condición, el DNI no está y siguen el CUIT, la razón social y el domicilio fiscal', () => {
    montar({ ...CLIENTE, condicion_fiscal: 'responsable_inscripto' });
    expect(screen.queryByLabelText('DNI')).not.toBeInTheDocument();
    expect(screen.getByLabelText('CUIT')).toBeInTheDocument();
    expect(screen.getByLabelText('Razón social')).toBeInTheDocument();
  });

  it('el DNI se guarda sin los puntos', async () => {
    const { encoladas, alCerrar } = montar(CLIENTE);
    fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '28.456.789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    await waitFor(() => {
      expect(alCerrar).toHaveBeenCalled();
    });
    expect(encoladas()).toEqual([expect.objectContaining({ cambios: { dni: '28456789' } })]);
  });

  it('frena un DNI que no es de 7 u 8 números', async () => {
    const { encoladas, alCerrar } = montar(CLIENTE);
    fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    expect(
      await screen.findByText('Un DNI tiene 7 u 8 números. Dejalo vacío si no lo tenés a mano.'),
    ).toBeInTheDocument();
    expect(alCerrar).not.toHaveBeenCalled();
    expect(encoladas()).toEqual([]);
  });

  it('el CUIT del consumidor final avisa sin frenar', async () => {
    const { encoladas, alCerrar } = montar(CLIENTE);
    const cuit = screen.getByLabelText('CUIT');
    fireEvent.change(cuit, { target: { value: '20-12345678-0' } });
    fireEvent.blur(cuit);
    expect(
      screen.getByText('El dígito verificador no cierra. Revisalo, pero podés guardarlo igual.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    await waitFor(() => {
      expect(alCerrar).toHaveBeenCalled();
    });
    expect(encoladas()).toEqual([expect.objectContaining({ cambios: { cuit: '20-12345678-0' } })]);
  });
});
