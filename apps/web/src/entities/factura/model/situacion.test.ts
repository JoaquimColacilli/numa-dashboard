import { describe, expect, it } from 'vitest';

import {
  DEMORA_DE_ARCA_MS,
  NADA_EN_LA_COLA,
  sePuedeFacturar,
  situacionDelPago,
  type Comprobante,
  type DatosDeLaSituacion,
} from './situacion';

const AHORA = Date.parse('2026-10-03T15:00:00Z');

function comprobante(extra: Partial<Comprobante>): Comprobante {
  return {
    id: 'f1',
    household_id: 'h',
    proyecto_id: 'p',
    pago_id: 'pago',
    tipo: 'factura_c',
    ambiente: 'produccion',
    estado: 'autorizada',
    cuit_emisor: '20-11111111-2',
    punto_de_venta: 3,
    numero: 42,
    fecha: '2026-10-03',
    cae: '76398765432109',
    cae_vence: '2026-10-13',
    concepto: 1,
    importe_centavos: 45_000_000,
    moneda: 'ARS',
    doc_tipo: 99,
    doc_nro: '0',
    condicion_iva_receptor: 5,
    receptor_condicion: 'consumidor_final',
    receptor_nombre: 'Lucía Gómez',
    receptor_domicilio: '',
    emisor: {},
    detalle: 'Seña — Placard de pino',
    asociado_id: null,
    rechazo: null,
    intentos: 1,
    emitiendo_hasta: null,
    ultimo_error: null,
    pedida_at: '2026-10-03T14:00:00Z',
    autorizada_at: '2026-10-03T14:00:05Z',
    created_at: '2026-10-03T14:00:00Z',
    updated_at: '2026-10-03T14:00:05Z',
    deleted_at: null,
    version: 2,
    ...extra,
  };
}

function nota(extra: Partial<Comprobante>): Comprobante {
  return comprobante({
    id: 'n1',
    tipo: 'nota_de_credito_c',
    asociado_id: 'f1',
    numero: 7,
    pedida_at: '2026-10-03T14:30:00Z',
    ...extra,
  });
}

function datos(extra: Partial<DatosDeLaSituacion> = {}): DatosDeLaSituacion {
  return {
    pago: { id: 'pago', moneda: 'ARS', yaEnLaApertura: false },
    monedaDelTrabajo: 'ARS',
    comprobantes: [],
    taller: { conectado: true, enPrueba: false, monotributista: true },
    enLaCola: NADA_EN_LA_COLA,
    haySenal: true,
    ahora: AHORA,
    ...extra,
  };
}

