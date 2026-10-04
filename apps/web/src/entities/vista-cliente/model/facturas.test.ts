import { centavos, type FacturaDelCliente } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { facturaEnPdf } from './facturas';

const FACTURA: FacturaDelCliente = {
  id: 'c1',
  tipo: 'factura_c',
  puntoDeVenta: 3,
  numero: 42,
  fecha: '2026-10-03',
  importe: centavos(45_000_000),
  detalle: 'Seña — Placard 3 puertas',
  cae: '76398765432109',
  caeVence: '2026-10-13',
  prueba: true,
  emisor: {
    nombreDelTaller: 'Taller MAUN',
    razonSocial: 'Ana Gutiérrez',
    domicilio: 'Olazábal 1240, CABA',
    cuit: '20-11111111-2',
    ingresosBrutos: '901-123456-7',
    inicioDeActividades: '2019-03-01',
  },
  receptor: {
    nombre: 'Marcela Duarte',
    condicion: 'consumidor_final',
    docTipo: 96,
    docNro: '28456789',
    domicilio: 'Olazábal 1240, Ituzaingó',
  },
  anuladaPor: { puntoDeVenta: 3, numero: 7, fecha: '2026-10-04' },
  anulaA: null,
};

describe('el PDF de una factura de la página del cliente', () => {
  it('es el mismo documento que arma la app del taller: los datos de la factura, sin el id ni con qué nota se anuló', () => {
    expect(facturaEnPdf(FACTURA)).toEqual({
      tipo: 'factura_c',
      prueba: true,
      puntoDeVenta: 3,
      numero: 42,
      fecha: '2026-10-03',
      cae: '76398765432109',
      caeVence: '2026-10-13',
      importe: 45_000_000,
      detalle: 'Seña — Placard 3 puertas',
      emisor: FACTURA.emisor,
      receptor: FACTURA.receptor,
      anulaA: null,
    });
  });

  it('la nota de crédito lleva qué factura anula; una factura, nunca', () => {
    const anulaA = { puntoDeVenta: 3, numero: 42, fecha: '2026-10-03' };
    const nota: FacturaDelCliente = {
      ...FACTURA,
      tipo: 'nota_de_credito_c',
      numero: 7,
      anuladaPor: null,
      anulaA,
    };
    expect(facturaEnPdf(nota).anulaA).toEqual(anulaA);
    expect(facturaEnPdf({ ...FACTURA, anulaA }).anulaA).toBeNull();
  });
});
