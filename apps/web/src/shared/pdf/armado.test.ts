import { centavos, type DocumentoDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  cargarMensajesDelCliente,
  MENSAJES_DEL_CLIENTE_EN_CASTELLANO,
} from '@/shared/idioma-del-cliente';

import {
  casillasDelRotuloDelPdf,
  conQueCambio,
  deQuienEs,
  fechaDeCreacion,
  LEYENDA_DE_ARCA,
  lineaDelAceptado,
  lineasDelTaller,
  pieDelTaller,
  textoDeLaPagina,
  textoDeLaValidez,
  textoDelPlazo,
  tituloDelPdf,
} from './armado';
import { lenguaDelPdf, sinEspaciosFinos, sinEspaciosFinosEn } from './lengua';
import type { PresupuestoEnPdf } from './tipos';

const ES = lenguaDelPdf('es', MENSAJES_DEL_CLIENTE_EN_CASTELLANO);

const DOCUMENTO = {
  taller: {
    nombre: 'Taller MAUN',
    titular: 'Julián Ferro',
    cuit: '20-12345678-6',
    condicionFiscal: 'monotributo',
    domicilio: 'Pasaje Los Aromos 120, Haedo',
    telefono: '11 4088-2210',
    email: 'taller@ejemplo.com',
  },
  cliente: 'Florencia Sosa',
  titulo: 'Cocina',
  validezDias: 15,
} as DocumentoDelPresupuesto;

const MANDADO: PresupuestoEnPdf = {
  documento: DOCUMENTO,
  idioma: 'es',
  numero: '20260826-01',
  revision: 2,
  mandadoEl: '2026-09-02',
  valeHasta: '2026-09-17',
  queCambio: 'Pasamos la alacena a Gris Grafito.',
  aceptado: null,
  borrador: false,
};

const BORRADOR: PresupuestoEnPdf = {
  ...MANDADO,
  numero: null,
  revision: 1,
  mandadoEl: null,
  valeHasta: null,
  queCambio: null,
  borrador: true,
};

const ACEPTADO: PresupuestoEnPdf = {
  ...MANDADO,
  valeHasta: null,
  aceptado: { el: '2026-09-04', letra: 'A', acordado: centavos(210_000_000) },
};

