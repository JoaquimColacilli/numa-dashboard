import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { cargarMensajes, mensajes, usarIdioma } from '@/shared/idioma';

import { AccesoALasEstadisticas } from './AccesoALasEstadisticas';

describe('el acceso a las estadísticas en Inicio', () => {
  beforeAll(async () => {
    await cargarMensajes('en');
  }, 60_000);

  afterEach(async () => {
    cleanup();
    await usarIdioma('es');
  });

  it('dice cómo viene el taller y lleva a la página', () => {
    render(
      <MemoryRouter>
        <AccesoALasEstadisticas />
      </MemoryRouter>,
    );
    const acceso = screen.getByRole('link', { name: /^Cómo viene el taller/ });
    expect(acceso).toHaveAttribute('href', '/estadisticas');
    expect(acceso).toHaveTextContent('Ver las estadísticas');
  });

  it('en inglés sale del catálogo', async () => {
    await usarIdioma('en');
    render(
      <MemoryRouter>
        <AccesoALasEstadisticas />
      </MemoryRouter>,
    );
    const { comoVieneElTaller, verLasEstadisticas } = mensajes().paginaInicio.estadisticas;
    expect(screen.getByRole('link')).toHaveTextContent(`${comoVieneElTaller}${verLasEstadisticas}`);
  });
});
