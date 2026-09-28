import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';
import { TESORO, type TintaDeTesoro } from '@/shared/lib';

import type { Proyecto } from './catalogos';
import {
  corteDelMes,
  fraseDelCorte,
  piezasDelCorte,
  type CorteDelMes,
  type ParteDelCorte,
} from './corte';
import { distribucionCongelada } from './despiece';

const SEPTIEMBRE = '2026-09';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const FIJOS = '01900000-0000-7000-8000-000000000005';

interface Reparto {
  cobrado: number;
  gastos: number;
  diezmo: number;
  sueldo: number;
  fijos: number;
  remanente: number;
}

function cerrado(
  id: string,
  fecha: string,
  reparto: Reparto,
  extra: Partial<Proyecto> = {},
): Proyecto {
  return {
    id,
    estado: 'cobrado',
    fecha_cobro: fecha,
    dist_cobrado_centavos: reparto.cobrado,
    dist_gastos_centavos: reparto.gastos,
    dist_diezmo_bp: 1000,
    dist_tope_sueldo_centavos: reparto.sueldo,
    dist_tope_fijos_centavos: reparto.fijos,
    dist_diezmo_centavos: reparto.diezmo,
    dist_sueldo_centavos: reparto.sueldo,
    dist_fijos_centavos: reparto.fijos,
    dist_remanente_centavos: reparto.remanente,
    reparto_ya_en_la_apertura: false,
    deleted_at: null,
    ...extra,
  } as Proyecto;
}

function porLaFila(
  id: string,
  fecha: string,
  { cobrado, gastos, diezmo }: { cobrado: number; gastos: number; diezmo: number },
): Proyecto {
  return cerrado(
    id,
    fecha,
    { cobrado, gastos, diezmo, sueldo: 0, fijos: 0, remanente: cobrado - gastos - diezmo },
    { dist_fila_version: 3 },
  );
}

function sinCerrar(id: string, extra: Partial<Proyecto> = {}): Proyecto {
  return {
    id,
    estado: 'entregado',
    fecha_cobro: null,
    dist_cobrado_centavos: null,
    deleted_at: null,
    ...extra,
  } as Proyecto;
}

