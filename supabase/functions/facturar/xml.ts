import { XMLParser } from 'fast-xml-parser';

export const TOPE_DE_LO_ANOTADO = 102_400;

const SIEMPRE_ARREGLOS = new Set([
  'Obs',
  'Err',
  'Evt',
  'FECAEDetResponse',
  'PtoVenta',
  'CondicionIvaReceptor',
]);

const lector = new XMLParser({
  removeNSPrefix: true,
  parseTagValue: false,
  ignoreAttributes: true,
  trimValues: true,
  isArray: (nombre) => SIEMPRE_ARREGLOS.has(nombre),
});

export type Nodo = Readonly<Record<string, unknown>>;

export function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function sobreDeWsfe(metodo: string, cuerpo: string): string {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/"><soap:Body><ar:${metodo}>${cuerpo}</ar:${metodo}></soap:Body></soap:Envelope>`;
}

export function sobreDelLogin(cms: string): string {
  return `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;
}

export function leerXml(texto: string): Nodo {
  try {
    const leido: unknown = lector.parse(texto);
    return typeof leido === 'object' && leido !== null ? (leido as Nodo) : {};
  } catch {
    return {};
  }
}

export function hijo(nodo: unknown, ...camino: string[]): unknown {
  let actual: unknown = nodo;
  for (const paso of camino) {
    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) return undefined;
    actual = (actual as Nodo)[paso];
  }
  return actual;
}

export function texto(nodo: unknown, ...camino: string[]): string | null {
  const valor = hijo(nodo, ...camino);
  return typeof valor === 'string' ? valor : null;
}

export function arreglo(nodo: unknown, ...camino: string[]): unknown[] {
  const valor = hijo(nodo, ...camino);
  if (valor === undefined || valor === null || valor === '') return [];
  return Array.isArray(valor) ? valor : [valor];
}

export function entero(nodo: unknown, ...camino: string[]): number | null {
  const valor = texto(nodo, ...camino);
  if (valor === null || !/^-?\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

export interface MensajeDeArca {
  codigo: number;
  mensaje: string;
}

export function mensajes(nodo: unknown, ...camino: string[]): MensajeDeArca[] {
  return arreglo(nodo, ...camino).flatMap((elemento) => {
    const codigo = entero(elemento, 'Code');
    return codigo === null ? [] : [{ codigo, mensaje: texto(elemento, 'Msg') ?? '' }];
  });
}

export function desescapar(valor: string): string {
  return valor
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

export function sinLosCuit(valor: string, cuits: readonly string[]): string {
  let limpio = valor;
  for (const cuit of cuits) {
    const digitos = cuit.replace(/\D/g, '');
    if (digitos.length !== 11) continue;
    const conGuiones = `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
    limpio = limpio.replaceAll(digitos, '•••••••••••').replaceAll(conGuiones, '••-••••••••-•');
  }
  return limpio;
}

export function tapar(xml: string, cuits: readonly string[]): string {
  const sinAuth = xml
    .replace(/<(\w+:)?Auth\b[^>]*>[\s\S]*?<\/(\w+:)?Auth>/gi, '')
    .replace(/<(\w+:)?Auth\b[^>]*\/>/gi, '')
    .replace(/<(\w+:)?(Cuit|Token|Sign|in0)\b[^>]*>[\s\S]*?<\/(\w+:)?\2>/gi, '')
    .replace(/<(\w+:)?(Cuit|Token|Sign|in0)\b[^>]*\/>/gi, '');
  return sinLosCuit(sinAuth, cuits).slice(0, TOPE_DE_LO_ANOTADO);
}
