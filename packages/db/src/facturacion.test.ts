import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { ClienteMaun } from './cliente.ts';
import {
  bajarElPedidoDelCertificado,
  conectarConArca,
  descartarLaAlertaDeFacturacion,
  leerAlertasDeFacturacion,
  leerEstadoDeLaFacturacion,
  leerRechazoDeArca,
  pedirLaFactura,
  pedirLaNotaDeCredito,
  subirElCertificado,
  traerElEstadoDeLaFacturacion,
} from './facturacion.ts';
import { RespuestaInvalidaError } from './replica.ts';

const COMPROBANTE = { id: 'f1', version: 1, estado: 'pedida', tipo: 'factura_c' };

const CONECTADA = {
  conectada: true,
  ambiente: 'homologacion',
  prendido: true,
  servidor: 'ok',
  login: 'ok',
  ultimoNumero: 41,
  certificadoVence: '2028-10-02',
  certificado: null,
};

function clienteFalso(
  data: unknown,
  funcion: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const rpc = vi.fn(() => Promise.resolve({ data, error: null }));
  const invoke = vi.fn(() => Promise.resolve(funcion));
  return { cliente: { rpc, functions: { invoke } } as unknown as ClienteMaun, rpc, invoke };
}

function clienteQueRechaza(error: unknown) {
  const rpc = vi.fn(() => Promise.resolve({ data: null, error }));
  return { cliente: { rpc } as unknown as ClienteMaun, rpc };
}

function rechazoDeLaFuncion(estado: number, cuerpo: unknown) {
  return new FunctionsHttpError(new Response(JSON.stringify(cuerpo), { status: estado }));
}

describe('pedir la factura, la nota de crédito y descartar una alerta', () => {
  it('va a pedir_la_factura con el id que generó la app, el pago y el detalle', async () => {
    const { cliente, rpc } = clienteFalso(COMPROBANTE);

    const fila = await pedirLaFactura(cliente, {
      id: 'f1',
      pagoId: 'g1',
      detalle: 'Seña — Placard',
    });

    expect(fila).toEqual(COMPROBANTE);
    expect(rpc).toHaveBeenCalledWith('pedir_la_factura', {
      p_id: 'f1',
      p_pago_id: 'g1',
      p_detalle: 'Seña — Placard',
    });
  });

  it('va a pedir_la_nota_de_credito con su id y la factura que anula', async () => {
    const { cliente, rpc } = clienteFalso({ ...COMPROBANTE, id: 'n1', tipo: 'nota_de_credito_c' });

    await pedirLaNotaDeCredito(cliente, { id: 'n1', facturaId: 'f1' });

    expect(rpc).toHaveBeenCalledWith('pedir_la_nota_de_credito', {
      p_id: 'n1',
      p_factura_id: 'f1',
    });
  });

  it('va a descartar_la_alerta_de_facturacion con el código y el número de ARCA que vio el dueño', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'a1' });

    await descartarLaAlertaDeFacturacion(cliente, { codigo: 'fuera-de-numa', numero: 45 });

    expect(rpc).toHaveBeenCalledWith('descartar_la_alerta_de_facturacion', {
      p_codigo: 'fuera-de-numa',
      p_numero: 45,
    });
  });

  it('un rechazo de la base sale como error, para que la cola lo trate', async () => {
    const rechazo = { code: 'MN042', message: 'Ese pago ya tiene su factura' };
    const { cliente } = clienteQueRechaza(rechazo);

    await expect(pedirLaFactura(cliente, { id: 'f1', pagoId: 'g1', detalle: 'x' })).rejects.toBe(
      rechazo,
    );
  });

  it('no le cree a una respuesta sin el comprobante', async () => {
    const { cliente } = clienteFalso({ estado: 'pedida' });

    await expect(pedirLaFactura(cliente, { id: 'f1', pagoId: 'g1', detalle: 'x' })).rejects.toThrow(
      RespuestaInvalidaError,
    );
  });
});

describe('las alertas de la facturación', () => {
  it('lee las cuatro alertas con sus datos', () => {
    expect(
      leerAlertasDeFacturacion([
        {
          codigo: 'fuera-de-numa',
          tipo: 'factura_c',
          puntoDeVenta: 3,
          numeroArca: 45,
          numeroNuma: 44,
          descartada: true,
        },
        {
          codigo: 'a-revisar',
          comprobanteId: 'f1',
          proyectoId: 'p1',
          tipo: 'factura_c',
          puntoDeVenta: 3,
          numero: 42,
          cliente: 'Lucía Gómez',
        },
        { codigo: 'certificado-por-vencer', vence: '2026-10-25' },
        { codigo: 'sin-acceso', desde: '2026-10-03T09:15:00Z' },
      ]),
    ).toEqual([
      {
        codigo: 'fuera-de-numa',
        tipo: 'factura_c',
        puntoDeVenta: 3,
        numeroArca: 45,
        numeroNuma: 44,
        descartada: true,
      },
      {
        codigo: 'a-revisar',
        comprobanteId: 'f1',
        proyectoId: 'p1',
        tipo: 'factura_c',
        puntoDeVenta: 3,
        numero: 42,
        cliente: 'Lucía Gómez',
      },
      { codigo: 'certificado-por-vencer', vence: '2026-10-25' },
      { codigo: 'sin-acceso', desde: '2026-10-03T09:15:00Z' },
    ]);
  });

  it('salta lo que no entiende en vez de romper Inicio', () => {
    expect(leerAlertasDeFacturacion(null)).toEqual([]);
    expect(
      leerAlertasDeFacturacion([
        { codigo: 'otra' },
        { codigo: 'fuera-de-numa', tipo: 'factura_x', puntoDeVenta: 3, numeroArca: 45 },
        'texto',
        { codigo: 'sin-acceso' },
      ]),
    ).toEqual([{ codigo: 'sin-acceso', desde: null }]);
  });
});

