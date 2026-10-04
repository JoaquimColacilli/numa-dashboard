import forge from 'node-forge';

import type { Base } from './base.ts';
import type { CertificadoParaFirmar } from './entorno.ts';
import { pedirAArca, SERVICIOS, SinRespuesta, type Ambiente, type Pedir } from './red.ts';
import { desescapar, leerXml, sinLosCuit, sobreDelLogin, texto } from './xml.ts';

export interface Firmante {
  pem: string;
  clavePem: string;
}

export type ResultadoDelLogin =
  | { ok: true; token: string; firma: string; vence: string }
  | { ok: false; yaTieneTicket: boolean; motivo: string };

export interface Login {
  resultado: ResultadoDelLogin;
  http: number;
  ms: number;
}

export const SERVICIO_DE_FACTURAS = 'wsfe';

export const VENTANA_SIN_OTRO_TICKET_MS: Readonly<Record<Ambiente, number>> = {
  homologacion: 10 * 60_000,
  produccion: 2 * 60_000,
};

function enLaArgentina(fecha: Date): string {
  return new Date(fecha.getTime() - 3 * 3_600_000).toISOString().replace(/\.\d{3}Z$/, '-03:00');
}

export function pedidoDeLogin(ahora: Date): string {
  const uniqueId = String(Math.floor(ahora.getTime() / 1000));
  const generado = enLaArgentina(new Date(ahora.getTime() - 10 * 60_000));
  const vence = enLaArgentina(new Date(ahora.getTime() + 10 * 60_000));
  return `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>${uniqueId}</uniqueId><generationTime>${generado}</generationTime><expirationTime>${vence}</expirationTime></header><service>${SERVICIO_DE_FACTURAS}</service></loginTicketRequest>`;
}

export function firmarElPedido(tra: string, firmante: Firmante, ahora: Date): string {
  const certificado = forge.pki.certificateFromPem(firmante.pem);
  const clave = forge.pki.privateKeyFromPem(firmante.clavePem);
  const firmado = forge.pkcs7.createSignedData();
  firmado.content = forge.util.createBuffer(tra, 'utf8');
  firmado.addCertificate(certificado);
  firmado.addSigner({
    key: clave,
    certificate: certificado,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: ahora },
    ],
  });
  firmado.sign();
  return forge.util.encode64(forge.asn1.toDer(firmado.toAsn1()).getBytes());
}

export function leerElLogin(respuesta: string): ResultadoDelLogin {
  const xml = leerXml(respuesta);
  const retorno = texto(xml, 'Envelope', 'Body', 'loginCmsResponse', 'loginCmsReturn');
  if (retorno !== null) {
    const ticket = leerXml(desescapar(retorno));
    const token = texto(ticket, 'loginTicketResponse', 'credentials', 'token');
    const firma = texto(ticket, 'loginTicketResponse', 'credentials', 'sign');
    const vence = texto(ticket, 'loginTicketResponse', 'header', 'expirationTime');
    const fecha = vence === null ? Number.NaN : Date.parse(vence);
    if (token !== null && firma !== null && !Number.isNaN(fecha)) {
      return { ok: true, token, firma, vence: new Date(fecha).toISOString() };
    }
    return { ok: false, yaTieneTicket: false, motivo: 'login sin ticket' };
  }
  const codigo = texto(xml, 'Envelope', 'Body', 'Fault', 'faultcode') ?? '';
  const mensaje = texto(xml, 'Envelope', 'Body', 'Fault', 'faultstring') ?? '';
  const yaTieneTicket =
    /alreadyAuthenticated/i.test(codigo) || /ya posee un TA v[aá]lido/i.test(mensaje);
  return {
    ok: false,
    yaTieneTicket,
    motivo: `${codigo.replace(/^\w+:/, '')} ${mensaje}`.trim().slice(0, 300) || 'login rechazado',
  };
}

