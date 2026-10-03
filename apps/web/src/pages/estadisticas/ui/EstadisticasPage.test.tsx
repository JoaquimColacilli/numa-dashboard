import type { IndiceDePrecios } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';
import { cargarMensajes, mensajes, usarIdioma } from '@/shared/idioma';

import { EstadisticasPage } from './EstadisticasPage';

const HOY = '2026-10-03';

const INDICE: IndiceDePrecios = {
  fuente: 'prueba',
  desde: '2026-01',
  hasta: '2026-08',
  valores: [100, 101, 102, 103, 104, 105, 106, 107],
};

const INDICE_VIEJO: IndiceDePrecios = {
  fuente: 'prueba',
  desde: '2026-01',
  hasta: '2026-06',
  valores: [100, 101, 102, 103, 104, 105],
};

type Fila = { id: string } & Record<string, unknown>;
type Filas = Partial<Record<TablaReplicada, Fila[]>>;

const COMUN = { household_id: 'h', version: 1, deleted_at: null };

function proyecto(id: string, extra: Record<string, unknown> = {}): Fila {
  return {
    ...COMUN,
    id,
    cliente_id: 'c1',
    titulo: `Trabajo ${id}`,
    estado: 'en_curso',
    moneda: 'ARS',
    presupuesto_centavos: null,
    fecha_inicio: null,
    fecha_entrega: null,
    fecha_cobro: null,
    entrega_estimada: null,
    entrega_comprometida: null,
    listo_el: null,
    tipo_de_proyecto: null,
    dist_cobrado_centavos: null,
    dist_gastos_centavos: null,
    costo_madera_centavos: null,
    costo_herrajes_centavos: null,
    costo_flete_centavos: null,
    costo_ayudante_centavos: null,
    costos_cotizacion_centavos: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    ...extra,
  };
}

function cobrado(
  id: string,
  titulo: string,
  { cobro, entrega, inicio }: { cobro: string; entrega: string; inicio: string },
): Fila {
  return proyecto(id, {
    titulo,
    estado: 'cobrado',
    fecha_cobro: cobro,
    fecha_entrega: entrega,
    fecha_inicio: inicio,
    presupuesto_centavos: 100_000_000,
    dist_cobrado_centavos: 100_000_000,
    dist_gastos_centavos: 40_000_000,
  });
}

function gasto(
  id: string,
  proyectoId: string,
  fecha: string,
  monto: number,
  categoria: string | null,
): Fila {
  return {
    ...COMUN,
    id,
    proyecto_id: proyectoId,
    fecha,
    descripcion: 'Compra',
    monto_centavos: monto,
    categoria,
    created_at: `${fecha}T12:00:00Z`,
    updated_at: `${fecha}T12:00:00Z`,
  };
}

function comprometida(id: string, proyectoId: string, fecha: string): Fila {
  return {
    ...COMUN,
    id,
    proyecto_id: proyectoId,
    tipo: 'comprometida',
    fecha,
    origen: 'taller',
    created_at: '2026-07-01T12:00:00Z',
    trabajos_en_curso: 1,
  };
}

function etapa(
  id: string,
  proyectoId: string,
  desde: string | null,
  hacia: string,
  dia: string,
): Fila {
  return {
    ...COMUN,
    id,
    proyecto_id: proyectoId,
    desde,
    hacia,
    ocurrio_el: dia,
    updated_at: `${dia}T15:00:00Z`,
  };
}

const CONFORME = {
  ...COMUN,
  id: 'conforme',
  serie: 'conforme',
  numero: 1,
  proyecto_id: null,
  titular: true,
  orden: 10,
  texto: '¿Qué tan conforme quedaste con el mueble?',
  tipo: 'escala5',
  escala: 'conformidad',
  obligatoria: true,
  opciones: null,
  cantidad_de_opciones: 0,
  archivada_at: null,
  created_at: '2024-01-01T12:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
};

