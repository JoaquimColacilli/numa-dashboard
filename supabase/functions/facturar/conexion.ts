import { cuitValido } from '@maun/domain';

import { ErrorDeLaBase, type FacturacionDelTaller } from './base.ts';
import {
  armarElPedido,
  clavePemDescifrada,
  esDelPedido,
  leerElCertificado,
} from './certificados.ts';
import { estaPrendido } from './entorno.ts';
import type { Dependencias } from './emision.ts';
import { estadoSinArca, type RespuestaDelEstado } from './estado.ts';
import { SinRespuesta } from './red.ts';
import { accesoAArca } from './wsaa.ts';
import { conversacion, puntosDeVenta, ultimoAutorizado } from './wsfe.ts';

export type Contestado<T> =
  { ok: true; valor: T } | { ok: false; motivo: string; esperarHasta?: string };

const ALGO_ESCRITO = /[^ \t\n\r\f\v]/;

function no(
  motivo: string,
  esperarHasta?: string,
): { ok: false; motivo: string; esperarHasta?: string } {
  return esperarHasta === undefined ? { ok: false, motivo } : { ok: false, motivo, esperarHasta };
}

export async function pedirElCertificado(
  dependencias: Dependencias,
  taller: FacturacionDelTaller,
): Promise<Contestado<{ pedido: string }>> {
  const llave = dependencias.configuracion.llaveDeProduccion;
  if (llave === null || !estaPrendido(dependencias.configuracion, 'produccion'))
    return no('apagada');
  if (taller.ambiente === 'homologacion') return no('en-prueba');
  if (taller.tallerCondicionFiscal !== 'monotributo') return no('no-monotributo');
  const cuit = taller.ambiente === 'produccion' ? taller.cuit : taller.tallerCuit;
  if (!/^\d{2}-\d{8}-\d$/.test(cuit) || !cuitValido(cuit)) return no('taller-sin-cuit');
  if (!ALGO_ESCRITO.test(taller.tallerTitular)) return no('taller-sin-razon-social');

  const armado = await armarElPedido(cuit, taller.tallerTitular, llave);
  await dependencias.base.guardarElPedido(
    taller.householdId,
    cuit,
    armado.pedido,
    armado.claveCifrada,
    armado.claveIv,
  );
  return { ok: true, valor: { pedido: armado.pedido } };
}

export async function subirElCertificado(
  dependencias: Dependencias,
  usuarioId: string,
  taller: FacturacionDelTaller,
  texto: unknown,
): Promise<Contestado<RespuestaDelEstado>> {
  if (!estaPrendido(dependencias.configuracion, 'produccion')) return no('apagada');
  if (typeof texto !== 'string') return no('no-es-un-certificado');
  const leido = await leerElCertificado(texto);
  if (!leido.ok) return no('no-es-un-certificado');

  const { pendiente } = await dependencias.base.certificados(taller.householdId);
  if (pendiente === null || pendiente.estado !== 'pedido' || pendiente.pedido === undefined) {
    return no('no-es-de-este-pedido');
  }
  if (!esDelPedido(leido.certificado, pendiente.pedido)) return no('no-es-de-este-pedido');
  if (leido.cuit !== pendiente.cuit.replace(/\D/g, '')) return no('otro-cuit');
  if (leido.certificado.validity.notAfter.getTime() <= dependencias.ahora().getTime()) {
    return no('vencido');
  }

  await dependencias.base.guardarElCertificado(pendiente.id, leido.pem, leido.huella, leido.vence);
  const actualizado = (await dependencias.base.delUsuario(usuarioId)) ?? taller;
  return { ok: true, valor: estadoSinArca(dependencias, actualizado) };
}

