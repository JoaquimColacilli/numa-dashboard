import { describe, expect, it } from 'vitest';

import { fijarLosTextosDeLib, textosDeLib, type TextosDeLib } from './textos';

describe('los textos de shared/lib', () => {
  it('los lee de quien los fija, en el momento en que se piden', () => {
    const anteriores = textosDeLib();
    let actuales: TextosDeLib = {};
    try {
      fijarLosTextosDeLib(() => actuales);
      expect(textosDeLib()).toBe(actuales);
      actuales = { ...actuales };
      expect(textosDeLib()).toBe(actuales);
    } finally {
      fijarLosTextosDeLib(() => anteriores);
    }
  });
});
