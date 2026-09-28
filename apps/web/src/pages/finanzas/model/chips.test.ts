import { describe, expect, it } from 'vitest';

import { tesorosDeLosChips } from './chips';

const TESOROS = [
  { id: 'hogar', archivado: false },
  { id: 'maun', archivado: false },
  { id: 'herramientas', archivado: true },
  { id: 'materiales', archivado: false },
  { id: 'viaje', archivado: true },
];

describe('los chips de tesoro de Finanzas', () => {
  it('son los tesoros vivos, en su orden', () => {
    expect(tesorosDeLosChips(TESOROS, new Set(), 'todos').map((tesoro) => tesoro.id)).toEqual([
      'hogar',
      'maun',
      'materiales',
    ]);
  });

  it('un archivado aparece al final si tuvo movimientos en el período', () => {
    expect(
      tesorosDeLosChips(TESOROS, new Set(['herramientas', 'maun']), 'todos').map(
        (tesoro) => tesoro.id,
      ),
    ).toEqual(['hogar', 'maun', 'materiales', 'herramientas']);
  });

  it('el archivado que está elegido sigue a la vista aunque no tenga movimientos', () => {
    expect(tesorosDeLosChips(TESOROS, new Set(), 'viaje').map((tesoro) => tesoro.id)).toEqual([
      'hogar',
      'maun',
      'materiales',
      'viaje',
    ]);
  });
});
