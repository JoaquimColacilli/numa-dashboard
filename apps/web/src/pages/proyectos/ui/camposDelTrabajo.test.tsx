import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_CLIENTE } from '@/entities/cliente';
import {
  ATRIBUTO_DEL_CAMPO,
  camposDelTrabajo,
  CLAVE_DE_PROYECTO,
  type Proyecto,
} from '@/entities/proyecto';
import { ProveedorDeReplica } from '@/entities/replica';
import { HojaDeContacto } from '@/features/avanzar-la-consulta';
import { PantallaDeProyecto } from '@/features/editar-proyecto';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

const HOY = '2026-10-26';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function proyecto(extra: Partial<Proyecto> = {}): Proyecto {
  return {
    ...METADATOS,
    version: 3,
    id: 'p',
    cliente_id: 'c',
    titulo: 'Placard',
    descripcion: '',
    estado: 'presupuesto_enviado',
    presupuesto_centavos: null,
    sena_bp: null,
    forma_pago: null,
    cobro_sena: null,
    cobro_saldo: null,
    moneda: 'ARS',
    cobra_en: null,
    costos_cotizacion_centavos: null,
    comprobante: 'sin_comprobante',
    fecha_visita: null,
    visita_hora: null,
    ultimo_contacto: null,
    fecha_inicio: null,
    entrega_estimada: null,
    entrega_hora: null,
    fecha_entrega: null,
    direccion_entrega: '',
    notas: '',
    vencimiento_presupuesto: null,
    costo_madera_centavos: null,
    costo_herrajes_centavos: null,
    costo_flete_centavos: null,
    costo_ayudante_centavos: null,
    fecha_cobro: null,
    dist_cobrado_centavos: null,
    dist_gastos_centavos: null,
    dist_diezmo_bp: null,
    dist_tope_sueldo_centavos: null,
    dist_tope_fijos_centavos: null,
    dist_diezmo_centavos: null,
    dist_sueldo_centavos: null,
    dist_fijos_centavos: null,
    dist_remanente_centavos: null,
    dist_objetivo_sueldo_centavos: null,
    dist_objetivo_fijos_centavos: null,
    dist_sueldo_mensual: null,
    dist_sueldo_previo_centavos: null,
    dist_fijos_previo_centavos: null,
    dist_liquidado_at: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fecha_cobro: null,
    reapertura_fila: null,
    dist_fila_version: null,
    dist_fila: null,
    dist_previo: null,
    reparto_ya_en_la_apertura: false,
    presupuesto_vale_hasta: null,
    listo_el: null,
    entrega_comprometida: null,
    entrega_comprometida_franja: null,
    tipo_de_proyecto: null,
    presupuesto_diseno: false,
    presupuesto_despiece: false,
    presupuesto_cotizacion: false,
    presupuesto_pdf: false,
    visita_hecha: false,
    visita_importante: false,
    entrega_importante: false,
    presupuesto_importante: false,
    respuestas_de_la_consulta: [],
    ...extra,
  };
}

