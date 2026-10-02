import { afterEach, describe, expect, it } from 'vitest';

import { CLAVE_DEL_SEUDOIDIOMA, fijarElIdiomaEnUso, seudoTexto } from '@/shared/lib';

import { formatosDelCliente } from './formatos';

describe('las fechas de lo que ve el cliente', () => {
  afterEach(() => {
    localStorage.removeItem(CLAVE_DEL_SEUDOIDIOMA);
    fijarElIdiomaEnUso('es');
  });

  it('sin el seudoidioma salen como siempre', () => {
    expect(formatosDelCliente('es').fechaLarga('2026-10-14', '2026-10-02')).toBe('mié 14 oct');
  });

  it('con el seudoidioma salen marcadas una sola vez, en su página y desde la app', () => {
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'activo');
    const marcada = seudoTexto('mié 14 oct');
    expect(formatosDelCliente('es').fechaLarga('2026-10-14', '2026-10-02')).toBe(marcada);
    fijarElIdiomaEnUso('es', true);
    expect(formatosDelCliente('es').fechaLarga('2026-10-14', '2026-10-02')).toBe(marcada);
  });
});
