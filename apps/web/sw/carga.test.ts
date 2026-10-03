import { describe, expect, it } from 'vitest';

import { cargaDelPush, type DatosDelPush } from './carga';

function conDatos(valor: unknown): DatosDelPush {
  return { json: () => valor };
}

const RESPALDO_EN_CASTELLANO = {
  titulo: 'NUMA',
  cuerpo: 'Hay cosas en la agenda.',
  url: '/agenda',
  etiqueta: 'agenda',
  lang: 'es-AR',
};

describe('la carga del aviso en el service worker', () => {
  it('la carga de hoy, sin idioma, sale tal cual y en es-AR', () => {
    expect(
      cargaDelPush(
        conDatos({
          titulo: 'Hoy tenés 1 cosa en la agenda',
          cuerpo: 'Entregar: Placard (hoy)',
          url: '/agenda',
          etiqueta: 'agenda-2026-09-14',
        }),
      ),
    ).toEqual({
      titulo: 'Hoy tenés 1 cosa en la agenda',
      cuerpo: 'Entregar: Placard (hoy)',
      url: '/agenda',
      etiqueta: 'agenda-2026-09-14',
      lang: 'es-AR',
    });
  });

  it('usa el idioma que trae la carga, y el texto que le falta sale en ese idioma', () => {
    expect(
      cargaDelPush(conDatos({ titulo: 'You have 1 thing on your calendar today', lang: 'en-US' })),
    ).toEqual({
      titulo: 'You have 1 thing on your calendar today',
      cuerpo: 'You have things on your calendar.',
      url: '/agenda',
      etiqueta: 'agenda',
      lang: 'en-US',
    });
    expect(cargaDelPush(conDatos({ lang: 'pt-BR', cuerpo: '' }))).toEqual({
      titulo: 'NUMA',
      cuerpo: 'Você tem compromissos na agenda.',
      url: '/agenda',
      etiqueta: 'agenda',
      lang: 'pt-BR',
    });
  });

  it('sin datos, con datos rotos o con un idioma que no conoce, el respaldo en castellano', () => {
    expect(cargaDelPush(null)).toEqual(RESPALDO_EN_CASTELLANO);
    expect(
      cargaDelPush({
        json: () => {
          throw new SyntaxError('no es JSON');
        },
      }),
    ).toEqual(RESPALDO_EN_CASTELLANO);
    expect(cargaDelPush(conDatos('Hay cosas'))).toEqual(RESPALDO_EN_CASTELLANO);
    expect(cargaDelPush(conDatos({ lang: 'fr-FR' }))).toEqual(RESPALDO_EN_CASTELLANO);
    expect(cargaDelPush(conDatos({ lang: 'toString' }))).toEqual(RESPALDO_EN_CASTELLANO);
  });
});
