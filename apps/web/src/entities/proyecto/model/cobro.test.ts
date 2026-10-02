import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import { cambiaAlgunaForma, monedasGuardadas } from './cobro';

function proyecto(extra: Partial<FilaDe<'proyectos'>> = {}): FilaDe<'proyectos'> {
  return {
    id: 'p',
    cobro_sena: ['transferencia'],
    cobro_saldo: null,
    cobra_en: null,
    ...extra,
  } as unknown as FilaDe<'proyectos'>;
}

describe('en qué te paga el cliente', () => {
  it('se lee como se guardó, y uno sin columna o con algo que no es una de las tres combinaciones, sin elegir', () => {
    expect(monedasGuardadas(proyecto({ cobra_en: ['ARS', 'USD'] }))).toEqual(['ARS', 'USD']);
    expect(monedasGuardadas(proyecto())).toBeNull();
    expect(monedasGuardadas(proyecto({ cobra_en: ['USD', 'ARS'] }))).toBeNull();
    const vieja = proyecto();
    delete (vieja as Partial<FilaDe<'proyectos'>>).cobra_en;
    expect(monedasGuardadas(vieja)).toBeNull();
  });

  it('cambiarlo es un cambio de las formas de cobro, y dejarlo igual no', () => {
    expect(cambiaAlgunaForma(proyecto(), { cobra_en: ['USD'] })).toBe(true);
    expect(cambiaAlgunaForma(proyecto({ cobra_en: ['USD'] }), { cobra_en: null })).toBe(true);
    expect(cambiaAlgunaForma(proyecto({ cobra_en: ['USD'] }), { cobra_en: ['USD'] })).toBe(false);
    expect(cambiaAlgunaForma(proyecto(), { cobra_en: null })).toBe(false);
  });

  it('las formas de cada pago siguen contando como antes', () => {
    expect(cambiaAlgunaForma(proyecto(), { cobro_sena: ['efectivo'] })).toBe(true);
    expect(cambiaAlgunaForma(proyecto(), { cobro_sena: ['transferencia'] })).toBe(false);
    expect(cambiaAlgunaForma(proyecto(), {})).toBe(false);
  });
});
