import { afterEach, describe, expect, it } from 'vitest';

import { mensajes, usarIdioma } from './mensajes';
import { textosDelIdioma } from './textosDelIdioma';

afterEach(async () => {
  await usarIdioma('es');
});

describe('una tabla de textos que sigue al idioma', () => {
  const MONEDA = textosDelIdioma(() => mensajes().editarTesoro.moneda);

  it('se lee como un objeto común, con el idioma de ese momento', async () => {
    expect(MONEDA.pesos).toBe('Pesos');
    expect(Object.keys(MONEDA)).toEqual(Object.keys(mensajes().editarTesoro.moneda));
    expect({ ...MONEDA }).toEqual(mensajes().editarTesoro.moneda);
    expect('dolares' in MONEDA).toBe(true);

    await usarIdioma('en');
    expect(MONEDA.dolares).toBe('Dollars');
    expect(Object.entries(MONEDA)).toContainEqual(['enPesos', 'In pesos']);
  });
});