const MOTIVO_DE_LA_BASE: Readonly<Record<string, string>> = {
  'certificado-ajeno': 'sin-certificado',
  'certificado-sin-subir': 'sin-certificado',
  'en-prueba': 'en-prueba',
  'otro-cuit': 'otro-cuit',
  'otro-punto-de-venta': 'otro-punto-de-venta',
  'comprobantes-en-vuelo': 'comprobantes-en-vuelo',
  'punto-de-venta-de-otro-taller': 'punto-de-venta-de-otro-taller',
};

export async function conectarElTaller(
  dependencias: Dependencias,
  usuarioId: string,
  taller: FacturacionDelTaller,
  puntoDeVenta: unknown,
): Promise<Contestado<RespuestaDelEstado>> {
  const { configuracion, base } = dependencias;
  const llave = configuracion.llaveDeProduccion;
  if (llave === null || !estaPrendido(configuracion, 'produccion')) return no('apagada');
  if (taller.ambiente === 'homologacion') return no('en-prueba');
  if (
    typeof puntoDeVenta !== 'number' ||
    !Number.isInteger(puntoDeVenta) ||
    puntoDeVenta < 1 ||
    puntoDeVenta > 99_998
  ) {
    return no('sin-punto-de-venta');
  }

  const renovando = taller.ambiente === 'produccion';
  const { activo, pendiente } = await base.certificados(taller.householdId);
  const certificado = pendiente?.estado === 'subido' ? pendiente : renovando ? null : activo;
  if (certificado === null || certificado.certificado === null || certificado.huella === null) {
    return no('sin-certificado');
  }
  if (renovando && puntoDeVenta !== taller.puntoDeVenta) return no('otro-punto-de-venta');

  const leido = await leerElCertificado(certificado.certificado);
  if (!leido.ok) return no('sin-certificado');
  const firmante = {
    pem: certificado.certificado,
    clavePem: await clavePemDescifrada(llave, certificado.claveCifrada, certificado.claveIv),
    cuit: leido.cuit,
    vence: leido.vence,
    claveDelTicket: certificado.huella,
  };

  const acceso = await accesoAArca(dependencias, 'produccion', firmante, taller.householdId);
  if (!acceso.ok) {
    if (acceso.razon === 'esperar') return no('esperando', acceso.hasta);
    if (acceso.razon === 'rechazado') return no('login-rechazado');
    return no('arca-no-contesta');
  }

  const hablar = conversacion({
    ambiente: 'produccion',
    pedir: dependencias.pedir,
    anotar: (intercambio) => base.anotarElIntercambio(intercambio).catch(() => undefined),
    householdId: taller.householdId,
    comprobanteId: null,
    cuits: [firmante.cuit],
  });
  let ultimoNumero: number;
  try {
    const puntos = await puntosDeVenta(hablar, acceso.credencial);
    if ('errores' in puntos) return no('arca-no-contesta');
    const punto = puntos.puntos.find((encontrado) => encontrado.numero === puntoDeVenta);
    if (
      punto === undefined ||
      punto.deBaja ||
      punto.bloqueado ||
      !/^CAE\b/.test(punto.emisionTipo)
    ) {
      return no('sin-punto-de-venta');
    }
    const ultimo = await ultimoAutorizado(hablar, acceso.credencial, puntoDeVenta, 'factura_c');
    if ('errores' in ultimo) return no('arca-no-contesta');
    ultimoNumero = ultimo.numero;
  } catch (error) {
    if (error instanceof SinRespuesta) return no('arca-no-contesta');
    throw error;
  }

  try {
    await base.conectar(taller.householdId, certificado.id, puntoDeVenta);
  } catch (error) {
    if (error instanceof ErrorDeLaBase && error.codigo === '22023') {
      return no(MOTIVO_DE_LA_BASE[error.hint] ?? 'sin-certificado');
    }
    throw error;
  }

  const actualizado = (await base.delUsuario(usuarioId)) ?? taller;
  return {
    ok: true,
    valor: {
      ...estadoSinArca(dependencias, actualizado),
      servidor: 'ok',
      login: 'ok',
      ultimoNumero,
    },
  };
}
