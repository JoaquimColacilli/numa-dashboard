import { describe, expect, it } from 'vitest';

import {
  diaDelMes,
  diaLocal,
  diasDelMes,
  diasHasta,
  diaYMes,
  diaYMesCorto,
  errorDeLaFechaDeLaPlata,
  fechaConAnio,
  fechaCorta,
  fechaCortaSinAnio,
  fechaDelRotulo,
  fechaEnUnaFrase,
  fechaLarga,
  haceCuanto,
  hoyEnElTaller,
  hoyLocal,
  mesAnterior,
  mesCortoConAnio,
  mesDeLaFecha,
  mesEnUnaFrase,
  nombreDelMes,
  relativa,
} from './fechas';
import { fijarElIdiomaEnUso } from './idioma';
import { seudoTexto } from './seudo';

describe('las fechas del presupuesto', () => {
  it('la del rótulo, en casillas: día, mes y los dos últimos del año', () => {
    expect(fechaDelRotulo('2026-09-17')).toBe('17/09/26');
    expect(fechaDelRotulo('2030-01-02')).toBe('02/01/30');
  });

  it('en portugués, el primer día del mes va con su ordinal: «1º de dezembro»', () => {
    expect(fechaConAnio('2026-12-01', 'pt-BR')).toBe('1º de dezembro de 2026');
    expect(fechaConAnio('2026-12-02', 'pt-BR')).toBe('2 de dezembro de 2026');
    expect(fechaConAnio('2026-12-01', 'en')).toBe('December 1, 2026');
  });

  it('en inglés y en portugués, la del rótulo nombra el mes: nunca una fecha solo en números', () => {
    expect(fechaDelRotulo('2026-09-17', 'en')).toBe('Sep 17, 2026');
    expect(fechaDelRotulo('2026-09-17', 'pt-BR')).toBe('17 set. 2026');
    expect(fechaDelRotulo('2030-01-02', 'pt-BR')).toBe('2 jan. 2030');
  });

  it('la del PDF, con el año siempre', () => {
    expect(fechaConAnio('2026-09-17')).toBe('17 de septiembre de 2026');
    expect(fechaConAnio('2027-01-02')).toBe('2 de enero de 2027');
  });
});

describe('la fecha corta de la facturación', () => {
  it('en castellano, día, mes y año en números, sin ceros', () => {
    expect(fechaCorta('2026-09-03')).toBe('3/9/2026');
    expect(fechaCorta('2028-10-02')).toBe('2/10/2028');
  });

  it('en inglés y en portugués nombra el mes', () => {
    expect(fechaCorta('2028-10-02', 'en')).toBe('Oct 2, 2028');
    expect(fechaCorta('2028-10-02', 'pt-BR')).toBe('2 de out. de 2028');
  });

  it('el mes corto con su año, para el rango de lo facturado', () => {
    expect(mesCortoConAnio('2025-11')).toBe('nov. 2025');
    expect(mesCortoConAnio('2026-05')).toBe('may. 2026');
    expect(mesCortoConAnio('2025-11', 'en')).toBe('Nov 2025');
    expect(mesCortoConAnio('2025-11', 'pt-BR')).toBe('nov. de 2025');
  });

  it('sin el año, el día y el mes en números, con el orden de cada idioma', () => {
    expect(fechaCortaSinAnio('2026-10-03')).toBe('3/10');
    expect(fechaCortaSinAnio('2026-09-20')).toBe('20/9');
    expect(fechaCortaSinAnio('2026-10-03', 'en')).toBe('10/3');
    expect(fechaCortaSinAnio('2026-10-03', 'pt-BR')).toBe('03/10');
  });
});

describe('las fechas con el seudoidioma', () => {
  it('salen marcadas como los textos del catálogo, una sola vez', () => {
    try {
      fijarElIdiomaEnUso('es', true);
      expect(fechaLarga('2026-10-02', '2026-10-02')).toBe(seudoTexto('vie 2 oct'));
      expect(relativa('2026-10-05', '2026-10-02')).toBe(seudoTexto('en 3 días'));
      expect(haceCuanto('2026-08-20', '2026-09-21')).toBe(seudoTexto('hace 1 mes'));
      expect(nombreDelMes('2026-10')).toBe(seudoTexto('Octubre'));
      expect(mesEnUnaFrase('2026-10')).toBe(seudoTexto('Octubre').toLocaleLowerCase('es-AR'));
      expect(fechaConAnio('2026-09-17')).toBe(seudoTexto('17 de septiembre de 2026'));
    } finally {
      fijarElIdiomaEnUso('es');
    }
    expect(fechaLarga('2026-10-02', '2026-10-02')).toBe('vie 2 oct');
  });
});