describe('lo que va escrito en el PDF', () => {
  it('el título: el número, la revisión desde la segunda, y el borrador', () => {
    expect(tituloDelPdf(MANDADO, ES)).toBe('Presupuesto 20260826-01 · Rev. 2');
    expect(tituloDelPdf({ ...MANDADO, revision: 1 }, ES)).toBe('Presupuesto 20260826-01');
    expect(tituloDelPdf(BORRADOR, ES)).toBe('Presupuesto (borrador)');
    expect(tituloDelPdf({ ...MANDADO, revision: 3, borrador: true }, ES)).toBe(
      'Presupuesto 20260826-01 · Rev. 3 (borrador)',
    );
  });

  it('el pie de cada hoja: el taller con su CUIT, y el número con la página', () => {
    expect(pieDelTaller(DOCUMENTO.taller)).toBe('Taller MAUN · CUIT 20-12345678-6');
    expect(textoDeLaPagina(tituloDelPdf(MANDADO, ES), 1, 3, ES)).toBe(
      'Presupuesto 20260826-01 · Rev. 2 · Página 1 de 3',
    );
    expect(deQuienEs(DOCUMENTO)).toBe('Florencia Sosa · Cocina');
  });

  it('la leyenda de ARCA, en mayúsculas', () => {
    expect(LEYENDA_DE_ARCA).toBe('DOCUMENTO NO VÁLIDO COMO FACTURA');
  });

  it('los datos del taller, en sus renglones, sin los vacíos', () => {
    expect(lineasDelTaller(DOCUMENTO.taller)).toEqual([
      'Julián Ferro · CUIT 20-12345678-6',
      'Responsable Monotributo',
      'Pasaje Los Aromos 120, Haedo',
      '11 4088-2210 · taller@ejemplo.com',
    ]);
    expect(
      lineasDelTaller({
        ...DOCUMENTO.taller,
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      }),
    ).toEqual([]);
  });

  it('las casillas del rótulo, mandado, aceptado y en borrador', () => {
    expect(
      casillasDelRotuloDelPdf(MANDADO, ES).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Emitido 02/09/26', 'Vale hasta 17/09/26']);
    expect(
      casillasDelRotuloDelPdf(ACEPTADO, ES).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Emitido 02/09/26', 'Opción A', 'Aceptado 04/09/26']);
    expect(
      casillasDelRotuloDelPdf(BORRADOR, ES).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. —', 'Emitido —', 'Validez 15 días']);
    expect(casillasDelRotuloDelPdf({ ...MANDADO, valeHasta: null }, ES).at(-1)).toEqual({
      titulo: 'Validez',
      valor: 'Sin venc.',
    });
  });

  it('la validez dice la fecha viva; el borrador, los días; el aceptado, nada', () => {
    expect(textoDeLaValidez(MANDADO, ES)).toBe('Hasta el 17 de septiembre de 2026.');
    expect(textoDeLaValidez({ ...MANDADO, valeHasta: null }, ES)).toBe('Sin vencimiento.');
    expect(textoDeLaValidez(BORRADOR, ES)).toBe('15 días desde que se manda.');
    expect(textoDeLaValidez(ACEPTADO, ES)).toBeNull();
    expect(textoDelPlazo(30, ES)).toBe('30 días hábiles desde la seña.');
  });

  it('el aceptado dice el día y la opción', () => {
    expect(lineaDelAceptado('2026-09-04', 'A', ES)).toBe(
      'Aceptado el 4 de septiembre de 2026 · Opción A',
    );
    expect(lineaDelAceptado(null, null, ES)).toBe('Aceptado');
    expect(lineaDelAceptado(null, 'B', ES)).toBe('Aceptado · Opción B');
    expect(lineaDelAceptado('2026-09-04', null, ES)).toBe('Aceptado el 4 de septiembre de 2026');
  });

  it('«qué cambió» va desde la segunda revisión, ni en el borrador ni en el aceptado', () => {
    expect(conQueCambio(MANDADO)).toBe(true);
    expect(conQueCambio({ ...MANDADO, revision: 1 })).toBe(false);
    expect(conQueCambio({ ...MANDADO, borrador: true })).toBe(false);
    expect(conQueCambio(ACEPTADO)).toBe(false);
  });

  it('la fecha de creación es el mediodía del envío; el borrador lleva la de cuando se genera', () => {
    expect(fechaDeCreacion(MANDADO)?.toISOString()).toBe('2026-09-02T15:00:00.000Z');
    expect(fechaDeCreacion(BORRADOR)).toBeUndefined();
  });
});

describe('lo que va escrito en el PDF, en inglés y en portugués', () => {
  it('en inglés: el título, la página, el rótulo, la validez, el plazo y el aceptado', async () => {
    const en = lenguaDelPdf('en', await cargarMensajesDelCliente('en'));
    expect(tituloDelPdf(MANDADO, en)).toBe('Quote 20260826-01 · Rev. 2');
    expect(tituloDelPdf(BORRADOR, en)).toBe('Quote (draft)');
    expect(tituloDelPdf({ ...MANDADO, borrador: true }, en)).toBe(
      'Quote 20260826-01 · Rev. 2 (draft)',
    );
    expect(textoDeLaPagina('Quote 7', 2, 3, en)).toBe('Quote 7 · Page 2 of 3');
    expect(
      casillasDelRotuloDelPdf(MANDADO, en).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Issued Sep 2, 2026', 'Valid until Sep 17, 2026']);
    expect(
      casillasDelRotuloDelPdf(BORRADOR, en).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. —', 'Issued —', 'Valid for 15 days']);
    expect(textoDeLaValidez(MANDADO, en)).toBe('Until September 17, 2026.');
    expect(textoDeLaValidez(BORRADOR, en)).toBe("15 days from when it's sent.");
    expect(textoDelPlazo(1, en)).toBe('1 business day from the deposit.');
    expect(lineaDelAceptado('2026-09-04', 'A', en)).toBe(
      'Accepted on September 4, 2026 · Option A',
    );
  });

  it('en portugués: el título, la página, el rótulo, la validez, el plazo y el aceptado', async () => {
    const pt = lenguaDelPdf('pt-BR', await cargarMensajesDelCliente('pt-BR'));
    expect(tituloDelPdf(MANDADO, pt)).toBe('Orçamento 20260826-01 · Rev. 2');
    expect(tituloDelPdf(BORRADOR, pt)).toBe('Orçamento (rascunho)');
    expect(textoDeLaPagina('Orçamento 7', 2, 3, pt)).toBe('Orçamento 7 · Página 2 de 3');
    expect(
      casillasDelRotuloDelPdf(ACEPTADO, pt).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Emitido 2 set. 2026', 'Opção A', 'Aceito 4 set. 2026']);
    expect(textoDeLaValidez(MANDADO, pt)).toBe('Até 17 de setembro de 2026.');
    expect(textoDelPlazo(30, pt)).toBe('30 dias úteis a partir do sinal.');
    expect(lineaDelAceptado(null, 'B', pt)).toBe('Aceito · Opção B');
  });

  it('el espacio fino de Intl no llega al PDF: la letra no lo tiene', () => {
    expect(sinEspaciosFinos('10 %')).toBe('10 %');
    expect(sinEspaciosFinosEn({ texto: ['a b'], numero: 3 })).toEqual({
      texto: ['a b'],
      numero: 3,
    });
  });
});
