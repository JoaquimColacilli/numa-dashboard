import { eventosDeLaAgenda } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  COLUMNA_DE_LA_FECHA,
  COLUMNA_DE_LA_MARCA,
  COLUMNAS_DE_MARCAS,
  datosDeLaAgenda,
  datosDeLaAgendaDeLaReplica,
  gastosDeLosTesoros,
  marcadaComoImportante,
  mesEnLaZona,
  visitaHecha,
  type FilasDeLaAgenda,
} from './agenda.ts';
import { aplicarFilaLocal, replicaVacia, type FilaDe } from './replica.ts';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const SEPTIEMBRE = { desde: '2026-09-01', hasta: '2026-09-30' };

const PROYECTO = {
  ...METADATOS,
  id: 'p1',
  cliente_id: 'c1',
  titulo: 'Mesada y alacena',
  estado: 'a_presupuestar',
  fecha_visita: '2026-09-07',
  visita_hora: '15:30:00',
  visita_hecha: true,
  entrega_estimada: null,
  entrega_hora: null,
  vencimiento_presupuesto: '2026-09-10',
  direccion_entrega: 'Sarmiento 2310',
  presupuesto_importante: false,
  visita_importante: true,
  entrega_importante: false,
} as unknown as FilaDe<'proyectos'>;

const CLIENTE = {
  ...METADATOS,
  id: 'c1',
  nombre: 'Familia Villalba',
  zona: 'Morón',
} as unknown as FilaDe<'clientes'>;

const PROXIMO: FilaDe<'proximos_contactos'> = {
  ...METADATOS,
  id: 's1',
  proyecto_id: 'p1',
  fecha: '2026-10-01',
  nota: 'Después de las vacaciones',
  etapa_previa: 'presupuesto_enviado',
  hecho_el: null,
  resultado: null,
  respuesta: '',
  importante: true,
};

const ANOTACION: FilaDe<'anotaciones'> = {
  ...METADATOS,
  id: 'n1',
  fecha: '2026-09-08',
  hora: '15:00:00',
  texto: 'Retirar el pulpo',
  categoria: 'taller',
  proyecto_id: null,
  hecha: false,
  importante: true,
};

describe('datosDeLaAgenda', () => {
  it('traduce las filas de la base a lo que el dominio lee, y la hora va sin segundos', () => {
    expect(
      datosDeLaAgenda(
        {
          proyectos: [PROYECTO],
          clientes: [CLIENTE],
          anotaciones: [ANOTACION, { ...ANOTACION, id: 'n2', hora: null }],
        },
        SEPTIEMBRE,
      ),
    ).toEqual({
      proyectos: [
        {
          id: 'p1',
          clienteId: 'c1',
          titulo: 'Mesada y alacena',
          estado: 'a_presupuestar',
          fechaVisita: '2026-09-07',
          visitaHora: '15:30',
          visitaHecha: true,
          entregaEstimada: null,
          entregaHora: null,
          entregaComprometida: null,
          entregaFranja: null,
          vencimientoPresupuesto: '2026-09-10',
          direccionEntrega: 'Sarmiento 2310',
          importante: { presupuesto: false, visita: true, entrega: false },
        },
      ],
      clientes: [{ id: 'c1', nombre: 'Familia Villalba', zona: 'Morón' }],
      anotaciones: [
        {
          id: 'n1',
          fecha: '2026-09-08',
          hora: '15:00',
          texto: 'Retirar el pulpo',
          categoria: 'taller',
          proyectoId: null,
          hecha: false,
          importante: true,
        },
        expect.objectContaining({ id: 'n2', hora: null }),
      ],
      proximos: [],
      vencimientos: [],
    });
  });

  it('el seguimiento viaja con su día, lo hecho y la marca, sin las filas borradas', () => {
    expect(
      datosDeLaAgenda(
        {
          proyectos: [],
          clientes: [],
          anotaciones: [],
          proximos_contactos: [
            PROXIMO,
            { ...PROXIMO, id: 's2', hecho_el: '2026-09-20', resultado: 'otra_fecha' },
            { ...PROXIMO, id: 's3', deleted_at: '2026-09-21T12:00:00Z' },
          ],
        },
        SEPTIEMBRE,
      ).proximos,
    ).toEqual([
      {
        id: 's1',
        proyectoId: 'p1',
        fecha: '2026-10-01',
        hechoEl: null,
        nota: 'Después de las vacaciones',
        importante: true,
      },
      expect.objectContaining({ id: 's2', hechoEl: '2026-09-20' }),
    ]);
  });

  it('una fila guardada en el dispositivo antes de las columnas nuevas no tiene la visita hecha ni marcas', () => {
    const vieja = {
      ...METADATOS,
      id: 'p2',
      cliente_id: 'c1',
      titulo: 'Placard',
      estado: 'entregado',
      fecha_visita: '2026-08-01',
      entrega_estimada: '2026-09-01',
      vencimiento_presupuesto: null,
      direccion_entrega: '',
    } as unknown as FilaDe<'proyectos'>;

    expect(visitaHecha(vieja)).toBe(false);
    expect(marcadaComoImportante(vieja, 'entrega')).toBe(false);
    expect(
      datosDeLaAgenda({ proyectos: [vieja], clientes: [], anotaciones: [] }, SEPTIEMBRE)
        .proyectos[0],
    ).toMatchObject({
      visitaHecha: false,
      entregaComprometida: null,
      entregaFranja: null,
      importante: { presupuesto: false, visita: false, entrega: false },
    });
  });

  it('cada evento derivado tiene su columna de marca, y son las tres de la base', () => {
    expect(Object.values(COLUMNA_DE_LA_MARCA)).toEqual([...COLUMNAS_DE_MARCAS]);
  });
});

