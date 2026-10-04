import {
  CODIGO_DE_ARCA,
  fechaDeArca,
  fechaParaArca,
  importeParaArca,
  type Money,
  type TipoDeComprobante,
} from '@maun/domain';

import type { Intercambio } from './base.ts';
import {
  pedirAArca,
  SERVICIOS,
  SinRespuesta,
  type Ambiente,
  type Contestacion,
  type Pedir,
} from './red.ts';
import type { Credencial } from './wsaa.ts';
import {
  arreglo,
  entero,
  escapar,
  hijo,
  leerXml,
  mensajes,
  sobreDeWsfe,
  tapar,
  texto,
  type MensajeDeArca,
} from './xml.ts';

export type Hablar = (metodo: string, cuerpo: string) => Promise<Contestacion>;

export const ERRORES_DEL_TICKET = [600, 601] as const;

export const NO_EXISTE = 602;

export const NUMERO_QUE_NO_SIGUE = 10016;

export interface Charla {
  ambiente: Ambiente;
  pedir: Pedir;
  anotar: (intercambio: Intercambio) => Promise<void>;
  householdId: string | null;
  comprobanteId: string | null;
  cuits: readonly string[];
}

export function conversacion(charla: Charla): Hablar {
  return async (metodo, cuerpo) => {
    const xml = sobreDeWsfe(metodo, cuerpo);
    const base = {
      householdId: charla.householdId,
      comprobanteId: charla.comprobanteId,
      ambiente: charla.ambiente,
      metodo,
      pedido: tapar(xml, charla.cuits),
    };
    try {
      const contestacion = await pedirAArca(
        charla.ambiente,
        SERVICIOS[charla.ambiente].wsfe,
        `"http://ar.gov.afip.dif.FEV1/${metodo}"`,
        xml,
        charla.pedir,
      );
      await charla.anotar({
        ...base,
        httpEstado: contestacion.http,
        duracionMs: contestacion.ms,
        respuesta: tapar(contestacion.texto, charla.cuits),
        error: null,
      });
      return contestacion;
    } catch (error) {
      if (error instanceof SinRespuesta) {
        await charla.anotar({
          ...base,
          httpEstado: error.http,
          duracionMs: error.ms,
          respuesta: null,
          error: error.message,
        });
      }
      throw error;
    }
  };
}

function auth(credencial: Credencial): string {
  return `<ar:Auth><ar:Token>${escapar(credencial.token)}</ar:Token><ar:Sign>${escapar(credencial.firma)}</ar:Sign><ar:Cuit>${credencial.cuit}</ar:Cuit></ar:Auth>`;
}

function resultado(contestacion: Contestacion, metodo: string): unknown {
  return hijo(
    leerXml(contestacion.texto),
    'Envelope',
    'Body',
    `${metodo}Response`,
    `${metodo}Result`,
  );
}

export function delTicket(errores: readonly MensajeDeArca[]): boolean {
  return errores.some((error) => (ERRORES_DEL_TICKET as readonly number[]).includes(error.codigo));
}

export async function servidorAndando(hablar: Hablar): Promise<boolean> {
  const respuesta = resultado(await hablar('FEDummy', ''), 'FEDummy');
  return ['AppServer', 'DbServer', 'AuthServer'].every(
    (servidor) => texto(respuesta, servidor) === 'OK',
  );
}

export type Ultimo = { numero: number } | { errores: MensajeDeArca[] };

export async function ultimoAutorizado(
  hablar: Hablar,
  credencial: Credencial,
  puntoDeVenta: number,
  tipo: TipoDeComprobante,
): Promise<Ultimo> {
  const respuesta = resultado(
    await hablar(
      'FECompUltimoAutorizado',
      `${auth(credencial)}<ar:PtoVta>${String(puntoDeVenta)}</ar:PtoVta><ar:CbteTipo>${String(CODIGO_DE_ARCA[tipo])}</ar:CbteTipo>`,
    ),
    'FECompUltimoAutorizado',
  );
  const errores = mensajes(respuesta, 'Errors', 'Err');
  const numero = entero(respuesta, 'CbteNro');
  return errores.length === 0 && numero !== null && numero >= 0 ? { numero } : { errores };
}

export interface ComprobanteParaArca {
  tipo: TipoDeComprobante;
  puntoDeVenta: number;
  numero: number;
  fecha: string;
  concepto: number;
  importe: Money;
  docTipo: number;
  docNro: string;
  condicionIva: number;
  asociado: { puntoDeVenta: number; numero: number; fecha: string } | null;
}