describe('las fechas de las opiniones', () => {
  it('el día y el mes, con el año solo si no es el de hoy', () => {
    expect(diaYMes('2026-09-02', '2026-09-21')).toBe('2 de septiembre');
    expect(diaYMes('2025-12-15', '2026-09-21')).toBe('15 de diciembre de 2025');
    expect(diaYMesCorto('2026-09-02')).toBe('2 sep');
  });

  it('hace cuánto, hasta en años', () => {
    expect(haceCuanto('2026-09-21', '2026-09-21')).toBe('hoy');
    expect(haceCuanto('2026-09-22', '2026-09-21')).toBe('hoy');
    expect(haceCuanto('2026-09-20', '2026-09-21')).toBe('ayer');
    expect(haceCuanto('2026-09-16', '2026-09-21')).toBe('hace 5 días');
    expect(haceCuanto('2026-08-20', '2026-09-21')).toBe('hace 1 mes');
    expect(haceCuanto('2026-04-01', '2026-09-21')).toBe('hace 6 meses');
    expect(haceCuanto('2025-09-01', '2026-09-21')).toBe('hace 1 año');
    expect(haceCuanto('2024-08-01', '2026-09-21')).toBe('hace 2 años');
  });

  it('el día de un momento es el del reloj del dispositivo', () => {
    const momento = new Date(2026, 8, 21, 23, 30).toISOString();
    expect(diaLocal(momento)).toBe('2026-09-21');
  });
});