describe('lo que contestó ARCA al rechazar', () => {
  it('lee los errores con su código y el motivo de una a revisar', () => {
    expect(
      leerRechazoDeArca({ errores: [{ codigo: 10015, mensaje: 'El documento no es válido' }] }),
    ).toEqual({ errores: [{ codigo: 10015, mensaje: 'El documento no es válido' }], motivo: null });
    expect(leerRechazoDeArca({ motivo: 'datos distintos' })).toEqual({
      errores: [],
      motivo: 'datos distintos',
    });
    expect(
      leerRechazoDeArca({ errores: [{ codigo: '10016', mensaje: 'x' }] }).errores[0]?.codigo,
    ).toBe(10016);
    expect(leerRechazoDeArca(null)).toEqual({ errores: [], motivo: null });
  });
});

describe('la función de la facturación', () => {
  it('lee el estado conectado con lo que contestó ARCA', () => {
    expect(leerEstadoDeLaFacturacion(CONECTADA)).toEqual({
      conectada: true,
      ambiente: 'homologacion',
      prendido: true,
      servidor: 'ok',
      login: 'ok',
      esperarHasta: null,
      ultimoNumero: 41,
      certificadoVence: '2028-10-02',
      certificado: null,
    });
  });

  it('lee el estado sin conectar, con el certificado pendiente', () => {
    expect(
      leerEstadoDeLaFacturacion({
        conectada: false,
        prendido: true,
        certificado: { estado: 'subido', vence: '2028-10-02' },
      }),
    ).toMatchObject({
      conectada: false,
      ambiente: null,
      certificado: { estado: 'subido', vence: '2028-10-02' },
    });
  });

  it('no le cree a un estado sin lo que importa', () => {
    expect(() => leerEstadoDeLaFacturacion(null)).toThrow(RespuestaInvalidaError);
    expect(() => leerEstadoDeLaFacturacion({ prendido: true })).toThrow(RespuestaInvalidaError);
    expect(() => leerEstadoDeLaFacturacion({ conectada: true })).toThrow(RespuestaInvalidaError);
    expect(() =>
      leerEstadoDeLaFacturacion({ conectada: false, prendido: true, certificado: { estado: 'x' } }),
    ).toThrow(RespuestaInvalidaError);
  });

  it('pide el estado por GET a facturar/estado', async () => {
    const { cliente, invoke } = clienteFalso(null, { data: CONECTADA, error: null });

    await expect(traerElEstadoDeLaFacturacion(cliente)).resolves.toMatchObject({
      ultimoNumero: 41,
    });
    expect(invoke).toHaveBeenCalledWith('facturar/estado', { method: 'GET' });
  });

  it('baja el pedido del certificado por POST', async () => {
    const pedido = '-----BEGIN CERTIFICATE REQUEST-----\nMIIB\n-----END CERTIFICATE REQUEST-----\n';
    const { cliente, invoke } = clienteFalso(null, { data: { pedido }, error: null });

    await expect(bajarElPedidoDelCertificado(cliente)).resolves.toEqual({
      ok: true,
      valor: pedido,
    });
    expect(invoke).toHaveBeenCalledWith('facturar/certificado', { body: {} });
  });

  it('un 422 trae el motivo, para que el asistente lo diga en palabras', async () => {
    const { cliente } = clienteFalso(null, {
      data: null,
      error: rechazoDeLaFuncion(422, { motivo: 'apagada' }),
    });

    await expect(bajarElPedidoDelCertificado(cliente)).resolves.toEqual({
      ok: false,
      motivo: 'apagada',
      esperarHasta: null,
    });
  });

  it('sube el certificado y conecta, y el motivo de esperar trae hasta cuándo', async () => {
    const subida = clienteFalso(null, { data: CONECTADA, error: null });
    await subirElCertificado(subida.cliente, '-----BEGIN CERTIFICATE-----');
    expect(subida.invoke).toHaveBeenCalledWith('facturar/certificado/subir', {
      body: { certificado: '-----BEGIN CERTIFICATE-----' },
    });

    const conexion = clienteFalso(null, {
      data: null,
      error: rechazoDeLaFuncion(422, { motivo: 'esperando', esperarHasta: '2026-10-03T18:42:00Z' }),
    });
    await expect(conectarConArca(conexion.cliente, 3)).resolves.toEqual({
      ok: false,
      motivo: 'esperando',
      esperarHasta: '2026-10-03T18:42:00Z',
    });
    expect(conexion.invoke).toHaveBeenCalledWith('facturar/conectar', {
      body: { puntoDeVenta: 3 },
    });
  });

  it('un motivo que no conoce, otro estado HTTP o la red caída salen como error', async () => {
    await expect(
      conectarConArca(
        clienteFalso(null, { data: null, error: rechazoDeLaFuncion(422, { motivo: 'otro' }) })
          .cliente,
        3,
      ),
    ).rejects.toBeInstanceOf(FunctionsHttpError);
    await expect(
      conectarConArca(
        clienteFalso(null, { data: null, error: rechazoDeLaFuncion(401, { error: 'sin sesión' }) })
          .cliente,
        3,
      ),
    ).rejects.toBeInstanceOf(FunctionsHttpError);
    await expect(
      traerElEstadoDeLaFacturacion(
        clienteFalso(null, { data: null, error: new FunctionsFetchError('sin red') }).cliente,
      ),
    ).rejects.toBeInstanceOf(FunctionsFetchError);
  });
});
