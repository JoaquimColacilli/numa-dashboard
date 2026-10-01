import { centavos, type DocumentoDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

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
import type { PresupuestoEnPdf } from './tipos';

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
    expect(tituloDelPdf(MANDADO)).toBe('Presupuesto 20260826-01 · Rev. 2');
    expect(tituloDelPdf({ ...MANDADO, revision: 1 })).toBe('Presupuesto 20260826-01');
    expect(tituloDelPdf(BORRADOR)).toBe('Presupuesto (borrador)');
    expect(tituloDelPdf({ ...MANDADO, revision: 3, borrador: true })).toBe(
      'Presupuesto 20260826-01 · Rev. 3 (borrador)',
    );
  });

  it('el pie de cada hoja: el taller con su CUIT, y el número con la página', () => {
    expect(pieDelTaller(DOCUMENTO.taller)).toBe('Taller MAUN · CUIT 20-12345678-6');
    expect(textoDeLaPagina(tituloDelPdf(MANDADO), 1, 3)).toBe(
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
      casillasDelRotuloDelPdf(MANDADO).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Emitido 02/09/26', 'Vale hasta 17/09/26']);
    expect(
      casillasDelRotuloDelPdf(ACEPTADO).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. 2', 'Emitido 02/09/26', 'Opción A', 'Aceptado 04/09/26']);
    expect(
      casillasDelRotuloDelPdf(BORRADOR).map(({ titulo, valor }) => `${titulo} ${valor}`),
    ).toEqual(['Rev. —', 'Emitido —', 'Validez 15 días']);
    expect(casillasDelRotuloDelPdf({ ...MANDADO, valeHasta: null }).at(-1)).toEqual({
      titulo: 'Validez',
      valor: 'Sin venc.',
    });
  });

  it('la validez dice la fecha viva; el borrador, los días; el aceptado, nada', () => {
    expect(textoDeLaValidez(MANDADO)).toBe('Hasta el 17 de septiembre de 2026.');
    expect(textoDeLaValidez({ ...MANDADO, valeHasta: null })).toBe('Sin vencimiento.');
    expect(textoDeLaValidez(BORRADOR)).toBe('15 días desde que se manda.');
    expect(textoDeLaValidez(ACEPTADO)).toBeNull();
    expect(textoDelPlazo(30)).toBe('30 días hábiles desde la seña.');
  });

  it('el aceptado dice el día y la opción', () => {
    expect(lineaDelAceptado('2026-09-04', 'A')).toBe(
      'Aceptado el 4 de septiembre de 2026 · Opción A',
    );
    expect(lineaDelAceptado(null, null)).toBe('Aceptado');
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
