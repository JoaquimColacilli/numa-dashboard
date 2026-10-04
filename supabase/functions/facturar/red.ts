export type Ambiente = 'homologacion' | 'produccion';

export const SERVICIOS = {
  homologacion: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
  produccion: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
} as const satisfies Record<Ambiente, Record<'wsaa' | 'wsfe', string>>;

export const HOSTS: Readonly<Record<Ambiente, readonly string[]>> = {
  homologacion: ['wsaahomo.afip.gov.ar', 'wswhomo.afip.gov.ar'],
  produccion: ['wsaa.afip.gov.ar', 'servicios1.afip.gov.ar'],
};

export const TOPE_DE_ARCA_MS = 30_000;

export type Pedir = (url: string, init: RequestInit) => Promise<Response>;

export interface Contestacion {
  http: number;
  texto: string;
  ms: number;
}

export class FueraDeLaLista extends Error {
  override readonly name = 'FueraDeLaLista';
}

export class SinRespuesta extends Error {
  override readonly name = 'SinRespuesta';

  constructor(
    readonly http: number | null,
    readonly ms: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function exigirElHost(ambiente: Ambiente, url: string): void {
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    throw new FueraDeLaLista(`No es una dirección: ${url}`);
  }
  if (destino.protocol !== 'https:' || !HOSTS[ambiente].includes(destino.hostname)) {
    throw new FueraDeLaLista(`${destino.hostname} no es un host de ARCA para ${ambiente}.`);
  }
}

export async function pedirAArca(
  ambiente: Ambiente,
  url: string,
  accion: string,
  cuerpo: string,
  pedir: Pedir,
): Promise<Contestacion> {
  exigirElHost(ambiente, url);
  const desde = performance.now();
  const medido = () => Math.round(performance.now() - desde);
  let respuesta: Response;
  try {
    respuesta = await pedir(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: accion },
      body: cuerpo,
      signal: AbortSignal.timeout(TOPE_DE_ARCA_MS),
    });
  } catch (error) {
    throw new SinRespuesta(null, medido(), error instanceof Error ? error.name : 'sin respuesta');
  }
  let texto: string;
  try {
    texto = await respuesta.text();
  } catch (error) {
    throw new SinRespuesta(
      respuesta.status,
      medido(),
      error instanceof Error ? error.name : 'cortado',
    );
  }
  if (respuesta.status >= 500 && !/Envelope/.test(texto)) {
    throw new SinRespuesta(respuesta.status, medido(), `HTTP ${String(respuesta.status)}`);
  }
  return { http: respuesta.status, texto, ms: medido() };
}
