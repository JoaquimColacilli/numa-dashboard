import forge from 'node-forge';

import type { Ambiente } from './red.ts';

export interface CertificadoParaFirmar {
  pem: string;
  clavePem: string;
  cuit: string;
  vence: string;
  claveDelTicket: string;
}

export interface Configuracion {
  supabaseUrl: string;
  claveDelServidor: string;
  secretoDelTrabajo: string | null;
  pruebas: CertificadoParaFirmar | null;
  llaveDeProduccion: CryptoKey | null;
}

export interface Entorno {
  get(nombre: string): string | undefined;
}

export const BANDERA_DE_PRODUCCION = 'ARCA_PRODUCCION_HABILITADA';
export const LLAVE_DE_PRODUCCION = 'ARCA_PRODUCCION_LLAVE';

function leer(entorno: Entorno, nombre: string): string | null {
  const valor = entorno.get(nombre)?.trim();
  return valor === undefined || valor === '' ? null : valor;
}

function claveDelServidor(entorno: Entorno): string {
  const heredada = leer(entorno, 'SUPABASE_SERVICE_ROLE_KEY');
  if (heredada !== null) return heredada;
  const nuevas = leer(entorno, 'SUPABASE_SECRET_KEYS');
  if (nuevas === null) return '';
  try {
    const claves = JSON.parse(nuevas) as Record<string, unknown>;
    const primera = Object.values(claves).find((clave) => typeof clave === 'string');
    return typeof primera === 'string' ? primera : '';
  } catch {
    return '';
  }
}

function bytesDeBase64(texto: string): Uint8Array<ArrayBuffer> | null {
  try {
    return Uint8Array.from(atob(texto), (letra) => letra.charCodeAt(0));
  } catch {
    return null;
  }
}

export function cuitDelCertificado(certificado: forge.pki.Certificate): string {
  const campo = certificado.subject.getField({ type: '2.5.4.5' }) as { value?: unknown } | null;
  const valor = typeof campo?.value === 'string' ? campo.value : '';
  const encontrado = /^CUIT\s*(\d{11})$/.exec(valor.trim());
  return encontrado?.[1] ?? '';
}

export function venceElCertificado(certificado: forge.pki.Certificate): string {
  return certificado.validity.notAfter.toISOString().slice(0, 10);
}

function certificadoDePrueba(entorno: Entorno): CertificadoParaFirmar | null {
  const pem = leer(entorno, 'ARCA_HOMOLOGACION_CERT');
  const clave = leer(entorno, 'ARCA_HOMOLOGACION_CLAVE');
  if (pem === null || clave === null) return null;
  try {
    const certificadoPem = atob(pem);
    const clavePem = atob(clave);
    const certificado = forge.pki.certificateFromPem(certificadoPem);
    forge.pki.privateKeyFromPem(clavePem);
    const cuit = cuitDelCertificado(certificado);
    if (cuit === '') return null;
    return {
      pem: certificadoPem,
      clavePem,
      cuit,
      vence: venceElCertificado(certificado),
      claveDelTicket: 'homologacion',
    };
  } catch {
    return null;
  }
}

export async function llaveDeProduccion(entorno: Entorno): Promise<CryptoKey | null> {
  if (entorno.get(BANDERA_DE_PRODUCCION) !== 'si') return null;
  const texto = entorno.get(LLAVE_DE_PRODUCCION);
  if (texto === undefined) return null;
  const bytes = bytesDeBase64(texto);
  if (bytes === null || bytes.length !== 32) return null;
  try {
    return await crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
  } catch {
    return null;
  }
}

export async function configuracionDelEntorno(entorno: Entorno): Promise<Configuracion> {
  return {
    supabaseUrl: leer(entorno, 'SUPABASE_URL') ?? '',
    claveDelServidor: claveDelServidor(entorno),
    secretoDelTrabajo: leer(entorno, 'FACTURAR_SECRETO'),
    pruebas: certificadoDePrueba(entorno),
    llaveDeProduccion: await llaveDeProduccion(entorno),
  };
}

export function estaPrendido(configuracion: Configuracion, ambiente: Ambiente): boolean {
  return ambiente === 'homologacion'
    ? configuracion.pruebas !== null
    : configuracion.llaveDeProduccion !== null;
}

export function ambientesPrendidos(configuracion: Configuracion): Ambiente[] {
  return (['homologacion', 'produccion'] as const).filter((ambiente) =>
    estaPrendido(configuracion, ambiente),
  );
}