export function detalleDelPedido(credencial: Credencial, comprobante: ComprobanteParaArca): string {
  const fecha = fechaParaArca(comprobante.fecha);
  const importe = importeParaArca(comprobante.importe);
  const servicios =
    comprobante.concepto === 2 || comprobante.concepto === 3
      ? `<ar:FchServDesde>${fecha}</ar:FchServDesde><ar:FchServHasta>${fecha}</ar:FchServHasta><ar:FchVtoPago>${fecha}</ar:FchVtoPago>`
      : '';
  const asociado =
    comprobante.asociado === null
      ? ''
      : `<ar:CbtesAsoc><ar:CbteAsoc><ar:Tipo>${String(CODIGO_DE_ARCA.factura_c)}</ar:Tipo><ar:PtoVta>${String(comprobante.asociado.puntoDeVenta)}</ar:PtoVta><ar:Nro>${String(comprobante.asociado.numero)}</ar:Nro><ar:Cuit>${credencial.cuit}</ar:Cuit><ar:CbteFch>${fechaParaArca(comprobante.asociado.fecha)}</ar:CbteFch></ar:CbteAsoc></ar:CbtesAsoc>`;
  return (
    `${auth(credencial)}<ar:FeCAEReq><ar:FeCabReq><ar:CantReg>1</ar:CantReg><ar:PtoVta>${String(comprobante.puntoDeVenta)}</ar:PtoVta><ar:CbteTipo>${String(CODIGO_DE_ARCA[comprobante.tipo])}</ar:CbteTipo></ar:FeCabReq>` +
    `<ar:FeDetReq><ar:FECAEDetRequest><ar:Concepto>${String(comprobante.concepto)}</ar:Concepto><ar:DocTipo>${String(comprobante.docTipo)}</ar:DocTipo><ar:DocNro>${comprobante.docNro}</ar:DocNro>` +
    `<ar:CbteDesde>${String(comprobante.numero)}</ar:CbteDesde><ar:CbteHasta>${String(comprobante.numero)}</ar:CbteHasta><ar:CbteFch>${fecha}</ar:CbteFch>` +
    `<ar:ImpTotal>${importe}</ar:ImpTotal><ar:ImpTotConc>0</ar:ImpTotConc><ar:ImpNeto>${importe}</ar:ImpNeto><ar:ImpOpEx>0</ar:ImpOpEx><ar:ImpTrib>0</ar:ImpTrib><ar:ImpIVA>0</ar:ImpIVA>` +
    `${servicios}<ar:MonId>PES</ar:MonId><ar:MonCotiz>1</ar:MonCotiz><ar:CondicionIVAReceptorId>${String(comprobante.condicionIva)}</ar:CondicionIVAReceptorId>${asociado}` +
    `</ar:FECAEDetRequest></ar:FeDetReq></ar:FeCAEReq>`
  );
}

export type RespuestaDelCae =
  | { resultado: 'A'; cae: string; caeVence: string; fecha: string; observaciones: MensajeDeArca[] }
  | { resultado: 'R'; errores: MensajeDeArca[]; observaciones: MensajeDeArca[] }
  | { resultado: null; errores: MensajeDeArca[] };

function fechaLeida(valor: string | null): string | null {
  if (valor === null) return null;
  try {
    return fechaDeArca(valor);
  } catch {
    return null;
  }
}

export function leerElCae(
  contestacion: Contestacion,
  comprobante: ComprobanteParaArca,
): RespuestaDelCae {
  const respuesta = resultado(contestacion, 'FECAESolicitar');
  const errores = mensajes(respuesta, 'Errors', 'Err');
  const detalle = arreglo(respuesta, 'FeDetResp', 'FECAEDetResponse')[0];
  const observaciones = mensajes(detalle, 'Observaciones', 'Obs');
  const estado = texto(detalle, 'Resultado');
  const cae = texto(detalle, 'CAE') ?? '';
  const caeVence = fechaLeida(texto(detalle, 'CAEFchVto'));
  if (estado === 'A' && /^\d{14}$/.test(cae) && caeVence !== null) {
    return {
      resultado: 'A',
      cae,
      caeVence,
      fecha: fechaLeida(texto(detalle, 'CbteFch')) ?? comprobante.fecha,
      observaciones,
    };
  }
  if (estado === 'R') return { resultado: 'R', errores, observaciones };
  return { resultado: null, errores };
}

export async function pedirElCae(
  hablar: Hablar,
  credencial: Credencial,
  comprobante: ComprobanteParaArca,
): Promise<RespuestaDelCae> {
  return leerElCae(
    await hablar('FECAESolicitar', detalleDelPedido(credencial, comprobante)),
    comprobante,
  );
}

export interface ComprobanteEnArca {
  tipo: number | null;
  puntoDeVenta: number | null;
  numero: number | null;
  fecha: string | null;
  importe: string;
  docTipo: number | null;
  docNro: string;
  cae: string;
  caeVence: string | null;
}

export type Consulta =
  | { existe: true; comprobante: ComprobanteEnArca }
  | { existe: false }
  | { errores: MensajeDeArca[] };

