import type { RespuestaDeLaConsulta } from '@maun/domain';
import { QueryClient, type MutationOptions } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  filaPorId,
  guardarElProyecto,
  guardarLasRespuestasDeLaConsulta,
  TABLAS_REPLICADAS,
  type FilaDe,
  type ProyectoGuardado,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { datosActualesDelProyecto } from '../model/liquidacion';
import {
  filaDelGastoGuardado,
  filaDelPagoGuardado,
  MUTACION_DE_PROYECTO,
  MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA,
  type GuardadoDeProyecto,
  type RespuestasDelTrabajo,
} from './mutacion';

vi.mock(import('@/shared/api'), async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    guardarElProyecto: vi.fn<typeof real.guardarElProyecto>(),
    guardarLasRespuestasDeLaConsulta: vi.fn<typeof real.guardarLasRespuestasDeLaConsulta>(),
  };
});

const LUGAR = { householdId: 'h1', proyectoId: 'p1', ahora: '2026-10-01T12:00:00.000Z' };

const EN_DOLARES: FilaDe<'pagos'> = {
  id: 'g1',
  household_id: 'h1',
  proyecto_id: 'p1',
  fecha: '2026-09-20',
  concepto: 'Seña',
  monto_centavos: 50_000,
  ya_en_la_apertura: false,
  moneda: 'USD',
  cotizacion_centavos: 145_000,
  tesoro_id: 't-dolares',
  created_at: '2026-09-20T10:00:00.000Z',
  updated_at: '2026-09-20T10:00:00.000Z',
  deleted_at: null,
  version: 3,
};

describe('la fila de un pago que se guarda, antes de que conteste la base', () => {
  it('sin la moneda, el dólar ni el tesoro en el pedido, conserva los que ya tenía, como la base', () => {
    const fila = filaDelPagoGuardado(
      { id: 'g1', fecha: '2026-09-21', concepto: 'Seña', monto_centavos: 50_000 },
      EN_DOLARES,
      LUGAR,
    );

    expect(fila).toMatchObject({
      fecha: '2026-09-21',
      moneda: 'USD',
      cotizacion_centavos: 145_000,
      tesoro_id: 't-dolares',
      version: 3,
      created_at: '2026-09-20T10:00:00.000Z',
    });
  });

  it('un pago nuevo sin esas claves nace en pesos, sin dólar y sin tesoro', () => {
    const fila = filaDelPagoGuardado(
      { id: 'g2', fecha: '2026-09-21', concepto: 'Seña', monto_centavos: 7_250_000 },
      undefined,
      LUGAR,
    );

    expect(fila).toMatchObject({
      moneda: 'ARS',
      cotizacion_centavos: null,
      tesoro_id: null,
      ya_en_la_apertura: false,
      version: 1,
      created_at: LUGAR.ahora,
    });
  });

  it('con las claves, toma las que trae el pedido, también un null que borra el dólar', () => {
    const fila = filaDelPagoGuardado(
      {
        id: 'g1',
        fecha: '2026-09-21',
        concepto: 'Seña',
        monto_centavos: 7_250_000,
        moneda: 'ARS',
        cotizacion_centavos: null,
        tesoro_id: null,
      },
      EN_DOLARES,
      LUGAR,
    );

    expect(fila).toMatchObject({ moneda: 'ARS', cotizacion_centavos: null, tesoro_id: null });
  });
});

const DE_MADERA: FilaDe<'gastos'> = {
  id: 'x1',
  household_id: 'h1',
  proyecto_id: 'p1',
  fecha: '2026-09-20',
  descripcion: 'Placas de melamina',
  monto_centavos: 8_000_000,
  categoria: 'madera',
  created_at: '2026-09-20T10:00:00.000Z',
  updated_at: '2026-09-20T10:00:00.000Z',
  deleted_at: null,
  version: 2,
};

