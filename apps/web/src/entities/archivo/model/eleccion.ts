import { mensajes } from '@/shared/idioma';

import { pesoLegible } from './archivos';

export const TIPOS_QUE_SE_ELIGEN = 'image/*,application/pdf,video/*';

export const TOPE_DE_UN_PDF_BYTES = 10 * 1024 * 1024;

export const LADO_MAXIMO = 2000;

export const LADO_DE_LA_MINIATURA = 480;

const LARGO_DEL_NOMBRE = 200;

export function sinSenalParaArchivos(): string {
  return mensajes().archivo.sinSenal;
}

export function losVideosNoEntran(): string {
  return mensajes().archivo.losVideosNoEntran;
}

export interface ArchivoElegido {
  name: string;
  type: string;
  size: number;
}

export type EleccionDelArchivo =
  { clase: 'imagen' } | { clase: 'pdf' } | { clase: 'rechazado'; motivo: string };

export interface LoQueSeSube {
  acepta: string;
  conPdf: boolean;
  videos: string;
  queSeSube: string;
}

export const LO_QUE_SE_SUBE_A_UN_TRABAJO: LoQueSeSube = {
  acepta: TIPOS_QUE_SE_ELIGEN,
  conPdf: true,
  get videos() {
    return losVideosNoEntran();
  },
  get queSeSube() {
    return mensajes().archivo.queSeSubeAUnTrabajo;
  },
};

const EXTENSIONES_DE_VIDEO = /\.(mp4|mov|m4v|avi|mkv|3gp|webm|wmv)$/i;
const EXTENSIONES_DE_IMAGEN = /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i;

export function eleccionDelArchivo(
  archivo: ArchivoElegido,
  loQueSeSube: LoQueSeSube = LO_QUE_SE_SUBE_A_UN_TRABAJO,
): EleccionDelArchivo {
  const textos = mensajes().archivo;
  const tipo = archivo.type.toLowerCase();
  const nombre = archivo.name.trim();
  const noEntra: EleccionDelArchivo = {
    clase: 'rechazado',
    motivo: textos.noSePuedeSubir(nombre, loQueSeSube.queSeSube),
  };

  if (tipo.startsWith('video/') || EXTENSIONES_DE_VIDEO.test(nombre)) {
    return { clase: 'rechazado', motivo: loQueSeSube.videos };
  }
  if (tipo === 'application/pdf' || /\.pdf$/i.test(nombre)) {
    if (!loQueSeSube.conPdf) return noEntra;
    if (archivo.size > TOPE_DE_UN_PDF_BYTES) {
      return {
        clase: 'rechazado',
        motivo: textos.pdfMuyPesado(nombre, pesoLegible(archivo.size)),
      };
    }
    return { clase: 'pdf' };
  }
  if (tipo.startsWith('image/') || EXTENSIONES_DE_IMAGEN.test(nombre)) return { clase: 'imagen' };
  return noEntra;
}

export interface Medidas {
  ancho: number;
  alto: number;
}

export function medidasAchicadas(ancho: number, alto: number, ladoMaximo: number): Medidas {
  const escala = Math.min(1, ladoMaximo / Math.max(ancho, alto));
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

export function nombreParaGuardar(nombre: string): string {
  const limpio = nombre.trim();
  if (limpio === '') return mensajes().archivo.sinNombre;
  return limpio.length > LARGO_DEL_NOMBRE ? limpio.slice(0, LARGO_DEL_NOMBRE) : limpio;
}