describe('la entrega comprometida', () => {
  it('viaja con su franja, para que la agenda la ponga en ese día y no deje arrastrarla', () => {
    const comprometida = {
      ...PROYECTO,
      estado: 'en_curso',
      entrega_estimada: '2026-10-05',
      entrega_comprometida: '2026-10-08',
      entrega_comprometida_franja: 'manana',
    } as unknown as FilaDe<'proyectos'>;
    expect(
      datosDeLaAgenda({ proyectos: [comprometida], clientes: [], anotaciones: [] }, SEPTIEMBRE)
        .proyectos[0],
    ).toMatchObject({
      entregaEstimada: '2026-10-05',
      entregaComprometida: '2026-10-08',
      entregaFranja: 'manana',
    });
  });
});

describe('las columnas de las que sale cada evento derivado', () => {
  it('cada categoría derivada tiene una sola columna donde vive su fecha', () => {
    expect(COLUMNA_DE_LA_FECHA).toEqual({
      presupuesto: 'vencimiento_presupuesto',
      visita: 'fecha_visita',
      entrega: 'entrega_estimada',
    });
  });

  it('una fila guardada antes de las horas no trae hora, y no rompe', () => {
    const sinHoras = { ...PROYECTO } as unknown as Record<string, unknown>;
    delete sinHoras.visita_hora;
    delete sinHoras.entrega_hora;
    const datos = datosDeLaAgenda(
      {
        proyectos: [sinHoras as unknown as FilaDe<'proyectos'>],
        clientes: [CLIENTE],
        anotaciones: [],
      },
      SEPTIEMBRE,
    );
    expect(datos.proyectos[0]?.visitaHora).toBeNull();
    expect(datos.proyectos[0]?.entregaHora).toBeNull();
  });
});

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const CUOTAS = '00000000-0000-7000-8000-000000000011';

function tesoro(id: string, clave: string | null, nombre: string): FilaDe<'tesoros'> {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta: 'grana',
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
  } as unknown as FilaDe<'tesoros'>;
}

