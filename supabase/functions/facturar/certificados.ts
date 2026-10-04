import forge from 'node-forge';

import { cuitDelCertificado, venceElCertificado } from './entorno.ts';

export const LARGO_MAXIMO_DEL_TITULAR = 64;

export const TOPE_DEL_CERTIFICADO = 20 * 1024;

export interface PedidoArmado {
  pedido: string;
  claveCifrada: string;
  claveIv: string;
}

export type CertificadoLeido =
  | {
      ok: true;
      pem: string;
      huella: string;
      vence: string;
      cuit: string;
      certificado: forge.pki.Certificate;
    }
  | { ok: false };

function base64(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

function bytesDeBase64(texto: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(texto), (letra) => letra.charCodeAt(0));
}

function binario(bytes: Uint8Array): string {
  let salida = '';
  for (const byte of bytes) salida += String.fromCharCode(byte);
  return salida;
}

function pem(tipo: string, bytes: Uint8Array): string {
  const lineas = base64(bytes).match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${tipo}-----\r\n${lineas.join('\r\n')}\r\n-----END ${tipo}-----\r\n`;
}

export function titularDelPedido(titular: string): string {
  return Array.from(titular.trim()).slice(0, LARGO_MAXIMO_DEL_TITULAR).join('');
}

export async function armarElPedido(
  cuit: string,
  titular: string,
  llave: CryptoKey,
): Promise<PedidoArmado> {
  const par = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', par.privateKey));
  const clave = forge.pki.privateKeyFromAsn1(
    forge.asn1.fromDer(binario(pkcs8)),
  ) as forge.pki.rsa.PrivateKey;
  const pedido = forge.pki.createCertificationRequest();
  pedido.publicKey = forge.pki.setRsaPublicKey(clave.n, clave.e);
  pedido.setSubject([
    { shortName: 'C', value: 'AR' },
    {
      shortName: 'O',
      value: titularDelPedido(titular),
      valueTagClass: forge.asn1.Type.UTF8,
    },
    { shortName: 'CN', value: 'numa' },
    { type: '2.5.4.5', value: `CUIT ${cuit.replace(/\D/g, '')}` },
  ]);
  pedido.sign(clave, forge.md.sha256.create());

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrada = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, llave, pkcs8),
  );
  return {
    pedido: forge.pki.certificationRequestToPem(pedido),
    claveCifrada: base64(cifrada),
    claveIv: base64(iv),
  };
}

export async function clavePemDescifrada(
  llave: CryptoKey,
  claveCifrada: string,
  claveIv: string,
): Promise<string> {
  const pkcs8 = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesDeBase64(claveIv) },
    llave,
    bytesDeBase64(claveCifrada),
  );
  return pem('PRIVATE KEY', new Uint8Array(pkcs8));
}

async function huella(der: string): Promise<string> {
  const bytes = Uint8Array.from(der, (letra) => letra.charCodeAt(0));
  const digesto = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digesto, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function leerElCertificado(texto: string): Promise<CertificadoLeido> {
  if (texto.length === 0 || texto.length > TOPE_DEL_CERTIFICADO) return { ok: false };
  try {
    const certificado = texto.includes('-----BEGIN CERTIFICATE-----')
      ? forge.pki.certificateFromPem(texto)
      : forge.pki.certificateFromAsn1(
          forge.asn1.fromDer(forge.util.decode64(texto.replace(/\s+/g, ''))),
        );
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(certificado)).getBytes();
    return {
      ok: true,
      pem: forge.pki.certificateToPem(certificado),
      huella: await huella(der),
      vence: venceElCertificado(certificado),
      cuit: cuitDelCertificado(certificado),
      certificado,
    };
  } catch {
    return { ok: false };
  }
}

export function esDelPedido(certificado: forge.pki.Certificate, pedidoPem: string): boolean {
  try {
    const publica = forge.pki.certificationRequestFromPem(pedidoPem)
      .publicKey as forge.pki.rsa.PublicKey | null;
    const delCertificado = certificado.publicKey as forge.pki.rsa.PublicKey;
    return (
      publica !== null && publica.n.equals(delCertificado.n) && publica.e.equals(delCertificado.e)
    );
  } catch {
    return false;
  }
}
