import type { EstadoDeLaFacturacion } from '@/shared/api';

export const GUIA_DEL_CERTIFICADO =
  'https://www.afip.gob.ar/ws/WSAA/wsaa_obtener_certificado_produccion.pdf';

export const GUIA_DE_LA_AUTORIZACION =
  'https://www.afip.gob.ar/ws/WSAA/wsaa_asociar_certificado_a_wsn_produccion.pdf';

export const ARCHIVO_DEL_PEDIDO = 'numa-produccion.csr';

export const CAPTURAS_DE_ARCA = [
  '01-ingresar',
  '02-certificados-digitales',
  '03-agregar-alias',
  '04-descargar',
  '05-elegir-el-servicio',
  '06-representante',
  '07-puntos-de-venta',
  '08-agregar-punto-de-venta',
] as const;

export type CapturaDeArca = (typeof CAPTURAS_DE_ARCA)[number];

export type ClaveDelPaso =
  | 'pedido'
  | 'ingresar'
  | 'certificados'
  | 'alias'
  | 'descargar'
  | 'subir'
  | 'autorizar'
  | 'representante'
  | 'puntosDeVenta'
  | 'puntoDeVenta'
  | 'conectar';

export interface PasoDelAsistente {
  numero: number;
  clave: ClaveDelPaso;
  enNuma: boolean;
  captura: CapturaDeArca | null;
  guia: string | null;
}

export const PASOS_DEL_ASISTENTE: readonly PasoDelAsistente[] = [
  { numero: 1, clave: 'pedido', enNuma: true, captura: null, guia: null },
  { numero: 2, clave: 'ingresar', enNuma: false, captura: '01-ingresar', guia: null },
  {
    numero: 3,
    clave: 'certificados',
    enNuma: false,
    captura: '02-certificados-digitales',
    guia: null,
  },
  { numero: 4, clave: 'alias', enNuma: false, captura: '03-agregar-alias', guia: null },
  {
    numero: 5,
    clave: 'descargar',
    enNuma: false,
    captura: '04-descargar',
    guia: GUIA_DEL_CERTIFICADO,
  },
  { numero: 6, clave: 'subir', enNuma: true, captura: null, guia: null },
  { numero: 7, clave: 'autorizar', enNuma: false, captura: '05-elegir-el-servicio', guia: null },
  {
    numero: 8,
    clave: 'representante',
    enNuma: false,
    captura: '06-representante',
    guia: GUIA_DE_LA_AUTORIZACION,
  },
  { numero: 9, clave: 'puntosDeVenta', enNuma: false, captura: '07-puntos-de-venta', guia: null },
  {
    numero: 10,
    clave: 'puntoDeVenta',
    enNuma: false,
    captura: '08-agregar-punto-de-venta',
    guia: null,
  },
  { numero: 11, clave: 'conectar', enNuma: true, captura: null, guia: null },
];

const PLEGADOS_AL_RENOVAR: readonly ClaveDelPaso[] = ['autorizar', 'representante'];

const QUE_NO_VAN_AL_RENOVAR: readonly ClaveDelPaso[] = ['puntosDeVenta', 'puntoDeVenta'];

export interface AvanceDelAsistente {
  renovando: boolean;
  enPrueba: boolean;
  prendido: boolean;
  pedidoBajado: boolean;
  certificadoSubido: boolean;
  primero: number;
  vence: string | null;
}

export function avanceDelAsistente(estado: EstadoDeLaFacturacion | null): AvanceDelAsistente {
  const renovando = estado?.conectada === true && estado.ambiente === 'produccion';
  const enPrueba = estado?.conectada === true && estado.ambiente === 'homologacion';
  const certificado = estado?.certificado?.estado ?? null;
  const activoParaVolver = certificado === 'activo' && !renovando;
  const certificadoSubido = certificado === 'subido' || activoParaVolver;
  const pedidoBajado = certificado === 'pedido' || certificadoSubido;
  const primero = certificadoSubido
    ? renovando || activoParaVolver
      ? 11
      : 7
    : pedidoBajado
      ? 2
      : 1;
  return {
    renovando,
    enPrueba,
    prendido: estado?.prendido ?? true,
    pedidoBajado,
    certificadoSubido,
    primero,
    vence: estado?.certificado?.vence ?? null,
  };
}

export function pasosALaVista(renovando: boolean): {
  enLaLista: PasoDelAsistente[];
  plegados: PasoDelAsistente[];
} {
  if (!renovando) return { enLaLista: [...PASOS_DEL_ASISTENTE], plegados: [] };
  return {
    enLaLista: PASOS_DEL_ASISTENTE.filter(
      (paso) =>
        !PLEGADOS_AL_RENOVAR.includes(paso.clave) && !QUE_NO_VAN_AL_RENOVAR.includes(paso.clave),
    ),
    plegados: PASOS_DEL_ASISTENTE.filter((paso) => PLEGADOS_AL_RENOVAR.includes(paso.clave)),
  };
}

export function puntoDeVentaLeido(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^[0-9]{1,5}$/.test(limpio)) return null;
  const numero = Number(limpio);
  return numero >= 1 && numero <= 99_998 ? numero : null;
}

const INICIO_DEL_PEM = '-----BEGIN CERTIFICATE-----';

function base64DeLosBytes(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

export async function certificadoParaSubir(archivo: Blob): Promise<string> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const texto = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return texto.includes(INICIO_DEL_PEM) ? texto : base64DeLosBytes(bytes);
}