export async function consultar(
  hablar: Hablar,
  credencial: Credencial,
  tipo: TipoDeComprobante,
  puntoDeVenta: number,
  numero: number,
): Promise<Consulta> {
  const respuesta = resultado(
    await hablar(
      'FECompConsultar',
      `${auth(credencial)}<ar:FeCompConsReq><ar:CbteTipo>${String(CODIGO_DE_ARCA[tipo])}</ar:CbteTipo><ar:CbteNro>${String(numero)}</ar:CbteNro><ar:PtoVta>${String(puntoDeVenta)}</ar:PtoVta></ar:FeCompConsReq>`,
    ),
    'FECompConsultar',
  );
  const errores = mensajes(respuesta, 'Errors', 'Err');
  if (errores.some((error) => error.codigo === NO_EXISTE)) return { existe: false };
  const encontrado = hijo(respuesta, 'ResultGet');
  if (errores.length > 0 || encontrado === undefined) return { errores };
  return {
    existe: true,
    comprobante: {
      tipo: entero(encontrado, 'CbteTipo'),
      puntoDeVenta: entero(encontrado, 'PtoVta'),
      numero: entero(encontrado, 'CbteDesde'),
      fecha: fechaLeida(texto(encontrado, 'CbteFch')),
      importe: texto(encontrado, 'ImpTotal') ?? '',
      docTipo: entero(encontrado, 'DocTipo'),
      docNro: texto(encontrado, 'DocNro') ?? '',
      cae: texto(encontrado, 'CodAutorizacion') ?? '',
      caeVence: fechaLeida(texto(encontrado, 'FchVto')),
    },
  };
}

export function centavosDeArca(importe: string): number | null {
  const encontrado = /^(\d+)(?:\.(\d{1,2}))?$/.exec(importe.trim());
  if (encontrado === null) return null;
  return Number(encontrado[1]) * 100 + Number((encontrado[2] ?? '').padEnd(2, '0'));
}

export function coincide(
  enArca: ComprobanteEnArca,
  comprobante: Pick<
    ComprobanteParaArca,
    'tipo' | 'puntoDeVenta' | 'numero' | 'importe' | 'docTipo' | 'docNro'
  >,
): boolean {
  return (
    enArca.tipo === CODIGO_DE_ARCA[comprobante.tipo] &&
    enArca.puntoDeVenta === comprobante.puntoDeVenta &&
    enArca.numero === comprobante.numero &&
    centavosDeArca(enArca.importe) === comprobante.importe &&
    enArca.docTipo === comprobante.docTipo &&
    enArca.docNro.replace(/^0+(?=\d)/, '') === comprobante.docNro.replace(/^0+(?=\d)/, '') &&
    /^\d{14}$/.test(enArca.cae) &&
    enArca.caeVence !== null &&
    enArca.fecha !== null
  );
}

export interface PuntoDeVentaEnArca {
  numero: number;
  emisionTipo: string;
  bloqueado: boolean;
  deBaja: boolean;
}

export type PuntosDeVenta = { puntos: PuntoDeVentaEnArca[] } | { errores: MensajeDeArca[] };

export async function puntosDeVenta(
  hablar: Hablar,
  credencial: Credencial,
): Promise<PuntosDeVenta> {
  const respuesta = resultado(
    await hablar('FEParamGetPtosVenta', auth(credencial)),
    'FEParamGetPtosVenta',
  );
  const errores = mensajes(respuesta, 'Errors', 'Err');
  const puntos = arreglo(respuesta, 'ResultGet', 'PtoVenta').flatMap((punto) => {
    const numero = entero(punto, 'Nro');
    if (numero === null) return [];
    const baja = texto(punto, 'FchBaja') ?? '';
    return [
      {
        numero,
        emisionTipo: texto(punto, 'EmisionTipo') ?? '',
        bloqueado: texto(punto, 'Bloqueado') !== 'N',
        deBaja: baja !== '' && baja !== 'NULL',
      },
    ];
  });
  if (errores.some((error) => error.codigo === NO_EXISTE)) return { puntos: [] };
  return errores.length > 0 ? { errores } : { puntos };
}

export type CondicionesDelReceptor =
  { condiciones: { id: number; descripcion: string }[] } | { errores: MensajeDeArca[] };

export async function condicionesDelReceptor(
  hablar: Hablar,
  credencial: Credencial,
): Promise<CondicionesDelReceptor> {
  const respuesta = resultado(
    await hablar(
      'FEParamGetCondicionIvaReceptor',
      `${auth(credencial)}<ar:ClaseCmp>C</ar:ClaseCmp>`,
    ),
    'FEParamGetCondicionIvaReceptor',
  );
  const errores = mensajes(respuesta, 'Errors', 'Err');
  if (errores.length > 0) return { errores };
  return {
    condiciones: arreglo(respuesta, 'ResultGet', 'CondicionIvaReceptor').flatMap((condicion) => {
      const id = entero(condicion, 'Id');
      return id === null ? [] : [{ id, descripcion: texto(condicion, 'Desc') ?? '' }];
    }),
  };
}