function tesoro(id: string, clave: string | null, nombre: string, tinta: string, orden = 0) {
  return {
    id,
    household_id: 'h',
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden,
    archivado_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

const LOS_TESOROS = [
  tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
  tesoro(MAUN, 'maun', 'Maun', 'maun'),
  tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
  tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
  tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
];

function reparto(
  id: string,
  proyecto: string,
  posicion: number,
  tesoroId: string,
  monto: number,
  tipo: 'paso' | 'parte' = 'paso',
) {
  return {
    id,
    household_id: 'h',
    proyecto_id: proyecto,
    posicion,
    tesoro_id: tesoroId,
    nombre: '',
    tipo,
    clase: tipo === 'paso' ? 'fijos' : null,
    objetivo_centavos: tipo === 'paso' ? monto : null,
    previo_centavos: tipo === 'paso' ? 0 : null,
    tope_centavos: tipo === 'paso' ? monto : null,
    por_mes: tipo === 'paso' ? true : null,
    porcentaje_bp: tipo === 'parte' ? 5000 : null,
    monto_centavos: monto,
    fecha: '2026-09-20',
    ya_en_la_apertura: false,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
    deleted_at: null,
    version: 1,
  };
}

function replicaCon(
  proyectos: readonly Proyecto[],
  {
    tesoros = [],
    repartos = [],
  }: { tesoros?: readonly { id: string }[]; repartos?: readonly { id: string }[] } = {},
): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  for (const proyecto of proyectos) tablas.proyectos[proyecto.id] = proyecto;
  for (const fila of tesoros) tablas.tesoros[fila.id] = fila;
  for (const fila of repartos) tablas.repartos[fila.id] = fila;
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function deSiempre(clave: 'hogar' | 'maun' | 'diezmo' | 'cocos', monto: number): ParteDelCorte {
  return {
    tesoro: clave,
    clave,
    nombre: TESORO[clave].nombre,
    tinta: clave,
    monto: centavos(monto),
  };
}

function propia(id: string, nombre: string, tinta: TintaDeTesoro, monto: number): ParteDelCorte {
  return { tesoro: id, clave: null, nombre, tinta, monto: centavos(monto) };
}

function corte(
  trabajos: number,
  tablero: number,
  partes: readonly ParteDelCorte[],
  gastos: number,
): CorteDelMes {
  return { trabajos, tablero: centavos(tablero), partes, gastos: centavos(gastos) };
}

const PLACARD: Reparto = {
  cobrado: 60_000_000,
  gastos: 10_000_000,
  diezmo: 5_000_000,
  sueldo: 30_000_000,
  fijos: 12_000_000,
  remanente: 3_000_000,
};

const SENA_RETENIDA: Reparto = {
  cobrado: 20_000_000,
  gastos: 0,
  diezmo: 2_000_000,
  sueldo: 0,
  fijos: 8_000_000,
  remanente: 10_000_000,
};

const EL_DEL_EJEMPLO = corte(
  3,
  100_000_000,
  [deSiempre('hogar', 48_000_000), deSiempre('maun', 25_800_000), deSiempre('diezmo', 8_200_000)],
  18_000_000,
);

describe('distribucionCongelada', () => {
  it('es la de la fila de un trabajo cerrado, con la neta sobre lo cobrado menos los gastos', () => {
    const distribucion = distribucionCongelada(cerrado('a', '2026-09-10', PLACARD));
    expect(distribucion).toMatchObject({
      cobrado: 60_000_000,
      gastos: 10_000_000,
      neta: 50_000_000,
      diezmo: 5_000_000,
      sueldo: 30_000_000,
      fijos: 12_000_000,
      remanente: 3_000_000,
    });
  });

  it('un trabajo sin cerrar, o cerrado sin la distribución en la fila, no tiene', () => {
    expect(distribucionCongelada(sinCerrar('b'))).toBeNull();
    expect(
      distribucionCongelada(cerrado('c', '2026-09-10', PLACARD, { estado: 'entregado' })),
    ).toBeNull();
    expect(
      distribucionCongelada(cerrado('d', '2026-09-10', PLACARD, { dist_cobrado_centavos: null })),
    ).toBeNull();
  });
});

describe('corteDelMes', () => {
  it('suma los cobrados y los perdidos del mes, y deja afuera los de otro mes y los que no se cerraron', () => {
    const replica = replicaCon([
      cerrado('a', '2026-09-10', PLACARD),
      cerrado('b', '2026-09-21', SENA_RETENIDA, { estado: 'perdido' }),
      cerrado('c', '2026-08-31', { ...PLACARD, cobrado: 99_000_000, sueldo: 69_000_000 }),
      sinCerrar('d'),
      cerrado('e', '2026-09-12', PLACARD, { estado: 'entregado' }),
    ]);

    expect(corteDelMes(replica, SEPTIEMBRE)).toEqual(
      corte(
        2,
        80_000_000,
        [
          deSiempre('maun', 33_000_000),
          deSiempre('hogar', 30_000_000),
          deSiempre('diezmo', 7_000_000),
        ],
        10_000_000,
      ),
    );
  });

  it('el que se repartió en la apertura cuenta: el trabajo se cerró ese mes', () => {
    const replica = replicaCon([
      cerrado('a', '2026-09-02', PLACARD, { reparto_ya_en_la_apertura: true }),
    ]);
    expect(corteDelMes(replica, SEPTIEMBRE)?.trabajos).toBe(1);
    expect(corteDelMes(replica, SEPTIEMBRE)?.tablero).toBe(60_000_000);
  });

  it('uno con más gastos que lo cobrado cuenta, no le da nada a ningún tesoro y lo cobrado va entero a los gastos', () => {
    const replica = replicaCon([
      cerrado('a', '2026-09-15', {
        cobrado: 10_000_000,
        gastos: 15_000_000,
        diezmo: 0,
        sueldo: 0,
        fijos: 0,
        remanente: -5_000_000,
      }),
    ]);

    expect(corteDelMes(replica, SEPTIEMBRE)).toEqual(corte(1, 10_000_000, [], 10_000_000));
  });

  it('sin ningún trabajo cerrado en el mes no hay corte', () => {
    expect(corteDelMes(replicaCon([]), SEPTIEMBRE)).toBeNull();
    expect(
      corteDelMes(replicaCon([cerrado('a', '2026-08-31', PLACARD), sinCerrar('b')]), SEPTIEMBRE),
    ).toBeNull();
  });

  it('un cobro por la fila corta cada paso a su tesoro, y lo de antes sigue yendo al hogar, al taller y al diezmo', () => {
    const replica = replicaCon(
      [
        cerrado('a', '2026-09-08', {
          cobrado: 150_000_000,
          gastos: 0,
          diezmo: 15_000_000,
          sueldo: 135_000_000,
          fijos: 0,
          remanente: 0,
        }),
        porLaFila('b', '2026-09-20', { cobrado: 120_000_000, gastos: 0, diezmo: 12_000_000 }),
      ],
      {
        tesoros: LOS_TESOROS,
        repartos: [
          reparto('r1', 'b', 0, HOGAR, 45_000_000),
          reparto('r2', 'b', 1, FIJOS, 63_000_000),
        ],
      },
    );

    const delMes = corteDelMes(replica, SEPTIEMBRE);
    expect(delMes).toEqual(
      corte(
        2,
        270_000_000,
        [
          { ...deSiempre('hogar', 180_000_000), tesoro: HOGAR },
          propia(FIJOS, 'Gastos fijos', 'grana', 63_000_000),
          { ...deSiempre('diezmo', 27_000_000), tesoro: DIEZMO },
        ],
        0,
      ),
    );
    expect(fraseDelCorte(delMes, SEPTIEMBRE)).toBe(
      '2 trabajos cerrados en septiembre: 67% al hogar, 23% a Gastos fijos y 10% al diezmo.',
    );
  });

  it('en un cobro por la fila, a Maun va lo que queda después de los pasos y del reparto, no lo que pasó por él', () => {
    const replica = replicaCon(
      [
        porLaFila('a', '2026-09-20', {
          cobrado: 100_000_000,
          gastos: 10_000_000,
          diezmo: 9_000_000,
        }),
      ],
      {
        tesoros: LOS_TESOROS,
        repartos: [
          reparto('r1', 'a', 0, HOGAR, 45_000_000),
          reparto('r2', 'a', 1, COCOS, 18_000_000, 'parte'),
        ],
      },
    );

    const delMes = corteDelMes(replica, SEPTIEMBRE);
    expect(delMes?.partes.map((parte) => [parte.nombre, parte.monto])).toEqual([
      ['Hogar', 45_000_000],
      ['Maun', 18_000_000],
      ['Cocos', 18_000_000],
      ['Diezmo', 9_000_000],
    ]);
    expect(delMes?.gastos).toBe(10_000_000);
    expect(fraseDelCorte(delMes ?? null, SEPTIEMBRE)).toBe(
      'Un trabajo cerrado en septiembre: 45% al hogar, 18% al taller, 18% a Cocos y 9% al diezmo. Lo demás fueron gastos.',
    );
  });

  it('un tesoro archivado sigue con su nombre y su tinta en los repartos que ya hizo', () => {
    const archivado = {
      ...tesoro('h1', null, 'Herramientas', 'petroleo'),
      archivado_at: '2026-09-25T10:00:00Z',
    };
    const replica = replicaCon(
      [porLaFila('a', '2026-09-20', { cobrado: 10_000_000, gastos: 0, diezmo: 1_000_000 })],
      {
        tesoros: [...LOS_TESOROS, archivado],
        repartos: [reparto('r1', 'a', 0, 'h1', 9_000_000)],
      },
    );

    expect(corteDelMes(replica, SEPTIEMBRE)?.partes[0]).toEqual(
      propia('h1', 'Herramientas', 'petroleo', 9_000_000),
    );
  });
});

describe('piezasDelCorte', () => {
  it('son las partes en el orden del corte y los gastos al final, cada una sobre lo cobrado', () => {
    expect(piezasDelCorte(EL_DEL_EJEMPLO)).toEqual([
      { id: 'hogar', tono: 'hogar', nombre: 'Hogar', parte: 0.48, porcentaje: '48%' },
      { id: 'maun', tono: 'maun', nombre: 'Maun', parte: 0.258, porcentaje: '26%' },
      { id: 'diezmo', tono: 'diezmo', nombre: 'Diezmo', parte: 0.082, porcentaje: '8%' },
      { id: 'gastos', tono: 'sobrante', nombre: 'Gastos', parte: 0.18, porcentaje: '18%' },
    ]);
  });

  it('los tesoros del dueño cortan con su tinta y su id, y los gastos van sin color de tesoro', () => {
    const piezas = piezasDelCorte(
      corte(
        2,
        30_000_000,
        [propia(FIJOS, 'Gastos fijos', 'grana', 20_000_000), deSiempre('diezmo', 3_000_000)],
        7_000_000,
      ),
    );
    expect(piezas.map((pieza) => [pieza.id, pieza.tono, pieza.nombre])).toEqual([
      [FIJOS, 'grana', 'Gastos fijos'],
      ['diezmo', 'diezmo', 'Diezmo'],
      ['gastos', 'sobrante', 'Gastos'],
    ]);
  });

  it('sin gastos no hay pieza de gastos', () => {
    const piezas = piezasDelCorte(
      corte(1, 20_000_000, [deSiempre('hogar', 12_000_000), deSiempre('maun', 8_000_000)], 0),
    );
    expect(piezas.map((pieza) => pieza.id)).toEqual(['hogar', 'maun']);
  });

  it('sin nada cobrado no hay tablero que cortar', () => {
    expect(piezasDelCorte(corte(1, 0, [], 0))).toEqual([]);
  });
});

describe('fraseDelCorte', () => {
  it('sin corte, el mes todavía no se cortó', () => {
    expect(fraseDelCorte(null, SEPTIEMBRE)).toBe(
      'Septiembre todavía no se cortó. Cuando cierres un trabajo, acá vas a ver a dónde va cada peso.',
    );
    expect(fraseDelCorte(null, '2026-10')).toBe(
      'Octubre todavía no se cortó. Cuando cierres un trabajo, acá vas a ver a dónde va cada peso.',
    );
  });

  it('dice cuántos trabajos, a dónde fue cada parte y, si hubo, que lo demás fueron gastos', () => {
    expect(fraseDelCorte(EL_DEL_EJEMPLO, SEPTIEMBRE)).toBe(
      '3 trabajos cerrados en septiembre: 48% al hogar, 26% al taller y 8% al diezmo. Lo demás fueron gastos.',
    );
    expect(
      fraseDelCorte(
        corte(1, 100, [deSiempre('hogar', 60), deSiempre('maun', 30), deSiempre('diezmo', 10)], 0),
        SEPTIEMBRE,
      ),
    ).toBe('Un trabajo cerrado en septiembre: 60% al hogar, 30% al taller y 10% al diezmo.');
  });

  it('nombra al hogar, al taller y al diezmo como siempre, y a los demás por su nombre', () => {
    expect(
      fraseDelCorte(
        corte(
          2,
          100_000_000,
          [
            deSiempre('hogar', 50_000_000),
            propia(FIJOS, 'Gastos fijos', 'grana', 20_000_000),
            deSiempre('cocos', 10_000_000),
            deSiempre('diezmo', 10_000_000),
            deSiempre('maun', 10_000_000),
          ],
          0,
        ),
        SEPTIEMBRE,
      ),
    ).toBe(
      '2 trabajos cerrados en septiembre: 50% al hogar, 20% a Gastos fijos, 10% a Cocos, 10% al diezmo y 10% al taller.',
    );
  });

  it('nombra solo las partes que no son cero', () => {
    expect(
      fraseDelCorte(
        corte(1, 20_000_000, [deSiempre('maun', 18_000_000), deSiempre('diezmo', 2_000_000)], 0),
        SEPTIEMBRE,
      ),
    ).toBe('Un trabajo cerrado en septiembre: 90% al taller y 10% al diezmo.');
    expect(
      fraseDelCorte(
        corte(1, 10_000_000, [deSiempre('diezmo', 1_000_000), deSiempre('hogar', 0)], 9_000_000),
        SEPTIEMBRE,
      ),
    ).toBe('Un trabajo cerrado en septiembre: 10% al diezmo. Lo demás fueron gastos.');
  });

  it('una parte que redondea a cero dice menos del 1%', () => {
    expect(
      fraseDelCorte(
        corte(
          2,
          100_000_000,
          [
            deSiempre('hogar', 60_000_000),
            deSiempre('maun', 39_700_000),
            deSiempre('diezmo', 300_000),
          ],
          0,
        ),
        SEPTIEMBRE,
      ),
    ).toBe(
      '2 trabajos cerrados en septiembre: 60% al hogar, 40% al taller y menos del 1% al diezmo.',
    );
  });

  it('si los gastos se comieron lo cobrado, lo dice', () => {
    expect(fraseDelCorte(corte(1, 10_000_000, [], 10_000_000), SEPTIEMBRE)).toBe(
      'Un trabajo cerrado en septiembre, y los gastos se comieron lo cobrado: no quedó ganancia para repartir.',
    );
  });

  it('si no se cobró nada, no hubo nada para repartir', () => {
    expect(fraseDelCorte(corte(1, 0, [], 0), SEPTIEMBRE)).toBe(
      'Un trabajo cerrado en septiembre, sin nada cobrado: no hubo nada para repartir.',
    );
  });

  it('cada forma cuenta uno o varios trabajos, y ningún porcentaje lleva espacio antes', () => {
    const formas: { tablero: number; partes: ParteDelCorte[]; gastos: number }[] = [
      {
        tablero: 100,
        partes: [deSiempre('hogar', 60), deSiempre('maun', 30), deSiempre('diezmo', 10)],
        gastos: 0,
      },
      {
        tablero: 100_000_000,
        partes: [
          deSiempre('hogar', 60_000_000),
          deSiempre('maun', 39_700_000),
          deSiempre('diezmo', 300_000),
        ],
        gastos: 0,
      },
      { tablero: 10_000_000, partes: [deSiempre('diezmo', 1_000_000)], gastos: 9_000_000 },
      {
        tablero: 10_000_000,
        partes: [propia(FIJOS, 'Gastos fijos', 'grana', 1_000_000)],
        gastos: 9_000_000,
      },
      { tablero: 10_000_000, partes: [], gastos: 10_000_000 },
      { tablero: 0, partes: [], gastos: 0 },
    ];
    const frases = [fraseDelCorte(null, SEPTIEMBRE)];

    for (const { tablero, partes, gastos } of formas) {
      const uno = fraseDelCorte(corte(1, tablero, partes, gastos), SEPTIEMBRE);
      const varios = fraseDelCorte(corte(4, tablero, partes, gastos), SEPTIEMBRE);
      expect(uno).toMatch(/^Un trabajo cerrado en septiembre[,:] /);
      expect(varios).toMatch(/^4 trabajos cerrados en septiembre[,:] /);
      expect(varios.replace(/^4 trabajos cerrados/, 'Un trabajo cerrado')).toBe(uno);
      frases.push(uno, varios);
    }

    for (const frase of frases) {
      expect(frase).not.toMatch(/\s%/);
    }
  });
});
