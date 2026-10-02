import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResultadoDeLaVista } from '@/entities/vista-cliente';

const consulta = vi.hoisted((): { resultado: unknown } => ({ resultado: null }));

vi.mock('@/entities/vista-cliente', () => ({
  PantallaDeLaVista: () => null,
  useMandarLaEntrega: () => undefined,
  useVistaCompartida: () => consulta.resultado,
}));

const { VistaPublicaPage } = await import('./VistaPublicaPage');

function abrir(resultado: ResultadoDeLaVista): void {
  consulta.resultado = resultado;
  render(
    <MemoryRouter initialEntries={['/v/tZEFrYutatg5xhw1mcrUKIAFXk']}>
      <Routes>
        <Route path="/v/:token" element={<VistaPublicaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  document.title = 'NUMA';
});

describe('la pestaña de la página del cliente', () => {
  it('dice el trabajo y el taller, como la vista previa del enlace', () => {
    abrir({
      estado: 'lista',
      trabajo: { trabajo: 'Cocina Lucas', taller: 'MAUN Muebles', idioma: 'es' },
      hoy: '2026-10-02',
    } as unknown as ResultadoDeLaVista);
    expect(document.title).toBe('Cocina Lucas · MAUN Muebles');
  });

  it('el lang de la página es el de los clientes del taller cuando llega el trabajo', () => {
    abrir({
      estado: 'lista',
      trabajo: { trabajo: 'Cozinha Lucas', taller: 'MAUN Muebles', idioma: 'pt-BR' },
      hoy: '2026-10-02',
    } as unknown as ResultadoDeLaVista);
    expect(document.documentElement.lang).toBe('pt-BR');
    document.documentElement.lang = 'es-AR';
  });

  it('mientras carga, o si el enlace no sirve, dice el nombre del taller de siempre, nunca NUMA', () => {
    abrir({ estado: 'cargando' });
    expect(document.title).toBe('MAUN');
    abrir({ estado: 'muerto' });
    expect(document.title).toBe('MAUN');
  });
});