function opinion(indice: number, proyectoId: string, dia: string, valor: number): Filas {
  const encuesta = `e${String(indice)}`;
  const respuesta = `r${String(indice)}`;
  return {
    encuestas_enviadas: [
      {
        ...COMUN,
        id: encuesta,
        proyecto_id: proyectoId,
        token: `token-${String(indice)}`,
        token_hash: `hash-${String(indice)}`,
        preguntas: [
          {
            id: CONFORME.id,
            texto: CONFORME.texto,
            tipo: CONFORME.tipo,
            escala: CONFORME.escala,
            obligatoria: true,
            opciones: null,
            propia: false,
          },
        ],
        enviada_at: `${dia}T10:00:00Z`,
        recordada_at: null,
        revocada_at: null,
        created_at: `${dia}T10:00:00Z`,
        updated_at: `${dia}T10:00:00Z`,
      },
    ],
    respuestas: [
      {
        ...COMUN,
        id: respuesta,
        encuesta_id: encuesta,
        contestada_at: `${dia}T15:00:00Z`,
        leida_at: `${dia}T20:00:00Z`,
        created_at: `${dia}T15:00:00Z`,
        updated_at: `${dia}T15:00:00Z`,
      },
    ],
    renglones_de_respuesta: [
      {
        ...COMUN,
        id: `g${String(indice)}`,
        respuesta_id: respuesta,
        pregunta_id: CONFORME.id,
        pregunta_texto: CONFORME.texto,
        tipo: 'escala5',
        cantidad_de_opciones: 0,
        valor_numero: valor,
        valor_opciones: null,
        valor_texto: null,
        created_at: `${dia}T15:00:00Z`,
        updated_at: `${dia}T15:00:00Z`,
      },
    ],
  };
}

const DEL_PERIODO = [
  cobrado('a1', 'Placard del pasillo', {
    cobro: '2026-08-05',
    entrega: '2026-08-01',
    inicio: '2026-07-12',
  }),
  cobrado('a2', 'Rack del living', {
    cobro: '2026-08-20',
    entrega: '2026-08-15',
    inicio: '2026-07-21',
  }),
  cobrado('a3', 'Vanitory con cajones', {
    cobro: '2026-09-10',
    entrega: '2026-09-05',
    inicio: '2026-08-06',
  }),
  cobrado('a4', 'Biblioteca de pared', {
    cobro: '2026-09-25',
    entrega: '2026-09-20',
    inicio: '2026-08-16',
  }),
  cobrado('a5', 'Mesa de comedor', {
    cobro: '2026-10-02',
    entrega: '2026-09-30',
    inicio: '2026-08-21',
  }),
];

const DE_ANTES = [
  cobrado('b1', 'Escritorio', { cobro: '2026-05-10', entrega: '2026-05-05', inicio: '2026-04-01' }),
  cobrado('b2', 'Placard chico', {
    cobro: '2026-05-20',
    entrega: '2026-05-15',
    inicio: '2026-04-10',
  }),
  cobrado('b3', 'Cocina en L', {
    cobro: '2026-06-05',
    entrega: '2026-06-01',
    inicio: '2026-04-20',
  }),
  cobrado('b4', 'Cocina recta', {
    cobro: '2026-06-15',
    entrega: '2026-06-10',
    inicio: '2026-05-01',
  }),
  cobrado('b5', 'Vestidor', { cobro: '2026-07-02', entrega: '2026-06-28', inicio: '2026-05-20' }),
];

const CONSULTAS: Fila[] = [];
const ETAPAS: Fila[] = [];
for (let indice = 1; indice <= 12; indice += 1) {
  const id = `k${String(indice)}`;
  const alta = `2026-09-${String(17 + indice).padStart(2, '0')}`;
  ETAPAS.push(etapa(`${id}-alta`, id, null, 'contacto', alta));
  let estado = 'contacto';
  if (indice <= 6) {
    ETAPAS.push(etapa(`${id}-presupuesto`, id, 'contacto', 'presupuesto_enviado', '2026-09-30'));
    estado = 'presupuesto_enviado';
    if (indice <= 3) {
      ETAPAS.push(etapa(`${id}-aprobado`, id, 'presupuesto_enviado', 'en_curso', '2026-10-02'));
      estado = 'en_curso';
    } else if (indice === 4) {
      ETAPAS.push(etapa(`${id}-perdido`, id, 'presupuesto_enviado', 'perdido', '2026-10-01'));
      estado = 'perdido';
    }
  } else if (indice === 7) {
    ETAPAS.push(etapa(`${id}-perdido`, id, 'contacto', 'perdido', '2026-09-30'));
    estado = 'perdido';
  }
  CONSULTAS.push(proyecto(id, { titulo: `Consulta ${String(indice)}`, estado }));
}