export async function entrarAArca(
  ambiente: Ambiente,
  firmante: Firmante,
  ahora: Date,
  pedir: Pedir,
): Promise<Login> {
  const cms = firmarElPedido(pedidoDeLogin(ahora), firmante, ahora);
  const contestacion = await pedirAArca(
    ambiente,
    SERVICIOS[ambiente].wsaa,
    '""',
    sobreDelLogin(cms),
    pedir,
  );
  return {
    resultado: leerElLogin(contestacion.texto),
    http: contestacion.http,
    ms: contestacion.ms,
  };
}

export const SEGUNDOS_DEL_LOGIN = 60;

export interface Credencial {
  token: string;
  firma: string;
  cuit: string;
}

export type Acceso =
  | { ok: true; credencial: Credencial; nuevo: boolean }
  | { ok: false; razon: 'esperar'; hasta: string }
  | { ok: false; razon: 'rechazado'; motivo: string }
  | { ok: false; razon: 'sin-respuesta' };

export interface ParaEntrar {
  base: Base;
  pedir: Pedir;
  ahora: () => Date;
}

export async function accesoAArca(
  dependencias: ParaEntrar,
  ambiente: Ambiente,
  firmante: CertificadoParaFirmar,
  householdDelAcceso: string | null,
): Promise<Acceso> {
  const { base, pedir, ahora } = dependencias;
  const clave = firmante.claveDelTicket;
  const conCuit = (credencial: { token: string; firma: string }): Credencial => ({
    ...credencial,
    cuit: firmante.cuit,
  });

  const toma = await base.tomarElLogin(clave, SEGUNDOS_DEL_LOGIN);
  if ('ticket' in toma) return { ok: true, credencial: conCuit(toma.ticket), nuevo: false };
  if ('esperar' in toma) return { ok: false, razon: 'esperar', hasta: toma.esperar };

  const anotar = async (http: number | null, ms: number | null, error: string | null) => {
    await base
      .anotarElIntercambio({
        householdId: householdDelAcceso,
        comprobanteId: null,
        ambiente,
        metodo: 'loginCms',
        httpEstado: http,
        duracionMs: ms,
        pedido: null,
        respuesta: null,
        error: error === null ? null : sinLosCuit(error, [firmante.cuit]).slice(0, 500),
      })
      .catch(() => undefined);
  };

  let login: Login;
  try {
    login = await entrarAArca(ambiente, firmante, ahora(), pedir);
  } catch (error) {
    await base.guardarElTicket(clave, { soltar: true });
    if (error instanceof SinRespuesta) {
      await anotar(error.http, error.ms, error.message);
      return { ok: false, razon: 'sin-respuesta' };
    }
    throw error;
  }

  const { resultado } = login;
  await anotar(login.http, login.ms, resultado.ok ? null : resultado.motivo);

  if (resultado.ok) {
    await base.guardarElTicket(clave, {
      token: resultado.token,
      firma: resultado.firma,
      vence: resultado.vence,
    });
    await base.anotarElAcceso(ambiente, true, householdDelAcceso);
    return { ok: true, credencial: conCuit(resultado), nuevo: true };
  }

  if (resultado.yaTieneTicket) {
    const hasta = new Date(
      ahora().getTime() + VENTANA_SIN_OTRO_TICKET_MS[ambiente] + 60_000,
    ).toISOString();
    await base.guardarElTicket(clave, { bloqueadoHasta: hasta });
    const otraVez = await base.tomarElLogin(clave, SEGUNDOS_DEL_LOGIN);
    if ('ticket' in otraVez) return { ok: true, credencial: conCuit(otraVez.ticket), nuevo: false };
    return { ok: false, razon: 'esperar', hasta: 'esperar' in otraVez ? otraVez.esperar : hasta };
  }

  await base.guardarElTicket(clave, { soltar: true });
  await base.anotarElAcceso(ambiente, false, householdDelAcceso);
  return { ok: false, razon: 'rechazado', motivo: sinLosCuit(resultado.motivo, [firmante.cuit]) };
}