function taller(fila: Proyecto): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { ...METADATOS, id: 'h', nombre: 'Taller' } };
  tablas.clientes = {
    c: {
      ...METADATOS,
      id: 'c',
      nombre: 'Lucía García',
      telefono: '11 5555-0000',
      direccion: 'Mitre 123',
      condicion_fiscal: 'consumidor_final',
    },
  };
  tablas.ajustes = { aj: { ...METADATOS, id: 'aj', sena_bp: 5000 } };
  tablas.proyectos = { [fila.id]: fila };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(replica: Replica, contenido: ReactNode): string[] {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const { unmount } = render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>{contenido}</ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const campos = [
    ...new Set(
      [...document.body.querySelectorAll(`[${ATRIBUTO_DEL_CAMPO}]`)].map(
        (elemento) => elemento.getAttribute(ATRIBUTO_DEL_CAMPO) ?? '',
      ),
    ),
  ];
  unmount();
  return campos.sort();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00-03:00`));
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('los datos del trabajo salen de un solo lugar', () => {
  it('en una consulta, «Editar» muestra todos los campos del trabajo, también los de la consulta', () => {
    const fila = proyecto();
    const delEditor = montar(taller(fila), <PantallaDeProyecto proyectoId={fila.id} />);
    expect(delEditor).toEqual([...camposDelTrabajo('presupuesto_enviado')].sort());
    expect(delEditor).toEqual(expect.arrayContaining(['direccion', 'tipo', 'visita', 'valeHasta']));
  });

  it('la hoja rápida del contacto no tiene ningún campo que «Editar» no tenga', () => {
    const fila = proyecto();
    const replica = taller(fila);
    const delEditor = montar(replica, <PantallaDeProyecto proyectoId={fila.id} />);
    const deLaHoja = montar(replica, <HojaDeContacto proyecto={fila} alCerrar={vi.fn()} />);
    expect(deLaHoja.length).toBeGreaterThan(0);
    expect(delEditor).toEqual(expect.arrayContaining(deLaHoja));
  });

  it('en una obra, «Editar» deja afuera lo de la consulta', () => {
    const fila = proyecto({ estado: 'en_curso', presupuesto_centavos: 1_000_000_00 });
    const delEditor = montar(taller(fila), <PantallaDeProyecto proyectoId={fila.id} />);
    expect(delEditor).toEqual([...camposDelTrabajo('en_curso')].sort());
    expect(delEditor).not.toContain('visita');
  });
});

describe('el teléfono del cliente en «Editar» de una consulta', () => {
  function editar(fila: Proyecto) {
    onlineManager.setOnline(false);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProveedorDeReplica replica={taller(fila)}>
            <PantallaDeProyecto proyectoId={fila.id} />
          </ProveedorDeReplica>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    return (clave: readonly string[] = CLAVE_DE_CLIENTE) =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter((mutacion) => mutacion.options.mutationKey?.join('/') === clave.join('/'))
        .map((mutacion) => mutacion.state.variables);
  }

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('se ve con el del cliente y, si cambia, se guarda en el cliente', async () => {
    const delCliente = editar(proyecto());
    const telefono = screen.getByLabelText('Teléfono');
    expect(telefono).toHaveValue('11 5555-0000');
    fireEvent.change(telefono, { target: { value: ' 11 5555-9999 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    await waitFor(() => {
      expect(delCliente()).toEqual([
        { id: 'c', cambios: { telefono: '11 5555-9999' }, previos: { telefono: '11 5555-0000' } },
      ]);
    });
  });

  it('sin cambiarlo no toca el cliente, y en una obra no está', async () => {
    const mutaciones = editar(proyecto({ notas: 'Llamar a la tarde' }));
    fireEvent.change(screen.getByLabelText('Notas de obra'), {
      target: { value: 'Llamar a la mañana' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    await waitFor(() => {
      expect(mutaciones(CLAVE_DE_PROYECTO)).toHaveLength(1);
    });
    expect(mutaciones()).toEqual([]);
    cleanup();

    editar(proyecto({ estado: 'en_curso', presupuesto_centavos: 1_000_000_00 }));
    expect(screen.queryByLabelText('Teléfono')).toBeNull();
  });
});

describe('la etapa de una consulta al guardarla desde «Editar»', () => {
  async function guardarConLaVisita(visita: string): Promise<unknown> {
    onlineManager.setOnline(false);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const fila = proyecto({ estado: 'contacto' });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProveedorDeReplica replica={taller(fila)}>
            <PantallaDeProyecto proyectoId={fila.id} />
          </ProveedorDeReplica>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Visita'), { target: { value: visita } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar los cambios' }));
    const delProyecto = () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter(
          (mutacion) => mutacion.options.mutationKey?.join('/') === CLAVE_DE_PROYECTO.join('/'),
        )
        .map((mutacion) => mutacion.state.variables as { pedido: { datos: { estado: string } } });
    await waitFor(() => {
      expect(delProyecto()).toHaveLength(1);
    });
    return delProyecto()[0]?.pedido.datos.estado;
  }

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('con la visita de un día que pasó, el contacto queda a presupuestar, como en la hoja rápida', async () => {
    expect(await guardarConLaVisita('2026-10-25')).toBe('a_presupuestar');
  });

  it('con la visita agendada para un día que viene, pasa a relevamiento', async () => {
    expect(await guardarConLaVisita('2026-10-30')).toBe('relevamiento');
  });
});
