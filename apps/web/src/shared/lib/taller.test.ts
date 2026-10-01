import { describe, expect, it } from 'vitest';

import { nombreDelTaller, TALLER_DE_RESPALDO } from './taller';

describe('el nombre del taller en el presupuesto', () => {
  it('es el del hogar sin blancos en las puntas, o «Taller MAUN» si está vacío', () => {
    expect(nombreDelTaller('  Taller de prueba ')).toBe('Taller de prueba');
    expect(nombreDelTaller('   ')).toBe(TALLER_DE_RESPALDO);
    expect(nombreDelTaller(undefined)).toBe('Taller MAUN');
    expect(nombreDelTaller(null)).toBe('Taller MAUN');
  });
});
