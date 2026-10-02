import { describe, expect, it } from 'vitest';

import {
  CONCEPTOS_DE_SIEMPRE,
  conceptoDeSiempre,
  conceptoEnPantalla,
  conceptoParaGuardar,
} from './conceptos.ts';

const EN_INGLES = {
  senaDeLaVisita: 'Site visit deposit',
  senaAlAprobar: 'Deposit',
  saldoFinal: 'Final balance on delivery',
} as const;

describe('los conceptos que propone la app', () => {
  it('se guardan siempre en castellano, aunque se hayan escrito en otro idioma', () => {
    expect(conceptoParaGuardar('Site visit deposit', EN_INGLES)).toBe('Seña de la visita');
    expect(conceptoParaGuardar('  Deposit ', EN_INGLES)).toBe('Seña');
    expect(conceptoParaGuardar('Final balance on delivery', EN_INGLES)).toBe(
      'Saldo final en la entrega',
    );
  });

  it('en castellano quedan como están', () => {
    expect(conceptoParaGuardar('Seña de la visita', CONCEPTOS_DE_SIEMPRE)).toBe(
      'Seña de la visita',
    );
  });

  it('lo que escribió la persona queda como lo escribió, sin espacios de más', () => {
    expect(conceptoParaGuardar(' Adelanto en efectivo ', EN_INGLES)).toBe('Adelanto en efectivo');
    expect(conceptoParaGuardar('Deposit for the doors', EN_INGLES)).toBe('Deposit for the doors');
  });

  it('se muestran en el idioma de quien los lee; lo demás, como se guardó', () => {
    expect(conceptoEnPantalla('Seña', EN_INGLES)).toBe('Deposit');
    expect(conceptoEnPantalla(' Saldo final en la entrega ', EN_INGLES)).toBe(
      'Final balance on delivery',
    );
    expect(conceptoEnPantalla('Adelanto en efectivo', EN_INGLES)).toBe('Adelanto en efectivo');
  });

  it('reconoce un concepto de siempre por su texto en castellano', () => {
    expect(conceptoDeSiempre('Seña de la visita')).toBe('senaDeLaVisita');
    expect(conceptoDeSiempre('Deposit')).toBeNull();
  });
});