describe('la fila de un gasto que se guarda, antes de que conteste la base', () => {
  it('sin la categoría en el pedido (una app de antes), conserva la que tenía, como la base', () => {
    const fila = filaDelGastoGuardado(
      { id: 'x1', fecha: '2026-09-21', descripcion: 'Placas', monto_centavos: 9_000_000 },
      DE_MADERA,
      LUGAR,
    );

    expect(fila).toMatchObject({
      monto_centavos: 9_000_000,
      categoria: 'madera',
      version: 2,
      created_at: '2026-09-20T10:00:00.000Z',
    });
  });

  it('con la categoría, toma la que trae, también un null que la saca', () => {
    expect(
      filaDelGastoGuardado(
        {
          id: 'x1',
          fecha: '2026-09-21',
          descripcion: 'Flete',
          monto_centavos: 1,
          categoria: 'flete',
        },
        DE_MADERA,
        LUGAR,
      ).categoria,
    ).toBe('flete');
    expect(
      filaDelGastoGuardado(
        {
          id: 'x1',
          fecha: '2026-09-21',
          descripcion: 'Placas',
          monto_centavos: 1,
          categoria: null,
        },
        DE_MADERA,
        LUGAR,
      ).categoria,
    ).toBeNull();
  });

  it('un gasto nuevo sin la clave nace sin categoría', () => {
    expect(
      filaDelGastoGuardado(
        { id: 'x2', fecha: '2026-09-21', descripcion: 'Nafta', monto_centavos: 1 },
        undefined,
        LUGAR,
      ),
    ).toMatchObject({ categoria: null, version: 1, created_at: LUGAR.ahora });
  });
});

const CLAVE_DE_LA_REPLICA = ['replica', 'u1'] as const;
const AHORA = '2026-10-20T12:00:00.000Z';

const DEL_ACCESO = {
  id: 'acceso',
  pregunta: 'Acceso al lugar',
  respuesta: 'Tercer piso por escalera',
} satisfies RespuestaDeLaConsulta;
const DE_LA_URGENCIA = {
  id: 'urgencia',
  pregunta: 'Urgencia',
  respuesta: 'Antes de fin de año',
} satisfies RespuestaDeLaConsulta;

const CONSULTA: FilaDe<'proyectos'> = {
  household_id: 'h1',
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 3,
  id: 'p1',
  cliente_id: 'c1',
  titulo: 'Placard',
  descripcion: '',
  estado: 'contacto',
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
  respuestas_de_la_consulta: [{ ...DEL_ACCESO }],
};

function replicaCon(proyectos: readonly FilaDe<'proyectos'>[]): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h1: { id: 'h1', nombre: 'MAUN', deleted_at: null, version: 1 } };
  tablas.proyectos = Object.fromEntries(proyectos.map((proyecto) => [proyecto.id, proyecto]));
  return { usuarioId: 'u1', cursor: '', reconciliadoEn: AHORA, tablas } as unknown as Replica;
}

function clienteCon(proyectos: readonly FilaDe<'proyectos'>[]): QueryClient {
  const cliente = new QueryClient();
  cliente.setQueryData(CLAVE_DE_LA_REPLICA, replicaCon(proyectos));
  return cliente;
}

function filaEn(cliente: QueryClient, id: string): FilaDe<'proyectos'> | undefined {
  const replica = cliente.getQueryData<Replica>(CLAVE_DE_LA_REPLICA);
  return replica && filaPorId(replica, 'proyectos', id);
}

function correr<TDatos, TVariables>(
  cliente: QueryClient,
  opciones: MutationOptions<TDatos, unknown, TVariables>,
  variables: TVariables,
): Promise<TDatos> {
  return cliente.getMutationCache().build(cliente, opciones).execute(variables);
}

interface Pendiente<T> {
  promesa: Promise<T>;
  resolver: (valor: T) => void;
}

function pendiente<T>(): Pendiente<T> {
  let resolver: (valor: T) => void = () => undefined;
  const promesa = new Promise<T>((alResolver) => {
    resolver = alResolver;
  });
  return { promesa, resolver };
}

function guardadoDe(proyecto: FilaDe<'proyectos'>): ProyectoGuardado {
  return { proyecto, pagos: [], gastos: [], opciones: [], necesidades: [], proximos: [] };
}

