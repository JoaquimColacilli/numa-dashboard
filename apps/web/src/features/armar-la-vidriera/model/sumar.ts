import {
  ArchivoRechazado,
  esImagen,
  rutaDeLaMiniatura,
  rutaDelArchivo,
  rutaEnLaVidriera,
  sinSenalParaArchivos,
  subirUnArchivo,
  type Archivo,
  type DependenciasDeLaSubida,
  type DestinoDeLaSubida,
  type LoQueSeSube,
} from '@/entities/archivo';
import {
  esFalloDeRed,
  filaPorId,
  filasDe,
  mensajeDeAcceso,
  type FotoDeLaVidrieraNueva,
  type Replica,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { ImagenIlegible } from '@/shared/lib';

function textos() {
  return mensajes().armarLaVidriera;
}

export function losVideosNoVanALaVidriera(): string {
  return textos().losVideosNoVan;
}

export const LO_QUE_SE_SUBE_A_LA_VIDRIERA: LoQueSeSube = {
  acepta: 'image/*,video/*',
  conPdf: false,
  get videos() {
    return losVideosNoVanALaVidriera();
  },
  get queSeSube() {
    return textos().queSeSube;
  },
};

export function destinoDeLaVidriera(householdId: string): DestinoDeLaSubida {
  return {
    loQueSeSube: LO_QUE_SE_SUBE_A_LA_VIDRIERA,
    ruta: (id, tipo, miniatura) =>
      rutaEnLaVidriera({ id, household_id: householdId, tipo }, miniatura),
  };
}

export type ImagenDeUnTrabajo = Archivo & { ancho: number; alto: number };

function esImagenConMedidas(archivo: Archivo): archivo is ImagenDeUnTrabajo {
  return esImagen(archivo) && archivo.ancho !== null && archivo.alto !== null;
}

export interface FotoDeUnTrabajo {
  archivo: ImagenDeUnTrabajo;
  compartida: boolean;
  yaEsta: boolean;
}

export interface TrabajoConFotos {
  id: string;
  titulo: string;
  fotos: FotoDeUnTrabajo[];
}

function masNuevaPrimero(una: Archivo, otra: Archivo): number {
  if (una.created_at !== otra.created_at) return una.created_at < otra.created_at ? 1 : -1;
  return una.id < otra.id ? 1 : una.id > otra.id ? -1 : 0;
}

export function fotosDeLosTrabajos(replica: Replica): TrabajoConFotos[] {
  const enLaVidriera = new Set(
    filasDe(replica, 'fotos_de_la_vidriera').flatMap((foto) =>
      foto.archivo_de_origen === null ? [] : [foto.archivo_de_origen],
    ),
  );
  const trabajos = new Map<string, TrabajoConFotos>();
  const imagenes = filasDe(replica, 'archivos').filter(esImagenConMedidas).sort(masNuevaPrimero);

  for (const archivo of imagenes) {
    const proyecto = filaPorId(replica, 'proyectos', archivo.proyecto_id);
    if (!proyecto) continue;
    let trabajo = trabajos.get(proyecto.id);
    if (!trabajo) {
      trabajo = { id: proyecto.id, titulo: proyecto.titulo, fotos: [] };
      trabajos.set(proyecto.id, trabajo);
    }
    trabajo.fotos.push({
      archivo,
      compartida: archivo.visible_para_cliente,
      yaEsta: enLaVidriera.has(archivo.id),
    });
  }
  return [...trabajos.values()];
}

export type DisponibilidadDeLaFoto = 'elegible' | 'ya-esta' | 'no-entra';

export function disponibilidadDeLaFoto(
  foto: FotoDeUnTrabajo,
  elegidas: readonly string[],
  libres: number,
): DisponibilidadDeLaFoto {
  if (foto.yaEsta) return 'ya-esta';
  if (elegidas.includes(foto.archivo.id)) return 'elegible';
  return elegidas.length >= libres ? 'no-entra' : 'elegible';
}

export function conLaFotoElegida(
  elegidas: readonly string[],
  foto: FotoDeUnTrabajo,
  libres: number,
): readonly string[] {
  const id = foto.archivo.id;
  if (elegidas.includes(id)) return elegidas.filter((una) => una !== id);
  if (disponibilidadDeLaFoto(foto, elegidas, libres) !== 'elegible') return elegidas;
  return [...elegidas, id];
}

export function textoDelBotonDeSumar(cantidad: number): string {
  return textos().botonDeSumar(cantidad);
}

export function avisoSinCompartir(cantidad: number): string {
  return textos().sinCompartir(cantidad);
}

export function avisoDelExceso(elegidas: number, libres: number): string | null {
  if (elegidas <= libres) return null;
  return textos().exceso(elegidas, libres);
}

export function avisoDelCorte(
  hechas: number,
  total: number,
  verbo: 'sumaron' | 'subieron',
): string {
  return verbo === 'sumaron'
    ? textos().corteAlSumar(hechas, total)
    : textos().corteAlSubir(hechas, total);
}

export interface Avance {
  actual: number;
  total: number;
}

export interface ResultadoDeSumar {
  hechas: number;
  problemas: string[];
}

export interface DependenciasDelSumado {
  copiar: (desde: string, hacia: string) => Promise<void>;
  nuevoId: () => string;
  sumar: (nueva: FotoDeLaVidrieraNueva) => void;
}

export async function sumarDeLosTrabajos(
  archivos: readonly ImagenDeUnTrabajo[],
  householdId: string,
  ordenInicial: number,
  dependencias: DependenciasDelSumado,
  alAvanzar: (avance: Avance) => void,
): Promise<ResultadoDeSumar> {
  const problemas: string[] = [];
  let hechas = 0;
  for (const [indice, archivo] of archivos.entries()) {
    alAvanzar({ actual: indice + 1, total: archivos.length });
    const id = dependencias.nuevoId();
    const destino = { id, household_id: householdId, tipo: archivo.tipo };
    try {
      await dependencias.copiar(rutaDelArchivo(archivo), rutaEnLaVidriera(destino));
      await dependencias.copiar(rutaDeLaMiniatura(archivo), rutaEnLaVidriera(destino, true));
    } catch (fallo) {
      if (esFalloDeRed(fallo)) {
        return { hechas, problemas: [avisoDelCorte(hechas, archivos.length, 'sumaron')] };
      }
      problemas.push(textos().noSePudoCopiar(mensajeDeAcceso(fallo)));
      continue;
    }
    dependencias.sumar({
      id,
      orden: ordenInicial + hechas,
      tipo: archivo.tipo,
      bytes: archivo.bytes,
      ancho: archivo.ancho,
      alto: archivo.alto,
      archivo_de_origen: archivo.id,
    });
    hechas += 1;
  }
  return { hechas, problemas };
}

function motivoDelFallo(nombre: string, fallo: unknown): string {
  const deArchivos = mensajes().archivo;
  if (fallo instanceof ArchivoRechazado) return fallo.message;
  if (fallo instanceof ImagenIlegible) return deArchivos.conElNombre(nombre, fallo.message);
  if (esFalloDeRed(fallo)) return sinSenalParaArchivos();
  return deArchivos.noSeSubio(nombre, mensajeDeAcceso(fallo));
}

export async function subirALaVidriera(
  elegidos: readonly File[],
  householdId: string,
  ordenInicial: number,
  libres: number,
  dependencias: DependenciasDeLaSubida & { sumar: (nueva: FotoDeLaVidrieraNueva) => void },
  alAvanzar: (avance: Avance) => void,
): Promise<ResultadoDeSumar> {
  const exceso = avisoDelExceso(elegidos.length, libres);
  const problemas = exceso === null ? [] : [exceso];
  const aSubir = elegidos.slice(0, Math.max(0, libres));
  let hechas = 0;

  for (const [indice, elegido] of aSubir.entries()) {
    alAvanzar({ actual: indice + 1, total: aSubir.length });
    try {
      const subido = await subirUnArchivo(elegido, destinoDeLaVidriera(householdId), dependencias);
      if (subido.tipo === 'application/pdf') continue;
      dependencias.sumar({
        id: subido.id,
        orden: ordenInicial + hechas,
        tipo: subido.tipo,
        bytes: subido.bytes,
        ancho: subido.ancho,
        alto: subido.alto,
        archivo_de_origen: null,
      });
      hechas += 1;
    } catch (fallo) {
      if (esFalloDeRed(fallo)) {
        problemas.push(avisoDelCorte(hechas, aSubir.length, 'subieron'));
        break;
      }
      const motivo = motivoDelFallo(elegido.name, fallo);
      if (!problemas.includes(motivo)) problemas.push(motivo);
    }
  }
  return { hechas, problemas };
}
