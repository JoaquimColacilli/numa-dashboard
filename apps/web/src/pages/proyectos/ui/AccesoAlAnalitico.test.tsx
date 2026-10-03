import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';
import { cargarMensajes, mensajes, usarIdioma } from '@/shared/idioma';

import { AccesoAlAnalitico } from './AccesoAlAnalitico';

function replicaCon(filas: Partial<Record<TablaReplicada, readonly { id: string }[]>>): Replica {
  const tablas: Record<string, Record<string, object>> = {};
  for (const tabla of TABLAS_REPLICADAS) {
    tablas[tabla] = Object.fromEntries((filas[tabla] ?? []).map((fila) => [fila.id, fila]));
  }
  return { usuarioId: 'u', cursor: 'c', reconciliadoEn: 'r', tablas } as unknown as Replica;
}

const ENTREGADOS = [1, 2, 3, 4, 5].map((numero) => ({
  id: `p${String(numero)}`,
  titulo: `Placard ${String(numero)}`,
  estado: 'entregado',
  fecha_inicio: '2026-09-01',
  fecha_entrega: '2026-09-22',
  tipo_de_proyecto: null,
  listo_el: null,
  version: 1,
  deleted_at: null,
}));

const ESTIMADAS = ENTREGADOS.map((trabajo, indice) => ({
  id: `f${String(indice)}`,
  proyecto_id: trabajo.id,
  tipo: 'estimada',
  fecha: '2026-09-20',
  origen: 'taller',
  created_at: '2026-09-01T12:00:00Z',
  trabajos_en_curso: 1,
  version: 1,
  deleted_at: null,
}));

function dibujar(): void {
  render(
    <MemoryRouter>
      <AccesoAlAnalitico
        replica={replicaCon({ proyectos: ENTREGADOS, cambios_de_fecha: ESTIMADAS })}
      />
    </MemoryRouter>,
  );
}

describe('la tarjeta del analítico en Historial', () => {
  beforeAll(async () => {
    await Promise.all([cargarMensajes('en'), cargarMensajes('pt-BR')]);
  }, 60_000);

  afterEach(async () => {
    cleanup();
    await usarIdioma('es');
  });

  it('dice cómo venís entregando contra lo estimado', () => {
    dibujar();
    expect(
      screen.getByText('Entregás, en la mediana, 2 días después de lo estimado.'),
    ).toBeInTheDocument();
  });

  it.each(['en', 'pt-BR'] as const)(
    'en %s lo dice en ese idioma, con el catálogo',
    async (idioma) => {
      await usarIdioma(idioma);
      dibujar();
      const frase = mensajes().paginaAnalitico.precision.despues(2, '2');
      expect(frase).not.toContain('Entregás');
      expect(screen.getByText(frase)).toBeInTheDocument();
    },
  );
});
