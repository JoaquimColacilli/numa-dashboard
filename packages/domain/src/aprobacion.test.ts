import { describe, expect, it } from 'vitest';

import {
  armarAprobacion,
  diasParaMedir,
  esFranjaDeLaVisita,
  esperaRespuesta,
  estaPendiente,
  FRANJAS_DE_LA_VISITA,
  horaDeLaVisita,
  letraDeLaRespuesta,
  MOTIVOS_DE_LA_APROBACION,
  sePuedeElegirParaMedir,
  validarAprobacion,
} from './aprobacion.ts';
import { centavos } from './money.ts';
import type { ValoresDelPresupuesto } from './presupuesto.ts';

const HOY = '2026-10-26';
const ID = '0199c000-0000-7000-8000-000000000001';
const REVISION = '0199c000-0000-7000-8000-0000000000aa';
const OPCION_A = '0199c000-0000-7000-8000-00000000000a';
const OPCION_B = '0199c000-0000-7000-8000-00000000000b';

const CON_OPCIONES: ValoresDelPresupuesto = {
  tipo: 'opciones',
  opciones: [
    { id: OPCION_A, letra: 'A', descripcion: 'Melamina', total: centavos(100_000_000) },
    { id: OPCION_B, letra: 'B', descripcion: 'Laqueado', total: centavos(140_000_000) },
  ],
};

const UN_TOTAL: ValoresDelPresupuesto = { tipo: 'total', total: centavos(128_000_000) };

function aprobacion(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: ID,
    revision_id: REVISION,
    opcion_id: OPCION_A,
    dia: '2026-10-29',
    franja: 'manana',
    nota: '',
    ...cambios,
  };
}

const PIDE_FECHA = { valores: CON_OPCIONES, pideFecha: true };

describe('los días para medir', () => {
  it('van desde pasado mañana hasta dentro de sesenta días', () => {
    expect(diasParaMedir(HOY)).toEqual({ desde: '2026-10-28', hasta: '2026-12-25' });
    expect(sePuedeElegirParaMedir('2026-10-27', HOY)).toBe(false);
    expect(sePuedeElegirParaMedir('2026-10-28', HOY)).toBe(true);
    expect(sePuedeElegirParaMedir('2026-11-01', HOY)).toBe(true);
    expect(sePuedeElegirParaMedir('2026-12-25', HOY)).toBe(true);
    expect(sePuedeElegirParaMedir('2026-12-26', HOY)).toBe(false);
    expect(sePuedeElegirParaMedir('2026-11-31', HOY)).toBe(false);
    expect(sePuedeElegirParaMedir('29/10/2026', HOY)).toBe(false);
  });

  it('a la mañana es a las 10, a la tarde a las 15, y si le da igual va sin hora', () => {
    expect(FRANJAS_DE_LA_VISITA).toEqual(['manana', 'tarde', 'me_da_igual']);
    expect(horaDeLaVisita('manana')).toBe('10:00');
    expect(horaDeLaVisita('tarde')).toBe('15:00');
    expect(horaDeLaVisita('me_da_igual')).toBeNull();
    expect(horaDeLaVisita(null)).toBeNull();
    expect(esFranjaDeLaVisita('tarde')).toBe(true);
    expect(esFranjaDeLaVisita('noche')).toBe(false);
  });
});

describe('cuándo espera respuesta la última revisión', () => {
  it('mandada, sin vencer y con el trabajo sin aprobar ni perdido, también en seguimiento', () => {
    expect(esperaRespuesta('presupuesto_enviado', '2026-11-10', HOY)).toBe(true);
    expect(esperaRespuesta('presupuesto_estimativo', null, HOY)).toBe(true);
    expect(esperaRespuesta('en_seguimiento', '2026-10-26', HOY)).toBe(true);
    expect(esperaRespuesta('presupuesto_enviado', '2026-10-25', HOY)).toBe(false);
    expect(esperaRespuesta('en_curso', null, HOY)).toBe(false);
    expect(esperaRespuesta('entregado', null, HOY)).toBe(false);
    expect(esperaRespuesta('cobrado', null, HOY)).toBe(false);
    expect(esperaRespuesta('perdido', null, HOY)).toBe(false);
  });
});

describe('armar la aprobación', () => {
  it('con la visita lleva el día, la franja y la nota sin blancos en las puntas', () => {
    expect(
      armarAprobacion(
        ID,
        REVISION,
        OPCION_A,
        { dia: '2026-10-29', franja: 'manana' },
        '  Timbre 3B  ',
      ),
    ).toEqual({
      id: ID,
      revision_id: REVISION,
      opcion_id: OPCION_A,
      dia: '2026-10-29',
      franja: 'manana',
      nota: 'Timbre 3B',
    });
  });

  it('sin visita no lleva día, franja ni nota', () => {
    expect(armarAprobacion(ID, REVISION, null, null, 'algo')).toEqual({
      id: ID,
      revision_id: REVISION,
      opcion_id: null,
      dia: null,
      franja: null,
      nota: '',
    });
  });
});