function juntar(...partes: Filas[]): Filas {
  const todo: Filas = {};
  for (const parte of partes) {
    for (const [tabla, filas] of Object.entries(parte) as [TablaReplicada, Fila[]][]) {
      todo[tabla] = [...(todo[tabla] ?? []), ...filas];
    }
  }
  return todo;
}

const HISTORIA: Filas = juntar(
  {
    clientes: [{ ...COMUN, id: 'c1', nombre: 'Cliente de prueba', telefono: '' }],
    proyectos: [
      ...DEL_PERIODO,
      ...DE_ANTES,
      proyecto('p1', {
        titulo: 'Placard que no fue',
        estado: 'perdido',
        fecha_cobro: '2026-09-15',
        dist_cobrado_centavos: 10_000_000,
        dist_gastos_centavos: 0,
      }),
      cobrado('viejo', 'Primer trabajo', {
        cobro: '2026-03-15',
        entrega: '2026-03-10',
        inicio: '2026-02-10',
      }),
      proyecto('e1', {
        titulo: 'Placard en curso',
        fecha_inicio: '2026-09-01',
        entrega_comprometida: '2026-10-08',
      }),
      proyecto('e2', {
        titulo: 'Rack en curso',
        fecha_inicio: '2026-09-10',
        listo_el: '2026-10-01',
      }),
      proyecto('d1', {
        titulo: 'Mesada entregada',
        estado: 'entregado',
        presupuesto_centavos: 50_000_000,
        fecha_entrega: '2026-09-28',
      }),
      ...CONSULTAS,
    ],
    pagos: [
      {
        ...COMUN,
        id: 'pago-d1',
        proyecto_id: 'd1',
        fecha: '2026-09-01',
        concepto: 'Seña',
        monto_centavos: 20_000_000,
        moneda: 'ARS',
        cotizacion_centavos: null,
        tesoro_id: null,
      },
    ],
    gastos: [
      ...DEL_PERIODO.flatMap((uno) => [
        gasto(`${uno.id}-madera`, uno.id, String(uno.fecha_cobro), 30_000_000, 'madera'),
        gasto(`${uno.id}-herrajes`, uno.id, String(uno.fecha_cobro), 10_000_000, 'herrajes'),
      ]),
      gasto('suelto', 'e1', '2026-09-12', 2_000_000, null),
    ],
    movimientos: [
      {
        ...COMUN,
        id: 'm1',
        tipo: 'gasto',
        tesoro_origen: 'maun',
        tesoro_destino: null,
        fecha: '2026-09-03',
        monto_centavos: 5_000_000,
        categoria: 'Herramientas',
        descripcion: 'Una sierra',
      },
    ],
    cambios_de_fecha: [
      comprometida('f1', 'a1', '2026-08-01'),
      comprometida('f2', 'a2', '2026-08-16'),
      comprometida('f3', 'a3', '2026-09-05'),
      comprometida('f4', 'a4', '2026-09-22'),
      comprometida('f5', 'a5', '2026-09-28'),
    ],
    cambios_de_estado: ETAPAS,
  },
  opinion(1, 'a1', '2026-09-21', 5),
  opinion(2, 'a2', '2026-09-22', 5),
  opinion(3, 'a3', '2026-09-23', 4),
);

