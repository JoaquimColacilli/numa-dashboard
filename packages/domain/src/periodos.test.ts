import { describe, expect, it } from 'vitest';

import {
  agrupadoPara,
  claveDelGrupo,
  columnasDelPeriodo,
  conOtroLargo,
  correrElPeriodo,
  estaEnElRango,
  hayAnterior,
  haySiguiente,
  largoLeido,
  LARGO_POR_DEFECTO,
  LUGARES_DE_LAS_COLUMNAS,
  mesLeido,
  parametrosDelPeriodo,
  periodoDeLaUrl,
  resolverElPeriodo,
} from './periodos.ts';

describe('el período en la dirección', () => {
  it('lee el largo: 3, 6, 12 o todo, y nada más', () => {
    expect(largoLeido('3')).toBe(3);
    expect(largoLeido('6')).toBe(6);
    expect(largoLeido('12')).toBe(12);
    expect(largoLeido('todo')).toBe('todo');
    for (const texto of [null, '', '4', 'Todo', '03', '12 ']) expect(largoLeido(texto)).toBeNull();
  });

  it('lee el mes hasta el que va: un AAAA-MM que no sea del futuro', () => {
    expect(mesLeido('2026-08', '2026-10')).toBe('2026-08');
    expect(mesLeido('2026-10', '2026-10')).toBe('2026-10');
    for (const texto of [null, '2026-11', '2026-8', '2026-13', 'agosto']) {
      expect(mesLeido(texto, '2026-10')).toBeNull();
    }
  });

  it('sin parámetros son los 3 meses que terminan en el mes en curso', () => {
    expect(LARGO_POR_DEFECTO).toBe(3);
    expect(periodoDeLaUrl(null, null, '2026-10')).toEqual({ meses: 3, hasta: '2026-10' });
  });

  it('ignora lo que no entiende, parámetro por parámetro', () => {
    expect(periodoDeLaUrl('6', '2026-05', '2026-10')).toEqual({ meses: 6, hasta: '2026-05' });
    expect(periodoDeLaUrl('cinco', '2026-05', '2026-10')).toEqual({ meses: 3, hasta: '2026-05' });
    expect(periodoDeLaUrl('12', 'ayer', '2026-10')).toEqual({ meses: 12, hasta: '2026-10' });
    expect(periodoDeLaUrl('12', '2027-01', '2026-10')).toEqual({ meses: 12, hasta: '2026-10' });
  });

  it('con «todo», el mes hasta el que va no cuenta: siempre llega al mes en curso', () => {
    expect(periodoDeLaUrl('todo', '2026-02', '2026-10')).toEqual({
      meses: 'todo',
      hasta: '2026-10',
    });
  });

  it('escribe solo lo que no es lo de siempre, y vuelve a leerse igual', () => {
    expect(parametrosDelPeriodo({ meses: 3, hasta: '2026-10' }, '2026-10')).toEqual({
      meses: null,
      hasta: null,
    });
    expect(parametrosDelPeriodo({ meses: 6, hasta: '2026-04' }, '2026-10')).toEqual({
      meses: '6',
      hasta: '2026-04',
    });
    expect(parametrosDelPeriodo({ meses: 'todo', hasta: '2026-10' }, '2026-10')).toEqual({
      meses: 'todo',
      hasta: null,
    });
    for (const periodo of [
      { meses: 12, hasta: '2025-12' },
      { meses: 3, hasta: '2026-01' },
      { meses: 'todo', hasta: '2026-10' },
    ] as const) {
      const { meses, hasta } = parametrosDelPeriodo(periodo, '2026-10');
      expect(periodoDeLaUrl(meses, hasta, '2026-10')).toEqual(periodo);
    }
  });
});

