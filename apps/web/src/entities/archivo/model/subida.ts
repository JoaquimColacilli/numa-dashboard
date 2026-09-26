import type { ImagenDecodificada } from '@/shared/lib';

import { rutaDeLaMiniatura, rutaDelArchivo, type TipoDeArchivo } from './archivos';
import {
  eleccionDelArchivo,
  LO_QUE_SE_SUBE_A_UN_TRABAJO,
  nombreParaGuardar,
  type LoQueSeSube,
} from './eleccion';
import type { ImagenPreparada } from './preparacion';

export class ArchivoRechazado extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'ArchivoRechazado';
  }
}

export interface DestinoDeLaSubida {
  loQueSeSube: LoQueSeSube;
  ruta: (id: string, tipo: TipoDeArchivo, miniatura: boolean) => string;
}

export function destinoDelTrabajo(householdId: string, proyectoId: string): DestinoDeLaSubida {
  return {
    loQueSeSube: LO_QUE_SE_SUBE_A_UN_TRABAJO,
    ruta: (id, tipo, miniatura) => {
      const ubicacion = { id, household_id: householdId, proyecto_id: proyectoId, tipo };
      return miniatura ? rutaDeLaMiniatura(ubicacion) : rutaDelArchivo(ubicacion);
    },
  };
}

export interface DependenciasDeLaSubida {
  subir: (ruta: string, contenido: Blob) => Promise<void>;
  decodificar: (archivo: Blob) => Promise<ImagenDecodificada>;
  preparar: (imagen: ImagenDecodificada) => Promise<ImagenPreparada>;
  nuevoId: () => string;
}

export interface ArchivoSubido {
  id: string;
  nombre: string;
  tipo: TipoDeArchivo;
  bytes: number;
  ancho: number | null;
  alto: number | null;
  original: number;
  subido: number;
}

export async function subirUnArchivo(
  archivo: File,
  destino: DestinoDeLaSubida,
  dependencias: DependenciasDeLaSubida,
): Promise<ArchivoSubido> {
  const eleccion = eleccionDelArchivo(archivo, destino.loQueSeSube);
  if (eleccion.clase === 'rechazado') throw new ArchivoRechazado(eleccion.motivo);

  const id = dependencias.nuevoId();
  const nombre = nombreParaGuardar(archivo.name);

  if (eleccion.clase === 'pdf') {
    const contenido =
      archivo.type === 'application/pdf'
        ? archivo
        : new Blob([archivo], { type: 'application/pdf' });
    await dependencias.subir(destino.ruta(id, 'application/pdf', false), contenido);
    return {
      id,
      nombre,
      tipo: 'application/pdf',
      bytes: contenido.size,
      ancho: null,
      alto: null,
      original: archivo.size,
      subido: contenido.size,
    };
  }

  const imagen = await dependencias.decodificar(archivo);
  try {
    const preparada = await dependencias.preparar(imagen);
    await dependencias.subir(destino.ruta(id, preparada.tipo, false), preparada.completa);
    await dependencias.subir(destino.ruta(id, preparada.tipo, true), preparada.miniatura);
    const subido = preparada.completa.size + preparada.miniatura.size;
    return {
      id,
      nombre,
      tipo: preparada.tipo,
      bytes: subido,
      ancho: preparada.ancho,
      alto: preparada.alto,
      original: archivo.size,
      subido,
    };
  } finally {
    imagen.liberar();
  }
}