describe('hoyLocal', () => {
  it('usa el día del reloj del dispositivo, no el UTC', () => {
    expect(hoyLocal(new Date(2026, 8, 11, 23, 30))).toBe('2026-09-11');
    expect(hoyLocal(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('hoyEnElTaller', () => {
  it('es el día de Argentina: a las 23:30 del 22 todavía es el 22, aunque en UTC ya sea el 23', () => {
    expect(hoyEnElTaller(new Date('2026-09-23T02:30:00Z'))).toBe('2026-09-22');
    expect(hoyEnElTaller(new Date('2026-09-23T03:00:00Z'))).toBe('2026-09-23');
  });

  it('y cruza el año como cualquier otro día', () => {
    expect(hoyEnElTaller(new Date('2027-01-01T02:59:59Z'))).toBe('2026-12-31');
    expect(hoyEnElTaller(new Date('2027-01-01T03:00:00Z'))).toBe('2027-01-01');
  });
});

describe('errorDeLaFechaDeLaPlata', () => {
  it('hoy y cualquier día de antes valen', () => {
    expect(errorDeLaFechaDeLaPlata('2026-09-22', '2026-09-22')).toBeUndefined();
    expect(errorDeLaFechaDeLaPlata('2025-07-20', '2026-09-22')).toBeUndefined();
  });

  it('un día que todavía no llegó no vale', () => {
    expect(errorDeLaFechaDeLaPlata('2026-09-23', '2026-09-22')).toBe(
      'Esa fecha todavía no llegó: tiene que ser hoy o antes.',
    );
  });

  it('sin día no hay plata que fechar', () => {
    expect(errorDeLaFechaDeLaPlata('', '2026-09-22')).toBe('Poné el día en que entró la plata.');
    expect(errorDeLaFechaDeLaPlata('22/09/2026', '2026-09-22')).toBe(
      'Poné el día en que entró la plata.',
    );
  });
});

describe('el mes', () => {
  it('sale de la fecha y tiene nombre y largo', () => {
    expect(mesDeLaFecha('2026-09-11')).toBe('2026-09');
    expect(nombreDelMes('2026-09')).toBe('Septiembre');
    expect(diasDelMes('2026-09')).toBe(30);
    expect(diasDelMes('2026-02')).toBe(28);
    expect(diasDelMes('2024-02')).toBe(29);
  });

  it('el anterior cruza el año', () => {
    expect(mesAnterior('2026-09')).toBe('2026-08');
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });
});

describe('fechaLarga', () => {
  it('escribe el día de la semana y el mes corto', () => {
    expect(fechaLarga('2026-09-10', '2026-09-11')).toBe('jue 10 sep');
  });

  it('agrega el año solo cuando no es el de hoy', () => {
    expect(fechaLarga('2025-12-18', '2026-09-11')).toBe('jue 18 dic 2025');
  });

  it('no se corre de día por la zona horaria', () => {
    expect(diaDelMes('2026-09-01')).toBe(1);
    expect(fechaLarga('2026-09-01', '2026-09-11')).toBe('mar 1 sep');
  });
});

describe('fechaEnUnaFrase', () => {
  it('escribe el día de la semana, el día y el mes entero, para ir adentro de una frase', () => {
    expect(fechaEnUnaFrase('2026-10-02', '2026-09-24')).toBe('vie 2 de octubre');
    expect(fechaEnUnaFrase('2026-11-02', '2026-09-24')).toBe('lun 2 de noviembre');
  });

  it('con el año solo cuando no es el de hoy', () => {
    expect(fechaEnUnaFrase('2027-01-15', '2026-09-24')).toBe('vie 15 de enero de 2027');
  });
});

describe('distancias', () => {
  it('cuenta los días entre dos fechas', () => {
    expect(diasHasta('2026-09-16', '2026-09-11')).toBe(5);
    expect(diasHasta('2026-09-08', '2026-09-11')).toBe(-3);
  });

  it('las dice como las diría una persona', () => {
    expect(relativa('2026-09-11', '2026-09-11')).toBe('hoy');
    expect(relativa('2026-09-12', '2026-09-11')).toBe('mañana');
    expect(relativa('2026-09-10', '2026-09-11')).toBe('ayer');
    expect(relativa('2026-09-16', '2026-09-11')).toBe('en 5 días');
    expect(relativa('2026-09-08', '2026-09-11')).toBe('hace 3 días');
    expect(relativa('2026-07-01', '2026-09-11')).toBe('hace 2 meses');
    expect(relativa('2026-08-05', '2026-09-11')).toBe('hace 1 mes');
    expect(relativa('2026-12-31', '2026-09-11')).toBe('en 4 meses');
  });
});

describe('las fechas en inglés y en portugués', () => {
  const HOY = '2026-10-01';

  it('usan lo que da Intl con la etiqueta del idioma, con el año solo si no es el de hoy', () => {
    expect(fechaLarga('2026-10-01', HOY, 'en')).toBe('Thu, Oct 1');
    expect(fechaLarga('2025-12-03', HOY, 'en')).toBe('Wed, Dec 3, 2025');
    expect(fechaLarga('2026-10-01', HOY, 'pt-BR')).toBe('qui., 1º de out.');
    expect(fechaEnUnaFrase('2026-10-01', HOY, 'en')).toBe('Thu, October 1');
    expect(fechaEnUnaFrase('2026-10-01', HOY, 'pt-BR')).toBe('qui., 1º de outubro');
    expect(diaYMes('2025-12-03', HOY, 'en')).toBe('December 3, 2025');
    expect(diaYMes('2026-10-01', HOY, 'pt-BR')).toBe('1º de outubro');
    expect(fechaConAnio('2026-10-01', 'en')).toBe('October 1, 2026');
    expect(fechaConAnio('2026-10-01', 'pt-BR')).toBe('1º de outubro de 2026');
    expect(diaYMesCorto('2026-10-01', 'en')).toBe('Oct 1');
    expect(diaYMesCorto('2026-10-01', 'pt-BR')).toBe('1º de out.');
  });

  it('el nombre del mes va con mayúscula, porque se muestra solo', () => {
    expect(nombreDelMes('2026-10', 'en')).toBe('October');
    expect(nombreDelMes('2026-10', 'pt-BR')).toBe('Outubro');
    expect(nombreDelMes('2026-10', 'es')).toBe('Octubre');
  });

  it('adentro de una frase, el mes va en minúscula salvo en inglés', () => {
    expect(mesEnUnaFrase('2026-10', 'es')).toBe('octubre');
    expect(mesEnUnaFrase('2026-10', 'en')).toBe('October');
    expect(mesEnUnaFrase('2026-10', 'pt-BR')).toBe('outubro');
    expect(mesEnUnaFrase('2026-09')).toBe(nombreDelMes('2026-09').toLowerCase());
  });

  it('las distancias las dice Intl, con hoy, mañana y ayer en palabras', () => {
    expect(relativa('2026-10-01', HOY, 'en')).toBe('today');
    expect(relativa('2026-10-02', HOY, 'en')).toBe('tomorrow');
    expect(relativa('2026-09-28', HOY, 'en')).toBe('3 days ago');
    expect(relativa('2026-12-01', HOY, 'pt-BR')).toBe('em 2 meses');
    expect(haceCuanto('2026-09-30', HOY, 'pt-BR')).toBe('ontem');
    expect(haceCuanto('2026-08-01', HOY, 'en')).toBe('2 months ago');
    expect(haceCuanto('2026-10-01', HOY, 'en')).toBe('today');
  });

  it('nunca se corren de día por la zona horaria', () => {
    expect(fechaLarga('2026-01-01', '2026-01-01', 'en')).toBe('Thu, Jan 1');
  });
});
