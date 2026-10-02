import { describe, expect, it } from 'vitest';

import { conArticulo } from './gramatica';

describe('la gramática del castellano', () => {
  it('pone el artículo que corresponde al renglón', () => {
    expect(conArticulo('Alquiler')).toBe('el alquiler');
    expect(conArticulo('Luz')).toBe('la luz');
    expect(conArticulo('Gas')).toBe('el gas');
    expect(conArticulo('Expensas')).toBe('las expensas');
    expect(conArticulo('Sueldos')).toBe('los sueldos');
    expect(conArticulo('Cuota del auto')).toBe('la cuota del auto');
    expect(conArticulo('Comisiones')).toBe('las comisiones');
    expect(conArticulo('Agua')).toBe('el agua');
    expect(conArticulo('ABL')).toBe('el ABL');
  });
});
