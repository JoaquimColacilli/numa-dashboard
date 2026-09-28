import { describe, expect, it } from 'vitest';

import { esUnPlanoATodoElAncho } from './sin-molde';

describe('las pantallas sin el molde de las páginas', () => {
  it('el plano de los tesoros usa todo el ancho que deja el menú', () => {
    expect(esUnPlanoATodoElAncho('/tesoros')).toBe(true);
  });

  it('las demás pantallas siguen con su molde', () => {
    for (const ruta of ['/', '/finanzas', '/diezmo', '/tesoros/algo']) {
      expect(esUnPlanoATodoElAncho(ruta), ruta).toBe(false);
    }
  });
});