describe('moverse entre períodos', () => {
  it('las flechas corren el período su largo, sin pasarse del mes en curso', () => {
    const abrilAJunio = { meses: 3, hasta: '2027-06' } as const;
    expect(correrElPeriodo(abrilAJunio, -1, '2027-06')).toEqual({ meses: 3, hasta: '2027-03' });
    expect(correrElPeriodo({ meses: 3, hasta: '2027-03' }, 1, '2027-06')).toEqual(abrilAJunio);
    expect(correrElPeriodo({ meses: 6, hasta: '2027-02' }, 1, '2027-06')).toEqual({
      meses: 6,
      hasta: '2027-06',
    });
    expect(correrElPeriodo({ meses: 12, hasta: '2027-06' }, -1, '2027-06')).toEqual({
      meses: 12,
      hasta: '2026-06',
    });
  });

  it('«todo» no se corre', () => {
    const todo = { meses: 'todo', hasta: '2027-06' } as const;
    expect(correrElPeriodo(todo, -1, '2027-06')).toBe(todo);
    expect(haySiguiente(todo, '2027-06')).toBe(false);
    expect(hayAnterior(todo, '2026-07')).toBe(false);
  });

  it('la de adelante se apaga en el período que termina este mes', () => {
    expect(haySiguiente({ meses: 3, hasta: '2027-06' }, '2027-06')).toBe(false);
    expect(haySiguiente({ meses: 3, hasta: '2027-03' }, '2027-06')).toBe(true);
  });

  it('la de atrás se apaga cuando el período de antes ya no tendría ningún mes con datos', () => {
    expect(hayAnterior({ meses: 3, hasta: '2027-06' }, '2026-07')).toBe(true);
    expect(hayAnterior({ meses: 3, hasta: '2026-09' }, '2026-07')).toBe(false);
    expect(hayAnterior({ meses: 3, hasta: '2026-10' }, '2026-07')).toBe(true);
    expect(hayAnterior({ meses: 3, hasta: '2026-10' }, null)).toBe(false);
  });

  it('cambiar el largo conserva el mes hasta el que va, salvo desde o hacia «todo»', () => {
    expect(conOtroLargo({ meses: 3, hasta: '2027-03' }, 6, '2027-06')).toEqual({
      meses: 6,
      hasta: '2027-03',
    });
    expect(conOtroLargo({ meses: 3, hasta: '2027-03' }, 'todo', '2027-06')).toEqual({
      meses: 'todo',
      hasta: '2027-06',
    });
    expect(conOtroLargo({ meses: 'todo', hasta: '2027-06' }, 12, '2027-06')).toEqual({
      meses: 12,
      hasta: '2027-06',
    });
  });
});

describe('resolverElPeriodo', () => {
  it('3 meses que terminan en junio son abril, mayo y junio, comparados con enero a marzo', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-06' }, '2027-06-18', '2026-07');
    expect(resuelto.meses).toEqual(['2027-04', '2027-05', '2027-06']);
    expect(resuelto.dias).toEqual({ desde: '2027-04-01', hasta: '2027-06-30' });
    expect(resuelto.incluyeHoy).toBe(true);
    expect(resuelto.agrupado).toBe('mes');
    expect(resuelto.anterior).toEqual({
      desde: '2027-01',
      hasta: '2027-03',
      meses: ['2027-01', '2027-02', '2027-03'],
      dias: { desde: '2027-01-01', hasta: '2027-03-18' },
      hastaElMismoDia: true,
    });
  });

  it('el período que incluye hoy compara hasta el mismo día, o el último del mes si es más corto', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-05' }, '2027-05-31', null);
    expect(resuelto.anterior?.dias).toEqual({ desde: '2026-12-01', hasta: '2027-02-28' });
  });

  it('un período que ya pasó se compara entero', () => {
    const resuelto = resolverElPeriodo({ meses: 6, hasta: '2026-12' }, '2027-06-18', null);
    expect(resuelto.incluyeHoy).toBe(false);
    expect(resuelto.anterior?.dias).toEqual({ desde: '2026-01-01', hasta: '2026-06-30' });
    expect(resuelto.anterior?.hastaElMismoDia).toBe(false);
  });

  it('cruza el año', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-01' }, '2027-06-18', null);
    expect(resuelto.meses).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(resuelto.anterior?.meses).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('un período que dice terminar en el futuro termina en el mes en curso', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-09' }, '2027-06-18', null);
    expect(resuelto.hasta).toBe('2027-06');
  });

  it('«todo» va del primer mes con datos hasta hoy, sin comparación', () => {
    const resuelto = resolverElPeriodo(
      { meses: 'todo', hasta: '2026-10' },
      '2026-10-02',
      '2026-04',
    );
    expect(resuelto.meses).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(resuelto.anterior).toBeNull();
    expect(resuelto.dias).toEqual({ desde: '2026-04-01', hasta: '2026-10-31' });
  });

  it('«todo» sin datos, o con un primer dato en el futuro, es el mes en curso', () => {
    expect(
      resolverElPeriodo({ meses: 'todo', hasta: '2026-10' }, '2026-10-02', null).meses,
    ).toEqual(['2026-10']);
    expect(
      resolverElPeriodo({ meses: 'todo', hasta: '2026-10' }, '2026-10-02', '2026-11').meses,
    ).toEqual(['2026-10']);
  });

  it('«todo» de 1, 13 y 40 meses agrupa por mes, trimestre y año', () => {
    expect(resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', '2026-10').agrupado).toBe(
      'mes',
    );
    expect(resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', '2025-10').agrupado).toBe(
      'trimestre',
    );
    expect(resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', '2023-07').agrupado).toBe(
      'anio',
    );
    expect(agrupadoPara(12)).toBe('mes');
    expect(agrupadoPara(36)).toBe('trimestre');
    expect(agrupadoPara(37)).toBe('anio');
  });
});