const POCOS: Filas = {
  clientes: [{ ...COMUN, id: 'c1', nombre: 'Cliente de prueba', telefono: '' }],
  proyectos: [...DEL_PERIODO.slice(0, 2), ...DE_ANTES.slice(4)],
};

function replicaCon(filas: Filas): Replica {
  const tablas: Record<string, Record<string, unknown>> = {};
  for (const tabla of TABLAS_REPLICADAS) {
    tablas[tabla] = Object.fromEntries((filas[tabla] ?? []).map((fila) => [fila.id, fila]));
  }
  tablas.households = { h: { id: 'h', nombre: 'MAUN' } };
  tablas.preguntas = { [CONFORME.id]: CONFORME };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function Direccion() {
  const { pathname, search } = useLocation();
  return <output aria-label="dirección">{`${pathname}${search}`}</output>;
}

function montar(filas: Filas, ruta = '/estadisticas', indice: IndiceDePrecios = INDICE) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replicaCon(filas)}>
          <EstadisticasPage indice={indice} />
          <Direccion />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function seccion(titulo: string): HTMLElement {
  const encabezado = screen.getByRole('heading', { level: 2, name: titulo });
  const contenedor = encabezado.closest('section');
  if (contenedor === null) throw new Error(titulo);
  return contenedor;
}