describe('validar la aprobación, la gemela de la base', () => {
  it('una aprobación bien armada pasa', () => {
    expect(validarAprobacion(aprobacion(), PIDE_FECHA, HOY)).toBeNull();
    expect(
      validarAprobacion(aprobacion({ nota: 'Hay que avisar en portería.' }), PIDE_FECHA, HOY),
    ).toBeNull();
    expect(
      validarAprobacion(
        aprobacion({ opcion_id: null, dia: null, franja: null }),
        { valores: UN_TOTAL, pideFecha: false },
        HOY,
      ),
    ).toBeNull();
  });

  it('la forma: justo esas claves, ids que son uuid y cada valor con su tipo', () => {
    expect(validarAprobacion(null, PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion([], PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion({ ...aprobacion(), otra: 1 }, PIDE_FECHA, HOY)).toBe('forma');
    const { nota: _nota, ...sinNota } = aprobacion();
    expect(validarAprobacion(sinNota, PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ id: 'uno' }), PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ revision_id: 7 }), PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ opcion_id: 7 }), PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ dia: 20261029 }), PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ franja: true }), PIDE_FECHA, HOY)).toBe('forma');
    expect(validarAprobacion(aprobacion({ nota: null }), PIDE_FECHA, HOY)).toBe('forma');
  });

  it('la opción tiene que ser de la revisión; con un solo total, ninguna', () => {
    expect(validarAprobacion(aprobacion({ opcion_id: null }), PIDE_FECHA, HOY)).toBe('opcion');
    expect(validarAprobacion(aprobacion({ opcion_id: ID }), PIDE_FECHA, HOY)).toBe('opcion');
    expect(validarAprobacion(aprobacion(), { valores: UN_TOTAL, pideFecha: true }, HOY)).toBe(
      'opcion',
    );
    expect(
      validarAprobacion(aprobacion({ opcion_id: null }), { valores: null, pideFecha: true }, HOY),
    ).toBe('opcion');
    expect(validarAprobacion(aprobacion({ opcion_id: OPCION_B }), PIDE_FECHA, HOY)).toBeNull();
  });

  it('si la revisión pide fecha, lleva un día que se puede elegir y una franja', () => {
    expect(validarAprobacion(aprobacion({ dia: null }), PIDE_FECHA, HOY)).toBe('dia');
    expect(validarAprobacion(aprobacion({ dia: '2026-10-27' }), PIDE_FECHA, HOY)).toBe('fuera');
    expect(validarAprobacion(aprobacion({ dia: '2026-12-26' }), PIDE_FECHA, HOY)).toBe('fuera');
    expect(validarAprobacion(aprobacion({ franja: null }), PIDE_FECHA, HOY)).toBe('franja');
    expect(validarAprobacion(aprobacion({ franja: 'noche' }), PIDE_FECHA, HOY)).toBe('franja');
    expect(validarAprobacion(aprobacion({ franja: 'me_da_igual' }), PIDE_FECHA, HOY)).toBeNull();
  });

  it('si no la pide, no lleva día, franja ni nota', () => {
    const sinFecha = { valores: CON_OPCIONES, pideFecha: false };
    expect(validarAprobacion(aprobacion(), sinFecha, HOY)).toBe('dia');
    expect(validarAprobacion(aprobacion({ dia: null }), sinFecha, HOY)).toBe('dia');
    expect(
      validarAprobacion(aprobacion({ dia: null, franja: null, nota: 'Hola' }), sinFecha, HOY),
    ).toBe('dia');
    expect(validarAprobacion(aprobacion({ dia: null, franja: null }), sinFecha, HOY)).toBeNull();
  });

  it('la nota tiene hasta trescientas letras, sin contar los blancos de las puntas', () => {
    expect(
      validarAprobacion(aprobacion({ nota: `  ${'ñ'.repeat(300)}  ` }), PIDE_FECHA, HOY),
    ).toBeNull();
    expect(validarAprobacion(aprobacion({ nota: 'ñ'.repeat(301) }), PIDE_FECHA, HOY)).toBe('largo');
  });

  it('los motivos que traduce la página, también los que solo mira la base', () => {
    expect(MOTIVOS_DE_LA_APROBACION).toEqual([
      'forma',
      'opcion',
      'dia',
      'fuera',
      'franja',
      'largo',
      'revision',
      'respondida',
    ]);
  });
});

describe('lo que ve el dueño de la respuesta', () => {
  it('la letra de la opción elegida, si eligió una', () => {
    expect(letraDeLaRespuesta({ valores: CON_OPCIONES }, OPCION_B)).toBe('B');
    expect(letraDeLaRespuesta({ valores: CON_OPCIONES }, ID)).toBeNull();
    expect(letraDeLaRespuesta({ valores: CON_OPCIONES }, null)).toBeNull();
    expect(letraDeLaRespuesta({ valores: UN_TOTAL }, OPCION_A)).toBeNull();
  });

  it('pendiente hasta que la atiende', () => {
    expect(estaPendiente({ atendidaEn: null })).toBe(true);
    expect(estaPendiente({ atendidaEn: '2026-10-27T15:00:00Z' })).toBe(false);
  });
});