describe('la situación de la factura de un pago', () => {
  it('un pago en pesos sin factura se puede facturar', () => {
    const situacion = situacionDelPago(datos());
    expect(situacion).toEqual({ tipo: 'sin-facturar' });
    expect(sePuedeFacturar(situacion)).toBe(true);
  });

  it('en dólares, el pago o el trabajo, se factura a mano', () => {
    expect(
      situacionDelPago(datos({ pago: { id: 'pago', moneda: 'USD', yaEnLaApertura: false } })),
    ).toEqual({ tipo: 'en-dolares' });
    expect(situacionDelPago(datos({ monedaDelTrabajo: 'USD' }))).toEqual({ tipo: 'en-dolares' });
  });

  it('de la apertura, o con un taller que no es monotributista, no dice nada', () => {
    expect(
      situacionDelPago(datos({ pago: { id: 'pago', moneda: 'ARS', yaEnLaApertura: true } })),
    ).toEqual({ tipo: 'nada' });
    expect(
      situacionDelPago(
        datos({ taller: { conectado: true, enPrueba: false, monotributista: false } }),
      ),
    ).toEqual({ tipo: 'nada' });
  });

  it('sin conectar no ofrece facturar, pero muestra las facturas de producción', () => {
    const sinConectar = { conectado: false, enPrueba: false, monotributista: true };
    expect(situacionDelPago(datos({ taller: sinConectar }))).toEqual({ tipo: 'nada' });
    expect(
      situacionDelPago(
        datos({
          taller: sinConectar,
          comprobantes: [comprobante({ ambiente: 'homologacion' })],
        }),
      ),
    ).toEqual({ tipo: 'nada' });
    expect(
      situacionDelPago(datos({ taller: sinConectar, comprobantes: [comprobante({})] })).tipo,
    ).toBe('autorizada');
  });

  it('pedida sin señal, en la cola del aparato; con señal, pidiéndola', () => {
    const enLaCola = { facturas: new Set(['pago']), notas: new Set<string>() };
    expect(situacionDelPago(datos({ enLaCola, haySenal: false }))).toEqual({ tipo: 'en-cola' });
    expect(situacionDelPago(datos({ enLaCola }))).toEqual({
      tipo: 'pidiendo',
      demora: false,
      prueba: false,
    });
  });

  it('pedida o emitiendo, pidiéndola; después de dos horas, la demora', () => {
    for (const estado of ['pedida', 'emitiendo']) {
      expect(
        situacionDelPago(datos({ comprobantes: [comprobante({ estado, numero: null })] })),
      ).toEqual({ tipo: 'pidiendo', demora: false, prueba: false });
    }
    const vieja = comprobante({
      estado: 'pedida',
      pedida_at: new Date(AHORA - DEMORA_DE_ARCA_MS - 1).toISOString(),
    });
    expect(situacionDelPago(datos({ comprobantes: [vieja] }))).toEqual({
      tipo: 'pidiendo',
      demora: true,
      prueba: false,
    });
  });

  it('autorizada, y en homologación con su prueba', () => {
    const factura = comprobante({});
    expect(situacionDelPago(datos({ comprobantes: [factura] }))).toEqual({
      tipo: 'autorizada',
      factura,
      prueba: false,
    });
    const deprueba = comprobante({ ambiente: 'homologacion' });
    expect(situacionDelPago(datos({ comprobantes: [deprueba] }))).toMatchObject({
      tipo: 'autorizada',
      prueba: true,
    });
  });

  it('con su nota pedida, en la cola o rechazada', () => {
    const factura = comprobante({});
    expect(
      situacionDelPago(datos({ comprobantes: [factura, nota({ estado: 'pedida', numero: null })] }))
        .tipo,
    ).toBe('anulando');
    expect(
      situacionDelPago(
        datos({
          comprobantes: [factura],
          enLaCola: { facturas: new Set(), notas: new Set(['f1']) },
        }),
      ).tipo,
    ).toBe('anulando');
    const rechazada = nota({ estado: 'rechazada', numero: null });
    expect(situacionDelPago(datos({ comprobantes: [factura, rechazada] }))).toEqual({
      tipo: 'nota-rechazada',
      factura,
      nota: rechazada,
      prueba: false,
    });
  });

  it('anulada, con su nota, y se puede volver a facturar', () => {
    const factura = comprobante({ estado: 'anulada' });
    const laNota = nota({});
    const situacion = situacionDelPago(datos({ comprobantes: [factura, laNota] }));
    expect(situacion).toEqual({
      tipo: 'anulada',
      factura,
      nota: laNota,
      facturable: true,
      prueba: false,
    });
    expect(sePuedeFacturar(situacion)).toBe(true);
  });

  it('una factura nueva después de una anulada manda la nueva', () => {
    const anulada = comprobante({ estado: 'anulada' });
    const nueva = comprobante({
      id: 'f2',
      estado: 'pedida',
      numero: null,
      pedida_at: '2026-10-03T14:40:00Z',
    });
    expect(situacionDelPago(datos({ comprobantes: [nueva, anulada, nota({})] })).tipo).toBe(
      'pidiendo',
    );
  });

  it('rechazada, con volver a pedir', () => {
    const factura = comprobante({ estado: 'rechazada', numero: null, cae: null });
    const situacion = situacionDelPago(datos({ comprobantes: [factura] }));
    expect(situacion).toEqual({ tipo: 'rechazada', factura, facturable: true, prueba: false });
    expect(sePuedeFacturar(situacion)).toBe(true);
  });

  it('a revisar, la factura o su nota', () => {
    const factura = comprobante({ estado: 'a_revisar', cae: null });
    expect(situacionDelPago(datos({ comprobantes: [factura] }))).toEqual({
      tipo: 'a-revisar',
      factura,
      aRevisar: factura,
      prueba: false,
    });
    const autorizada = comprobante({});
    const laNota = nota({ estado: 'a_revisar' });
    expect(situacionDelPago(datos({ comprobantes: [autorizada, laNota] }))).toEqual({
      tipo: 'a-revisar',
      factura: autorizada,
      aRevisar: laNota,
      prueba: false,
    });
  });

  it('un comprobante borrado no cuenta', () => {
    expect(
      situacionDelPago(
        datos({ comprobantes: [comprobante({ deleted_at: '2026-10-03T16:00:00Z' })] }),
      ),
    ).toEqual({ tipo: 'sin-facturar' });
  });
});