beforeEach(() => {
  vi.mocked(guardarElProyecto).mockReset();
  vi.mocked(guardarLasRespuestasDeLaConsulta).mockReset();
});

describe('las respuestas de la consulta de un trabajo', () => {
  const OTRAS = [{ ...DEL_ACCESO, respuesta: 'Planta baja' }, DE_LA_URGENCIA];

  function cambio(respuestas: readonly RespuestaDeLaConsulta[]): RespuestasDelTrabajo {
    return { id: 'p1', respuestas, previas: [DEL_ACCESO], version: 3 };
  }

  it('si cambian, la fila optimista las trae y sube la versión; la base la confirma', async () => {
    const cliente = clienteCon([CONSULTA]);
    const base = pendiente<FilaDe<'proyectos'>>();
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockReturnValue(base.promesa);

    const enCurso = correr(cliente, MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA, cambio(OTRAS));
    await vi.waitFor(() => {
      expect(guardarLasRespuestasDeLaConsulta).toHaveBeenCalledWith('p1', OTRAS);
    });
    expect(filaEn(cliente, 'p1')).toMatchObject({ respuestas_de_la_consulta: OTRAS, version: 4 });
    expect(filaEn(cliente, 'p1')?.updated_at).not.toBe(AHORA);

    const confirmada = {
      ...CONSULTA,
      respuestas_de_la_consulta: OTRAS,
      version: 4,
      updated_at: '2026-10-20T12:00:05.000Z',
    };
    base.resolver(confirmada);
    await enCurso;
    expect(filaEn(cliente, 'p1')).toEqual(confirmada);
  });

  it('si son las mismas, la fila no cambia: ni la versión ni la fecha', async () => {
    const cliente = clienteCon([CONSULTA]);
    const base = pendiente<FilaDe<'proyectos'>>();
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockReturnValue(base.promesa);

    const enCurso = correr(
      cliente,
      MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA,
      cambio([{ ...DEL_ACCESO }]),
    );
    await vi.waitFor(() => {
      expect(guardarLasRespuestasDeLaConsulta).toHaveBeenCalledOnce();
    });
    expect(filaEn(cliente, 'p1')).toEqual(CONSULTA);

    base.resolver(CONSULTA);
    await enCurso;
    expect(filaEn(cliente, 'p1')).toEqual(CONSULTA);
  });

  it('si la base las rechaza, vuelven las de antes con la versión de antes', async () => {
    const cliente = clienteCon([CONSULTA]);
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockRejectedValue({
      code: '23514',
      message: 'proyectos_respuestas_de_la_consulta_validas',
    });

    await expect(
      correr(cliente, MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA, cambio(OTRAS)),
    ).rejects.toMatchObject({ code: '23514' });
    expect(guardarLasRespuestasDeLaConsulta).toHaveBeenCalledOnce();
    expect(filaEn(cliente, 'p1')).toMatchObject({
      respuestas_de_la_consulta: [DEL_ACCESO],
      version: 3,
    });
  });
});

