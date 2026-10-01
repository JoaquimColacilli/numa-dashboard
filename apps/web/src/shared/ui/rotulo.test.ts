import { describe, expect, it } from 'vitest';

import { casillasDelPresupuesto } from './rotulo';

describe('las casillas del rótulo del presupuesto', () => {
  it('mandado: número, revisión, el día en que se mandó y hasta cuándo vale', () => {
    expect(
      casillasDelPresupuesto({
        numero: '20260826-01',
        revision: 2,
        emitido: '2026-09-02',
        valeHasta: '2026-09-17',
      }),
    ).toEqual([
      { titulo: 'Presupuesto', valor: 'Nº 20260826-01' },
      { titulo: 'Rev.', valor: '2' },
      { titulo: 'Emitido', valor: '02/09/26' },
      { titulo: 'Vale hasta', valor: '17/09/26' },
    ]);
  });

  it('la revisión va también en la primera, y sin vencimiento lo dice', () => {
    expect(
      casillasDelPresupuesto({
        numero: '20260826-01',
        revision: 1,
        emitido: '2026-09-02',
        valeHasta: null,
      }),
    ).toEqual([
      { titulo: 'Presupuesto', valor: 'Nº 20260826-01' },
      { titulo: 'Rev.', valor: '1' },
      { titulo: 'Emitido', valor: '02/09/26' },
      { titulo: 'Vale hasta', valor: 'Sin vencimiento' },
    ]);
  });

  it('vencido, la última casilla dice que venció, en atención', () => {
    expect(
      casillasDelPresupuesto({
        numero: '20260826-01',
        revision: 1,
        emitido: '2026-09-02',
        valeHasta: '2026-09-17',
        vencido: true,
      }).at(-1),
    ).toEqual({ titulo: 'Venció', valor: '17/09/26', tono: 'atencion' });
  });

  it('aceptado: la opción y el día en lugar de hasta cuándo vale', () => {
    expect(
      casillasDelPresupuesto({
        numero: '20260826-01',
        revision: 2,
        emitido: '2026-09-02',
        valeHasta: '2026-09-17',
        aceptado: { el: '2026-09-04', letra: 'A' },
      }).slice(3),
    ).toEqual([
      { titulo: 'Opción', valor: 'A' },
      { titulo: 'Aceptado', valor: '04/09/26', tono: 'hecho' },
    ]);
  });

  it('el borrador no tiene número todavía ni día de envío', () => {
    expect(casillasDelPresupuesto({ numero: null, revision: 1, emitido: null })).toEqual([
      { titulo: 'Presupuesto', valor: 'Sin número todavía' },
      { titulo: 'Rev.', valor: '1' },
    ]);
  });
});