function conAncho(ancho: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: ancho,
    height: 0,
    top: 0,
    left: 0,
    right: ancho,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

beforeAll(async () => {
  await Promise.all([cargarMensajes('en'), cargarMensajes('pt-BR')]);
}, 60_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00`));
});

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  await usarIdioma('es');
});

describe('Estadísticas', () => {
  it('sin nada para contar muestra el vacío, sin período ni secciones', () => {
    montar({});
    expect(screen.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay nada para contar')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Período' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: '¿Qué viene?' }),
    ).not.toBeInTheDocument();
  });

  it('con historia: la cifra como pasó, el cambio contando la inflación y las seis preguntas', () => {
    montar(HISTORIA);
    const cifra = screen.getByRole('region', { name: 'Lo que te dejaron los trabajos' });
    expect(within(cifra).getByText('$ 3.100.000')).toBeInTheDocument();
    expect(within(cifra).getByText('1 % más que en may – jul')).toBeInTheDocument();
    expect(within(cifra).getByText('ya contando la inflación')).toBeInTheDocument();
    expect(cifra).toHaveTextContent('De cada $ 100 que cobraste, te quedaron $ 61.');
    expect(cifra).toHaveTextContent('5 trabajos cobrados y la seña de 1 perdido');

    expect(screen.getByText('ago – oct 2026')).toBeInTheDocument();
    expect(screen.getByText('contra may – jul, hasta el mismo día')).toBeInTheDocument();

    for (const titulo of [
      '¿Cuánto me dejaron los trabajos?',
      '¿En qué se me va la plata?',
      '¿Llego a tiempo?',
      '¿Cuántos presupuestos me aprueban?',
      '¿Qué opinan mis clientes?',
      '¿Qué viene?',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
    }
  });

  it('las cuatro tarjetas dicen su cifra y llevan a su sección', () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    montar(HISTORIA);
    const cifras = screen.getByRole('navigation', { name: 'Las cifras del período' });
    const [gastaste, entrega, aprobaron, conformes] = within(cifras).getAllByRole('button');
    expect(gastaste).toHaveTextContent('Gastaste2$ 2.070.000en los trabajos y el taller');
    expect(entrega).toHaveTextContent('Tiempo de entrega330 días4 de 5, a tiempo');
    expect(aprobaron).toHaveTextContent('Te aprobaron43 de 6presupuestos · 2 esperan');
    expect(conformes).toHaveTextContent('Conformes53 de 3clientes que contestaron');
    fireEvent.click(within(cifras).getByRole('button', { name: /^Tiempo de entrega/ }));
    expect(desplazar).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    expect(screen.getByRole('heading', { level: 2, name: '¿Llego a tiempo?' })).toHaveFocus();
  });

  it('cada sección responde con sus números', () => {
    montar(HISTORIA);
    expect(seccion('¿Cuánto me dejaron los trabajos?')).toHaveTextContent(
      'Cobraste 5 trabajos y te dejaron $ 3.100.000.',
    );
    expect(seccion('¿En qué se me va la plata?')).toHaveTextContent(
      'Entre ago y oct gastaste $ 2.070.000: $ 2.020.000 en los trabajos y $ 50.000 en el taller.',
    );
    expect(seccion('¿En qué se me va la plata?')).toHaveTextContent(
      '$ 20.000 son gastos sin categoría.',
    );
    expect(seccion('¿Llego a tiempo?')).toHaveTextContent(
      'Entregaste 4 de 5 trabajos el día que prometiste o antes. Tardás 30 días: la mitad de los trabajos tarda menos.',
    );
    expect(seccion('¿Cuántos presupuestos me aprueban?')).toHaveTextContent(
      'De 12 consultas que te entraron desde el 18 de septiembre, a 6 les mandaste presupuesto y 3 se volvieron trabajo. 2 presupuestos esperan respuesta.',
    );
    expect(seccion('¿Cuántos presupuestos me aprueban?')).toHaveTextContent(
      'Perdiste 2: 1 después del presupuesto y 1 antes. Siguen abiertas 7.',
    );
    expect(seccion('¿Qué opinan mis clientes?')).toHaveTextContent(
      'Te contestaron 3 clientes, y los 3 quedaron conformes o muy conformes con el mueble.',
    );
    expect(seccion('¿Qué viene?')).toHaveTextContent(
      'Tenés 5 trabajos en curso y 1 ya está listo. Te deben $ 300.000 de 1 trabajo entregado.',
    );
    expect(seccion('¿Qué viene?')).toHaveTextContent('Prometido para el jueves 8');
  });

  it('la lista del período suma lo mismo que la cifra', () => {
    montar(HISTORIA);
    const primera = seccion('¿Cuánto me dejaron los trabajos?');
    fireEvent.click(within(primera).getByRole('button', { name: 'Ver los 6 trabajos' }));
    const lista = within(primera).getByRole('list', { name: 'Los trabajos del período' });
    const renglones = within(lista).getAllByRole('listitem');
    expect(renglones).toHaveLength(7);
    expect(renglones.at(-1)).toHaveTextContent('Total del período$ 3.100.000');
    expect(within(lista).getByRole('link', { name: 'Placard que no fue' })).toHaveAttribute(
      'href',
      '/proyectos/p1',
    );
    expect(lista).toHaveTextContent('seña de un trabajo perdido');
  });

  it('elegir un mes con el teclado llena la lectura y Enter abre sus trabajos', () => {
    conAncho(600);
    montar(HISTORIA);
    const primera = seccion('¿Cuánto me dejaron los trabajos?');
    const columnas = within(primera).getByRole('listbox', {
      name: 'Lo que te dejaron los trabajos, mes por mes',
    });
    const septiembre = within(columnas).getByRole('option', {
      name: (nombre) =>
        nombre.replace(/\s+/gu, ' ') === 'septiembre 2026: $ 1.300.000 en pesos de hoy, 3 trabajos',
    });
    act(() => {
      septiembre.focus();
    });
    expect(septiembre).toHaveAttribute('aria-selected', 'true');
    expect(primera).toHaveTextContent('$ 1.300.000 en septiembre · 3 trabajos');
    fireEvent.keyDown(septiembre, { key: 'Enter' });
    const lista = within(primera).getByRole('list', { name: 'Los trabajos de septiembre' });
    expect(within(lista).getAllByRole('listitem').at(-1)).toHaveTextContent(
      'Total de septiembre$ 1.300.000',
    );
  });

  it('un mes de antes dice lo que vale hoy y lo que se cobró', () => {
    conAncho(600);
    montar(HISTORIA);
    const primera = seccion('¿Cuánto me dejaron los trabajos?');
    const mayo = within(primera).getByRole('option', { name: /^mayo 2026:/ });
    act(() => {
      mayo.focus();
    });
    expect(primera).toHaveTextContent(
      '$ 1.234.615 en mayo, en pesos de hoy · $ 1.200.000 como se cobró · 2 trabajos',
    );
  });

  it('el período sale de la URL, y lo que no se entiende se ignora', () => {
    montar(HISTORIA, '/estadisticas?meses=6&hasta=2026-06');
    expect(screen.getByText('ene – jun 2026')).toBeInTheDocument();
    expect(screen.getByText('contra jul – dic 2025')).toBeInTheDocument();
    cleanup();

    montar(HISTORIA, '/estadisticas?meses=7&hasta=2027-01');
    expect(screen.getByText('ago – oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3 meses' })).toBeChecked();
  });

  it('cambiar el período reemplaza la dirección, y la flecha de adelante no pasa de este mes', () => {
    montar(HISTORIA);
    fireEvent.click(screen.getByRole('radio', { name: '6 meses' }));
    expect(screen.getByRole('status', { name: 'dirección' })).toHaveTextContent(
      '/estadisticas?meses=6',
    );
    expect(screen.getByText('may – oct 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Los 6 meses anteriores' }));
    expect(screen.getByRole('status', { name: 'dirección' })).toHaveTextContent(
      '/estadisticas?meses=6&hasta=2026-04',
    );
    expect(screen.getByText('nov 2025 – abr 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Los 6 meses siguientes' }));
    expect(screen.getByRole('status', { name: 'dirección' })).toHaveTextContent(
      '/estadisticas?meses=6',
    );
    const siguiente = screen.getByRole('button', { name: 'Los 6 meses siguientes' });
    expect(siguiente).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('radio', { name: 'Todo' }));
    expect(screen.getByText('Desde mar 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /meses anteriores/ })).not.toBeInTheDocument();
  });

  it('con el índice viejo, los meses van en pesos de cada mes y la ayuda lo dice', () => {
    montar(HISTORIA, '/estadisticas', INDICE_VIEJO);
    const cifra = screen.getByRole('region', { name: 'Lo que te dejaron los trabajos' });
    expect(within(cifra).getByText('en pesos de cada mes')).toBeInTheDocument();
    expect(seccion('¿Cuánto me dejaron los trabajos?')).toHaveTextContent(
      'Por el mes en que terminaste de cobrar cada trabajo, en pesos de cada mes.',
    );
  });

  it('con pocos datos, cuenta los casos y dice cuánto falta', () => {
    montar(POCOS);
    const cifra = screen.getByRole('region', { name: 'Lo que te dejaron los trabajos' });
    expect(
      within(cifra).getByText('En may – jul te dejaron $ 600.000, de 1 trabajo'),
    ).toBeInTheDocument();
    expect(
      within(cifra).getByText('Con 5 trabajos en cada período vas a ver cuánto cambió'),
    ).toBeInTheDocument();
    expect(seccion('¿Llego a tiempo?')).toHaveTextContent(
      'Entregaste 2 trabajos: tardaste 20 y 25 días. Con 3 entregas más vas a ver cuánto tardás normalmente.',
    );
    expect(seccion('¿Cuántos presupuestos me aprueban?')).toHaveTextContent(
      'En ago – oct no te entraron consultas.',
    );
  });

  it.each(['en', 'pt-BR'] as const)(
    'en %s la página sale del catálogo de ese idioma',
    async (idioma) => {
      await usarIdioma(idioma);
      montar(HISTORIA);
      const textos = mensajes().paginaEstadisticas;
      expect(textos.titulo).not.toBe('Estadísticas');
      expect(screen.getByRole('heading', { level: 1, name: textos.titulo })).toBeInTheDocument();
      for (const titulo of Object.values(textos.secciones)) {
        expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
      }
      expect(screen.getByRole('region', { name: textos.resumen.loQueTeDejaron })).toHaveTextContent(
        'ARS',
      );
      expect(screen.queryByText(/Cobraste|gastaste|Tardás/)).not.toBeInTheDocument();
    },
  );
});