const TESOROS = [
  tesoro(HOGAR, 'hogar', 'Hogar'),
  tesoro(MAUN, 'maun', 'Maun'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo'),
  tesoro(FIJOS, null, 'Gastos fijos'),
  tesoro(CUOTAS, null, 'Cuotas'),
];

const FILA = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: 180_000_000,
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: 56_000_000,
      renglones: [
        { nombre: 'Alquiler', monto: 50_000_000, dia: 10 },
        { nombre: 'Luz', monto: 6_000_000, dia: 31 },
      ],
      desde: null,
      modo: 'saldo',
      hastaLaMeta: false,
    },
    {
      tesoro: CUOTAS,
      clase: 'fijos',
      tope: 20_000_000,
      renglones: [{ nombre: 'Cuota del auto', monto: 20_000_000, dia: 1 }],
      desde: '2026-10',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function ajustes(extra: object = {}): FilaDe<'ajustes'> {
  return {
    ...METADATOS,
    id: 'a1',
    fila: FILA,
    fila_version: 4,
    fila_guardada_at: '2026-09-02T13:00:00.123456+00:00',
    ...extra,
  } as unknown as FilaDe<'ajustes'>;
}

function gasto(id: string, extra: object): FilaDe<'movimientos'> {
  return {
    ...METADATOS,
    id,
    fecha: '2026-09-08',
    tipo: 'gasto',
    tesoro_origen: null,
    tesoro_destino: null,
    desde_id: FIJOS,
    hacia_id: null,
    cubre_el_mes: null,
    monto_centavos: 50_000_000,
    categoria: 'Alquiler',
    descripcion: '',
    proyecto_id: null,
    ...extra,
  } as unknown as FilaDe<'movimientos'>;
}

function conLaFila(extra: Partial<FilasDeLaAgenda> = {}): FilasDeLaAgenda {
  return {
    proyectos: [],
    clientes: [],
    anotaciones: [],
    ajustes: [ajustes()],
    tesoros: TESOROS,
    movimientos: [],
    ...extra,
  };
}

describe('los vencimientos de la fila en la agenda', () => {
  it('cada renglón con día vence en su día, con su tesoro y su monto, y lo pagado en el mes queda hecho', () => {
    const datos = datosDeLaAgenda(
      conLaFila({
        movimientos: [
          gasto('m1', { categoria: ' alquiler ' }),
          gasto('m2', { categoria: 'Luz', desde_id: CUOTAS }),
          gasto('m3', { categoria: 'Luz', fecha: '2026-08-31' }),
          gasto('m4', { categoria: 'Luz', deleted_at: '2026-09-09T12:00:00Z' }),
          gasto('m5', { categoria: 'Luz', tipo: 'transferencia', hacia_id: MAUN }),
        ],
      }),
      SEPTIEMBRE,
    );

    expect(datos.vencimientos).toEqual([
      {
        id: `vencimiento:${FIJOS}:0:2026-09-10`,
        tesoro: FIJOS,
        nombreDelTesoro: 'Gastos fijos',
        renglon: 'Alquiler',
        monto: 50_000_000,
        fecha: '2026-09-10',
        pagado: true,
      },
      {
        id: `vencimiento:${FIJOS}:1:2026-09-30`,
        tesoro: FIJOS,
        nombreDelTesoro: 'Gastos fijos',
        renglon: 'Luz',
        monto: 6_000_000,
        fecha: '2026-09-30',
        pagado: false,
      },
    ]);
    expect(
      eventosDeLaAgenda(datos, SEPTIEMBRE).map((evento) => [evento.clase, evento.hecha]),
    ).toEqual([
      ['vencimiento', true],
      ['vencimiento', false],
    ]);
  });

  it('cubre los meses del rango, y un paso con desde aparece recién desde ese mes', () => {
    const datos = datosDeLaAgenda(conLaFila(), { desde: '2026-09-29', hasta: '2026-10-02' });

    expect(datos.vencimientos.map((uno) => [uno.renglon, uno.fecha])).toEqual([
      ['Alquiler', '2026-09-10'],
      ['Luz', '2026-09-30'],
      ['Alquiler', '2026-10-10'],
      ['Luz', '2026-10-31'],
      ['Cuota del auto', '2026-10-01'],
    ]);
  });

  it('el mes del guardado se toma en la zona que se pide, y antes de ese mes no vence nada', () => {
    const tarde = conLaFila({
      ajustes: [ajustes({ fila_guardada_at: '2026-10-01T01:30:00.123456+00:00' })],
    });

    expect(
      datosDeLaAgenda(tarde, SEPTIEMBRE, 'America/Argentina/Buenos_Aires').vencimientos,
    ).toHaveLength(2);
    expect(datosDeLaAgenda(tarde, SEPTIEMBRE, 'UTC').vencimientos).toEqual([]);
    expect(mesEnLaZona('2026-10-01T01:30:00.123456+00:00', 'America/Argentina/Buenos_Aires')).toBe(
      '2026-09',
    );
    expect(mesEnLaZona('2026-10-01T01:30:00.123456+00:00', 'UTC')).toBe('2026-10');
    expect(mesEnLaZona('2026-09-15T12:00:00Z', 'No/Existe')).toBe('2026-09');
    expect(mesEnLaZona('ayer')).toBeNull();
  });

  it('una fila guardada sin fecha o con una fecha que no se lee vence en todos los meses', () => {
    for (const fila_guardada_at of [null, 'cualquier cosa']) {
      const datos = datosDeLaAgenda(conLaFila({ ajustes: [ajustes({ fila_guardada_at })] }), {
        desde: '2026-08-01',
        hasta: '2026-08-31',
      });
      expect(datos.vencimientos.map((uno) => uno.fecha)).toEqual(['2026-08-10', '2026-08-31']);
    }
  });

  it('la fila con la forma de antes no tiene días, y sin fila guardada tampoco hay vencimientos', () => {
    const deAntes = {
      pasos: [
        {
          tesoro: FIJOS,
          clase: 'fijos',
          tope: 50_000_000,
          renglones: [{ nombre: 'Alquiler', monto: 50_000_000 }],
          desde: null,
        },
      ],
      reparto: [],
      sueldoPorTrabajo: false,
    };

    for (const fila of [deAntes, null, { pasos: 'rota' }]) {
      expect(
        datosDeLaAgenda(conLaFila({ ajustes: [ajustes({ fila })] }), SEPTIEMBRE).vencimientos,
      ).toEqual([]);
    }
  });

  it('las filas de antes, sin ajustes, tesoros ni movimientos, no tienen vencimientos', () => {
    expect(
      datosDeLaAgenda({ proyectos: [], clientes: [], anotaciones: [] }, SEPTIEMBRE).vencimientos,
    ).toEqual([]);
    const { fila: _fila, fila_guardada_at: _en, ...sinColumnas } = ajustes();
    expect(
      datosDeLaAgenda(
        conLaFila({ ajustes: [sinColumnas as unknown as FilaDe<'ajustes'>] }),
        SEPTIEMBRE,
      ).vencimientos,
    ).toEqual([]);
  });

  it('sin la fila de tesoros, el renglón vence igual, sin el nombre del tesoro', () => {
    expect(
      datosDeLaAgenda(conLaFila({ tesoros: undefined }), SEPTIEMBRE).vencimientos.map(
        (uno) => uno.nombreDelTesoro,
      ),
    ).toEqual(['', '']);
  });

  it('desde la réplica lee las siete tablas', () => {
    const movimiento = gasto('m1', {});
    let replica = replicaVacia('u');
    replica = aplicarFilaLocal(replica, 'proyectos', PROYECTO);
    replica = aplicarFilaLocal(replica, 'clientes', CLIENTE);
    replica = aplicarFilaLocal(replica, 'anotaciones', ANOTACION);
    replica = aplicarFilaLocal(replica, 'proximos_contactos', PROXIMO);
    replica = aplicarFilaLocal(replica, 'ajustes', ajustes());
    replica = aplicarFilaLocal(replica, 'movimientos', movimiento);
    for (const uno of TESOROS) replica = aplicarFilaLocal(replica, 'tesoros', uno);

    const datos = datosDeLaAgendaDeLaReplica(replica, SEPTIEMBRE, 'UTC');
    expect(datos).toEqual(
      datosDeLaAgenda(
        {
          proyectos: [PROYECTO],
          clientes: [CLIENTE],
          anotaciones: [ANOTACION],
          proximos_contactos: [PROXIMO],
          ajustes: [ajustes()],
          tesoros: TESOROS,
          movimientos: [movimiento],
        },
        SEPTIEMBRE,
        'UTC',
      ),
    );
    expect(datos.vencimientos.map((uno) => uno.pagado)).toEqual([true, false]);
  });
});

describe('los gastos desde un tesoro', () => {
  it('salen de los movimientos de gasto, por su id o, en una fila de antes, por su clave', () => {
    const sinId = gasto('m2', { desde_id: undefined, tesoro_origen: 'maun', categoria: 'Luz' });
    const deCocos = gasto('m3', { desde_id: null, tesoro_origen: 'cocos', categoria: 'X' });
    const sinOrigen = gasto('m4', { desde_id: null });

    expect(gastosDeLosTesoros([gasto('m1', {}), sinId, deCocos, sinOrigen], TESOROS)).toEqual([
      { tesoro: FIJOS, categoria: 'Alquiler', fecha: '2026-09-08' },
      { tesoro: MAUN, categoria: 'Luz', fecha: '2026-09-08' },
      { tesoro: 'cocos', categoria: 'X', fecha: '2026-09-08' },
    ]);
  });
});
