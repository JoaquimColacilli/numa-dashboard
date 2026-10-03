import { resolverElPeriodo, type ColumnaDelPeriodo } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  anioDeLaColumna,
  columnaAlEmpezar,
  columnaConSuAnio,
  columnaEnLaFrase,
  columnaEnLaTabla,
  comparacionDelPeriodo,
  cuandoEnLaFrase,
  cuandoSePrometio,
  etiquetaDeLaColumna,
  pesos,
  probarCon,
  rangoDelPeriodo,
  rangoEnElTexto,
} from './textos';

const HOY = '2027-02-10';

function columna(clave: string, agrupado: ColumnaDelPeriodo['agrupado'], meses: string[]) {
  return { clave, agrupado, meses, enElPeriodo: true, enCurso: false, sinRegistro: false };
}

describe('los textos de las estadísticas', () => {
  it('un período que cruza el año dice los dos años, y la comparación también', () => {
    const resuelto = resolverElPeriodo({ meses: 3, hasta: '2027-01' }, HOY, '2025-01');
    expect(rangoDelPeriodo(resuelto)).toBe('nov 2026 – ene 2027');
    expect(comparacionDelPeriodo(resuelto)).toBe('contra ago – oct 2026');
    expect(cuandoEnLaFrase(resuelto, HOY)).toBe('entre nov 2026 y ene 2027');
    expect(rangoEnElTexto(resuelto, HOY)).toBe('nov 2026 – ene 2027');
  });

  it('un período de este año no repite el año en las frases, y uno de otro año sí', () => {
    const deEsteAnio = resolverElPeriodo({ meses: 3, hasta: '2027-02' }, HOY, '2025-01');
    expect(rangoDelPeriodo(deEsteAnio)).toBe('dic 2026 – feb 2027');
    expect(comparacionDelPeriodo(deEsteAnio)).toBe('contra sept – nov 2026, hasta el mismo día');

    const deOtroAnio = resolverElPeriodo({ meses: 3, hasta: '2026-06' }, HOY, '2025-01');
    expect(cuandoEnLaFrase(deOtroAnio, HOY)).toBe('entre abr y jun 2026');
    expect(rangoEnElTexto(deOtroAnio, HOY)).toBe('abr – jun 2026');
    expect(comparacionDelPeriodo(deOtroAnio)).toBe('contra ene – mar');
  });

  it('«Todo» dice desde cuándo', () => {
    const todo = resolverElPeriodo({ meses: 'todo', hasta: '2027-02' }, HOY, '2026-07');
    expect(rangoDelPeriodo(todo)).toBe('Desde jul 2026');
    expect(cuandoEnLaFrase(todo, HOY)).toBe('desde jul 2026');
    expect(comparacionDelPeriodo(todo)).toBeNull();
    expect(probarCon('todo')).toBeNull();
    expect(probarCon(3)).toBe('Probá con 6 o 12 meses.');
  });

  it('las columnas de un mes, de un trimestre y de un año', () => {
    const mes = columna('2026-09', 'mes', ['2026-09']);
    expect(etiquetaDeLaColumna(mes)).toBe('sept');
    expect(anioDeLaColumna(mes)).toBe('2026');
    expect(columnaEnLaFrase(mes, HOY)).toBe('septiembre de 2026');
    expect(columnaEnLaFrase(columna('2027-01', 'mes', ['2027-01']), HOY)).toBe('enero');
    expect(columnaConSuAnio(mes)).toBe('septiembre 2026');
    expect(columnaEnLaTabla(mes)).toBe('sept 2026');
    expect(columnaAlEmpezar(mes)).toBe('Septiembre');

    const trimestre = columna('2026-T2', 'trimestre', ['2026-04', '2026-05', '2026-06']);
    expect(etiquetaDeLaColumna(trimestre)).toBe('T2');
    expect(columnaEnLaFrase(trimestre, HOY)).toBe('abr – jun 2026');
    expect(columnaAlEmpezar(trimestre)).toBe('abr – jun 2026');

    const anio = columna('2026', 'anio', ['2026-01', '2026-12']);
    expect(etiquetaDeLaColumna(anio)).toBe('2026');
    expect(anioDeLaColumna(anio)).toBeNull();
    expect(columnaEnLaTabla(anio)).toBe('2026');
  });

  it('la fecha prometida: hoy, en la semana con su día, y más lejos con su fecha', () => {
    expect(cuandoSePrometio(null, HOY)).toBe('Sin fecha prometida');
    expect(cuandoSePrometio({ fecha: HOY, cual: 'comprometida' }, HOY)).toBe('Prometido para hoy');
    expect(cuandoSePrometio({ fecha: '2027-02-11', cual: 'comprometida' }, HOY)).toBe(
      'Prometido para el jueves 11',
    );
    expect(cuandoSePrometio({ fecha: '2027-02-14', cual: 'estimada' }, HOY)).toBe(
      'Estimado para el domingo 14',
    );
    expect(cuandoSePrometio({ fecha: '2027-03-30', cual: 'estimada' }, HOY)).toBe(
      'Estimado para el 30 de marzo',
    );
    expect(cuandoSePrometio({ fecha: '2027-02-01', cual: 'comprometida' }, HOY)).toBe(
      'Prometido para el 1 de febrero',
    );
  });

  it('la plata negativa lleva el menos tipográfico', () => {
    expect(pesos(-30_000_000).replace(/\s/gu, ' ')).toBe('−$ 300.000');
    expect(pesos(30_000_000).replace(/\s/gu, ' ')).toBe('$ 300.000');
  });
});