describe('las columnas del período', () => {
  it('son 12 lugares que terminan en el último mes del período, con los de antes de contexto', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-06' }, '2027-06-18', '2026-07');
    const columnas = columnasDelPeriodo(resuelto, '2027-06', '2026-07');
    expect(LUGARES_DE_LAS_COLUMNAS).toBe(12);
    expect(columnas.map((columna) => columna.clave)).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
      '2027-05',
      '2027-06',
    ]);
    expect(
      columnas.filter((columna) => columna.enElPeriodo).map((columna) => columna.clave),
    ).toEqual(['2027-04', '2027-05', '2027-06']);
    expect(columnas.filter((columna) => columna.enCurso).map((columna) => columna.clave)).toEqual([
      '2027-06',
    ]);
    expect(columnas.some((columna) => columna.sinRegistro)).toBe(false);
  });

  it('los meses anteriores al primer dato no tienen registro', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2026-10' }, '2026-10-02', '2026-04');
    const columnas = columnasDelPeriodo(resuelto, '2026-10', '2026-04');
    expect(
      columnas.filter((columna) => columna.sinRegistro).map((columna) => columna.clave),
    ).toEqual(['2025-11', '2025-12', '2026-01', '2026-02', '2026-03']);
    expect(
      columnasDelPeriodo(resuelto, '2026-10', null).every((columna) => columna.sinRegistro),
    ).toBe(true);
  });

  it('con «todo» de 13 meses van por trimestre calendario', () => {
    const resuelto = resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', '2025-10');
    const columnas = columnasDelPeriodo(resuelto, '2026-10', '2025-10');
    expect(columnas.map((columna) => [columna.clave, columna.meses.length])).toEqual([
      ['2025-T4', 3],
      ['2026-T1', 3],
      ['2026-T2', 3],
      ['2026-T3', 3],
      ['2026-T4', 1],
    ]);
    expect(
      columnas.every((columna) => columna.enElPeriodo && columna.agrupado === 'trimestre'),
    ).toBe(true);
    expect(columnas.filter((columna) => columna.enCurso).map((columna) => columna.clave)).toEqual([
      '2026-T4',
    ]);
  });

  it('con «todo» de 40 meses van por año, y con uno solo, una columna', () => {
    const anios = columnasDelPeriodo(
      resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', '2023-07'),
      '2026-10',
      '2023-07',
    );
    expect(anios.map((columna) => [columna.clave, columna.meses.length])).toEqual([
      ['2023', 6],
      ['2024', 12],
      ['2025', 12],
      ['2026', 10],
    ]);
    const uno = columnasDelPeriodo(
      resolverElPeriodo({ meses: 'todo', hasta: 'x' }, '2026-10-02', null),
      '2026-10',
      null,
    );
    expect(uno).toEqual([
      {
        clave: '2026-10',
        agrupado: 'mes',
        meses: ['2026-10'],
        enElPeriodo: true,
        enCurso: true,
        sinRegistro: true,
      },
    ]);
  });

  it('la clave del grupo de un mes', () => {
    expect(claveDelGrupo('2026-03', 'mes')).toBe('2026-03');
    expect(claveDelGrupo('2026-03', 'trimestre')).toBe('2026-T1');
    expect(claveDelGrupo('2026-04', 'trimestre')).toBe('2026-T2');
    expect(claveDelGrupo('2026-12', 'trimestre')).toBe('2026-T4');
    expect(claveDelGrupo('2026-12', 'anio')).toBe('2026');
  });
});

describe('estaEnElRango', () => {
  it('los dos días del rango cuentan', () => {
    const rango = { desde: '2027-04-01', hasta: '2027-06-30' };
    expect(estaEnElRango('2027-04-01', rango)).toBe(true);
    expect(estaEnElRango('2027-06-30', rango)).toBe(true);
    expect(estaEnElRango('2027-03-31', rango)).toBe(false);
    expect(estaEnElRango('2027-07-01', rango)).toBe(false);
  });
});