describe('el alta de un trabajo con las respuestas de la consulta', () => {
  const NUEVO: FilaDe<'proyectos'> = {
    ...CONSULTA,
    id: 'p2',
    version: 1,
    respuestas_de_la_consulta: [],
  };

  function alta(respuestas?: readonly RespuestaDeLaConsulta[]): GuardadoDeProyecto {
    return {
      pedido: {
        id: 'p2',
        version: null,
        datos: datosActualesDelProyecto(NUEVO),
        pagos: [],
        gastos: [],
      },
      previos: { proyecto: null, pagos: [], gastos: [], opciones: [], necesidades: [] },
      ...(respuestas === undefined ? {} : { respuestas }),
    };
  }

  it('la fila optimista nace con las respuestas y la versión 2, y se guardan después del alta', async () => {
    const cliente = clienteCon([]);
    const base = pendiente<ProyectoGuardado>();
    vi.mocked(guardarElProyecto).mockReturnValue(base.promesa);
    const conRespuestas = { ...NUEVO, respuestas_de_la_consulta: [DEL_ACCESO], version: 2 };
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockResolvedValue(conRespuestas);

    const enCurso = correr(cliente, MUTACION_DE_PROYECTO, alta([DEL_ACCESO]));
    await vi.waitFor(() => {
      expect(guardarElProyecto).toHaveBeenCalledOnce();
    });
    expect(filaEn(cliente, 'p2')).toMatchObject({
      respuestas_de_la_consulta: [DEL_ACCESO],
      version: 2,
    });
    expect(guardarLasRespuestasDeLaConsulta).not.toHaveBeenCalled();

    base.resolver(guardadoDe(NUEVO));
    const guardado = await enCurso;
    expect(guardarLasRespuestasDeLaConsulta).toHaveBeenCalledOnce();
    expect(guardarLasRespuestasDeLaConsulta).toHaveBeenCalledWith('p2', [DEL_ACCESO]);
    expect(guardado.proyecto).toEqual(conRespuestas);
    expect(filaEn(cliente, 'p2')).toEqual(conRespuestas);
  });

  it('si la base rechaza las respuestas del alta, el trabajo ya guardado queda, sin ellas', async () => {
    const cliente = clienteCon([]);
    vi.mocked(guardarElProyecto).mockResolvedValue(guardadoDe(NUEVO));
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockRejectedValue({
      code: '23514',
      message: 'proyectos_respuestas_de_la_consulta_validas',
    });

    const guardado = await correr(cliente, MUTACION_DE_PROYECTO, alta([DEL_ACCESO]));
    expect(guardado.proyecto).toEqual(NUEVO);
    expect(filaEn(cliente, 'p2')).toEqual(NUEVO);
  });

  it('si se corta la señal al guardar las respuestas, se reintenta todo: el alta repetida no cambia nada', async () => {
    const cliente = clienteCon([]);
    vi.mocked(guardarElProyecto).mockResolvedValue(guardadoDe(NUEVO));
    vi.mocked(guardarLasRespuestasDeLaConsulta).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      correr(cliente, { ...MUTACION_DE_PROYECTO, retry: false }, alta([DEL_ACCESO])),
    ).rejects.toThrow('Failed to fetch');
  });

  it('un alta sin respuestas nace en la versión 1 y no las guarda aparte', async () => {
    const cliente = clienteCon([]);
    vi.mocked(guardarElProyecto).mockResolvedValue(guardadoDe(NUEVO));

    await correr(cliente, MUTACION_DE_PROYECTO, alta([]));
    await correr(cliente, MUTACION_DE_PROYECTO, alta());
    expect(guardarElProyecto).toHaveBeenCalledTimes(2);
    expect(guardarLasRespuestasDeLaConsulta).not.toHaveBeenCalled();
    expect(filaEn(cliente, 'p2')).toMatchObject({ respuestas_de_la_consulta: [], version: 1 });
  });

  it('al editar un trabajo que ya existe, las respuestas no viajan con el guardado', async () => {
    const cliente = clienteCon([CONSULTA]);
    const base = pendiente<ProyectoGuardado>();
    vi.mocked(guardarElProyecto).mockReturnValue(base.promesa);
    const edicion: GuardadoDeProyecto = {
      pedido: {
        id: 'p1',
        version: 3,
        datos: { ...datosActualesDelProyecto(CONSULTA), titulo: 'Placard del cuarto' },
        pagos: [],
        gastos: [],
      },
      previos: { proyecto: CONSULTA, pagos: [], gastos: [], opciones: [], necesidades: [] },
      respuestas: [DE_LA_URGENCIA],
    };

    const enCurso = correr(cliente, MUTACION_DE_PROYECTO, edicion);
    await vi.waitFor(() => {
      expect(guardarElProyecto).toHaveBeenCalledOnce();
    });
    expect(filaEn(cliente, 'p1')).toMatchObject({
      titulo: 'Placard del cuarto',
      respuestas_de_la_consulta: [DEL_ACCESO],
      version: 4,
    });

    base.resolver(guardadoDe({ ...CONSULTA, titulo: 'Placard del cuarto', version: 4 }));
    await enCurso;
    expect(guardarLasRespuestasDeLaConsulta).not.toHaveBeenCalled();
  });
});
