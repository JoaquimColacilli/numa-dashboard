import { IDIOMAS } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { cargarMensajes } from '@/shared/idioma';
import { cargarMensajesDelCliente } from '@/shared/idioma-del-cliente';

const CARGA_DE_LOS_CATALOGOS_MS = 30_000;

describe('las palabras de cada escala', () => {
  it.each(IDIOMAS)(
    'en %s, el dueño lee las mismas que eligió el cliente',
    async (idioma) => {
      const delDueno = (await cargarMensajes(idioma)).opinion.escalas;
      const delCliente = (await cargarMensajesDelCliente(idioma)).encuesta.escalas;
      expect(delDueno).toEqual(delCliente);
    },
    CARGA_DE_LOS_CATALOGOS_MS,
  );
});
