import { describe, expect, it } from 'vitest';

import {
  correrMes,
  DIAS_HABILES_DE_ENTREGA,
  DIAS_HABILES_PARA_PRESUPUESTAR,
  diaDeLaSemana,
  diaDelMes,
  diasEntre,
  entregaEstimada,
  esFechaQueExiste,
  mesDe,
  mesesDelRango,
  mesesEntre,
  sumarDias,
  sumarDiasHabiles,
  vencimientoDelPresupuesto,
} from './fechas.ts';

describe('mesesDelRango', () => {
  it('son los meses de uno a otro, los dos incluidos, cruzando el año', () => {
    expect(mesesDelRango('2026-11', '2027-02')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(mesesDelRango('2026-09', '2026-09')).toEqual(['2026-09']);
  });

  it('rechaza un rango al revés o un mes mal escrito', () => {
    expect(() => mesesDelRango('2026-10', '2026-09')).toThrow(RangeError);
    expect(() => mesesDelRango('2026-9', '2026-10')).toThrow(RangeError);
    expect(() => mesesDelRango('2026-09', '2026-13')).toThrow(RangeError);
  });
});

describe('correrMes', () => {
  it('corre un mes para adelante o para atrás, cruzando el año', () => {
    expect(correrMes('2026-11', 2)).toBe('2027-01');
    expect(correrMes('2027-01', -1)).toBe('2026-12');
    expect(correrMes('2026-06', -11)).toBe('2025-07');
    expect(correrMes('2026-06', 0)).toBe('2026-06');
  });

  it('rechaza un mes mal escrito o una cantidad con decimales', () => {
    expect(() => correrMes('2026-6', 1)).toThrow(RangeError);
    expect(() => correrMes('2026-06', 0.5)).toThrow(RangeError);
  });
});

describe('mesesEntre', () => {
  it('cuenta los meses de uno a otro, con signo', () => {
    expect(mesesEntre('2016-12', '2026-08')).toBe(116);
    expect(mesesEntre('2026-08', '2026-06')).toBe(-2);
    expect(mesesEntre('2026-08', '2026-08')).toBe(0);
  });

  it('rechaza un mes mal escrito', () => {
    expect(() => mesesEntre('2026-8', '2026-09')).toThrow(RangeError);
  });
});

describe('diaDelMes', () => {
  it('es ese día del mes, o el último si el mes no lo tiene', () => {
    expect(diaDelMes('2026-09', 10)).toBe('2026-09-10');
    expect(diaDelMes('2026-09', 31)).toBe('2026-09-30');
    expect(diaDelMes('2026-10', 31)).toBe('2026-10-31');
    expect(diaDelMes('2027-02', 30)).toBe('2027-02-28');
    expect(diaDelMes('2028-02', 30)).toBe('2028-02-29');
    expect(diaDelMes('2026-12', 1)).toBe('2026-12-01');
  });

  it('rechaza un día fuera del 1 al 31 o un mes mal escrito', () => {
    for (const dia of [0, 32, 1.5]) expect(() => diaDelMes('2026-09', dia)).toThrow(RangeError);
    expect(() => diaDelMes('septiembre', 1)).toThrow(RangeError);
  });
});

describe('esFechaQueExiste', () => {
  it('es una fecha AAAA-MM-DD que está en el calendario', () => {
    expect(esFechaQueExiste('2028-02-29')).toBe(true);
    expect(esFechaQueExiste('2026-02-29')).toBe(false);
    expect(esFechaQueExiste('2026-9-14')).toBe(false);
    expect(esFechaQueExiste('mañana')).toBe(false);
  });
});

describe('diaDeLaSemana', () => {
  it('va de 0, el domingo, a 6, el sábado', () => {
    expect(diaDeLaSemana('2026-09-27')).toBe(0);
    expect(diaDeLaSemana('2026-09-28')).toBe(1);
    expect(diaDeLaSemana('2026-10-03')).toBe(6);
  });

  it('rechaza una fecha que no existe', () => {
    expect(() => diaDeLaSemana('2026-02-30')).toThrow(RangeError);
  });
});

describe('vencimientoDelPresupuesto', () => {
  it('es una semana de trabajo desde el relevamiento: cinco días hábiles', () => {
    expect(DIAS_HABILES_PARA_PRESUPUESTAR).toBe(5);
    expect(vencimientoDelPresupuesto('2026-09-07')).toBe('2026-09-14');
  });

  it('un relevamiento del jueves vence el jueves siguiente, y salta los feriados que se le pasan', () => {
    expect(vencimientoDelPresupuesto('2026-09-10')).toBe('2026-09-17');
    expect(vencimientoDelPresupuesto('2026-10-08', ['2026-10-12'])).toBe('2026-10-16');
  });

  it('un relevamiento del sábado vence el viernes siguiente', () => {
    expect(vencimientoDelPresupuesto('2026-09-12')).toBe('2026-09-18');
  });
});

describe('sumarDias', () => {
  it('suma y resta días corridos, cruzando meses, años y el 29 de febrero', () => {
    expect(sumarDias('2026-09-30', 1)).toBe('2026-10-01');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2028-03-01', -1)).toBe('2028-02-29');
    expect(sumarDias('2026-09-14', 0)).toBe('2026-09-14');
  });

  it('rechaza una fecha que no existe o una cantidad con decimales', () => {
    expect(() => sumarDias('2026-02-30', 1)).toThrow(RangeError);
    expect(() => sumarDias('2026-09-14', 0.5)).toThrow(RangeError);
  });
});

describe('diasEntre', () => {
  it('cuenta los días corridos de una fecha a otra, con signo', () => {
    expect(diasEntre('2026-09-14', '2026-09-16')).toBe(2);
    expect(diasEntre('2026-09-16', '2026-09-14')).toBe(-2);
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
    expect(diasEntre('2026-09-14', '2026-09-14')).toBe(0);
  });

  it('rechaza fechas mal escritas', () => {
    expect(() => diasEntre('2026-9-14', '2026-09-16')).toThrow(RangeError);
  });
});

describe('mesDe', () => {
  it('es el mes calendario de la fecha, como AAAA-MM', () => {
    expect(mesDe('2026-09-11')).toBe('2026-09');
    expect(mesDe('2026-12-31')).toBe('2026-12');
  });

  it('rechaza una fecha que no existe', () => {
    expect(() => mesDe('2026-02-30')).toThrow(RangeError);
  });
});

describe('entregaEstimada', () => {
  it('son 21 días hábiles', () => {
    expect(DIAS_HABILES_DE_ENTREGA).toBe(21);
  });

  it('desde un lunes, cae el martes de la cuarta semana siguiente', () => {
    expect(entregaEstimada('2026-08-24')).toBe('2026-09-22');
  });

  it('desde un viernes, el primer día hábil es el lunes', () => {
    expect(sumarDiasHabiles('2026-09-11', 1)).toBe('2026-09-14');
    expect(entregaEstimada('2026-09-11')).toBe('2026-10-12');
  });

  it('si arranca un fin de semana, cuenta desde el lunes', () => {
    expect(sumarDiasHabiles('2026-09-12', 1)).toBe('2026-09-14');
    expect(sumarDiasHabiles('2026-09-13', 1)).toBe('2026-09-14');
  });

  it('salta los feriados que se le pasan', () => {
    expect(sumarDiasHabiles('2026-10-09', 1, ['2026-10-12'])).toBe('2026-10-13');
    expect(entregaEstimada('2026-09-11', DIAS_HABILES_DE_ENTREGA, ['2026-10-12'])).toBe(
      '2026-10-13',
    );
  });

  it('con el plazo de un presupuesto, cuenta esos días hábiles y no los 21', () => {
    expect(entregaEstimada('2026-09-14', 30)).toBe('2026-10-26');
    expect(entregaEstimada('2026-09-14', 30)).toBe(sumarDiasHabiles('2026-09-14', 30));
  });

  it('un feriado que cae en fin de semana no descuenta dos veces', () => {
    expect(sumarDiasHabiles('2026-09-11', 1, ['2026-09-12'])).toBe('2026-09-14');
  });

  it('cruza meses, años y el 29 de febrero', () => {
    expect(sumarDiasHabiles('2026-12-30', 3)).toBe('2027-01-04');
    expect(sumarDiasHabiles('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('cero días hábiles devuelve la misma fecha', () => {
    expect(sumarDiasHabiles('2026-09-12', 0)).toBe('2026-09-12');
  });

  it('rechaza fechas mal escritas o que no existen, también en los feriados', () => {
    for (const fecha of ['2026-02-30', '2026-9-1', '11/09/2026', '']) {
      expect(() => sumarDiasHabiles(fecha, 1)).toThrow(RangeError);
    }
    expect(() => sumarDiasHabiles('2026-09-11', 1, ['2026-13-01'])).toThrow(RangeError);
  });

  it('rechaza cantidades negativas o con decimales', () => {
    expect(() => sumarDiasHabiles('2026-09-11', -1)).toThrow(RangeError);
    expect(() => sumarDiasHabiles('2026-09-11', 1.5)).toThrow(RangeError);
  });
});
