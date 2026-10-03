import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import {
  cambiaAlgunaForma,
  cobraEnDolares,
  cobraEnPesos,
  elTallerRecibeDolares,
  formasDelTrabajo,
  monedasDelCobro,
  monedasGuardadas,
} from './cobro';

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

  it('sin elegir, o con algo que no se entiende, paga en la moneda del taller', () => {
    expect(monedasDelCobro(proyecto())).toEqual(['ARS']);
    expect(monedasDelCobro(proyecto({ cobra_en: ['USD', 'ARS'] }))).toEqual(['ARS']);
    expect(monedasDelCobro(proyecto({ cobra_en: ['USD'] }))).toEqual(['USD']);
    expect([cobraEnPesos(proyecto()), cobraEnDolares(proyecto())]).toEqual([true, false]);
    const enLasDos = proyecto({ cobra_en: ['ARS', 'USD'] });
    expect([cobraEnPesos(enLasDos), cobraEnDolares(enLasDos)]).toEqual([true, true]);
  });
});

function ajustes(extra: Partial<FilaDe<'ajustes'>> = {}): FilaDe<'ajustes'> {
  return {
    cobro_alias: '',
    cobro_cbu: '',
    cobro_titular: '',
    cobro_cuit: '',
    cobro_link: '',
    cobro_dolares_alias: '',
    cobro_dolares_cbu: '',
    ...extra,
  } as unknown as FilaDe<'ajustes'>;
}

const CUENTA_EN_PESOS = { cobro_alias: 'maun.muebles' };
const CUENTA_EN_DOLARES = { cobro_dolares_alias: 'maun.dolares' };
const LAS_DOS = ['transferencia', 'efectivo'];
const SOLO_EFECTIVO = ['efectivo'];

describe('las formas de cada pago, con la cuenta de la moneda en que paga', () => {
  const sinGuardar = { cobro_sena: null, cobro_saldo: null };

  it('un trabajo que cobra en pesos mira solo la cuenta en pesos, como siempre', () => {
    const enPesos = proyecto(sinGuardar);
    expect(formasDelTrabajo(enPesos, 'sena', ajustes(CUENTA_EN_PESOS))).toEqual(LAS_DOS);
    expect(formasDelTrabajo(enPesos, 'sena', ajustes(CUENTA_EN_DOLARES))).toEqual(SOLO_EFECTIVO);
    expect(
      formasDelTrabajo(enPesos, 'saldo', ajustes({ cobro_link: 'https://mpago.la/x' })),
    ).toEqual(LAS_DOS);
  });

  it('uno que cobra solo en dólares mira solo la cuenta en dólares', () => {
    const enDolares = proyecto({ ...sinGuardar, cobra_en: ['USD'] });
    expect(formasDelTrabajo(enDolares, 'sena', ajustes(CUENTA_EN_PESOS))).toEqual(SOLO_EFECTIVO);
    expect(formasDelTrabajo(enDolares, 'sena', ajustes(CUENTA_EN_DOLARES))).toEqual(LAS_DOS);
    expect(
      formasDelTrabajo(
        enDolares,
        'saldo',
        ajustes({ cobro_dolares_cbu: '0170000000000000000001' }),
      ),
    ).toEqual(LAS_DOS);
  });

  it('uno que cobra en las dos se transfiere con cualquiera de las dos cuentas', () => {
    const enLasDos = proyecto({ ...sinGuardar, cobra_en: ['ARS', 'USD'] });
    expect(formasDelTrabajo(enLasDos, 'sena', ajustes(CUENTA_EN_PESOS))).toEqual(LAS_DOS);
    expect(formasDelTrabajo(enLasDos, 'sena', ajustes(CUENTA_EN_DOLARES))).toEqual(LAS_DOS);
    expect(formasDelTrabajo(enLasDos, 'sena', ajustes())).toEqual(SOLO_EFECTIVO);
  });

  it('lo que se guardó manda, y unos ajustes de antes de la cuenta en dólares no la tienen', () => {
    const guardado = proyecto({ cobro_sena: ['transferencia'], cobra_en: ['USD'] });
    expect(formasDelTrabajo(guardado, 'sena', ajustes())).toEqual(['transferencia']);

    const viejos = ajustes(CUENTA_EN_PESOS) as Partial<FilaDe<'ajustes'>>;
    delete viejos.cobro_dolares_alias;
    delete viejos.cobro_dolares_cbu;
    expect(elTallerRecibeDolares(viejos as FilaDe<'ajustes'>)).toBe(false);
    expect(elTallerRecibeDolares(undefined)).toBe(false);
  });
});
