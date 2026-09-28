import { describe, expect, it } from 'vitest';

import { CLASE, CLASES_EN_ORDEN, claseDe, clasesDelGrupo, GRUPOS, vaEntreTesoros } from './clases';

describe('las clases de movimiento', () => {
  it('las ocho de siempre fijan su tipo y sus dos lados, y no cambiaron', () => {
    expect(
      CLASES_EN_ORDEN.filter((id) => !CLASE[id].eligeLosLados).map((id) => [
        id,
        CLASE[id].tipo,
        CLASE[id].desde,
        CLASE[id].hacia,
      ]),
    ).toEqual([
      ['ingreso_hogar', 'ingreso', null, 'hogar'],
      ['ingreso_maun', 'ingreso', null, 'maun'],
      ['gasto_hogar', 'gasto', 'hogar', null],
      ['gasto_maun', 'gasto', 'maun', null],
      ['pago_diezmo', 'pago_diezmo', 'diezmo', null],
      ['aporte_cocos', 'aporte_cocos', 'maun', 'cocos'],
      ['retiro_cocos', 'transferencia', 'cocos', 'maun'],
      ['gasto_cocos', 'gasto', 'cocos', null],
    ]);
  });

  it('la novena es «Entre tesoros»: una transferencia con los dos lados para elegir', () => {
    expect(CLASES_EN_ORDEN).toHaveLength(9);
    expect(CLASES_EN_ORDEN.at(-1)).toBe('entre_tesoros');
    expect(CLASE.entre_tesoros).toMatchObject({
      grupo: 'entre',
      etiqueta: 'Entre tesoros',
      tipo: 'transferencia',
      eligeLosLados: true,
      tesoro: null,
    });
    expect(GRUPOS.map((grupo) => grupo.etiqueta)).toEqual([
      'Ingreso',
      'Gasto',
      'Diezmo',
      'Cocos',
      'Entre tesoros',
    ]);
    expect(clasesDelGrupo('entre').map((clase) => clase.id)).toEqual(['entre_tesoros']);
  });

  it('una fila se reconoce por su tipo y sus claves, y cualquier otra transferencia es entre tesoros', () => {
    expect(claseDe('gasto', 'hogar', null)?.id).toBe('gasto_hogar');
    expect(claseDe('transferencia', 'cocos', 'maun')?.id).toBe('retiro_cocos');
    expect(claseDe('aporte_cocos', 'maun', 'cocos')?.id).toBe('aporte_cocos');
    expect(claseDe('transferencia', 'maun', 'cocos')?.id).toBe('entre_tesoros');
    expect(claseDe('transferencia', 'hogar', null)?.id).toBe('entre_tesoros');
    expect(claseDe('transferencia', null, null)?.id).toBe('entre_tesoros');
    expect(claseDe('gasto', null, null)).toBeUndefined();
    expect(claseDe('ajuste', null, 'cocos')).toBeUndefined();
  });

  it('el diezmo no entra en un pase entre tesoros: sale solo por el pago', () => {
    expect(vaEntreTesoros({ clave: 'diezmo' })).toBe(false);
    expect(vaEntreTesoros({ clave: 'maun' })).toBe(true);
    expect(vaEntreTesoros({ clave: null })).toBe(true);
  });
});
