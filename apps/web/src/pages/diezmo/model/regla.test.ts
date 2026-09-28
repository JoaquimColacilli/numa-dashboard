import { puntosBasicos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { obligacionDelDiezmo, reglaDelDiezmo, todaviaSinDiezmo } from './regla';

describe('el diezmo lee su porcentaje y sobre qué se calcula en la fila', () => {
  const obligaciones = [
    { tesoro: 'iibb', porcentaje: puntosBasicos(350), base: 'cobrado' as const },
    { tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso' as const },
  ];

  it('con lo de siempre, el 10% del ingreso de cada trabajo', () => {
    const diezmo = obligacionDelDiezmo({ obligaciones }, 'diezmo');
    expect(diezmo).toMatchObject({ porcentaje: 1000, base: 'ingreso' });
    expect(todaviaSinDiezmo(diezmo)).toBe(
      'Todavía no se generó diezmo. El 10% del ingreso de cada trabajo (lo cobrado menos los gastos) se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.',
    );
  });

  it('con otro porcentaje y sobre lo que cobrás, lo dice así', () => {
    expect(reglaDelDiezmo({ porcentaje: puntosBasicos(1250), base: 'cobrado' })).toBe(
      'El 12,5% de lo que cobrás de cada trabajo',
    );
  });

  it('sin el diezmo en la fila, no inventa un porcentaje', () => {
    expect(obligacionDelDiezmo({ obligaciones }, 'otro')).toBeNull();
    expect(todaviaSinDiezmo(null)).toBe(
      'Todavía no se generó diezmo. Lo que corresponde al diezmo de cada trabajo se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.',
    );
  });
});
